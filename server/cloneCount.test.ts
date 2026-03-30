import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users, vocabularyLists, generatedContent, collections, collectionItems } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Clone Count Feature", () => {
  let testUserId: number;
  let cloningUserId: number;
  let testCollectionId: number;
  let testContentId: number;
  let shareToken: string;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Create collection owner
    const userResult = await db.insert(users).values({
      openId: `test-count-owner-${Date.now()}`,
      name: "Count Owner",
      email: `count-owner-${Date.now()}@test.com`,
      role: "user",
    });
    const userId = (userResult as any)[0]?.insertId;
    testUserId = typeof userId === 'string' ? parseInt(userId) : Number(userId);

    // Create cloning user
    const cloningUserResult = await db.insert(users).values({
      openId: `test-count-cloner-${Date.now()}`,
      name: "Count Cloner",
      email: `count-cloner-${Date.now()}@test.com`,
      role: "user",
    });
    const cloningId = (cloningUserResult as any)[0]?.insertId;
    cloningUserId = typeof cloningId === 'string' ? parseInt(cloningId) : Number(cloningId);

    // Create test vocabulary list
    const vocabResult = await db.insert(vocabularyLists).values({
      userId: testUserId,
      targetLanguage: "Spanish",
      nativeLanguage: "English",
      proficiencyLevel: "a2",
      words: JSON.stringify([{ word: "hola", translation: "hello" }]),
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
      name: "Count Test Collection",
      description: "For testing clone count",
      color: "#3B82F6",
      isPublic: true,
      shareToken: `count-test-${Date.now()}`,
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

    // Cleanup
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
      user: { id: cloningUserId, openId: `test-count-cloner-${cloningUserId}`, name: "Count Cloner", role: "user" },
      req: {} as any,
      res: {} as any,
    });
  };

  it("should start with clone count of 0", async () => {
    const db = await getDb();
    const collection = await db!
      .select()
      .from(collections)
      .where(eq(collections.id, testCollectionId))
      .limit(1);

    expect(collection[0].cloneCount).toBe(0);
  });

  it("should increment clone count after cloning", async () => {
    const caller = createCloningCaller();
    await caller.collections.cloneCollection({ shareToken });

    const db = await getDb();
    const collection = await db!
      .select()
      .from(collections)
      .where(eq(collections.id, testCollectionId))
      .limit(1);

    expect(collection[0].cloneCount).toBe(1);
  });

  it("should increment count for multiple clones", async () => {
    const caller = createCloningCaller();
    
    // Clone twice more
    await caller.collections.cloneCollection({ shareToken });
    await caller.collections.cloneCollection({ shareToken });

    const db = await getDb();
    const collection = await db!
      .select()
      .from(collections)
      .where(eq(collections.id, testCollectionId))
      .limit(1);

    // Should be 3 total (1 from previous test + 2 from this test)
    expect(collection[0].cloneCount).toBe(3);
  });

  it("should include clone count in getPublicCollection response", async () => {
    const caller = createCloningCaller();
    const publicCollection = await caller.collections.getPublicCollection({ shareToken });

    expect(publicCollection.cloneCount).toBeDefined();
    expect(publicCollection.cloneCount).toBe(3);
  });

  it("should handle clone count formatting", () => {
    // Test the formatting logic
    const formatCloneCount = (count: number): string => {
      if (count >= 1000000) {
        return `${(count / 1000000).toFixed(1)}M`;
      }
      if (count >= 1000) {
        return `${(count / 1000).toFixed(1)}K`;
      }
      return count.toString();
    };

    expect(formatCloneCount(0)).toBe("0");
    expect(formatCloneCount(42)).toBe("42");
    expect(formatCloneCount(999)).toBe("999");
    expect(formatCloneCount(1000)).toBe("1.0K");
    expect(formatCloneCount(1500)).toBe("1.5K");
    expect(formatCloneCount(12345)).toBe("12.3K");
    expect(formatCloneCount(1000000)).toBe("1.0M");
    expect(formatCloneCount(5300000)).toBe("5.3M");
  });
});
