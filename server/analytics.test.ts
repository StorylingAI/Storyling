import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import {
  users,
  organizations,
  classes as classesTable,
  classMembers,
  quizAttempts,
  wordMastery,
} from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Class Analytics", () => {
  let teacherId: number;
  let studentId1: number;
  let studentId2: number;
  let organizationId: number;
  let classId: number;

  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Clean up test data
    await db.delete(users).where(eq(users.openId, "test-teacher-analytics"));
    await db.delete(users).where(eq(users.openId, "test-student-analytics-1"));
    await db.delete(users).where(eq(users.openId, "test-student-analytics-2"));

    // Create teacher
    const [teacher] = await db
      .insert(users)
      .values({
        openId: "test-teacher-analytics",
        name: "Test Teacher",
        email: "teacher@analytics.test",
        role: "teacher",
      })
      .$returningId();
    teacherId = teacher.id;

    // Create students
    const [student1] = await db
      .insert(users)
      .values({
        openId: "test-student-analytics-1",
        name: "Student One",
        email: "student1@analytics.test",
        role: "user",
      })
      .$returningId();
    studentId1 = student1.id;

    const [student2] = await db
      .insert(users)
      .values({
        openId: "test-student-analytics-2",
        name: "Student Two",
        email: "student2@analytics.test",
        role: "user",
      })
      .$returningId();
    studentId2 = student2.id;

    // Create organization
    const [org] = await db
      .insert(organizations)
      .values({
        name: "Test School",
        type: "school",
      })
      .$returningId();
    organizationId = org.id;

    // Create class
    const [cls] = await db
      .insert(classesTable)
      .values({
        name: "Test Class",
        organizationId,
        teacherId,
        targetLanguage: "Spanish",
        proficiencyLevel: "A2",
      })
      .$returningId();
    classId = cls.id;

    // Enroll students
    await db.insert(classMembers).values([
      {
        classId,
        userId: studentId1,
        enrolledAt: new Date(),
        status: "active",
      },
      {
        classId,
        userId: studentId2,
        enrolledAt: new Date(),
        status: "active",
      },
    ]);
  });

  afterEach(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    await db.delete(users).where(eq(users.openId, "test-teacher-analytics"));
    await db.delete(users).where(eq(users.openId, "test-student-analytics-1"));
    await db.delete(users).where(eq(users.openId, "test-student-analytics-2"));
  });

  it("should fetch class analytics with no data", async () => {
    const caller = appRouter.createCaller({
      user: { id: teacherId, openId: "test-teacher-analytics", name: "Test Teacher", email: "teacher@analytics.test", role: "teacher" },
      req: {} as any,
      res: {} as any,
    });

    const analytics = await caller.analytics.getClassAnalytics({ classId });

    expect(analytics).toBeDefined();
    expect(analytics.classId).toBe(classId);
    expect(analytics.studentCount).toBe(2);
    expect(analytics.averageQuizScore).toBe(0);
    expect(analytics.averageVocabularyMastery).toBe(0);
    expect(analytics.totalQuizAttempts).toBe(0);
    expect(analytics.studentPerformance).toHaveLength(2);
    expect(analytics.quizScoresTrend).toHaveLength(0);
    expect(analytics.vocabularyProgress).toHaveLength(0);
  });

  it("should calculate average quiz scores correctly", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Add quiz attempts for students
    await db.insert(quizAttempts).values([
      {
        userId: studentId1,
        contentId: 1,
        score: 80,
        totalQuestions: 5,
        answers: JSON.stringify([]),
        completedAt: new Date(),
      },
      {
        userId: studentId1,
        contentId: 1,
        score: 90,
        totalQuestions: 5,
        answers: JSON.stringify([]),
        completedAt: new Date(),
      },
      {
        userId: studentId2,
        contentId: 1,
        score: 60,
        totalQuestions: 5,
        answers: JSON.stringify([]),
        completedAt: new Date(),
      },
    ]);

    const caller = appRouter.createCaller({
      user: { id: teacherId, openId: "test-teacher-analytics", name: "Test Teacher", email: "teacher@analytics.test", role: "teacher" },
      req: {} as any,
      res: {} as any,
    });

    const analytics = await caller.analytics.getClassAnalytics({ classId });

    expect(analytics.totalQuizAttempts).toBe(3);
    expect(analytics.averageQuizScore).toBe(Math.round((80 + 90 + 60) / 3));

    // Check per-student scores
    const student1Perf = analytics.studentPerformance.find((s) => s.userId === studentId1);
    const student2Perf = analytics.studentPerformance.find((s) => s.userId === studentId2);

    expect(student1Perf?.averageQuizScore).toBe(85); // (80 + 90) / 2
    expect(student1Perf?.quizAttempts).toBe(2);
    expect(student2Perf?.averageQuizScore).toBe(60);
    expect(student2Perf?.quizAttempts).toBe(1);
  });

  it("should calculate vocabulary mastery correctly", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Add word mastery for students
    await db.insert(wordMastery).values([
      {
        userId: studentId1,
        word: "hola",
        targetLanguage: "Spanish",
        easinessFactor: 2500,
        interval: 1,
        repetitions: 5, // Mastered (>= 3)
        nextReviewDate: new Date(),
        correctCount: 5,
        incorrectCount: 0,
      },
      {
        userId: studentId1,
        word: "amigo",
        targetLanguage: "Spanish",
        easinessFactor: 2500,
        interval: 1,
        repetitions: 2, // Not mastered
        nextReviewDate: new Date(),
        correctCount: 2,
        incorrectCount: 1,
      },
      {
        userId: studentId2,
        word: "casa",
        targetLanguage: "Spanish",
        easinessFactor: 2500,
        interval: 1,
        repetitions: 4, // Mastered
        nextReviewDate: new Date(),
        correctCount: 4,
        incorrectCount: 0,
      },
    ]);

    const caller = appRouter.createCaller({
      user: { id: teacherId, openId: "test-teacher-analytics", name: "Test Teacher", email: "teacher@analytics.test", role: "teacher" },
      req: {} as any,
      res: {} as any,
    });

    const analytics = await caller.analytics.getClassAnalytics({ classId });

    expect(analytics.totalWordsLearned).toBe(3);
    // 2 out of 3 words are mastered (repetitions >= 3)
    expect(analytics.averageVocabularyMastery).toBe(Math.round((2 / 3) * 100));

    // Check per-student mastery
    const student1Perf = analytics.studentPerformance.find((s) => s.userId === studentId1);
    const student2Perf = analytics.studentPerformance.find((s) => s.userId === studentId2);

    expect(student1Perf?.totalWords).toBe(2);
    expect(student1Perf?.masteredWords).toBe(1); // Only "hola"
    expect(student1Perf?.masteryPercentage).toBe(50);

    expect(student2Perf?.totalWords).toBe(1);
    expect(student2Perf?.masteredWords).toBe(1); // "casa"
    expect(student2Perf?.masteryPercentage).toBe(100);
  });

  it("should identify struggling students", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Student 1: Good performance
    await db.insert(quizAttempts).values([
      {
        userId: studentId1,
        contentId: 1,
        score: 90,
        totalQuestions: 5,
        answers: JSON.stringify([]),
        completedAt: new Date(),
      },
    ]);

    await db.insert(wordMastery).values([
      {
        userId: studentId1,
        word: "hola",
        targetLanguage: "Spanish",
        easinessFactor: 2500,
        interval: 1,
        repetitions: 5,
        nextReviewDate: new Date(),
        correctCount: 5,
        incorrectCount: 0,
      },
    ]);

    // Student 2: Poor performance
    await db.insert(quizAttempts).values([
      {
        userId: studentId2,
        contentId: 1,
        score: 40, // Low score
        totalQuestions: 5,
        answers: JSON.stringify([]),
        completedAt: new Date(),
      },
    ]);

    await db.insert(wordMastery).values([
      {
        userId: studentId2,
        word: "casa",
        targetLanguage: "Spanish",
        easinessFactor: 2500,
        interval: 1,
        repetitions: 1, // Low mastery
        nextReviewDate: new Date(),
        correctCount: 1,
        incorrectCount: 2,
      },
    ]);

    const caller = appRouter.createCaller({
      user: { id: teacherId, openId: "test-teacher-analytics", name: "Test Teacher", email: "teacher@analytics.test", role: "teacher" },
      req: {} as any,
      res: {} as any,
    });

    const analytics = await caller.analytics.getClassAnalytics({ classId });

    const student1Perf = analytics.studentPerformance.find((s) => s.userId === studentId1);
    const student2Perf = analytics.studentPerformance.find((s) => s.userId === studentId2);

    // Student 1 should have good scores
    expect(student1Perf?.averageQuizScore).toBeGreaterThanOrEqual(80);
    expect(student1Perf?.masteryPercentage).toBeGreaterThanOrEqual(80);

    // Student 2 should have poor scores (struggling)
    expect(student2Perf?.averageQuizScore).toBeLessThan(60);
    expect(student2Perf?.masteryPercentage).toBeLessThan(40);
  });

  it("should track quiz scores trend over time", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const twoDaysAgo = new Date(today);
    twoDaysAgo.setDate(twoDaysAgo.getDate() - 2);

    await db.insert(quizAttempts).values([
      {
        userId: studentId1,
        contentId: 1,
        score: 60,
        totalQuestions: 5,
        answers: JSON.stringify([]),
        completedAt: twoDaysAgo,
      },
      {
        userId: studentId1,
        contentId: 1,
        score: 75,
        totalQuestions: 5,
        answers: JSON.stringify([]),
        completedAt: yesterday,
      },
      {
        userId: studentId1,
        contentId: 1,
        score: 90,
        totalQuestions: 5,
        answers: JSON.stringify([]),
        completedAt: today,
      },
    ]);

    const caller = appRouter.createCaller({
      user: { id: teacherId, openId: "test-teacher-analytics", name: "Test Teacher", email: "teacher@analytics.test", role: "teacher" },
      req: {} as any,
      res: {} as any,
    });

    const analytics = await caller.analytics.getClassAnalytics({ classId });

    expect(analytics.quizScoresTrend).toHaveLength(3);
    expect(analytics.quizScoresTrend[0].score).toBe(60);
    expect(analytics.quizScoresTrend[1].score).toBe(75);
    expect(analytics.quizScoresTrend[2].score).toBe(90);
  });

  it("should track vocabulary progress over time", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    await db.insert(wordMastery).values([
      {
        userId: studentId1,
        word: "hola",
        targetLanguage: "Spanish",
        easinessFactor: 2500,
        interval: 1,
        repetitions: 1,
        nextReviewDate: new Date(),
        correctCount: 1,
        incorrectCount: 0,
        createdAt: yesterday,
      },
      {
        userId: studentId1,
        word: "amigo",
        targetLanguage: "Spanish",
        easinessFactor: 2500,
        interval: 1,
        repetitions: 1,
        nextReviewDate: new Date(),
        correctCount: 1,
        incorrectCount: 0,
        createdAt: today,
      },
    ]);

    const caller = appRouter.createCaller({
      user: { id: teacherId, openId: "test-teacher-analytics", name: "Test Teacher", email: "teacher@analytics.test", role: "teacher" },
      req: {} as any,
      res: {} as any,
    });

    const analytics = await caller.analytics.getClassAnalytics({ classId });

    expect(analytics.vocabularyProgress).toHaveLength(2);
    expect(analytics.vocabularyProgress[0].word).toBe("hola");
    expect(analytics.vocabularyProgress[1].word).toBe("amigo");
  });

  it("should require teacher authorization", async () => {
    const caller = appRouter.createCaller({
      user: { id: studentId1, openId: "test-student-analytics-1", name: "Student One", email: "student1@analytics.test", role: "user" },
      req: {} as any,
      res: {} as any,
    });

    await expect(
      caller.analytics.getClassAnalytics({ classId })
    ).rejects.toThrow("Teacher access required");
  });

  it("should handle empty class (no students)", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a new empty class
    const [emptyClass] = await db
      .insert(classesTable)
      .values({
        name: "Empty Class",
        organizationId,
        teacherId,
        targetLanguage: "French",
        proficiencyLevel: "A1",
      })
      .$returningId();

    const caller = appRouter.createCaller({
      user: { id: teacherId, openId: "test-teacher-analytics", name: "Test Teacher", email: "teacher@analytics.test", role: "teacher" },
      req: {} as any,
      res: {} as any,
    });

    const analytics = await caller.analytics.getClassAnalytics({ classId: emptyClass.id });

    expect(analytics.studentCount).toBe(0);
    expect(analytics.studentPerformance).toHaveLength(0);
    expect(analytics.averageQuizScore).toBe(0);
    expect(analytics.averageVocabularyMastery).toBe(0);
  });
});
