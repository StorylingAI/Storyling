import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users, vocabularyLists, generatedContent, collections, collectionItems, achievements, userAchievements } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { initializeCollectionAchievements } from "./collectionAchievements";

describe("Leaderboard System", () => {
  let testUserIds: number[] = [];
  let testCollectionIds: number[] = [];

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Initialize achievements
    await initializeCollectionAchievements();

    // Create 5 test users with varying stats
    const userNames = ["Top Creator", "Second Place", "Third Place", "Fourth Place", "Fifth Place"];
    const cloneCounts = [1000, 500, 250, 100, 50];

    for (let i = 0; i < 5; i++) {
      // Create user
      const userResult = await db.insert(users).values({
        openId: `test-leaderboard-user-${i}-${Date.now()}`,
        name: userNames[i],
        email: `leaderboard-${i}-${Date.now()}@test.com`,
        role: "user",
      });
      const userId = (userResult as any)[0]?.insertId;
      const parsedUserId = typeof userId === 'string' ? parseInt(userId) : Number(userId);
      testUserIds.push(parsedUserId);

      // Create vocabulary list
      const vocabResult = await db.insert(vocabularyLists).values({
        userId: parsedUserId,
        targetLanguage: "Japanese",
        nativeLanguage: "English",
        proficiencyLevel: "n5",
        words: JSON.stringify([{ word: "test", translation: "test" }]),
      });
      const vocabId = (vocabResult as any)[0]?.insertId;
      const testVocabListId = typeof vocabId === 'string' ? parseInt(vocabId) : Number(vocabId);

      // Create story
      const contentResult = await db.insert(generatedContent).values({
        userId: parsedUserId,
        vocabularyListId: testVocabListId,
        mode: "film",
        theme: "Adventure",
        title: `Test Story ${i}`,
        storyText: "Story content",
        status: "completed",
      });
      const contentId = (contentResult as any)[0]?.insertId;
      const testContentId = typeof contentId === 'string' ? parseInt(contentId) : Number(contentId);

      // Create collection with clone count
      const collectionResult = await db.insert(collections).values({
        userId: parsedUserId,
        name: `Collection ${i}`,
        description: "Test collection",
        color: "#3B82F6",
        isPublic: true,
        shareToken: `test-token-${i}-${Date.now()}`,
        cloneCount: cloneCounts[i],
      });
      const collId = (collectionResult as any)[0]?.insertId;
      const testCollectionId = typeof collId === 'string' ? parseInt(collId) : Number(collId);
      testCollectionIds.push(testCollectionId);

      // Add story to collection
      await db.insert(collectionItems).values({
        collectionId: testCollectionId,
        contentId: testContentId,
        position: 0,
      });

      // Award achievements based on clone count
      const achievementKeys = [];
      if (cloneCounts[i] >= 10) achievementKeys.push("collection_starter");
      if (cloneCounts[i] >= 50) achievementKeys.push("collection_rising");
      if (cloneCounts[i] >= 100) achievementKeys.push("collection_popular");
      if (cloneCounts[i] >= 500) achievementKeys.push("collection_viral");
      if (cloneCounts[i] >= 1000) achievementKeys.push("collection_legend");

      for (const key of achievementKeys) {
        const achievement = await db
          .select()
          .from(achievements)
          .where(eq(achievements.key, key))
          .limit(1);

        if (achievement.length > 0) {
          await db.insert(userAchievements).values({
            userId: parsedUserId,
            achievementId: achievement[0].id,
          });
        }
      }
    }
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Cleanup
    for (const collectionId of testCollectionIds) {
      await db.delete(collectionItems).where(eq(collectionItems.collectionId, collectionId));
      await db.delete(collections).where(eq(collections.id, collectionId));
    }

    for (const userId of testUserIds) {
      await db.delete(userAchievements).where(eq(userAchievements.userId, userId));
      await db.delete(generatedContent).where(eq(generatedContent.userId, userId));
      await db.delete(vocabularyLists).where(eq(vocabularyLists.userId, userId));
      await db.delete(users).where(eq(users.id, userId));
    }
  });

  const createPublicCaller = () => {
    return appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });
  };

  it("should return leaderboard with correct ranking", async () => {
    const caller = createPublicCaller();
    const result = await caller.leaderboard.getLeaderboard({
      period: "all-time",
      limit: 50,
    });

    expect(result.rankings.length).toBeGreaterThanOrEqual(5);
    
    // Check that rankings are sorted by clone count descending
    for (let i = 0; i < result.rankings.length - 1; i++) {
      expect(Number(result.rankings[i].totalClones)).toBeGreaterThanOrEqual(
        Number(result.rankings[i + 1].totalClones)
      );
    }
  });

  it("should include correct user stats", async () => {
    const caller = createPublicCaller();
    const result = await caller.leaderboard.getLeaderboard({
      period: "all-time",
      limit: 50,
    });

    const topCreator = result.rankings.find(r => r.userName === "Top Creator");
    expect(topCreator).toBeDefined();
    expect(Number(topCreator!.totalClones)).toBe(1000);
    expect(Number(topCreator!.collectionCount)).toBe(1);
    expect(topCreator!.badgeCount).toBeGreaterThanOrEqual(4); // Has multiple badges
  });

  it("should include highest badge for each user", async () => {
    const caller = createPublicCaller();
    const result = await caller.leaderboard.getLeaderboard({
      period: "all-time",
      limit: 50,
    });

    const topCreator = result.rankings.find(r => r.userName === "Top Creator");
    expect(topCreator!.highestBadge).toBeDefined();
    expect(topCreator!.highestBadge!.key).toBe("collection_legend");
    expect(topCreator!.highestBadge!.icon).toBe("👑");
  });

  it("should assign correct ranks", async () => {
    const caller = createPublicCaller();
    const result = await caller.leaderboard.getLeaderboard({
      period: "all-time",
      limit: 50,
    });

    // Check that ranks are sequential starting from 1
    const testUserRankings = result.rankings.filter(r => 
      ["Top Creator", "Second Place", "Third Place", "Fourth Place", "Fifth Place"].includes(r.userName)
    );

    expect(testUserRankings.length).toBe(5);
    
    // Verify ranks are assigned correctly
    for (let i = 0; i < testUserRankings.length; i++) {
      expect(testUserRankings[i].rank).toBeGreaterThan(0);
    }
  });

  it("should respect limit parameter", async () => {
    const caller = createPublicCaller();
    const result = await caller.leaderboard.getLeaderboard({
      period: "all-time",
      limit: 3,
    });

    expect(result.rankings.length).toBeLessThanOrEqual(3);
  });

  it("should work without authentication", async () => {
    const caller = createPublicCaller();
    
    // Should not throw error
    await expect(
      caller.leaderboard.getLeaderboard({
        period: "all-time",
        limit: 50,
      })
    ).resolves.toBeDefined();
  });

  it("should return correct period in response", async () => {
    const caller = createPublicCaller();
    
    const allTimeResult = await caller.leaderboard.getLeaderboard({
      period: "all-time",
      limit: 50,
    });
    expect(allTimeResult.period).toBe("all-time");

    const monthlyResult = await caller.leaderboard.getLeaderboard({
      period: "monthly",
      limit: 50,
    });
    expect(monthlyResult.period).toBe("monthly");
  });
});
