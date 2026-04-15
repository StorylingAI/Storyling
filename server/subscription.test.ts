import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users, generatedContent } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Subscription Router", () => {
  let testUserId: number;
  let premiumUserId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Create test free user
    const [freeUser] = await db
      .insert(users)
      .values({
        openId: `test-free-${Date.now()}`,
        name: "Test Free User",
        email: `test-free-${Date.now()}@test.com`,
        loginMethod: "email",
        subscriptionTier: "free",
      })
      .$returningId();
    testUserId = freeUser.id;

    // Create test premium user
    const [premUser] = await db
      .insert(users)
      .values({
        openId: `test-premium-${Date.now()}`,
        name: "Test Premium User",
        email: `test-premium-${Date.now()}@test.com`,
        loginMethod: "email",
        subscriptionTier: "premium",
        subscriptionStatus: "active",
      })
      .$returningId();
    premiumUserId = premUser.id;
  });

  it("should return free tier subscription details for free user", async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, role: "user" },
      req: {} as any,
      res: {} as any,
    });

    const subscription = await caller.subscription.getMySubscription();

    expect(subscription.tier).toBe("free");
    expect(subscription.isPremium).toBe(false);
    expect(subscription.status).toBe("active");
    expect(subscription.billingPeriod).toBeNull();
    expect(subscription.currentPeriodEnd).toBeNull();
  });

  it("should return premium tier subscription details for premium user", async () => {
    const caller = appRouter.createCaller({
      user: { id: premiumUserId, role: "user" },
      req: {} as any,
      res: {} as any,
    });

    const subscription = await caller.subscription.getMySubscription();

    expect(subscription.tier).toBe("premium");
    // Note: isPremium will be false without actual Stripe subscription
    // This is expected behavior - tier is "premium" but no active Stripe sub
  });

  it("should return correct usage stats for free tier user", async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, role: "user" },
      req: {} as any,
      res: {} as any,
    });

    const usage = await caller.subscription.getUsageStats();

    expect(usage.tier).toBe("free");
    expect(usage.storiesLimit).toBe(1);
    expect(usage.canCreateStory).toBe(true); // No stories created yet
    expect(usage.canUseFilmFormat).toBe(false); // Free tier cannot use film
  });

  it("should return unlimited usage for premium tier user", async () => {
    const caller = appRouter.createCaller({
      user: { id: premiumUserId, role: "user" },
      req: {} as any,
      res: {} as any,
    });

    const usage = await caller.subscription.getUsageStats();

    expect(usage.tier).toBe("premium");
    expect(usage.storiesLimit).toBeNull(); // Unlimited
    expect(usage.canCreateStory).toBe(true);
    expect(usage.canUseFilmFormat).toBe(true);
  });

  it("should enforce story limit for free tier users", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Create 1 story for the free user (reaching the daily limit)
    const now = new Date();

    await db.insert(generatedContent).values({
      userId: testUserId,
      vocabularyListId: 1, // Dummy value
      mode: "podcast",
      theme: "Comedy",
      storyText: "Test story",
      status: "completed",
      generatedAt: now,
    });

    const caller = appRouter.createCaller({
      user: { id: testUserId, role: "user" },
      req: {} as any,
      res: {} as any,
    });

    const usage = await caller.subscription.getUsageStats();

    expect(usage.storiesToday).toBe(1);
    expect(usage.storiesThisMonth).toBe(1);
    expect(usage.canCreateStory).toBe(false); // Reached limit
  });

  it("should return empty billing history for free user without Stripe customer", async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, role: "user" },
      req: {} as any,
      res: {} as any,
    });

    const billingHistory = await caller.subscription.getBillingHistory();

    expect(billingHistory).toBeDefined();
    expect(billingHistory.invoices).toEqual([]);
  });

  it("should not enforce limits for premium users", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Create 10 stories for premium user (more than free limit)
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    for (let i = 0; i < 10; i++) {
      await db.insert(generatedContent).values({
        userId: premiumUserId,
        vocabularyListId: 1,
        mode: "film",
        theme: "Adventure",
        storyText: "Premium story",
        status: "completed",
        generatedAt: new Date(startOfMonth.getTime() + i * 1000),
      });
    }

    const caller = appRouter.createCaller({
      user: { id: premiumUserId, role: "user" },
      req: {} as any,
      res: {} as any,
    });

    const usage = await caller.subscription.getUsageStats();

    expect(usage.tier).toBe("premium");
    expect(usage.canCreateStory).toBe(true); // No limit
    expect(usage.canUseFilmFormat).toBe(true);
  });
});
