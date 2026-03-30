/**
 * Freemium tier limits — single source of truth
 * Used by both frontend (display) and backend (enforcement)
 */

export const FREE_TIER_LIMITS = {
  /** Stories per day (free users) */
  storiesPerDay: 1,
  /** Bonus starter stories given on signup */
  bonusStarterStories: 3,
  /** Vocabulary saves per day */
  vocabSavesPerDay: 3,
  /** Dictionary lookups per day */
  dictionaryLookupsPerDay: 10,
  // A1-only restriction removed — free users can access all CEFR levels
} as const;

export const PREMIUM_PRICING = {
  monthly: 9.99,
  annual: 69,
  /** Displayed as "per month" when annual */
  annualPerMonth: 5.75,
  /** Discount percentage for annual vs monthly */
  annualSavingsPercent: 42,
  trialDays: 7,
} as const;

export const SCHOOL_PRICING = {
  /** Volume discount tiers — all billed annually */
  tiers: [
    { minSeats: 10, maxSeats: 49, perSeatPerMonth: 8, perSeatPerYear: 96 },
    { minSeats: 50, maxSeats: 99, perSeatPerMonth: 5, perSeatPerYear: 60 },
    { minSeats: 100, maxSeats: null, perSeatPerMonth: 3, perSeatPerYear: 36 },
  ],
  /** Starting price (shown as headline) */
  startingPerSeatPerMonth: 3,
  /** Minimum seats for any school plan */
  minSeats: 10,
} as const;

export type SubscriptionTier = "free" | "premium" | "premium_plus";

/**
 * Check if a user tier has premium-level access (premium or legacy premium_plus)
 */
export function hasPremiumAccess(tier: SubscriptionTier): boolean {
  return tier === "premium" || tier === "premium_plus";
}
