import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users } from "../drizzle/schema";

describe("CEFR Level Test", () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let testUserId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a test user
    const [result] = await db
      .insert(users)
      .values({
        openId: `test-user-${Date.now()}`,
        name: "Test User",
        email: `test-${Date.now()}@example.com`,
        role: "user",
      })
      .$returningId();

    testUserId = result.id;

    // Create caller with test user context
    caller = appRouter.createCaller({
      user: {
        id: testUserId,
        openId: `test-user-${Date.now()}`,
        name: "Test User",
        email: `test-${Date.now()}@example.com`,
        role: "user",
        avatarUrl: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastLoginAt: new Date(),
        bio: null,
        location: null,
      },
    });
  });

  it("should generate 12 questions with CEFR levels", async () => {
    const questions = await caller.levelTest.generateTest({
      targetLanguage: "Spanish",
    });

    expect(questions).toBeDefined();
    expect(questions.length).toBe(12);

    // Check that all questions have required fields
    questions.forEach((q) => {
      expect(q.id).toBeDefined();
      expect(q.question).toBeDefined();
      expect(q.options).toBeDefined();
      expect(q.options.length).toBe(4);
      expect(q.correctAnswer).toBeGreaterThanOrEqual(0);
      expect(q.correctAnswer).toBeLessThan(4);
      expect(q.difficulty).toBeDefined();
      expect(["A1", "A2", "B1", "B2", "C1", "C2"]).toContain(q.difficulty);
      expect(q.skillArea).toBeDefined();
      expect(["vocabulary", "grammar", "reading"]).toContain(q.skillArea);
    });

    // Check that we have questions from different CEFR levels
    const levels = questions.map((q) => q.difficulty);
    const uniqueLevels = new Set(levels);
    expect(uniqueLevels.size).toBeGreaterThanOrEqual(4); // Should have at least 4 different levels
  }, 60000); // Increase timeout for LLM generation

  it("should calculate CEFR level correctly - A1 (low score)", async () => {
    // Generate questions first
    const questions = await caller.levelTest.generateTest({
      targetLanguage: "French",
    });

    // Simulate wrong answers (all incorrect)
    const answers = questions.map(() => 3); // Assuming 3 is always wrong

    const result = await caller.levelTest.submitTest({
      targetLanguage: "French",
      questions,
      answers,
    });

    expect(result).toBeDefined();
    expect(result.proficiencyLevel).toBe("A1"); // Should be A1 with all wrong answers
    expect(result.score).toBeLessThanOrEqual(20); // Should have very low score
    expect(result.totalQuestions).toBe(12);
    expect(result.breakdown).toBeDefined();
    expect(result.breakdown.A1).toBeDefined();
    expect(result.breakdown.C2).toBeDefined();
  }, 60000);

  it("should calculate CEFR level correctly - B1 (medium score)", async () => {
    const questions = await caller.levelTest.generateTest({
      targetLanguage: "German",
    });

    // Simulate medium performance: correct on A1/A2, some B1, wrong on higher levels
    const answers = questions.map((q) => {
      if (q.difficulty === "A1" || q.difficulty === "A2") {
        return q.correctAnswer; // Correct
      } else if (q.difficulty === "B1") {
        return q.correctAnswer; // Correct on B1
      } else {
        return (q.correctAnswer + 1) % 4; // Wrong on B2+
      }
    });

    const result = await caller.levelTest.submitTest({
      targetLanguage: "German",
      questions,
      answers,
    });

    expect(result).toBeDefined();
    expect(["A2", "B1", "B2"]).toContain(result.proficiencyLevel); // Should be intermediate range
    expect(result.score).toBeGreaterThan(40);
    expect(result.score).toBeLessThan(80);
  }, 60000);

  it("should calculate CEFR level correctly - C1/C2 (high score)", async () => {
    const questions = await caller.levelTest.generateTest({
      targetLanguage: "Chinese",
    });

    // Simulate high performance: all correct
    const answers = questions.map((q) => q.correctAnswer);

    const result = await caller.levelTest.submitTest({
      targetLanguage: "Chinese",
      questions,
      answers,
    });

    expect(result).toBeDefined();
    expect(["C1", "C2"]).toContain(result.proficiencyLevel); // Should be advanced
    expect(result.score).toBeGreaterThanOrEqual(80);
    expect(result.correctAnswers).toBe(12);
  }, 60000);

  it("should save test results to database", async () => {
    const questions = await caller.levelTest.generateTest({
      targetLanguage: "English",
    });

    const answers = questions.map((q) => q.correctAnswer);

    await caller.levelTest.submitTest({
      targetLanguage: "English",
      questions,
      answers,
    });

    // Retrieve the saved result
    const latestResult = await caller.levelTest.getLatestResult({
      targetLanguage: "English",
    });

    expect(latestResult).toBeDefined();
    expect(latestResult?.targetLanguage).toBe("English");
    expect(latestResult?.userId).toBe(testUserId);
    expect(["A1", "A2", "B1", "B2", "C1", "C2"]).toContain(
      latestResult?.proficiencyLevel
    );
  }, 60000);

  it("should retrieve all test results for user", async () => {
    const allResults = await caller.levelTest.getAllResults();

    expect(allResults).toBeDefined();
    expect(Array.isArray(allResults)).toBe(true);
    expect(allResults.length).toBeGreaterThan(0);

    allResults.forEach((result) => {
      expect(result.userId).toBe(testUserId);
      expect(["A1", "A2", "B1", "B2", "C1", "C2"]).toContain(
        result.proficiencyLevel
      );
    });
  });
});
