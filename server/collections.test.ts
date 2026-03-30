import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users, vocabularyLists, generatedContent, collections, collectionItems } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

describe("Collections Feature", () => {
  let testUserId: number;
  let testVocabListId: number;
  let testContentId1: number;
  let testContentId2: number;
  let testCollectionId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Create test user
    const userResult = await db.insert(users).values({
      openId: `test-collections-${Date.now()}`,
      name: "Collections Test User",
      email: `collections-test-${Date.now()}@test.com`,
      role: "user",
    });
    const userId = (userResult as any)[0]?.insertId;
    testUserId = typeof userId === 'string' ? parseInt(userId) : Number(userId);

    // Create test vocabulary list
    const vocabResult = await db.insert(vocabularyLists).values({
      userId: testUserId,
      targetLanguage: "Spanish",
      nativeLanguage: "English",
      proficiencyLevel: "beginner",
      words: JSON.stringify([{ word: "hola", translation: "hello" }]),
    });
    const vocabId = (vocabResult as any)[0]?.insertId;
    testVocabListId = typeof vocabId === 'string' ? parseInt(vocabId) : Number(vocabId);

    // Create test content 1
    const content1Result = await db.insert(generatedContent).values({
      userId: testUserId,
      vocabularyListId: testVocabListId,
      mode: "podcast",
      theme: "Adventure",
      title: "Test Story 1",
      storyText: "Test story content 1",
      status: "completed",
    });
    const content1Id = (content1Result as any)[0]?.insertId;
    testContentId1 = typeof content1Id === 'string' ? parseInt(content1Id) : Number(content1Id);

    // Create test content 2
    const content2Result = await db.insert(generatedContent).values({
      userId: testUserId,
      vocabularyListId: testVocabListId,
      mode: "film",
      theme: "Mystery",
      title: "Test Story 2",
      storyText: "Test story content 2",
      status: "completed",
    });
    const content2Id = (content2Result as any)[0]?.insertId;
    testContentId2 = typeof content2Id === 'string' ? parseInt(content2Id) : Number(content2Id);
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Cleanup in reverse order of dependencies
    await db.delete(collectionItems).where(eq(collectionItems.collectionId, testCollectionId));
    await db.delete(collections).where(eq(collections.userId, testUserId));
    await db.delete(generatedContent).where(eq(generatedContent.userId, testUserId));
    await db.delete(vocabularyLists).where(eq(vocabularyLists.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  const createCaller = () => {
    return appRouter.createCaller({
      user: { id: testUserId, openId: `test-collections-${testUserId}`, name: "Test User", role: "user" },
      req: {} as any,
      res: {} as any,
    });
  };

  it("should create a new collection", async () => {
    const caller = createCaller();
    const result = await caller.collections.createCollection({
      name: "My Test Collection",
      description: "A collection for testing",
      color: "#8B5CF6",
    });

    expect(result.success).toBe(true);
    expect(result.collectionId).toBeTypeOf("number");
    testCollectionId = result.collectionId;
  });

  it("should get all user collections", async () => {
    const caller = createCaller();
    const collections = await caller.collections.getMyCollections();

    expect(Array.isArray(collections)).toBe(true);
    expect(collections.length).toBeGreaterThan(0);
    
    const testCollection = collections.find(c => c.id === testCollectionId);
    expect(testCollection).toBeDefined();
    expect(testCollection?.name).toBe("My Test Collection");
    expect(testCollection?.itemCount).toBe(0);
  });

  it("should add story to collection", async () => {
    const caller = createCaller();
    const result = await caller.collections.addToCollection({
      collectionId: testCollectionId,
      contentId: testContentId1,
    });

    expect(result.success).toBe(true);
  });

  it("should prevent adding duplicate story to collection", async () => {
    const caller = createCaller();
    
    await expect(
      caller.collections.addToCollection({
        collectionId: testCollectionId,
        contentId: testContentId1,
      })
    ).rejects.toThrow("Story already in collection");
  });

  it("should get collection with items", async () => {
    const caller = createCaller();
    const collection = await caller.collections.getCollectionById({ id: testCollectionId });

    expect(collection.name).toBe("My Test Collection");
    expect(collection.items.length).toBe(1);
    expect(collection.items[0].contentId).toBe(testContentId1);
    expect(collection.items[0].content?.title).toBe("Test Story 1");
  });

  it("should add second story to collection", async () => {
    const caller = createCaller();
    const result = await caller.collections.addToCollection({
      collectionId: testCollectionId,
      contentId: testContentId2,
    });

    expect(result.success).toBe(true);

    // Verify both stories are in collection
    const collection = await caller.collections.getCollectionById({ id: testCollectionId });
    expect(collection.items.length).toBe(2);
  });

  it("should reorder collection items", async () => {
    const caller = createCaller();
    
    // Get current items
    const collection = await caller.collections.getCollectionById({ id: testCollectionId });
    const itemIds = collection.items.map(item => item.id);
    
    // Reverse the order
    const reversedIds = [...itemIds].reverse();
    
    const result = await caller.collections.reorderCollection({
      collectionId: testCollectionId,
      itemIds: reversedIds,
    });

    expect(result.success).toBe(true);

    // Verify new order
    const updatedCollection = await caller.collections.getCollectionById({ id: testCollectionId });
    expect(updatedCollection.items[0].id).toBe(reversedIds[0]);
    expect(updatedCollection.items[1].id).toBe(reversedIds[1]);
  });

  it("should get collections containing specific content", async () => {
    const caller = createCaller();
    const collectionsWithContent = await caller.collections.getCollectionsForContent({
      contentId: testContentId1,
    });

    expect(Array.isArray(collectionsWithContent)).toBe(true);
    expect(collectionsWithContent.length).toBeGreaterThan(0);
    
    const found = collectionsWithContent.find(c => c?.id === testCollectionId);
    expect(found).toBeDefined();
  });

  it("should update collection details", async () => {
    const caller = createCaller();
    const result = await caller.collections.updateCollection({
      id: testCollectionId,
      name: "Updated Collection Name",
      description: "Updated description",
      color: "#EC4899",
    });

    expect(result.success).toBe(true);

    // Verify update
    const collection = await caller.collections.getCollectionById({ id: testCollectionId });
    expect(collection.name).toBe("Updated Collection Name");
    expect(collection.description).toBe("Updated description");
    expect(collection.color).toBe("#EC4899");
  });

  it("should remove story from collection", async () => {
    const caller = createCaller();
    const result = await caller.collections.removeFromCollection({
      collectionId: testCollectionId,
      contentId: testContentId1,
    });

    expect(result.success).toBe(true);

    // Verify removal
    const collection = await caller.collections.getCollectionById({ id: testCollectionId });
    expect(collection.items.length).toBe(1);
    expect(collection.items[0].contentId).toBe(testContentId2);
  });

  it("should delete collection", async () => {
    const caller = createCaller();
    const result = await caller.collections.deleteCollection({ id: testCollectionId });

    expect(result.success).toBe(true);

    // Verify deletion
    await expect(
      caller.collections.getCollectionById({ id: testCollectionId })
    ).rejects.toThrow("Collection not found");
  });

  it("should prevent unauthorized access to other user's collections", async () => {
    // Create a collection as test user
    const caller1 = createCaller();
    const createResult = await caller1.collections.createCollection({
      name: "Private Collection",
      description: "Should not be accessible",
      color: "#14B8A6",
    });
    const privateCollectionId = createResult.collectionId;

    // Try to access as different user
    const caller2 = appRouter.createCaller({
      user: { id: 99999, openId: "other-user", name: "Other User", role: "user" },
      req: {} as any,
      res: {} as any,
    });

    await expect(
      caller2.collections.getCollectionById({ id: privateCollectionId })
    ).rejects.toThrow("Collection not found");

    // Cleanup
    await caller1.collections.deleteCollection({ id: privateCollectionId });
  });
});
