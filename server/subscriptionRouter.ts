import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import Stripe from "stripe";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { FREE_TIER_LIMITS } from "../shared/freemiumLimits";
import { getDailyStoryUsage, getDailyWindow } from "./dailyUsage";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key);
}

export const subscriptionRouter = router({
  /**
   * Get current user's subscription details
   */
  getMySubscription: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    // If no Stripe subscription, return free tier info
    if (!user.stripeSubscriptionId) {
      return {
        tier: user.subscriptionTier,
        status: "active" as const,
        isPremium: false,
        billingPeriod: null,
        currentPeriodEnd: null,
        cancelAtPeriodEnd: false,
        paymentMethod: null,
      };
    }

    // Fetch from Stripe
    try {
      const subscription = await getStripe().subscriptions.retrieve(user.stripeSubscriptionId, {
        expand: ["default_payment_method"],
      });

      // Determine billing period from price
      const priceId = subscription.items.data[0]?.price.id;
      const billingPeriod = priceId === process.env.STRIPE_PRICE_PREMIUM_MONTHLY ? "monthly" : "annual";

      // Get payment method details
      let paymentMethod = null;
      if (subscription.default_payment_method && typeof subscription.default_payment_method === "object") {
        const pm = subscription.default_payment_method as Stripe.PaymentMethod;
        if (pm.card) {
          paymentMethod = {
            brand: pm.card.brand,
            last4: pm.card.last4,
            expMonth: pm.card.exp_month,
            expYear: pm.card.exp_year,
          };
        }
      }

      return {
        tier: user.subscriptionTier,
        status: subscription.status,
        isPremium: user.subscriptionTier === "premium" && subscription.status === "active",
        billingPeriod,
        currentPeriodEnd: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000) : null,
        cancelAtPeriodEnd: subscription.cancel_at_period_end,
        paymentMethod,
      };
    } catch (error) {
      console.error("[Stripe] Failed to fetch subscription:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch subscription details" });
    }
  }),

  /**
   * Cancel subscription at period end
   */
  cancelSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (!user || !user.stripeSubscriptionId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No active subscription found" });
    }

    try {
      await getStripe().subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: true,
      });

      return { success: true, message: "Subscription will be cancelled at the end of the current billing period" };
    } catch (error) {
      console.error("[Stripe] Failed to cancel subscription:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to cancel subscription" });
    }
  }),

  /**
   * Reactivate a cancelled subscription
   */
  reactivateSubscription: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (!user || !user.stripeSubscriptionId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No subscription found" });
    }

    try {
      await getStripe().subscriptions.update(user.stripeSubscriptionId, {
        cancel_at_period_end: false,
      });

      return { success: true, message: "Subscription reactivated successfully" };
    } catch (error) {
      console.error("[Stripe] Failed to reactivate subscription:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to reactivate subscription" });
    }
  }),

  /**
   * Create portal session for payment method update
   */
  createPortalSession: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (!user || !user.stripeCustomerId) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "No Stripe customer found" });
    }

    try {
      const origin = ctx.req.headers.origin || process.env.VITE_APP_URL || "https://storyling.ai";
      const session = await getStripe().billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${origin}/settings/subscription`,
      });

      return { url: session.url };
    } catch (error) {
      console.error("[Stripe] Failed to create portal session:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create portal session" });
    }
  }),

  /**
   * Switch billing period (monthly <-> annual)
   */
  switchBillingPeriod: protectedProcedure
    .input(z.object({ newPeriod: z.enum(["monthly", "annual"]) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!user || !user.stripeSubscriptionId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No active subscription found" });
      }

      try {
        const subscription = await getStripe().subscriptions.retrieve(user.stripeSubscriptionId);
        const subscriptionItemId = subscription.items.data[0].id;

        // Determine new price ID
        const newPriceId =
          input.newPeriod === "monthly"
            ? process.env.STRIPE_PRICE_PREMIUM_MONTHLY!
            : process.env.STRIPE_PRICE_PREMIUM_ANNUAL!;

        // Update subscription with new price
        await getStripe().subscriptions.update(user.stripeSubscriptionId, {
          items: [
            {
              id: subscriptionItemId,
              price: newPriceId,
            },
          ],
          proration_behavior: "create_prorations",
        });

        return { success: true, message: `Switched to ${input.newPeriod} billing` };
      } catch (error) {
        console.error("[Stripe] Failed to switch billing period:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to switch billing period" });
      }
    }),

  /**
   * Get billing history with invoices
   */
  getBillingHistory: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (!user || !user.stripeCustomerId) {
      return { invoices: [] };
    }

    try {
      const invoices = await getStripe().invoices.list({
        customer: user.stripeCustomerId,
        limit: 12, // Last 12 invoices
      });

      return {
        invoices: invoices.data.map((invoice) => ({
          id: invoice.id,
          amount: invoice.amount_paid / 100, // Convert cents to dollars
          currency: invoice.currency.toUpperCase(),
          status: invoice.status,
          created: new Date(invoice.created * 1000),
          invoicePdf: invoice.invoice_pdf,
          hostedInvoiceUrl: invoice.hosted_invoice_url,
          periodStart: invoice.period_start ? new Date(invoice.period_start * 1000) : null,
          periodEnd: invoice.period_end ? new Date(invoice.period_end * 1000) : null,
        })),
      };
    } catch (error) {
      console.error("[Stripe] Failed to fetch billing history:", error);
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch billing history" });
    }
  }),

  /**
   * Get usage stats for current billing period (for free tier limits)
   */
  getUsageStats: protectedProcedure
    .input(z.object({ timezone: z.string().optional() }).optional())
    .query(async ({ ctx, input }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    // Get user's subscription tier
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);

    if (!user) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    // If premium, no limits
    if (user.subscriptionTier === "premium" || user.subscriptionTier === "premium_plus") {
      return {
        tier: user.subscriptionTier,
        storiesToday: 0,
        storiesThisMonth: 0,
        storiesLimit: null, // unlimited
        canCreateStory: true,
        canUseFilmFormat: true,
        nextResetAt: null,
      };
    }

    const dailyWindow = getDailyWindow(input?.timezone || user.timezone || null);
    const storyCount = await getDailyStoryUsage(ctx.user.id, dailyWindow);

    return {
      tier: "free",
      storiesToday: storyCount,
      storiesThisMonth: storyCount,
      storiesLimit: FREE_TIER_LIMITS.storiesPerDay,
      canCreateStory: storyCount < FREE_TIER_LIMITS.storiesPerDay,
      canUseFilmFormat: false,
      nextResetAt: dailyWindow.nextResetAt.toISOString(),
    };
  }),
});
