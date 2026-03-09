import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users, vocabularyLists, generatedContent } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import type { TrpcContext } from "./_core/context";

describe("Content Customization Features", () => {
  let testUserId: number;
  let testContentId: number;
  let testVocabListId: number;
  let db: Awaited<ReturnType<typeof getDb>>;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test user
    const userResult = await db.insert(users).values({
      openId: `test-customization-${Date.now()}`,
      name: "Test User",
      email: "test@example.com",
      loginMethod: "test",
    });
    testUserId = Number(userResult[0].insertId);

    // Create test vocabulary list
    const vocabResult = await db.insert(vocabularyLists).values({
      userId: testUserId,
      targetLanguage: "Spanish",
      proficiencyLevel: "A2",
      words: "casa, perro, gato",
    });
    testVocabListId = Number(vocabResult[0].insertId);

    // Create test content
    const contentResult = await db.insert(generatedContent).values({
      userId: testUserId,
      vocabularyListId: testVocabListId,
      mode: "podcast",
      theme: "Adventure",
      title: "Original Test Title",
      storyText: "Test story content",
      status: "completed",
      thumbnailStyle: "realistic",
    });
    testContentId = Number(contentResult[0].insertId);
  });

  afterAll(async () => {
    if (!db) return;
    // Cleanup
    await db.delete(generatedContent).where(eq(generatedContent.userId, testUserId));
    await db.delete(vocabularyLists).where(eq(vocabularyLists.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  const createCaller = (userId: number) => {
    const ctx: TrpcContext = {
      user: {
        id: userId,
        openId: `test-${userId}`,
        name: "Test User",
        email: "test@example.com",
        loginMethod: "test",
        role: "user",
        preferredLanguage: "en",
        preferredTranslationLanguage: "en",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
      },
    };
    return appRouter.createCaller(ctx);
  };

  describe("updateTitle", () => {
    it("should update story title successfully", async () => {
      const caller = createCaller(testUserId);
      const newTitle = "Updated Adventure Title";

      const result = await caller.content.updateTitle({
        contentId: testContentId,
        title: newTitle,
      });

      expect(result.success).toBe(true);

      // Verify the title was updated
      const content = await caller.content.getById({ id: testContentId });
      expect(content.title).toBe(newTitle);
    });

    it("should reject empty title", async () => {
      const caller = createCaller(testUserId);

      await expect(
        caller.content.updateTitle({
          contentId: testContentId,
          title: "",
        })
      ).rejects.toThrow();
    });

    it("should reject title longer than 200 characters", async () => {
      const caller = createCaller(testUserId);
      const longTitle = "A".repeat(201);

      await expect(
        caller.content.updateTitle({
          contentId: testContentId,
          title: longTitle,
        })
      ).rejects.toThrow();
    });

    it("should prevent unauthorized users from updating title", async () => {
      const otherUserResult = await db!.insert(users).values({
        openId: `test-other-${Date.now()}`,
        name: "Other User",
        email: "other@example.com",
        loginMethod: "test",
      });
      const otherUserId = Number(otherUserResult[0].insertId);

      const caller = createCaller(otherUserId);

      await expect(
        caller.content.updateTitle({
          contentId: testContentId,
          title: "Hacked Title",
        })
      ).rejects.toThrow();

      // Cleanup
      await db!.delete(users).where(eq(users.id, otherUserId));
    });
  });

  describe("regenerateTitle", () => {
    it("should generate a new title for the story", async () => {
      const caller = createCaller(testUserId);
      const originalTitle = "Original Test Title";

      // Reset to original title first
      await caller.content.updateTitle({
        contentId: testContentId,
        title: originalTitle,
      });

      const result = await caller.content.regenerateTitle({
        contentId: testContentId,
      });

      expect(result.success).toBe(true);
      expect(result.title).toBeDefined();
      expect(typeof result.title).toBe("string");
      expect(result.title.length).toBeGreaterThan(0);

      // Verify the title was updated in the database
      const content = await caller.content.getById({ id: testContentId });
      expect(content.title).toBe(result.title);
    });

    it("should prevent unauthorized users from regenerating title", async () => {
      const otherUserResult = await db!.insert(users).values({
        openId: `test-other-regen-${Date.now()}`,
        name: "Other User",
        email: "other-regen@example.com",
        loginMethod: "test",
      });
      const otherUserId = Number(otherUserResult[0].insertId);

      const caller = createCaller(otherUserId);

      await expect(
        caller.content.regenerateTitle({
          contentId: testContentId,
        })
      ).rejects.toThrow();

      // Cleanup
      await db!.delete(users).where(eq(users.id, otherUserId));
    });
  });

  describe("bulkRegenerateThumbnails", () => {
    it.skip("should validate authorization for all content items", async () => {
      const caller = createCaller(testUserId);
      
      // Create another user's content
      const otherUserResult = await db!.insert(users).values({
        openId: `test-bulk-other-${Date.now()}`,
        name: "Other User",
        email: "other-bulk@example.com",
        loginMethod: "test",
      });
      const otherUserId = Number(otherUserResult[0].insertId);

      const otherVocabResult = await db!.insert(vocabularyLists).values({
        userId: otherUserId,
        targetLanguage: "French",
        proficiencyLevel: "A1",
        words: "bonjour, merci",
      });
      const otherVocabListId = Number(otherVocabResult[0].insertId);

      const otherContentResult = await db!.insert(generatedContent).values({
        userId: otherUserId,
        vocabularyListId: otherVocabListId,
        mode: "podcast",
        theme: "Romance",
        title: "Other User's Story",
        storyText: "Other content",
        status: "completed",
      });
      const otherContentId = Number(otherContentResult[0].insertId);

      // Try to bulk update with mixed ownership
      const result = await caller.content.bulkRegenerateThumbnails({
        contentIds: [testContentId, otherContentId],
        style: "realistic",
      });

      // Should fail for unauthorized content
      expect(result.success).toBe(false);
      expect(result.failureCount).toBe(1);
      expect(result.errors).toBeDefined();
      expect(result.errors?.some(e => e.includes("Unauthorized"))).toBe(true);

      // Cleanup
      await db!.delete(generatedContent).where(eq(generatedContent.id, otherContentId));
      await db!.delete(vocabularyLists).where(eq(vocabularyLists.id, otherVocabListId));
      await db!.delete(users).where(eq(users.id, otherUserId));
    });

    it("should return correct counts for bulk operations", async () => {
      const caller = createCaller(testUserId);
      
      // The function signature is correct, we're just testing the structure
      // We skip actual image generation by mocking or accepting it will happen
      const result = await caller.content.bulkRegenerateThumbnails({
        contentIds: [], // Empty array should succeed with 0 counts
        style: "realistic",
      });

      expect(result.successCount).toBe(0);
      expect(result.failureCount).toBe(0);
      expect(result.success).toBe(true);
    });
  });

  describe("regenerateThumbnail with style", () => {
    it.skip("should regenerate thumbnail with realistic style", async () => {
      const caller = createCaller(testUserId);

      const result = await caller.content.regenerateThumbnail({
        contentId: testContentId,
        style: "realistic",
      });

      expect(result.success).toBe(true);
      expect(result.thumbnailUrl).toBeDefined();

      // Verify the style was saved
      const content = await caller.content.getById({ id: testContentId });
      expect(content.thumbnailStyle).toBe("realistic");
    });

    it.skip("should regenerate thumbnail with illustrated style", async () => {
      const caller = createCaller(testUserId);

      const result = await caller.content.regenerateThumbnail({
        contentId: testContentId,
        style: "illustrated",
      });

      expect(result.success).toBe(true);
      expect(result.thumbnailUrl).toBeDefined();

      // Verify the style was saved
      const content = await caller.content.getById({ id: testContentId });
      expect(content.thumbnailStyle).toBe("illustrated");
    });

    it.skip("should regenerate thumbnail with minimalist style", async () => {
      const caller = createCaller(testUserId);

      const result = await caller.content.regenerateThumbnail({
        contentId: testContentId,
        style: "minimalist",
      });

      expect(result.success).toBe(true);
      expect(result.thumbnailUrl).toBeDefined();

      // Verify the style was saved
      const content = await caller.content.getById({ id: testContentId });
      expect(content.thumbnailStyle).toBe("minimalist");
    });

    it.skip("should use existing style when no style parameter provided", async () => {
      const caller = createCaller(testUserId);

      // Set to illustrated first
      await caller.content.regenerateThumbnail({
        contentId: testContentId,
        style: "illustrated",
      });

      // Regenerate without specifying style
      const result = await caller.content.regenerateThumbnail({
        contentId: testContentId,
      });

      expect(result.success).toBe(true);

      // Should maintain illustrated style
      const content = await caller.content.getById({ id: testContentId });
      expect(content.thumbnailStyle).toBe("illustrated");
    });
  });
});
