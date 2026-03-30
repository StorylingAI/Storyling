import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { srsReviews, reviewHistory, reviewReminders, wordbank } from "../drizzle/schema";
import { getReviewNotificationCount } from "./srsNotifications";
import { eq, and, lte, sql } from "drizzle-orm";

/**
 * SM-2 Algorithm Implementation
 * https://en.wikipedia.org/wiki/SuperMemo#SM-2_algorithm
 * 
 * @param quality - User's self-assessed quality of recall (0-5)
 * @param repetitions - Number of consecutive correct responses
 * @param easeFactor - Current ease factor (difficulty multiplier)
 * @param interval - Current interval in days
 * @returns Updated SRS parameters
 */
function calculateSM2(
  quality: number,
  repetitions: number,
  easeFactor: number,
  interval: number
): { newEaseFactor: number; newInterval: number; newRepetitions: number } {
  let newEaseFactor = easeFactor;
  let newInterval = interval;
  let newRepetitions = repetitions;

  // Update ease factor based on quality
  newEaseFactor = Math.max(
    1.3,
    easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
  );

  // If quality >= 3, the response was correct
  if (quality >= 3) {
    if (repetitions === 0) {
      newInterval = 1; // First review: 1 day
    } else if (repetitions === 1) {
      newInterval = 6; // Second review: 6 days
    } else {
      newInterval = Math.round(interval * newEaseFactor);
    }
    newRepetitions = repetitions + 1;
  } else {
    // Incorrect response - reset repetitions and interval
    newRepetitions = 0;
    newInterval = 1;
  }

  return { newEaseFactor, newInterval, newRepetitions };
}

export const srsRouter = router({
  /**
   * Get words due for review
   */
  getDueWords: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const now = new Date();
    
    const dueReviews = await db
      .select({
        srsReview: srsReviews,
        word: wordbank,
      })
      .from(srsReviews)
      .innerJoin(wordbank, eq(srsReviews.wordId, wordbank.id))
      .where(
        and(
          eq(srsReviews.userId, ctx.user.id),
          lte(srsReviews.nextReviewAt, now),
          eq(srsReviews.status, "learning")
        )
      )
      .orderBy(srsReviews.nextReviewAt);

    return dueReviews.map(({ srsReview, word }) => ({
      ...word,
      srsReview,
    }));
  }),

  /**
   * Get review statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const now = new Date();
    
    // Count words by status
    const [stats] = await db
      .select({
        totalWords: sql<number>`COUNT(*)`,
        dueToday: sql<number>`SUM(CASE WHEN ${srsReviews.nextReviewAt} <= ${now} AND ${srsReviews.status} = 'learning' THEN 1 ELSE 0 END)`,
        learning: sql<number>`SUM(CASE WHEN ${srsReviews.status} = 'learning' THEN 1 ELSE 0 END)`,
        learned: sql<number>`SUM(CASE WHEN ${srsReviews.status} = 'learned' THEN 1 ELSE 0 END)`,
      })
      .from(srsReviews)
      .where(eq(srsReviews.userId, ctx.user.id));

    // Get review history for last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const recentReviews = await db
      .select({
        date: sql<string>`DATE(${reviewHistory.reviewedAt})`,
        count: sql<number>`COUNT(*)`,
      })
      .from(reviewHistory)
      .where(
        and(
          eq(reviewHistory.userId, ctx.user.id),
          sql`${reviewHistory.reviewedAt} >= ${thirtyDaysAgo}`
        )
      )
      .groupBy(sql`DATE(${reviewHistory.reviewedAt})`);

    return {
      totalWords: Number(stats?.totalWords || 0),
      dueToday: Number(stats?.dueToday || 0),
      learning: Number(stats?.learning || 0),
      learned: Number(stats?.learned || 0),
      recentReviews,
    };
  }),

  /**
   * Submit a review for a word
   */
  submitReview: protectedProcedure
    .input(
      z.object({
        wordId: z.number(),
        responseType: z.enum(["still_learning", "learned"]),
        timeSpentMs: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Find existing SRS review or create new one
      const [existingReview] = await db
        .select()
        .from(srsReviews)
        .where(
          and(
            eq(srsReviews.userId, ctx.user.id),
            eq(srsReviews.wordId, input.wordId)
          )
        )
        .limit(1);

      let srsReview = existingReview;
      
      if (!srsReview) {
        // Create new SRS review
        const now = new Date();
        const nextReview = new Date(now);
        nextReview.setDate(nextReview.getDate() + 1); // First review in 1 day

        const [result] = await db.insert(srsReviews).values({
          userId: ctx.user.id,
          wordId: input.wordId,
          easeFactor: 2.5,
          interval: 1,
          repetitions: 0,
          lastReviewedAt: now,
          nextReviewAt: nextReview,
          status: "learning",
          isLapsed: false,
          createdAt: now,
          updatedAt: now,
        });

        const [newReview] = await db
          .select()
          .from(srsReviews)
          .where(eq(srsReviews.id, (result as any).insertId))
          .limit(1);
        
        srsReview = newReview;
      }

      if (!srsReview) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Failed to create SRS review" });
      }

      // Map response type to quality score
      // "still_learning" = quality 2 (incorrect, needs more practice)
      // "learned" = quality 4 (correct with some hesitation)
      const quality = input.responseType === "learned" ? 4 : 2;

      // Calculate new SRS parameters using SM-2 algorithm
      const { newEaseFactor, newInterval, newRepetitions } = calculateSM2(
        quality,
        srsReview.repetitions,
        srsReview.easeFactor,
        srsReview.interval
      );

      const now = new Date();
      const nextReviewAt = new Date(now);
      nextReviewAt.setDate(nextReviewAt.getDate() + newInterval);

      // Determine new status
      let newStatus = srsReview.status;
      if (input.responseType === "learned" && newRepetitions >= 3) {
        newStatus = "learned"; // Graduated to "learned" after 3+ successful reviews
      }

      // Update SRS review
      await db
        .update(srsReviews)
        .set({
          easeFactor: newEaseFactor,
          interval: newInterval,
          repetitions: newRepetitions,
          lastReviewedAt: now,
          nextReviewAt,
          status: newStatus,
          isLapsed: input.responseType === "still_learning",
          updatedAt: now,
        })
        .where(eq(srsReviews.id, srsReview.id));

      // Record review history
      await db.insert(reviewHistory).values({
        srsReviewId: srsReview.id,
        userId: ctx.user.id,
        wordId: input.wordId,
        quality,
        responseType: input.responseType,
        easeFactorBefore: srsReview.easeFactor,
        easeFactorAfter: newEaseFactor,
        intervalBefore: srsReview.interval,
        intervalAfter: newInterval,
        reviewedAt: now,
        timeSpentMs: input.timeSpentMs,
      });

      return {
        success: true,
        nextReviewAt,
        interval: newInterval,
        status: newStatus,
      };
    }),

  /**
   * Get notification count for badge
   */
  getNotificationCount: protectedProcedure.query(async ({ ctx }) => {
    const count = await getReviewNotificationCount(ctx.user.id);
    return { count };
  }),

  /**
   * Get or create reminder settings
   */
  getReminderSettings: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const [settings] = await db
      .select()
      .from(reviewReminders)
      .where(eq(reviewReminders.userId, ctx.user.id))
      .limit(1);

    if (!settings) {
      // Create default settings
      const now = new Date();
      const [result] = await db.insert(reviewReminders).values({
        userId: ctx.user.id,
        enabled: true,
        dailyReminderTime: "09:00",
        emailReminders: true,
        pushReminders: true,
        createdAt: now,
        updatedAt: now,
      });

      const [newSettings] = await db
        .select()
        .from(reviewReminders)
        .where(eq(reviewReminders.id, (result as any).insertId))
        .limit(1);

      return newSettings;
    }

    return settings;
  }),

  /**
   * Update reminder settings
   */
  updateReminderSettings: protectedProcedure
    .input(
      z.object({
        enabled: z.boolean().optional(),
        dailyReminderTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
        emailReminders: z.boolean().optional(),
        pushReminders: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const now = new Date();
      
      // Upsert reminder settings
      const [existing] = await db
        .select()
        .from(reviewReminders)
        .where(eq(reviewReminders.userId, ctx.user.id))
        .limit(1);

      if (existing) {
        await db
          .update(reviewReminders)
          .set({
            ...input,
            updatedAt: now,
          })
          .where(eq(reviewReminders.userId, ctx.user.id));
      } else {
        await db.insert(reviewReminders).values({
          userId: ctx.user.id,
          enabled: input.enabled ?? true,
          dailyReminderTime: input.dailyReminderTime ?? "09:00",
          emailReminders: input.emailReminders ?? true,
          pushReminders: input.pushReminders ?? true,
          createdAt: now,
          updatedAt: now,
        });
      }

      return { success: true };
    }),
});
