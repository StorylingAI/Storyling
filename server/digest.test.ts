import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { users, collections, generatedContent, userDigests, vocabularyLists } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Digest System", () => {
  let testUserId: number;
  let testCollectionId: number;
  let testContentId: number;
  let testVocabListId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test user
    const [user] = await db.insert(users).values({
      openId: `test-digest-${Date.now()}`,
      name: "Digest Test User",
      email: `digest-test-${Date.now()}@test.com`,
      role: "user",
    });
    testUserId = user.insertId;

    // Create test vocabulary list
    const [vocabList] = await db.insert(vocabularyLists).values({
      userId: testUserId,
      targetLanguage: "Spanish",
      proficiencyLevel: "A2",
      words: "hola, amigo, casa",
    });
    testVocabListId = vocabList.insertId;

    // Create test collection
    const [collection] = await db.insert(collections).values({
      userId: testUserId,
      name: "Test Collection",
      description: "For testing digests",
      color: "#3B82F6",
      viewCount: 150,
      cloneCount: 25,
    });
    testCollectionId = collection.insertId;

    // Create test story
    const [content] = await db.insert(generatedContent).values({
      userId: testUserId,
      vocabularyListId: testVocabListId,
      mode: "podcast",
      theme: "Adventure",
      title: "Test Story",
      titleTranslation: "Test Story Translation",
      storyText: "This is a test story for digest generation. It contains enough text to create an excerpt that will be displayed in the story highlights digest.",
      status: "completed",
      thumbnailUrl: "https://example.com/thumbnail.jpg",
    });
    testContentId = content.insertId;
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Cleanup
    if (testContentId) {
      await db.delete(generatedContent).where(eq(generatedContent.id, testContentId));
    }
    if (testCollectionId) {
      await db.delete(collections).where(eq(collections.id, testCollectionId));
    }
    if (testVocabListId) {
      await db.delete(vocabularyLists).where(eq(vocabularyLists.id, testVocabListId));
    }
    if (testUserId) {
      await db.delete(userDigests).where(eq(userDigests.userId, testUserId));
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  it("should create user_digests table", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Check if table exists by trying to query it
    const result = await db.select().from(userDigests).limit(1);
    expect(result).toBeDefined();
  });

  it("should generate creator digest with collection stats", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a creator digest
    const digestData = {
      totalViews: 150,
      totalClones: 25,
      topCollection: {
        id: testCollectionId,
        name: "Test Collection",
        viewCount: 150,
        cloneCount: 25,
      },
      collections: [
        {
          id: testCollectionId,
          name: "Test Collection",
          viewCount: 150,
          cloneCount: 25,
        },
      ],
    };

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekEnd = new Date();

    const [result] = await db.insert(userDigests).values({
      userId: testUserId,
      digestType: "weekly_creator",
      title: "📊 Your Weekly Creator Digest",
      content: digestData as any,
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
      isRead: false,
    }).$returningId();

    expect(result.id).toBeDefined();

    // Verify the digest was created
    const [digest] = await db
      .select()
      .from(userDigests)
      .where(eq(userDigests.id, result.id));

    expect(digest).toBeDefined();
    expect(digest.digestType).toBe("weekly_creator");
    expect(digest.userId).toBe(testUserId);
    expect(digest.isRead).toBe(false);
    
    const content = typeof digest.content === 'string' ? JSON.parse(digest.content) : digest.content;
    expect(content.totalViews).toBe(150);
    expect(content.totalClones).toBe(25);
    expect(content.topCollection.name).toBe("Test Collection");
  });

  it("should generate story highlights digest", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a story highlights digest
    const digestData = {
      stories: [
        {
          id: testContentId,
          title: "Test Story",
          titleTranslation: "Test Story Translation",
          theme: "Adventure",
          mode: "podcast" as const,
          thumbnailUrl: "https://example.com/thumbnail.jpg",
          excerpt: "This is a test story for digest generation. It contains enough text to create an excerpt that will be displayed in the story...",
          generatedAt: new Date(),
        },
      ],
      totalStories: 1,
    };

    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekEnd = new Date();

    const [result] = await db.insert(userDigests).values({
      userId: testUserId,
      digestType: "story_highlights",
      title: "✨ Your Story Highlights",
      content: digestData as any,
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
      isRead: false,
    }).$returningId();

    expect(result.id).toBeDefined();

    // Verify the digest was created
    const [digest] = await db
      .select()
      .from(userDigests)
      .where(eq(userDigests.id, result.id));

    expect(digest).toBeDefined();
    expect(digest.digestType).toBe("story_highlights");
    
    const content = typeof digest.content === 'string' ? JSON.parse(digest.content) : digest.content;
    expect(content.totalStories).toBe(1);
    expect(content.stories).toHaveLength(1);
    expect(content.stories[0].title).toBe("Test Story");
  });

  it("should retrieve user digests", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const digests = await db
      .select()
      .from(userDigests)
      .where(eq(userDigests.userId, testUserId));

    expect(digests.length).toBeGreaterThan(0);
    expect(digests[0].userId).toBe(testUserId);
  });

  it("should mark digest as read", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get the first digest
    const [digest] = await db
      .select()
      .from(userDigests)
      .where(eq(userDigests.userId, testUserId))
      .limit(1);

    expect(digest).toBeDefined();

    // Mark as read
    await db
      .update(userDigests)
      .set({ isRead: true })
      .where(eq(userDigests.id, digest.id));

    // Verify it was marked as read
    const [updatedDigest] = await db
      .select()
      .from(userDigests)
      .where(eq(userDigests.id, digest.id));

    expect(updatedDigest.isRead).toBe(true);
  });

  it("should count unread digests", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create an unread digest
    const weekStart = new Date();
    weekStart.setDate(weekStart.getDate() - 7);
    const weekEnd = new Date();

    await db.insert(userDigests).values({
      userId: testUserId,
      digestType: "weekly_creator",
      title: "Test Unread Digest",
      content: { test: "data" } as any,
      weekStartDate: weekStart,
      weekEndDate: weekEnd,
      isRead: false,
    });

    // Count unread
    const unreadDigests = await db
      .select()
      .from(userDigests)
      .where(eq(userDigests.userId, testUserId))
      .where(eq(userDigests.isRead, false));

    expect(unreadDigests.length).toBeGreaterThan(0);
  });
});
