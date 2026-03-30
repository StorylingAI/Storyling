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
 * Get the start of the current day in the user's timezone.
 * Falls back to UTC if timezone is invalid or unavailable.
 */
function getDayStartForTimezone(timezone?: string | null): Date {
  const now = new Date();
  
  if (timezone) {
    try {
      // Get the current date string in the user's timezone
      const formatter = new Intl.DateTimeFormat("en-CA", {
        timeZone: timezone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      });
      const dateStr = formatter.format(now); // "2026-03-07"
      // Parse as midnight in UTC (we use this as the reference point)
      const [year, month, day] = dateStr.split("-").map(Number);
      return new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
    } catch {
      // Invalid timezone, fall through to UTC
    }
  }
  
  // Fallback: use UTC midnight
  const utcStart = new Date(now);
  utcStart.setUTCHours(0, 0, 0, 0);
  return utcStart;
}

/**
 * Get the next midnight reset time in the user's timezone.
 */
function getNextResetTime(timezone?: string | null): Date {
  const dayStart = getDayStartForTimezone(timezone);
  dayStart.setUTCDate(dayStart.getUTCDate() + 1);
  return dayStart;
}

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
      const { generatedContent, users: usersTable, wordbank } = await import("../drizzle/schema");
      const { eq, and, gte, count } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      
      // Get user record
      const [user] = await db
        .select()
        .from(usersTable)
        .where(eq(usersTable.id, ctx.user.id))
        .limit(1);
      
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      
      const timezone = input?.timezone || null;
      const dayStart = getDayStartForTimezone(timezone);
      const nextReset = getNextResetTime(timezone);
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
          nextResetAt: nextReset.toISOString(),
        };
      }
      
      // ─── Free tier calculations ──────────────────────────────────────
      
      // Stories created today
      const storyResult = await db
        .select({ count: count() })
        .from(generatedContent)
        .where(
          and(
            eq(generatedContent.userId, ctx.user.id),
            gte(generatedContent.generatedAt, dayStart)
          )
        );
      const dailyStoriesUsed = storyResult[0]?.count || 0;
      
      // Starter stories: bonusStoryCredits tracks remaining
      const starterStoriesUsed = FREE_TIER_LIMITS.bonusStarterStories - Math.max(0, user.bonusStoryCredits ?? 0);
      const starterPackCompleted = (user.bonusStoryCredits ?? 0) <= 0;
      
      // Can create if: daily limit not hit, OR bonus credits remain
      const canCreateStory = dailyStoriesUsed < FREE_TIER_LIMITS.storiesPerDay || !starterPackCompleted;
      
      // Vocab saves today
      const vocabResult = await db
        .select({ count: count() })
        .from(wordbank)
        .where(
          and(
            eq(wordbank.userId, ctx.user.id),
            gte(wordbank.createdAt, dayStart)
          )
        );
      const dailyVocabSavesUsed = vocabResult[0]?.count || 0;
      
      // Lookups today — read from DB-backed tracking
      const dailyLookupsUsed = await getDailyLookupCount(ctx.user.id, dayStart);
      
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
        nextResetAt: nextReset.toISOString(),
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
      
      const timezone = input?.timezone || null;
      const dayStart = getDayStartForTimezone(timezone);
      const currentCount = await getDailyLookupCount(ctx.user.id, dayStart);
      
      if (currentCount >= FREE_TIER_LIMITS.dictionaryLookupsPerDay) {
        return { allowed: false, used: currentCount, limit: FREE_TIER_LIMITS.dictionaryLookupsPerDay };
      }
      
      await incrementDailyLookupCount(ctx.user.id, dayStart);
      return { allowed: true, used: currentCount + 1, limit: FREE_TIER_LIMITS.dictionaryLookupsPerDay };
    }),
});

// ─── Lookup Tracking (DB-backed, survives server restarts) ───────────────────

/**
 * Get the daily lookup count for a user.
 * Uses the daily_usage_tracking table if available, falls back to in-memory.
 */
async function getDailyLookupCount(userId: number, dayStart: Date): Promise<number> {
  try {
    const { getDb } = await import("./db");
    const db = await getDb();
    if (!db) return getInMemoryLookupCount(userId, dayStart);
    
    const { dailyUsageTracking } = await import("../drizzle/schema");
    const { eq, and } = await import("drizzle-orm");
    
    const dateStr = dayStart.toISOString().slice(0, 10);
    const [record] = await db
      .select()
      .from(dailyUsageTracking)
      .where(
        and(
          eq(dailyUsageTracking.userId, userId),
          eq(dailyUsageTracking.dateKey, dateStr)
        )
      )
      .limit(1);
    
    return record?.lookupCount ?? 0;
  } catch {
    // Table might not exist yet, fall back to in-memory
    return getInMemoryLookupCount(userId, dayStart);
  }
}

async function incrementDailyLookupCount(userId: number, dayStart: Date): Promise<void> {
  try {
    const { getDb } = await import("./db");
    const db = await getDb();
    if (!db) {
      incrementInMemoryLookupCount(userId, dayStart);
      return;
    }
    
    const { dailyUsageTracking } = await import("../drizzle/schema");
    const { eq, and, sql } = await import("drizzle-orm");
    
    const dateStr = dayStart.toISOString().slice(0, 10);
    
    // Upsert: increment if exists, insert if not
    await db
      .insert(dailyUsageTracking)
      .values({
        userId,
        dateKey: dateStr,
        lookupCount: 1,
        vocabSaveCount: 0,
        storyCount: 0,
      })
      .onDuplicateKeyUpdate({
        set: {
          lookupCount: sql`${dailyUsageTracking.lookupCount} + 1`,
        },
      });
  } catch {
    incrementInMemoryLookupCount(userId, dayStart);
  }
}

// In-memory fallback (used if DB table doesn't exist yet)
function getInMemoryLookupCount(userId: number, dayStart: Date): number {
  const key = `${userId}:${dayStart.toISOString().slice(0, 10)}`;
  return (globalThis as any).__lookupCounts?.get(key) ?? 0;
}

function incrementInMemoryLookupCount(userId: number, dayStart: Date): void {
  const key = `${userId}:${dayStart.toISOString().slice(0, 10)}`;
  if (!(globalThis as any).__lookupCounts) {
    (globalThis as any).__lookupCounts = new Map();
  }
  const current = (globalThis as any).__lookupCounts.get(key) ?? 0;
  (globalThis as any).__lookupCounts.set(key, current + 1);
}
