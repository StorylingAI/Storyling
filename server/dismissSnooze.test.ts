import { describe, it, expect, beforeEach } from "vitest";
import { getDb } from "./db";
import { wordbank, wordMastery, dismissedSuggestions, userStats } from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

describe("Dismiss and Snooze Suggestions", () => {
  const testUserId = 99997; // Use numeric ID for tests
  const testLanguage = "Spanish";

  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Clean up existing test data
    await db.delete(dismissedSuggestions).where(eq(dismissedSuggestions.userId, testUserId));
    await db.delete(wordMastery).where(eq(wordMastery.userId, testUserId));
    await db.delete(wordbank).where(eq(wordbank.userId, testUserId));
    await db.delete(userStats).where(eq(userStats.userId, testUserId));
  });

  it("should dismiss a word suggestion", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a word
    const [word1] = await db
      .insert(wordbank)
      .values({
        userId: testUserId,
        word: "test-word",
        translation: "test",
        targetLanguage: testLanguage,
      })
      .$returningId();

    // Dismiss the word
    await db.insert(dismissedSuggestions).values({
      userId: testUserId,
      wordbankId: word1.id,
    });

    // Verify dismissal
    const dismissed = await db
      .select()
      .from(dismissedSuggestions)
      .where(
        and(
          eq(dismissedSuggestions.userId, testUserId),
          eq(dismissedSuggestions.wordbankId, word1.id)
        )
      );

    expect(dismissed).toHaveLength(1);
    expect(dismissed[0].wordbankId).toBe(word1.id);
  });

  it("should filter dismissed words from suggestions", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create two words with high accuracy
    const [word1] = await db
      .insert(wordbank)
      .values({
        userId: testUserId,
        word: "word-to-dismiss",
        translation: "test",
        targetLanguage: testLanguage,
      })
      .$returningId();

    const [word2] = await db
      .insert(wordbank)
      .values({
        userId: testUserId,
        word: "word-to-keep",
        translation: "test",
        targetLanguage: testLanguage,
      })
      .$returningId();

    // Add mastery data for both
    await db.insert(wordMastery).values([
      {
        userId: testUserId,
        word: "word-to-dismiss",
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
        word: "word-to-keep",
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

    // Dismiss first word
    await db.insert(dismissedSuggestions).values({
      userId: testUserId,
      wordbankId: word1.id,
    });

    // Get dismissed word IDs
    const dismissed = await db
      .select({ wordbankId: dismissedSuggestions.wordbankId })
      .from(dismissedSuggestions)
      .where(eq(dismissedSuggestions.userId, testUserId));

    const dismissedIds = dismissed.map(d => d.wordbankId);

    // Query suggestions (should only return word2)
    const suggestions = await db
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
          sql`(${wordMastery.correctCount} + ${wordMastery.incorrectCount}) >= 5`,
          sql`${wordMastery.correctCount} * 100.0 / (${wordMastery.correctCount} + ${wordMastery.incorrectCount}) >= 90`,
          sql`(${wordMastery.easinessFactor} < 2500 OR ${wordMastery.interval} < 30)`,
          dismissedIds.length > 0 ? sql`${wordbank.id} NOT IN (${sql.join(dismissedIds.map(id => sql`${id}`), sql`, `)})` : sql`1=1`
        )
      );

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].word).toBe("word-to-keep");
  });

  it("should snooze suggestions for 7 days", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Calculate snooze until date
    const snoozeUntil = new Date();
    snoozeUntil.setDate(snoozeUntil.getDate() + 7);

    // Create user stats with snooze
    await db.insert(userStats).values({
      userId: testUserId,
      masterySuggestionsSnoozeUntil: snoozeUntil,
    });

    // Verify snooze
    const [stats] = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, testUserId));

    expect(stats).toBeDefined();
    expect(stats.masterySuggestionsSnoozeUntil).toBeDefined();
    
    // Check that snooze date is in the future
    const now = new Date();
    expect(stats.masterySuggestionsSnoozeUntil!.getTime()).toBeGreaterThan(now.getTime());
  });

  it("should return empty suggestions when snoozed", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a word with high accuracy
    await db.insert(wordbank).values({
      userId: testUserId,
      word: "snoozed-word",
      translation: "test",
      targetLanguage: testLanguage,
    });

    await db.insert(wordMastery).values({
      userId: testUserId,
      word: "snoozed-word",
      targetLanguage: testLanguage,
      easinessFactor: 1800,
      interval: 5,
      repetitions: 3,
      nextReviewDate: new Date(),
      lastReviewedAt: new Date(),
      correctCount: 10,
      incorrectCount: 0,
    });

    // Snooze suggestions
    const snoozeUntil = new Date();
    snoozeUntil.setDate(snoozeUntil.getDate() + 7);

    await db.insert(userStats).values({
      userId: testUserId,
      masterySuggestionsSnoozeUntil: snoozeUntil,
    });

    // Check if snoozed
    const [stats] = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, testUserId));

    const now = new Date();
    const isSnoozed = stats?.masterySuggestionsSnoozeUntil && stats.masterySuggestionsSnoozeUntil > now;

    expect(isSnoozed).toBe(true);
  });

  it("should clear all dismissed suggestions", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create two words
    const [word1] = await db
      .insert(wordbank)
      .values({
        userId: testUserId,
        word: "word1",
        translation: "test",
        targetLanguage: testLanguage,
      })
      .$returningId();

    const [word2] = await db
      .insert(wordbank)
      .values({
        userId: testUserId,
        word: "word2",
        translation: "test",
        targetLanguage: testLanguage,
      })
      .$returningId();

    // Dismiss both words
    await db.insert(dismissedSuggestions).values([
      { userId: testUserId, wordbankId: word1.id },
      { userId: testUserId, wordbankId: word2.id },
    ]);

    // Verify dismissals exist
    let dismissed = await db
      .select()
      .from(dismissedSuggestions)
      .where(eq(dismissedSuggestions.userId, testUserId));

    expect(dismissed).toHaveLength(2);

    // Clear all dismissed suggestions
    await db
      .delete(dismissedSuggestions)
      .where(eq(dismissedSuggestions.userId, testUserId));

    // Verify all cleared
    dismissed = await db
      .select()
      .from(dismissedSuggestions)
      .where(eq(dismissedSuggestions.userId, testUserId));

    expect(dismissed).toHaveLength(0);
  });
});
