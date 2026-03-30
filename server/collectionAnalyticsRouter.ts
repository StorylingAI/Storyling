import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import {
  collections,
  collectionItems,
  generatedContent,
  collectionViewAnalytics,
  collectionCloneAnalytics,
  collectionShareEvents,
  vocabularyLists,
  users,
} from "../drizzle/schema";
import { eq, and, desc, sql, gte, lte, inArray } from "drizzle-orm";

export const collectionAnalyticsRouter = router({
  // Get similar collections based on language, theme, and difficulty
  getSimilarCollections: publicProcedure
    .input(
      z.object({
        collectionId: z.number(),
        limit: z.number().default(6),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get the source collection with its items
      const sourceCollection = await db
        .select()
        .from(collections)
        .where(eq(collections.id, input.collectionId))
        .limit(1);

      if (sourceCollection.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Collection not found" });
      }

      // Get items from source collection to analyze language/theme/difficulty
      const sourceItems = await db
        .select({
          content: generatedContent,
          vocabList: vocabularyLists,
        })
        .from(collectionItems)
        .leftJoin(generatedContent, eq(collectionItems.contentId, generatedContent.id))
        .leftJoin(vocabularyLists, eq(generatedContent.vocabularyListId, vocabularyLists.id))
        .where(eq(collectionItems.collectionId, input.collectionId));

      if (sourceItems.length === 0) {
        return [];
      }

      // Extract common attributes
      const languages = Array.from(new Set(sourceItems.map(item => item.vocabList?.targetLanguage).filter(Boolean)));
      const themes = Array.from(new Set(sourceItems.map(item => item.content?.theme).filter(Boolean)));
      const difficulties = Array.from(new Set(sourceItems.map(item => item.content?.difficultyLevel).filter(Boolean)));

      // Find similar public collections (excluding the source collection)
      const similarCollections = await db
        .select({
          collection: collections,
          creator: users,
          itemCount: sql<number>`COUNT(DISTINCT ${collectionItems.id})`,
        })
        .from(collections)
        .leftJoin(collectionItems, eq(collections.id, collectionItems.collectionId))
        .leftJoin(generatedContent, eq(collectionItems.contentId, generatedContent.id))
        .leftJoin(vocabularyLists, eq(generatedContent.vocabularyListId, vocabularyLists.id))
        .leftJoin(users, eq(collections.userId, users.id))
        .where(
          and(
            eq(collections.isPublic, true),
            sql`${collections.id} != ${input.collectionId}`
          )
        )
        .groupBy(collections.id, users.id)
        .orderBy(desc(collections.viewCount))
        .limit(50); // Get more candidates for filtering

      // Score and rank collections by similarity
      const scoredCollections = await Promise.all(
        similarCollections.map(async (item) => {
          // Get items for this collection to calculate similarity
          const collectionContentItems = await db
            .select({
              content: generatedContent,
              vocabList: vocabularyLists,
            })
            .from(collectionItems)
            .leftJoin(generatedContent, eq(collectionItems.contentId, generatedContent.id))
            .leftJoin(vocabularyLists, eq(generatedContent.vocabularyListId, vocabularyLists.id))
            .where(eq(collectionItems.collectionId, item.collection.id));

          let score = 0;

          // Language match (highest weight)
          const collectionLanguages = Array.from(new Set(
            collectionContentItems.map(ci => ci.vocabList?.targetLanguage).filter(Boolean)
          ));
          const languageOverlap = languages.filter(lang => collectionLanguages.includes(lang)).length;
          score += languageOverlap * 10;

          // Theme match (medium weight)
          const collectionThemes = Array.from(new Set(
            collectionContentItems.map(ci => ci.content?.theme).filter(Boolean)
          ));
          const themeOverlap = themes.filter(theme => collectionThemes.includes(theme)).length;
          score += themeOverlap * 5;

          // Difficulty match (lower weight)
          const collectionDifficulties = Array.from(new Set(
            collectionContentItems.map(ci => ci.content?.difficultyLevel).filter(Boolean)
          ));
          const difficultyOverlap = difficulties.filter(diff => collectionDifficulties.includes(diff)).length;
          score += difficultyOverlap * 3;

          // Popularity bonus (small weight)
          score += Math.log10(item.collection.viewCount + 1) * 0.5;
          score += Math.log10(item.collection.cloneCount + 1) * 0.3;

          return {
            ...item.collection,
            creator: item.creator,
            itemCount: item.itemCount,
            similarityScore: score,
          };
        })
      );

      // Filter out collections with zero score and sort by score
      return scoredCollections
        .filter(c => c.similarityScore > 0)
        .sort((a, b) => b.similarityScore - a.similarityScore)
        .slice(0, input.limit);
    }),

  // Get creator dashboard analytics
  getCreatorDashboard: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    // Get all user's public collections
    const userCollections = await db
      .select()
      .from(collections)
      .where(and(eq(collections.userId, ctx.user.id), eq(collections.isPublic, true)));

    if (userCollections.length === 0) {
      return {
        collections: [],
        totalViews: 0,
        totalClones: 0,
        viewTrends: [],
        cloneTrends: [],
        topCollections: [],
        nextMilestone: null,
      };
    }

    const collectionIds = userCollections.map(c => c.id);

    // Get view trends (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split("T")[0];

    const viewTrends = await db
      .select({
        date: collectionViewAnalytics.viewDate,
        views: sql<number>`SUM(${collectionViewAnalytics.viewCount})`,
        uniqueViewers: sql<number>`SUM(${collectionViewAnalytics.uniqueViewers})`,
      })
      .from(collectionViewAnalytics)
      .where(
        and(
          inArray(collectionViewAnalytics.collectionId, collectionIds),
          sql`${collectionViewAnalytics.viewDate} >= ${thirtyDaysAgoStr}`
        )
      )
      .groupBy(collectionViewAnalytics.viewDate)
      .orderBy(sql`${collectionViewAnalytics.viewDate} DESC`);

    // Get clone trends (last 30 days)
    const cloneTrends = await db
      .select({
        date: collectionCloneAnalytics.cloneDate,
        clones: sql<number>`SUM(${collectionCloneAnalytics.cloneCount})`,
      })
      .from(collectionCloneAnalytics)
      .where(
        and(
          inArray(collectionCloneAnalytics.collectionId, collectionIds),
          sql`${collectionCloneAnalytics.cloneDate} >= ${thirtyDaysAgoStr}`
        )
      )
      .groupBy(collectionCloneAnalytics.cloneDate)
      .orderBy(sql`${collectionCloneAnalytics.cloneDate} DESC`);

    // Get top-performing collections with story counts
    const topCollections = await Promise.all(
      userCollections.map(async (collection) => {
        const items = await db
          .select()
          .from(collectionItems)
          .where(eq(collectionItems.collectionId, collection.id));

        return {
          id: collection.id,
          name: collection.name,
          viewCount: collection.viewCount,
          cloneCount: collection.cloneCount,
          storyCount: items.length,
        };
      })
    );

    // Sort by combined score (views + clones * 5)
    topCollections.sort((a, b) => {
      const scoreA = a.viewCount + a.cloneCount * 5;
      const scoreB = b.viewCount + b.cloneCount * 5;
      return scoreB - scoreA;
    });

    // Calculate totals
    const totalViews = userCollections.reduce((sum, c) => sum + c.viewCount, 0);
    const totalClones = userCollections.reduce((sum, c) => sum + c.cloneCount, 0);

    // Determine next milestone
    const milestones = [
      { views: 100, clones: 10, label: "Rising Star" },
      { views: 500, clones: 50, label: "Popular Creator" },
      { views: 1000, clones: 100, label: "Trending Creator" },
      { views: 5000, clones: 500, label: "Top Creator" },
      { views: 10000, clones: 1000, label: "Elite Creator" },
    ];

    let nextMilestone = null;
    for (const milestone of milestones) {
      if (totalViews < milestone.views || totalClones < milestone.clones) {
        nextMilestone = {
          label: milestone.label,
          viewsNeeded: Math.max(0, milestone.views - totalViews),
          clonesNeeded: Math.max(0, milestone.clones - totalClones),
          viewsProgress: (totalViews / milestone.views) * 100,
          clonesProgress: (totalClones / milestone.clones) * 100,
        };
        break;
      }
    }

    return {
      collections: userCollections,
      totalViews,
      totalClones,
      viewTrends,
      cloneTrends,
      topCollections: topCollections.slice(0, 5),
      nextMilestone,
    };
  }),

  // Track collection share event
  trackShare: protectedProcedure
    .input(
      z.object({
        collectionId: z.number(),
        platform: z.enum(["twitter", "linkedin", "facebook", "copy_link"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db.insert(collectionShareEvents).values({
        collectionId: input.collectionId,
        userId: ctx.user.id,
        platform: input.platform,
      });

      return { success: true };
    }),

  // Get share statistics for a collection
  getShareStats: protectedProcedure
    .input(z.object({ collectionId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify ownership
      const collection = await db
        .select()
        .from(collections)
        .where(eq(collections.id, input.collectionId))
        .limit(1);

      if (collection.length === 0 || collection[0].userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Not authorized" });
      }

      const shareStats = await db
        .select({
          platform: collectionShareEvents.platform,
          count: sql<number>`COUNT(*)`,
        })
        .from(collectionShareEvents)
        .where(eq(collectionShareEvents.collectionId, input.collectionId))
        .groupBy(collectionShareEvents.platform);

      return shareStats;
    }),
});
