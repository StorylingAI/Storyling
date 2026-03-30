import Stripe from "stripe";
import { SUBSCRIPTION_PRODUCTS as BASE_PRODUCTS, SubscriptionTier } from "../../shared/subscriptionProducts";

/**
 * Server-side subscription products with Stripe Price IDs.
 * Prices are created dynamically via the Stripe API if not provided via env vars.
 */
export const SUBSCRIPTION_PRODUCTS = {
  ...BASE_PRODUCTS,
  basic: {
    ...BASE_PRODUCTS.basic,
    stripePriceId: process.env.STRIPE_PRICE_BASIC || "",
  },
  premium: {
    ...BASE_PRODUCTS.premium,
    stripePriceId: process.env.STRIPE_PRICE_PREMIUM || "",
  },
} as const;

export type { SubscriptionTier };

// Cache for dynamically created price IDs
const priceCache: Record<string, string> = {};

/**
 * Ensure a Stripe price exists for the given plan.
 * If env var is set, use it. Otherwise, search Stripe for existing price or create one.
 */
async function ensureStripePrice(
  stripe: Stripe,
  opts: {
    lookupKey: string;
    productName: string;
    unitAmount: number; // in cents
    interval: "month" | "year";
    envVar?: string;
  }
): Promise<string> {
  // 1. Check cache
  if (priceCache[opts.lookupKey]) {
    return priceCache[opts.lookupKey];
  }

  // 2. Env var: validate it exists in Stripe before using
  if (opts.envVar && opts.envVar.startsWith("price_")) {
    try {
      const existing = await stripe.prices.retrieve(opts.envVar);
      if (existing.active) {
        priceCache[opts.lookupKey] = opts.envVar;
        return opts.envVar;
      }
    } catch {
      console.warn(`[Stripe] Env price ${opts.envVar} not found, will create dynamically`);
    }
  }

  // 3. Search existing prices by lookup_key
  const existingPrices = await stripe.prices.list({
    lookup_keys: [opts.lookupKey],
    active: true,
    limit: 1,
  });

  if (existingPrices.data.length > 0) {
    priceCache[opts.lookupKey] = existingPrices.data[0].id;
    return existingPrices.data[0].id;
  }

  // 4. Create product + price dynamically
  const price = await stripe.prices.create({
    currency: "usd",
    unit_amount: opts.unitAmount,
    recurring: { interval: opts.interval },
    lookup_key: opts.lookupKey,
    product_data: {
      name: opts.productName,
    },
  });

  console.log(`[Stripe] Created price ${price.id} for ${opts.lookupKey}`);
  priceCache[opts.lookupKey] = price.id;
  return price.id;
}

/**
 * Get or create the Stripe Price ID for Premium monthly ($9.99/mo)
 */
export async function getPremiumMonthlyPriceId(stripe: Stripe): Promise<string> {
  return ensureStripePrice(stripe, {
    lookupKey: "storyling_premium_monthly",
    productName: "Storyling Premium (Monthly)",
    unitAmount: 999, // $9.99
    interval: "month",
    envVar: process.env.STRIPE_PRICE_PREMIUM_MONTHLY,
  });
}

/**
 * Get or create the Stripe Price ID for Premium annual ($99/year)
 */
export async function getPremiumAnnualPriceId(stripe: Stripe): Promise<string> {
  return ensureStripePrice(stripe, {
    lookupKey: "storyling_premium_annual",
    productName: "Storyling Premium (Annual)",
    unitAmount: 9900, // $99
    interval: "year",
    envVar: process.env.STRIPE_PRICE_PREMIUM_ANNUAL,
  });
}

/**
 * Get or create the Stripe Price ID for Basic school plan ($5/student/mo)
 */
export async function getBasicPriceId(stripe: Stripe): Promise<string> {
  return ensureStripePrice(stripe, {
    lookupKey: "storyling_basic_monthly",
    productName: "Storyling Basic School Plan",
    unitAmount: 500, // $5
    interval: "month",
    envVar: process.env.STRIPE_PRICE_BASIC,
  });
}

/**
 * Get or create the Stripe Price ID for Premium school plan ($4/student/mo)
 */
export async function getPremiumSchoolPriceId(stripe: Stripe): Promise<string> {
  return ensureStripePrice(stripe, {
    lookupKey: "storyling_premium_school_monthly",
    productName: "Storyling Premium School Plan",
    unitAmount: 400, // $4
    interval: "month",
    envVar: process.env.STRIPE_PRICE_PREMIUM,
  });
}

/**
 * Calculate monthly cost based on tier and student count
 */
export function calculateMonthlyCost(tier: SubscriptionTier, studentCount: number): number {
  const product = SUBSCRIPTION_PRODUCTS[tier];

  if (tier === "trial" || tier === "enterprise") {
    return 0;
  }

  return product.pricePerStudent * studentCount;
}

/**
 * Get Stripe Price ID for a subscription tier (sync, from env only)
 */
export function getStripePriceId(tier: SubscriptionTier): string | null {
  const product = SUBSCRIPTION_PRODUCTS[tier];
  return "stripePriceId" in product ? product.stripePriceId || null : null;
}

/**
 * Check if an organization can add more students
 */
export function canAddStudents(
  tier: SubscriptionTier,
  currentStudentCount: number,
  studentsToAdd: number
): boolean {
  const product = SUBSCRIPTION_PRODUCTS[tier];

  if (product.maxStudents === -1) {
    return true;
  }

  return currentStudentCount + studentsToAdd <= product.maxStudents;
}

/**
 * Check if an organization can add more teachers
 */
export function canAddTeachers(
  tier: SubscriptionTier,
  currentTeacherCount: number,
  teachersToAdd: number
): boolean {
  const product = SUBSCRIPTION_PRODUCTS[tier];

  if (product.maxTeachers === -1) {
    return true;
  }

  return currentTeacherCount + teachersToAdd <= product.maxTeachers;
}
