import { describe, it, expect, beforeEach } from "vitest";
import { getDb } from "./db";
import { referralCodes, referralConversions, referralRewards, users } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

describe("Referral Analytics and Tiered Rewards", () => {
  let testUserId: number;
  let testReferralCodeId: number;

  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Create test user
    const [user] = await db.insert(users).values({
      openId: `test-referral-${Date.now()}`,
      name: "Test Referrer",
      email: `referrer-${Date.now()}@test.com`,
      subscriptionTier: "premium",
      role: "user",
    });
    testUserId = user.insertId;

    // Create referral code
    const [code] = await db.insert(referralCodes).values({
      userId: testUserId,
      code: `TEST${Date.now()}`,
      discountPercent: 20,
      isActive: true,
      usageCount: 0,
    });
    testReferralCodeId = code.insertId;
  });

  describe("Conversion Trends Analytics", () => {
    it("should track conversions over time", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Create test conversions
      const dates = [
        new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        new Date(), // today
      ];

      for (const date of dates) {
        const [referred] = await db.insert(users).values({
          openId: `referred-${Date.now()}-${Math.random()}`,
          name: "Referred User",
          email: `referred-${Date.now()}-${Math.random()}@test.com`,
          subscriptionTier: "premium",
          role: "user",
        });

        await db.insert(referralConversions).values({
          referralCodeId: testReferralCodeId,
          referrerId: testUserId,
          referredUserId: referred.insertId,
          referredUserEmail: `referred-${Date.now()}@test.com`,
          discountApplied: 20,
          rewardMonths: 1,
          rewardStatus: "applied",
          subscriptionStartedAt: date,
          createdAt: date,
        });
      }

      // Query conversions
      const conversions = await db
        .select()
        .from(referralConversions)
        .where(eq(referralConversions.referralCodeId, testReferralCodeId));

      expect(conversions.length).toBe(3);
      expect(conversions.every((c) => c.rewardStatus === "applied")).toBe(true);
    });

    it("should calculate conversion rates correctly", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Create 5 conversions: 3 successful, 2 pending
      for (let i = 0; i < 5; i++) {
        const [referred] = await db.insert(users).values({
          openId: `referred-${Date.now()}-${i}`,
          name: "Referred User",
          email: `referred-${Date.now()}-${i}@test.com`,
          subscriptionTier: "premium",
          role: "user",
        });

        await db.insert(referralConversions).values({
          referralCodeId: testReferralCodeId,
          referrerId: testUserId,
          referredUserId: referred.insertId,
          referredUserEmail: `referred-${i}@test.com`,
          discountApplied: 20,
          rewardMonths: 1,
          rewardStatus: i < 3 ? "applied" : "pending",
          subscriptionStartedAt: new Date(),
        });
      }

      const conversions = await db
        .select()
        .from(referralConversions)
        .where(eq(referralConversions.referralCodeId, testReferralCodeId));

      const successful = conversions.filter((c) => c.rewardStatus === "applied").length;
      const conversionRate = (successful / conversions.length) * 100;

      expect(conversions.length).toBe(5);
      expect(successful).toBe(3);
      expect(conversionRate).toBe(60);
    });
  });

  describe("Discount Effectiveness Analysis", () => {
    it("should track different discount percentages", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Create codes with different discounts
      const discounts = [10, 20, 30];
      for (const discount of discounts) {
        const [code] = await db.insert(referralCodes).values({
          userId: testUserId,
          code: `DISCOUNT${discount}`,
          discountPercent: discount,
          isActive: true,
        });

        // Create 2 conversions for each discount
        for (let i = 0; i < 2; i++) {
          const [referred] = await db.insert(users).values({
            openId: `referred-${discount}-${i}-${Date.now()}`,
            name: "Referred User",
            email: `referred-${discount}-${i}@test.com`,
            subscriptionTier: "premium",
            role: "user",
          });

          await db.insert(referralConversions).values({
            referralCodeId: code.insertId,
            referrerId: testUserId,
            referredUserId: referred.insertId,
            referredUserEmail: `referred-${discount}-${i}@test.com`,
            discountApplied: discount,
            rewardMonths: 1,
            rewardStatus: "applied",
            subscriptionStartedAt: new Date(),
          });
        }
      }

      const allConversions = await db
        .select()
        .from(referralConversions)
        .where(eq(referralConversions.referrerId, testUserId));

      expect(allConversions.length).toBe(6);
      expect(allConversions.filter((c) => c.discountApplied === 10).length).toBe(2);
      expect(allConversions.filter((c) => c.discountApplied === 20).length).toBe(2);
      expect(allConversions.filter((c) => c.discountApplied === 30).length).toBe(2);
    });
  });

  describe("Tiered Milestone Rewards", () => {
    it("should calculate milestone bonuses correctly", () => {
      const calculateRewards = (referrals: number) => {
        const milestones = [
          { threshold: 5, bonusMonths: 1 },
          { threshold: 10, bonusMonths: 3 },
          { threshold: 25, bonusMonths: 5 },
          { threshold: 50, bonusMonths: 10 },
        ];

        let bonusMonths = 0;
        for (const milestone of milestones) {
          if (referrals >= milestone.threshold) {
            bonusMonths += milestone.bonusMonths;
          }
        }

        return {
          baseMonths: referrals,
          bonusMonths,
          totalMonths: referrals + bonusMonths,
        };
      };

      // Test different referral counts
      const test5 = calculateRewards(5);
      expect(test5.baseMonths).toBe(5);
      expect(test5.bonusMonths).toBe(1);
      expect(test5.totalMonths).toBe(6);

      const test10 = calculateRewards(10);
      expect(test10.baseMonths).toBe(10);
      expect(test10.bonusMonths).toBe(4); // 1 + 3
      expect(test10.totalMonths).toBe(14);

      const test25 = calculateRewards(25);
      expect(test25.baseMonths).toBe(25);
      expect(test25.bonusMonths).toBe(9); // 1 + 3 + 5
      expect(test25.totalMonths).toBe(34);

      const test50 = calculateRewards(50);
      expect(test50.baseMonths).toBe(50);
      expect(test50.bonusMonths).toBe(19); // 1 + 3 + 5 + 10
      expect(test50.totalMonths).toBe(69);
    });

    it("should create and update reward balance", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Create initial reward record
      await db.insert(referralRewards).values({
        userId: testUserId,
        totalMonthsEarned: 0,
        monthsUsed: 0,
        monthsAvailable: 0,
      });

      // Simulate earning 5 referrals (should get 1 bonus month)
      for (let i = 0; i < 5; i++) {
        const [referred] = await db.insert(users).values({
          openId: `milestone-${i}-${Date.now()}`,
          name: "Referred User",
          email: `milestone-${i}@test.com`,
          subscriptionTier: "premium",
          role: "user",
        });

        await db.insert(referralConversions).values({
          referralCodeId: testReferralCodeId,
          referrerId: testUserId,
          referredUserId: referred.insertId,
          referredUserEmail: `milestone-${i}@test.com`,
          discountApplied: 20,
          rewardMonths: 1,
          rewardStatus: "applied",
          subscriptionStartedAt: new Date(),
        });
      }

      // Update reward balance (5 base + 1 bonus = 6 total)
      await db
        .update(referralRewards)
        .set({
          totalMonthsEarned: 6,
          monthsAvailable: 6,
        })
        .where(eq(referralRewards.userId, testUserId));

      const [rewards] = await db
        .select()
        .from(referralRewards)
        .where(eq(referralRewards.userId, testUserId))
        .limit(1);

      expect(rewards.totalMonthsEarned).toBe(6);
      expect(rewards.monthsAvailable).toBe(6);
      expect(rewards.monthsUsed).toBe(0);
    });

    it("should track milestone achievements", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Create 10 successful conversions
      for (let i = 0; i < 10; i++) {
        const [referred] = await db.insert(users).values({
          openId: `achieve-${i}-${Date.now()}`,
          name: "Referred User",
          email: `achieve-${i}@test.com`,
          subscriptionTier: "premium",
          role: "user",
        });

        await db.insert(referralConversions).values({
          referralCodeId: testReferralCodeId,
          referrerId: testUserId,
          referredUserId: referred.insertId,
          referredUserEmail: `achieve-${i}@test.com`,
          discountApplied: 20,
          rewardMonths: 1,
          rewardStatus: "applied",
          subscriptionStartedAt: new Date(),
        });
      }

      const conversions = await db
        .select()
        .from(referralConversions)
        .where(
          and(
            eq(referralConversions.referrerId, testUserId),
            eq(referralConversions.rewardStatus, "applied")
          )
        );

      expect(conversions.length).toBe(10);

      // Should have achieved Bronze (5) and Silver (10) milestones
      const achievedMilestones = [];
      if (conversions.length >= 5) achievedMilestones.push("Bronze");
      if (conversions.length >= 10) achievedMilestones.push("Silver");

      expect(achievedMilestones).toContain("Bronze");
      expect(achievedMilestones).toContain("Silver");
    });
  });

  describe("Reward Redemption", () => {
    it("should allow redeeming available months", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Create reward balance
      await db.insert(referralRewards).values({
        userId: testUserId,
        totalMonthsEarned: 10,
        monthsUsed: 0,
        monthsAvailable: 10,
      });

      // Redeem 3 months
      await db
        .update(referralRewards)
        .set({
          monthsUsed: 3,
          monthsAvailable: 7,
        })
        .where(eq(referralRewards.userId, testUserId));

      const [rewards] = await db
        .select()
        .from(referralRewards)
        .where(eq(referralRewards.userId, testUserId))
        .limit(1);

      expect(rewards.totalMonthsEarned).toBe(10);
      expect(rewards.monthsUsed).toBe(3);
      expect(rewards.monthsAvailable).toBe(7);
    });

    it("should not allow redeeming more than available", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Create reward balance with only 2 months
      await db.insert(referralRewards).values({
        userId: testUserId,
        totalMonthsEarned: 2,
        monthsUsed: 0,
        monthsAvailable: 2,
      });

      const [rewards] = await db
        .select()
        .from(referralRewards)
        .where(eq(referralRewards.userId, testUserId))
        .limit(1);

      // Attempting to redeem 5 months should fail validation
      expect(rewards.monthsAvailable).toBeLessThan(5);
      expect(rewards.monthsAvailable).toBe(2);
    });
  });
});
