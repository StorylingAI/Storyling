import { and, count, eq, gte, lt, sql } from "drizzle-orm";
import { dailyUsageTracking, generatedContent, wordbank } from "../drizzle/schema";
import { FREE_TIER_LIMITS, hasPremiumAccess, type SubscriptionTier } from "../shared/freemiumLimits";
import { getDb } from "./db";

export interface DailyWindow {
  dateKey: string;
  dayStart: Date;
  nextResetAt: Date;
}

type UserPlan = {
  subscriptionTier?: string | null;
  timezone?: string | null;
};

type DailyUsageCounts = {
  lookupCount: number;
  vocabSaveCount: number;
  storyCount: number;
};

function pad(value: number): string {
  return String(value).padStart(2, "0");
}

function getZonedParts(date: Date, timezone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: timezone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  const hour = Number(values.hour);

  return {
    year: Number(values.year),
    month: Number(values.month),
    day: Number(values.day),
    hour: hour === 24 ? 0 : hour,
    minute: Number(values.minute),
    second: Number(values.second),
  };
}

function getTimeZoneOffsetMs(date: Date, timezone: string): number {
  const parts = getZonedParts(date, timezone);
  const utcFromZonedParts = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    parts.hour,
    parts.minute,
    parts.second,
  );

  return utcFromZonedParts - date.getTime();
}

function zonedMidnightToUtc(year: number, month: number, day: number, timezone: string): Date {
  const utcGuess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  const firstOffset = getTimeZoneOffsetMs(utcGuess, timezone);
  const firstUtc = new Date(utcGuess.getTime() - firstOffset);
  const secondOffset = getTimeZoneOffsetMs(firstUtc, timezone);

  return new Date(utcGuess.getTime() - secondOffset);
}

export function getDailyWindow(timezone?: string | null, now = new Date()): DailyWindow {
  if (timezone) {
    try {
      const parts = getZonedParts(now, timezone);
      const nextDay = new Date(Date.UTC(parts.year, parts.month - 1, parts.day + 1));

      return {
        dateKey: `${parts.year}-${pad(parts.month)}-${pad(parts.day)}`,
        dayStart: zonedMidnightToUtc(parts.year, parts.month, parts.day, timezone),
        nextResetAt: zonedMidnightToUtc(
          nextDay.getUTCFullYear(),
          nextDay.getUTCMonth() + 1,
          nextDay.getUTCDate(),
          timezone,
        ),
      };
    } catch {
      // Invalid time zone: fall back to UTC below.
    }
  }

  const dayStart = new Date(now);
  dayStart.setUTCHours(0, 0, 0, 0);
  const nextResetAt = new Date(dayStart);
  nextResetAt.setUTCDate(nextResetAt.getUTCDate() + 1);

  return {
    dateKey: dayStart.toISOString().slice(0, 10),
    dayStart,
    nextResetAt,
  };
}

export function getDayStartForTimezone(timezone?: string | null, now = new Date()): Date {
  return getDailyWindow(timezone, now).dayStart;
}

export function getNextResetTime(timezone?: string | null, now = new Date()): Date {
  return getDailyWindow(timezone, now).nextResetAt;
}

export function isFreeLimitedUser(user: UserPlan): boolean {
  return !hasPremiumAccess((user.subscriptionTier ?? "free") as SubscriptionTier);
}

async function getDailyUsageCounts(userId: number, dateKey: string): Promise<DailyUsageCounts> {
  const db = await getDb();
  if (!db) return { lookupCount: 0, vocabSaveCount: 0, storyCount: 0 };

  const [record] = await db
    .select({
      lookupCount: sql<number>`COALESCE(SUM(${dailyUsageTracking.lookupCount}), 0)`,
      vocabSaveCount: sql<number>`COALESCE(SUM(${dailyUsageTracking.vocabSaveCount}), 0)`,
      storyCount: sql<number>`COALESCE(SUM(${dailyUsageTracking.storyCount}), 0)`,
    })
    .from(dailyUsageTracking)
    .where(and(eq(dailyUsageTracking.userId, userId), eq(dailyUsageTracking.dateKey, dateKey)));

  return {
    lookupCount: Number(record?.lookupCount ?? 0),
    vocabSaveCount: Number(record?.vocabSaveCount ?? 0),
    storyCount: Number(record?.storyCount ?? 0),
  };
}

async function getGeneratedStoriesSince(userId: number, dayStart: Date): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const [result] = await db
    .select({ count: count() })
    .from(generatedContent)
    .where(and(eq(generatedContent.userId, userId), gte(generatedContent.generatedAt, dayStart)));

  return Number(result?.count ?? 0);
}

async function getSavedWordsSince(userId: number, dayStart: Date): Promise<number> {
  const db = await getDb();
  if (!db) return 0;

  const [result] = await db
    .select({ count: count() })
    .from(wordbank)
    .where(and(eq(wordbank.userId, userId), gte(wordbank.createdAt, dayStart)));

  return Number(result?.count ?? 0);
}

async function ensureDailyUsageBaseline(
  userId: number,
  dateKey: string,
  baseline: Partial<DailyUsageCounts>,
): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const lookupCount = baseline.lookupCount ?? 0;
  const vocabSaveCount = baseline.vocabSaveCount ?? 0;
  const storyCount = baseline.storyCount ?? 0;
  const updateSet: Record<string, unknown> = {
    updatedAt: sql`CURRENT_TIMESTAMP`,
  };

  if (baseline.lookupCount !== undefined) {
    updateSet.lookupCount = sql`GREATEST(${dailyUsageTracking.lookupCount}, ${lookupCount})`;
  }
  if (baseline.vocabSaveCount !== undefined) {
    updateSet.vocabSaveCount = sql`GREATEST(${dailyUsageTracking.vocabSaveCount}, ${vocabSaveCount})`;
  }
  if (baseline.storyCount !== undefined) {
    updateSet.storyCount = sql`GREATEST(${dailyUsageTracking.storyCount}, ${storyCount})`;
  }

  await db
    .insert(dailyUsageTracking)
    .values({
      userId,
      dateKey,
      lookupCount,
      vocabSaveCount,
      storyCount,
    })
    .onDuplicateKeyUpdate({
      set: updateSet,
    });
}

function getAffectedRows(result: unknown): number {
  const candidate = Array.isArray(result) ? result[0] : result;
  return Number((candidate as { affectedRows?: number } | undefined)?.affectedRows ?? 0);
}

export async function getDailyLookupCount(userId: number, window: DailyWindow): Promise<number> {
  const tracking = await getDailyUsageCounts(userId, window.dateKey);
  return tracking.lookupCount;
}

export async function claimDailyLookup(
  userId: number,
  window: DailyWindow,
  limit = FREE_TIER_LIMITS.dictionaryLookupsPerDay,
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const used = await getDailyLookupCount(userId, window);

  if (used >= limit) {
    return { allowed: false, used, limit };
  }

  const db = await getDb();
  if (!db) {
    return { allowed: true, used: used + 1, limit };
  }

  await ensureDailyUsageBaseline(userId, window.dateKey, { lookupCount: used });

  const result = await db
    .update(dailyUsageTracking)
    .set({
      lookupCount: sql`${dailyUsageTracking.lookupCount} + 1`,
    })
    .where(
      and(
        eq(dailyUsageTracking.userId, userId),
        eq(dailyUsageTracking.dateKey, window.dateKey),
        lt(dailyUsageTracking.lookupCount, limit),
      ),
    );

  if (getAffectedRows(result) === 0) {
    const currentUsage = await getDailyLookupCount(userId, window);
    return { allowed: false, used: currentUsage, limit };
  }

  return { allowed: true, used: used + 1, limit };
}

export async function getDailyStoryUsage(userId: number, window: DailyWindow): Promise<number> {
  const [tracking, generatedStories] = await Promise.all([
    getDailyUsageCounts(userId, window.dateKey),
    getGeneratedStoriesSince(userId, window.dayStart),
  ]);

  return Math.max(tracking.storyCount, generatedStories);
}

export async function claimDailyStoryGeneration(
  userId: number,
  window: DailyWindow,
  limit = FREE_TIER_LIMITS.storiesPerDay,
): Promise<{ allowed: boolean; used: number; limit: number }> {
  const used = await getDailyStoryUsage(userId, window);

  if (used >= limit) {
    return { allowed: false, used, limit };
  }

  const db = await getDb();
  if (!db) {
    return { allowed: true, used: used + 1, limit };
  }

  await ensureDailyUsageBaseline(userId, window.dateKey, { storyCount: used });

  const result = await db
    .update(dailyUsageTracking)
    .set({
      storyCount: sql`${dailyUsageTracking.storyCount} + 1`,
    })
    .where(
      and(
        eq(dailyUsageTracking.userId, userId),
        eq(dailyUsageTracking.dateKey, window.dateKey),
        lt(dailyUsageTracking.storyCount, limit),
      ),
    );

  if (getAffectedRows(result) === 0) {
    const currentUsage = await getDailyStoryUsage(userId, window);
    return { allowed: false, used: currentUsage, limit };
  }

  return { allowed: true, used: used + 1, limit };
}

export async function getDailyVocabSaveUsage(userId: number, window: DailyWindow): Promise<number> {
  const [tracking, savedWords] = await Promise.all([
    getDailyUsageCounts(userId, window.dateKey),
    getSavedWordsSince(userId, window.dayStart),
  ]);

  return Math.max(tracking.vocabSaveCount, savedWords);
}

export async function recordDailyVocabSave(userId: number, window: DailyWindow): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .insert(dailyUsageTracking)
    .values({
      userId,
      dateKey: window.dateKey,
      lookupCount: 0,
      vocabSaveCount: 1,
      storyCount: 0,
    })
    .onDuplicateKeyUpdate({
      set: {
        vocabSaveCount: sql`${dailyUsageTracking.vocabSaveCount} + 1`,
      },
    });
}
