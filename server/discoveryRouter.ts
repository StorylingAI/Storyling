import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { collections, users, collectionItems, generatedContent, vocabularyLists } from "../drizzle/schema";
import { eq, sql, desc, and, gte, inArray, like, or } from "drizzle-orm";

export const discoveryRouter = router({
  // Get discovery feed with personalized recommendations
  getDiscoveryFeed: publicProcedure
    .input(
      z.object({
        userId: z.number().optional(), // Optional for personalization
        limit: z.number().min(1).max(50).default(20),
        searchQuery: z.string().optional(),
        language: z.string().optional(),
        difficulty: z.string().optional(),
        theme: z.string().optional(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const now = new Date();
      const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Build filter conditions
      const baseConditions = [eq(collections.isPublic, true)];
      
      if (input.searchQuery) {
        baseConditions.push(
          or(
            like(collections.name, `%${input.searchQuery}%`),
            like(collections.description, `%${input.searchQuery}%`)
          )!
        );
      }

      // Get trending collections (most clones in the past week)
      const trendingCollections = await db
        .select({
          id: collections.id,
          name: collections.name,
          description: collections.description,
          color: collections.color,
          shareToken: collections.shareToken,
          cloneCount: collections.cloneCount,
          createdAt: collections.createdAt,
          userId: collections.userId,
          userName: users.name,
          itemCount: sql<number>`COUNT(DISTINCT ${collectionItems.id})`,
        })
        .from(collections)
        .innerJoin(users, eq(collections.userId, users.id))
        .leftJoin(collectionItems, eq(collectionItems.collectionId, collections.id))
        .where(
          and(...baseConditions, gte(collections.createdAt, oneWeekAgo))
        )
        .groupBy(collections.id, users.name)
        .orderBy(desc(collections.cloneCount))
        .limit(10);

      // Get new collections (recently created)
      const newCollections = await db
        .select({
          id: collections.id,
          name: collections.name,
          description: collections.description,
          color: collections.color,
          shareToken: collections.shareToken,
          cloneCount: collections.cloneCount,
          createdAt: collections.createdAt,
          userId: collections.userId,
          userName: users.name,
          itemCount: sql<number>`COUNT(DISTINCT ${collectionItems.id})`,
        })
        .from(collections)
        .innerJoin(users, eq(collections.userId, users.id))
        .leftJoin(collectionItems, eq(collectionItems.collectionId, collections.id))
        .where(
          and(...baseConditions, gte(collections.createdAt, oneMonthAgo))
        )
        .groupBy(collections.id, users.name)
        .orderBy(desc(collections.createdAt))
        .limit(10);

      // Get popular collections (highest clone count all-time)
      const popularCollections = await db
        .select({
          id: collections.id,
          name: collections.name,
          description: collections.description,
          color: collections.color,
          shareToken: collections.shareToken,
          cloneCount: collections.cloneCount,
          createdAt: collections.createdAt,
          userId: collections.userId,
          userName: users.name,
          itemCount: sql<number>`COUNT(DISTINCT ${collectionItems.id})`,
        })
        .from(collections)
        .innerJoin(users, eq(collections.userId, users.id))
        .leftJoin(collectionItems, eq(collectionItems.collectionId, collections.id))
        .where(and(...baseConditions))
        .groupBy(collections.id, users.name)
        .orderBy(desc(collections.cloneCount))
        .limit(10);

      // If user is provided, get personalized recommendations based on their language
      let personalizedCollections: typeof popularCollections = [];
      if (input.userId) {
        // Get user's preferred language from their vocabulary lists
        const userVocabLists = await db
          .select({
            targetLanguage: vocabularyLists.targetLanguage,
          })
          .from(vocabularyLists)
          .where(eq(vocabularyLists.userId, input.userId))
          .limit(10);

        if (userVocabLists.length > 0) {
          // Get most common language
          const languageCounts = userVocabLists.reduce((acc, vocab) => {
            acc[vocab.targetLanguage] = (acc[vocab.targetLanguage] || 0) + 1;
            return acc;
          }, {} as Record<string, number>);

          const preferredLanguage = Object.entries(languageCounts)
            .sort(([, a], [, b]) => b - a)[0]?.[0];

          if (preferredLanguage) {
            // Find collections with content in the user's preferred language
            const collectionsWithLanguage = await db
              .select({
                collectionId: collectionItems.collectionId,
              })
              .from(collectionItems)
              .innerJoin(generatedContent, eq(collectionItems.contentId, generatedContent.id))
              .innerJoin(vocabularyLists, eq(generatedContent.vocabularyListId, vocabularyLists.id))
              .where(eq(vocabularyLists.targetLanguage, preferredLanguage))
              .groupBy(collectionItems.collectionId);

            const collectionIds = collectionsWithLanguage.map(c => c.collectionId);

            if (collectionIds.length > 0) {
              personalizedCollections = await db
                .select({
                  id: collections.id,
                  name: collections.name,
                  description: collections.description,
                  color: collections.color,
                  shareToken: collections.shareToken,
                  cloneCount: collections.cloneCount,
                  createdAt: collections.createdAt,
                  userId: collections.userId,
                  userName: users.name,
                  itemCount: sql<number>`COUNT(DISTINCT ${collectionItems.id})`,
                })
                .from(collections)
                .innerJoin(users, eq(collections.userId, users.id))
                .leftJoin(collectionItems, eq(collectionItems.collectionId, collections.id))
                .where(
                  and(
                    eq(collections.isPublic, true),
                    inArray(collections.id, collectionIds)
                  )
                )
                .groupBy(collections.id, users.name)
                .orderBy(desc(collections.cloneCount))
                .limit(10);
            }
          }
        }
      }

      return {
        trending: trendingCollections,
        new: newCollections,
        popular: popularCollections,
        personalized: personalizedCollections,
      };
    }),

  // Public stats for landing page
  getPublicStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const [storiesResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(generatedContent);

    const [usersResult] = await db
      .select({ count: sql<number>`COUNT(*)` })
      .from(users);

    const [languagesResult] = await db
      .select({ count: sql<number>`COUNT(DISTINCT ${vocabularyLists.targetLanguage})` })
      .from(vocabularyLists);

    return {
      storiesCreated: storiesResult?.count ?? 0,
      activeUsers: usersResult?.count ?? 0,
      languages: languagesResult?.count ?? 0,
    };
  }),
});
