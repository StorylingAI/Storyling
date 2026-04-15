import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  userStats,
  achievements,
  userAchievements,
  quizAttempts,
  generatedContent,
  users,
} from "../drizzle/schema";
import { eq, and, sql, desc, gte } from "drizzle-orm";

/**
 * Calculate current streak based on last activity date
 */
function calculateStreak(
  lastActivityDate: Date | null,
  currentStreakCount: number
): number {
  if (!lastActivityDate) return 0;

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const lastActivity = new Date(
    lastActivityDate.getFullYear(),
    lastActivityDate.getMonth(),
    lastActivityDate.getDate()
  );

  const daysDiff = Math.floor(
    (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
  );

  // If last activity was today, maintain current streak
  if (daysDiff === 0) return currentStreakCount;

  // If last activity was yesterday, increment streak
  if (daysDiff === 1) return currentStreakCount + 1;

  // If more than 1 day gap, reset streak
  return 1;
}

/**
 * Calculate XP reward based on quiz score
 */
function calculateQuizXP(score: number, totalQuestions: number): number {
  const percentage = (score / totalQuestions) * 100;
  if (percentage === 100) return 50; // Perfect score
  if (percentage >= 80) return 30; // Great score
  if (percentage >= 60) return 20; // Good score
  return 10; // Participation
}

/**
 * Calculate level from total XP
 * Level 1: 0-99 XP
 * Level 2: 100-299 XP
 * Level 3: 300-599 XP
 * Level 4: 600-999 XP
 * Level 5+: 1000+ XP (every 500 XP)
 */
function calculateLevel(totalXP: number): number {
  if (totalXP < 100) return 1;
  if (totalXP < 300) return 2;
  if (totalXP < 600) return 3;
  if (totalXP < 1000) return 4;
  return 5 + Math.floor((totalXP - 1000) / 500);
}

/**
 * Initialize user stats if they don't exist
 */
async function ensureUserStats(userId: number) {
  const db = await getDb();
  if (!db)
    throw new TRPCError({
      code: "INTERNAL_SERVER_ERROR",
      message: "Database not available",
    });
  const existing = await db
    .select()
    .from(userStats)
    .where(eq(userStats.userId, userId))
    .limit(1);

  if (existing.length === 0) {
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
  }
}

/**
 * Gamification router for streaks, achievements, and leaderboards
 */
export const gamificationRouter = router({
  /**
   * Get current user's stats
   */
  getMyStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database not available",
      });
    await ensureUserStats(ctx.user.id);

    const stats = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, ctx.user.id))
      .limit(1);

    return stats[0];
  }),

  /**
   * Update streak when user completes an activity
   */
  updateStreak: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database not available",
      });
    await ensureUserStats(ctx.user.id);

    const stats = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, ctx.user.id))
      .limit(1);

    const current = stats[0];
    const now = new Date();
    const newStreak = calculateStreak(
      current.lastActivityDate,
      current.currentStreak
    );
    const longestStreak = Math.max(newStreak, current.longestStreak);

    await db
      .update(userStats)
      .set({
        currentStreak: newStreak,
        longestStreak,
        lastActivityDate: now,
      })
      .where(eq(userStats.userId, ctx.user.id));

    return { currentStreak: newStreak, longestStreak };
  }),

  /**
   * Award XP to user
   */
  awardXP: protectedProcedure
    .input(
      z.object({
        amount: z.number().min(1),
        source: z.enum(["quiz", "story", "achievement"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });
      await ensureUserStats(ctx.user.id);

      const stats = await db
        .select()
        .from(userStats)
        .where(eq(userStats.userId, ctx.user.id))
        .limit(1);

      const current = stats[0];
      const newTotalXP = current.totalXp + input.amount;
      const newLevel = calculateLevel(newTotalXP);

      // Update counters based on source
      const updates: any = {
        totalXp: newTotalXP,
        level: newLevel,
      };

      if (input.source === "quiz") {
        updates.quizzesCompleted = current.quizzesCompleted + 1;
      } else if (input.source === "story") {
        updates.storiesCompleted = current.storiesCompleted + 1;
      }

      await db
        .update(userStats)
        .set(updates)
        .where(eq(userStats.userId, ctx.user.id));

      return { totalXP: newTotalXP, level: newLevel };
    }),

  /**
   * Get leaderboard rankings
   */
  getLeaderboard: protectedProcedure
    .input(
      z.object({
        period: z.enum(["weekly", "monthly", "allTime"]),
        limit: z.number().min(1).max(100).default(10),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database not available",
        });

      const orderByField = userStats.totalXp;

      const rankings = await db
        .select({
          userId: userStats.userId,
          userName: users.name,
          xp: userStats.totalXp,
          level: userStats.level,
          currentStreak: userStats.currentStreak,
        })
        .from(userStats)
        .leftJoin(users, eq(userStats.userId, users.id))
        .orderBy(desc(orderByField))
        .limit(input.limit);

      return rankings.map((r, index) => ({
        rank: index + 1,
        userId: r.userId,
        userName: r.userName || "Anonymous",
        xp: r.xp,
        level: r.level,
        currentStreak: r.currentStreak,
      }));
    }),

  /**
   * Get all available achievements
   */
  getAchievements: protectedProcedure.query(async () => {
    const db = await getDb();
    if (!db)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database not available",
      });
    return await db.select().from(achievements).orderBy(achievements.category);
  }),

  /**
   * Get user's unlocked achievements
   */
  getMyAchievements: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database not available",
      });

    const unlocked = await db
      .select({
        achievementId: userAchievements.achievementId,
        unlockedAt: userAchievements.unlockedAt,
        name: achievements.name,
        description: achievements.description,
        icon: achievements.icon,
        xpReward: achievements.xpReward,
        category: achievements.category,
      })
      .from(userAchievements)
      .leftJoin(
        achievements,
        eq(userAchievements.achievementId, achievements.id)
      )
      .where(eq(userAchievements.userId, ctx.user.id))
      .orderBy(desc(userAchievements.unlockedAt));

    return unlocked;
  }),

  /**
   * Check and unlock achievements based on user progress
   */
  checkAchievements: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db)
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Database not available",
      });
    await ensureUserStats(ctx.user.id);

    const stats = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, ctx.user.id))
      .limit(1);

    const current = stats[0];
    const newlyUnlocked: any[] = [];

    // Get all achievements
    const allAchievements = await db.select().from(achievements);

    // Get already unlocked achievements
    const unlockedIds = (
      await db
        .select({ achievementId: userAchievements.achievementId })
        .from(userAchievements)
        .where(eq(userAchievements.userId, ctx.user.id))
    ).map(u => u.achievementId);

    // Check each achievement
    for (const achievement of allAchievements) {
      if (unlockedIds.includes(achievement.id)) continue;

      let shouldUnlock = false;

      // Check criteria based on category
      if (achievement.category === "streak") {
        if (current.currentStreak >= achievement.requirement) {
          shouldUnlock = true;
        }
      } else if (achievement.category === "quizzes") {
        if (current.quizzesCompleted >= achievement.requirement) {
          shouldUnlock = true;
        }
      } else if (achievement.category === "stories") {
        if (current.storiesCompleted >= achievement.requirement) {
          shouldUnlock = true;
        }
      } else if (achievement.category === "vocabulary") {
        if (current.wordsLearned >= achievement.requirement) {
          shouldUnlock = true;
        }
      }

      if (shouldUnlock) {
        await db.insert(userAchievements).values({
          userId: ctx.user.id,
          achievementId: achievement.id,
          unlockedAt: new Date(),
        });

        // Award XP for achievement
        await db
          .update(userStats)
          .set({
            totalXp: current.totalXp + achievement.xpReward,
            level: calculateLevel(current.totalXp + achievement.xpReward),
          })
          .where(eq(userStats.userId, ctx.user.id));

        newlyUnlocked.push(achievement);
      }
    }

    return { newlyUnlocked };
  }),
});
