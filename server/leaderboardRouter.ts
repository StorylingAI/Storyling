import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { users, collections, userAchievements, achievements, collectionItems, leaderboardEntries, userStats } from "../drizzle/schema";
import { eq, sql, desc, and, gte } from "drizzle-orm";

export const leaderboardRouter = router({
  // Get top weekly achievers for dashboard widget
  getTopWeeklyAchievers: publicProcedure
    .input(z.object({ limit: z.number().default(10).optional() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get current week dates
      const now = new Date();
      const dayOfWeek = now.getDay();
      const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
      
      const weekStart = new Date(now);
      weekStart.setDate(now.getDate() - daysToMonday);
      weekStart.setHours(0, 0, 0, 0);
      const weekStartStr = weekStart.toISOString().split('T')[0];

      const entries = await db
        .select({
          userId: leaderboardEntries.userId,
          userName: users.name,
          goalsCompleted: leaderboardEntries.goalsCompleted,
          streakDays: leaderboardEntries.streakDays,
          xpEarned: leaderboardEntries.xpEarned,
          rank: leaderboardEntries.rank,
        })
        .from(leaderboardEntries)
        .leftJoin(users, eq(leaderboardEntries.userId, users.id))
        .where(
          and(
            sql`${leaderboardEntries.weekStartDate} = ${weekStartStr}`,
            eq(leaderboardEntries.isVisible, true)
          )
        )
        .orderBy(desc(leaderboardEntries.xpEarned))
        .limit(input.limit || 10);

      return entries;
    }),

  // Get top creators leaderboard
  getLeaderboard: publicProcedure
    .input(
      z.object({
        period: z.enum(["all-time", "monthly", "weekly"]).default("all-time"),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Calculate date threshold based on period
      let dateThreshold: Date | null = null;
      if (input.period === "monthly") {
        dateThreshold = new Date();
        dateThreshold.setMonth(dateThreshold.getMonth() - 1);
      } else if (input.period === "weekly") {
        dateThreshold = new Date();
        dateThreshold.setDate(dateThreshold.getDate() - 7);
      }

      // For weekly goals leaderboard, use leaderboardEntries table
      if (input.period === "weekly") {
        const leaderboardData = await db
          .select({
            userId: users.id,
            userName: users.name,
            userEmail: users.email,
            goalsCompleted: leaderboardEntries.goalsCompleted,
            streakDays: leaderboardEntries.streakDays,
            xpEarned: leaderboardEntries.xpEarned,
            rank: leaderboardEntries.rank,
          })
          .from(leaderboardEntries)
          .innerJoin(users, eq(leaderboardEntries.userId, users.id))
          .where(
            and(
              eq(leaderboardEntries.isVisible, true),
              dateThreshold ? gte(leaderboardEntries.weekStartDate, dateThreshold) : undefined
            )
          )
          .orderBy(desc(leaderboardEntries.xpEarned), desc(leaderboardEntries.goalsCompleted))
          .limit(input.limit);

        const rankings = leaderboardData.map((user, index) => ({
          rank: index + 1,
          userId: user.userId,
          userName: user.userName || "Anonymous",
          userEmail: user.userEmail,
          goalsCompleted: user.goalsCompleted,
          streakDays: user.streakDays,
          xpEarned: user.xpEarned,
          totalClones: 0,
          collectionCount: 0,
          badgeCount: 0,
          highestBadge: null,
        }));

        return {
          period: input.period,
          rankings,
        };
      }

      // Build the query to aggregate user stats for collections leaderboard
      const leaderboardData = await db
        .select({
          userId: users.id,
          userName: users.name,
          userEmail: users.email,
          totalClones: sql<number>`COALESCE(SUM(${collections.cloneCount}), 0)`,
          collectionCount: sql<number>`COUNT(DISTINCT ${collections.id})`,
        })
        .from(users)
        .leftJoin(
          collections,
          and(
            eq(collections.userId, users.id),
            dateThreshold ? gte(collections.createdAt, dateThreshold) : undefined
          )
        )
        .groupBy(users.id, users.name, users.email)
        .having(sql`COUNT(DISTINCT ${collections.id}) > 0`) // Only users with collections
        .orderBy(desc(sql`SUM(${collections.cloneCount})`))
        .limit(input.limit);

      // Get badge counts for each user
      const userIds = leaderboardData.map((u) => u.userId);
      
      const badgeCounts = await db
        .select({
          userId: userAchievements.userId,
          badgeCount: sql<number>`COUNT(DISTINCT ${userAchievements.achievementId})`,
        })
        .from(userAchievements)
        .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
        .where(
          and(
            sql`${userAchievements.userId} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`,
            eq(achievements.category, "collections")
          )
        )
        .groupBy(userAchievements.userId);

      const badgeCountMap = new Map(
        badgeCounts.map((bc) => [bc.userId, bc.badgeCount])
      );

      // Get highest badge for each user
      const userBadges = await db
        .select({
          userId: userAchievements.userId,
          badgeKey: achievements.key,
          badgeName: achievements.name,
          badgeIcon: achievements.icon,
          requirement: achievements.requirement,
        })
        .from(userAchievements)
        .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
        .where(
          and(
            sql`${userAchievements.userId} IN (${sql.join(userIds.map(id => sql`${id}`), sql`, `)})`,
            eq(achievements.category, "collections")
          )
        )
        .orderBy(desc(achievements.requirement));

      // Map highest badge per user
      const highestBadgeMap = new Map();
      for (const badge of userBadges) {
        if (!highestBadgeMap.has(badge.userId)) {
          highestBadgeMap.set(badge.userId, {
            key: badge.badgeKey,
            name: badge.badgeName,
            icon: badge.badgeIcon,
          });
        }
      }

      // Combine all data
      const rankings = leaderboardData.map((user, index) => ({
        rank: index + 1,
        userId: user.userId,
        userName: user.userName || "Anonymous",
        userEmail: user.userEmail,
        totalClones: user.totalClones,
        collectionCount: user.collectionCount,
        badgeCount: badgeCountMap.get(user.userId) || 0,
        highestBadge: highestBadgeMap.get(user.userId) || null,
      }));

      return {
        period: input.period,
        rankings,
      };
    }),

  // Get user profile with stats, collections, and badges
  getUserProfile: publicProcedure
    .input(
      z.object({
        userId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Get user basic info
      const [user] = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          createdAt: users.createdAt,
        })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!user) {
        throw new Error("User not found");
      }

      // Get all user's collections
      const allCollections = await db
        .select({
          id: collections.id,
          cloneCount: collections.cloneCount,
          isPublic: collections.isPublic,
        })
        .from(collections)
        .where(eq(collections.userId, input.userId));

      // Calculate stats from collections
      const collectionStats = {
        totalCollections: allCollections.length,
        totalClones: allCollections.reduce((sum, c) => sum + c.cloneCount, 0),
        publicCollections: allCollections.filter(c => c.isPublic).length,
      };

      // Get user's public collections
      const userCollections = await db
        .select({
          id: collections.id,
          name: collections.name,
          description: collections.description,
          color: collections.color,
          cloneCount: collections.cloneCount,
          isPublic: collections.isPublic,
          shareToken: collections.shareToken,
          createdAt: collections.createdAt,
          itemCount: sql<number>`COUNT(DISTINCT ${collectionItems.id})`,
        })
        .from(collections)
        .leftJoin(
          collectionItems,
          eq(collectionItems.collectionId, collections.id)
        )
        .where(
          and(
            eq(collections.userId, input.userId),
            eq(collections.isPublic, true)
          )
        )
        .groupBy(collections.id)
        .orderBy(desc(collections.createdAt));

      // Get user's earned badges (collections category)
      const userBadges = await db
        .select({
          id: achievements.id,
          key: achievements.key,
          name: achievements.name,
          description: achievements.description,
          icon: achievements.icon,
          requirement: achievements.requirement,
          xpReward: achievements.xpReward,
          unlockedAt: userAchievements.unlockedAt,
        })
        .from(userAchievements)
        .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
        .where(
          and(
            eq(userAchievements.userId, input.userId),
            eq(achievements.category, "collections")
          )
        )
        .orderBy(desc(achievements.requirement));

      // Get recent activity (last 5 collections created)
      const recentActivity = await db
        .select({
          id: collections.id,
          name: collections.name,
          cloneCount: collections.cloneCount,
          createdAt: collections.createdAt,
        })
        .from(collections)
        .where(eq(collections.userId, input.userId))
        .orderBy(desc(collections.createdAt))
        .limit(5);

      return {
        user: {
          id: user.id,
          name: user.name || "Anonymous",
          email: user.email,
          joinedAt: user.createdAt,
        },
        stats: {
          totalCollections: collectionStats?.totalCollections || 0,
          totalClones: collectionStats?.totalClones || 0,
          publicCollections: collectionStats?.publicCollections || 0,
          badgesEarned: userBadges.length,
        },
        collections: userCollections,
        badges: userBadges,
        recentActivity,
      };
    }),
});
