import { describe, it, expect, beforeAll, afterAll } from "vitest";
import Stripe from "stripe";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Stripe Checkout Configuration", () => {
  it("should have valid Stripe price IDs in environment", async () => {
    const monthlyPriceId = process.env.STRIPE_PRICE_PREMIUM_MONTHLY;
    const annualPriceId = process.env.STRIPE_PRICE_PREMIUM_ANNUAL;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

    // Verify env vars are set
    expect(monthlyPriceId).toBeDefined();
    expect(annualPriceId).toBeDefined();
    expect(stripeSecretKey).toBeDefined();

    // Verify format
    expect(monthlyPriceId).toMatch(/^price_/);
    expect(annualPriceId).toMatch(/^price_/);

    // Verify prices exist in Stripe
    const stripe = new Stripe(stripeSecretKey!);

    const monthlyPrice = await stripe.prices.retrieve(monthlyPriceId!);
    expect(monthlyPrice).toBeDefined();
    expect(monthlyPrice.recurring?.interval).toBe("month");
    expect(monthlyPrice.unit_amount).toBe(999); // $9.99

    const annualPrice = await stripe.prices.retrieve(annualPriceId!);
    expect(annualPrice).toBeDefined();
    expect(annualPrice.recurring?.interval).toBe("year");
    expect(annualPrice.unit_amount).toBe(9900); // $99
  });

  it("should validate monthly price configuration", async () => {
    const monthlyPriceId = process.env.STRIPE_PRICE_PREMIUM_MONTHLY;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const stripe = new Stripe(stripeSecretKey!);

    const price = await stripe.prices.retrieve(monthlyPriceId!);
    
    expect(price.active).toBe(true);
    expect(price.currency).toBe("usd");
    expect(price.type).toBe("recurring");
    expect(price.recurring?.interval).toBe("month");
    expect(price.recurring?.interval_count).toBe(1);
  });

  it("should validate annual price configuration", async () => {
    const annualPriceId = process.env.STRIPE_PRICE_PREMIUM_ANNUAL;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const stripe = new Stripe(stripeSecretKey!);

    const price = await stripe.prices.retrieve(annualPriceId!);
    
    expect(price.active).toBe(true);
    expect(price.currency).toBe("usd");
    expect(price.type).toBe("recurring");
    expect(price.recurring?.interval).toBe("year");
    expect(price.recurring?.interval_count).toBe(1);
  });

  it("should verify both prices belong to the same product", async () => {
    const monthlyPriceId = process.env.STRIPE_PRICE_PREMIUM_MONTHLY;
    const annualPriceId = process.env.STRIPE_PRICE_PREMIUM_ANNUAL;
    const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
    const stripe = new Stripe(stripeSecretKey!);

    const monthlyPrice = await stripe.prices.retrieve(monthlyPriceId!);
    const annualPrice = await stripe.prices.retrieve(annualPriceId!);

    expect(monthlyPrice.product).toBe(annualPrice.product);
  });
});

describe("Premium Checkout Webhook Flow", () => {
  let testUserId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Create a test user
    const testEmail = `test-webhook-${Date.now()}@example.com`;
    const testOpenId = `test-openid-${Date.now()}`;
    await db
      .insert(users)
      .values({
        openId: testOpenId,
        email: testEmail,
        name: "Test Webhook User",
        subscriptionTier: "free",
        subscriptionStatus: "active",
      });

    // Fetch the created user
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.email, testEmail))
      .limit(1);

    testUserId = user.id;
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test user
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it("should create a user with free tier by default", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, testUserId))
      .limit(1);

    expect(user).toBeDefined();
    expect(user.subscriptionTier).toBe("free");
    expect(user.subscriptionStatus).toBe("active");
    expect(user.stripeSubscriptionId).toBeNull();
  });

  it("should simulate webhook updating user to premium", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Simulate webhook updating user after successful checkout
    await db
      .update(users)
      .set({
        stripeSubscriptionId: "sub_test_123456",
        subscriptionTier: "premium",
        subscriptionStatus: "active",
      })
      .where(eq(users.id, testUserId));

    // Verify update
    const [updatedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, testUserId))
      .limit(1);

    expect(updatedUser.subscriptionTier).toBe("premium");
    expect(updatedUser.subscriptionStatus).toBe("active");
    expect(updatedUser.stripeSubscriptionId).toBe("sub_test_123456");
  });

  it("should handle subscription cancellation", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Simulate webhook handling subscription cancellation
    await db
      .update(users)
      .set({
        stripeSubscriptionId: null,
        subscriptionTier: "free",
        subscriptionStatus: "canceled",
      })
      .where(eq(users.id, testUserId));

    // Verify downgrade
    const [downgradedUser] = await db
      .select()
      .from(users)
      .where(eq(users.id, testUserId))
      .limit(1);

    expect(downgradedUser.subscriptionTier).toBe("free");
    expect(downgradedUser.subscriptionStatus).toBe("canceled");
    expect(downgradedUser.stripeSubscriptionId).toBeNull();
  });

  it("should handle past_due status", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Simulate webhook handling failed payment
    await db
      .update(users)
      .set({
        stripeSubscriptionId: "sub_test_123456",
        subscriptionTier: "premium",
        subscriptionStatus: "past_due",
      })
      .where(eq(users.id, testUserId));

    // Verify status update
    const [user] = await db
      .select()
      .from(users)
      .where(eq(users.id, testUserId))
      .limit(1);

    expect(user.subscriptionStatus).toBe("past_due");
    expect(user.subscriptionTier).toBe("premium"); // Still premium during grace period
  });
});
