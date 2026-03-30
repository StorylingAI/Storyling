import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { wordbank, practiceHistory, userStats, wordMastery } from "../drizzle/schema";
import { eq, and, desc, sql } from "drizzle-orm";
import { calculateSM2, answerToQuality, WordMasteryData } from "./spacedRepetition";

export const practiceRouter = router({
  /**
   * Start a practice session - get random words from wordbank
   */
  startSession: protectedProcedure
    .input(
      z.object({
        quizMode: z.enum(["flashcard", "multiple_choice", "fill_in_blank"]),
        count: z.number().min(1).max(20).default(10),
        targetLanguage: z.string().optional(),
        masteryLevel: z.enum(["learning", "familiar", "mastered"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Build query conditions
      const conditions = [eq(wordbank.userId, ctx.user.id)];
      
      if (input.targetLanguage) {
        conditions.push(eq(wordbank.targetLanguage, input.targetLanguage));
      }
      
      if (input.masteryLevel) {
        conditions.push(eq(wordbank.masteryLevel, input.masteryLevel));
      }

      // Get random words from wordbank
      const words = await db
        .select()
        .from(wordbank)
        .where(and(...conditions))
        .orderBy(sql`RAND()`)
        .limit(input.count);

      if (words.length === 0) {
        throw new Error("No words found in wordbank. Please save some words first!");
      }

      return {
        sessionId: Date.now().toString(),
        quizMode: input.quizMode,
        words: words.map((w) => ({
          id: w.id,
          word: w.word,
          pinyin: w.pinyin,
          translation: w.translation,
          targetLanguage: w.targetLanguage,
          exampleSentences: w.exampleSentences as string[] | null,
          audioUrl: w.audioUrl,
        })),
      };
    }),

  /**
   * Submit practice answer and update mastery + spaced repetition
   */
  submitAnswer: protectedProcedure
    .input(
      z.object({
        wordbankId: z.number(),
        quizMode: z.enum(["flashcard", "multiple_choice", "fill_in_blank"]),
        isCorrect: z.boolean(),
        responseTime: z.number().optional(), // milliseconds
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Calculate XP reward
      const xpEarned = input.isCorrect ? 5 : 0;

      // Record practice history
      await db.insert(practiceHistory).values({
        userId: ctx.user.id,
        wordbankId: input.wordbankId,
        quizMode: input.quizMode,
        isCorrect: input.isCorrect,
        xpEarned,
        createdAt: new Date(),
      });

      // Update wordbank stats
      const updateData: any = {
        lastPracticedAt: new Date(),
      };

      if (input.isCorrect) {
        updateData.timesCorrect = sql`${wordbank.timesCorrect} + 1`;
      } else {
        updateData.timesIncorrect = sql`${wordbank.timesIncorrect} + 1`;
      }

      await db
        .update(wordbank)
        .set(updateData)
        .where(
          and(
            eq(wordbank.id, input.wordbankId),
            eq(wordbank.userId, ctx.user.id)
          )
        );

      // Get updated word to check mastery level and target language
      const [word] = await db
        .select()
        .from(wordbank)
        .where(
          and(
            eq(wordbank.id, input.wordbankId),
            eq(wordbank.userId, ctx.user.id)
          )
        )
        .limit(1);

      // Update spaced repetition schedule
      if (word) {
        // Get or create word mastery record
        const [existingMastery] = await db
          .select()
          .from(wordMastery)
          .where(
            and(
              eq(wordMastery.userId, ctx.user.id),
              eq(wordMastery.word, word.word),
              eq(wordMastery.targetLanguage, word.targetLanguage)
            )
          )
          .limit(1);

        // Convert response time and correctness to SM-2 quality rating
        const quality = answerToQuality(input.isCorrect, input.responseTime);

        // Calculate new SM-2 parameters
        const currentData: WordMasteryData = {
          easinessFactor: existingMastery ? existingMastery.easinessFactor : 2500, // Stored as 1000x (2500 = 2.5)
          interval: existingMastery?.interval || 0,
          repetitions: existingMastery?.repetitions || 0,
          nextReviewDate: existingMastery?.nextReviewDate || new Date(),
        };

        const { easinessFactor, interval, repetitions } = calculateSM2(
          quality,
          currentData
        );

        const nextReviewDate = new Date();
        nextReviewDate.setDate(nextReviewDate.getDate() + interval);

        if (existingMastery) {
          // Update existing record
          await db
            .update(wordMastery)
            .set({
              easinessFactor: easinessFactor, // Already in 1000x format from calculateSM2
              interval,
              repetitions,
              nextReviewDate,
              lastReviewedAt: new Date(),
              correctCount: input.isCorrect
                ? sql`${wordMastery.correctCount} + 1`
                : existingMastery.correctCount,
              incorrectCount: !input.isCorrect
                ? sql`${wordMastery.incorrectCount} + 1`
                : existingMastery.incorrectCount,
            })
            .where(eq(wordMastery.id, existingMastery.id));
        } else {
          // Create new record
          await db.insert(wordMastery).values({
            userId: ctx.user.id,
            word: word.word,
            targetLanguage: word.targetLanguage,
            easinessFactor: Math.round(easinessFactor * 100),
            interval,
            repetitions,
            nextReviewDate,
            lastReviewedAt: new Date(),
            correctCount: input.isCorrect ? 1 : 0,
            incorrectCount: input.isCorrect ? 0 : 1,
          });
        }
      }

      if (word) {
        // Auto-upgrade mastery level based on performance (keeping existing logic)
        const totalAttempts = word.timesCorrect + word.timesIncorrect;
        const accuracy = totalAttempts > 0 ? word.timesCorrect / totalAttempts : 0;

        let newMasteryLevel = word.masteryLevel;
        
        if (accuracy >= 0.9 && totalAttempts >= 5) {
          newMasteryLevel = "mastered";
        } else if (accuracy >= 0.7 && totalAttempts >= 3) {
          newMasteryLevel = "familiar";
        } else {
          newMasteryLevel = "learning";
        }

        if (newMasteryLevel !== word.masteryLevel) {
          await db
            .update(wordbank)
            .set({ masteryLevel: newMasteryLevel })
            .where(
              and(
                eq(wordbank.id, input.wordbankId),
                eq(wordbank.userId, ctx.user.id)
              )
            );
        }

        // Award XP to user stats
        if (xpEarned > 0) {
          await db
            .update(userStats)
            .set({
              totalXp: sql`${userStats.totalXp} + ${xpEarned}`,
            })
            .where(eq(userStats.userId, ctx.user.id));
        }

        return {
          success: true,
          xpEarned,
          newMasteryLevel,
          leveledUp: newMasteryLevel !== word.masteryLevel,
        };
      }

      return { success: true, xpEarned, newMasteryLevel: null, leveledUp: false };
    }),

  /**
   * Get practice history and statistics
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const history = await db
        .select({
          id: practiceHistory.id,
          wordbankId: practiceHistory.wordbankId,
          quizMode: practiceHistory.quizMode,
          isCorrect: practiceHistory.isCorrect,
          xpEarned: practiceHistory.xpEarned,
          createdAt: practiceHistory.createdAt,
          word: wordbank.word,
          translation: wordbank.translation,
        })
        .from(practiceHistory)
        .leftJoin(wordbank, eq(practiceHistory.wordbankId, wordbank.id))
        .where(eq(practiceHistory.userId, ctx.user.id))
        .orderBy(desc(practiceHistory.createdAt))
        .limit(input.limit);

      return history;
    }),

  /**
   * Get practice statistics summary
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get total practice attempts
    const [totalStats] = await db
      .select({
        totalAttempts: sql<number>`COUNT(*)`,
        correctAttempts: sql<number>`SUM(CASE WHEN ${practiceHistory.isCorrect} = 1 THEN 1 ELSE 0 END)`,
        totalXpEarned: sql<number>`SUM(${practiceHistory.xpEarned})`,
      })
      .from(practiceHistory)
      .where(eq(practiceHistory.userId, ctx.user.id));

    // Get mastery level distribution
    const masteryDistribution = await db
      .select({
        masteryLevel: wordbank.masteryLevel,
        count: sql<number>`COUNT(*)`,
      })
      .from(wordbank)
      .where(eq(wordbank.userId, ctx.user.id))
      .groupBy(wordbank.masteryLevel);

    const accuracy =
      totalStats.totalAttempts > 0
        ? (totalStats.correctAttempts / totalStats.totalAttempts) * 100
        : 0;

    return {
      totalAttempts: totalStats.totalAttempts || 0,
      correctAttempts: totalStats.correctAttempts || 0,
      accuracy: Math.round(accuracy),
      totalXpEarned: totalStats.totalXpEarned || 0,
      masteryDistribution: masteryDistribution.map((m) => ({
        level: m.masteryLevel,
        count: m.count,
      })),
    };
  }),
});
