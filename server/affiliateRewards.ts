/**
 * Affiliate Rewards Automation
 * 
 * This module handles automated commission calculation and reward distribution
 * when referred users sign up or upgrade to premium subscriptions.
 */

import { getDb, createAffiliateEarning, markAffiliateClickConverted } from "./db";
import { referralCodes, referralConversions, affiliateClicks, users, affiliateEarnings } from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

/**
 * Commission structure for different conversion types
 */
export const COMMISSION_RATES = {
  signup: 0, // No commission for free signups
  premium_monthly: 20, // 20% commission on monthly subscriptions
  premium_annual: 25, // 25% commission on annual subscriptions
};

/**
 * Subscription pricing (should match Stripe prices)
 */
export const SUBSCRIPTION_PRICES = {
  premium_monthly: 9.99,
  premium_annual: 99.99,
};

/**
 * Process a new user signup with referral code
 * This should be called when a user completes registration
 */
export async function processReferralSignup(
  newUserId: number,
  referralCode: string | null,
  userEmail: string
): Promise<void> {
  if (!referralCode) return;

  const db = await getDb();
  if (!db) return;

  // Find the referral code
  const [code] = await db
    .select()
    .from(referralCodes)
    .where(and(eq(referralCodes.code, referralCode), eq(referralCodes.isActive, true)))
    .limit(1);

  if (!code) {
    console.warn(`[Affiliate] Invalid or inactive referral code: ${referralCode}`);
    return;
  }

  // Create referral conversion record
  await db.insert(referralConversions).values({
    referralCodeId: code.id,
    referrerId: code.userId,
    referredUserId: newUserId,
    referredUserEmail: userEmail,
    discountApplied: code.discountPercent,
    rewardMonths: 1,
    rewardStatus: "pending",
  });

  // Update referral code usage count
  await db
    .update(referralCodes)
    .set({ usageCount: sql`${referralCodes.usageCount} + 1` })
    .where(eq(referralCodes.id, code.id));

  // Find and mark any affiliate clicks as converted
  const [recentClick] = await db
    .select()
    .from(affiliateClicks)
    .where(
      and(
        eq(affiliateClicks.referralCodeId, code.id),
        eq(affiliateClicks.converted, false)
      )
    )
    .orderBy(sql`${affiliateClicks.clickedAt} DESC`)
    .limit(1);

  if (recentClick) {
    await markAffiliateClickConverted(recentClick.id, newUserId);
  }

  console.log(`[Affiliate] Processed signup for referral code: ${referralCode}`);
}

/**
 * Process a premium subscription purchase
 * This should be called when a user upgrades to premium or renews
 */
export async function processSubscriptionPurchase(
  userId: number,
  subscriptionType: "premium_monthly" | "premium_annual",
  stripeSubscriptionId: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Check if this user was referred
  const [conversion] = await db
    .select({
      id: referralConversions.id,
      referrerId: referralConversions.referrerId,
      referralCodeId: referralConversions.referralCodeId,
      rewardStatus: referralConversions.rewardStatus,
    })
    .from(referralConversions)
    .where(eq(referralConversions.referredUserId, userId))
    .limit(1);

  if (!conversion) {
    // User wasn't referred, no commission to process
    return;
  }

  // Check if we've already processed this subscription
  const existingEarning = await db
    .select()
    .from(affiliateEarnings)
    .where(
      and(
        eq(affiliateEarnings.referredUserId, userId),
        eq(affiliateEarnings.conversionType, subscriptionType)
      )
    )
    .limit(1);

  if (existingEarning.length > 0) {
    console.log(`[Affiliate] Commission already processed for user ${userId}`);
    return;
  }

  // Calculate commission
  const subscriptionAmount = SUBSCRIPTION_PRICES[subscriptionType];
  const commissionPercent = COMMISSION_RATES[subscriptionType];
  const commissionAmount = (subscriptionAmount * commissionPercent) / 100;

  // Create affiliate earning record
  await createAffiliateEarning({
    affiliateUserId: conversion.referrerId,
    referralCodeId: conversion.referralCodeId,
    referredUserId: userId,
    conversionType: subscriptionType,
    commissionAmount: commissionAmount.toFixed(2),
    commissionPercent,
    subscriptionAmount: subscriptionAmount.toFixed(2),
    payoutStatus: "pending",
  });

  // Update conversion record
  await db
    .update(referralConversions)
    .set({
      rewardStatus: "applied",
      rewardAppliedAt: new Date(),
      subscriptionStartedAt: new Date(),
    })
    .where(eq(referralConversions.id, conversion.id));

  console.log(
    `[Affiliate] Processed ${subscriptionType} commission: $${commissionAmount.toFixed(2)} for affiliate ${conversion.referrerId}`
  );
}

/**
 * Calculate total pending earnings for an affiliate
 */
export async function calculatePendingEarnings(affiliateUserId: number): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const [result] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${affiliateEarnings.commissionAmount}), 0)`,
    })
    .from(affiliateEarnings)
    .where(
      and(
        eq(affiliateEarnings.affiliateUserId, affiliateUserId),
        eq(affiliateEarnings.payoutStatus, "pending")
      )
    );

  return parseFloat(result?.total || "0");
}

/**
 * Process automated payout (called by admin or scheduled job)
 */
export async function processAutomatedPayout(
  affiliateUserId: number,
  paymentMethod: "stripe" | "paypal",
  transactionId: string
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  // Get all pending earnings
  const pendingEarnings = await db
    .select()
    .from(affiliateEarnings)
    .where(
      and(
        eq(affiliateEarnings.affiliateUserId, affiliateUserId),
        eq(affiliateEarnings.payoutStatus, "pending")
      )
    );

  if (pendingEarnings.length === 0) {
    console.log(`[Affiliate] No pending earnings for user ${affiliateUserId}`);
    return;
  }

  const totalAmount = pendingEarnings.reduce(
    (sum, earning) => sum + parseFloat(earning.commissionAmount),
    0
  );

  // Mark all pending earnings as paid
  await db
    .update(affiliateEarnings)
    .set({
      payoutStatus: "paid",
      paidAt: new Date(),
      paymentMethod,
      paymentReference: transactionId,
    })
    .where(
      and(
        eq(affiliateEarnings.affiliateUserId, affiliateUserId),
        eq(affiliateEarnings.payoutStatus, "pending")
      )
    );

  console.log(
    `[Affiliate] Processed payout of $${totalAmount.toFixed(2)} for affiliate ${affiliateUserId} via ${paymentMethod}`
  );
}

/**
 * Webhook handler for Stripe subscription events
 * Call this from your Stripe webhook handler
 */
export async function handleStripeSubscriptionEvent(
  event: any
): Promise<void> {
  const subscription = event.data.object;

  if (event.type === "checkout.session.completed" || event.type === "customer.subscription.created") {
    const db = await getDb();
    if (!db) return;

    // Find user by Stripe customer ID
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.stripeCustomerId, subscription.customer))
      .limit(1);

    if (!user) {
      console.warn(`[Affiliate] User not found for Stripe customer: ${subscription.customer}`);
      return;
    }

    // Determine subscription type based on price
    const priceId = subscription.items?.data[0]?.price?.id || subscription.plan?.id;
    let subscriptionType: "premium_monthly" | "premium_annual" | null = null;

    // Match against your Stripe price IDs (update these with your actual IDs)
    if (priceId === process.env.STRIPE_PRICE_PREMIUM_MONTHLY) {
      subscriptionType = "premium_monthly";
    } else if (priceId === process.env.STRIPE_PRICE_PREMIUM_ANNUAL) {
      subscriptionType = "premium_annual";
    }

    if (subscriptionType) {
      await processSubscriptionPurchase(user.id, subscriptionType, subscription.id);
    }
  }
}
