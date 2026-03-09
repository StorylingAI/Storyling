import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users, vocabularyLists, generatedContent } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Difficulty Progression", () => {
  let testUserId: number;
  let testVocabListId: number;
  const testContext = {
    user: {
      id: 0,
      openId: "test-user-difficulty-progression",
      name: "Test User",
      role: "user" as const,
    },
  };

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test user
    const [user] = await db
      .insert(users)
      .values({
        openId: "test-user-difficulty-progression",
        name: "Test User",
        role: "user",
      })
      .$returningId();

    testUserId = user.id;
    testContext.user.id = testUserId;

    // Create test vocabulary list
    const [vocabList] = await db
      .insert(vocabularyLists)
      .values({
        userId: testUserId,
        targetLanguage: "Spanish",
        proficiencyLevel: "B1",
        words: "test1, test2, test3",
      })
      .$returningId();

    testVocabListId = vocabList.id;

    // Create test stories with different difficulty levels and dates
    const now = new Date();
    const oneMonthAgo = new Date(now);
    oneMonthAgo.setMonth(oneMonthAgo.getMonth() - 1);
    const twoMonthsAgo = new Date(now);
    twoMonthsAgo.setMonth(twoMonthsAgo.getMonth() - 2);

    await db.insert(generatedContent).values([
      {
        userId: testUserId,
        vocabularyListId: testVocabListId,
        mode: "podcast",
        theme: "Adventure",
        storyText: "Test story A1",
        status: "completed",
        difficultyLevel: "A1",
        generatedAt: twoMonthsAgo,
      },
      {
        userId: testUserId,
        vocabularyListId: testVocabListId,
        mode: "podcast",
        theme: "Adventure",
        storyText: "Test story A1 #2",
        status: "completed",
        difficultyLevel: "A1",
        generatedAt: twoMonthsAgo,
      },
      {
        userId: testUserId,
        vocabularyListId: testVocabListId,
        mode: "podcast",
        theme: "Adventure",
        storyText: "Test story A2",
        status: "completed",
        difficultyLevel: "A2",
        generatedAt: oneMonthAgo,
      },
      {
        userId: testUserId,
        vocabularyListId: testVocabListId,
        mode: "film",
        theme: "Adventure",
        storyText: "Test story B1",
        status: "completed",
        difficultyLevel: "B1",
        generatedAt: now,
      },
      {
        userId: testUserId,
        vocabularyListId: testVocabListId,
        mode: "film",
        theme: "Adventure",
        storyText: "Test story B1 #2",
        status: "completed",
        difficultyLevel: "B1",
        generatedAt: now,
      },
      {
        userId: testUserId,
        vocabularyListId: testVocabListId,
        mode: "film",
        theme: "Adventure",
        storyText: "Test story C1",
        status: "pending",
        difficultyLevel: "C1",
        generatedAt: now,
      },
    ]);
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    await db.delete(generatedContent).where(eq(generatedContent.userId, testUserId));
    await db.delete(vocabularyLists).where(eq(vocabularyLists.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  describe("getDifficultyProgression", () => {
    it("should fetch difficulty progression data", async () => {
      const caller = appRouter.createCaller(testContext);
      const result = await caller.progress.getDifficultyProgression({});

      expect(result).toBeDefined();
      expect(result.totalStories).toBeGreaterThanOrEqual(5);
      expect(result.difficultyDistribution).toBeDefined();
      expect(result.progressionTimeline).toBeDefined();
    });

    it("should calculate difficulty distribution correctly", async () => {
      const caller = appRouter.createCaller(testContext);
      const result = await caller.progress.getDifficultyProgression({});

      // Should have A1, A2, and B1 (C1 is pending, so excluded)
      expect(result.difficultyDistribution["A1"]).toBe(2);
      expect(result.difficultyDistribution["A2"]).toBe(1);
      expect(result.difficultyDistribution["B1"]).toBe(2);
      expect(result.difficultyDistribution["C1"]).toBeUndefined(); // pending story excluded
    });

    it("should identify current level correctly", async () => {
      const caller = appRouter.createCaller(testContext);
      const result = await caller.progress.getDifficultyProgression({});

      // Most recent completed story is B1
      expect(result.currentLevel).toBe("B1");
    });

    it("should identify highest level achieved", async () => {
      const caller = appRouter.createCaller(testContext);
      const result = await caller.progress.getDifficultyProgression({});

      // Highest completed level is B1
      expect(result.highestLevel).toBe("B1");
    });

    it("should group stories by month in timeline", async () => {
      const caller = appRouter.createCaller(testContext);
      const result = await caller.progress.getDifficultyProgression({});

      // Should have at least 2 months of data
      expect(result.progressionTimeline.length).toBeGreaterThanOrEqual(2);

      // Each timeline entry should have month and difficulties
      result.progressionTimeline.forEach(entry => {
        expect(entry.month).toBeDefined();
        expect(entry.month).toMatch(/^\d{4}-\d{2}$/); // YYYY-MM format
        expect(entry.difficulties).toBeDefined();
        expect(typeof entry.difficulties).toBe("object");
      });
    });

    it("should filter by target language", async () => {
      const caller = appRouter.createCaller(testContext);
      const result = await caller.progress.getDifficultyProgression({
        targetLanguage: "Spanish",
      });

      expect(result.totalStories).toBeGreaterThanOrEqual(5);

      // Try with non-existent language
      const emptyResult = await caller.progress.getDifficultyProgression({
        targetLanguage: "French",
      });

      expect(emptyResult.totalStories).toBe(0);
      expect(Object.keys(emptyResult.difficultyDistribution).length).toBe(0);
    });

    it("should exclude stories without difficulty levels", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Create a story without difficulty level
      await db.insert(generatedContent).values({
        userId: testUserId,
        vocabularyListId: testVocabListId,
        mode: "podcast",
        theme: "Adventure",
        storyText: "Test story without difficulty",
        status: "completed",
        difficultyLevel: null,
        generatedAt: new Date(),
      });

      const caller = appRouter.createCaller(testContext);
      const result = await caller.progress.getDifficultyProgression({});

      // Should still be 5 (not 6, because the new one has no difficulty)
      expect(result.totalStories).toBe(5);
    });

    it("should handle empty progression data", async () => {
      const emptyContext = {
        user: {
          id: 999999,
          openId: "non-existent-user",
          name: "Non-existent User",
          role: "user" as const,
        },
      };

      const caller = appRouter.createCaller(emptyContext);
      const result = await caller.progress.getDifficultyProgression({});

      expect(result.totalStories).toBe(0);
      expect(Object.keys(result.difficultyDistribution).length).toBe(0);
      expect(result.progressionTimeline.length).toBe(0);
      expect(result.currentLevel).toBeNull();
      expect(result.highestLevel).toBeNull();
    });
  });
});
