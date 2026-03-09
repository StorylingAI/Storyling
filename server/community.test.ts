import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users, collections, userAchievements, achievements, vocabularyLists } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Community Features", () => {
  let testUserId: number;
  let testCollectionId: number;
  let adminUserId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Create test user
    const [user] = await db
      .insert(users)
      .values({
        openId: `test-user-${Date.now()}`,
        name: "Test Creator",
        email: "creator@test.com",
        role: "user",
      })
      .$returningId();
    testUserId = user.id;

    // Create admin user
    const [admin] = await db
      .insert(users)
      .values({
        openId: `test-admin-${Date.now()}`,
        name: "Test Admin",
        email: "admin@test.com",
        role: "admin",
      })
      .$returningId();
    adminUserId = admin.id;

    // Create test collection
    const [collection] = await db
      .insert(collections)
      .values({
        userId: testUserId,
        name: "Test Collection",
        description: "A test collection",
        color: "#8b5cf6",
        shareToken: `test-token-${Date.now()}`,
        isPublic: true,
        cloneCount: 10,
      })
      .$returningId();
    testCollectionId = collection.id;

    // Create test achievement
    const [achievement] = await db
      .insert(achievements)
      .values({
        key: "test_badge",
        name: "Test Badge",
        description: "Test badge description",
        icon: "🏆",
        category: "collections",
        requirement: 10,
        xpReward: 100,
      })
      .$returningId();

    // Award achievement to user
    await db.insert(userAchievements).values({
      userId: testUserId,
      achievementId: achievement.id,
    });

    // Create vocabulary list for personalization
    await db.insert(vocabularyLists).values({
      userId: testUserId,
      targetLanguage: "Chinese",
      proficiencyLevel: "A1",
      words: "你好,谢谢,再见",
    });
  });

  describe("User Profile", () => {
    it("should fetch user profile with stats and collections", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const profile = await caller.leaderboard.getUserProfile({
        userId: testUserId,
      });

      expect(profile).toBeDefined();
      expect(profile.user.id).toBe(testUserId);
      expect(profile.user.name).toBe("Test Creator");
      expect(profile.stats.totalCollections).toBeGreaterThanOrEqual(1);
      expect(profile.stats.badgesEarned).toBeGreaterThanOrEqual(1);
      expect(profile.collections.length).toBeGreaterThanOrEqual(0);
      expect(profile.badges.length).toBeGreaterThanOrEqual(1);
      expect(profile.recentActivity.length).toBeGreaterThanOrEqual(0);
    });

    it("should throw error for non-existent user", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      await expect(
        caller.leaderboard.getUserProfile({ userId: 999999 })
      ).rejects.toThrow("User not found");
    });
  });

  describe("Featured Collection System", () => {
    it("should allow admin to feature a collection", async () => {
      const caller = appRouter.createCaller({
        user: { id: adminUserId, role: "admin" } as any,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.featured.setFeaturedCollection({
        collectionId: testCollectionId,
        durationDays: 7,
      });

      expect(result.success).toBe(true);
      expect(result.featuredUntil).toBeDefined();
    });

    it("should prevent non-admin from featuring collections", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId, role: "user" } as any,
        req: {} as any,
        res: {} as any,
      });

      await expect(
        caller.featured.setFeaturedCollection({
          collectionId: testCollectionId,
          durationDays: 7,
        })
      ).rejects.toThrow("Only admins can feature collections");
    });

    it("should fetch current featured collection", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      // First feature a collection
      const adminCaller = appRouter.createCaller({
        user: { id: adminUserId, role: "admin" } as any,
        req: {} as any,
        res: {} as any,
      });

      await adminCaller.featured.setFeaturedCollection({
        collectionId: testCollectionId,
        durationDays: 7,
      });

      // Then fetch it
      const featured = await caller.featured.getFeaturedCollection();

      expect(featured).toBeDefined();
      if (featured) {
        expect(featured.id).toBe(testCollectionId);
        expect(featured.name).toBe("Test Collection");
      }
    });

    it("should allow admin to unfeature a collection", async () => {
      const caller = appRouter.createCaller({
        user: { id: adminUserId, role: "admin" } as any,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.featured.unfeatureCollection({
        collectionId: testCollectionId,
      });

      expect(result.success).toBe(true);
    });
  });

  describe("Discovery Feed", () => {
    it("should fetch discovery feed without user", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const feed = await caller.discovery.getDiscoveryFeed({
        limit: 20,
      });

      expect(feed).toBeDefined();
      expect(feed.trending).toBeDefined();
      expect(feed.new).toBeDefined();
      expect(feed.popular).toBeDefined();
      expect(feed.personalized).toBeDefined();
      expect(Array.isArray(feed.trending)).toBe(true);
      expect(Array.isArray(feed.new)).toBe(true);
      expect(Array.isArray(feed.popular)).toBe(true);
      expect(Array.isArray(feed.personalized)).toBe(true);
    });

    it("should fetch personalized feed for authenticated user", async () => {
      const caller = appRouter.createCaller({
        user: { id: testUserId, role: "user" } as any,
        req: {} as any,
        res: {} as any,
      });

      const feed = await caller.discovery.getDiscoveryFeed({
        userId: testUserId,
        limit: 20,
      });

      expect(feed).toBeDefined();
      expect(feed.trending).toBeDefined();
      expect(feed.new).toBeDefined();
      expect(feed.popular).toBeDefined();
      expect(feed.personalized).toBeDefined();
    });

    it("should include collection metadata in feed", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const feed = await caller.discovery.getDiscoveryFeed({
        limit: 20,
      });

      // Check if any collections are returned
      const allCollections = [
        ...feed.trending,
        ...feed.new,
        ...feed.popular,
      ];

      if (allCollections.length > 0) {
        const collection = allCollections[0];
        expect(collection.id).toBeDefined();
        expect(collection.name).toBeDefined();
        expect(collection.userName).toBeDefined();
        expect(collection.cloneCount).toBeDefined();
        expect(collection.itemCount).toBeDefined();
      }
    });
  });
});
