import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";
import { getDb } from "./db";
import { users, vocabularyLists, generatedContent, quizAttempts } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Quiz Router", () => {
  let testUserId: number;
  let testContentId: number;
  let testVocabListId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test user
    const [user] = await db
      .insert(users)
      .values({
        openId: "test-quiz-user-" + Date.now(),
        name: "Quiz Test User",
        email: "quiz@test.com",
        role: "user",
      })
      .$returningId();
    testUserId = user.id;

    // Create test vocabulary list
    const [vocabList] = await db
      .insert(vocabularyLists)
      .values({
        userId: testUserId,
        targetLanguage: "Spanish",
        proficiencyLevel: "B1",
        words: "hola, adiós, gracias, por favor, buenos días",
        topicPrompt: "Basic greetings",
      })
      .$returningId();
    testVocabListId = vocabList.id;

    // Create test content
    const [content] = await db
      .insert(generatedContent)
      .values({
        userId: testUserId,
        vocabularyListId: testVocabListId,
        mode: "podcast",
        theme: "Comedy",
        voiceType: "Warm & Friendly",
        storyText: "A funny story about learning Spanish greetings in a market.",
        status: "completed",
      })
      .$returningId();
    testContentId = content.id;
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    await db.delete(quizAttempts).where(eq(quizAttempts.userId, testUserId));
    await db.delete(generatedContent).where(eq(generatedContent.userId, testUserId));
    await db.delete(vocabularyLists).where(eq(vocabularyLists.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it("should generate quiz questions from vocabulary", async () => {
    const mockContext: Context = {
      user: {
        id: testUserId,
        openId: "test-quiz-user",
        name: "Quiz Test User",
        email: "quiz@test.com",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        loginMethod: "test",
      },
      req: {} as any,
      res: {} as any,
    };

    const caller = appRouter.createCaller(mockContext);

    const result = await caller.quiz.generate({ contentId: testContentId });

    expect(result).toBeDefined();
    expect(result.questions).toBeDefined();
    expect(Array.isArray(result.questions)).toBe(true);
    expect(result.questions.length).toBeGreaterThan(0);

    // Validate question structure
    const firstQuestion = result.questions[0];
    expect(firstQuestion).toHaveProperty("word");
    expect(firstQuestion).toHaveProperty("question");
    expect(firstQuestion).toHaveProperty("options");
    expect(firstQuestion).toHaveProperty("correctIndex");
    expect(firstQuestion).toHaveProperty("explanation");
    expect(Array.isArray(firstQuestion.options)).toBe(true);
    expect(firstQuestion.options.length).toBe(4);
    expect(typeof firstQuestion.correctIndex).toBe("number");
    expect(firstQuestion.correctIndex).toBeGreaterThanOrEqual(0);
    expect(firstQuestion.correctIndex).toBeLessThan(4);
  }, 30000); // 30 second timeout for LLM API call

  it("should save quiz attempt with correct data", async () => {
    const mockContext: Context = {
      user: {
        id: testUserId,
        openId: "test-quiz-user",
        name: "Quiz Test User",
        email: "quiz@test.com",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        loginMethod: "test",
      },
      req: {} as any,
      res: {} as any,
    };

    const caller = appRouter.createCaller(mockContext);

    const attemptData = {
      contentId: testContentId,
      score: 4,
      totalQuestions: 5,
      answers: [
        { questionIndex: 0, selectedIndex: 0, correct: true, word: "你好" },
        { questionIndex: 1, selectedIndex: 1, correct: true, word: "朋友" },
        { questionIndex: 2, selectedIndex: 2, correct: true, word: "家" },
        { questionIndex: 3, selectedIndex: 0, correct: true, word: "学习" },
        { questionIndex: 4, selectedIndex: 1, correct: false, word: "工作" },
      ],
      targetLanguage: "Chinese",
    };

    const result = await caller.quiz.saveAttempt(attemptData);

    expect(result).toBeDefined();
    expect(result.success).toBe(true);

    // Verify the attempt was saved
    const attempts = await caller.quiz.getAttempts({ contentId: testContentId });
    expect(attempts).toBeDefined();
    expect(Array.isArray(attempts)).toBe(true);
    expect(attempts.length).toBeGreaterThan(0);

    const savedAttempt = attempts[attempts.length - 1];
    expect(savedAttempt.userId).toBe(testUserId);
    expect(savedAttempt.contentId).toBe(testContentId);
    expect(savedAttempt.score).toBe(4);
    expect(savedAttempt.totalQuestions).toBe(5);
  });

  it("should retrieve quiz attempts for a user", async () => {
    const mockContext: Context = {
      user: {
        id: testUserId,
        openId: "test-quiz-user",
        name: "Quiz Test User",
        email: "quiz@test.com",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        loginMethod: "test",
      },
      req: {} as any,
      res: {} as any,
    };

    const caller = appRouter.createCaller(mockContext);

    const attempts = await caller.quiz.getAttempts({ contentId: testContentId });

    expect(attempts).toBeDefined();
    expect(Array.isArray(attempts)).toBe(true);
    expect(attempts.length).toBeGreaterThan(0);

    // Verify attempt structure
    const attempt = attempts[0];
    expect(attempt).toHaveProperty("id");
    expect(attempt).toHaveProperty("userId");
    expect(attempt).toHaveProperty("contentId");
    expect(attempt).toHaveProperty("score");
    expect(attempt).toHaveProperty("totalQuestions");
    expect(attempt).toHaveProperty("answers");
    expect(attempt).toHaveProperty("completedAt");
  });

  it("should not allow generating quiz for content not owned by user", async () => {
    const mockContext: Context = {
      user: {
        id: 99999, // Different user ID
        openId: "different-user",
        name: "Different User",
        email: "different@test.com",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        loginMethod: "test",
      },
      req: {} as any,
      res: {} as any,
    };

    const caller = appRouter.createCaller(mockContext);

    await expect(
      caller.quiz.generate({ contentId: testContentId })
    ).rejects.toThrow("Content not found");
  });

  it("should calculate quiz score correctly", async () => {
    const mockContext: Context = {
      user: {
        id: testUserId,
        openId: "test-quiz-user",
        name: "Quiz Test User",
        email: "quiz@test.com",
        role: "user",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        loginMethod: "test",
      },
      req: {} as any,
      res: {} as any,
    };

    const caller = appRouter.createCaller(mockContext);

    // Save a perfect score attempt
    await caller.quiz.saveAttempt({
      contentId: testContentId,
      score: 5,
      totalQuestions: 5,
      answers: [
        { questionIndex: 0, selectedIndex: 0, correct: true, word: "你好" },
        { questionIndex: 1, selectedIndex: 1, correct: true, word: "朋友" },
        { questionIndex: 2, selectedIndex: 2, correct: true, word: "家" },
        { questionIndex: 3, selectedIndex: 0, correct: true, word: "学习" },
        { questionIndex: 4, selectedIndex: 1, correct: true, word: "工作" },
      ],
      targetLanguage: "Chinese",
    });

    const attempts = await caller.quiz.getAttempts({ contentId: testContentId });
    const perfectAttempt = attempts.find((a) => a.score === 5);

    expect(perfectAttempt).toBeDefined();
    expect(perfectAttempt!.score).toBe(5);
    expect(perfectAttempt!.totalQuestions).toBe(5);
  });
});
