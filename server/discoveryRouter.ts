import { z } from "zod";
import { router, publicProcedure } from "./_core/trpc";
import { getDb } from "./db";
import {
  collections,
  users,
  collectionItems,
  generatedContent,
  vocabularyLists,
  userStats,
} from "../drizzle/schema";
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
      const storyConditions = [
        eq(generatedContent.isPublic, true),
        eq(generatedContent.status, "completed"),
      ];
      
      if (input.searchQuery) {
        baseConditions.push(
          or(
            like(collections.name, `%${input.searchQuery}%`),
            like(collections.description, `%${input.searchQuery}%`)
          )!
        );
        storyConditions.push(
          or(
            like(generatedContent.title, `%${input.searchQuery}%`),
            like(generatedContent.storyText, `%${input.searchQuery}%`),
            like(generatedContent.theme, `%${input.searchQuery}%`)
          )!
        );
      }

      if (input.language) {
        storyConditions.push(like(vocabularyLists.targetLanguage, `%${input.language}%`));
      }

      if (input.difficulty) {
        storyConditions.push(like(generatedContent.difficultyLevel, `%${input.difficulty}%`));
      }

      if (input.theme) {
        storyConditions.push(like(generatedContent.theme, `%${input.theme}%`));
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
          avatarUrl: users.avatarUrl,
          totalXp: sql<number>`COALESCE(${userStats.totalXp}, 0)`,
          level: sql<number>`COALESCE(${userStats.level}, 1)`,
          itemCount: sql<number>`COUNT(DISTINCT ${collectionItems.id})`,
        })
        .from(collections)
        .innerJoin(users, eq(collections.userId, users.id))
        .leftJoin(userStats, eq(userStats.userId, users.id))
        .leftJoin(collectionItems, eq(collectionItems.collectionId, collections.id))
        .where(
          and(...baseConditions, gte(collections.createdAt, oneWeekAgo))
        )
        .groupBy(
          collections.id,
          users.name,
          users.avatarUrl,
          userStats.totalXp,
          userStats.level
        )
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
          avatarUrl: users.avatarUrl,
          totalXp: sql<number>`COALESCE(${userStats.totalXp}, 0)`,
          level: sql<number>`COALESCE(${userStats.level}, 1)`,
          itemCount: sql<number>`COUNT(DISTINCT ${collectionItems.id})`,
        })
        .from(collections)
        .innerJoin(users, eq(collections.userId, users.id))
        .leftJoin(userStats, eq(userStats.userId, users.id))
        .leftJoin(collectionItems, eq(collectionItems.collectionId, collections.id))
        .where(
          and(...baseConditions, gte(collections.createdAt, oneMonthAgo))
        )
        .groupBy(
          collections.id,
          users.name,
          users.avatarUrl,
          userStats.totalXp,
          userStats.level
        )
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
          avatarUrl: users.avatarUrl,
          totalXp: sql<number>`COALESCE(${userStats.totalXp}, 0)`,
          level: sql<number>`COALESCE(${userStats.level}, 1)`,
          itemCount: sql<number>`COUNT(DISTINCT ${collectionItems.id})`,
        })
        .from(collections)
        .innerJoin(users, eq(collections.userId, users.id))
        .leftJoin(userStats, eq(userStats.userId, users.id))
        .leftJoin(collectionItems, eq(collectionItems.collectionId, collections.id))
        .where(and(...baseConditions))
        .groupBy(
          collections.id,
          users.name,
          users.avatarUrl,
          userStats.totalXp,
          userStats.level
        )
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
                  avatarUrl: users.avatarUrl,
                  totalXp: sql<number>`COALESCE(${userStats.totalXp}, 0)`,
                  level: sql<number>`COALESCE(${userStats.level}, 1)`,
                  itemCount: sql<number>`COUNT(DISTINCT ${collectionItems.id})`,
                })
                .from(collections)
                .innerJoin(users, eq(collections.userId, users.id))
                .leftJoin(userStats, eq(userStats.userId, users.id))
                .leftJoin(collectionItems, eq(collectionItems.collectionId, collections.id))
                .where(
                  and(
                    eq(collections.isPublic, true),
                    inArray(collections.id, collectionIds)
                  )
                )
                .groupBy(
                  collections.id,
                  users.name,
                  users.avatarUrl,
                  userStats.totalXp,
                  userStats.level
                )
                .orderBy(desc(collections.cloneCount))
                .limit(10);
            }
          }
        }
      }

      const publicStories = await db
        .select({
          id: generatedContent.id,
          title: generatedContent.title,
          titleTranslation: generatedContent.titleTranslation,
          thumbnailUrl: generatedContent.thumbnailUrl,
          theme: generatedContent.theme,
          mode: generatedContent.mode,
          difficultyLevel: generatedContent.difficultyLevel,
          generatedAt: generatedContent.generatedAt,
          playCount: generatedContent.playCount,
          userName: users.name,
          avatarUrl: users.avatarUrl,
          targetLanguage: vocabularyLists.targetLanguage,
        })
        .from(generatedContent)
        .innerJoin(users, eq(generatedContent.userId, users.id))
        .innerJoin(vocabularyLists, eq(generatedContent.vocabularyListId, vocabularyLists.id))
        .where(and(...storyConditions))
        .orderBy(desc(generatedContent.generatedAt))
        .limit(input.limit);

      return {
        trending: trendingCollections,
        new: newCollections,
        popular: popularCollections,
        personalized: personalizedCollections,
        stories: publicStories,
      };
    }),
});
