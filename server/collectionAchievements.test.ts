import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users, vocabularyLists, generatedContent, collections, collectionItems, achievements, userAchievements } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { initializeCollectionAchievements, checkAndAwardCollectionAchievements, COLLECTION_ACHIEVEMENTS } from "./collectionAchievements";

describe("Collection Achievement System", () => {
  let testUserId: number;
  let cloningUserId: number;
  let testCollectionId: number;
  let testContentId: number;
  let shareToken: string;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Initialize collection achievements
    await initializeCollectionAchievements();

    // Create collection owner
    const userResult = await db.insert(users).values({
      openId: `test-ach-owner-${Date.now()}`,
      name: "Achievement Owner",
      email: `ach-owner-${Date.now()}@test.com`,
      role: "user",
    });
    const userId = (userResult as any)[0]?.insertId;
    testUserId = typeof userId === 'string' ? parseInt(userId) : Number(userId);

    // Create cloning user
    const cloningUserResult = await db.insert(users).values({
      openId: `test-ach-cloner-${Date.now()}`,
      name: "Achievement Cloner",
      email: `ach-cloner-${Date.now()}@test.com`,
      role: "user",
    });
    const cloningId = (cloningUserResult as any)[0]?.insertId;
    cloningUserId = typeof cloningId === 'string' ? parseInt(cloningId) : Number(cloningId);

    // Create test vocabulary list
    const vocabResult = await db.insert(vocabularyLists).values({
      userId: testUserId,
      targetLanguage: "Japanese",
      nativeLanguage: "English",
      proficiencyLevel: "n5",
      words: JSON.stringify([{ word: "こんにちは", translation: "hello" }]),
    });
    const vocabId = (vocabResult as any)[0]?.insertId;
    const testVocabListId = typeof vocabId === 'string' ? parseInt(vocabId) : Number(vocabId);

    // Create test story
    const contentResult = await db.insert(generatedContent).values({
      userId: testUserId,
      vocabularyListId: testVocabListId,
      mode: "film",
      theme: "Adventure",
      title: "Test Story",
      storyText: "Story content",
      status: "completed",
    });
    const contentId = (contentResult as any)[0]?.insertId;
    testContentId = typeof contentId === 'string' ? parseInt(contentId) : Number(contentId);

    // Create test collection
    const collectionResult = await db.insert(collections).values({
      userId: testUserId,
      name: "Achievement Test Collection",
      description: "For testing achievements",
      color: "#3B82F6",
      isPublic: true,
      shareToken: `ach-test-${Date.now()}`,
      cloneCount: 0,
    });
    const collId = (collectionResult as any)[0]?.insertId;
    testCollectionId = typeof collId === 'string' ? parseInt(collId) : Number(collId);

    // Get the actual share token
    const collectionData = await db
      .select()
      .from(collections)
      .where(eq(collections.id, testCollectionId))
      .limit(1);
    shareToken = collectionData[0].shareToken!;

    // Add story to collection
    await db.insert(collectionItems).values({
      collectionId: testCollectionId,
      contentId: testContentId,
      position: 0,
    });
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Cleanup user achievements
    await db.delete(userAchievements).where(eq(userAchievements.userId, testUserId));

    // Cleanup collections
    const userCollections = await db
      .select()
      .from(collections)
      .where(eq(collections.userId, cloningUserId));
    
    for (const collection of userCollections) {
      await db.delete(collectionItems).where(eq(collectionItems.collectionId, collection.id));
    }

    await db.delete(collectionItems).where(eq(collectionItems.collectionId, testCollectionId));
    await db.delete(collections).where(eq(collections.userId, testUserId));
    await db.delete(collections).where(eq(collections.userId, cloningUserId));
    await db.delete(generatedContent).where(eq(generatedContent.userId, testUserId));
    await db.delete(vocabularyLists).where(eq(vocabularyLists.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
    await db.delete(users).where(eq(users.id, cloningUserId));
  });

  const createCloningCaller = () => {
    return appRouter.createCaller({
      user: { id: cloningUserId, openId: `test-ach-cloner-${cloningUserId}`, name: "Achievement Cloner", role: "user" },
      req: {} as any,
      res: {} as any,
    });
  };

  it("should have initialized collection achievements", async () => {
    const db = await getDb();
    const collectionAchievements = await db!
      .select()
      .from(achievements)
      .where(eq(achievements.category, "collections"));

    expect(collectionAchievements.length).toBeGreaterThanOrEqual(6);
  });

  it("should not award achievement below threshold", async () => {
    const newAchievements = await checkAndAwardCollectionAchievements(
      testCollectionId,
      testUserId,
      5 // Below 10 threshold
    );

    expect(newAchievements.length).toBe(0);
  });

  it("should award first achievement at 10 clones", async () => {
    const newAchievements = await checkAndAwardCollectionAchievements(
      testCollectionId,
      testUserId,
      10
    );

    expect(newAchievements.length).toBe(1);
    expect(newAchievements[0].key).toBe("collection_starter");
    expect(newAchievements[0].name).toBe("Collection Starter");
    expect(newAchievements[0].icon).toBe("🌱");
  });

  it("should not award same achievement twice", async () => {
    const newAchievements = await checkAndAwardCollectionAchievements(
      testCollectionId,
      testUserId,
      15 // Still qualifies for starter, but already awarded
    );

    expect(newAchievements.length).toBe(0);
  });

  it("should award multiple achievements when jumping thresholds", async () => {
    const newAchievements = await checkAndAwardCollectionAchievements(
      testCollectionId,
      testUserId,
      100 // Qualifies for 50 and 100
    );

    expect(newAchievements.length).toBe(2);
    const keys = newAchievements.map(a => a.key).sort();
    expect(keys).toContain("collection_rising");
    expect(keys).toContain("collection_popular");
  });

  it("should include achievements in clone response", async () => {
    // Set clone count to 499 (one away from viral)
    const db = await getDb();
    await db!.update(collections)
      .set({ cloneCount: 499 })
      .where(eq(collections.id, testCollectionId));

    const caller = createCloningCaller();
    const result = await caller.collections.cloneCollection({ shareToken });

    expect(result.success).toBe(true);
    expect(result.newAchievements).toBeDefined();
    expect(result.newAchievements.length).toBe(1);
    expect(result.newAchievements[0].key).toBe("collection_viral");
    expect(result.newAchievements[0].icon).toBe("🔥");
  });

  it("should verify all badge tiers are defined", () => {
    expect(COLLECTION_ACHIEVEMENTS.length).toBe(6);
    
    const expectedKeys = [
      "collection_starter",
      "collection_rising",
      "collection_popular",
      "collection_viral",
      "collection_legend",
      "collection_icon",
    ];

    const actualKeys = COLLECTION_ACHIEVEMENTS.map(a => a.key);
    expectedKeys.forEach(key => {
      expect(actualKeys).toContain(key);
    });
  });

  it("should have correct requirements for each tier", () => {
    const requirements = COLLECTION_ACHIEVEMENTS.map(a => a.requirement).sort((a, b) => a - b);
    expect(requirements).toEqual([10, 50, 100, 500, 1000, 10000]);
  });
});
