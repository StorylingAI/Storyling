import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users, vocabularyLists, generatedContent, collections, collectionItems } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Collection Cloning", () => {
  let testUserId: number;
  let cloningUserId: number;
  let testCollectionId: number;
  let testContentId1: number;
  let testContentId2: number;
  let shareToken: string;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Create original collection owner
    const userResult = await db.insert(users).values({
      openId: `test-clone-owner-${Date.now()}`,
      name: "Collection Owner",
      email: `clone-owner-${Date.now()}@test.com`,
      role: "user",
    });
    const userId = (userResult as any)[0]?.insertId;
    testUserId = typeof userId === 'string' ? parseInt(userId) : Number(userId);

    // Create cloning user
    const cloningUserResult = await db.insert(users).values({
      openId: `test-cloner-${Date.now()}`,
      name: "Cloning User",
      email: `cloner-${Date.now()}@test.com`,
      role: "user",
    });
    const cloningId = (cloningUserResult as any)[0]?.insertId;
    cloningUserId = typeof cloningId === 'string' ? parseInt(cloningId) : Number(cloningId);

    // Create test vocabulary list
    const vocabResult = await db.insert(vocabularyLists).values({
      userId: testUserId,
      targetLanguage: "French",
      nativeLanguage: "English",
      proficiencyLevel: "b1",
      words: JSON.stringify([{ word: "bonjour", translation: "hello" }]),
    });
    const vocabId = (vocabResult as any)[0]?.insertId;
    const testVocabListId = typeof vocabId === 'string' ? parseInt(vocabId) : Number(vocabId);

    // Create test stories
    const content1Result = await db.insert(generatedContent).values({
      userId: testUserId,
      vocabularyListId: testVocabListId,
      mode: "film",
      theme: "Adventure",
      title: "Test Story 1",
      storyText: "Story 1 content",
      status: "completed",
    });
    const content1Id = (content1Result as any)[0]?.insertId;
    testContentId1 = typeof content1Id === 'string' ? parseInt(content1Id) : Number(content1Id);

    const content2Result = await db.insert(generatedContent).values({
      userId: testUserId,
      vocabularyListId: testVocabListId,
      mode: "podcast",
      theme: "Mystery",
      title: "Test Story 2",
      storyText: "Story 2 content",
      status: "completed",
    });
    const content2Id = (content2Result as any)[0]?.insertId;
    testContentId2 = typeof content2Id === 'string' ? parseInt(content2Id) : Number(content2Id);

    // Create test collection with share token
    const collectionResult = await db.insert(collections).values({
      userId: testUserId,
      name: "Clone Test Collection",
      description: "For testing cloning",
      color: "#3B82F6",
      isPublic: true,
      shareToken: `clone-test-${Date.now()}`,
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

    // Add stories to collection
    await db.insert(collectionItems).values([
      {
        collectionId: testCollectionId,
        contentId: testContentId1,
        position: 0,
      },
      {
        collectionId: testCollectionId,
        contentId: testContentId2,
        position: 1,
      },
    ]);
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Cleanup - delete all collections for both users
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
      user: { id: cloningUserId, openId: `test-cloner-${cloningUserId}`, name: "Cloning User", role: "user" },
      req: {} as any,
      res: {} as any,
    });
  };

  it("should clone a public collection", async () => {
    const caller = createCloningCaller();
    const result = await caller.collections.cloneCollection({
      shareToken,
    });

    expect(result.success).toBe(true);
    expect(result.collectionId).toBeTruthy();
    expect(result.itemCount).toBe(2);

    // Verify the cloned collection exists
    const db = await getDb();
    const clonedCollection = await db!
      .select()
      .from(collections)
      .where(eq(collections.id, result.collectionId))
      .limit(1);

    expect(clonedCollection.length).toBe(1);
    expect(clonedCollection[0].userId).toBe(cloningUserId);
    expect(clonedCollection[0].name).toBe("Clone Test Collection (Copy)");
    expect(clonedCollection[0].description).toBe("For testing cloning");
    expect(clonedCollection[0].color).toBe("#3B82F6");
    expect(clonedCollection[0].isPublic).toBe(false); // Cloned collections are private
    expect(clonedCollection[0].shareToken).toBeNull();
  });

  it("should copy all items to cloned collection", async () => {
    const caller = createCloningCaller();
    const result = await caller.collections.cloneCollection({
      shareToken,
    });

    const db = await getDb();
    const clonedItems = await db!
      .select()
      .from(collectionItems)
      .where(eq(collectionItems.collectionId, result.collectionId));

    expect(clonedItems.length).toBe(2);
    expect(clonedItems[0].contentId).toBe(testContentId1);
    expect(clonedItems[0].position).toBe(0);
    expect(clonedItems[1].contentId).toBe(testContentId2);
    expect(clonedItems[1].position).toBe(1);
  });

  it("should reject cloning private collection", async () => {
    const db = await getDb();
    
    // Make collection private
    await db!.update(collections)
      .set({ isPublic: false })
      .where(eq(collections.id, testCollectionId));

    const caller = createCloningCaller();
    await expect(
      caller.collections.cloneCollection({ shareToken })
    ).rejects.toThrow("This collection is not publicly shared");

    // Restore public status
    await db!.update(collections)
      .set({ isPublic: true })
      .where(eq(collections.id, testCollectionId));
  });

  it("should reject invalid share token", async () => {
    const caller = createCloningCaller();
    await expect(
      caller.collections.cloneCollection({ shareToken: "invalid-token" })
    ).rejects.toThrow("Collection not found");
  });

  it("should allow multiple clones of same collection", async () => {
    const caller = createCloningCaller();
    
    const result1 = await caller.collections.cloneCollection({ shareToken });
    const result2 = await caller.collections.cloneCollection({ shareToken });

    expect(result1.collectionId).not.toBe(result2.collectionId);
    expect(result1.itemCount).toBe(2);
    expect(result2.itemCount).toBe(2);
  });

  it("should handle empty collections", async () => {
    const db = await getDb();
    
    // Create empty collection
    const emptyCollectionResult = await db!.insert(collections).values({
      userId: testUserId,
      name: "Empty Collection",
      description: "No items",
      color: "#10B981",
      isPublic: true,
      shareToken: `empty-${Date.now()}`,
    });
    const emptyCollId = typeof emptyCollectionResult[0].insertId === 'string'
      ? parseInt(emptyCollectionResult[0].insertId)
      : Number(emptyCollectionResult[0].insertId);

    const emptyCollectionData = await db!
      .select()
      .from(collections)
      .where(eq(collections.id, emptyCollId))
      .limit(1);
    const emptyShareToken = emptyCollectionData[0].shareToken!;

    const caller = createCloningCaller();
    const result = await caller.collections.cloneCollection({
      shareToken: emptyShareToken,
    });

    expect(result.success).toBe(true);
    expect(result.itemCount).toBe(0);

    // Cleanup
    await db!.delete(collections).where(eq(collections.id, emptyCollId));
  });
});
