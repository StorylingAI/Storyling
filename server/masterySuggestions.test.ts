import { describe, it, expect, beforeEach } from "vitest";
import { getDb } from "./db";
import { wordbank, wordMastery } from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

describe("Mastery Suggestions", () => {
  const testUserId = 99998; // Use numeric ID for tests
  const testLanguage = "Spanish";

  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Clean up existing test data
    await db.delete(wordMastery).where(eq(wordMastery.userId, testUserId));
    await db.delete(wordbank).where(eq(wordbank.userId, testUserId));
  });

  it("should suggest words with 90%+ accuracy and 5+ reviews", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create word with high accuracy (9 correct, 1 incorrect = 90%)
    const [word1] = await db
      .insert(wordbank)
      .values({
        userId: testUserId,
        word: "high-accuracy-word",
        translation: "test",
        targetLanguage: testLanguage,
      })
      .$returningId();

    await db.insert(wordMastery).values({
      userId: testUserId,
      word: "high-accuracy-word",
      targetLanguage: testLanguage,
      easinessFactor: 1800, // Not yet mastered
      interval: 5,
      repetitions: 3,
      nextReviewDate: new Date(),
      lastReviewedAt: new Date(),
      correctCount: 9,
      incorrectCount: 1,
    });

    // Query for suggestions
    const suggestions = await db
      .select({
        id: wordbank.id,
        word: wordbank.word,
        correctCount: wordMastery.correctCount,
        incorrectCount: wordMastery.incorrectCount,
        accuracy: sql<number>`ROUND(${wordMastery.correctCount} * 100.0 / (${wordMastery.correctCount} + ${wordMastery.incorrectCount}), 1)`,
      })
      .from(wordbank)
      .innerJoin(
        wordMastery,
        and(
          eq(wordbank.userId, wordMastery.userId),
          eq(wordbank.word, wordMastery.word),
          eq(wordbank.targetLanguage, wordMastery.targetLanguage)
        )
      )
      .where(
        and(
          eq(wordbank.userId, testUserId),
          sql`(${wordMastery.correctCount} + ${wordMastery.incorrectCount}) >= 5`,
          sql`${wordMastery.correctCount} * 100.0 / (${wordMastery.correctCount} + ${wordMastery.incorrectCount}) >= 90`,
          sql`(${wordMastery.easinessFactor} < 2500 OR ${wordMastery.interval} < 30)`
        )
      );

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].word).toBe("high-accuracy-word");
    expect(suggestions[0].accuracy).toBe("90.0");
  });

  it("should NOT suggest words with less than 5 reviews", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create word with high accuracy but only 4 reviews
    await db.insert(wordbank).values({
      userId: testUserId,
      word: "insufficient-reviews",
      translation: "test",
      targetLanguage: testLanguage,
    });

    await db.insert(wordMastery).values({
      userId: testUserId,
      word: "insufficient-reviews",
      targetLanguage: testLanguage,
      easinessFactor: 1800,
      interval: 5,
      repetitions: 2,
      nextReviewDate: new Date(),
      lastReviewedAt: new Date(),
      correctCount: 4,
      incorrectCount: 0, // 100% accuracy but only 4 reviews
    });

    const suggestions = await db
      .select()
      .from(wordbank)
      .innerJoin(
        wordMastery,
        and(
          eq(wordbank.userId, wordMastery.userId),
          eq(wordbank.word, wordMastery.word),
          eq(wordbank.targetLanguage, wordMastery.targetLanguage)
        )
      )
      .where(
        and(
          eq(wordbank.userId, testUserId),
          sql`(${wordMastery.correctCount} + ${wordMastery.incorrectCount}) >= 5`,
          sql`${wordMastery.correctCount} * 100.0 / (${wordMastery.correctCount} + ${wordMastery.incorrectCount}) >= 90`,
          sql`(${wordMastery.easinessFactor} < 2500 OR ${wordMastery.interval} < 30)`
        )
      );

    expect(suggestions).toHaveLength(0);
  });

  it("should NOT suggest words with less than 90% accuracy", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create word with 80% accuracy (8 correct, 2 incorrect)
    await db.insert(wordbank).values({
      userId: testUserId,
      word: "low-accuracy-word",
      translation: "test",
      targetLanguage: testLanguage,
    });

    await db.insert(wordMastery).values({
      userId: testUserId,
      word: "low-accuracy-word",
      targetLanguage: testLanguage,
      easinessFactor: 1800,
      interval: 5,
      repetitions: 3,
      nextReviewDate: new Date(),
      lastReviewedAt: new Date(),
      correctCount: 8,
      incorrectCount: 2, // 80% accuracy
    });

    const suggestions = await db
      .select()
      .from(wordbank)
      .innerJoin(
        wordMastery,
        and(
          eq(wordbank.userId, wordMastery.userId),
          eq(wordbank.word, wordMastery.word),
          eq(wordbank.targetLanguage, wordMastery.targetLanguage)
        )
      )
      .where(
        and(
          eq(wordbank.userId, testUserId),
          sql`(${wordMastery.correctCount} + ${wordMastery.incorrectCount}) >= 5`,
          sql`${wordMastery.correctCount} * 100.0 / (${wordMastery.correctCount} + ${wordMastery.incorrectCount}) >= 90`,
          sql`(${wordMastery.easinessFactor} < 2500 OR ${wordMastery.interval} < 30)`
        )
      );

    expect(suggestions).toHaveLength(0);
  });

  it("should NOT suggest words already marked as mastered", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create word with high accuracy but already mastered
    await db.insert(wordbank).values({
      userId: testUserId,
      word: "already-mastered",
      translation: "test",
      targetLanguage: testLanguage,
    });

    await db.insert(wordMastery).values({
      userId: testUserId,
      word: "already-mastered",
      targetLanguage: testLanguage,
      easinessFactor: 2500, // Already mastered
      interval: 30, // Long interval
      repetitions: 10,
      nextReviewDate: new Date(),
      lastReviewedAt: new Date(),
      correctCount: 10,
      incorrectCount: 0,
    });

    const suggestions = await db
      .select()
      .from(wordbank)
      .innerJoin(
        wordMastery,
        and(
          eq(wordbank.userId, wordMastery.userId),
          eq(wordbank.word, wordMastery.word),
          eq(wordbank.targetLanguage, wordMastery.targetLanguage)
        )
      )
      .where(
        and(
          eq(wordbank.userId, testUserId),
          sql`(${wordMastery.correctCount} + ${wordMastery.incorrectCount}) >= 5`,
          sql`${wordMastery.correctCount} * 100.0 / (${wordMastery.correctCount} + ${wordMastery.incorrectCount}) >= 90`,
          sql`(${wordMastery.easinessFactor} < 2500 OR ${wordMastery.interval} < 30)`
        )
      );

    expect(suggestions).toHaveLength(0);
  });

  it("should order suggestions by accuracy (highest first)", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create three words with different accuracies
    await db.insert(wordbank).values([
      {
        userId: testUserId,
        word: "word-95-percent",
        translation: "test",
        targetLanguage: testLanguage,
      },
      {
        userId: testUserId,
        word: "word-90-percent",
        translation: "test",
        targetLanguage: testLanguage,
      },
      {
        userId: testUserId,
        word: "word-100-percent",
        translation: "test",
        targetLanguage: testLanguage,
      },
    ]);

    await db.insert(wordMastery).values([
      {
        userId: testUserId,
        word: "word-95-percent",
        targetLanguage: testLanguage,
        easinessFactor: 1800,
        interval: 5,
        repetitions: 3,
        nextReviewDate: new Date(),
        lastReviewedAt: new Date(),
        correctCount: 19,
        incorrectCount: 1, // 95%
      },
      {
        userId: testUserId,
        word: "word-90-percent",
        targetLanguage: testLanguage,
        easinessFactor: 1800,
        interval: 5,
        repetitions: 3,
        nextReviewDate: new Date(),
        lastReviewedAt: new Date(),
        correctCount: 9,
        incorrectCount: 1, // 90%
      },
      {
        userId: testUserId,
        word: "word-100-percent",
        targetLanguage: testLanguage,
        easinessFactor: 1800,
        interval: 5,
        repetitions: 3,
        nextReviewDate: new Date(),
        lastReviewedAt: new Date(),
        correctCount: 10,
        incorrectCount: 0, // 100%
      },
    ]);

    const suggestions = await db
      .select({
        word: wordbank.word,
        accuracy: sql<number>`ROUND(${wordMastery.correctCount} * 100.0 / (${wordMastery.correctCount} + ${wordMastery.incorrectCount}), 1)`,
      })
      .from(wordbank)
      .innerJoin(
        wordMastery,
        and(
          eq(wordbank.userId, wordMastery.userId),
          eq(wordbank.word, wordMastery.word),
          eq(wordbank.targetLanguage, wordMastery.targetLanguage)
        )
      )
      .where(
        and(
          eq(wordbank.userId, testUserId),
          sql`(${wordMastery.correctCount} + ${wordMastery.incorrectCount}) >= 5`,
          sql`${wordMastery.correctCount} * 100.0 / (${wordMastery.correctCount} + ${wordMastery.incorrectCount}) >= 90`,
          sql`(${wordMastery.easinessFactor} < 2500 OR ${wordMastery.interval} < 30)`
        )
      )
      .orderBy(sql`${wordMastery.correctCount} * 100.0 / (${wordMastery.correctCount} + ${wordMastery.incorrectCount}) DESC`);

    expect(suggestions).toHaveLength(3);
    expect(suggestions[0].word).toBe("word-100-percent");
    expect(suggestions[0].accuracy).toBe("100.0");
    expect(suggestions[1].word).toBe("word-95-percent");
    expect(suggestions[1].accuracy).toBe("95.0");
    expect(suggestions[2].word).toBe("word-90-percent");
    expect(suggestions[2].accuracy).toBe("90.0");
  });
});
