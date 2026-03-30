import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users, referralCodes, referralConversions, referralRewards } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Admin Referral Management", () => {
  let testAdminId: number;
  let testReferrerId: number;
  let testReferralCodeId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Create test admin user
    const [adminResult] = await db.insert(users).values({
      openId: `test-admin-${Date.now()}`,
      name: "Test Admin",
      email: "admin@test.com",
      role: "admin",
      subscriptionTier: "premium",
    });
    testAdminId = adminResult.insertId;

    // Create test referrer user
    const [referrerResult] = await db.insert(users).values({
      openId: `test-referrer-admin-${Date.now()}`,
      name: "Test Referrer Admin",
      email: "referrer-admin@test.com",
      subscriptionTier: "premium",
    });
    testReferrerId = referrerResult.insertId;

    // Create referral code
    const [codeResult] = await db.insert(referralCodes).values({
      userId: testReferrerId,
      code: "ADMINTEST123",
      discountPercent: 20,
      isActive: true,
    });
    testReferralCodeId = codeResult.insertId;
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    if (testReferralCodeId) {
      await db.delete(referralCodes).where(eq(referralCodes.id, testReferralCodeId));
    }
    await db.delete(referralRewards).where(eq(referralRewards.userId, testReferrerId));
    if (testReferrerId) {
      await db.delete(users).where(eq(users.id, testReferrerId));
    }
    if (testAdminId) {
      await db.delete(users).where(eq(users.id, testAdminId));
    }
  });

  it("should get referral overview statistics", async () => {
    const caller = appRouter.createCaller({
      user: { id: testAdminId, openId: "test-admin", name: "Test Admin", email: "admin@test.com", role: "admin", subscriptionTier: "premium" },
      req: {} as any,
      res: {} as any,
    });

    const overview = await caller.adminReferral.getOverviewStats();

    expect(overview).toBeTruthy();
    // SQL aggregates may return strings, so check that values exist and can be converted to numbers
    expect(overview.totalCodes).toBeDefined();
    expect(overview.activeCodes).toBeDefined();
    expect(overview.totalConversions).toBeDefined();
    expect(overview.pendingRewards).toBeDefined();
    expect(overview.appliedRewards).toBeDefined();
    expect(Number(overview.totalCodes)).toBeGreaterThanOrEqual(0);
    expect(Number(overview.activeCodes)).toBeGreaterThanOrEqual(0);
  });

  it("should get top referrers list", async () => {
    const caller = appRouter.createCaller({
      user: { id: testAdminId, openId: "test-admin", name: "Test Admin", email: "admin@test.com", role: "admin", subscriptionTier: "premium" },
      req: {} as any,
      res: {} as any,
    });

    const topReferrers = await caller.adminReferral.getTopReferrers({ limit: 10 });

    expect(Array.isArray(topReferrers)).toBe(true);
    
    // Find our test referrer
    const testReferrer = topReferrers.find(r => r.userId === testReferrerId);
    if (testReferrer) {
      expect(testReferrer.userName).toBe("Test Referrer Admin");
      expect(testReferrer.referralCode).toBe("ADMINTEST123");
      expect(testReferrer.discountPercent).toBe(20);
      expect(testReferrer.isActive).toBe(true);
    }
  });

  it("should update referral code discount percentage", async () => {
    const caller = appRouter.createCaller({
      user: { id: testAdminId, openId: "test-admin", name: "Test Admin", email: "admin@test.com", role: "admin", subscriptionTier: "premium" },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.adminReferral.updateDiscountPercent({
      userId: testReferrerId,
      discountPercent: 30,
    });

    expect(result.success).toBe(true);

    // Verify the update
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const [code] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.id, testReferralCodeId));

    expect(code.discountPercent).toBe(30);
  });

  it("should toggle referral code active status", async () => {
    const caller = appRouter.createCaller({
      user: { id: testAdminId, openId: "test-admin", name: "Test Admin", email: "admin@test.com", role: "admin", subscriptionTier: "premium" },
      req: {} as any,
      res: {} as any,
    });

    // Deactivate
    let result = await caller.adminReferral.toggleCodeStatus({
      userId: testReferrerId,
      isActive: false,
    });

    expect(result.success).toBe(true);

    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    let [code] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.id, testReferralCodeId));

    expect(code.isActive).toBe(false);

    // Reactivate
    result = await caller.adminReferral.toggleCodeStatus({
      userId: testReferrerId,
      isActive: true,
    });

    expect(result.success).toBe(true);

    [code] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.id, testReferralCodeId));

    expect(code.isActive).toBe(true);
  });

  it("should manually adjust reward balance", async () => {
    const caller = appRouter.createCaller({
      user: { id: testAdminId, openId: "test-admin", name: "Test Admin", email: "admin@test.com", role: "admin", subscriptionTier: "premium" },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.adminReferral.adjustRewardBalance({
      userId: testReferrerId,
      monthsToAdd: 3,
      reason: "Manual adjustment for testing",
    });

    expect(result.success).toBe(true);

    // Verify the reward balance
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const [reward] = await db
      .select()
      .from(referralRewards)
      .where(eq(referralRewards.userId, testReferrerId));

    expect(reward).toBeTruthy();
    expect(reward.totalMonthsEarned).toBeGreaterThanOrEqual(3);
    expect(reward.monthsAvailable).toBeGreaterThanOrEqual(3);
  });

  it("should create promotional referral campaign", async () => {
    const caller = appRouter.createCaller({
      user: { id: testAdminId, openId: "test-admin", name: "Test Admin", email: "admin@test.com", role: "admin", subscriptionTier: "premium" },
      req: {} as any,
      res: {} as any,
    });

    const futureDate = new Date();
    futureDate.setMonth(futureDate.getMonth() + 3);

    const promoCode = await caller.adminReferral.createPromoCampaign({
      userId: testReferrerId,
      discountPercent: 50,
      maxUsage: 100,
      expiresAt: futureDate,
    });

    expect(promoCode).toBeTruthy();
    expect(promoCode.code).toMatch(/^PROMO\d+$/);
    expect(promoCode.discountPercent).toBe(50);
    expect(promoCode.maxUsage).toBe(100);
    expect(promoCode.isActive).toBe(true);

    // Clean up promo code
    const db = await getDb();
    if (db && promoCode.id) {
      await db.delete(referralCodes).where(eq(referralCodes.id, promoCode.id));
    }
  });

  it("should deny access to non-admin users", async () => {
    const caller = appRouter.createCaller({
      user: { id: testReferrerId, openId: "test-referrer", name: "Test Referrer", email: "referrer@test.com", role: "user", subscriptionTier: "premium" },
      req: {} as any,
      res: {} as any,
    });

    await expect(caller.adminReferral.getOverviewStats()).rejects.toThrow("Admin access required");
    await expect(caller.adminReferral.getTopReferrers({ limit: 10 })).rejects.toThrow("Admin access required");
  });
});
