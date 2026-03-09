import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { referralCodes, referralConversions, referralRewards, users } from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";
import { notifyAffiliateWelcome, notifyCommissionEarned } from "./affiliateEmailNotifications";

/**
 * Generate a unique referral code based on user's name
 */
function generateReferralCode(userName: string, existingCodes: string[]): string {
  // Clean and format user name (remove special chars, take first 6 chars, uppercase)
  const cleanName = userName
    .replace(/[^a-zA-Z0-9]/g, "")
    .substring(0, 6)
    .toUpperCase();
  
  // Add random suffix to ensure uniqueness
  let code = cleanName;
  let suffix = Math.floor(Math.random() * 10000);
  
  while (existingCodes.includes(`${code}${suffix}`)) {
    suffix = Math.floor(Math.random() * 10000);
  }
  
  return `${code}${suffix}`;
}

export const referralRouter = router({
  /**
   * Apply to become an affiliate
   */
  applyForAffiliate: protectedProcedure
    .input(z.object({
      websiteUrl: z.string().optional(),
      socialMediaHandles: z.string().optional(),
      audienceSize: z.string(),
      promotionStrategy: z.string(),
      whyJoin: z.string(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      // Check if user already has a referral code
      const existingCode = await db
        .select()
        .from(referralCodes)
        .where(and(
          eq(referralCodes.userId, ctx.user.id),
          eq(referralCodes.isActive, true)
        ))
        .limit(1);
      
      if (existingCode.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You already have an active referral code",
        });
      }
      
      // Generate new unique code
      const allCodes = await db.select({ code: referralCodes.code }).from(referralCodes);
      const existingCodeStrings = allCodes.map(c => c.code);
      const newCode = generateReferralCode(ctx.user.name || "USER", existingCodeStrings);
      
      // Create new referral code for the affiliate
      await db.insert(referralCodes).values({
        userId: ctx.user.id,
        code: newCode,
        discountPercent: 20,
        isActive: true,
      });
      
      // Notify owner about new affiliate application
      await notifyOwner({
        title: `🎯 New Affiliate Application`,
        content: `${ctx.user.name} (${ctx.user.email}) has applied to become an affiliate.\n\nAudience Size: ${input.audienceSize}\nPromotion Strategy: ${input.promotionStrategy}\nWhy Join: ${input.whyJoin}\n\nWebsite: ${input.websiteUrl || 'N/A'}\nSocial Media: ${input.socialMediaHandles || 'N/A'}`,
      });
      
      // Send welcome email to new affiliate
      await notifyAffiliateWelcome({
        affiliate: {
          name: ctx.user.name || "Affiliate",
          email: ctx.user.email || "",
        },
        referralCode: newCode,
      });
      
      return { success: true, code: newCode };
    }),
  /**
   * Get or create referral code for current Premium user
   */
  getMyReferralCode: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    
    // Check if user is Premium
    if (ctx.user.subscriptionTier !== "premium") {
      throw new TRPCError({
        code: "FORBIDDEN",
        message: "Referral codes are only available to Premium users",
      });
    }
    
    // Check if user already has an active referral code
    const existingCode = await db
      .select()
      .from(referralCodes)
      .where(and(
        eq(referralCodes.userId, ctx.user.id),
        eq(referralCodes.isActive, true)
      ))
      .limit(1);
    
    if (existingCode.length > 0) {
      return existingCode[0];
    }
    
    // Generate new unique code
    const allCodes = await db.select({ code: referralCodes.code }).from(referralCodes);
    const existingCodeStrings = allCodes.map(c => c.code);
    const newCode = generateReferralCode(ctx.user.name || "USER", existingCodeStrings);
    
    // Create new referral code
    const [created] = await db.insert(referralCodes).values({
      userId: ctx.user.id,
      code: newCode,
      discountPercent: 20,
      isActive: true,
    });
    
    const [newReferralCode] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.id, created.insertId))
      .limit(1);
    
    return newReferralCode;
  }),
  
  /**
   * Get referral statistics for current user
   */
  getMyReferralStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
    
    // Get user's referral code
    const [code] = await db
      .select()
      .from(referralCodes)
      .where(and(
        eq(referralCodes.userId, ctx.user.id),
        eq(referralCodes.isActive, true)
      ))
      .limit(1);
    
    if (!code) {
      return {
        totalReferrals: 0,
        successfulConversions: 0,
        pendingRewards: 0,
        totalMonthsEarned: 0,
        monthsAvailable: 0,
        recentReferrals: [],
      };
    }
    
    // Get conversion statistics
    const conversions = await db
      .select()
      .from(referralConversions)
      .where(eq(referralConversions.referrerId, ctx.user.id))
      .orderBy(desc(referralConversions.createdAt));
    
    const successfulConversions = conversions.filter(
      c => c.rewardStatus === "applied"
    ).length;
    
    const pendingRewards = conversions.filter(
      c => c.rewardStatus === "pending"
    ).length;
    
    // Get reward balance
    const [rewards] = await db
      .select()
      .from(referralRewards)
      .where(eq(referralRewards.userId, ctx.user.id))
      .limit(1);
    
    // Get recent referrals with user details
    const recentConversions = conversions.slice(0, 10);
    const recentReferrals = await Promise.all(
      recentConversions.map(async (conversion) => {
        const [referredUser] = await db
          .select({ name: users.name, email: users.email })
          .from(users)
          .where(eq(users.id, conversion.referredUserId))
          .limit(1);
        
        return {
          id: conversion.id,
          referredUserName: referredUser?.name || "Unknown",
          referredUserEmail: conversion.referredUserEmail,
          discountApplied: conversion.discountApplied,
          rewardStatus: conversion.rewardStatus,
          createdAt: conversion.createdAt,
          subscriptionStartedAt: conversion.subscriptionStartedAt,
        };
      })
    );
    
    return {
      totalReferrals: conversions.length,
      successfulConversions,
      pendingRewards,
      totalMonthsEarned: rewards?.totalMonthsEarned || 0,
      monthsAvailable: rewards?.monthsAvailable || 0,
      recentReferrals,
    };
  }),
  
  /**
   * Validate a referral code (public endpoint for checkout)
   */
  validateReferralCode: protectedProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      const [code] = await db
        .select()
        .from(referralCodes)
        .where(and(
          eq(referralCodes.code, input.code.toUpperCase()),
          eq(referralCodes.isActive, true)
        ))
        .limit(1);
      
      if (!code) {
        return { valid: false, message: "Invalid referral code" };
      }
      
      // Check if code has expired
      if (code.expiresAt && new Date(code.expiresAt) < new Date()) {
        return { valid: false, message: "This referral code has expired" };
      }
      
      // Check if code has reached max usage
      if (code.maxUsage && code.usageCount >= code.maxUsage) {
        return { valid: false, message: "This referral code has reached its usage limit" };
      }
      
      // Get referrer information
      const [referrer] = await db
        .select({ name: users.name })
        .from(users)
        .where(eq(users.id, code.userId))
        .limit(1);
      
      return {
        valid: true,
        discountPercent: code.discountPercent,
        referrerName: referrer?.name || "A friend",
        codeId: code.id,
      };
    }),
  
  /**
   * Record a referral conversion (called after successful subscription)
   */
  recordConversion: protectedProcedure
    .input(z.object({
      referralCodeId: z.number(),
      referredUserId: z.number(),
      referredUserEmail: z.string().email(),
      discountApplied: z.number(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      // Get referral code details
      const [code] = await db
        .select()
        .from(referralCodes)
        .where(eq(referralCodes.id, input.referralCodeId))
        .limit(1);
      
      if (!code) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Referral code not found",
        });
      }
      
      // Check if this user has already been referred
      const existingConversion = await db
        .select()
        .from(referralConversions)
        .where(eq(referralConversions.referredUserId, input.referredUserId))
        .limit(1);
      
      if (existingConversion.length > 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "User has already been referred",
        });
      }
      
      // Create conversion record
      await db.insert(referralConversions).values({
        referralCodeId: input.referralCodeId,
        referrerId: code.userId,
        referredUserId: input.referredUserId,
        referredUserEmail: input.referredUserEmail,
        discountApplied: input.discountApplied,
        rewardMonths: 1,
        rewardStatus: "pending",
        subscriptionStartedAt: new Date(),
      });
      
      // Increment usage count
      await db
        .update(referralCodes)
        .set({
          usageCount: sql`${referralCodes.usageCount} + 1`,
        })
        .where(eq(referralCodes.id, input.referralCodeId));
      
      // Get referrer details for email notification
      const [referrer] = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, code.userId))
        .limit(1);
      
      // Send email notification to referrer about code usage
      if (referrer) {
        await notifyOwner({
          title: `🎉 Your Referral Code Was Used!`,
          content: `Great news! ${input.referredUserEmail} just signed up using your referral code "${code.code}". You'll earn 1 free month once their subscription is confirmed. Keep sharing to earn more rewards!`,
        });
      }
      
      return { success: true };
    }),
  
  /**
   * Apply pending rewards (called by admin or automated job)
   */
  applyRewards: protectedProcedure
    .input(z.object({ conversionId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      // Get conversion details
      const [conversion] = await db
        .select()
        .from(referralConversions)
        .where(eq(referralConversions.id, input.conversionId))
        .limit(1);
      
      if (!conversion) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Conversion not found",
        });
      }
      
      // Only allow referrer or admin to apply rewards
      if (conversion.referrerId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Not authorized to apply this reward",
        });
      }
      
      if (conversion.rewardStatus !== "pending") {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Reward has already been applied or expired",
        });
      }
      
      // Update or create reward balance
      const [existingReward] = await db
        .select()
        .from(referralRewards)
        .where(eq(referralRewards.userId, conversion.referrerId))
        .limit(1);
      
      if (existingReward) {
        await db
          .update(referralRewards)
          .set({
            totalMonthsEarned: sql`${referralRewards.totalMonthsEarned} + ${conversion.rewardMonths}`,
            monthsAvailable: sql`${referralRewards.monthsAvailable} + ${conversion.rewardMonths}`,
            lastRewardAt: new Date(),
          })
          .where(eq(referralRewards.userId, conversion.referrerId));
      } else {
        await db.insert(referralRewards).values({
          userId: conversion.referrerId,
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
        .where(eq(referralConversions.id, input.conversionId));
      
      // Get referrer details for reward notification
      const [referrer] = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, conversion.referrerId))
        .limit(1);
      
      // Get updated reward balance
      const [updatedReward] = await db
        .select()
        .from(referralRewards)
        .where(eq(referralRewards.userId, conversion.referrerId))
        .limit(1);
      
      // Send congratulations email about earned reward
      if (referrer && updatedReward) {
        await notifyOwner({
          title: `🎁 Congratulations! You've Earned a Free Month`,
          content: `Awesome! Your referral reward has been applied. You now have ${updatedReward.monthsAvailable} free month(s) available. Total months earned: ${updatedReward.totalMonthsEarned}. Keep referring friends to earn more!`,
        });
      }
      
      return { success: true };
    }),
});
