import { Request, Response } from "express";
import Stripe from "stripe";
import { getDb } from "../db";
import { organizations, users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

function getStripe() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not configured");
  return new Stripe(key);
}

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!;

/**
 * Stripe webhook handler
 * Route: POST /api/stripe/webhook
 */
export async function handleStripeWebhook(req: Request, res: Response) {
  const sig = req.headers["stripe-signature"];

  if (!sig) {
    console.error("[Webhook] Missing stripe-signature header");
    return res.status(400).send("Missing stripe-signature header");
  }

  let event: Stripe.Event;

  try {
    event = getStripe().webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error("[Webhook] Signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // CRITICAL: Handle test events
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return res.json({
      verified: true,
    });
  }

  console.log(`[Webhook] Received event: ${event.type} (${event.id})`);

  try {
    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutCompleted(event.data.object as Stripe.Checkout.Session);
        break;

      case "customer.subscription.created":
      case "customer.subscription.updated":
        await handleSubscriptionUpdate(event.data.object as Stripe.Subscription);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription);
        break;

      case "invoice.paid":
        await handleInvoicePaid(event.data.object as Stripe.Invoice);
        break;

      case "invoice.payment_failed":
        await handleInvoiceFailed(event.data.object as Stripe.Invoice);
        break;

      default:
        console.log(`[Webhook] Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error(`[Webhook] Error processing ${event.type}:`, error);
    res.status(500).send("Webhook processing failed");
  }
}

/**
 * Handle successful checkout session
 */
async function handleCheckoutCompleted(session: Stripe.Checkout.Session) {
  console.log("[Webhook] Processing checkout.session.completed");

  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database unavailable");
    return;
  }

  const subscriptionId = session.subscription as string;
  const userId = session.metadata?.userId;
  const organizationId = session.metadata?.organizationId;
  const tier = session.metadata?.tier;
  const referralCodeId = session.metadata?.referralCodeId;

  // Handle individual Premium subscription
  if (userId && !organizationId) {
    console.log(`[Webhook] Processing individual subscription for user ${userId}`);
    
    const userTier = (tier === "premium" || tier === "free") ? tier : "premium";
    
    await db
      .update(users)
      .set({
        stripeSubscriptionId: subscriptionId,
        subscriptionTier: userTier,
        subscriptionStatus: "active",
      })
      .where(eq(users.id, parseInt(userId)));

    console.log(`[Webhook] Updated user ${userId} with subscription ${subscriptionId}`);
    
    // Track referral conversion if referral code was used
    if (referralCodeId) {
      await trackReferralConversion(parseInt(userId), parseInt(referralCodeId), session.customer_email || "");
    }
    
    return;
  }

  // Handle organization subscription
  if (organizationId && tier) {
    console.log(`[Webhook] Processing organization subscription for org ${organizationId}`);
    
    await db
      .update(organizations)
      .set({
        stripeSubscriptionId: subscriptionId,
        subscriptionTier: tier as "basic" | "premium",
        isActive: true,
      })
      .where(eq(organizations.id, parseInt(organizationId)));

    console.log(`[Webhook] Updated organization ${organizationId} with subscription ${subscriptionId}`);
    return;
  }

  console.error("[Webhook] Missing metadata in checkout session - no userId or organizationId found");
}

/**
 * Handle subscription updates
 */
async function handleSubscriptionUpdate(subscription: Stripe.Subscription) {
  console.log("[Webhook] Processing subscription update");

  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database unavailable");
    return;
  }

  const userId = subscription.metadata?.userId;
  const organizationId = subscription.metadata?.organizationId;
  const tier = subscription.metadata?.tier;

  // Handle individual user subscription update
  if (userId && !organizationId) {
    console.log(`[Webhook] Updating individual subscription for user ${userId}`);
    
    const userTier = (tier === "premium" || tier === "free") ? tier : "premium";
    
    await db
      .update(users)
      .set({
        stripeSubscriptionId: subscription.id,
        subscriptionTier: userTier,
        subscriptionStatus: subscription.status as "active" | "canceled" | "past_due" | "incomplete",
      })
      .where(eq(users.id, parseInt(userId)));

    console.log(`[Webhook] Updated user ${userId} subscription status: ${subscription.status}`);
    return;
  }

  // Handle organization subscription update
  if (organizationId) {
    console.log(`[Webhook] Updating organization subscription for org ${organizationId}`);
    
    const quantity = subscription.items.data[0]?.quantity || 0;

    await db
      .update(organizations)
      .set({
        stripeSubscriptionId: subscription.id,
        subscriptionTier: tier as "basic" | "premium" || "basic",
        isActive: subscription.status === "active",
        maxStudents: quantity,
      })
      .where(eq(organizations.id, parseInt(organizationId)));

    console.log(`[Webhook] Updated organization ${organizationId} subscription status: ${subscription.status}`);
    return;
  }

  console.error("[Webhook] Missing userId or organizationId in subscription metadata");
}

/**
 * Handle subscription cancellation
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  console.log("[Webhook] Processing subscription deletion");

  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database unavailable");
    return;
  }

  const userId = subscription.metadata?.userId;
  const organizationId = subscription.metadata?.organizationId;

  // Handle individual user subscription cancellation
  if (userId && !organizationId) {
    console.log(`[Webhook] Canceling individual subscription for user ${userId}`);
    
    await db
      .update(users)
      .set({
        stripeSubscriptionId: null,
        subscriptionTier: "free",
        subscriptionStatus: "canceled",
      })
      .where(eq(users.id, parseInt(userId)));

    console.log(`[Webhook] Downgraded user ${userId} to free tier`);
    return;
  }

  // Handle organization subscription cancellation
  if (organizationId) {
    console.log(`[Webhook] Canceling organization subscription for org ${organizationId}`);
    
    await db
      .update(organizations)
      .set({
        stripeSubscriptionId: null,
        subscriptionTier: "trial",
        isActive: true,
        maxStudents: 100,
        maxTeachers: 10,
      })
      .where(eq(organizations.id, parseInt(organizationId)));

    console.log(`[Webhook] Downgraded organization ${organizationId} to trial`);
    return;
  }

  console.error("[Webhook] Missing userId or organizationId in subscription metadata");
}

/**
 * Handle successful invoice payment
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  console.log("[Webhook] Processing invoice.paid");

  const subscriptionId = typeof (invoice as any).subscription === 'string' ? (invoice as any).subscription : (invoice as any).subscription?.id;

  if (!subscriptionId) {
    return; // One-time payment, not subscription
  }

  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database unavailable");
    return;
  }

  // Ensure user subscription is active
  await db
    .update(users)
    .set({ subscriptionStatus: "active" })
    .where(eq(users.stripeSubscriptionId, subscriptionId));

  // Ensure organization is active
  await db
    .update(organizations)
    .set({ isActive: true })
    .where(eq(organizations.stripeSubscriptionId, subscriptionId));

  console.log(`[Webhook] Confirmed active status for subscription ${subscriptionId}`);
}

/**
 * Handle failed invoice payment
 */
async function handleInvoiceFailed(invoice: Stripe.Invoice) {
  console.log("[Webhook] Processing invoice.payment_failed");

  const subscriptionId = typeof (invoice as any).subscription === 'string' ? (invoice as any).subscription : (invoice as any).subscription?.id;

  if (!subscriptionId) {
    return;
  }

  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database unavailable");
    return;
  }

  // Mark user subscription as past_due
  await db
    .update(users)
    .set({ subscriptionStatus: "past_due" })
    .where(eq(users.stripeSubscriptionId, subscriptionId));

  // Mark organization as inactive (grace period before full cancellation)
  await db
    .update(organizations)
    .set({ isActive: false })
    .where(eq(organizations.stripeSubscriptionId, subscriptionId));

  console.log(`[Webhook] Marked subscription ${subscriptionId} as past_due/inactive`);
}

/**
 * Track referral conversion when a referred user subscribes
 */
async function trackReferralConversion(userId: number, referralCodeId: number, userEmail: string) {
  console.log(`[Webhook] Tracking referral conversion for user ${userId} with code ${referralCodeId}`);
  
  const db = await getDb();
  if (!db) {
    console.error("[Webhook] Database unavailable for referral tracking");
    return;
  }

  try {
    const { referralCodes, referralConversions } = await import("../../drizzle/schema");
    const { sql } = await import("drizzle-orm");
    
    // Get referral code details
    const [code] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.id, referralCodeId))
      .limit(1);
    
    if (!code) {
      console.error(`[Webhook] Referral code ${referralCodeId} not found`);
      return;
    }
    
    // Check if conversion already exists
    const existingConversion = await db
      .select()
      .from(referralConversions)
      .where(eq(referralConversions.referredUserId, userId))
      .limit(1);
    
    if (existingConversion.length > 0) {
      console.log(`[Webhook] Conversion already tracked for user ${userId}`);
      return;
    }
    
    // Create conversion record
    await db.insert(referralConversions).values({
      referralCodeId: code.id,
      referrerId: code.userId,
      referredUserId: userId,
      referredUserEmail: userEmail,
      discountApplied: code.discountPercent,
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
      .where(eq(referralCodes.id, code.id));
    
    console.log(`[Webhook] Successfully tracked referral conversion for user ${userId}`);
  } catch (error) {
    console.error("[Webhook] Error tracking referral conversion:", error);
  }
}
