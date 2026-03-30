import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users, collections, collectionMilestones } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Premium Features", () => {
  let testUserId: number;
  let testCollectionId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Create a test user
    const [result] = await db.insert(users).values({
      openId: `test-premium-${Date.now()}`,
      name: "Premium Test User",
      email: "premium-test@example.com",
      subscriptionTier: "premium",
      premiumOnboardingCompleted: false,
    });

    testUserId = result.insertId;

    // Create a test collection
    const [collectionResult] = await db.insert(collections).values({
      userId: testUserId,
      name: "Test Collection",
      description: "Test collection for milestones",
      isPublic: true,
      viewCount: 0,
      cloneCount: 0,
    });

    testCollectionId = collectionResult.insertId;
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    await db.delete(collectionMilestones).where(eq(collectionMilestones.collectionId, testCollectionId));
    await db.delete(collections).where(eq(collections.id, testCollectionId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  describe("Premium Onboarding", () => {
    it("should mark premium onboarding as completed", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const caller = appRouter.createCaller({
        user: { id: testUserId, openId: `test-premium-${Date.now()}`, name: "Premium Test User", role: "user" },
        req: {} as any,
        res: {} as any,
      });

      // Complete premium onboarding
      const result = await caller.auth.completePremiumOnboarding();
      expect(result.success).toBe(true);

      // Verify database update
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, testUserId))
        .limit(1);

      expect(user.premiumOnboardingCompleted).toBe(true);
    });
  });

  describe("Collection Milestones", () => {
    it("should track view milestones", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Update collection to reach 100 views milestone
      await db
        .update(collections)
        .set({ viewCount: 100 })
        .where(eq(collections.id, testCollectionId));

      // Import and run milestone check
      const { checkCollectionMilestones } = await import("./milestoneNotifications");
      await checkCollectionMilestones(testCollectionId);

      // Check if milestone was recorded
      const milestones = await db
        .select()
        .from(collectionMilestones)
        .where(eq(collectionMilestones.collectionId, testCollectionId));

      const views100Milestone = milestones.find(m => m.milestoneType === "views_100");
      expect(views100Milestone).toBeDefined();
      expect(views100Milestone?.notificationSent).toBe(true);
    });

    it("should track clone milestones", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Update collection to reach 50 clones milestone
      await db
        .update(collections)
        .set({ cloneCount: 50 })
        .where(eq(collections.id, testCollectionId));

      // Import and run milestone check
      const { checkCollectionMilestones } = await import("./milestoneNotifications");
      await checkCollectionMilestones(testCollectionId);

      // Check if milestone was recorded
      const milestones = await db
        .select()
        .from(collectionMilestones)
        .where(eq(collectionMilestones.collectionId, testCollectionId));

      const clones50Milestone = milestones.find(m => m.milestoneType === "clones_50");
      expect(clones50Milestone).toBeDefined();
    });

    it("should not duplicate milestone notifications", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Run milestone check again with same counts
      const { checkCollectionMilestones } = await import("./milestoneNotifications");
      await checkCollectionMilestones(testCollectionId);

      // Count milestones - should still be same count (no duplicates)
      const milestones = await db
        .select()
        .from(collectionMilestones)
        .where(eq(collectionMilestones.collectionId, testCollectionId));

      const views100Count = milestones.filter(m => m.milestoneType === "views_100").length;
      const clones50Count = milestones.filter(m => m.milestoneType === "clones_50").length;

      expect(views100Count).toBe(1);
      expect(clones50Count).toBe(1);
    });
  });
});
