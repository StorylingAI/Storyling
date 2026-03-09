import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users, vocabularyLists, generatedContent, collections, collectionItems } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Bulk Collection Operations", () => {
  let testUserId: number;
  let testVocabListId: number;
  let testContentIds: number[] = [];
  let testCollectionId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Create test user
    const userResult = await db.insert(users).values({
      openId: `test-bulk-${Date.now()}`,
      name: "Bulk Test User",
      email: `bulk-test-${Date.now()}@test.com`,
      role: "user",
    });
    const userId = (userResult as any)[0]?.insertId;
    testUserId = typeof userId === 'string' ? parseInt(userId) : Number(userId);

    // Create test vocabulary list
    const vocabResult = await db.insert(vocabularyLists).values({
      userId: testUserId,
      targetLanguage: "French",
      nativeLanguage: "English",
      proficiencyLevel: "beginner",
      words: JSON.stringify([{ word: "bonjour", translation: "hello" }]),
    });
    const vocabId = (vocabResult as any)[0]?.insertId;
    testVocabListId = typeof vocabId === 'string' ? parseInt(vocabId) : Number(vocabId);

    // Create 5 test stories
    for (let i = 1; i <= 5; i++) {
      const contentResult = await db.insert(generatedContent).values({
        userId: testUserId,
        vocabularyListId: testVocabListId,
        mode: "podcast",
        theme: "Adventure",
        title: `Test Story ${i}`,
        storyText: `Test story content ${i}`,
        status: "completed",
      });
      const contentId = (contentResult as any)[0]?.insertId;
      testContentIds.push(typeof contentId === 'string' ? parseInt(contentId) : Number(contentId));
    }

    // Create test collection
    const collectionResult = await db.insert(collections).values({
      userId: testUserId,
      name: "Bulk Test Collection",
      description: "For testing bulk operations",
      color: "#10B981",
    });
    const collId = (collectionResult as any)[0]?.insertId;
    testCollectionId = typeof collId === 'string' ? parseInt(collId) : Number(collId);
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Cleanup
    await db.delete(collectionItems).where(eq(collectionItems.collectionId, testCollectionId));
    await db.delete(collections).where(eq(collections.userId, testUserId));
    await db.delete(generatedContent).where(eq(generatedContent.userId, testUserId));
    await db.delete(vocabularyLists).where(eq(vocabularyLists.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  const createCaller = () => {
    return appRouter.createCaller({
      user: { id: testUserId, openId: `test-bulk-${testUserId}`, name: "Test User", role: "user" },
      req: {} as any,
      res: {} as any,
    });
  };

  it("should bulk add multiple stories to collection", async () => {
    const caller = createCaller();
    const result = await caller.collections.bulkAddToCollection({
      collectionId: testCollectionId,
      contentIds: testContentIds.slice(0, 3), // Add first 3 stories
    });

    expect(result.success).toBe(true);
    expect(result.added).toBe(3);
    expect(result.skipped).toBe(0);

    // Verify stories were added
    const collection = await caller.collections.getCollectionById({ id: testCollectionId });
    expect(collection.items.length).toBe(3);
  });

  it("should skip stories already in collection", async () => {
    const caller = createCaller();
    
    // Try to add the same stories again plus 2 new ones
    const result = await caller.collections.bulkAddToCollection({
      collectionId: testCollectionId,
      contentIds: testContentIds, // All 5 stories
    });

    expect(result.success).toBe(true);
    expect(result.added).toBe(2); // Only 2 new stories added
    expect(result.skipped).toBe(3); // 3 were already in collection

    // Verify total count
    const collection = await caller.collections.getCollectionById({ id: testCollectionId });
    expect(collection.items.length).toBe(5);
  });

  it("should handle empty content array", async () => {
    const caller = createCaller();
    const result = await caller.collections.bulkAddToCollection({
      collectionId: testCollectionId,
      contentIds: [],
    });

    expect(result.success).toBe(true);
    expect(result.added).toBe(0);
    expect(result.skipped).toBe(0);
  });

  it("should reject unauthorized collection access", async () => {
    const otherCaller = appRouter.createCaller({
      user: { id: 99999, openId: "other-user", name: "Other User", role: "user" },
      req: {} as any,
      res: {} as any,
    });

    await expect(
      otherCaller.collections.bulkAddToCollection({
        collectionId: testCollectionId,
        contentIds: testContentIds,
      })
    ).rejects.toThrow("Collection not found or unauthorized");
  });

  it("should reject unauthorized content access", async () => {
    const caller = createCaller();
    
    // Try to add content that doesn't exist or doesn't belong to user
    await expect(
      caller.collections.bulkAddToCollection({
        collectionId: testCollectionId,
        contentIds: [999999, 999998],
      })
    ).rejects.toThrow("Some content not found or unauthorized");
  });

  it("should maintain correct position ordering", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Create a new collection for position testing
    const collectionResult = await db.insert(collections).values({
      userId: testUserId,
      name: "Position Test Collection",
      description: "Testing position ordering",
      color: "#F59E0B",
    });
    const posCollId = (collectionResult as any)[0]?.insertId;
    const positionCollectionId = typeof posCollId === 'string' ? parseInt(posCollId) : Number(posCollId);

    const caller = createCaller();

    // Add first batch
    await caller.collections.bulkAddToCollection({
      collectionId: positionCollectionId,
      contentIds: testContentIds.slice(0, 2),
    });

    // Add second batch
    await caller.collections.bulkAddToCollection({
      collectionId: positionCollectionId,
      contentIds: testContentIds.slice(2, 4),
    });

    // Verify positions are sequential
    const collection = await caller.collections.getCollectionById({ id: positionCollectionId });
    const positions = collection.items.map(item => item.position).sort((a, b) => a - b);
    
    expect(positions).toEqual([0, 1, 2, 3]);

    // Cleanup
    await db.delete(collectionItems).where(eq(collectionItems.collectionId, positionCollectionId));
    await db.delete(collections).where(eq(collections.id, positionCollectionId));
  });
});
