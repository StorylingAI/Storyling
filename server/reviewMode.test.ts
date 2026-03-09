import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";

describe("Review Mode", () => {
  const testUserId = 777777;
  const testOpenId = "test-review-mode-user";

  const mockContext: Context = {
    user: {
      id: testUserId,
      openId: testOpenId,
      name: "Test Review User",
      avatar: null,
      role: "user",
      createdAt: new Date(),
    },
    req: {} as any,
    res: {} as any,
  };

  const caller = appRouter.createCaller(mockContext);

  beforeAll(async () => {
    // Clean up any existing test data
    const { getDb } = await import("./db");
    const { wordbank, wordMastery } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db.delete(wordMastery).where(eq(wordMastery.userId, testUserId));
    await db.delete(wordbank).where(eq(wordbank.userId, testUserId));

    // Insert test wordbank words
    const insertedWords = await db.insert(wordbank).values([
      {
        userId: testUserId,
        word: "你好",
        pinyin: "nǐ hǎo",
        translation: "hello",
        targetLanguage: "Chinese",
        proficiencyLevel: "beginner",
        exampleSentences: JSON.stringify(["你好，很高兴见到你。"]),
      },
      {
        userId: testUserId,
        word: "谢谢",
        pinyin: "xiè xie",
        translation: "thank you",
        targetLanguage: "Chinese",
        proficiencyLevel: "beginner",
        exampleSentences: JSON.stringify(["谢谢你的帮助。"]),
      },
      {
        userId: testUserId,
        word: "再见",
        pinyin: "zài jiàn",
        translation: "goodbye",
        targetLanguage: "Chinese",
        proficiencyLevel: "beginner",
        exampleSentences: JSON.stringify(["再见，明天见。"]),
      },
    ]);

    // Insert word mastery records with due dates
    const yesterday = new Date(Date.now() - 86400000);
    const tomorrow = new Date(Date.now() + 86400000);

    await db.insert(wordMastery).values([
      {
        userId: testUserId,
        word: "你好",
        targetLanguage: "Chinese",
        easinessFactor: 2500,
        interval: 1,
        repetitions: 1,
        nextReviewDate: yesterday, // Due for review
        lastReviewedAt: new Date(Date.now() - 86400000 * 2),
        correctCount: 2,
        incorrectCount: 1,
      },
      {
        userId: testUserId,
        word: "谢谢",
        targetLanguage: "Chinese",
        easinessFactor: 2300,
        interval: 1,
        repetitions: 1,
        nextReviewDate: yesterday, // Due for review
        lastReviewedAt: new Date(Date.now() - 86400000 * 2),
        correctCount: 1,
        incorrectCount: 1,
      },
      {
        userId: testUserId,
        word: "再见",
        targetLanguage: "Chinese",
        easinessFactor: 2600,
        interval: 3,
        repetitions: 2,
        nextReviewDate: tomorrow, // Not due yet
        lastReviewedAt: new Date(Date.now() - 86400000),
        correctCount: 3,
        incorrectCount: 0,
      },
    ]);
  });

  it("should generate quiz from due words only", async () => {
    const quiz = await caller.wordbank.generateReviewQuiz();

    expect(quiz).toBeDefined();
    expect(quiz.totalDue).toBeGreaterThanOrEqual(2); // 你好 and 谢谢 are due
    expect(quiz.targetLanguage).toBe("Chinese");
    expect(quiz.nextReviewDate).toBeNull(); // Should be null when there are due words
  });

  it("should include wordbankId in quiz questions", async () => {
    const quiz = await caller.wordbank.generateReviewQuiz();

    if (quiz.questions && quiz.questions.length > 0) {
      const firstQuestion = quiz.questions[0];
      expect(firstQuestion).toHaveProperty("word");
      expect(firstQuestion).toHaveProperty("wordbankId");
      expect(firstQuestion).toHaveProperty("question");
      expect(firstQuestion).toHaveProperty("options");
      expect(firstQuestion).toHaveProperty("correctIndex");
      expect(firstQuestion).toHaveProperty("explanation");
      
      // wordbankId should be a positive number
      expect(firstQuestion.wordbankId).toBeGreaterThan(0);
    }
  });

  it("should return empty quiz when no words are due", async () => {
    // Create a new user with no due words
    const emptyUserContext: Context = {
      user: {
        id: 666666,
        openId: "empty-review-user",
        name: "Empty User",
        avatar: null,
        role: "user",
        createdAt: new Date(),
      },
      req: {} as any,
      res: {} as any,
    };

    const emptyCaller = appRouter.createCaller(emptyUserContext);
    const quiz = await emptyCaller.wordbank.generateReviewQuiz();

    expect(quiz.questions).toHaveLength(0);
    expect(quiz.totalDue).toBe(0);
  });

  it("should limit quiz to maximum 10 words", async () => {
    const quiz = await caller.wordbank.generateReviewQuiz();

    // Even if more than 10 words are due, should limit to 10
    expect(quiz.questions.length).toBeLessThanOrEqual(10);
  });
});
