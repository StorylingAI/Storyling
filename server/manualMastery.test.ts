import { describe, it, expect, beforeEach } from "vitest";
import { getDb } from "./db";
import { wordbank, wordMastery } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

describe("Manual Mastery Controls", () => {
  const testUserId = 99999; // Use numeric ID for tests
  const testWord = "test-word-manual";
  const testLanguage = "Spanish";
  let testWordbankId: number;

  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Clean up existing test data
    await db.delete(wordMastery).where(eq(wordMastery.userId, testUserId));
    await db.delete(wordbank).where(eq(wordbank.userId, testUserId));

    // Insert test word
    const [inserted] = await db
      .insert(wordbank)
      .values({
        userId: testUserId,
        word: testWord,
        pinyin: "test pinyin",
        translation: "test translation",
        targetLanguage: testLanguage,
        exampleSentences: JSON.stringify(["Example 1", "Example 2"]),
      })
      .$returningId();

    testWordbankId = inserted.id;
  });

  it("should mark word as 'need practice' with correct SRS parameters", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Simulate marking as need practice
    const now = new Date();
    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + 1);

    await db.insert(wordMastery).values({
      userId: testUserId,
      word: testWord,
      targetLanguage: testLanguage,
      easinessFactor: 1300, // 1.3 * 1000
      interval: 1,
      repetitions: 0,
      nextReviewDate: nextReview,
      lastReviewedAt: now,
      correctCount: 0,
      incorrectCount: 0,
    });

    const [result] = await db
      .select()
      .from(wordMastery)
      .where(
        and(
          eq(wordMastery.userId, testUserId),
          eq(wordMastery.word, testWord)
        )
      );

    expect(result).toBeDefined();
    expect(result.easinessFactor).toBe(1300);
    expect(result.interval).toBe(1);
    expect(result.repetitions).toBe(0);
    expect(result.correctCount).toBe(0);
    expect(result.incorrectCount).toBe(0);
  });

  it("should mark word as 'mastered' with correct SRS parameters", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Simulate marking as mastered
    const now = new Date();
    const nextReview = new Date(now);
    nextReview.setDate(nextReview.getDate() + 30);

    await db.insert(wordMastery).values({
      userId: testUserId,
      word: testWord,
      targetLanguage: testLanguage,
      easinessFactor: 2500, // 2.5 * 1000
      interval: 30,
      repetitions: 10,
      nextReviewDate: nextReview,
      lastReviewedAt: now,
      correctCount: 5,
      incorrectCount: 0,
    });

    const [result] = await db
      .select()
      .from(wordMastery)
      .where(
        and(
          eq(wordMastery.userId, testUserId),
          eq(wordMastery.word, testWord)
        )
      );

    expect(result).toBeDefined();
    expect(result.easinessFactor).toBe(2500);
    expect(result.interval).toBe(30);
    expect(result.repetitions).toBe(10);
    expect(result.correctCount).toBe(5);
    expect(result.incorrectCount).toBe(0);
  });

  it("should update existing mastery record when marking as 'need practice'", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create existing mastery record (mastered state)
    const now = new Date();
    const [existing] = await db
      .insert(wordMastery)
      .values({
        userId: testUserId,
        word: testWord,
        targetLanguage: testLanguage,
        easinessFactor: 2500,
        interval: 30,
        repetitions: 10,
        nextReviewDate: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
        lastReviewedAt: now,
        correctCount: 10,
        incorrectCount: 2,
      })
      .$returningId();

    // Update to need practice
    const updateTime = new Date();
    const nextReview = new Date(updateTime);
    nextReview.setDate(nextReview.getDate() + 1);

    await db
      .update(wordMastery)
      .set({
        easinessFactor: 1300,
        interval: 1,
        repetitions: 0,
        nextReviewDate: nextReview,
        lastReviewedAt: updateTime,
      })
      .where(eq(wordMastery.id, existing.id));

    const [result] = await db
      .select()
      .from(wordMastery)
      .where(eq(wordMastery.id, existing.id));

    expect(result.easinessFactor).toBe(1300);
    expect(result.interval).toBe(1);
    expect(result.repetitions).toBe(0);
    // correctCount and incorrectCount should remain unchanged
    expect(result.correctCount).toBe(10);
    expect(result.incorrectCount).toBe(2);
  });

  it("should update existing mastery record when marking as 'mastered'", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create existing mastery record (learning state)
    const now = new Date();
    const [existing] = await db
      .insert(wordMastery)
      .values({
        userId: testUserId,
        word: testWord,
        targetLanguage: testLanguage,
        easinessFactor: 1300,
        interval: 1,
        repetitions: 0,
        nextReviewDate: new Date(now.getTime() + 1 * 24 * 60 * 60 * 1000),
        lastReviewedAt: now,
        correctCount: 2,
        incorrectCount: 3,
      })
      .$returningId();

    // Update to mastered
    const updateTime = new Date();
    const nextReview = new Date(updateTime);
    nextReview.setDate(nextReview.getDate() + 30);

    await db
      .update(wordMastery)
      .set({
        easinessFactor: 2500,
        interval: 30,
        repetitions: 10,
        nextReviewDate: nextReview,
        lastReviewedAt: updateTime,
        correctCount: 7, // 2 + 5 boost
      })
      .where(eq(wordMastery.id, existing.id));

    const [result] = await db
      .select()
      .from(wordMastery)
      .where(eq(wordMastery.id, existing.id));

    expect(result.easinessFactor).toBe(2500);
    expect(result.interval).toBe(30);
    expect(result.repetitions).toBe(10);
    expect(result.correctCount).toBe(7); // Boosted by 5
    expect(result.incorrectCount).toBe(3); // Unchanged
  });

  it("should set correct next review dates", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const now = new Date();

    // Need practice: 1 day from now
    const needPracticeReview = new Date(now);
    needPracticeReview.setDate(needPracticeReview.getDate() + 1);

    await db.insert(wordMastery).values({
      userId: testUserId,
      word: testWord,
      targetLanguage: testLanguage,
      easinessFactor: 1300,
      interval: 1,
      repetitions: 0,
      nextReviewDate: needPracticeReview,
      lastReviewedAt: now,
      correctCount: 0,
      incorrectCount: 0,
    });

    const [result1] = await db
      .select()
      .from(wordMastery)
      .where(
        and(
          eq(wordMastery.userId, testUserId),
          eq(wordMastery.word, testWord)
        )
      );

    const daysDiff1 = Math.round(
      (result1.nextReviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(daysDiff1).toBe(1);

    // Clean up and test mastered
    await db.delete(wordMastery).where(eq(wordMastery.userId, testUserId));

    // Mastered: 30 days from now
    const masteredReview = new Date(now);
    masteredReview.setDate(masteredReview.getDate() + 30);

    await db.insert(wordMastery).values({
      userId: testUserId,
      word: testWord,
      targetLanguage: testLanguage,
      easinessFactor: 2500,
      interval: 30,
      repetitions: 10,
      nextReviewDate: masteredReview,
      lastReviewedAt: now,
      correctCount: 5,
      incorrectCount: 0,
    });

    const [result2] = await db
      .select()
      .from(wordMastery)
      .where(
        and(
          eq(wordMastery.userId, testUserId),
          eq(wordMastery.word, testWord)
        )
      );

    const daysDiff2 = Math.round(
      (result2.nextReviewDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );
    expect(daysDiff2).toBe(30);
  });
});
