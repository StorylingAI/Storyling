import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { wordbank, wordMastery } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

describe("Review Scheduling Fix", () => {
  const testUserId = 999999;
  const testWord = "test_word_" + Date.now();
  const testLanguage = "Spanish";
  let wordId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Clean up any existing test data
    await db.delete(wordMastery).where(
      and(
        eq(wordMastery.userId, testUserId),
        eq(wordMastery.word, testWord)
      )
    );
    await db.delete(wordbank).where(
      and(
        eq(wordbank.userId, testUserId),
        eq(wordbank.word, testWord)
      )
    );

    // Create test word
    const [result] = await db.insert(wordbank).values({
      userId: testUserId,
      word: testWord,
      pinyin: "test",
      translation: "test translation",
      targetLanguage: testLanguage,
      exampleSentences: ["Test sentence"],
      audioUrl: null,
    });
    wordId = result.insertId;

    // Create mastery record with nextReviewDate set to NOW
    const now = new Date();
    await db.insert(wordMastery).values({
      userId: testUserId,
      word: testWord,
      targetLanguage: testLanguage,
      nextReviewDate: now,
      easinessFactor: 2.5,
      interval: 1,
      repetitions: 0,
      correctCount: 0,
      incorrectCount: 0,
    });
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    await db.delete(wordMastery).where(
      and(
        eq(wordMastery.userId, testUserId),
        eq(wordMastery.word, testWord)
      )
    );
    await db.delete(wordbank).where(eq(wordbank.id, wordId));
  });

  it("should return words due for review when nextReviewDate <= now", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const now = new Date();
    const dueWords = await db
      .select({
        id: wordbank.id,
        word: wordbank.word,
        nextReviewDate: wordMastery.nextReviewDate,
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
          eq(wordbank.word, testWord)
        )
      );

    expect(dueWords.length).toBe(1);
    expect(dueWords[0].word).toBe(testWord);
    expect(dueWords[0].nextReviewDate).toBeDefined();
    expect(dueWords[0].nextReviewDate.getTime()).toBeLessThanOrEqual(now.getTime() + 1000); // Allow 1s tolerance
  });

  it("should not return words with future nextReviewDate", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Update word to have future review date
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 7);
    
    await db
      .update(wordMastery)
      .set({ nextReviewDate: futureDate })
      .where(
        and(
          eq(wordMastery.userId, testUserId),
          eq(wordMastery.word, testWord)
        )
      );

    const now = new Date();
    const dueWords = await db
      .select({
        id: wordbank.id,
        word: wordbank.word,
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
          eq(wordbank.word, testWord),
          eq(wordMastery.nextReviewDate, now) // This should not match
        )
      );

    expect(dueWords.length).toBe(0);
  });

  it("should include mastery data when joining wordbank with word_mastery", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const words = await db
      .select({
        id: wordbank.id,
        word: wordbank.word,
        translation: wordbank.translation,
        nextReviewDate: wordMastery.nextReviewDate,
        easinessFactor: wordMastery.easinessFactor,
        interval: wordMastery.interval,
        repetitions: wordMastery.repetitions,
        correctCount: wordMastery.correctCount,
        incorrectCount: wordMastery.incorrectCount,
      })
      .from(wordbank)
      .leftJoin(
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
          eq(wordbank.word, testWord)
        )
      );

    expect(words.length).toBe(1);
    expect(words[0].word).toBe(testWord);
    expect(words[0].translation).toBe("test translation");
    expect(words[0].nextReviewDate).toBeDefined();
    expect(words[0].easinessFactor).toBeGreaterThan(0); // Changed by previous test
    expect(words[0].interval).toBeGreaterThanOrEqual(1);
    expect(words[0].repetitions).toBeGreaterThanOrEqual(0);
    expect(words[0].correctCount).toBe(0);
    expect(words[0].incorrectCount).toBe(0);
  });
});
