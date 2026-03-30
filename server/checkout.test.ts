import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Premium Checkout Flow", () => {
  let testUserId: number;
  let testUserEmail: string;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Create a test user
    const [result] = await db.insert(users).values({
      openId: `test-checkout-${Date.now()}`,
      name: "Test Checkout User",
      email: `checkout-test-${Date.now()}@example.com`,
      role: "user",
    });

    testUserId = result.insertId;
    
    const [user] = await db.select().from(users).where(eq(users.id, testUserId)).limit(1);
    testUserEmail = user.email || "";
  });

  it.skip("should create checkout session for monthly premium subscription", async () => {
    // Skip: Stripe prices not configured in test environment
    const caller = appRouter.createCaller({
      user: { id: testUserId, openId: "test", name: "Test User", email: testUserEmail, role: "user" },
      req: { headers: { origin: "http://localhost:3000" } } as any,
      res: {} as any,
    });

    const result = await caller.checkout.createPremiumCheckout({
      billingPeriod: "monthly",
    });

    expect(result).toBeDefined();
    expect(result.checkoutUrl).toBeDefined();
    expect(result.sessionId).toBeDefined();
    expect(result.checkoutUrl).toContain("checkout.stripe.com");
  });

  it.skip("should create checkout session for annual premium subscription", async () => {
    // Skip: Annual price not configured in Stripe test mode
    const caller = appRouter.createCaller({
      user: { id: testUserId, openId: "test", name: "Test User", email: testUserEmail, role: "user" },
      req: { headers: { origin: "http://localhost:3000" } } as any,
      res: {} as any,
    });

    const result = await caller.checkout.createPremiumCheckout({
      billingPeriod: "annual",
    });

    expect(result).toBeDefined();
    expect(result.checkoutUrl).toBeDefined();
    expect(result.sessionId).toBeDefined();
  });

  it("should get user subscription status", async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, openId: "test", name: "Test User", email: testUserEmail, role: "user" },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.checkout.getUserSubscriptionStatus();

    expect(result).toBeDefined();
    expect(result.tier).toBe("free");
    expect(result.isPremium).toBe(false);
  });
});

describe("Featured Collections", () => {
  it("should fetch featured collections", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.collections.getFeaturedCollections({ limit: 10 });

    expect(result).toBeDefined();
    expect(Array.isArray(result)).toBe(true);
    
    if (result.length > 0) {
      const collection = result[0];
      expect(collection).toHaveProperty("id");
      expect(collection).toHaveProperty("name");
      expect(collection).toHaveProperty("viewCount");
      expect(collection).toHaveProperty("cloneCount");
      expect(collection).toHaveProperty("userName");
      expect(collection).toHaveProperty("itemCount");
    }
  });

  it("should respect limit parameter", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.collections.getFeaturedCollections({ limit: 5 });

    expect(result).toBeDefined();
    expect(result.length).toBeLessThanOrEqual(5);
  });
});

describe("Collection Analytics", () => {
  let adminUserId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Create an admin user
    const [result] = await db.insert(users).values({
      openId: `test-admin-${Date.now()}`,
      name: "Test Admin",
      email: `admin-test-${Date.now()}@example.com`,
      role: "admin",
    });

    adminUserId = result.insertId;
  });

  it("should fetch collection analytics for admin", async () => {
    const caller = appRouter.createCaller({
      user: { id: adminUserId, openId: "test-admin", name: "Admin", email: "admin@test.com", role: "admin" },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.adminAnalytics.getCollectionAnalytics({ limit: 20 });

    expect(result).toBeDefined();
    expect(result).toHaveProperty("collections");
    expect(result).toHaveProperty("summary");
    expect(Array.isArray(result.collections)).toBe(true);
    
    expect(result.summary).toHaveProperty("totalCollections");
    expect(result.summary).toHaveProperty("totalViews");
    expect(result.summary).toHaveProperty("totalClones");
    expect(result.summary).toHaveProperty("avgViewsPerCollection");
    expect(result.summary).toHaveProperty("avgClonesPerCollection");
  });

  it("should reject non-admin users", async () => {
    const caller = appRouter.createCaller({
      user: { id: 999, openId: "test", name: "User", email: "user@test.com", role: "user" },
      req: {} as any,
      res: {} as any,
    });

    await expect(
      caller.adminAnalytics.getCollectionAnalytics({ limit: 20 })
    ).rejects.toThrow();
  });
});
