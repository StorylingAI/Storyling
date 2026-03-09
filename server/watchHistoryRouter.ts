import { router, protectedProcedure } from "./_core/trpc";
import { z } from "zod";
import { watchHistory, generatedContent, vocabularyLists } from "../drizzle/schema";
import { getDb } from "./db";
import { eq, desc, and, inArray } from "drizzle-orm";

export const watchHistoryRouter = router({
  /**
   * Record a watch history entry when user watches content
   */
  recordWatch: protectedProcedure
    .input(
      z.object({
        contentId: z.number(),
        duration: z.number(), // How long they watched in seconds
        completed: z.boolean(),
        progressPercentage: z.number().min(0).max(100),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      
      await db.insert(watchHistory).values({
        userId: ctx.user.id,
        contentId: input.contentId,
        duration: input.duration,
        completed: input.completed,
        progressPercentage: input.progressPercentage,
      });

      return { success: true };
    }),

  /**
   * Get watch history for the authenticated user
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().optional().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      
      const history = await db
        .select({
          id: watchHistory.id,
          contentId: watchHistory.contentId,
          watchedAt: watchHistory.watchedAt,
          duration: watchHistory.duration,
          completed: watchHistory.completed,
          progressPercentage: watchHistory.progressPercentage,
          // Join with content details
          contentTitle: generatedContent.title,
          contentTitleTranslation: generatedContent.titleTranslation,
          contentTheme: generatedContent.theme,
          contentMode: generatedContent.mode,
          contentThumbnailUrl: generatedContent.thumbnailUrl,
          contentTargetLanguage: vocabularyLists.targetLanguage,
        })
        .from(watchHistory)
        .innerJoin(generatedContent, eq(watchHistory.contentId, generatedContent.id))
        .innerJoin(vocabularyLists, eq(generatedContent.vocabularyListId, vocabularyLists.id))
        .where(eq(watchHistory.userId, ctx.user.id))
        .orderBy(desc(watchHistory.watchedAt))
        .limit(input.limit);

      return history;
    }),

  /**
   * Get watch history grouped by date
   */
  getHistoryGroupedByDate: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    
    const history = await db
      .select({
        id: watchHistory.id,
        contentId: watchHistory.contentId,
        watchedAt: watchHistory.watchedAt,
        duration: watchHistory.duration,
        completed: watchHistory.completed,
        progressPercentage: watchHistory.progressPercentage,
        contentTitle: generatedContent.title,
        contentTitleTranslation: generatedContent.titleTranslation,
        contentTheme: generatedContent.theme,
        contentMode: generatedContent.mode,
        contentThumbnailUrl: generatedContent.thumbnailUrl,
        vocabularyListId: generatedContent.vocabularyListId,
      })
      .from(watchHistory)
      .innerJoin(generatedContent, eq(watchHistory.contentId, generatedContent.id))
      .where(eq(watchHistory.userId, ctx.user.id))
      .orderBy(desc(watchHistory.watchedAt))
      .limit(100);

    // Get target languages from vocabulary lists
    const listIds = Array.from(new Set(history.map(h => h.vocabularyListId)));
    const lists = await db
      .select({
        id: vocabularyLists.id,
        targetLanguage: vocabularyLists.targetLanguage,
      })
      .from(vocabularyLists)
      .where(inArray(vocabularyLists.id, listIds));
    
    const listMap = new Map(lists.map(l => [l.id, l.targetLanguage]));

    // Add target language to history items
    const enrichedHistory = history.map(item => ({
      ...item,
      contentTargetLanguage: listMap.get(item.vocabularyListId) || 'Unknown',
    }));

    // Group by date
    type HistoryItem = typeof enrichedHistory[number];
    const grouped = enrichedHistory.reduce((acc: Record<string, HistoryItem[]>, item: HistoryItem) => {
      const date = new Date(item.watchedAt).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      });
      
      if (!acc[date]) {
        acc[date] = [];
      }
      
      acc[date].push(item);
      return acc;
    }, {});

    return grouped;
  }),
});
