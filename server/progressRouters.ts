import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { storyProgress, generatedContent } from "../drizzle/schema";
import { eq, and, desc, inArray } from "drizzle-orm";

export const storyProgressRouter = router({
  /**
   * Save or update story progress
   */
  saveProgress: protectedProcedure
    .input(
      z.object({
        contentId: z.number(),
        currentSentence: z.number(),
        currentTime: z.number(),
        totalDuration: z.number(),
        completed: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      const userId = ctx.user.id;

      // Check if progress already exists
      const existing = await db
        .select()
        .from(storyProgress)
        .where(
          and(
            eq(storyProgress.userId, userId),
            eq(storyProgress.contentId, input.contentId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        // Update existing progress
        await db
          .update(storyProgress)
          .set({
            currentSentence: input.currentSentence,
            currentTime: input.currentTime,
            totalDuration: input.totalDuration,
            completed: input.completed,
            lastWatchedAt: new Date(),
          })
          .where(eq(storyProgress.id, existing[0].id));

        return { success: true, progressId: existing[0].id };
      } else {
        // Insert new progress
        const result = await db.insert(storyProgress).values({
          userId,
          contentId: input.contentId,
          currentSentence: input.currentSentence,
          currentTime: input.currentTime,
          totalDuration: input.totalDuration,
          completed: input.completed,
        });

        return { success: true, progressId: result[0].insertId };
      }
    }),

  /**
   * Get story progress for a specific content
   */
  getProgress: protectedProcedure
    .input(
      z.object({
        contentId: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      const userId = ctx.user.id;

      const progress = await db
        .select()
        .from(storyProgress)
        .where(
          and(
            eq(storyProgress.userId, userId),
            eq(storyProgress.contentId, input.contentId)
          )
        )
        .limit(1);

      return progress.length > 0 ? progress[0] : null;
    }),

  /**
   * Mark story as completed
   */
  markCompleted: protectedProcedure
    .input(
      z.object({
        contentId: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection failed");
      const userId = ctx.user.id;

      const existing = await db
        .select()
        .from(storyProgress)
        .where(
          and(
            eq(storyProgress.userId, userId),
            eq(storyProgress.contentId, input.contentId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(storyProgress)
          .set({
            completed: true,
            lastWatchedAt: new Date(),
          })
          .where(eq(storyProgress.id, existing[0].id));
      }

      return { success: true };
    }),

  /**
   * Get all user's progress (for dashboard/history)
   */
  getAllProgress: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    const userId = ctx.user.id;

    const allProgress = await db
      .select()
      .from(storyProgress)
      .where(eq(storyProgress.userId, userId))
      .orderBy(storyProgress.lastWatchedAt);

    return allProgress;
  }),

  /**
   * Get recently watched stories (last 5) with content details
   */
  getRecentlyWatched: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    const userId = ctx.user.id;

    // Get last 5 watched stories ordered by lastWatchedAt desc
    const recentProgress = await db
      .select()
      .from(storyProgress)
      .where(eq(storyProgress.userId, userId))
      .orderBy(desc(storyProgress.lastWatchedAt))
      .limit(5);

    if (recentProgress.length === 0) {
      return [];
    }

    // Get content details for these stories
    const contentIds = recentProgress.map(p => p.contentId);
    const contents = await db
      .select()
      .from(generatedContent)
      .where(inArray(generatedContent.id, contentIds));

    // Merge progress data with content data
    return recentProgress.map(progress => {
      const content = contents.find(c => c.id === progress.contentId);
      const progressPercent = progress.totalDuration > 0
        ? Math.round((progress.currentTime / progress.totalDuration) * 100)
        : 0;

      return {
        ...content,
        progress: {
          currentTime: progress.currentTime,
          totalDuration: progress.totalDuration,
          progressPercent,
          completed: progress.completed,
          lastWatchedAt: progress.lastWatchedAt,
        },
      };
    });
  }),

  /**
   * Get the most recent in-progress story (not completed, has progress)
   */
  getMostRecentInProgress: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    const userId = ctx.user.id;

    // Get most recent in-progress story (not completed, has progress > 0)
    const recentProgress = await db
      .select()
      .from(storyProgress)
      .where(
        and(
          eq(storyProgress.userId, userId),
          eq(storyProgress.completed, false)
        )
      )
      .orderBy(desc(storyProgress.lastWatchedAt))
      .limit(1);

    if (recentProgress.length === 0) {
      return null;
    }

    const progress = recentProgress[0];

    // Get content details
    const content = await db
      .select()
      .from(generatedContent)
      .where(eq(generatedContent.id, progress.contentId))
      .limit(1);

    if (content.length === 0) {
      return null;
    }

    const progressPercent = progress.totalDuration > 0
      ? Math.round((progress.currentTime / progress.totalDuration) * 100)
      : 0;

    return {
      ...content[0],
      progress: {
        currentTime: progress.currentTime,
        totalDuration: progress.totalDuration,
        progressPercent,
        completed: progress.completed,
        lastWatchedAt: progress.lastWatchedAt,
      },
    };
  }),
});
