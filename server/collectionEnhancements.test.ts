import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users, collections, collectionViewAnalytics, collectionCloneAnalytics, collectionShareEvents, collectionCategories } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Collection Enhancements", () => {
  let testUserId: number;
  let testCollectionId: number;
  let testCategoryId: number;
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test user
    const [user] = await db.insert(users).values({
      openId: `test-${Date.now()}`,
      name: "Test Creator",
      email: "test@example.com",
    });
    testUserId = user.insertId;

    // Create test collection
    const [collection] = await db.insert(collections).values({
      userId: testUserId,
      name: "Test Collection",
      description: "A test collection for badges",
      isPublic: true,
      viewCount: 150,
      cloneCount: 60,
    });
    testCollectionId = collection.insertId;

    // Get a category for testing
    const categories = await db.select().from(collectionCategories).limit(1);
    testCategoryId = categories[0]?.id || 1;

    // Create caller with test user context
    caller = appRouter.createCaller({
      user: {
        id: testUserId,
        openId: `test-${Date.now()}`,
        name: "Test Creator",
        email: "test@example.com",
        role: "user",
      },
    } as any);
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    if (testCollectionId) {
      await db.delete(collections).where(eq(collections.id, testCollectionId));
    }
    if (testUserId) {
      await db.delete(users).where(eq(users.id, testUserId));
    }
  });

  describe("Badge System", () => {
    it("should calculate and award badges for collection", async () => {
      const result = await caller.badge.calculateBadges({
        collectionId: testCollectionId,
      });

      expect(result.success).toBe(true);
      expect(result.awardedBadges).toBeDefined();
      expect(Array.isArray(result.awardedBadges)).toBe(true);
    });

    it("should get badges for a collection", async () => {
      const badges = await caller.badge.getCollectionBadges({
        collectionId: testCollectionId,
      });

      expect(Array.isArray(badges)).toBe(true);
    });

    it("should get badge statistics", async () => {
      const stats = await caller.badge.getBadgeStats();

      expect(stats).toBeDefined();
      if (stats) {
        expect(Array.isArray(stats)).toBe(true);
      }
    });

    it("should filter collections by badge type", async () => {
      const results = await caller.badge.getCollectionsByBadge({
        badgeType: "top_100",
        limit: 10,
      });

      expect(Array.isArray(results)).toBe(true);
    });
  });

  describe("Email Digest System", () => {
    it("should get or create digest preferences", async () => {
      const prefs = await caller.emailDigest.getPreferences();

      expect(prefs).toBeDefined();
      if (prefs) {
        expect(prefs.userId).toBe(testUserId);
        expect(prefs.isEnabled).toBeDefined();
        expect(prefs.frequency).toBeDefined();
      }
    });

    it("should update digest preferences", async () => {
      const updated = await caller.emailDigest.updatePreferences({
        isEnabled: false,
        frequency: "biweekly",
      });

      expect(updated).toBeDefined();
      if (updated) {
        expect(updated.isEnabled).toBe(false);
        expect(updated.frequency).toBe("biweekly");
      }
    });

    it("should preview current week's digest", async () => {
      const preview = await caller.emailDigest.previewDigest();

      expect(preview).toBeDefined();
      expect(preview.hasData).toBeDefined();
      
      if (preview.hasData) {
        expect(preview.stats).toBeDefined();
        expect(preview.tips).toBeDefined();
        expect(Array.isArray(preview.tips)).toBe(true);
      }
    });

    it("should get digest history", async () => {
      const history = await caller.emailDigest.getHistory({ limit: 5 });

      expect(Array.isArray(history)).toBe(true);
    });
  });

  describe("Category & Tag System", () => {
    it("should get all categories", async () => {
      const categories = await caller.category.getAllCategories();

      expect(Array.isArray(categories)).toBe(true);
      expect(categories.length).toBeGreaterThan(0);
      
      const firstCategory = categories[0];
      expect(firstCategory).toHaveProperty("name");
      expect(firstCategory).toHaveProperty("slug");
      expect(firstCategory).toHaveProperty("icon");
    });

    it("should assign category to collection", async () => {
      const result = await caller.category.assignCategory({
        collectionId: testCollectionId,
        categoryId: testCategoryId,
      });

      expect(result).toBeDefined();
    });

    it("should get categories for collection", async () => {
      const categories = await caller.category.getCollectionCategories({
        collectionId: testCollectionId,
      });

      expect(Array.isArray(categories)).toBe(true);
    });

    it("should add tag to collection", async () => {
      const result = await caller.category.addTag({
        collectionId: testCollectionId,
        tagName: "test-tag",
      });

      expect(result).toBeDefined();
    });

    it("should get tags for collection", async () => {
      const tags = await caller.category.getCollectionTags({
        collectionId: testCollectionId,
      });

      expect(Array.isArray(tags)).toBe(true);
    });

    it("should get popular tags", async () => {
      const tags = await caller.category.getPopularTags({ limit: 10 });

      expect(Array.isArray(tags)).toBe(true);
    });

    it("should browse collections by category", async () => {
      const result = await caller.category.browseByCategory({
        categoryId: testCategoryId,
        limit: 10,
        offset: 0,
      });

      expect(result).toBeDefined();
      expect(result.collections).toBeDefined();
      expect(Array.isArray(result.collections)).toBe(true);
      expect(result.total).toBeDefined();
      expect(typeof result.total).toBe("number");
    });

    it("should get category statistics", async () => {
      const stats = await caller.category.getCategoryStats();

      expect(Array.isArray(stats)).toBe(true);
      if (stats.length > 0) {
        const firstStat = stats[0];
        expect(firstStat).toHaveProperty("categoryName");
        expect(firstStat).toHaveProperty("collectionCount");
      }
    });

    it("should remove category from collection", async () => {
      const result = await caller.category.removeCategory({
        collectionId: testCollectionId,
        categoryId: testCategoryId,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Integration Tests", () => {
    it("should handle complete collection enhancement workflow", async () => {
      // 1. Assign categories and tags
      await caller.category.assignCategory({
        collectionId: testCollectionId,
        categoryId: testCategoryId,
      });

      await caller.category.addTag({
        collectionId: testCollectionId,
        tagName: "integration-test",
      });

      // 2. Calculate badges
      const badgeResult = await caller.badge.calculateBadges({
        collectionId: testCollectionId,
      });
      expect(badgeResult.success).toBe(true);

      // 3. Check digest preview
      const digestPreview = await caller.emailDigest.previewDigest();
      expect(digestPreview).toBeDefined();

      // 4. Verify categories are assigned
      const categories = await caller.category.getCollectionCategories({
        collectionId: testCollectionId,
      });
      expect(categories.length).toBeGreaterThan(0);

      // 5. Verify tags are assigned
      const tags = await caller.category.getCollectionTags({
        collectionId: testCollectionId,
      });
      expect(tags.length).toBeGreaterThan(0);
    });
  });
});
