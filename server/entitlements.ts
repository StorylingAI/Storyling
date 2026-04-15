/**
 * Entitlements System — Server-side source of truth for plan access, limits, and usage.
 * 
 * All plan behavior is enforced here, not in frontend UI.
 * The frontend reads from this system to display correct states.
 */

import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { FREE_TIER_LIMITS, hasPremiumAccess, type SubscriptionTier } from "../shared/freemiumLimits";
import {
  claimDailyLookup,
  getDailyLookupCount,
  getDailyStoryUsage,
  getDailyVocabSaveUsage,
  getDailyWindow,
} from "./dailyUsage";

// ─── Types ───────────────────────────────────────────────────────────────────

export type PlanState = 
  | "free"
  | "trialing"
  | "premium_monthly"
  | "premium_annual"
  | "canceled_pending_expiry"
  | "expired";

export interface Entitlements {
  planState: PlanState;
  isPremium: boolean;

  // Story limits
  starterStoriesTotal: number;
  starterStoriesUsed: number;
  starterPackCompleted: boolean;
  dailyStoryLimit: number | null; // null = unlimited
  dailyStoriesUsed: number;
  canCreateStory: boolean;
  canRereadStories: boolean; // always true

  // Lookup limits
  dailyLookupLimit: number | null; // null = unlimited
  dailyLookupsUsed: number;
  canLookup: boolean;

  // Vocab save limits
  dailyVocabSaveLimit: number | null; // null = unlimited
  dailyVocabSavesUsed: number;
  canSaveVocab: boolean;

  // Feature access
  canUseAudioSpeedControl: boolean;
  canDownloadOffline: boolean;
  canUseAdvancedComprehension: boolean;
  canUseFilmFormat: boolean;

  // Audio
  audioPlayback: "standard" | "full"; // standard = normal speed only

  // Reset info
  nextResetAt: string; // ISO timestamp of next daily reset
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Determine the plan state from user subscription data.
 */
function determinePlanState(user: {
  subscriptionTier: string;
  subscriptionStatus?: string | null;
  subscriptionCurrentPeriodEnd?: Date | null;
  stripeSubscriptionId?: string | null;
}): PlanState {
  const tier = user.subscriptionTier;
  const status = user.subscriptionStatus;
  
  if (tier === "free" || !tier) {
    // Check if they had a subscription that expired
    if (user.stripeSubscriptionId && status === "canceled") {
      if (user.subscriptionCurrentPeriodEnd && new Date() < user.subscriptionCurrentPeriodEnd) {
        return "canceled_pending_expiry";
      }
      return "expired";
    }
    return "free";
  }
  
  if (hasPremiumAccess(tier as SubscriptionTier)) {
    if (status === "trialing") return "trialing";
    if (status === "canceled") {
      if (user.subscriptionCurrentPeriodEnd && new Date() < user.subscriptionCurrentPeriodEnd) {
        return "canceled_pending_expiry";
      }
      return "expired";
    }
    // Determine monthly vs annual from Stripe (we'll check period length)
    // For now, both are "premium" — the billing interval is a Stripe concern
    return "premium_annual"; // Default to annual since it's preselected
  }
  
  return "free";
}

// ─── Router ──────────────────────────────────────────────────────────────────

export const entitlementRouter = router({
  /**
   * Get the current user's full entitlements — the single source of truth.
   * Frontend should call this on app load and after any plan change.
   */
  getEntitlements: protectedProcedure
    .input(z.object({ timezone: z.string().optional() }).optional())
    .query(async ({ ctx, input }): Promise<Entitlements> => {
      const { getDb } = await import("./db");
      const { users: usersTable } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      // Get user record
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, ctx.user.id))
        .limit(1);
      
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      
      const timezone = input?.timezone || user.timezone || null;
      const dailyWindow = getDailyWindow(timezone);
      const isPremium = hasPremiumAccess(user.subscriptionTier as "free" | "premium" | "premium_plus");
      const planState = determinePlanState(user);
      
      // For premium users (including trialing and canceled_pending_expiry), return unlimited
      const isPremiumAccess = isPremium || planState === "trialing" || planState === "canceled_pending_expiry";
      
      if (isPremiumAccess) {
        return {
          planState,
          isPremium: true,
          starterStoriesTotal: FREE_TIER_LIMITS.bonusStarterStories,
          starterStoriesUsed: FREE_TIER_LIMITS.bonusStarterStories,
          starterPackCompleted: true,
          dailyStoryLimit: null,
          dailyStoriesUsed: 0,
          canCreateStory: true,
          canRereadStories: true,
          dailyLookupLimit: null,
          dailyLookupsUsed: 0,
          canLookup: true,
          dailyVocabSaveLimit: null,
          dailyVocabSavesUsed: 0,
          canSaveVocab: true,
          canUseAudioSpeedControl: true,
          canDownloadOffline: true,
          canUseAdvancedComprehension: true,
          canUseFilmFormat: true,
          audioPlayback: "full",
          nextResetAt: dailyWindow.nextResetAt.toISOString(),
        };
      }
      
      // ─── Free tier calculations ──────────────────────────────────────
      
      const dailyStoriesUsed = await getDailyStoryUsage(ctx.user.id, dailyWindow);
      
      // Starter stories: bonusStoryCredits tracks remaining
      const starterStoriesUsed = FREE_TIER_LIMITS.bonusStarterStories - Math.max(0, user.bonusStoryCredits ?? 0);
      const starterPackCompleted = (user.bonusStoryCredits ?? 0) <= 0;
      
      const canCreateStory = dailyStoriesUsed < FREE_TIER_LIMITS.storiesPerDay;
      
      const dailyVocabSavesUsed = await getDailyVocabSaveUsage(ctx.user.id, dailyWindow);
      
      // Lookups today — read from DB-backed tracking
      const dailyLookupsUsed = await getDailyLookupCount(ctx.user.id, dailyWindow);
      
      return {
        planState: "free",
        isPremium: false,
        starterStoriesTotal: FREE_TIER_LIMITS.bonusStarterStories,
        starterStoriesUsed,
        starterPackCompleted,
        dailyStoryLimit: FREE_TIER_LIMITS.storiesPerDay,
        dailyStoriesUsed,
        canCreateStory,
        canRereadStories: true, // Always allowed
        dailyLookupLimit: FREE_TIER_LIMITS.dictionaryLookupsPerDay,
        dailyLookupsUsed,
        canLookup: dailyLookupsUsed < FREE_TIER_LIMITS.dictionaryLookupsPerDay,
        dailyVocabSaveLimit: FREE_TIER_LIMITS.vocabSavesPerDay,
        dailyVocabSavesUsed,
        canSaveVocab: dailyVocabSavesUsed < FREE_TIER_LIMITS.vocabSavesPerDay,
        canUseAudioSpeedControl: false,
        canDownloadOffline: false,
        canUseAdvancedComprehension: false,
        canUseFilmFormat: false,
        audioPlayback: "standard",
        nextResetAt: dailyWindow.nextResetAt.toISOString(),
      };
    }),

  /**
   * Record a dictionary lookup event (server-side tracking).
   * Returns whether the lookup is allowed.
   */
  recordLookup: protectedProcedure
    .input(z.object({ timezone: z.string().optional() }))
    .mutation(async ({ ctx, input }): Promise<{ allowed: boolean; used: number; limit: number | null }> => {
      const isPremium = hasPremiumAccess(ctx.user.subscriptionTier as "free" | "premium" | "premium_plus");
      if (isPremium) {
        return { allowed: true, used: 0, limit: null };
      }
      
      const timezone = input?.timezone || ctx.user.timezone || null;
      return claimDailyLookup(ctx.user.id, getDailyWindow(timezone));
    }),
});
