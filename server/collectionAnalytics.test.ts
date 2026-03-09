import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import {
  users,
  collections,
  collectionItems,
  generatedContent,
  vocabularyLists,
  collectionViewAnalytics,
  collectionCloneAnalytics,
  collectionShareEvents,
} from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Collection Analytics Router", () => {
  let testUserId: number;
  let testCollectionId: number;
  let similarCollectionId: number;
  let testContentId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Create test user
    const [user] = await db
      .insert(users)
      .values({
        openId: `test-analytics-${Date.now()}`,
        name: "Analytics Test User",
        email: "analytics@test.com",
      })
      .$returningId();
    testUserId = user.id;

    // Create vocabulary list
    const [vocabList] = await db
      .insert(vocabularyLists)
      .values({
        userId: testUserId,
        targetLanguage: "Spanish",
        proficiencyLevel: "B1",
        words: "hola,adiós,gracias",
      })
      .$returningId();

    // Create test content
    const [content] = await db
      .insert(generatedContent)
      .values({
        userId: testUserId,
        vocabularyListId: vocabList.id,
        mode: "podcast",
        theme: "Adventure",
        storyText: "Test story text",
        difficultyLevel: "B1",
        status: "completed",
      })
      .$returningId();
    testContentId = content.id;

    // Create test collection
    const [collection] = await db
      .insert(collections)
      .values({
        userId: testUserId,
        name: "Test Collection",
        description: "Test description",
        isPublic: true,
        shareToken: `test-token-${Date.now()}`,
        viewCount: 150,
        cloneCount: 25,
      })
      .$returningId();
    testCollectionId = collection.id;

    // Add item to collection
    await db.insert(collectionItems).values({
      collectionId: testCollectionId,
      contentId: testContentId,
      position: 0,
    });

    // Create similar collection (same language and theme)
    const [vocabList2] = await db
      .insert(vocabularyLists)
      .values({
        userId: testUserId,
        targetLanguage: "Spanish",
        proficiencyLevel: "B1",
        words: "casa,perro,gato",
      })
      .$returningId();

    const [content2] = await db
      .insert(generatedContent)
      .values({
        userId: testUserId,
        vocabularyListId: vocabList2.id,
        mode: "podcast",
        theme: "Adventure",
        storyText: "Similar story text",
        difficultyLevel: "B1",
        status: "completed",
      })
      .$returningId();

    const [similarCollection] = await db
      .insert(collections)
      .values({
        userId: testUserId,
        name: "Similar Collection",
        description: "Similar description",
        isPublic: true,
        shareToken: `similar-token-${Date.now()}`,
        viewCount: 100,
        cloneCount: 10,
      })
      .$returningId();
    similarCollectionId = similarCollection.id;

    await db.insert(collectionItems).values({
      collectionId: similarCollectionId,
      contentId: content2.id,
      position: 0,
    });

    // Add analytics data
    const today = new Date().toISOString().split("T")[0];
    await db.insert(collectionViewAnalytics).values({
      collectionId: testCollectionId,
      viewDate: today,
      viewCount: 50,
      uniqueViewers: 30,
    });

    await db.insert(collectionCloneAnalytics).values({
      collectionId: testCollectionId,
      cloneDate: today,
      cloneCount: 5,
    });
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    await db.delete(collectionShareEvents).where(eq(collectionShareEvents.collectionId, testCollectionId));
    await db.delete(collectionViewAnalytics).where(eq(collectionViewAnalytics.collectionId, testCollectionId));
    await db.delete(collectionCloneAnalytics).where(eq(collectionCloneAnalytics.collectionId, testCollectionId));
    await db.delete(collectionItems).where(eq(collectionItems.collectionId, testCollectionId));
    await db.delete(collectionItems).where(eq(collectionItems.collectionId, similarCollectionId));
    await db.delete(collections).where(eq(collections.id, testCollectionId));
    await db.delete(collections).where(eq(collections.id, similarCollectionId));
    await db.delete(generatedContent).where(eq(generatedContent.userId, testUserId));
    await db.delete(vocabularyLists).where(eq(vocabularyLists.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it("should get similar collections based on language, theme, and difficulty", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.collectionAnalytics.getSimilarCollections({
      collectionId: testCollectionId,
      limit: 6,
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    
    // Should find the similar collection
    const foundSimilar = result.find((c) => c.id === similarCollectionId);
    expect(foundSimilar).toBeDefined();
    if (foundSimilar) {
      expect(foundSimilar.name).toBe("Similar Collection");
      expect(foundSimilar.similarityScore).toBeGreaterThan(0);
    }
  });

  it("should get creator dashboard with analytics", async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, openId: "test", name: "Test", role: "user" },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.collectionAnalytics.getCreatorDashboard();

    expect(result).toBeDefined();
    expect(result.collections.length).toBeGreaterThan(0);
    expect(result.totalViews).toBeGreaterThanOrEqual(150);
    expect(result.totalClones).toBeGreaterThanOrEqual(25);
    expect(Array.isArray(result.viewTrends)).toBe(true);
    expect(Array.isArray(result.cloneTrends)).toBe(true);
    expect(Array.isArray(result.topCollections)).toBe(true);
    
    // Should have next milestone
    expect(result.nextMilestone).toBeDefined();
    if (result.nextMilestone) {
      expect(result.nextMilestone.label).toBeDefined();
      expect(typeof result.nextMilestone.viewsProgress).toBe("number");
      expect(typeof result.nextMilestone.clonesProgress).toBe("number");
    }
  });

  it("should track share events", async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, openId: "test", name: "Test", role: "user" },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.collectionAnalytics.trackShare({
      collectionId: testCollectionId,
      platform: "twitter",
    });

    expect(result.success).toBe(true);

    // Verify share was tracked
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const shares = await db
      .select()
      .from(collectionShareEvents)
      .where(eq(collectionShareEvents.collectionId, testCollectionId));

    expect(shares.length).toBeGreaterThan(0);
    const twitterShare = shares.find((s) => s.platform === "twitter");
    expect(twitterShare).toBeDefined();
  });

  it("should get share statistics", async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, openId: "test", name: "Test", role: "user" },
      req: {} as any,
      res: {} as any,
    });

    // Track multiple shares
    await caller.collectionAnalytics.trackShare({
      collectionId: testCollectionId,
      platform: "linkedin",
    });

    await caller.collectionAnalytics.trackShare({
      collectionId: testCollectionId,
      platform: "facebook",
    });

    const result = await caller.collectionAnalytics.getShareStats({
      collectionId: testCollectionId,
    });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
    
    // Should have stats for different platforms
    const platforms = result.map((s) => s.platform);
    expect(platforms).toContain("twitter");
    expect(platforms).toContain("linkedin");
    expect(platforms).toContain("facebook");
  });

  it("should rank collections by similarity score correctly", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Create a collection with completely different attributes
    const [vocabList] = await db
      .insert(vocabularyLists)
      .values({
        userId: testUserId,
        targetLanguage: "Japanese",
        proficiencyLevel: "A1",
        words: "こんにちは,さようなら",
      })
      .$returningId();

    const [content] = await db
      .insert(generatedContent)
      .values({
        userId: testUserId,
        vocabularyListId: vocabList.id,
        mode: "film",
        theme: "Horror",
        storyText: "Different story",
        difficultyLevel: "A1",
        status: "completed",
      })
      .$returningId();

    const [differentCollection] = await db
      .insert(collections)
      .values({
        userId: testUserId,
        name: "Different Collection",
        isPublic: true,
        shareToken: `different-token-${Date.now()}`,
      })
      .$returningId();

    await db.insert(collectionItems).values({
      collectionId: differentCollection.id,
      contentId: content.id,
      position: 0,
    });

    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.collectionAnalytics.getSimilarCollections({
      collectionId: differentCollection.id,
      limit: 6,
    });

    // Spanish Adventure collections should have low similarity scores to Japanese Horror
    // (only popularity bonus, no language/theme/difficulty match)
    const spanishAdventure = result.find(
      (c) => c.id === testCollectionId || c.id === similarCollectionId
    );
    
    // If found, should have very low similarity score (< 2, mostly from popularity)
    if (spanishAdventure) {
      expect(spanishAdventure.similarityScore).toBeLessThan(2);
    }

    // Clean up
    await db.delete(collectionItems).where(eq(collectionItems.collectionId, differentCollection.id));
    await db.delete(collections).where(eq(collections.id, differentCollection.id));
    await db.delete(generatedContent).where(eq(generatedContent.id, content.id));
    await db.delete(vocabularyLists).where(eq(vocabularyLists.id, vocabList.id));
  });
});
