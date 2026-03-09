import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import {
  getAffiliateAnalytics,
  trackAffiliateClick,
  createAffiliateEarning,
  getAffiliateEarnings,
  createAffiliatePayout,
  getAffiliatePayouts,
  getDb,
} from "./db";
import { referralCodes, referralConversions, users } from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

export const affiliateRouter = router({
  /**
   * Get comprehensive affiliate analytics for the current user
   */
  getAnalytics: protectedProcedure.query(async ({ ctx }) => {
    const analytics = await getAffiliateAnalytics(ctx.user.id);
    return analytics;
  }),

  /**
   * Get detailed earnings breakdown
   */
  getEarnings: protectedProcedure.query(async ({ ctx }) => {
    const earnings = await getAffiliateEarnings(ctx.user.id);
    return earnings;
  }),

  /**
   * Get payout history
   */
  getPayouts: protectedProcedure.query(async ({ ctx }) => {
    const payouts = await getAffiliatePayouts(ctx.user.id);
    return payouts;
  }),

  /**
   * Request a payout
   */
  requestPayout: protectedProcedure
    .input(
      z.object({
        amount: z.number().positive(),
        paymentMethod: z.enum(["stripe", "paypal", "bank_transfer"]),
        paymentDetails: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if user has enough pending earnings
      const analytics = await getAffiliateAnalytics(ctx.user.id);
      if (!analytics) throw new Error("Unable to fetch analytics");

      const pendingAmount = parseFloat(analytics.pendingEarnings);
      if (pendingAmount < input.amount) {
        throw new Error(
          `Insufficient pending earnings. You have $${pendingAmount.toFixed(2)} available.`
        );
      }

      // Minimum payout threshold
      if (input.amount < 50) {
        throw new Error("Minimum payout amount is $50.00");
      }

      const payout = await createAffiliatePayout({
        affiliateUserId: ctx.user.id,
        requestedAmount: input.amount.toString(),
        paymentMethod: input.paymentMethod,
        paymentDetails: input.paymentDetails,
        status: "pending",
      });

      return payout;
    }),

  /**
   * Get referral link with tracking
   */
  getReferralLink: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get or create referral code for this user
    const [existingCode] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.userId, ctx.user.id))
      .limit(1);

    if (existingCode) {
      return {
        code: existingCode.code,
        url: `${process.env.VITE_APP_URL || "https://storyling.ai"}?ref=${existingCode.code}`,
        usageCount: existingCode.usageCount,
        isActive: existingCode.isActive,
      };
    }

    // Create new referral code
    const code = `${ctx.user.name?.replace(/\s+/g, "").toUpperCase().slice(0, 8) || "USER"}${Date.now().toString().slice(-4)}`;
    
    const result = await db.insert(referralCodes).values({
      userId: ctx.user.id,
      code,
      discountPercent: 20,
      isActive: true,
      usageCount: 0,
    });

    return {
      code,
      url: `${process.env.VITE_APP_URL || "https://storyling.ai"}?ref=${code}`,
      usageCount: 0,
      isActive: true,
    };
  }),

  /**
   * Get conversion details (referred users who signed up/upgraded)
   */
  getConversions: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get all referral codes for this user
    const codes = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.userId, ctx.user.id));

    if (codes.length === 0) {
      return [];
    }

    const codeIds = codes.map((c) => c.id);

    // Get conversions with user details
    const conversions = await db
      .select({
        id: referralConversions.id,
        referredUserEmail: referralConversions.referredUserEmail,
        discountApplied: referralConversions.discountApplied,
        rewardMonths: referralConversions.rewardMonths,
        rewardStatus: referralConversions.rewardStatus,
        subscriptionStartedAt: referralConversions.subscriptionStartedAt,
        createdAt: referralConversions.createdAt,
        code: referralCodes.code,
      })
      .from(referralConversions)
      .leftJoin(
        referralCodes,
        eq(referralConversions.referralCodeId, referralCodes.id)
      )
      .where(sql`${referralConversions.referralCodeId} IN (${sql.join(codeIds, sql`, `)})`);

    return conversions;
  }),

  /**
   * Track affiliate click (public endpoint for tracking)
   */
  trackClick: protectedProcedure
    .input(
      z.object({
        referralCode: z.string(),
        landingPage: z.string().optional(),
        referrerUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Find the referral code
      const [code] = await db
        .select()
        .from(referralCodes)
        .where(eq(referralCodes.code, input.referralCode))
        .limit(1);

      if (!code) {
        throw new Error("Invalid referral code");
      }

      // Track the click
      const click = await trackAffiliateClick({
        referralCodeId: code.id,
        affiliateUserId: code.userId,
        landingPage: input.landingPage || "/",
        referrerUrl: input.referrerUrl,
        converted: false,
      });

      return { success: true, clickId: click?.id };
    }),
});
