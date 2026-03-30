import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { referralCodes, referralConversions, users } from "../drizzle/schema";
import { eq, and, gte, lte, sql, desc } from "drizzle-orm";

export const referralAnalyticsRouter = router({
  /**
   * Get conversion rate trends over time
   */
  getConversionTrends: protectedProcedure
    .input(
      z.object({
        period: z.enum(["7d", "30d", "90d", "1y"]).default("30d"),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Check if user is Premium
      if (ctx.user.subscriptionTier !== "premium") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Analytics are only available to Premium users",
        });
      }

      // Get user's referral code
      const [code] = await db
        .select()
        .from(referralCodes)
        .where(and(eq(referralCodes.userId, ctx.user.id), eq(referralCodes.isActive, true)))
        .limit(1);

      if (!code) {
        return { trends: [], totalConversions: 0, conversionRate: 0 };
      }

      // Calculate date range
      const now = new Date();
      const daysMap = { "7d": 7, "30d": 30, "90d": 90, "1y": 365 };
      const days = daysMap[input.period];
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      // Get conversions grouped by date
      const conversions = await db
        .select({
          date: sql<string>`DATE(${referralConversions.createdAt})`,
          count: sql<number>`COUNT(*)`,
          successful: sql<number>`SUM(CASE WHEN ${referralConversions.rewardStatus} = 'applied' THEN 1 ELSE 0 END)`,
        })
        .from(referralConversions)
        .where(
          and(
            eq(referralConversions.referralCodeId, code.id),
            gte(referralConversions.createdAt, startDate)
          )
        )
        .groupBy(sql<string>`DATE(${referralConversions.createdAt})`)
        .orderBy(sql<string>`DATE(${referralConversions.createdAt})`);

      // Calculate overall stats
      const totalConversions = conversions.reduce((sum, c) => sum + c.count, 0);
      const totalSuccessful = conversions.reduce((sum, c) => sum + c.successful, 0);
      const conversionRate = totalConversions > 0 ? (totalSuccessful / totalConversions) * 100 : 0;

      return {
        trends: conversions.map((c) => ({
          date: c.date,
          conversions: c.count,
          successful: c.successful,
          rate: c.count > 0 ? (c.successful / c.count) * 100 : 0,
        })),
        totalConversions,
        conversionRate: Math.round(conversionRate * 10) / 10,
      };
    }),

  /**
   * Get discount effectiveness analysis
   */
  getDiscountEffectiveness: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    // Check if user is Premium
    if (ctx.user.subscriptionTier !== "premium") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Analytics are only available to Premium users",
      });
    }

    // Get user's referral code
    const [code] = await db
      .select()
      .from(referralCodes)
      .where(and(eq(referralCodes.userId, ctx.user.id), eq(referralCodes.isActive, true)))
      .limit(1);

    if (!code) {
      return { discountAnalysis: [], currentDiscount: 20 };
    }

    // Get conversions grouped by discount percentage
    const discountStats = await db
      .select({
        discount: referralConversions.discountApplied,
        totalUses: sql<number>`COUNT(*)`,
        successfulConversions: sql<number>`SUM(CASE WHEN ${referralConversions.rewardStatus} = 'applied' THEN 1 ELSE 0 END)`,
      })
      .from(referralConversions)
      .where(eq(referralConversions.referralCodeId, code.id))
      .groupBy(referralConversions.discountApplied)
      .orderBy(referralConversions.discountApplied);

    return {
      discountAnalysis: discountStats.map((stat) => ({
        discountPercent: stat.discount,
        totalUses: stat.totalUses,
        successfulConversions: stat.successfulConversions,
        conversionRate:
          stat.totalUses > 0 ? Math.round((stat.successfulConversions / stat.totalUses) * 1000) / 10 : 0,
      })),
      currentDiscount: code.discountPercent,
    };
  }),

  /**
   * Get seasonal trends and patterns
   */
  getSeasonalTrends: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    // Check if user is Premium
    if (ctx.user.subscriptionTier !== "premium") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Analytics are only available to Premium users",
      });
    }

    // Get user's referral code
    const [code] = await db
      .select()
      .from(referralCodes)
      .where(and(eq(referralCodes.userId, ctx.user.id), eq(referralCodes.isActive, true)))
      .limit(1);

    if (!code) {
      return { monthlyTrends: [], weekdayTrends: [] };
    }

    // Get conversions grouped by month
    const monthlyStats = await db
      .select({
        month: sql<string>`DATE_FORMAT(${referralConversions.createdAt}, '%Y-%m')`,
        conversions: sql<number>`COUNT(*)`,
        successful: sql<number>`SUM(CASE WHEN ${referralConversions.rewardStatus} = 'applied' THEN 1 ELSE 0 END)`,
      })
      .from(referralConversions)
      .where(eq(referralConversions.referralCodeId, code.id))
      .groupBy(sql<string>`DATE_FORMAT(${referralConversions.createdAt}, '%Y-%m')`)
      .orderBy(sql<string>`DATE_FORMAT(${referralConversions.createdAt}, '%Y-%m')`);

    // Get conversions grouped by day of week
    const weekdayStats = await db
      .select({
        dayOfWeek: sql<number>`DAYOFWEEK(${referralConversions.createdAt})`,
        conversions: sql<number>`COUNT(*)`,
      })
      .from(referralConversions)
      .where(eq(referralConversions.referralCodeId, code.id))
      .groupBy(sql<number>`DAYOFWEEK(${referralConversions.createdAt})`)
      .orderBy(sql<number>`DAYOFWEEK(${referralConversions.createdAt})`);

    const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

    return {
      monthlyTrends: monthlyStats.map((stat) => ({
        month: stat.month,
        conversions: stat.conversions,
        successful: stat.successful,
        rate: stat.conversions > 0 ? Math.round((stat.successful / stat.conversions) * 1000) / 10 : 0,
      })),
      weekdayTrends: weekdayStats.map((stat) => ({
        day: dayNames[stat.dayOfWeek - 1],
        conversions: stat.conversions,
      })),
    };
  }),

  /**
   * Get top performing referrers (for comparison/motivation)
   */
  getTopReferrers: protectedProcedure
    .input(z.object({ limit: z.number().min(1).max(10).default(5) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Check if user is Premium
      if (ctx.user.subscriptionTier !== "premium") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Analytics are only available to Premium users",
        });
      }

      // Get top referrers by successful conversions (anonymized)
      const topReferrers = await db
        .select({
          referrerId: referralConversions.referrerId,
          totalConversions: sql<number>`COUNT(*)`,
          successfulConversions: sql<number>`SUM(CASE WHEN ${referralConversions.rewardStatus} = 'applied' THEN 1 ELSE 0 END)`,
        })
        .from(referralConversions)
        .groupBy(referralConversions.referrerId)
        .orderBy(desc(sql<number>`SUM(CASE WHEN ${referralConversions.rewardStatus} = 'applied' THEN 1 ELSE 0 END)`))
        .limit(input.limit);

      // Get current user's rank
      const allReferrers = await db
        .select({
          referrerId: referralConversions.referrerId,
          successfulConversions: sql<number>`SUM(CASE WHEN ${referralConversions.rewardStatus} = 'applied' THEN 1 ELSE 0 END)`,
        })
        .from(referralConversions)
        .groupBy(referralConversions.referrerId)
        .orderBy(desc(sql<number>`SUM(CASE WHEN ${referralConversions.rewardStatus} = 'applied' THEN 1 ELSE 0 END)`));

      const userRank = allReferrers.findIndex((r) => r.referrerId === ctx.user.id) + 1;

      return {
        topReferrers: topReferrers.map((r, index) => ({
          rank: index + 1,
          isCurrentUser: r.referrerId === ctx.user.id,
          totalConversions: r.totalConversions,
          successfulConversions: r.successfulConversions,
          conversionRate:
            r.totalConversions > 0
              ? Math.round((r.successfulConversions / r.totalConversions) * 1000) / 10
              : 0,
        })),
        currentUserRank: userRank || null,
        totalReferrers: allReferrers.length,
      };
    }),
});
