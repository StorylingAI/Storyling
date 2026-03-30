import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { referralConversions, referralRewards, users } from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

/**
 * Milestone reward tiers
 * 5 referrals = 1 extra month bonus
 * 10 referrals = 3 extra months bonus
 * 25 referrals = 5 extra months bonus
 * 50 referrals = 10 extra months bonus
 */
const MILESTONE_REWARDS = [
  { threshold: 5, bonusMonths: 1, name: "Bronze Referrer" },
  { threshold: 10, bonusMonths: 3, name: "Silver Referrer" },
  { threshold: 25, bonusMonths: 5, name: "Gold Referrer" },
  { threshold: 50, bonusMonths: 10, name: "Platinum Referrer" },
];

/**
 * Calculate total reward months including milestone bonuses
 */
function calculateTotalRewards(successfulReferrals: number): {
  baseMonths: number;
  bonusMonths: number;
  totalMonths: number;
  nextMilestone: { threshold: number; bonusMonths: number; name: string } | null;
  achievedMilestones: string[];
} {
  // Base: 1 month per referral
  const baseMonths = successfulReferrals;
  
  // Calculate milestone bonuses
  let bonusMonths = 0;
  const achievedMilestones: string[] = [];
  let nextMilestone = null;
  
  for (const milestone of MILESTONE_REWARDS) {
    if (successfulReferrals >= milestone.threshold) {
      bonusMonths += milestone.bonusMonths;
      achievedMilestones.push(milestone.name);
    } else {
      nextMilestone = milestone;
      break;
    }
  }
  
  return {
    baseMonths,
    bonusMonths,
    totalMonths: baseMonths + bonusMonths,
    nextMilestone,
    achievedMilestones,
  };
}

export const tieredReferralRewardsRouter = router({
  /**
   * Get current milestone progress and rewards
   */
  getMilestoneProgress: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    // Check if user is Premium
    if (ctx.user.subscriptionTier !== "premium") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Milestone rewards are only available to Premium users",
      });
    }

    // Get successful conversions count
    const conversions = await db
      .select()
      .from(referralConversions)
      .where(
        and(
          eq(referralConversions.referrerId, ctx.user.id),
          eq(referralConversions.rewardStatus, "applied")
        )
      );

    const successfulReferrals = conversions.length;
    const rewardCalculation = calculateTotalRewards(successfulReferrals);

    // Get current reward balance
    const [rewards] = await db
      .select()
      .from(referralRewards)
      .where(eq(referralRewards.userId, ctx.user.id))
      .limit(1);

    return {
      successfulReferrals,
      ...rewardCalculation,
      currentBalance: rewards?.monthsAvailable || 0,
      totalEarned: rewards?.totalMonthsEarned || 0,
      milestones: MILESTONE_REWARDS.map((m) => ({
        ...m,
        achieved: successfulReferrals >= m.threshold,
        progress: Math.min(100, (successfulReferrals / m.threshold) * 100),
      })),
    };
  }),

  /**
   * Check and apply milestone bonuses
   * This should be called after each successful conversion
   */
  checkAndApplyMilestoneBonuses: protectedProcedure
    .input(z.object({ userId: z.number() }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get successful conversions count
      const conversions = await db
        .select()
        .from(referralConversions)
        .where(
          and(
            eq(referralConversions.referrerId, input.userId),
            eq(referralConversions.rewardStatus, "applied")
          )
        );

      const successfulReferrals = conversions.length;
      const rewardCalculation = calculateTotalRewards(successfulReferrals);

      // Get or create reward record
      let [rewards] = await db
        .select()
        .from(referralRewards)
        .where(eq(referralRewards.userId, input.userId))
        .limit(1);

      if (!rewards) {
        await db.insert(referralRewards).values({
          userId: input.userId,
          totalMonthsEarned: 0,
          monthsUsed: 0,
          monthsAvailable: 0,
        });

        [rewards] = await db
          .select()
          .from(referralRewards)
          .where(eq(referralRewards.userId, input.userId))
          .limit(1);
      }

      // Calculate new bonus months to add
      const currentTotalEarned = rewards.totalMonthsEarned;
      const newTotalEarned = rewardCalculation.totalMonths;
      const newBonusMonths = newTotalEarned - currentTotalEarned;

      if (newBonusMonths > 0) {
        // Update reward balance
        await db
          .update(referralRewards)
          .set({
            totalMonthsEarned: newTotalEarned,
            monthsAvailable: sql`${referralRewards.monthsAvailable} + ${newBonusMonths}`,
            lastRewardAt: new Date(),
          })
          .where(eq(referralRewards.userId, input.userId));

        // Check if user just achieved a new milestone
        const newMilestone = rewardCalculation.achievedMilestones[rewardCalculation.achievedMilestones.length - 1];
        if (newMilestone && successfulReferrals === MILESTONE_REWARDS.find(m => m.name === newMilestone)?.threshold) {
          // Notify user about milestone achievement
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.id, input.userId))
            .limit(1);

          if (user) {
            const milestone = MILESTONE_REWARDS.find(m => m.name === newMilestone);
            await notifyOwner({
              title: `🎉 Milestone Achieved: ${newMilestone}`,
              content: `User ${user.name || user.email} reached ${successfulReferrals} referrals and earned ${milestone?.bonusMonths} bonus months!`,
            });
          }
        }

        return {
          success: true,
          newBonusMonths,
          totalMonthsAvailable: rewards.monthsAvailable + newBonusMonths,
          milestonesAchieved: rewardCalculation.achievedMilestones,
        };
      }

      return {
        success: true,
        newBonusMonths: 0,
        totalMonthsAvailable: rewards.monthsAvailable,
        milestonesAchieved: rewardCalculation.achievedMilestones,
      };
    }),

  /**
   * Get milestone leaderboard
   */
  getMilestoneLeaderboard: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    // Check if user is Premium
    if (ctx.user.subscriptionTier !== "premium") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Leaderboard is only available to Premium users",
      });
    }

    // Get top referrers with milestone achievements
    const topReferrers = await db
      .select({
        userId: referralConversions.referrerId,
        successfulReferrals: sql<number>`COUNT(*)`,
      })
      .from(referralConversions)
      .where(eq(referralConversions.rewardStatus, "applied"))
      .groupBy(referralConversions.referrerId)
      .orderBy(sql`COUNT(*) DESC`)
      .limit(10);

    // Get user details and calculate milestones
    const leaderboard = await Promise.all(
      topReferrers.map(async (referrer) => {
        const [user] = await db
          .select({ name: users.name })
          .from(users)
          .where(eq(users.id, referrer.userId))
          .limit(1);

        const rewardCalc = calculateTotalRewards(referrer.successfulReferrals);
        const highestMilestone = rewardCalc.achievedMilestones[rewardCalc.achievedMilestones.length - 1] || "None";

        return {
          userId: referrer.userId,
          userName: user?.name || "Anonymous",
          isCurrentUser: referrer.userId === ctx.user.id,
          successfulReferrals: referrer.successfulReferrals,
          totalMonthsEarned: rewardCalc.totalMonths,
          highestMilestone,
          achievedMilestones: rewardCalc.achievedMilestones,
        };
      })
    );

    return { leaderboard };
  }),

  /**
   * Redeem free months (apply to subscription)
   */
  redeemFreeMonths: protectedProcedure
    .input(z.object({ monthsToRedeem: z.number().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Check if user is Premium
      if (ctx.user.subscriptionTier !== "premium") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only Premium users can redeem rewards",
        });
      }

      // Get reward balance
      const [rewards] = await db
        .select()
        .from(referralRewards)
        .where(eq(referralRewards.userId, ctx.user.id))
        .limit(1);

      if (!rewards || rewards.monthsAvailable < input.monthsToRedeem) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Insufficient reward balance",
        });
      }

      // Update reward balance
      await db
        .update(referralRewards)
        .set({
          monthsUsed: sql`${referralRewards.monthsUsed} + ${input.monthsToRedeem}`,
          monthsAvailable: sql`${referralRewards.monthsAvailable} - ${input.monthsToRedeem}`,
        })
        .where(eq(referralRewards.userId, ctx.user.id));

      // TODO: Integrate with Stripe to extend subscription
      // For now, just notify owner
      await notifyOwner({
        title: "Referral Reward Redemption",
        content: `User ${ctx.user.name || ctx.user.email} redeemed ${input.monthsToRedeem} free months from referral rewards`,
      });

      return {
        success: true,
        monthsRedeemed: input.monthsToRedeem,
        remainingMonths: rewards.monthsAvailable - input.monthsToRedeem,
      };
    }),
});
