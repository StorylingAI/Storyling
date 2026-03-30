import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users, wordMastery, quizAttempts } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Progress Analytics", () => {
  let testUserId: number;
  let testContext: any;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test user
    const result = await db.insert(users).values({
      openId: "test-progress-user",
      name: "Test Progress User",
      email: "progress@test.com",
      role: "user",
    });
    testUserId = Number(result[0].insertId);

    testContext = {
      user: { id: testUserId, name: "Test Progress User", role: "user" },
      req: {} as any,
      res: {} as any,
    };

    // Insert test word mastery data
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    await db.insert(wordMastery).values([
      {
        userId: testUserId,
        word: "mastered-word",
        targetLanguage: "Spanish",
        easinessFactor: 2800,
        interval: 30,
        repetitions: 10,
        nextReviewDate: tomorrow,
        correctCount: 20,
        incorrectCount: 1,
      },
      {
        userId: testUserId,
        word: "learning-word",
        targetLanguage: "Spanish",
        easinessFactor: 2300,
        interval: 6,
        repetitions: 3,
        nextReviewDate: tomorrow,
        correctCount: 5,
        incorrectCount: 3,
      },
      {
        userId: testUserId,
        word: "struggling-word",
        targetLanguage: "Spanish",
        easinessFactor: 1500,
        interval: 1,
        repetitions: 1,
        nextReviewDate: yesterday,
        correctCount: 2,
        incorrectCount: 8,
      },
    ]);

    // Insert test quiz attempts
    await db.insert(quizAttempts).values([
      {
        userId: testUserId,
        contentId: 1,
        score: 4,
        totalQuestions: 5,
        answers: JSON.stringify([]),
        completedAt: now,
      },
      {
        userId: testUserId,
        contentId: 1,
        score: 3,
        totalQuestions: 5,
        answers: JSON.stringify([]),
        completedAt: yesterday,
      },
    ]);
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Cleanup
    await db.delete(quizAttempts).where(eq(quizAttempts.userId, testUserId));
    await db.delete(wordMastery).where(eq(wordMastery.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  describe("getWordMastery", () => {
    it("should fetch all word mastery data for a user", async () => {
      const caller = appRouter.createCaller(testContext);
      const result = await caller.progress.getWordMastery({});

      expect(result.length).toBeGreaterThanOrEqual(3);
      expect(result.every((w) => "masteryLevel" in w)).toBe(true);
    });

    it("should filter by target language", async () => {
      const caller = appRouter.createCaller(testContext);
      const result = await caller.progress.getWordMastery({ targetLanguage: "Spanish" });

      expect(result.length).toBe(3);
      expect(result.every((w) => w.targetLanguage === "Spanish")).toBe(true);
    });

    it("should calculate mastery levels correctly", async () => {
      const caller = appRouter.createCaller(testContext);
      const result = await caller.progress.getWordMastery({ targetLanguage: "Spanish" });

      const mastered = result.find((w) => w.word === "mastered-word");
      const learning = result.find((w) => w.word === "learning-word");
      const struggling = result.find((w) => w.word === "struggling-word");

      expect(mastered?.masteryLevel).toBeGreaterThanOrEqual(80);
      expect(learning?.masteryLevel).toBeGreaterThanOrEqual(40);
      expect(learning?.masteryLevel).toBeLessThan(80);
      expect(struggling?.masteryLevel).toBeLessThan(40);
    });
  });

  describe("getStatistics", () => {
    it("should calculate total words correctly", async () => {
      const caller = appRouter.createCaller(testContext);
      const result = await caller.progress.getStatistics({});

      expect(result.totalWords).toBeGreaterThanOrEqual(3);
    });

    it("should categorize words by mastery level", async () => {
      const caller = appRouter.createCaller(testContext);
      const result = await caller.progress.getStatistics({ targetLanguage: "Spanish" });

      expect(result.mastered).toBeGreaterThanOrEqual(1);
      expect(result.learning).toBeGreaterThanOrEqual(1);
      expect(result.struggling).toBeGreaterThanOrEqual(1);
      expect(result.mastered + result.learning + result.struggling).toBe(result.totalWords);
    });

    it("should calculate quiz statistics correctly", async () => {
      const caller = appRouter.createCaller(testContext);
      const result = await caller.progress.getStatistics({});

      expect(result.totalQuizzes).toBeGreaterThanOrEqual(2);
      expect(result.averageScore).toBeGreaterThan(0);
      expect(result.averageScore).toBeLessThanOrEqual(100);
    });

    it("should calculate current streak correctly", async () => {
      const caller = appRouter.createCaller(testContext);
      const result = await caller.progress.getStatistics({});

      // We have quizzes today and yesterday, so streak should be at least 2
      expect(result.currentStreak).toBeGreaterThanOrEqual(2);
    });

    it("should identify words due for review", async () => {
      const caller = appRouter.createCaller(testContext);
      const result = await caller.progress.getStatistics({ targetLanguage: "Spanish" });

      // struggling-word has nextReviewDate = yesterday, so it's due
      expect(result.wordsDue).toBeGreaterThanOrEqual(1);
    });
  });

  describe("getActivityCalendar", () => {
    it("should return activity data by date", async () => {
      const caller = appRouter.createCaller(testContext);
      const result = await caller.progress.getActivityCalendar({ days: 90 });

      expect(typeof result).toBe("object");
      expect(Object.keys(result).length).toBeGreaterThan(0);
    });

    it("should format dates correctly (YYYY-MM-DD)", async () => {
      const caller = appRouter.createCaller(testContext);
      const result = await caller.progress.getActivityCalendar({ days: 90 });

      const dateKeys = Object.keys(result);
      const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
      expect(dateKeys.every((key) => dateRegex.test(key))).toBe(true);
    });

    it("should count quiz attempts per day", async () => {
      const caller = appRouter.createCaller(testContext);
      const result = await caller.progress.getActivityCalendar({ days: 90 });

      const today = new Date().toISOString().split("T")[0];
      const yesterday = new Date(Date.now() - 86400000).toISOString().split("T")[0];

      expect(result[today]).toBeGreaterThanOrEqual(1);
      expect(result[yesterday]).toBeGreaterThanOrEqual(1);
    });

    it("should respect the days parameter", async () => {
      const caller = appRouter.createCaller(testContext);
      const result = await caller.progress.getActivityCalendar({ days: 7 });

      // All dates should be within the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const dateKeys = Object.keys(result);
      dateKeys.forEach((dateKey) => {
        const date = new Date(dateKey);
        expect(date.getTime()).toBeGreaterThanOrEqual(sevenDaysAgo.getTime());
      });
    });
  });

  describe("Edge Cases", () => {
    it("should handle user with no word mastery data", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Create a new user with no data
      const result = await db.insert(users).values({
        openId: "test-empty-user",
        name: "Empty User",
        email: "empty@test.com",
        role: "user",
      });
      const emptyUserId = Number(result[0].insertId);

      const emptyContext = {
        user: { id: emptyUserId, name: "Empty User", role: "user" },
        req: {} as any,
        res: {} as any,
      };

      const caller = appRouter.createCaller(emptyContext);
      const stats = await caller.progress.getStatistics({});

      expect(stats.totalWords).toBe(0);
      expect(stats.mastered).toBe(0);
      expect(stats.learning).toBe(0);
      expect(stats.struggling).toBe(0);
      expect(stats.totalQuizzes).toBe(0);
      expect(stats.averageScore).toBe(0);
      expect(stats.currentStreak).toBe(0);
      expect(stats.wordsDue).toBe(0);

      // Cleanup
      await db.delete(users).where(eq(users.id, emptyUserId));
    });

    it("should handle user with no quiz attempts", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const result = await db.insert(users).values({
        openId: "test-no-quiz-user",
        name: "No Quiz User",
        email: "noquiz@test.com",
        role: "user",
      });
      const noQuizUserId = Number(result[0].insertId);

      const noQuizContext = {
        user: { id: noQuizUserId, name: "No Quiz User", role: "user" },
        req: {} as any,
        res: {} as any,
      };

      const caller = appRouter.createCaller(noQuizContext);
      const calendar = await caller.progress.getActivityCalendar({ days: 90 });

      expect(Object.keys(calendar).length).toBe(0);

      // Cleanup
      await db.delete(users).where(eq(users.id, noQuizUserId));
    });
  });
});
