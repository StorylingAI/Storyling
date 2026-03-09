import { describe, it, expect, beforeAll } from "vitest";
import { getDb } from "./db";
import { users, referralCodes, affiliateClicks, affiliateEarnings } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import {
  processReferralSignup,
  processSubscriptionPurchase,
  calculatePendingEarnings,
  COMMISSION_RATES,
  SUBSCRIPTION_PRICES,
} from "./affiliateRewards";

describe("Affiliate Analytics System", () => {
  let testAffiliateId: number;
  let testReferredUserId: number;
  let testReferralCode: string;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create test affiliate user
    const affiliateResult = await db.insert(users).values({
      name: "Test Affiliate",
      email: "affiliate@test.com",
      openId: `test-affiliate-${Date.now()}`,
      subscriptionTier: "premium",
    });
    testAffiliateId = Number(affiliateResult[0].insertId);

    // Create referral code for affiliate
    const codeResult = await db.insert(referralCodes).values({
      userId: testAffiliateId,
      code: `TEST${Date.now()}`,
      discountPercent: 20,
      isActive: true,
      usageCount: 0,
    });
    
    const [code] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.id, Number(codeResult[0].insertId)));
    
    testReferralCode = code.code;
  });

  it("should process referral signup correctly", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a new referred user
    const userResult = await db.insert(users).values({
      name: "Referred User",
      email: "referred@test.com",
      openId: `test-referred-${Date.now()}`,
      subscriptionTier: "free",
    });
    testReferredUserId = Number(userResult[0].insertId);

    // Process the referral signup
    await processReferralSignup(testReferredUserId, testReferralCode, "referred@test.com");

    // Verify referral code usage count increased
    const [updatedCode] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.code, testReferralCode));

    expect(updatedCode.usageCount).toBeGreaterThan(0);
  });

  it("should calculate commission correctly for monthly subscription", async () => {
    const expectedCommission =
      (SUBSCRIPTION_PRICES.premium_monthly * COMMISSION_RATES.premium_monthly) / 100;

    expect(expectedCommission).toBeCloseTo(1.998, 2); // 20% of $9.99
  });

  it("should calculate commission correctly for annual subscription", async () => {
    const expectedCommission =
      (SUBSCRIPTION_PRICES.premium_annual * COMMISSION_RATES.premium_annual) / 100;

    expect(expectedCommission).toBe(24.9975); // 25% of $99.99
  });

  it("should process subscription purchase and create earning record", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Process a premium monthly subscription
    await processSubscriptionPurchase(
      testReferredUserId,
      "premium_monthly",
      "test_stripe_sub_123"
    );

    // Verify earning was created
    const earnings = await db
      .select()
      .from(affiliateEarnings)
      .where(eq(affiliateEarnings.affiliateUserId, testAffiliateId));

    expect(earnings.length).toBeGreaterThan(0);
    
    const earning = earnings[0];
    expect(earning.conversionType).toBe("premium_monthly");
    expect(earning.commissionPercent).toBe(COMMISSION_RATES.premium_monthly);
    expect(parseFloat(earning.commissionAmount)).toBeCloseTo(1.998, 2);
  });

  it("should calculate pending earnings correctly", async () => {
    const pendingAmount = await calculatePendingEarnings(testAffiliateId);

    expect(pendingAmount).toBeGreaterThan(0);
    expect(pendingAmount).toBeCloseTo(1.998, 2);
  });

  it("should not create duplicate earnings for same subscription", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const earningsBefore = await db
      .select()
      .from(affiliateEarnings)
      .where(eq(affiliateEarnings.affiliateUserId, testAffiliateId));

    // Try to process the same subscription again
    await processSubscriptionPurchase(
      testReferredUserId,
      "premium_monthly",
      "test_stripe_sub_123"
    );

    const earningsAfter = await db
      .select()
      .from(affiliateEarnings)
      .where(eq(affiliateEarnings.affiliateUserId, testAffiliateId));

    // Should have same number of earnings (no duplicate created)
    expect(earningsAfter.length).toBe(earningsBefore.length);
  });

  it("should track affiliate clicks correctly", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [code] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.code, testReferralCode));

    // Track a click
    await db.insert(affiliateClicks).values({
      referralCodeId: code.id,
      affiliateUserId: testAffiliateId,
      landingPage: "/",
      converted: false,
    });

    const clicks = await db
      .select()
      .from(affiliateClicks)
      .where(eq(affiliateClicks.affiliateUserId, testAffiliateId));

    expect(clicks.length).toBeGreaterThan(0);
  });
});
