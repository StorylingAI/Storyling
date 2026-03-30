import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users, vocabularyLists, generatedContent, collections, collectionItems } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Collection Sharing", () => {
  let testUserId: number;
  let testCollectionId: number;
  let testContentId: number;
  let shareToken: string;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Create test user
    const userResult = await db.insert(users).values({
      openId: `test-share-${Date.now()}`,
      name: "Share Test User",
      email: `share-test-${Date.now()}@test.com`,
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
    const testVocabListId = typeof vocabId === 'string' ? parseInt(vocabId) : Number(vocabId);

    // Create test story
    const contentResult = await db.insert(generatedContent).values({
      userId: testUserId,
      vocabularyListId: testVocabListId,
      mode: "podcast",
      theme: "Travel",
      title: "Test Story",
      storyText: "Test story content",
      status: "completed",
    });
    const contentId = (contentResult as any)[0]?.insertId;
    testContentId = typeof contentId === 'string' ? parseInt(contentId) : Number(contentId);

    // Create test collection
    const collectionResult = await db.insert(collections).values({
      userId: testUserId,
      name: "Share Test Collection",
      description: "For testing sharing",
      color: "#10B981",
    });
    const collId = (collectionResult as any)[0]?.insertId;
    testCollectionId = typeof collId === 'string' ? parseInt(collId) : Number(collId);

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
    await db.delete(collectionItems).where(eq(collectionItems.collectionId, testCollectionId));
    await db.delete(collections).where(eq(collections.userId, testUserId));
    await db.delete(generatedContent).where(eq(generatedContent.userId, testUserId));
    await db.delete(vocabularyLists).where(eq(vocabularyLists.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  const createCaller = () => {
    return appRouter.createCaller({
      user: { id: testUserId, openId: `test-share-${testUserId}`, name: "Test User", role: "user" },
      req: {} as any,
      res: {} as any,
    });
  };

  const createPublicCaller = () => {
    return appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });
  };

  it("should generate share token for collection", async () => {
    const caller = createCaller();
    const result = await caller.collections.generateShareToken({
      collectionId: testCollectionId,
    });

    expect(result.success).toBe(true);
    expect(result.shareToken).toBeTruthy();
    expect(typeof result.shareToken).toBe("string");
    expect(result.shareToken!.length).toBeGreaterThan(0);

    shareToken = result.shareToken!;
  });

  it("should enable public sharing", async () => {
    const caller = createCaller();
    const result = await caller.collections.togglePublicSharing({
      collectionId: testCollectionId,
      isPublic: true,
    });

    expect(result.success).toBe(true);
    expect(result.shareToken).toBeTruthy();
  });

  it("should access public collection without authentication", async () => {
    const publicCaller = createPublicCaller();
    const collection = await publicCaller.collections.getPublicCollection({
      shareToken,
    });

    expect(collection).toBeTruthy();
    expect(collection.name).toBe("Share Test Collection");
    expect(collection.isPublic).toBe(true);
    expect(collection.items.length).toBe(1);
    expect(collection.items[0].content?.title).toBe("Test Story");
  });

  it("should reject access to private collection", async () => {
    const caller = createCaller();
    
    // Disable public sharing
    await caller.collections.togglePublicSharing({
      collectionId: testCollectionId,
      isPublic: false,
    });

    const publicCaller = createPublicCaller();
    await expect(
      publicCaller.collections.getPublicCollection({ shareToken })
    ).rejects.toThrow("This collection is not publicly shared");
  });

  it("should reject invalid share token", async () => {
    const publicCaller = createPublicCaller();
    await expect(
      publicCaller.collections.getPublicCollection({ shareToken: "invalid-token" })
    ).rejects.toThrow("Collection not found");
  });

  it("should regenerate share token", async () => {
    const caller = createCaller();
    
    // Enable sharing first
    await caller.collections.togglePublicSharing({
      collectionId: testCollectionId,
      isPublic: true,
    });

    // Generate new token
    const result = await caller.collections.generateShareToken({
      collectionId: testCollectionId,
    });

    expect(result.success).toBe(true);
    expect(result.shareToken).toBeTruthy();
    expect(result.shareToken).not.toBe(shareToken); // Should be different

    // Old token should not work
    const publicCaller = createPublicCaller();
    await expect(
      publicCaller.collections.getPublicCollection({ shareToken })
    ).rejects.toThrow("Collection not found");

    // New token should work
    const collection = await publicCaller.collections.getPublicCollection({
      shareToken: result.shareToken!,
    });
    expect(collection.name).toBe("Share Test Collection");
  });

  it("should reject unauthorized share token generation", async () => {
    const otherCaller = appRouter.createCaller({
      user: { id: 99999, openId: "other-user", name: "Other User", role: "user" },
      req: {} as any,
      res: {} as any,
    });

    await expect(
      otherCaller.collections.generateShareToken({ collectionId: testCollectionId })
    ).rejects.toThrow("Collection not found or unauthorized");
  });
});
