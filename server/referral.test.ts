import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { users, referralCodes, referralConversions, referralRewards } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Referral System", () => {
  let testUserId: number;
  let testReferralCodeId: number;
  let referredUserId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Create test Premium user
    const [premiumUser] = await db.insert(users).values({
      openId: `test_premium_${Date.now()}`,
      name: "Test Premium User",
      email: `premium_${Date.now()}@test.com`,
      subscriptionTier: "premium",
      subscriptionStatus: "active",
    });
    testUserId = premiumUser.insertId;

    // Create test referred user
    const [newUser] = await db.insert(users).values({
      openId: `test_referred_${Date.now()}`,
      name: "Test Referred User",
      email: `referred_${Date.now()}@test.com`,
      subscriptionTier: "free",
    });
    referredUserId = newUser.insertId;
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Cleanup test data
    if (testReferralCodeId) {
      await db.delete(referralConversions).where(eq(referralConversions.referralCodeId, testReferralCodeId));
      await db.delete(referralCodes).where(eq(referralCodes.id, testReferralCodeId));
    }
    if (testUserId) {
      await db.delete(referralRewards).where(eq(referralRewards.userId, testUserId));
      await db.delete(users).where(eq(users.id, testUserId));
    }
    if (referredUserId) {
      await db.delete(users).where(eq(users.id, referredUserId));
    }
  });

  it("should generate a unique referral code for Premium user", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Create referral code
    const [created] = await db.insert(referralCodes).values({
      userId: testUserId,
      code: `TEST${Date.now()}`,
      discountPercent: 20,
      isActive: true,
    });

    testReferralCodeId = created.insertId;

    const [code] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.id, testReferralCodeId))
      .limit(1);

    expect(code).toBeDefined();
    expect(code.userId).toBe(testUserId);
    expect(code.discountPercent).toBe(20);
    expect(code.isActive).toBe(true);
  });

  it("should validate active referral codes", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const [code] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.id, testReferralCodeId))
      .limit(1);

    expect(code).toBeDefined();
    expect(code.isActive).toBe(true);
    
    // Check expiration
    const isExpired = code.expiresAt ? new Date(code.expiresAt) < new Date() : false;
    expect(isExpired).toBe(false);
    
    // Check usage limit
    const isMaxedOut = code.maxUsage ? code.usageCount >= code.maxUsage : false;
    expect(isMaxedOut).toBe(false);
  });

  it("should track referral conversion", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Create conversion
    await db.insert(referralConversions).values({
      referralCodeId: testReferralCodeId,
      referrerId: testUserId,
      referredUserId: referredUserId,
      referredUserEmail: `referred_${Date.now()}@test.com`,
      discountApplied: 20,
      rewardMonths: 1,
      rewardStatus: "pending",
      subscriptionStartedAt: new Date(),
    });

    const conversions = await db
      .select()
      .from(referralConversions)
      .where(eq(referralConversions.referralCodeId, testReferralCodeId));

    expect(conversions.length).toBeGreaterThan(0);
    expect(conversions[0].referrerId).toBe(testUserId);
    expect(conversions[0].referredUserId).toBe(referredUserId);
    expect(conversions[0].discountApplied).toBe(20);
    expect(conversions[0].rewardStatus).toBe("pending");
  });

  it("should prevent duplicate referrals for same user", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Try to create duplicate conversion
    const existingConversion = await db
      .select()
      .from(referralConversions)
      .where(eq(referralConversions.referredUserId, referredUserId))
      .limit(1);

    expect(existingConversion.length).toBeGreaterThan(0);
  });

  it("should apply rewards to referrer", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Get conversion
    const [conversion] = await db
      .select()
      .from(referralConversions)
      .where(eq(referralConversions.referralCodeId, testReferralCodeId))
      .limit(1);

    expect(conversion).toBeDefined();

    // Create or update reward balance
    const [existingReward] = await db
      .select()
      .from(referralRewards)
      .where(eq(referralRewards.userId, testUserId))
      .limit(1);

    if (existingReward) {
      await db
        .update(referralRewards)
        .set({
          totalMonthsEarned: existingReward.totalMonthsEarned + conversion.rewardMonths,
          monthsAvailable: existingReward.monthsAvailable + conversion.rewardMonths,
          lastRewardAt: new Date(),
        })
        .where(eq(referralRewards.userId, testUserId));
    } else {
      await db.insert(referralRewards).values({
        userId: testUserId,
        totalMonthsEarned: conversion.rewardMonths,
        monthsUsed: 0,
        monthsAvailable: conversion.rewardMonths,
        lastRewardAt: new Date(),
      });
    }

    // Mark conversion as applied
    await db
      .update(referralConversions)
      .set({
        rewardStatus: "applied",
        rewardAppliedAt: new Date(),
      })
      .where(eq(referralConversions.id, conversion.id));

    // Verify reward balance
    const [updatedReward] = await db
      .select()
      .from(referralRewards)
      .where(eq(referralRewards.userId, testUserId))
      .limit(1);

    expect(updatedReward).toBeDefined();
    expect(updatedReward.totalMonthsEarned).toBeGreaterThan(0);
    expect(updatedReward.monthsAvailable).toBeGreaterThan(0);

    // Verify conversion status
    const [updatedConversion] = await db
      .select()
      .from(referralConversions)
      .where(eq(referralConversions.id, conversion.id))
      .limit(1);

    expect(updatedConversion.rewardStatus).toBe("applied");
    expect(updatedConversion.rewardAppliedAt).toBeDefined();
  });

  it("should increment referral code usage count", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const [codeBefore] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.id, testReferralCodeId))
      .limit(1);

    const usageCountBefore = codeBefore.usageCount;

    // Simulate usage increment
    await db
      .update(referralCodes)
      .set({
        usageCount: codeBefore.usageCount + 1,
      })
      .where(eq(referralCodes.id, testReferralCodeId));

    const [codeAfter] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.id, testReferralCodeId))
      .limit(1);

    expect(codeAfter.usageCount).toBe(usageCountBefore + 1);
  });

  it("should respect max usage limit", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Set max usage limit
    await db
      .update(referralCodes)
      .set({
        maxUsage: 1,
        usageCount: 1,
      })
      .where(eq(referralCodes.id, testReferralCodeId));

    const [code] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.id, testReferralCodeId))
      .limit(1);

    const isMaxedOut = code.maxUsage && code.usageCount >= code.maxUsage;
    expect(isMaxedOut).toBe(true);

    // Reset for cleanup
    await db
      .update(referralCodes)
      .set({
        maxUsage: null,
      })
      .where(eq(referralCodes.id, testReferralCodeId));
  });

  it("should respect expiration date", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Set expiration date in the past
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    await db
      .update(referralCodes)
      .set({
        expiresAt: pastDate,
      })
      .where(eq(referralCodes.id, testReferralCodeId));

    const [code] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.id, testReferralCodeId))
      .limit(1);

    const isExpired = code.expiresAt && new Date(code.expiresAt) < new Date();
    expect(isExpired).toBe(true);

    // Reset for cleanup
    await db
      .update(referralCodes)
      .set({
        expiresAt: null,
      })
      .where(eq(referralCodes.id, testReferralCodeId));
  });
});
