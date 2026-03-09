import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { referralCodes, referralConversions, referralRewards, users } from "../drizzle/schema";
import { eq, desc, sql, and } from "drizzle-orm";

/**
 * Admin-only procedure
 */
const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") {
    throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  }
  return next({ ctx });
});

export const adminReferralRouter = router({
  /**
   * Get top referrers with statistics
   */
  getTopReferrers: adminProcedure
    .input(z.object({ limit: z.number().optional().default(20) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      // Get all referral codes with usage stats
      const codes = await db
        .select({
          userId: referralCodes.userId,
          code: referralCodes.code,
          usageCount: referralCodes.usageCount,
          discountPercent: referralCodes.discountPercent,
          isActive: referralCodes.isActive,
        })
        .from(referralCodes)
        .orderBy(desc(referralCodes.usageCount))
        .limit(input.limit);
      
      // Get user details and conversion stats for each referrer
      const topReferrers = await Promise.all(
        codes.map(async (code) => {
          const [user] = await db
            .select({
              name: users.name,
              email: users.email,
              subscriptionTier: users.subscriptionTier,
            })
            .from(users)
            .where(eq(users.id, code.userId))
            .limit(1);
          
          // Get conversion stats
          const conversions = await db
            .select()
            .from(referralConversions)
            .where(eq(referralConversions.referrerId, code.userId));
          
          const successfulConversions = conversions.filter(
            c => c.rewardStatus === "applied"
          ).length;
          
          const pendingConversions = conversions.filter(
            c => c.rewardStatus === "pending"
          ).length;
          
          // Get reward balance
          const [rewards] = await db
            .select()
            .from(referralRewards)
            .where(eq(referralRewards.userId, code.userId))
            .limit(1);
          
          return {
            userId: code.userId,
            userName: user?.name || "Unknown",
            userEmail: user?.email || "",
            subscriptionTier: user?.subscriptionTier || "free",
            referralCode: code.code,
            totalReferrals: code.usageCount,
            successfulConversions,
            pendingConversions,
            discountPercent: code.discountPercent,
            isActive: code.isActive,
            totalMonthsEarned: rewards?.totalMonthsEarned || 0,
            monthsAvailable: rewards?.monthsAvailable || 0,
          };
        })
      );
      
      return topReferrers;
    }),
  
  /**
   * Get all pending referral rewards
   */
  getPendingRewards: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    
    const pending = await db
      .select()
      .from(referralConversions)
      .where(eq(referralConversions.rewardStatus, "pending"))
      .orderBy(desc(referralConversions.createdAt));
    
    // Get user details for each conversion
    const pendingWithDetails = await Promise.all(
      pending.map(async (conversion) => {
        const [referrer] = await db
          .select({ name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, conversion.referrerId))
          .limit(1);
        
        const [referred] = await db
          .select({ name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, conversion.referredUserId))
          .limit(1);
        
        return {
          ...conversion,
          referrerName: referrer?.name || "Unknown",
          referrerEmail: referrer?.email || "",
          referredName: referred?.name || "Unknown",
          referredEmail: referred?.email || conversion.referredUserEmail,
        };
      })
    );
    
    return pendingWithDetails;
  }),
  
  /**
   * Update referral code discount percentage
   */
  updateDiscountPercent: adminProcedure
    .input(z.object({
      userId: z.number(),
      discountPercent: z.number().min(0).max(100),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      await db
        .update(referralCodes)
        .set({ discountPercent: input.discountPercent })
        .where(eq(referralCodes.userId, input.userId));
      
      return { success: true };
    }),
  
  /**
   * Toggle referral code active status
   */
  toggleCodeStatus: adminProcedure
    .input(z.object({
      userId: z.number(),
      isActive: z.boolean(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      await db
        .update(referralCodes)
        .set({ isActive: input.isActive })
        .where(eq(referralCodes.userId, input.userId));
      
      return { success: true };
    }),
  
  /**
   * Manually adjust reward balance
   */
  adjustRewardBalance: adminProcedure
    .input(z.object({
      userId: z.number(),
      monthsToAdd: z.number(),
      reason: z.string(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      // Get or create reward record
      const [existingReward] = await db
        .select()
        .from(referralRewards)
        .where(eq(referralRewards.userId, input.userId))
        .limit(1);
      
      if (existingReward) {
        await db
          .update(referralRewards)
          .set({
            totalMonthsEarned: sql`${referralRewards.totalMonthsEarned} + ${input.monthsToAdd}`,
            monthsAvailable: sql`${referralRewards.monthsAvailable} + ${input.monthsToAdd}`,
            lastRewardAt: new Date(),
          })
          .where(eq(referralRewards.userId, input.userId));
      } else {
        await db.insert(referralRewards).values({
          userId: input.userId,
          totalMonthsEarned: input.monthsToAdd,
          monthsUsed: 0,
          monthsAvailable: input.monthsToAdd,
          lastRewardAt: new Date(),
        });
      }
      
      return { success: true };
    }),
  
  /**
   * Create promotional referral campaign
   */
  createPromoCampaign: adminProcedure
    .input(z.object({
      userId: z.number(),
      discountPercent: z.number().min(0).max(100),
      maxUsage: z.number().optional(),
      expiresAt: z.date().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      // Get user details
      const [user] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);
      
      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }
      
      // Generate unique promo code
      const allCodes = await db.select({ code: referralCodes.code }).from(referralCodes);
      const existingCodeStrings = allCodes.map(c => c.code);
      
      let promoCode = `PROMO${Math.floor(Math.random() * 10000)}`;
      while (existingCodeStrings.includes(promoCode)) {
        promoCode = `PROMO${Math.floor(Math.random() * 10000)}`;
      }
      
      // Create promo code
      const [created] = await db.insert(referralCodes).values({
        userId: input.userId,
        code: promoCode,
        discountPercent: input.discountPercent,
        maxUsage: input.maxUsage,
        expiresAt: input.expiresAt,
        isActive: true,
      });
      
      const [newCode] = await db
        .select()
        .from(referralCodes)
        .where(eq(referralCodes.id, created.insertId))
        .limit(1);
      
      return newCode;
    }),
  
  /**
   * Get referral system overview statistics
   */
  getOverviewStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    
    // Get total referral codes
    const [codeStats] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        active: sql<number>`SUM(CASE WHEN ${referralCodes.isActive} = 1 THEN 1 ELSE 0 END)`,
      })
      .from(referralCodes);
    
    // Get conversion stats
    const [conversionStats] = await db
      .select({
        total: sql<number>`COUNT(*)`,
        pending: sql<number>`SUM(CASE WHEN ${referralConversions.rewardStatus} = 'pending' THEN 1 ELSE 0 END)`,
        applied: sql<number>`SUM(CASE WHEN ${referralConversions.rewardStatus} = 'applied' THEN 1 ELSE 0 END)`,
      })
      .from(referralConversions);
    
    // Get total rewards distributed
    const [rewardStats] = await db
      .select({
        totalMonthsEarned: sql<number>`SUM(${referralRewards.totalMonthsEarned})`,
        totalMonthsUsed: sql<number>`SUM(${referralRewards.monthsUsed})`,
        totalMonthsAvailable: sql<number>`SUM(${referralRewards.monthsAvailable})`,
      })
      .from(referralRewards);
    
    return {
      totalCodes: codeStats?.total || 0,
      activeCodes: codeStats?.active || 0,
      totalConversions: conversionStats?.total || 0,
      pendingRewards: conversionStats?.pending || 0,
      appliedRewards: conversionStats?.applied || 0,
      totalMonthsEarned: rewardStats?.totalMonthsEarned || 0,
      totalMonthsUsed: rewardStats?.totalMonthsUsed || 0,
      totalMonthsAvailable: rewardStats?.totalMonthsAvailable || 0,
    };
  }),
});
