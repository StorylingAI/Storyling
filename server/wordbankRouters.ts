import { z } from "zod";
import { sql } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import { FREE_TIER_LIMITS } from "../shared/freemiumLimits";
import {
  claimDailyLookup,
  getDailyVocabSaveUsage,
  getDailyWindow,
  isFreeLimitedUser,
  recordDailyVocabSave,
} from "./dailyUsage";
import {
  saveWordToWordbank,
  getWordbankByUserId,
  getWordbankByUserIdAndLanguage,
  checkWordInWordbank,
  removeWordFromWordbank,
} from "./wordbankDb";
import { isDueForReview, getDaysUntilReview } from "./srsAlgorithm";
import { normalizeLearningLanguage } from "@shared/languagePreferences";
import { normalizeWordbankTargetLanguage } from "@shared/wordbankImport";

export const wordbankRouter = router({
  checkWordExists: protectedProcedure
    .input(
      z.object({
        word: z.string(),
        targetLanguage: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      const targetLanguage = normalizeWordbankTargetLanguage(input.targetLanguage);
      const exists = await checkWordInWordbank(
        ctx.user.id,
        input.word,
        targetLanguage
      );
      return { exists };
    }),

  bulkImportWords: protectedProcedure
    .input(
      z.object({
        words: z.array(z.string()).min(1).max(100),
        targetLanguage: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { invokeLLM } = await import("./_core/llm");
      const dailyWindow = getDailyWindow(ctx.user.timezone || null);
      const targetLanguage = normalizeWordbankTargetLanguage(input.targetLanguage);
      const results = {
        total: input.words.length,
        success: 0,
        failed: 0,
        skipped: 0,
        duplicateSkipped: 0,
        limitSkipped: 0,
        emptySkipped: 0,
        unsavedWords: [] as string[],
        errors: [] as string[],
      };
      const translationLanguage = normalizeLearningLanguage(
        ctx.user.preferredTranslationLanguage ||
        ctx.user.preferredLanguage ||
        "English",
      );

      for (const word of input.words) {
        try {
          const trimmedWord = word.trim();
          if (!trimmedWord) {
            results.skipped++;
            results.emptySkipped++;
            continue;
          }

          // Check if word already exists
          const exists = await checkWordInWordbank(
            ctx.user.id,
            trimmedWord,
            targetLanguage
          );

          if (exists) {
            results.skipped++;
            results.duplicateSkipped++;
            results.errors.push(`"${trimmedWord}" already in wordbank`);
            continue;
          }

          if (isFreeLimitedUser(ctx.user)) {
            const dailySaves = await getDailyVocabSaveUsage(ctx.user.id, dailyWindow);
            if (dailySaves >= FREE_TIER_LIMITS.vocabSavesPerDay) {
              results.skipped++;
              results.limitSkipped++;
              results.unsavedWords.push(trimmedWord);
              results.errors.push(
                `Daily vocabulary save limit reached (${FREE_TIER_LIMITS.vocabSavesPerDay}/day)`,
              );
              continue;
            }
          }

          let translation = "";
          try {
            // Get translation using LLM, but do not drop the word if translation fails.
            const response = await invokeLLM({
              messages: [
                {
                  role: "system",
                  content: "You are a language translation assistant. Translate the given word to the target language and provide a brief definition.",
                },
                {
                  role: "user",
                  content: `Translate the word "${trimmedWord}" to ${translationLanguage}. Provide the translation and a brief definition.`,
                },
              ],
              response_format: {
                type: "json_schema",
                json_schema: {
                  name: "word_translation",
                  strict: true,
                  schema: {
                    type: "object",
                    properties: {
                      word: { type: "string", description: "The original word" },
                      translation: { type: "string", description: "Translation in target language" },
                      definition: { type: "string", description: "Brief definition" },
                      sourceLanguage: { type: "string", description: "Detected source language code" },
                    },
                    required: ["word", "translation", "definition", "sourceLanguage"],
                    additionalProperties: false,
                  },
                },
              },
            });

            const content = response.choices[0].message.content;
            const translationData = JSON.parse(typeof content === "string" ? content : "{}");
            translation = typeof translationData.translation === "string"
              ? translationData.translation
              : "";
          } catch (translationError) {
            results.errors.push(
              `"${trimmedWord}": imported without translation (${translationError instanceof Error ? translationError.message : "translation unavailable"})`,
            );
          }

          // Save to wordbank
          await saveWordToWordbank({
            userId: ctx.user.id,
            word: trimmedWord,
            translation,
            targetLanguage,
          });
          await recordDailyVocabSave(ctx.user.id, dailyWindow);

          results.success++;
        } catch (error) {
          results.failed++;
          const trimmedWord = word.trim();
          if (trimmedWord) results.unsavedWords.push(trimmedWord);
          results.errors.push(`"${word}": ${error instanceof Error ? error.message : "Unknown error"}`);
        }
      }

      return results;
    }),

  saveWord: protectedProcedure
    .input(
      z.object({
        word: z.string(),
        pinyin: z.string().optional(),
        translation: z.string(),
        targetLanguage: z.string(),
        exampleSentences: z.array(z.string()).optional(),
        audioUrl: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const targetLanguage = normalizeWordbankTargetLanguage(input.targetLanguage);
      // Check if word already exists
      const exists = await checkWordInWordbank(
        ctx.user.id,
        input.word,
        targetLanguage
      );

      if (exists) {
        throw new Error("Word already in wordbank");
      }

      const dailyWindow = getDailyWindow(ctx.user.timezone || null);
      if (isFreeLimitedUser(ctx.user)) {
        const dailySaves = await getDailyVocabSaveUsage(ctx.user.id, dailyWindow);
        if (dailySaves >= FREE_TIER_LIMITS.vocabSavesPerDay) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `You've saved ${FREE_TIER_LIMITS.vocabSavesPerDay} vocabulary words today. Upgrade to Premium for unlimited saves.`,
          });
        }
      }

      const result = await saveWordToWordbank({
        userId: ctx.user.id,
        ...input,
        targetLanguage,
      });
      await recordDailyVocabSave(ctx.user.id, dailyWindow);

      // Check if user has added enough words and mark challenge as completed
      try {
        const wordCount = await getWordbankByUserId(ctx.user.id);
        const { completeChallenge, TUTORIAL_CHALLENGES, getVocabularyRequirement } = await import("./tutorialRouter");
        const requiredCount = getVocabularyRequirement(targetLanguage);
        
        if (wordCount.length >= requiredCount) {
          await completeChallenge(ctx.user.id, TUTORIAL_CHALLENGES.ADD_VOCABULARY);
        }
      } catch (error) {
        console.error("Failed to check/mark vocabulary challenge:", error);
      }

      return result;
    }),

  getTodayWordCount: protectedProcedure.query(async ({ ctx }) => {
    const dailyWindow = getDailyWindow(ctx.user.timezone || null);
    const count = await getDailyVocabSaveUsage(ctx.user.id, dailyWindow);
    const isLimited = isFreeLimitedUser(ctx.user);
    const limit = isLimited ? FREE_TIER_LIMITS.vocabSavesPerDay : null;

    return {
      count,
      limit,
      canSave: limit === null || count < limit,
      nextResetAt: dailyWindow.nextResetAt.toISOString(),
    };
  }),

  getMyWords: protectedProcedure.query(async ({ ctx }) => {
    const { getDb } = await import("./db");
    const { wordbank, wordMastery } = await import("../drizzle/schema");
    const { eq, and } = await import("drizzle-orm");
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get all words with their mastery data
    const words = await db
      .select({
        id: wordbank.id,
        createdAt: wordbank.createdAt,
        userId: wordbank.userId,
        word: wordbank.word,
        pinyin: wordbank.pinyin,
        translation: wordbank.translation,
        targetLanguage: wordbank.targetLanguage,
        masteryLevel: wordbank.masteryLevel,
        exampleSentences: wordbank.exampleSentences,
        audioUrl: wordbank.audioUrl,
        nextReviewDate: wordMastery.nextReviewDate,
        easinessFactor: wordMastery.easinessFactor,
        interval: wordMastery.interval,
        repetitions: wordMastery.repetitions,
        correctCount: wordMastery.correctCount,
        incorrectCount: wordMastery.incorrectCount,
      })
      .from(wordbank)
      .leftJoin(
        wordMastery,
        and(
          eq(wordbank.userId, wordMastery.userId),
          eq(wordbank.word, wordMastery.word),
          eq(wordbank.targetLanguage, wordMastery.targetLanguage)
        )
      )
      .where(eq(wordbank.userId, ctx.user.id));
    
    return words;
  }),

  getMyWordsByLanguage: protectedProcedure
    .input(z.object({ targetLanguage: z.string() }))
    .query(async ({ input, ctx }) => {
      return await getWordbankByUserIdAndLanguage(
        ctx.user.id,
        normalizeWordbankTargetLanguage(input.targetLanguage),
      );
    }),

  checkWordSaved: protectedProcedure
    .input(
      z.object({
        word: z.string(),
        targetLanguage: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      return await checkWordInWordbank(
        ctx.user.id,
        input.word,
        normalizeWordbankTargetLanguage(input.targetLanguage),
      );
    }),

  removeWord: protectedProcedure
    .input(z.object({ wordId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      await removeWordFromWordbank(ctx.user.id, input.wordId);
      return { success: true };
    }),

  // SRS Review Queue APIs
  getDueWords: protectedProcedure.query(async ({ ctx }) => {
    const { getDb } = await import("./db");
    const { wordbank, wordMastery } = await import("../drizzle/schema");
    const { eq, and, lte } = await import("drizzle-orm");
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const now = new Date();
    const dueWords = await db
      .select({
        id: wordbank.id,
        word: wordbank.word,
        pinyin: wordbank.pinyin,
        translation: wordbank.translation,
        targetLanguage: wordbank.targetLanguage,
        exampleSentences: wordbank.exampleSentences,
        audioUrl: wordbank.audioUrl,
        userId: wordbank.userId,
        createdAt: wordbank.createdAt,
        nextReviewDate: wordMastery.nextReviewDate,
        easinessFactor: wordMastery.easinessFactor,
        interval: wordMastery.interval,
        repetitions: wordMastery.repetitions,
        correctCount: wordMastery.correctCount,
        incorrectCount: wordMastery.incorrectCount,
      })
      .from(wordbank)
      .innerJoin(
        wordMastery,
        and(
          eq(wordbank.userId, wordMastery.userId),
          eq(wordbank.word, wordMastery.word),
          eq(wordbank.targetLanguage, wordMastery.targetLanguage)
        )
      )
      .where(
        and(
          eq(wordbank.userId, ctx.user.id),
          lte(wordMastery.nextReviewDate, now),
          // Exclude mastered words (easinessFactor >= 2500 AND interval >= 30)
          sql`NOT (${wordMastery.easinessFactor} >= 2500 AND ${wordMastery.interval} >= 30)`
        )
      );
    
    return dueWords;
  }),

  getDueCount: protectedProcedure.query(async ({ ctx }) => {
    const { getDb } = await import("./db");
    const { wordbank, wordMastery } = await import("../drizzle/schema");
    const { eq, and, lte, sql } = await import("drizzle-orm");
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const now = new Date();
    const [result] = await db
      .select({
        count: sql<number>`COUNT(*)`
      })
      .from(wordbank)
      .innerJoin(
        wordMastery,
        and(
          eq(wordbank.userId, wordMastery.userId),
          eq(wordbank.word, wordMastery.word),
          eq(wordbank.targetLanguage, wordMastery.targetLanguage)
        )
      )
      .where(
        and(
          eq(wordbank.userId, ctx.user.id),
          lte(wordMastery.nextReviewDate, now),
          // Exclude mastered words (easinessFactor >= 2500 AND interval >= 30)
          sql`NOT (${wordMastery.easinessFactor} >= 2500 AND ${wordMastery.interval} >= 30)`
        )
      );
    
    return { count: Number(result.count) };
  }),

  getUpcomingReviews: protectedProcedure.query(async ({ ctx }) => {
    const allWords = await getWordbankByUserId(ctx.user.id);
    
    // Get words with upcoming reviews (next 7 days)
    const upcoming = allWords
      .filter(word => {
        const daysUntil = getDaysUntilReview(word.nextReviewDate);
        return daysUntil > 0 && daysUntil <= 7;
      })
      .map(word => ({
        ...word,
        daysUntilReview: getDaysUntilReview(word.nextReviewDate),
      }))
      .sort((a, b) => a.daysUntilReview - b.daysUntilReview);
    
    return upcoming;
  }),

  // SRS Statistics APIs
  getReviewCalendar: protectedProcedure
    .input(z.object({ days: z.number().min(7).max(365).default(90) }))
    .query(async ({ input, ctx }) => {
      const { getDb } = await import("./db");
      const { practiceHistory } = await import("../drizzle/schema");
      const { eq, gte, sql } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      // Get review activity grouped by date
      const activity = await db
        .select({
          date: sql<string>`DATE(${practiceHistory.createdAt})`,
          count: sql<number>`COUNT(*)`,
        })
        .from(practiceHistory)
        .where(
          eq(practiceHistory.userId, ctx.user.id)
        )
        .groupBy(sql`DATE(${practiceHistory.createdAt})`)
        .orderBy(sql`DATE(${practiceHistory.createdAt})`);

      return activity;
    }),

  getRetentionRate: protectedProcedure
    .input(z.object({ days: z.number().min(7).max(365).default(30) }))
    .query(async ({ input, ctx }) => {
      const { getDb } = await import("./db");
      const { practiceHistory } = await import("../drizzle/schema");
      const { eq, gte, sql } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Calculate date range
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - input.days);

      // Get retention rate over time (grouped by week)
      const retention = await db
        .select({
          week: sql<string>`DATE_FORMAT(${practiceHistory.createdAt}, '%Y-%u')`,
          totalReviews: sql<number>`COUNT(*)`,
          correctReviews: sql<number>`SUM(CASE WHEN ${practiceHistory.isCorrect} = 1 THEN 1 ELSE 0 END)`,
          retentionRate: sql<number>`ROUND(SUM(CASE WHEN ${practiceHistory.isCorrect} = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1)`,
        })
        .from(practiceHistory)
        .where(
          eq(practiceHistory.userId, ctx.user.id)
        )
        .groupBy(sql`DATE_FORMAT(${practiceHistory.createdAt}, '%Y-%u')`)
        .orderBy(sql`DATE_FORMAT(${practiceHistory.createdAt}, '%Y-%u')`);

      return retention;
    }),

  getReviewStreak: protectedProcedure.query(async ({ ctx }) => {
    const { getDb } = await import("./db");
    const { practiceHistory } = await import("../drizzle/schema");
    const { eq, sql } = await import("drizzle-orm");
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get distinct review dates
    const reviewDates = await db
      .selectDistinct({
        date: sql<string>`DATE(${practiceHistory.createdAt}) as date`,
      })
      .from(practiceHistory)
      .where(eq(practiceHistory.userId, ctx.user.id))
      .orderBy(sql`date DESC`);

    if (reviewDates.length === 0) {
      return { currentStreak: 0, longestStreak: 0 };
    }

    // Calculate current streak
    let currentStreak = 0;
    let longestStreak = 0;
    let tempStreak = 1;
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let i = 0; i < reviewDates.length; i++) {
      const reviewDate = new Date(reviewDates[i].date);
      reviewDate.setHours(0, 0, 0, 0);

      if (i === 0) {
        // Check if most recent review is today or yesterday
        const daysDiff = Math.floor((today.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24));
        if (daysDiff <= 1) {
          currentStreak = 1;
        }
      } else {
        const prevDate = new Date(reviewDates[i - 1].date);
        prevDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor((prevDate.getTime() - reviewDate.getTime()) / (1000 * 60 * 60 * 24));

        if (daysDiff === 1) {
          tempStreak++;
          if (i === 1 || currentStreak > 0) {
            currentStreak++;
          }
        } else {
          longestStreak = Math.max(longestStreak, tempStreak);
          tempStreak = 1;
        }
      }
    }

    longestStreak = Math.max(longestStreak, tempStreak, currentStreak);

    return { currentStreak, longestStreak };
  }),

  getSRSStatistics: protectedProcedure.query(async ({ ctx }) => {
    const { getDb } = await import("./db");
    const { wordMastery, practiceHistory } = await import("../drizzle/schema");
    const { eq, lte, sql } = await import("drizzle-orm");
    const { calculateMasteryLevel } = await import("./spacedRepetition");
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get all word mastery records
    const words = await db
      .select()
      .from(wordMastery)
      .where(eq(wordMastery.userId, ctx.user.id));

    // Calculate mastery distribution
    const masteryLevels = words.map(w => {
      const level = calculateMasteryLevel(w);
      if (level >= 80) return "mastered";
      if (level >= 40) return "familiar";
      return "learning";
    });

    const distribution = {
      mastered: masteryLevels.filter(l => l === "mastered").length,
      familiar: masteryLevels.filter(l => l === "familiar").length,
      learning: masteryLevels.filter(l => l === "learning").length,
    };

    // Count words due for review
    const dueWords = words.filter(w => {
      const now = new Date();
      return w.nextReviewDate && new Date(w.nextReviewDate) <= now;
    }).length;

    // Get upcoming reviews (next 7 days)
    const upcomingReviews = words.filter(w => {
      if (!w.nextReviewDate) return false;
      const reviewDate = new Date(w.nextReviewDate);
      const now = new Date();
      const sevenDaysFromNow = new Date();
      sevenDaysFromNow.setDate(sevenDaysFromNow.getDate() + 7);
      return reviewDate > now && reviewDate <= sevenDaysFromNow;
    }).length;

    // Get total reviews and average accuracy
    const [stats] = await db
      .select({
        totalReviews: sql<number>`COUNT(*)`,
        correctReviews: sql<number>`SUM(CASE WHEN ${practiceHistory.isCorrect} = 1 THEN 1 ELSE 0 END)`,
        averageAccuracy: sql<number>`ROUND(SUM(CASE WHEN ${practiceHistory.isCorrect} = 1 THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1)`,
      })
      .from(practiceHistory)
      .where(eq(practiceHistory.userId, ctx.user.id));

    return {
      totalWords: words.length,
      distribution,
      dueWords,
      upcomingReviews,
      totalReviews: stats?.totalReviews || 0,
      averageAccuracy: stats?.averageAccuracy || 0,
    };
  }),

  /**
   * Backfill translations for words without translation data
   */
  backfillTranslations: protectedProcedure
    .mutation(async ({ ctx }) => {
      const { getDb } = await import("./db");
      const { wordbank } = await import("../drizzle/schema");
      const { eq, and, or, isNull } = await import("drizzle-orm");
      const { invokeLLM } = await import("./_core/llm");
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get all words without translation (empty or null)
      const wordsNeedingTranslation = await db
        .select()
        .from(wordbank)
        .where(
          and(
            eq(wordbank.userId, ctx.user.id),
            or(
              eq(wordbank.translation, ""),
              isNull(wordbank.translation)
            )
          )
        );

      console.log(`[backfillTranslations] Found ${wordsNeedingTranslation.length} words needing translation`);

      const results = {
        total: wordsNeedingTranslation.length,
        success: 0,
        failed: 0,
        errors: [] as string[],
      };

      // Process each word
      for (const word of wordsNeedingTranslation) {
        try {
          console.log(`[backfillTranslations] Processing word: ${word.word} (${word.targetLanguage})`);

          // Use LLM to generate translation data
          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content: `You are a language learning assistant. Generate translation data for vocabulary words.`,
              },
              {
                role: "user",
                content: `Generate translation data for this ${word.targetLanguage} word: "${word.word}"

Please provide:
1. English translation
2. Pinyin (only for Chinese words, otherwise leave empty)
3. Two example sentences using this word in ${word.targetLanguage}

Return in JSON format.`,
              },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "word_translation",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    translation: {
                      type: "string",
                      description: "English translation of the word",
                    },
                    pinyin: {
                      type: "string",
                      description: "Pinyin for Chinese words, empty string for other languages",
                    },
                    exampleSentences: {
                      type: "array",
                      description: "Two example sentences",
                      items: {
                        type: "string",
                      },
                    },
                  },
                  required: ["translation", "pinyin", "exampleSentences"],
                  additionalProperties: false,
                },
              },
            },
          });

          const content = response.choices[0]?.message?.content;
          if (!content) {
            throw new Error("No response from LLM");
          }

          const translationData = JSON.parse(typeof content === "string" ? content : "{}");
          console.log(`[backfillTranslations] Generated translation:`, translationData);

          // Update the word in database
          await db
            .update(wordbank)
            .set({
              translation: translationData.translation,
              pinyin: translationData.pinyin || null,
              exampleSentences: translationData.exampleSentences || [],
            })
            .where(eq(wordbank.id, word.id));

          results.success++;
          console.log(`[backfillTranslations] Successfully updated word: ${word.word}`);
        } catch (error) {
          results.failed++;
          const errorMsg = `Failed to process "${word.word}": ${error instanceof Error ? error.message : String(error)}`;
          results.errors.push(errorMsg);
          console.error(`[backfillTranslations] ${errorMsg}`);
        }
      }

      console.log(`[backfillTranslations] Completed: ${results.success} success, ${results.failed} failed`);
      return results;
    }),

  // Manual mastery update
  updateMastery: protectedProcedure
    .input(
      z.object({
        wordbankId: z.number(),
        action: z.enum(["need_practice", "mastered"]),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { getDb } = await import("./db");
      const { wordbank, wordMastery } = await import("../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Get the word from wordbank
      const [word] = await db
        .select()
        .from(wordbank)
        .where(
          and(
            eq(wordbank.id, input.wordbankId),
            eq(wordbank.userId, ctx.user.id)
          )
        );

      if (!word) {
        throw new Error("Word not found or unauthorized");
      }

      // Check if mastery record exists
      const [existingMastery] = await db
        .select()
        .from(wordMastery)
        .where(
          and(
            eq(wordMastery.userId, ctx.user.id),
            eq(wordMastery.word, word.word),
            eq(wordMastery.targetLanguage, word.targetLanguage)
          )
        );

      const now = new Date();

      if (input.action === "need_practice") {
        // Reset to learning state: interval=1 day, easinessFactor=1.3, repetitions=0
        const nextReview = new Date(now);
        nextReview.setDate(nextReview.getDate() + 1);

        if (existingMastery) {
          await db
            .update(wordMastery)
            .set({
              easinessFactor: 1300, // 1.3 * 1000
              interval: 1,
              repetitions: 0,
              nextReviewDate: nextReview,
              lastReviewedAt: now,
            })
            .where(eq(wordMastery.id, existingMastery.id));
        } else {
          await db.insert(wordMastery).values({
            userId: ctx.user.id,
            word: word.word,
            targetLanguage: word.targetLanguage,
            easinessFactor: 1300,
            interval: 1,
            repetitions: 0,
            nextReviewDate: nextReview,
            lastReviewedAt: now,
            correctCount: 0,
            incorrectCount: 0,
          });
        }
      } else if (input.action === "mastered") {
        // Mark as mastered: high easinessFactor=2.5, long interval=30 days, high repetitions
        const nextReview = new Date(now);
        nextReview.setDate(nextReview.getDate() + 30);

        if (existingMastery) {
          await db
            .update(wordMastery)
            .set({
              easinessFactor: 2500, // 2.5 * 1000
              interval: 30,
              repetitions: 10, // High repetition count indicates mastery
              nextReviewDate: nextReview,
              lastReviewedAt: now,
              correctCount: existingMastery.correctCount + 5, // Boost correct count
            })
            .where(eq(wordMastery.id, existingMastery.id));
        } else {
          await db.insert(wordMastery).values({
            userId: ctx.user.id,
            word: word.word,
            targetLanguage: word.targetLanguage,
            easinessFactor: 2500,
            interval: 30,
            repetitions: 10,
            nextReviewDate: nextReview,
            lastReviewedAt: now,
            correctCount: 5,
            incorrectCount: 0,
          });
        }
      }

      return { success: true };
    }),

  // Get smart mastery suggestions based on accuracy
  getMasterySuggestions: protectedProcedure.query(async ({ ctx }) => {
    const { getDb } = await import("./db");
    const { wordbank, wordMastery, dismissedSuggestions, userStats } = await import("../drizzle/schema");
    const { eq, and, sql, notInArray, isNull, or, gt } = await import("drizzle-orm");
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Check if suggestions are snoozed
    const [stats] = await db
      .select()
      .from(userStats)
      .where(eq(userStats.userId, ctx.user.id));

    if (stats?.masterySuggestionsSnoozeUntil) {
      const now = new Date();
      if (stats.masterySuggestionsSnoozeUntil > now) {
        // Suggestions are snoozed
        return [];
      }
    }

    // Get dismissed word IDs
    const dismissed = await db
      .select({ wordbankId: dismissedSuggestions.wordbankId })
      .from(dismissedSuggestions)
      .where(eq(dismissedSuggestions.userId, ctx.user.id));

    const dismissedIds = dismissed.map(d => d.wordbankId);

    // Get words with high accuracy (90%+) and sufficient reviews (5+)
    // Exclude words already mastered (easinessFactor >= 2.5, interval >= 30)
    // Exclude dismissed words
    const suggestions = await db
      .select({
        id: wordbank.id,
        word: wordbank.word,
        pinyin: wordbank.pinyin,
        translation: wordbank.translation,
        targetLanguage: wordbank.targetLanguage,
        correctCount: wordMastery.correctCount,
        incorrectCount: wordMastery.incorrectCount,
        totalReviews: sql<number>`${wordMastery.correctCount} + ${wordMastery.incorrectCount}`,
        accuracy: sql<number>`ROUND(${wordMastery.correctCount} * 100.0 / (${wordMastery.correctCount} + ${wordMastery.incorrectCount}), 1)`,
        easinessFactor: wordMastery.easinessFactor,
        interval: wordMastery.interval,
      })
      .from(wordbank)
      .innerJoin(
        wordMastery,
        and(
          eq(wordbank.userId, wordMastery.userId),
          eq(wordbank.word, wordMastery.word),
          eq(wordbank.targetLanguage, wordMastery.targetLanguage)
        )
      )
      .where(
        and(
          eq(wordbank.userId, ctx.user.id),
          // At least 5 total reviews
          sql`(${wordMastery.correctCount} + ${wordMastery.incorrectCount}) >= 5`,
          // At least 90% accuracy
          sql`${wordMastery.correctCount} * 100.0 / (${wordMastery.correctCount} + ${wordMastery.incorrectCount}) >= 90`,
          // Not already mastered (easinessFactor < 2.5 or interval < 30)
          sql`(${wordMastery.easinessFactor} < 2500 OR ${wordMastery.interval} < 30)`,
          // Not dismissed
          dismissedIds.length > 0 ? sql`${wordbank.id} NOT IN (${sql.join(dismissedIds.map(id => sql`${id}`), sql`, `)})` : sql`1=1`
        )
      )
      .orderBy(sql`${wordMastery.correctCount} * 100.0 / (${wordMastery.correctCount} + ${wordMastery.incorrectCount}) DESC`);

    return suggestions;
  }),

  // Dismiss a word suggestion
  dismissSuggestion: protectedProcedure
    .input(z.object({ wordbankId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const { getDb } = await import("./db");
      const { dismissedSuggestions } = await import("../drizzle/schema");
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Insert dismissed suggestion
      await db.insert(dismissedSuggestions).values({
        userId: ctx.user.id,
        wordbankId: input.wordbankId,
      });

      return { success: true };
    }),

  // Snooze mastery suggestions banner
  snoozeSuggestions: protectedProcedure
    .input(z.object({ days: z.number().min(1).max(30).default(7) }))
    .mutation(async ({ input, ctx }) => {
      const { getDb } = await import("./db");
      const { userStats } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Calculate snooze until date
      const snoozeUntil = new Date();
      snoozeUntil.setDate(snoozeUntil.getDate() + input.days);

      // Update or create user stats
      const [existing] = await db
        .select()
        .from(userStats)
        .where(eq(userStats.userId, ctx.user.id));

      if (existing) {
        await db
          .update(userStats)
          .set({ masterySuggestionsSnoozeUntil: snoozeUntil })
          .where(eq(userStats.userId, ctx.user.id));
      } else {
        await db.insert(userStats).values({
          userId: ctx.user.id,
          masterySuggestionsSnoozeUntil: snoozeUntil,
        });
      }

      return { success: true, snoozeUntil };
    }),

  // Clear all dismissed suggestions (for Settings)
  clearDismissedSuggestions: protectedProcedure.mutation(async ({ ctx }) => {
    const { getDb } = await import("./db");
    const { dismissedSuggestions } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    await db
      .delete(dismissedSuggestions)
      .where(eq(dismissedSuggestions.userId, ctx.user.id));

    return { success: true };
  }),

  // Review Mode - Generate quiz from due words
  generateReviewQuiz: protectedProcedure.query(async ({ ctx }) => {
    const { getDb } = await import("./db");
    const { wordbank, wordMastery } = await import("../drizzle/schema");
    const { eq, and, lte, sql } = await import("drizzle-orm");
    const { invokeLLM } = await import("./_core/llm");
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Get words due for review
    const now = new Date();
    const dueWords = await db
      .select({
        id: wordbank.id,
        word: wordbank.word,
        pinyin: wordbank.pinyin,
        translation: wordbank.translation,
        targetLanguage: wordbank.targetLanguage,
        exampleSentences: wordbank.exampleSentences,
        audioUrl: wordbank.audioUrl,
        userId: wordbank.userId,
        createdAt: wordbank.createdAt,
        nextReviewDate: wordMastery.nextReviewDate,
        easinessFactor: wordMastery.easinessFactor,
        interval: wordMastery.interval,
        repetitions: wordMastery.repetitions,
        correctCount: wordMastery.correctCount,
        incorrectCount: wordMastery.incorrectCount,
      })
      .from(wordbank)
      .innerJoin(
        wordMastery,
        and(
          eq(wordbank.userId, wordMastery.userId),
          eq(wordbank.word, wordMastery.word),
          eq(wordbank.targetLanguage, wordMastery.targetLanguage)
        )
      )
       .where(
        and(
          eq(wordbank.userId, ctx.user.id),
          lte(wordMastery.nextReviewDate, now),
          // Exclude mastered words (easinessFactor >= 2500 AND interval >= 30)
          sql`NOT (${wordMastery.easinessFactor} >= 2500 AND ${wordMastery.interval} >= 30)`
        )
      ); // per review session

    if (dueWords.length === 0) {
      // Get next review date
      const nextReview = await db
        .select({
          nextReviewDate: sql<Date>`MIN(${wordMastery.nextReviewDate})`,
        })
        .from(wordMastery)
        .where(eq(wordMastery.userId, ctx.user.id));

      return {
        questions: [],
        totalDue: 0,
        nextReviewDate: nextReview[0]?.nextReviewDate || null,
      };
    }

    // Get target language from first word (all should be same language in a session)
    const targetLanguage = dueWords[0].targetLanguage;
    const translationLanguage = normalizeLearningLanguage(
      ctx.user.preferredTranslationLanguage ||
      ctx.user.preferredLanguage ||
      "English",
    );

    // Generate quiz questions using AI
    const wordList = dueWords.map(w => w.word).join(", ");
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `You are a language learning quiz generator. Generate multiple-choice questions to test vocabulary comprehension in ${targetLanguage}. Questions, answer options, and explanations must be written in ${translationLanguage}.`,
        },
        {
          role: "user",
          content: `Generate ${dueWords.length} multiple-choice questions based on these vocabulary words: ${wordList}. Each question should test understanding of word meaning, usage, or context. Translate meanings into ${translationLanguage}; do not default to English unless ${translationLanguage} is English. Return JSON with this structure:
{
  "questions": [
    {
      "word": "vocabulary word",
      "question": "What does [word] mean?",
      "options": ["option1", "option2", "option3", "option4"],
      "correctIndex": 0,
      "explanation": "Brief explanation"
    }
  ]
}`,
        },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "review_quiz",
          strict: true,
          schema: {
            type: "object",
            properties: {
              questions: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    word: { type: "string" },
                    question: { type: "string" },
                    options: {
                      type: "array",
                      items: { type: "string" },
                    },
                    correctIndex: { type: "number" },
                    explanation: { type: "string" },
                  },
                  required: ["word", "question", "options", "correctIndex", "explanation"],
                  additionalProperties: false,
                },
              },
            },
            required: ["questions"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0].message.content;
    const quizData = JSON.parse(typeof content === "string" ? content : "{}");

    // Map wordbankId to each question
    // Note: LLM may include pinyin in word field, so we need to extract just the word
    const questionsWithIds = (quizData.questions || []).map((q: any) => {
      // Extract the actual word (before any parentheses or spaces)
      const actualWord = q.word.split(/[\s(]/)[0];
      const matchingWord = dueWords.find(w => w.word === actualWord);
      return {
        ...q,
        wordbankId: matchingWord?.id || 0,
      };
    });

    return {
      questions: questionsWithIds,
      totalDue: dueWords.length,
      targetLanguage,
      nextReviewDate: null,
    };
  }),

  translateWord: protectedProcedure
    .input(
      z.object({
        word: z.string(),
        targetLanguage: z.string().default("en"),
        timezone: z.string().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      console.log("[translateWord] Input:", input);

      if (isFreeLimitedUser(ctx.user)) {
        const dailyWindow = getDailyWindow(input.timezone || ctx.user.timezone || null);
        const claim = await claimDailyLookup(ctx.user.id, dailyWindow);

        if (!claim.allowed) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: `You've used all ${claim.limit} dictionary lookups for today. Upgrade to Premium for unlimited lookups.`,
          });
        }
      }
      
      try {
        const { invokeLLM } = await import("./_core/llm");
        const { getWordFrequency, getHSKLabel, getFrequencyLabel } = await import("./hskLevels");

        // Detect if the word is Chinese to request pinyin
        const isChinese = /[\u4e00-\u9fa5]/.test(input.word);
        
        const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a language translation assistant. Translate the given word to the target language, provide a brief definition${isChinese ? ", pinyin romanization with tones" : ""}, create 2-3 example sentences showing how the word is used in context, and translate those example sentences to the target language.`,
          },
          {
            role: "user",
            content: `Translate the word "${input.word}" to ${input.targetLanguage}. Provide the translation, a brief definition${isChinese ? ", pinyin with tones (e.g., 'shè' for 设)" : ""}, 2-3 example sentences in the original language demonstrating proper usage, and translate each example sentence to ${input.targetLanguage}.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "word_translation",
            strict: true,
            schema: {
              type: "object",
              properties: {
                word: { type: "string", description: "The original word" },
                translation: { type: "string", description: "Translation in target language" },
                definition: { type: "string", description: "Brief definition" },
                sourceLanguage: { type: "string", description: "Detected source language code" },
                ...(isChinese ? {
                  pinyin: { type: "string", description: "Pinyin romanization with tones for Chinese words" }
                } : {}),
                exampleSentences: {
                  type: "array",
                  description: "2-3 example sentences in the original language",
                  items: { type: "string" },
                },
                translatedSentences: {
                  type: "array",
                  description: "Translations of the example sentences in the target language",
                  items: { type: "string" },
                },
              },
              required: ["word", "translation", "definition", "sourceLanguage", ...(isChinese ? ["pinyin"] : []), "exampleSentences", "translatedSentences"],
              additionalProperties: false,
            },
          },
        },
      });

        console.log("[translateWord] LLM Response:", JSON.stringify(response, null, 2));
        
        if (!response || !response.choices || response.choices.length === 0) {
          throw new Error("Invalid LLM response: no choices returned");
        }
        
        const content = response.choices[0].message.content;
        console.log("[translateWord] Content:", content);
        
        if (!content) {
          throw new Error("Invalid LLM response: no content in message");
        }
        
        const result = JSON.parse(typeof content === "string" ? content : "{}");
        
        // Add HSK level and frequency information ONLY for Chinese words
        let enrichedResult = { ...result };
        if (isChinese) {
          const wordFreq = getWordFrequency(input.word);
          enrichedResult = {
            ...result,
            hskLevel: wordFreq.hskLevel,
            hskLabel: getHSKLabel(wordFreq.hskLevel),
            frequency: wordFreq.frequency,
            frequencyLabel: getFrequencyLabel(wordFreq.frequency),
          };
        }
        
        console.log("[translateWord] Success:", enrichedResult);
        return enrichedResult;
      } catch (error) {
        console.error("[translateWord] Error:", error);
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to translate word",
          cause: error,
        });
      }
    }),

  generateWordAudio: protectedProcedure
    .input(
      z.object({
        word: z.string(),
        targetLanguage: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { generateWordAudio } = await import("./audioGeneration");
      const audioUrl = await generateWordAudio(input.word, input.targetLanguage);
      return { audioUrl };
    }),

  generateChineseToneAudio: protectedProcedure
    .input(
      z.object({
        character: z.string(),
        tone: z.number().min(1).max(4),
        pinyin: z.string(),
      })
    )
    .mutation(async ({ input }) => {
      const { generateChineseToneAudioGoogleCloud } = await import("./googleCloudTTS");
      const audioUrl = await generateChineseToneAudioGoogleCloud(
        input.character,
        input.pinyin
      );
      return { audioUrl };
    }),

  // Spaced Repetition System (SRS) procedures
  getDueWordsForReview: protectedProcedure
    .query(async ({ ctx }) => {
      const { getDb } = await import("./db");
      const { wordMastery, wordbank } = await import("../drizzle/schema");
      const { eq, and, lte } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const now = new Date();
      
      // Get due words from wordMastery and join with wordbank for additional fields
      const dueWords = await db
        .select({
          id: wordMastery.id,
          word: wordMastery.word,
          targetLanguage: wordMastery.targetLanguage,
          nextReviewDate: wordMastery.nextReviewDate,
          translation: wordbank.translation,
          audioUrl: wordbank.audioUrl,
          exampleSentences: wordbank.exampleSentences,
        })
        .from(wordMastery)
        .leftJoin(
          wordbank,
          and(
            eq(wordMastery.userId, wordbank.userId),
            eq(wordMastery.word, wordbank.word),
            eq(wordMastery.targetLanguage, wordbank.targetLanguage)
          )
        )
        .where(eq(wordMastery.userId, ctx.user.id))
        .orderBy(wordMastery.nextReviewDate);
      
      const filtered = dueWords.filter(word => {
        if (!word.nextReviewDate) return true;
        return new Date(word.nextReviewDate) <= now;
      });
      
      return filtered;
    }),

  submitReview: protectedProcedure
    .input(
      z.object({
        wordId: z.number(),
        correct: z.boolean(),
        timeToAnswer: z.number().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { getDb } = await import("./db");
      const { wordMastery } = await import("../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const { calculateSM2, answerToQuality } = await import("./spacedRepetition");
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      
      const [word] = await db
        .select({
          id: wordMastery.id,
          userId: wordMastery.userId,
          word: wordMastery.word,
          targetLanguage: wordMastery.targetLanguage,
          easeFactor: wordMastery.easinessFactor,
          interval: wordMastery.interval,
          repetitions: wordMastery.repetitions,
          nextReviewDate: wordMastery.nextReviewDate,
          correctCount: wordMastery.correctCount,
          incorrectCount: wordMastery.incorrectCount,
        })
        .from(wordMastery)
        .where(
          and(
            eq(wordMastery.id, input.wordId),
            eq(wordMastery.userId, ctx.user.id)
          )
        )
        .limit(1);
      
      if (!word) {
        throw new Error("Word not found");
      }
      
      const quality = answerToQuality(input.correct, input.timeToAnswer);
      
      const srsResult = calculateSM2(quality, {
        easinessFactor: word.easeFactor || 2500,
        interval: word.interval || 1,
        repetitions: word.repetitions || 0,
        nextReviewDate: word.nextReviewDate || new Date(),
      });
      
      await db
        .update(wordMastery)
        .set({
          easinessFactor: srsResult.easinessFactor,
          interval: srsResult.interval,
          repetitions: srsResult.repetitions,
          nextReviewDate: srsResult.nextReviewDate,
          correctCount: input.correct ? (word.correctCount + 1) : word.correctCount,
          incorrectCount: !input.correct ? (word.incorrectCount + 1) : word.incorrectCount,
          lastReviewedAt: new Date(),
        })
        .where(eq(wordMastery.id, input.wordId));
      
      return {
        success: true,
        nextReviewDate: srsResult.nextReviewDate,
        interval: srsResult.interval,
      };
    }),

  getReviewStats: protectedProcedure
    .query(async ({ ctx }) => {
      const { getDb } = await import("./db");
      const { wordbank } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const now = new Date();
      
      const allWords = await db
        .select()
        .from(wordbank)
        .where(eq(wordbank.userId, ctx.user.id));
      
      const dueCount = allWords.filter(word => {
        if (!word.nextReviewDate) return true;
        return new Date(word.nextReviewDate) <= now;
      }).length;
      
      const learningCount = allWords.filter(w => w.masteryLevel === "learning").length;
      const familiarCount = allWords.filter(w => w.masteryLevel === "familiar").length;
      const masteredCount = allWords.filter(w => w.masteryLevel === "mastered").length;
      
      return {
        total: allWords.length,
        dueToday: dueCount,
        learning: learningCount,
        familiar: familiarCount,
        mastered: masteredCount,
      };
    }),

  exportToCSV: protectedProcedure
    .input(
      z.object({
        targetLanguage: z.string().optional(),
        masteryLevel: z.enum(["learning", "familiar", "mastered"]).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      const { wordbank } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, and } = await import("drizzle-orm");

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Build query conditions
      const conditions = [eq(wordbank.userId, ctx.user.id)];
      const targetLanguage = input.targetLanguage
        ? normalizeWordbankTargetLanguage(input.targetLanguage)
        : undefined;
      if (targetLanguage) {
        conditions.push(eq(wordbank.targetLanguage, targetLanguage));
      }
      if (input.masteryLevel) {
        conditions.push(eq(wordbank.masteryLevel, input.masteryLevel));
      }

      const words = await db
        .select()
        .from(wordbank)
        .where(and(...conditions))
        .orderBy(wordbank.createdAt);

      // Generate CSV content
      const headers = [
        "Word",
        "Translation",
        "Pinyin/Pronunciation",
        "Example Sentence",
        "Target Language",
        "Mastery Level",
        "Times Reviewed",
        "Created Date",
      ];

      const rows = words.map((word) => [
        word.word,
        word.translation || "",
        word.pinyin || "",
        word.exampleSentences ? word.exampleSentences[0] || "" : "",
        word.targetLanguage,
        word.masteryLevel,
        word.repetitions.toString(),
        new Date(word.createdAt).toLocaleDateString(),
      ]);

      // Escape CSV fields
      const escapeCSV = (field: string) => {
        if (field.includes(",") || field.includes('"') || field.includes("\n")) {
          return `"${field.replace(/"/g, '""')}"`;
        }
        return field;
      };

      const csvContent = [
        headers.map(escapeCSV).join(","),
        ...rows.map((row) => row.map(escapeCSV).join(",")),
      ].join("\n");

      return {
        csv: csvContent,
        filename: `wordbank_${targetLanguage || "all"}_${new Date().toISOString().split("T")[0]}.csv`,
      };
    }),

  exportToPDF: protectedProcedure
    .input(
      z.object({
        targetLanguage: z.string().optional(),
        masteryLevel: z.enum(["learning", "familiar", "mastered"]).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { wordbank } = await import("../drizzle/schema");
      const { getDb } = await import("./db");
      const { eq, and } = await import("drizzle-orm");
      const { jsPDF } = await import("jspdf");
      const autoTable = (await import("jspdf-autotable")).default;

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Build query conditions
      const conditions = [eq(wordbank.userId, ctx.user.id)];
      const targetLanguage = input.targetLanguage
        ? normalizeWordbankTargetLanguage(input.targetLanguage)
        : undefined;
      if (targetLanguage) {
        conditions.push(eq(wordbank.targetLanguage, targetLanguage));
      }
      if (input.masteryLevel) {
        conditions.push(eq(wordbank.masteryLevel, input.masteryLevel));
      }

      const words = await db
        .select()
        .from(wordbank)
        .where(and(...conditions))
        .orderBy(wordbank.createdAt);

      // Create PDF
      const doc = new jsPDF();

      // Add title
      doc.setFontSize(18);
      doc.text("My Vocabulary Wordbank", 14, 20);

      // Add subtitle with filters
      doc.setFontSize(11);
      const filters = [];
      if (targetLanguage) filters.push(`Language: ${targetLanguage}`);
      if (input.masteryLevel) filters.push(`Level: ${input.masteryLevel}`);
      if (filters.length > 0) {
        doc.text(filters.join(" | "), 14, 28);
      }
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, filters.length > 0 ? 34 : 28);

      // Add table
      const tableData = words.map((word) => [
        word.word,
        word.translation || "-",
        word.pinyin || "-",
        word.masteryLevel,
        word.repetitions.toString(),
      ]);

      autoTable(doc, {
        startY: filters.length > 0 ? 40 : 34,
        head: [["Word", "Translation", "Pinyin", "Level", "Reviews"]],
        body: tableData,
        theme: "striped",
        headStyles: { fillColor: [147, 51, 234] }, // Purple
        styles: { fontSize: 9 },
        columnStyles: {
          0: { cellWidth: 30 },
          1: { cellWidth: 35 },
          2: { cellWidth: 70 },
          3: { cellWidth: 25 },
          4: { cellWidth: 20 },
        },
      });

      // Convert to base64
      const pdfBase64 = doc.output("datauristring").split(",")[1];

      return {
        pdf: pdfBase64,
        filename: `wordbank_${targetLanguage || "all"}_${new Date().toISOString().split("T")[0]}.pdf`,
      };
    }),
});
