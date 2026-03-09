import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { tonePracticeHistory, toneMasteryStats } from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";

/**
 * Tone practice router - handles tone practice tracking and statistics
 */
export const tonePracticeRouter = router({
  /**
   * Record a tone practice attempt
   */
  recordAttempt: protectedProcedure
    .input(
      z.object({
        character: z.string(),
        pinyin: z.string(),
        correctTone: z.number().min(1).max(4),
        selectedTone: z.number().min(1).max(4),
        responseTimeMs: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const isCorrect = input.correctTone === input.selectedTone;

      // Insert practice attempt
      await db.insert(tonePracticeHistory).values({
        userId: ctx.user.id,
        character: input.character,
        pinyin: input.pinyin,
        correctTone: input.correctTone,
        selectedTone: input.selectedTone,
        isCorrect,
        responseTimeMs: input.responseTimeMs,
      });

      // Update tone mastery stats
      await updateToneMasteryStats(db, ctx.user.id, input.correctTone, isCorrect);

      return { success: true, isCorrect };
    }),

  /**
   * Get tone mastery statistics for the current user
   */
  getMasteryStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const stats = await db
      .select()
      .from(toneMasteryStats)
      .where(eq(toneMasteryStats.userId, ctx.user.id));

    // Ensure all 4 tones have stats
    const toneMap = new Map(stats.map((s) => [s.tone, s]));
    const allTones = [1, 2, 3, 4].map((tone) => {
      const existing = toneMap.get(tone);
      if (existing) return existing;
      
      // Return default stats for tones with no practice yet
      return {
        id: 0,
        userId: ctx.user.id,
        tone,
        totalAttempts: 0,
        correctAttempts: 0,
        accuracyPercentage: 0,
        lastPracticedAt: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    });

    return allTones;
  }),

  /**
   * Get practice history for the current user
   */
  getPracticeHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
        tone: z.number().min(1).max(4).optional(), // Filter by specific tone
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      let query = db
        .select()
        .from(tonePracticeHistory)
        .where(eq(tonePracticeHistory.userId, ctx.user.id))
        .orderBy(desc(tonePracticeHistory.createdAt))
        .limit(input.limit);

      if (input.tone) {
        query = db
          .select()
          .from(tonePracticeHistory)
          .where(
            and(
              eq(tonePracticeHistory.userId, ctx.user.id),
              eq(tonePracticeHistory.correctTone, input.tone)
            )
          )
          .orderBy(desc(tonePracticeHistory.createdAt))
          .limit(input.limit);
      }

      const history = await query;
      return history;
    }),

  /**
   * Get weak tones - tones the user struggles with most
   */
  getWeakTones: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const stats = await db
      .select()
      .from(toneMasteryStats)
      .where(eq(toneMasteryStats.userId, ctx.user.id))
      .orderBy(sql`${toneMasteryStats.accuracyPercentage} ASC`);

    // Return tones with accuracy below 70% or fewer than 10 attempts
    const weakTones = stats.filter(
      (s) => s.totalAttempts < 10 || s.accuracyPercentage < 70
    );

    return weakTones;
  }),

  /**
   * Get tone pair confusion matrix - which tone pairs are commonly confused
   */
  getConfusionMatrix: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    // Get all incorrect attempts
    const incorrectAttempts = await db
      .select({
        correctTone: tonePracticeHistory.correctTone,
        selectedTone: tonePracticeHistory.selectedTone,
        count: sql<number>`COUNT(*)`.as("count"),
      })
      .from(tonePracticeHistory)
      .where(
        and(
          eq(tonePracticeHistory.userId, ctx.user.id),
          eq(tonePracticeHistory.isCorrect, false)
        )
      )
      .groupBy(tonePracticeHistory.correctTone, tonePracticeHistory.selectedTone);

    return incorrectAttempts;
  }),
});

/**
 * Helper function to update tone mastery stats
 */
async function updateToneMasteryStats(
  db: any,
  userId: number,
  tone: number,
  isCorrect: boolean
) {
  // Check if stats exist for this tone
  const existing = await db
    .select()
    .from(toneMasteryStats)
    .where(and(eq(toneMasteryStats.userId, userId), eq(toneMasteryStats.tone, tone)))
    .limit(1);

  if (existing.length > 0) {
    // Update existing stats
    const stats = existing[0];
    const newTotalAttempts = stats.totalAttempts + 1;
    const newCorrectAttempts = stats.correctAttempts + (isCorrect ? 1 : 0);
    const newAccuracy = (newCorrectAttempts / newTotalAttempts) * 100;

    await db
      .update(toneMasteryStats)
      .set({
        totalAttempts: newTotalAttempts,
        correctAttempts: newCorrectAttempts,
        accuracyPercentage: newAccuracy,
        lastPracticedAt: new Date(),
      })
      .where(eq(toneMasteryStats.id, stats.id));
  } else {
    // Create new stats
    await db.insert(toneMasteryStats).values({
      userId,
      tone,
      totalAttempts: 1,
      correctAttempts: isCorrect ? 1 : 0,
      accuracyPercentage: isCorrect ? 100 : 0,
      lastPracticedAt: new Date(),
    });
  }
}
