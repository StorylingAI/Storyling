import { z } from "zod";
import { router, protectedProcedure } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import Stripe from "stripe";
import crypto from "crypto";
import { getDb } from "../db";
import { organizations, organizationAdmins, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";
import { calculateMonthlyCost, getStripePriceId, SUBSCRIPTION_PRODUCTS, getPremiumMonthlyPriceId, getPremiumAnnualPriceId, getBasicPriceId, getPremiumSchoolPriceId } from "./products";
import { sendEmail } from "../_core/email";
import { premiumWelcomeEmail } from "../emailTemplates";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key);
}

function getAppUrl(req: { headers: { origin?: string } }) {
  return req.headers.origin || process.env.VITE_APP_URL || process.env.BASE_URL || "https://storyling.ai";
}

async function sendPremiumUpgradeEmail(user: {
  id?: number;
  email?: string | null;
  name?: string | null;
}) {
  if (!user.email) return;

  const sent = await sendEmail({
    to: user.email,
    subject: "Your Storyling AI Premium upgrade is active",
    html: premiumWelcomeEmail({
      name: user.name,
      appUrl: `${process.env.VITE_APP_URL || process.env.BASE_URL || "https://storyling.ai"}/app?premium_walkthrough=1`,
    }),
  });

  if (!sent) {
    console.error(`[Stripe] Failed to send premium upgrade email for user ${user.id ?? "unknown"}`);
  }
}

export const checkoutRouter = router({
  /**
   * Create a checkout session for individual Premium subscription
   */
  createPremiumCheckout: protectedProcedure
    .input(
      z.object({
        billingPeriod: z.enum(["monthly", "annual"]).default("monthly"),
        referralCode: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get user details
      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      }

      // Check if already Premium
      if (user.subscriptionTier === "premium" && user.subscriptionStatus === "active") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "You already have an active Premium subscription" });
      }

      // Create or retrieve Stripe customer
      let stripeCustomerId = user.stripeCustomerId;

      if (!stripeCustomerId) {
        const customer = await getStripe().customers.create({
          email: user.email || undefined,
          name: user.name || undefined,
          metadata: {
            userId: user.id.toString(),
          },
        });
        stripeCustomerId = customer.id;

        // Update user with Stripe customer ID
        await db
          .update(users)
          .set({ stripeCustomerId })
          .where(eq(users.id, user.id));
      }

      // Determine price ID based on billing period (created dynamically if needed)
      const priceId = input.billingPeriod === "monthly"
        ? await getPremiumMonthlyPriceId(getStripe())
        : await getPremiumAnnualPriceId(getStripe());

      // Validate and apply referral code if provided
      let discountCouponId: string | undefined;
      let referralCodeId: number | undefined;
      if (input.referralCode) {
        const { referralCodes } = await import("../../drizzle/schema");
        const { and } = await import("drizzle-orm");
        const [code] = await db
          .select()
          .from(referralCodes)
          .where(and(
            eq(referralCodes.code, input.referralCode.toUpperCase()),
            eq(referralCodes.isActive, true)
          ))
          .limit(1);

        if (code) {
          // Check if code is still valid
          const isExpired = code.expiresAt && new Date(code.expiresAt) < new Date();
          const isMaxedOut = code.maxUsage && code.usageCount >= code.maxUsage;
          
          if (!isExpired && !isMaxedOut) {
            // Create or retrieve Stripe coupon for this discount
            try {
              const couponId = `REFERRAL_${code.discountPercent}PCT`;
              let coupon;
              try {
                coupon = await getStripe().coupons.retrieve(couponId);
              } catch (err) {
                // Coupon doesn't exist, create it
                coupon = await getStripe().coupons.create({
                  id: couponId,
                  percent_off: code.discountPercent,
                  duration: "once",
                  name: `Referral Discount ${code.discountPercent}%`,
                });
              }
              discountCouponId = coupon.id;
              referralCodeId = code.id;
            } catch (error) {
              console.error("[Stripe] Failed to create/retrieve coupon:", error);
            }
          }
        }
      }

      // Create checkout session
      const origin = getAppUrl(ctx.req);
      const sessionConfig: Stripe.Checkout.SessionCreateParams = {
        customer: stripeCustomerId,
        client_reference_id: user.id.toString(),
        mode: "subscription",
        allow_promotion_codes: true,
        line_items: [
          {
            price: priceId,
            quantity: 1,
          },
        ],
        metadata: {
          userId: user.id.toString(),
          tier: "premium",
          billingPeriod: input.billingPeriod,
          ...(referralCodeId && { referralCodeId: referralCodeId.toString() }),
        },
        subscription_data: {
          metadata: {
            userId: user.id.toString(),
            tier: "premium",
          },
        },
        success_url: `${origin}/app?subscription=success&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${origin}/pricing?subscription=cancelled`,
      };

      // Apply discount coupon if referral code was valid
      if (discountCouponId) {
        sessionConfig.discounts = [{ coupon: discountCouponId }];
      }

      const idempotencyKey = crypto.randomUUID() + `-user-${user.id}-${input.billingPeriod}`;
      const session = await getStripe().checkout.sessions.create(sessionConfig, {
        idempotencyKey,
      });

      return {
        checkoutUrl: session.url!,
        sessionId: session.id,
      };
    }),

  /**
   * Verify checkout session and activate subscription (fallback when webhook is not configured)
   */
  verifyCheckout: protectedProcedure
    .input(z.object({ sessionId: z.string().optional() }).optional())
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!user || !user.stripeCustomerId) {
        return { updated: false, tier: user?.subscriptionTier || "free" };
      }

      // Already premium, no need to verify
      if (user.subscriptionTier === "premium" && user.subscriptionStatus === "active") {
        return { updated: false, tier: "premium" };
      }

      const activatePremium = async (subscriptionId: string) => {
        await db
          .update(users)
          .set({
            stripeSubscriptionId: subscriptionId,
            subscriptionTier: "premium",
            subscriptionStatus: "active",
          })
          .where(eq(users.id, ctx.user.id));

        await sendPremiumUpgradeEmail(user);
        console.log(`[Stripe] Verified and activated premium for user ${ctx.user.id}`);
        return { updated: true, tier: "premium" };
      };

      // Prefer verifying the exact checkout session returned by Stripe.
      try {
        if (input?.sessionId) {
          const session = await getStripe().checkout.sessions.retrieve(input.sessionId);
          const sessionCustomerId =
            typeof session.customer === "string" ? session.customer : session.customer?.id;
          const subscriptionId =
            typeof session.subscription === "string"
              ? session.subscription
              : session.subscription?.id;

          const belongsToUser =
            session.client_reference_id === String(ctx.user.id) ||
            session.metadata?.userId === String(ctx.user.id) ||
            sessionCustomerId === user.stripeCustomerId;

          if (
            belongsToUser &&
            session.payment_status === "paid" &&
            session.status === "complete" &&
            subscriptionId
          ) {
            return activatePremium(subscriptionId);
          }
        }

        // Fallback when the checkout session id was dropped by the browser.
        const subscriptions = await getStripe().subscriptions.list({
          customer: user.stripeCustomerId,
          status: "active",
          limit: 1,
        });

        if (subscriptions.data.length > 0) {
          const sub = subscriptions.data[0];
          return activatePremium(sub.id);
        }

        return { updated: false, tier: user.subscriptionTier };
      } catch (error) {
        console.error("[Stripe] Verify checkout failed:", error);
        return { updated: false, tier: user.subscriptionTier };
      }
    }),

  /**
   * Get current user subscription status (individual)
   */
  getUserSubscriptionStatus: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [user] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      if (!user) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // If no Stripe subscription, return free tier info
      if (!user.stripeSubscriptionId) {
        return {
          tier: user.subscriptionTier,
          status: "active",
          isPremium: false,
        };
      }

      // Fetch from Stripe
      try {
        const subscription = await getStripe().subscriptions.retrieve(user.stripeSubscriptionId);

        return {
          tier: user.subscriptionTier,
          status: subscription.status,
          isPremium: user.subscriptionTier === "premium" && subscription.status === "active",
          currentPeriodEnd: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000) : undefined,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
        };
      } catch (error) {
        console.error("[Stripe] Failed to fetch subscription:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch subscription status" });
      }
    }),

  /**
   * Create a checkout session for school subscription
   */
  createSubscriptionCheckout: protectedProcedure
    .input(
      z.object({
        organizationId: z.number(),
        tier: z.enum(["basic", "premium"]),
        studentCount: z.number().min(1).max(2000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify user is org admin
      const [orgAdmin] = await db
        .select()
        .from(organizationAdmins)
        .where(eq(organizationAdmins.userId, ctx.user.id))
        .limit(1);

      if (!orgAdmin || orgAdmin.organizationId !== input.organizationId) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Only organization admins can purchase subscriptions" });
      }

      // Get organization details
      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, input.organizationId))
        .limit(1);

      if (!org) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Organization not found" });
      }

      // Calculate pricing and get/create Stripe price dynamically
      const monthlyCost = calculateMonthlyCost(input.tier, input.studentCount);
      const stripePriceId = input.tier === "basic"
        ? await getBasicPriceId(getStripe())
        : await getPremiumSchoolPriceId(getStripe());

      if (!stripePriceId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid subscription tier" });
      }

      // Create or retrieve Stripe customer
      let stripeCustomerId = org.stripeCustomerId;

      if (!stripeCustomerId) {
        const customer = await getStripe().customers.create({
          email: org.contactEmail || ctx.user.email || undefined,
          name: org.name,
          metadata: {
            organizationId: org.id.toString(),
            userId: ctx.user.id.toString(),
          },
        });
        stripeCustomerId = customer.id;

        // Update org with Stripe customer ID
        await db
          .update(organizations)
          .set({ stripeCustomerId })
          .where(eq(organizations.id, org.id));
      }

      // Create checkout session
      const origin = getAppUrl(ctx.req);
      const session = await getStripe().checkout.sessions.create({
        customer: stripeCustomerId,
        client_reference_id: org.id.toString(),
        mode: "subscription",
        allow_promotion_codes: true,
        line_items: [
          {
            price: stripePriceId,
            quantity: input.studentCount,
          },
        ],
        metadata: {
          organizationId: org.id.toString(),
          userId: ctx.user.id.toString(),
          tier: input.tier,
          studentCount: input.studentCount.toString(),
        },
        subscription_data: {
          metadata: {
            organizationId: org.id.toString(),
            tier: input.tier,
            studentCount: input.studentCount.toString(),
          },
        },
        success_url: `${origin}/teacher?subscription=success`,
        cancel_url: `${origin}/teacher?subscription=cancelled`,
      }, {
        idempotencyKey: crypto.randomUUID() + `-org-${org.id}-${input.tier}`,
      });

      return {
        checkoutUrl: session.url!,
        sessionId: session.id,
      };
    }),

  /**
   * Get current subscription status
   */
  getSubscriptionStatus: protectedProcedure
    .input(z.object({ organizationId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, input.organizationId))
        .limit(1);

      if (!org) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      // If no Stripe subscription, return trial info
      if (!org.stripeSubscriptionId) {
        return {
          tier: org.subscriptionTier,
          status: "active",
          currentStudents: 0, // TODO: Count from classMembers
          maxStudents: org.maxStudents,
          maxTeachers: org.maxTeachers,
          expiresAt: org.subscriptionExpiresAt,
          isTrial: org.subscriptionTier === "trial",
        };
      }

      // Fetch from Stripe
      try {
        const subscription = await getStripe().subscriptions.retrieve(org.stripeSubscriptionId);

        return {
          tier: org.subscriptionTier,
          status: subscription.status,
          currentStudents: subscription.items.data[0]?.quantity || 0,
          maxStudents: org.maxStudents,
          maxTeachers: org.maxTeachers,
          currentPeriodEnd: (subscription as any).current_period_end ? new Date((subscription as any).current_period_end * 1000) : undefined,
          cancelAtPeriodEnd: subscription.cancel_at_period_end,
          isTrial: false,
        };
      } catch (error) {
        console.error("[Stripe] Failed to fetch subscription:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to fetch subscription status" });
      }
    }),

  /**
   * Update subscription quantity (add/remove seats)
   */
  updateSubscriptionSeats: protectedProcedure
    .input(
      z.object({
        organizationId: z.number(),
        newStudentCount: z.number().min(1).max(2000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify user is org admin
      const [orgAdmin] = await db
        .select()
        .from(organizationAdmins)
        .where(eq(organizationAdmins.userId, ctx.user.id))
        .limit(1);

      if (!orgAdmin || orgAdmin.organizationId !== input.organizationId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, input.organizationId))
        .limit(1);

      if (!org || !org.stripeSubscriptionId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No active subscription found" });
      }

      try {
        const subscription = await getStripe().subscriptions.retrieve(org.stripeSubscriptionId);
        const subscriptionItemId = subscription.items.data[0].id;

        await getStripe().subscriptionItems.update(subscriptionItemId, {
          quantity: input.newStudentCount,
        });

        return { success: true };
      } catch (error) {
        console.error("[Stripe] Failed to update subscription:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to update subscription" });
      }
    }),

  /**
   * Cancel subscription at period end
   */
  cancelSubscription: protectedProcedure
    .input(z.object({ organizationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [orgAdmin] = await db
        .select()
        .from(organizationAdmins)
        .where(eq(organizationAdmins.userId, ctx.user.id))
        .limit(1);

      if (!orgAdmin || orgAdmin.organizationId !== input.organizationId) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      const [org] = await db
        .select()
        .from(organizations)
        .where(eq(organizations.id, input.organizationId))
        .limit(1);

      if (!org || !org.stripeSubscriptionId) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "No active subscription found" });
      }

      try {
        await getStripe().subscriptions.update(org.stripeSubscriptionId, {
          cancel_at_period_end: true,
        });

        return { success: true };
      } catch (error) {
        console.error("[Stripe] Failed to cancel subscription:", error);
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to cancel subscription" });
      }
    }),
});
