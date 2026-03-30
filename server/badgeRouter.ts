import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { getDb, awardCollectionBadge, getCollectionBadges, expireOldBadges } from "./db";
import { collections, collectionViewAnalytics, collectionCloneAnalytics, collectionShareEvents } from "../drizzle/schema";
import { eq, desc, sql, and, gte } from "drizzle-orm";

/**
 * Badge calculation thresholds
 */
const BADGE_THRESHOLDS = {
  trending: {
    minRecentViews: 100, // Views in last 7 days
    minGrowthRate: 0.5, // 50% growth rate
  },
  top_100: {
    minTotalViews: 500, // Total views needed
  },
  community_favorite: {
    minClones: 50, // Total clones needed
    minCloneRate: 0.1, // 10% clone-to-view ratio
  },
  rising_star: {
    maxAgeDays: 30, // Collection must be less than 30 days old
    minViews: 50, // Minimum views in that period
  },
  viral: {
    minShares: 20, // Total shares
    minShareRate: 0.05, // 5% share-to-view ratio
  },
  evergreen: {
    minAgeDays: 90, // Collection must be at least 90 days old
    minConsistentViews: 10, // Minimum views per week consistently
  },
};

/**
 * Calculate and award badges for a specific collection
 */
async function calculateBadgesForCollection(collectionId: number) {
  const db = await getDb();
  if (!db) return [];

  const awardedBadges: string[] = [];

  // Get collection data
  const [collection] = await db
    .select()
    .from(collections)
    .where(eq(collections.id, collectionId))
    .limit(1);

  if (!collection) return [];

  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

  // Check TRENDING badge
  const recentViews = await db
    .select({ total: sql<number>`SUM(${collectionViewAnalytics.viewCount})` })
    .from(collectionViewAnalytics)
    .where(
      and(
        eq(collectionViewAnalytics.collectionId, collectionId),
        sql`${collectionViewAnalytics.viewDate} >= ${sevenDaysAgo.toISOString().split("T")[0]}`
      )
    );

  const recentViewCount = recentViews[0]?.total || 0;
  if (recentViewCount >= BADGE_THRESHOLDS.trending.minRecentViews) {
    await awardCollectionBadge(collectionId, "trending", new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000));
    awardedBadges.push("trending");
  }

  // Check TOP_100 badge
  if (collection.viewCount >= BADGE_THRESHOLDS.top_100.minTotalViews) {
    await awardCollectionBadge(collectionId, "top_100");
    awardedBadges.push("top_100");
  }

  // Check COMMUNITY_FAVORITE badge
  const cloneRate = collection.viewCount > 0 ? collection.cloneCount / collection.viewCount : 0;
  if (
    collection.cloneCount >= BADGE_THRESHOLDS.community_favorite.minClones &&
    cloneRate >= BADGE_THRESHOLDS.community_favorite.minCloneRate
  ) {
    await awardCollectionBadge(collectionId, "community_favorite");
    awardedBadges.push("community_favorite");
  }

  // Check RISING_STAR badge
  const collectionAge = (now.getTime() - new Date(collection.createdAt).getTime()) / (1000 * 60 * 60 * 24);
  if (
    collectionAge <= BADGE_THRESHOLDS.rising_star.maxAgeDays &&
    collection.viewCount >= BADGE_THRESHOLDS.rising_star.minViews
  ) {
    await awardCollectionBadge(collectionId, "rising_star", new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000));
    awardedBadges.push("rising_star");
  }

  // Check VIRAL badge
  const totalShares = await db
    .select({ count: sql<number>`COUNT(*)` })
    .from(collectionShareEvents)
    .where(eq(collectionShareEvents.collectionId, collectionId));

  const shareCount = totalShares[0]?.count || 0;
  const shareRate = collection.viewCount > 0 ? shareCount / collection.viewCount : 0;
  if (
    shareCount >= BADGE_THRESHOLDS.viral.minShares &&
    shareRate >= BADGE_THRESHOLDS.viral.minShareRate
  ) {
    await awardCollectionBadge(collectionId, "viral");
    awardedBadges.push("viral");
  }

  // Check EVERGREEN badge
  if (collectionAge >= BADGE_THRESHOLDS.evergreen.minAgeDays) {
    const weeklyViews = await db
      .select({ 
        week: sql<string>`DATE_FORMAT(${collectionViewAnalytics.viewDate}, '%Y-%U')`,
        total: sql<number>`SUM(${collectionViewAnalytics.viewCount})`
      })
      .from(collectionViewAnalytics)
      .where(
        and(
          eq(collectionViewAnalytics.collectionId, collectionId),
          sql`${collectionViewAnalytics.viewDate} >= ${ninetyDaysAgo.toISOString().split("T")[0]}`
        )
      )
      .groupBy(sql`DATE_FORMAT(${collectionViewAnalytics.viewDate}, '%Y-%U')`);

    const consistentWeeks = weeklyViews.filter(w => w.total >= BADGE_THRESHOLDS.evergreen.minConsistentViews).length;
    if (consistentWeeks >= 8) { // At least 8 weeks of consistent views
      await awardCollectionBadge(collectionId, "evergreen");
      awardedBadges.push("evergreen");
    }
  }

  return awardedBadges;
}

export const badgeRouter = router({
  /**
   * Get badges for a specific collection
   */
  getCollectionBadges: publicProcedure
    .input(z.object({ collectionId: z.number() }))
    .query(async ({ input }) => {
      return getCollectionBadges(input.collectionId);
    }),

  /**
   * Calculate and award badges for a collection (admin/system use)
   */
  calculateBadges: protectedProcedure
    .input(z.object({ collectionId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if user owns the collection or is admin
      const [collection] = await db
        .select()
        .from(collections)
        .where(eq(collections.id, input.collectionId))
        .limit(1);

      if (!collection) {
        throw new Error("Collection not found");
      }

      if (collection.userId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new Error("Unauthorized");
      }

      const awardedBadges = await calculateBadgesForCollection(input.collectionId);
      return { success: true, awardedBadges };
    }),

  /**
   * Recalculate badges for all public collections (admin only)
   */
  recalculateAllBadges: protectedProcedure.mutation(async ({ ctx }) => {
    if (ctx.user.role !== "admin") {
      throw new Error("Admin access required");
    }

    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Expire old badges first
    await expireOldBadges();

    // Get all public collections
    const publicCollections = await db
      .select({ id: collections.id })
      .from(collections)
      .where(eq(collections.isPublic, true));

    let processed = 0;
    let totalBadges = 0;

    for (const collection of publicCollections) {
      const badges = await calculateBadgesForCollection(collection.id);
      totalBadges += badges.length;
      processed++;
    }

    return {
      success: true,
      collectionsProcessed: processed,
      badgesAwarded: totalBadges,
    };
  }),

  /**
   * Get badge statistics
   */
  getBadgeStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return null;

    const { collectionBadges } = await import("../drizzle/schema");
    const { sql } = await import("drizzle-orm");

    const stats = await db
      .select({
        badgeType: collectionBadges.badgeType,
        count: sql<number>`COUNT(*)`,
      })
      .from(collectionBadges)
      .where(eq(collectionBadges.isActive, true))
      .groupBy(collectionBadges.badgeType);

    return stats;
  }),

  /**
   * Get collections by badge type
   */
  getCollectionsByBadge: publicProcedure
    .input(
      z.object({
        badgeType: z.enum(["trending", "top_100", "community_favorite", "rising_star", "viral", "evergreen"]),
        limit: z.number().default(20),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return [];

      const { collectionBadges } = await import("../drizzle/schema");

      const results = await db
        .select({
          id: collections.id,
          name: collections.name,
          description: collections.description,
          viewCount: collections.viewCount,
          cloneCount: collections.cloneCount,
          userId: collections.userId,
          createdAt: collections.createdAt,
          badgeAwardedAt: collectionBadges.awardedAt,
        })
        .from(collectionBadges)
        .innerJoin(collections, eq(collectionBadges.collectionId, collections.id))
        .where(
          and(
            eq(collectionBadges.badgeType, input.badgeType),
            eq(collectionBadges.isActive, true),
            eq(collections.isPublic, true)
          )
        )
        .orderBy(desc(collectionBadges.awardedAt))
        .limit(input.limit);

      return results;
    }),
});
