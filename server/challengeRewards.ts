import { TRPCError } from "@trpc/server";
import { and, eq, sql } from "drizzle-orm";

import { challengeRewardClaims, userStats } from "../drizzle/schema";
import { getDb } from "./db";

export const DAILY_CHALLENGE_XP_REWARD = 50;
export const DAILY_CHALLENGE_COIN_REWARD = 200;

export const DASHBOARD_CHALLENGE_KEYS = {
  CLEAR_DUE_REVIEWS: "clear_due_reviews",
  WEEKLY_GOAL: "weekly_goal",
} as const;

type DashboardChallengeKey =
  (typeof DASHBOARD_CHALLENGE_KEYS)[keyof typeof DASHBOARD_CHALLENGE_KEYS];

function getDateKey(date: Date) {
  return date.toISOString().slice(0, 10);
}

async function ensureUserStatsRow(userId: number) {
  const db = await getDb();
  if (!db) {
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available",
    });
  }

  const existing = await db
    .select()
    .from(userStats)
    .where(eq(userStats.userId, userId))
    .limit(1);
  if (existing.length > 0) return db;

  await db.insert(userStats).values({
    userId,
    currentStreak: 0,
    longestStreak: 0,
    lastActivityDate: null,
    totalXp: 0,
    coins: 0,
    level: 1,
    quizzesCompleted: 0,
    storiesCompleted: 0,
    wordsLearned: 0,
  });

  return db;
}

async function claimChallengeReward(
  userId: number,
  challengeKey: DashboardChallengeKey,
  periodKey: string
) {
  const db = await ensureUserStatsRow(userId);

  const existingClaim = await db
    .select()
    .from(challengeRewardClaims)
    .where(
      and(
        eq(challengeRewardClaims.userId, userId),
        eq(challengeRewardClaims.challengeKey, challengeKey),
        eq(challengeRewardClaims.periodKey, periodKey)
      )
    )
    .limit(1);

  if (existingClaim.length > 0) {
    return {
      claimed: false,
      xpAwarded: DAILY_CHALLENGE_XP_REWARD,
      coinsAwarded: DAILY_CHALLENGE_COIN_REWARD,
    };
  }

  await db.insert(challengeRewardClaims).values({
    userId,
    challengeKey,
    periodKey,
    xpAwarded: DAILY_CHALLENGE_XP_REWARD,
    coinsAwarded: DAILY_CHALLENGE_COIN_REWARD,
  });

  await db
    .update(userStats)
    .set({
      totalXp: sql`${userStats.totalXp} + ${DAILY_CHALLENGE_XP_REWARD}`,
      coins: sql`${userStats.coins} + ${DAILY_CHALLENGE_COIN_REWARD}`,
    })
    .where(eq(userStats.userId, userId));

  return {
    claimed: true,
    xpAwarded: DAILY_CHALLENGE_XP_REWARD,
    coinsAwarded: DAILY_CHALLENGE_COIN_REWARD,
  };
}

export async function claimReviewClearReward(userId: number) {
  return claimChallengeReward(
    userId,
    DASHBOARD_CHALLENGE_KEYS.CLEAR_DUE_REVIEWS,
    getDateKey(new Date())
  );
}

export async function claimWeeklyGoalReward(
  userId: number,
  weekStartDate: Date
) {
  return claimChallengeReward(
    userId,
    DASHBOARD_CHALLENGE_KEYS.WEEKLY_GOAL,
    getDateKey(weekStartDate)
  );
}
