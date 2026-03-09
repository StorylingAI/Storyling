import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { referralRewards, referralCodes, users } from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

// Payout status enum
const PayoutStatus = {
  PENDING: "pending",
  PROCESSING: "processing",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
} as const;

// Minimum payout threshold ($50)
const MIN_PAYOUT_AMOUNT = 50;

// Commission rate (30% of subscription price)
const COMMISSION_RATE = 0.30;
const PREMIUM_MONTHLY_PRICE = 9.99;
const PREMIUM_ANNUAL_PRICE = 99.99;

export const payoutRouter = router({
  /**
   * Get payout history for the current user
   */
  getPayoutHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    // Get user's referral code
    const [referralCode] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.userId, ctx.user.id))
      .limit(1);

    if (!referralCode) {
      return [];
    }

    // TODO: Fetch from payout_requests table once created
    // For now, return mock data
    return [];
  }),

  /**
   * Get available balance for payout
   */
  getAvailableBalance: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    // Get user's referral rewards
    const [rewards] = await db
      .select()
      .from(referralRewards)
      .where(eq(referralRewards.userId, ctx.user.id))
      .limit(1);

    if (!rewards) {
      return {
        totalEarned: 0,
        availableForPayout: 0,
        pendingPayouts: 0,
        completedPayouts: 0,
        canRequestPayout: false,
      };
    }

    // Calculate earnings (assuming $10 per free month earned)
    const totalEarned = rewards.totalMonthsEarned * 10;
    const availableForPayout = totalEarned >= MIN_PAYOUT_AMOUNT ? totalEarned : 0;

    return {
      totalEarned,
      availableForPayout,
      pendingPayouts: 0, // TODO: Calculate from payout_requests table
      completedPayouts: 0, // TODO: Calculate from payout_requests table
      canRequestPayout: availableForPayout >= MIN_PAYOUT_AMOUNT,
    };
  }),

  /**
   * Request a payout
   */
  requestPayout: protectedProcedure
    .input(
      z.object({
        amount: z.number().min(MIN_PAYOUT_AMOUNT),
        method: z.enum(["paypal", "stripe"]),
        paypalEmail: z.string().email().optional(),
        stripeAccountId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Validate payment method details
      if (input.method === "paypal" && !input.paypalEmail) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "PayPal email is required" });
      }

      if (input.method === "stripe" && !input.stripeAccountId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Stripe account ID is required" });
      }

      // Get available balance
      const [rewards] = await db
        .select()
        .from(referralRewards)
        .where(eq(referralRewards.userId, ctx.user.id))
        .limit(1);

      if (!rewards) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No rewards found" });
      }

      const availableBalance = rewards.totalMonthsEarned * 10;

      if (availableBalance < input.amount) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: `Insufficient balance. Available: $${availableBalance}` 
        });
      }

      if (input.amount < MIN_PAYOUT_AMOUNT) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: `Minimum payout amount is $${MIN_PAYOUT_AMOUNT}` 
        });
      }

      // TODO: Create payout_requests table and insert request
      // For now, we'll simulate the payout process

      // Process payout based on method
      try {
        if (input.method === "paypal") {
          await processPayPalPayout({
            recipientEmail: input.paypalEmail!,
            amount: input.amount,
            userId: ctx.user.id,
          });
        } else if (input.method === "stripe") {
          await processStripePayout({
            accountId: input.stripeAccountId!,
            amount: input.amount,
            userId: ctx.user.id,
          });
        }

        // Update rewards to mark as paid
        // TODO: Track this in payout_requests table instead
        
        return {
          success: true,
          message: "Payout request submitted successfully",
          estimatedProcessingTime: "3-5 business days",
        };
      } catch (error) {
        console.error("Payout processing error:", error);
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: "Failed to process payout request" 
        });
      }
    }),

  /**
   * Get payout settings (saved payment methods)
   */
  getPayoutSettings: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    // TODO: Fetch from payout_settings table once created
    return {
      paypalEmail: null,
      stripeConnected: false,
    };
  }),

  /**
   * Update payout settings
   */
  updatePayoutSettings: protectedProcedure
    .input(
      z.object({
        paypalEmail: z.string().email().optional(),
        stripeAccountId: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // TODO: Store in payout_settings table once created
      
      return { success: true };
    }),
});

/**
 * Process PayPal payout
 */
async function processPayPalPayout(params: {
  recipientEmail: string;
  amount: number;
  userId: number;
}): Promise<void> {
  // TODO: Integrate with PayPal Payouts API
  // https://developer.paypal.com/docs/api/payments.payouts-batch/v1/
  
  console.log(`[PayPal Payout] Processing $${params.amount} to ${params.recipientEmail} for user ${params.userId}`);
  
  // Example PayPal API integration:
  /*
  const paypal = require('@paypal/payouts-sdk');
  const client = new paypal.core.PayPalHttpClient(environment);
  
  const request = new paypal.payouts.PayoutsPostRequest();
  request.requestBody({
    sender_batch_header: {
      recipient_type: 'EMAIL',
      email_message: 'You have received a payout from Storyling AI!',
      note: 'Affiliate commission payout',
      sender_batch_id: `payout_${params.userId}_${Date.now()}`,
      email_subject: 'You have a payout!',
    },
    items: [{
      recipient_type: 'EMAIL',
      amount: {
        value: params.amount.toFixed(2),
        currency: 'USD',
      },
      receiver: params.recipientEmail,
      note: 'Affiliate commission',
      sender_item_id: `item_${params.userId}_${Date.now()}`,
    }],
  });
  
  const response = await client.execute(request);
  */
}

/**
 * Process Stripe payout
 */
async function processStripePayout(params: {
  accountId: string;
  amount: number;
  userId: number;
}): Promise<void> {
  // TODO: Integrate with Stripe Connect Payouts API
  // https://stripe.com/docs/connect/payouts
  
  console.log(`[Stripe Payout] Processing $${params.amount} to account ${params.accountId} for user ${params.userId}`);
  
  // Example Stripe API integration:
  /*
  const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
  
  const transfer = await stripe.transfers.create({
    amount: Math.round(params.amount * 100), // Convert to cents
    currency: 'usd',
    destination: params.accountId,
    description: 'Affiliate commission payout',
  });
  */
}
