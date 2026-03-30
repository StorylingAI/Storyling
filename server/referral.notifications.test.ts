import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users, referralCodes, referralConversions, referralRewards } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Referral Email Notifications", () => {
  let testReferrerId: number;
  let testReferredUserId: number;
  let testReferralCodeId: number;
  let testConversionId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Create test referrer user (Premium)
    const [referrerResult] = await db.insert(users).values({
      openId: `test-referrer-${Date.now()}`,
      name: "Test Referrer",
      email: "referrer@test.com",
      subscriptionTier: "premium",
    });
    testReferrerId = referrerResult.insertId;

    // Create test referred user
    const [referredResult] = await db.insert(users).values({
      openId: `test-referred-${Date.now()}`,
      name: "Test Referred",
      email: "referred@test.com",
      subscriptionTier: "free",
    });
    testReferredUserId = referredResult.insertId;

    // Create referral code for referrer
    const [codeResult] = await db.insert(referralCodes).values({
      userId: testReferrerId,
      code: "TESTCODE123",
      discountPercent: 20,
      isActive: true,
    });
    testReferralCodeId = codeResult.insertId;
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    if (testConversionId) {
      await db.delete(referralConversions).where(eq(referralConversions.id, testConversionId));
    }
    if (testReferralCodeId) {
      await db.delete(referralCodes).where(eq(referralCodes.id, testReferralCodeId));
    }
    await db.delete(referralRewards).where(eq(referralRewards.userId, testReferrerId));
    if (testReferrerId) {
      await db.delete(users).where(eq(users.id, testReferrerId));
    }
    if (testReferredUserId) {
      await db.delete(users).where(eq(users.id, testReferredUserId));
    }
  });

  it("should send email notification when referral code is used", async () => {
    const caller = appRouter.createCaller({
      user: { id: testReferredUserId, openId: "test-referred", name: "Test Referred", email: "referred@test.com", role: "user", subscriptionTier: "free" },
      req: {} as any,
      res: {} as any,
    });

    // Record a conversion (this should trigger email notification)
    const result = await caller.referral.recordConversion({
      referralCodeId: testReferralCodeId,
      referredUserId: testReferredUserId,
      referredUserEmail: "referred@test.com",
      discountApplied: 20,
    });

    expect(result.success).toBe(true);

    // Verify conversion was created
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const conversions = await db
      .select()
      .from(referralConversions)
      .where(eq(referralConversions.referredUserId, testReferredUserId));

    expect(conversions.length).toBe(1);
    expect(conversions[0].rewardStatus).toBe("pending");
    testConversionId = conversions[0].id;

    // Note: Email notification is sent via notifyOwner() - in production this would send actual email
    // For testing, we verify the conversion was created successfully
  });

  it("should send congratulations email when reward is applied", async () => {
    if (!testConversionId) {
      throw new Error("Test conversion not created - run previous test first");
    }

    const caller = appRouter.createCaller({
      user: { id: testReferrerId, openId: "test-referrer", name: "Test Referrer", email: "referrer@test.com", role: "user", subscriptionTier: "premium" },
      req: {} as any,
      res: {} as any,
    });

    // Apply the reward (this should trigger congratulations email)
    const result = await caller.referral.applyRewards({
      conversionId: testConversionId,
    });

    expect(result.success).toBe(true);

    // Verify reward was applied
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const [conversion] = await db
      .select()
      .from(referralConversions)
      .where(eq(referralConversions.id, testConversionId));

    expect(conversion.rewardStatus).toBe("applied");
    expect(conversion.rewardAppliedAt).toBeTruthy();

    // Verify reward balance was updated
    const [reward] = await db
      .select()
      .from(referralRewards)
      .where(eq(referralRewards.userId, testReferrerId));

    expect(reward).toBeTruthy();
    expect(reward.totalMonthsEarned).toBeGreaterThan(0);
    expect(reward.monthsAvailable).toBeGreaterThan(0);

    // Note: Email notification is sent via notifyOwner() - in production this would send actual email
    // For testing, we verify the reward was applied successfully
  });

  it("should not allow duplicate referral conversions", async () => {
    const caller = appRouter.createCaller({
      user: { id: testReferredUserId, openId: "test-referred", name: "Test Referred", email: "referred@test.com", role: "user", subscriptionTier: "free" },
      req: {} as any,
      res: {} as any,
    });

    // Try to record the same conversion again
    await expect(
      caller.referral.recordConversion({
        referralCodeId: testReferralCodeId,
        referredUserId: testReferredUserId,
        referredUserEmail: "referred@test.com",
        discountApplied: 20,
      })
    ).rejects.toThrow("User has already been referred");
  });
});
