import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import {
  organizations,
  classes,
  classMembers,
  assignments,
  assignmentSubmissions,
  users,
} from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

describe("B2B Multi-Tenant Features", () => {
  let testOrgId: number;
  let testTeacherId: number;
  let testStudentId: number;
  let testClassId: number;
  let testAssignmentId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test organization
    const [org] = await db.insert(organizations).values({
      name: "Test Language School",
      type: "school",
      contactEmail: "admin@testschool.com",
      maxStudents: 100,
      maxTeachers: 10,
    });
    testOrgId = org.insertId;

    // Create test teacher
    const [teacher] = await db.insert(users).values({
      openId: `test-teacher-${Date.now()}`,
      name: "Test Teacher",
      email: "teacher@test.com",
      role: "teacher",
    });
    testTeacherId = teacher.insertId;

    // Create test student
    const [student] = await db.insert(users).values({
      openId: `test-student-${Date.now()}`,
      name: "Test Student",
      email: "student@test.com",
      role: "user",
    });
    testStudentId = student.insertId;
  });

  describe("Organizations", () => {
    it("should create an organization with correct defaults", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, testOrgId));

      expect(org).toBeDefined();
      expect(org.name).toBe("Test Language School");
      expect(org.type).toBe("school");
      expect(org.maxStudents).toBe(100);
      expect(org.maxTeachers).toBe(10);
      expect(org.isActive).toBe(true);
      expect(org.subscriptionTier).toBe("trial");
    });

    it("should retrieve organization by ID", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, testOrgId));

      expect(org).toBeDefined();
      expect(org.id).toBe(testOrgId);
    });
  });

  describe("Classes", () => {
    it("should create a class linked to organization and teacher", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [result] = await db.insert(classes).values({
        organizationId: testOrgId,
        teacherId: testTeacherId,
        name: "Spanish A2 - Morning Class",
        description: "Beginner Spanish class",
        targetLanguage: "Spanish",
        proficiencyLevel: "A2",
      });

      testClassId = result.insertId;

      const [classData] = await db
        .select()
        .from(classes)
        .where(eq(classes.id, testClassId));

      expect(classData).toBeDefined();
      expect(classData.name).toBe("Spanish A2 - Morning Class");
      expect(classData.organizationId).toBe(testOrgId);
      expect(classData.teacherId).toBe(testTeacherId);
      expect(classData.targetLanguage).toBe("Spanish");
      expect(classData.proficiencyLevel).toBe("A2");
      expect(classData.isArchived).toBe(false);
    });

    it("should retrieve classes for a specific teacher", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const teacherClasses = await db
        .select()
        .from(classes)
        .where(eq(classes.teacherId, testTeacherId));

      expect(teacherClasses.length).toBeGreaterThan(0);
      expect(teacherClasses[0].teacherId).toBe(testTeacherId);
    });

    it("should archive a class", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(classes)
        .set({ isArchived: true })
        .where(eq(classes.id, testClassId));

      const [archivedClass] = await db
        .select()
        .from(classes)
        .where(eq(classes.id, testClassId));

      expect(archivedClass.isArchived).toBe(true);

      // Restore for other tests
      await db
        .update(classes)
        .set({ isArchived: false })
        .where(eq(classes.id, testClassId));
    });
  });

  describe("Class Members", () => {
    it("should add a student to a class", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(classMembers).values({
        classId: testClassId,
        userId: testStudentId,
      });

      const [member] = await db
        .select()
        .from(classMembers)
        .where(
          and(
            eq(classMembers.classId, testClassId),
            eq(classMembers.userId, testStudentId)
          )
        );

      expect(member).toBeDefined();
      expect(member.classId).toBe(testClassId);
      expect(member.userId).toBe(testStudentId);
      expect(member.status).toBe("active");
    });

    it("should retrieve class members with user details", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const members = await db
        .select({
          id: classMembers.id,
          userId: classMembers.userId,
          status: classMembers.status,
          userName: users.name,
          userEmail: users.email,
        })
        .from(classMembers)
        .leftJoin(users, eq(classMembers.userId, users.id))
        .where(eq(classMembers.classId, testClassId));

      expect(members.length).toBeGreaterThan(0);
      expect(members[0].userName).toBe("Test Student");
      expect(members[0].userEmail).toBe("student@test.com");
    });

    it("should remove a student from a class", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db
        .update(classMembers)
        .set({ status: "removed" })
        .where(
          and(
            eq(classMembers.classId, testClassId),
            eq(classMembers.userId, testStudentId)
          )
        );

      const [member] = await db
        .select()
        .from(classMembers)
        .where(
          and(
            eq(classMembers.classId, testClassId),
            eq(classMembers.userId, testStudentId)
          )
        );

      expect(member.status).toBe("removed");

      // Restore for other tests
      await db
        .update(classMembers)
        .set({ status: "active" })
        .where(
          and(
            eq(classMembers.classId, testClassId),
            eq(classMembers.userId, testStudentId)
          )
        );
    });
  });

  describe("Assignments", () => {
    it("should create an assignment for a class", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 7); // Due in 7 days

      const [result] = await db.insert(assignments).values({
        classId: testClassId,
        teacherId: testTeacherId,
        title: "Practice Spanish Vocabulary",
        description: "Complete the vocabulary quiz",
        dueDate,
      });

      testAssignmentId = result.insertId;

      const [assignment] = await db
        .select()
        .from(assignments)
        .where(eq(assignments.id, testAssignmentId));

      expect(assignment).toBeDefined();
      expect(assignment.title).toBe("Practice Spanish Vocabulary");
      expect(assignment.classId).toBe(testClassId);
      expect(assignment.teacherId).toBe(testTeacherId);
    });

    it("should retrieve assignments for a class", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const classAssignments = await db
        .select()
        .from(assignments)
        .where(eq(assignments.classId, testClassId));

      expect(classAssignments.length).toBeGreaterThan(0);
      expect(classAssignments[0].classId).toBe(testClassId);
    });
  });

  describe("Assignment Submissions", () => {
    it("should create submission records for class members", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(assignmentSubmissions).values({
        assignmentId: testAssignmentId,
        userId: testStudentId,
      });

      const [submission] = await db
        .select()
        .from(assignmentSubmissions)
        .where(
          and(
            eq(assignmentSubmissions.assignmentId, testAssignmentId),
            eq(assignmentSubmissions.userId, testStudentId)
          )
        );

      expect(submission).toBeDefined();
      expect(submission.status).toBe("not_started");
      expect(submission.assignmentId).toBe(testAssignmentId);
      expect(submission.userId).toBe(testStudentId);
    });

    it("should mark assignment as completed", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const completedAt = new Date();

      await db
        .update(assignmentSubmissions)
        .set({
          status: "completed",
          completedAt,
          submittedAt: completedAt,
        })
        .where(
          and(
            eq(assignmentSubmissions.assignmentId, testAssignmentId),
            eq(assignmentSubmissions.userId, testStudentId)
          )
        );

      const [submission] = await db
        .select()
        .from(assignmentSubmissions)
        .where(
          and(
            eq(assignmentSubmissions.assignmentId, testAssignmentId),
            eq(assignmentSubmissions.userId, testStudentId)
          )
        );

      expect(submission.status).toBe("completed");
      expect(submission.completedAt).toBeDefined();
      expect(submission.submittedAt).toBeDefined();
    });

    it("should retrieve student assignments with submission status", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get classes student is in
      const studentClasses = await db
        .select({ classId: classMembers.classId })
        .from(classMembers)
        .where(
          and(
            eq(classMembers.userId, testStudentId),
            eq(classMembers.status, "active")
          )
        );

      expect(studentClasses.length).toBeGreaterThan(0);

      const classIds = studentClasses.map((c: { classId: number }) => c.classId);

      // Get assignments with submission status
      const assignmentsData = await db
        .select({
          id: assignments.id,
          title: assignments.title,
          className: classes.name,
          submissionStatus: assignmentSubmissions.status,
        })
        .from(assignments)
        .leftJoin(classes, eq(assignments.classId, classes.id))
        .leftJoin(
          assignmentSubmissions,
          and(
            eq(assignmentSubmissions.assignmentId, assignments.id),
            eq(assignmentSubmissions.userId, testStudentId)
          )
        )
        .where(eq(assignments.classId, classIds[0]));

      expect(assignmentsData.length).toBeGreaterThan(0);
      expect(assignmentsData[0].submissionStatus).toBe("completed");
    });
  });

  describe("Role-Based Access Control", () => {
    it("should correctly identify teacher role", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [teacher] = await db
        .select()
        .from(users)
        .where(eq(users.id, testTeacherId));

      expect(teacher.role).toBe("teacher");
    });

    it("should correctly identify student role", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [student] = await db
        .select()
        .from(users)
        .where(eq(users.id, testStudentId));

      expect(student.role).toBe("user");
    });
  });
});
