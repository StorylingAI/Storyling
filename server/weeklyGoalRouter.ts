import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

/**
 * Check if a week has passed since the given start date
 */
function hasWeekPassed(weekStartDate: Date): boolean {
  const now = new Date();
  const daysSinceStart = Math.floor((now.getTime() - weekStartDate.getTime()) / (1000 * 60 * 60 * 24));
  return daysSinceStart >= 7;
}

/**
 * Get the start of the current week (Monday)
 */
function getWeekStartDate(): Date {
  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday, etc.
  const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // If Sunday, go back 6 days; otherwise go back to Monday
  const monday = new Date(now);
  monday.setDate(now.getDate() - daysToMonday);
  monday.setHours(0, 0, 0, 0);
  return monday;
}

/**
 * Reset weekly progress if a new week has started
 */
async function checkAndResetWeeklyProgress(userId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user.length) return;

  const userData = user[0];
  const weekStartDate = new Date(userData.weekStartDate);

  // Check if a week has passed
  if (hasWeekPassed(weekStartDate)) {
    // Check if last week's goal was reached
    const lastWeekGoalReached = userData.weeklyProgress >= userData.weeklyGoal;
    
    // Update streak based on last week's performance
    let newStreak = userData.weeklyGoalStreak;
    if (lastWeekGoalReached && userData.lastWeekGoalReached) {
      // Continue streak
      newStreak = userData.weeklyGoalStreak + 1;
    } else if (lastWeekGoalReached && !userData.lastWeekGoalReached) {
      // Start new streak
      newStreak = 1;
    } else {
      // Streak broken
      newStreak = 0;
    }

    // Reset weekly progress for new week
    await db
      .update(users)
      .set({
        weeklyProgress: 0,
        weekStartDate: getWeekStartDate(),
        weeklyGoalEmailSent: false,
        lastWeekGoalReached: lastWeekGoalReached,
        weeklyGoalStreak: newStreak,
      })
      .where(eq(users.id, userId));

    // Award streak badges
    if (newStreak > 0) {
      await checkAndAwardStreakBadges(userId, newStreak);
    }
  }
}

/**
 * Increment weekly progress when a story is created
 */
export async function incrementWeeklyProgress(userId: number) {
  const db = await getDb();
  if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

  // First check and reset if needed
  await checkAndResetWeeklyProgress(userId);

  // Get current user data
  const user = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user.length) return;

  const userData = user[0];
  const newProgress = userData.weeklyProgress + 1;

  // Update progress
  await db
    .update(users)
    .set({ weeklyProgress: newProgress })
    .where(eq(users.id, userId));

  // Check if goal is reached and send email if not sent yet
  if (newProgress >= userData.weeklyGoal && !userData.weeklyGoalEmailSent) {
    await sendWeeklyGoalEmail(userId, userData.weeklyGoal, userData.email, userData.name);
    await db
      .update(users)
      .set({ weeklyGoalEmailSent: true })
      .where(eq(users.id, userId));
  }
}

/**
 * Send congratulatory notification when weekly goal is reached
 * Note: This uses the owner notification system. In production, you would integrate
 * with a proper email service to send personalized emails to users.
 */
/**
 * Check and award streak badges based on weekly goal streak
 */
async function checkAndAwardStreakBadges(userId: number, streak: number) {
  const db = await getDb();
  if (!db) return;

  const { achievements, userAchievements } = await import("../drizzle/schema");

  // Define streak milestones
  const streakMilestones = [
    { weeks: 2, key: "weekly_goal_2_week_streak" },
    { weeks: 4, key: "weekly_goal_4_week_streak" },
    { weeks: 8, key: "weekly_goal_8_week_streak" },
    { weeks: 12, key: "weekly_goal_12_week_streak" },
    { weeks: 26, key: "weekly_goal_26_week_streak" },
    { weeks: 52, key: "weekly_goal_52_week_streak" },
  ];

  for (const milestone of streakMilestones) {
    if (streak >= milestone.weeks) {
      // Check if achievement exists
      const achievement = await db
        .select()
        .from(achievements)
        .where(eq(achievements.key, milestone.key))
        .limit(1);

      if (achievement.length === 0) continue;

      // Check if user already has this achievement
      const existing = await db
        .select()
        .from(userAchievements)
        .where(
          and(
            eq(userAchievements.userId, userId),
            eq(userAchievements.achievementId, achievement[0].id)
          )
        )
        .limit(1);

      // Award if not already unlocked
      if (existing.length === 0) {
        await db.insert(userAchievements).values({
          userId: userId,
          achievementId: achievement[0].id,
          unlockedAt: new Date(),
        });

        // Update user stats with XP reward
        const { userStats } = await import("../drizzle/schema");
        const stats = await db
          .select()
          .from(userStats)
          .where(eq(userStats.userId, userId))
          .limit(1);

        if (stats.length > 0) {
          await db
            .update(userStats)
            .set({
              totalXp: stats[0].totalXp + achievement[0].xpReward,
            })
            .where(eq(userStats.userId, userId));
        }
      }
    }
  }
}

async function sendWeeklyGoalEmail(userId: number, weeklyGoal: number, email: string | null, name: string | null) {
  if (!email) return;

  const content = `
🎉 Congratulations, ${name || "Language Learner"}!

You've reached your weekly goal of ${weeklyGoal} stories!

Amazing work! Your dedication to language learning is truly inspiring.

🚀 Explore More Features:

📚 Spaced Repetition Practice
Master vocabulary with our intelligent spaced repetition system.

🎯 Tone Practice (Chinese)
Perfect your pronunciation with tone practice exercises.

📊 Progress Analytics
Track your learning journey with detailed analytics.

🗂️ Collections
Discover curated story collections from other learners.

Visit https://storylingai.com/practice to start practicing!

Keep up the great work!
  `;

  try {
    // Using notifyOwner as a placeholder - in production, integrate with proper email service
    await notifyOwner({
      title: `User ${name || email} reached weekly goal of ${weeklyGoal} stories`,
      content: content,
    });
  } catch (error) {
    console.error("Failed to send weekly goal notification:", error);
  }
}

export const weeklyGoalRouter = router({
  /**
   * Get current weekly goal status
   */
  getWeeklyGoalStatus: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    // Check and reset if needed
    await checkAndResetWeeklyProgress(ctx.user.id);

    const user = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (!user.length) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    const userData = user[0];
    return {
      weeklyGoal: userData.weeklyGoal,
      weeklyProgress: userData.weeklyProgress,
      weekStartDate: userData.weekStartDate,
      isGoalReached: userData.weeklyProgress >= userData.weeklyGoal,
      weeklyGoalStreak: userData.weeklyGoalStreak,
    };
  }),

  /**
   * Get weekly goal streak information
   */
  getWeeklyGoalStreak: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    await checkAndResetWeeklyProgress(ctx.user.id);

    const user = await db.select().from(users).where(eq(users.id, ctx.user.id)).limit(1);
    if (!user.length) {
      throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
    }

    return {
      weeklyGoalStreak: user[0].weeklyGoalStreak,
      lastWeekGoalReached: user[0].lastWeekGoalReached,
    };
  }),

  /**
   * Update weekly goal
   */
  updateWeeklyGoal: protectedProcedure
    .input(z.object({ weeklyGoal: z.number().min(1).max(100) }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db
        .update(users)
        .set({ weeklyGoal: input.weeklyGoal })
        .where(eq(users.id, ctx.user.id));

      return { success: true };
    }),

  /**
   * Manually trigger weekly goal check (for testing or manual triggers)
   */
  checkWeeklyGoal: protectedProcedure.mutation(async ({ ctx }) => {
    await checkAndResetWeeklyProgress(ctx.user.id);
    return { success: true };
  }),
});
