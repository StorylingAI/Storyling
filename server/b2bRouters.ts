import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  organizations,
  classes,
  classMembers,
  assignments,
  assignmentSubmissions,
  users,
  enrollmentInvitations,
  quizAttempts,
  wordMastery,
} from "../drizzle/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import { parseEnrollmentCSV, generateEnrollmentCSVTemplate } from "./enrollmentCsvParser";
import { randomBytes } from "crypto";
import { notifyOwner } from "./_core/notification";

// Teacher-only procedure
const teacherProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "teacher" && ctx.user.role !== "org_admin" && ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Teacher access required" });
  }
  return next({ ctx });
});

// Organization admin procedure
const orgAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "org_admin" && ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Organization admin access required" });
  }
  return next({ ctx });
});

export const organizationRouter = router({
  // Create organization (admin only)
  create: orgAdminProcedure
    .input(
      z.object({
        name: z.string(),
        type: z.enum(["school", "university", "corporate", "other"]),
        contactEmail: z.string().email().optional(),
        contactName: z.string().optional(),
        maxStudents: z.number().default(100),
        maxTeachers: z.number().default(10),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [org] = await db.insert(organizations).values(input);
      return { organizationId: org.insertId };
    }),

  // Get organization details
  getById: teacherProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, input.organizationId));
      return org;
    }),

  // List all organizations (admin only)
  list: orgAdminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    return await db.select().from(organizations);
  }),
});

export const classRouter = router({
  // Create new class
  create: teacherProcedure
    .input(
      z.object({
        organizationId: z.number().optional(),
        name: z.string(),
        description: z.string().optional(),
        targetLanguage: z.string(),
        proficiencyLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      let organizationId = input.organizationId;
      
      // If no organization provided, create a default one for this teacher
      if (!organizationId) {
        const [org] = await db.insert(organizations).values({
          name: `${ctx.user.name}'s Classes`,
          type: "other",
          contactEmail: ctx.user.email || "",
        });
        organizationId = org.insertId;
      }
      
      const [result] = await db.insert(classes).values({
        ...input,
        organizationId,
        teacherId: ctx.user.id,
      });
      return { classId: result.insertId };
    }),

  // Get all classes for current teacher
  getMyClasses: teacherProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    
    const classList = await db
      .select()
      .from(classes)
      .where(eq(classes.teacherId, ctx.user.id));

    // Get student counts for each class
    const classesWithCounts = await Promise.all(
      classList.map(async (classItem) => {
        const members = await db
          .select()
          .from(classMembers)
          .where(eq(classMembers.classId, classItem.id));
        
        return {
          ...classItem,
          studentCount: members.length,
        };
      })
    );

    return classesWithCounts;
  }),

  // Get class details with members
  getById: teacherProcedure
    .input(z.object({ classId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      // Get class details
      const [classData] = await db
        .select()
        .from(classes)
        .where(eq(classes.id, input.classId));

      if (!classData) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Class not found" });
      }

      // Verify teacher owns this class
      if (classData.teacherId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Get class members
      const members = await db
        .select({
          id: classMembers.id,
          userId: classMembers.userId,
          enrolledAt: classMembers.enrolledAt,
          status: classMembers.status,
          userName: users.name,
          userEmail: users.email,
        })
        .from(classMembers)
        .leftJoin(users, eq(classMembers.userId, users.id))
        .where(eq(classMembers.classId, input.classId));

      return { ...classData, members };
    }),

  // Add students to class
  addStudents: teacherProcedure
    .input(
      z.object({
        classId: z.number(),
        userIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify teacher owns this class
      const [classData] = await db
        .select()
        .from(classes)
        .where(eq(classes.id, input.classId));

      if (!classData || (classData.teacherId !== ctx.user.id && ctx.user.role !== "admin")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Add students
      const values = input.userIds.map((userId) => ({
        classId: input.classId,
        userId,
      }));

      await db.insert(classMembers).values(values);
      return { success: true };
    }),

  // Remove student from class
  removeStudent: teacherProcedure
    .input(
      z.object({
        classId: z.number(),
        userId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify teacher owns this class
      const [classData] = await db
        .select()
        .from(classes)
        .where(eq(classes.id, input.classId));

      if (!classData || (classData.teacherId !== ctx.user.id && ctx.user.role !== "admin")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await db
        .update(classMembers)
        .set({ status: "removed" })
        .where(
          and(
            eq(classMembers.classId, input.classId),
            eq(classMembers.userId, input.userId)
          )
        );

      return { success: true };
    }),

  // Archive class
  archive: teacherProcedure
    .input(z.object({ classId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify teacher owns this class
      const [classData] = await db
        .select()
        .from(classes)
        .where(eq(classes.id, input.classId));

      if (!classData || (classData.teacherId !== ctx.user.id && ctx.user.role !== "admin")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await db
        .update(classes)
        .set({ isArchived: true })
        .where(eq(classes.id, input.classId));

      return { success: true };
    }),
});

export const analyticsRouter = router({
  // Get class analytics
  getClassAnalytics: teacherProcedure
    .input(z.object({ classId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify teacher owns this class
      const [classData] = await db
        .select()
        .from(classes)
        .where(eq(classes.id, input.classId));

      if (!classData) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Class not found" });
      }

      if (classData.teacherId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Get class members
      const members = await db
        .select()
        .from(classMembers)
        .where(eq(classMembers.classId, input.classId));

      const memberIds = members.map((m) => m.userId);

      if (memberIds.length === 0) {
        return {
          classId: input.classId,
          studentCount: 0,
          averageQuizScore: 0,
          totalQuizAttempts: 0,
          averageVocabularyMastery: 0,
          totalWordsLearned: 0,
          studentPerformance: [],
          quizScoresTrend: [],
          vocabularyProgress: [],
        };
      }

      // Get quiz attempts for all students in class
      const allQuizAttempts = await db
        .select()
        .from(quizAttempts)
        .where(sql`${quizAttempts.userId} IN (${sql.join(memberIds, sql`, `)})`)
        .orderBy(quizAttempts.completedAt);

      // Get word mastery for all students
      const allWordMastery = await db
        .select()
        .from(wordMastery)
        .where(sql`${wordMastery.userId} IN (${sql.join(memberIds, sql`, `)})`);

      // Calculate per-student metrics
      const studentPerformance = await Promise.all(
        members.map(async (member) => {
          const studentQuizzes = allQuizAttempts.filter((q: any) => q.userId === member.userId);
          const studentWords = allWordMastery.filter((w: any) => w.userId === member.userId);

          const avgScore =
            studentQuizzes.length > 0
              ? studentQuizzes.reduce((sum: number, q: any) => sum + q.score, 0) / studentQuizzes.length
              : 0;

          const masteredWords = studentWords.filter((w: any) => w.repetitions >= 3).length;
          const totalWords = studentWords.length;

          const [user] = await db.select().from(users).where(eq(users.id, member.userId));

          return {
            userId: member.userId,
            userName: user?.name || "Unknown",
            userEmail: user?.email || "",
            averageQuizScore: Math.round(avgScore),
            quizAttempts: studentQuizzes.length,
            masteredWords,
            totalWords,
            masteryPercentage: totalWords > 0 ? Math.round((masteredWords / totalWords) * 100) : 0,
            lastActive: studentQuizzes.length > 0 ? studentQuizzes[studentQuizzes.length - 1].completedAt : member.enrolledAt,
          };
        })
      );

      // Calculate class-wide metrics
      const totalQuizAttempts = allQuizAttempts.length;
      const averageQuizScore =
        totalQuizAttempts > 0
          ? Math.round(allQuizAttempts.reduce((sum: number, q: any) => sum + q.score, 0) / totalQuizAttempts)
          : 0;

      const totalWordsLearned = allWordMastery.length;
      const masteredWordsCount = allWordMastery.filter((w: any) => w.repetitions >= 3).length;
      const averageVocabularyMastery =
        totalWordsLearned > 0 ? Math.round((masteredWordsCount / totalWordsLearned) * 100) : 0;

      // Quiz scores trend (last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

      const recentQuizzes = allQuizAttempts.filter((q: any) => new Date(q.completedAt) >= thirtyDaysAgo);
      const quizScoresTrend = recentQuizzes.map((q: any) => ({
        date: q.completedAt,
        score: q.score,
      }));

      // Vocabulary progress (words learned over time)
      const vocabularyProgress = allWordMastery
        .filter((w: any) => new Date(w.createdAt) >= thirtyDaysAgo)
        .map((w: any) => ({
          date: w.createdAt,
          word: w.word,
          repetitions: w.repetitions,
        }));

      return {
        classId: input.classId,
        studentCount: members.length,
        averageQuizScore,
        totalQuizAttempts,
        averageVocabularyMastery,
        totalWordsLearned,
        studentPerformance,
        quizScoresTrend,
        vocabularyProgress,
      };
    }),
});

export const enrollmentRouter = router({
  // Bulk enroll students via CSV
  bulkEnroll: teacherProcedure
    .input(
      z.object({
        classId: z.number(),
        csvContent: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify teacher owns this class
      const [classData] = await db
        .select()
        .from(classes)
        .where(eq(classes.id, input.classId));

      if (!classData || (classData.teacherId !== ctx.user.id && ctx.user.role !== "admin")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Parse CSV
      const parseResult = parseEnrollmentCSV(input.csvContent);
      if (!parseResult.success || !parseResult.data) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: parseResult.errors?.join("; ") || "Invalid CSV format",
        });
      }

      const students = parseResult.data;
      const invitations: Array<{
        classId: number;
        teacherId: number;
        email: string;
        name: string;
        token: string;
        expiresAt: Date;
      }> = [];

      // Create invitations
      for (const student of students) {
        const token = randomBytes(32).toString("hex");
        const expiresAt = new Date();
        expiresAt.setDate(expiresAt.getDate() + 7); // 7 days expiry

        invitations.push({
          classId: input.classId,
          teacherId: ctx.user.id,
          email: student.email,
          name: student.name,
          token,
          expiresAt,
        });
      }

      // Insert invitations
      await db.insert(enrollmentInvitations).values(invitations);

      // Send email notifications (using owner notification as placeholder)
      // In production, this would send individual emails to each student
      await notifyOwner({
        title: "Bulk Student Enrollment",
        content: `${ctx.user.name} invited ${students.length} students to class "${classData.name}". Students: ${students.map((s) => s.email).join(", ")}`,
      });

      return {
        success: true,
        invitedCount: students.length,
        warnings: parseResult.errors,
      };
    }),

  // Get enrollment invitations for a class
  getInvitations: teacherProcedure
    .input(z.object({ classId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify teacher owns this class
      const [classData] = await db
        .select()
        .from(classes)
        .where(eq(classes.id, input.classId));

      if (!classData || (classData.teacherId !== ctx.user.id && ctx.user.role !== "admin")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return await db
        .select()
        .from(enrollmentInvitations)
        .where(eq(enrollmentInvitations.classId, input.classId));
    }),

  // Accept invitation (student side)
  acceptInvitation: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Find invitation
      const [invitation] = await db
        .select()
        .from(enrollmentInvitations)
        .where(eq(enrollmentInvitations.token, input.token));

      if (!invitation) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invitation not found" });
      }

      if (invitation.status !== "pending") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invitation already used" });
      }

      if (new Date() > invitation.expiresAt) {
        await db
          .update(enrollmentInvitations)
          .set({ status: "expired" })
          .where(eq(enrollmentInvitations.id, invitation.id));
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invitation expired" });
      }

      // Add student to class
      await db.insert(classMembers).values({
        classId: invitation.classId,
        userId: ctx.user.id,
      });

      // Mark invitation as accepted
      await db
        .update(enrollmentInvitations)
        .set({
          status: "accepted",
          acceptedAt: new Date(),
        })
        .where(eq(enrollmentInvitations.id, invitation.id));

      return { success: true, classId: invitation.classId };
    }),

  // Download CSV template
  getTemplate: teacherProcedure.query(() => {
    return { template: generateEnrollmentCSVTemplate() };
  }),
});

export const assignmentRouter = router({
  // Create assignment
  create: teacherProcedure
    .input(
      z.object({
        classId: z.number(),
        title: z.string(),
        description: z.string().optional(),
        contentId: z.number().optional(),
        vocabularyListId: z.number().optional(),
        dueDate: z.string().optional(), // ISO date string
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify teacher owns this class
      const [classData] = await db
        .select()
        .from(classes)
        .where(eq(classes.id, input.classId));

      if (!classData || (classData.teacherId !== ctx.user.id && ctx.user.role !== "admin")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [result] = await db.insert(assignments).values({
        ...input,
        teacherId: ctx.user.id,
        dueDate: input.dueDate ? new Date(input.dueDate) : undefined,
      });

      // Create submission records for all class members
      const members = await db
        .select()
        .from(classMembers)
        .where(
          and(
            eq(classMembers.classId, input.classId),
            eq(classMembers.status, "active")
          )
        );

      if (members.length > 0) {
        await db.insert(assignmentSubmissions).values(
          members.map((member) => ({
            assignmentId: result.insertId,
            userId: member.userId,
          }))
        );
      }

      return { assignmentId: result.insertId };
    }),

  // Get assignments for a class
  getByClass: teacherProcedure
    .input(z.object({ classId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify teacher owns this class
      const [classData] = await db
        .select()
        .from(classes)
        .where(eq(classes.id, input.classId));

      if (!classData || (classData.teacherId !== ctx.user.id && ctx.user.role !== "admin")) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      return await db
        .select()
        .from(assignments)
        .where(eq(assignments.classId, input.classId));
    }),

  // Get student assignments
  getMyAssignments: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    // Get all classes the student is in
    const myClasses = await db
        .select({ classId: classMembers.classId })
        .from(classMembers)
        .where(
          and(
            eq(classMembers.userId, ctx.user.id),
            eq(classMembers.status, "active")
          )
        );

    if (myClasses.length === 0) return [];

    const classIds = myClasses.map((c: { classId: number }) => c.classId);

    // Get assignments with submission status
    const assignmentsData = await db
      .select({
        id: assignments.id,
        title: assignments.title,
        description: assignments.description,
        dueDate: assignments.dueDate,
        classId: assignments.classId,
        className: classes.name,
        submissionStatus: assignmentSubmissions.status,
        completedAt: assignmentSubmissions.completedAt,
      })
      .from(assignments)
      .leftJoin(classes, eq(assignments.classId, classes.id))
      .leftJoin(
        assignmentSubmissions,
        and(
          eq(assignmentSubmissions.assignmentId, assignments.id),
          eq(assignmentSubmissions.userId, ctx.user.id)
        )
      )
      .where(inArray(assignments.classId, classIds));

    return assignmentsData;
  }),

  // Submit assignment
  submit: protectedProcedure
    .input(
      z.object({
        assignmentId: z.number(),
        contentId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db
        .update(assignmentSubmissions)
        .set({
          contentId: input.contentId,
          status: "completed",
          completedAt: new Date(),
          submittedAt: new Date(),
        })
        .where(
          and(
            eq(assignmentSubmissions.assignmentId, input.assignmentId),
            eq(assignmentSubmissions.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),
});

