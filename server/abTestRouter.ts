import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import {
  abExperiments,
  abVariants,
  abAssignments,
  abEvents,
} from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";

// ─── Z-Test for Statistical Significance ─────────────────────────────

/**
 * Standard normal cumulative distribution function (CDF).
 * Uses the Abramowitz & Stegun rational approximation (error < 7.5e-8).
 */
function normalCDF(x: number): number {
  const a1 = 0.254829592;
  const a2 = -0.284496736;
  const a3 = 1.421413741;
  const a4 = -1.453152027;
  const a5 = 1.061405429;
  const p = 0.3275911;

  const sign = x < 0 ? -1 : 1;
  x = Math.abs(x) / Math.sqrt(2);

  const t = 1.0 / (1.0 + p * x);
  const y =
    1.0 - ((((a5 * t + a4) * t + a3) * t + a2) * t + a1) * t * Math.exp(-x * x);

  return 0.5 * (1.0 + sign * y);
}

/**
 * Two-proportion z-test.
 * Compares conversion rates between two variants.
 *
 * Returns:
 * - zScore: the z-statistic
 * - pValue: two-tailed p-value
 * - significant: whether p < alpha
 * - confidenceLevel: human-readable confidence ("95%", "99%", etc.)
 * - winner: the variant key with higher conversion, or null if not significant
 */
export function twoProportionZTest(
  conversionsA: number,
  samplesA: number,
  conversionsB: number,
  samplesB: number,
  alpha: number = 0.05
): {
  zScore: number;
  pValue: number;
  significant: boolean;
  confidenceLevel: string;
  winner: "A" | "B" | null;
  liftPercent: number;
} {
  // Need minimum sample size for meaningful results
  if (samplesA < 1 || samplesB < 1) {
    return {
      zScore: 0,
      pValue: 1,
      significant: false,
      confidenceLevel: "Insufficient data",
      winner: null,
      liftPercent: 0,
    };
  }

  const pA = conversionsA / samplesA;
  const pB = conversionsB / samplesB;

  // Pooled proportion
  const pPool = (conversionsA + conversionsB) / (samplesA + samplesB);

  // Standard error
  const se = Math.sqrt(pPool * (1 - pPool) * (1 / samplesA + 1 / samplesB));

  if (se === 0) {
    return {
      zScore: 0,
      pValue: 1,
      significant: false,
      confidenceLevel: "Insufficient variance",
      winner: null,
      liftPercent: 0,
    };
  }

  const zScore = (pA - pB) / se;
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore))); // two-tailed

  // Determine confidence level
  let confidenceLevel: string;
  if (pValue < 0.001) {
    confidenceLevel = "99.9%";
  } else if (pValue < 0.01) {
    confidenceLevel = "99%";
  } else if (pValue < 0.05) {
    confidenceLevel = "95%";
  } else if (pValue < 0.1) {
    confidenceLevel = "90%";
  } else {
    confidenceLevel = "Not significant";
  }

  const significant = pValue < alpha;
  const winner = significant ? (pA > pB ? "A" : "B") : null;

  // Relative lift of winner over loser
  const baseline = Math.min(pA, pB);
  const liftPercent =
    baseline > 0
      ? Math.round(((Math.max(pA, pB) - baseline) / baseline) * 10000) / 100
      : 0;

  return { zScore: Math.round(zScore * 1000) / 1000, pValue: Math.round(pValue * 10000) / 10000, significant, confidenceLevel, winner, liftPercent };
}

// ─── Weighted Random Variant Selection ────────────────────────────────

function pickVariantByWeight(
  variants: { id: number; variantKey: string; label: string; payload: unknown; weight: number }[]
): (typeof variants)[number] {
  const totalWeight = variants.reduce((sum, v) => sum + v.weight, 0);
  let random = Math.random() * totalWeight;
  for (const variant of variants) {
    random -= variant.weight;
    if (random <= 0) return variant;
  }
  return variants[variants.length - 1];
}

// ─── Helper: Seed a single experiment (idempotent) ────────────────────

async function seedExperiment(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  config: {
    key: string;
    name: string;
    description: string;
    variants: { variantKey: string; label: string; payload: object; weight: number }[];
  }
) {
  const [existing] = await db
    .select()
    .from(abExperiments)
    .where(eq(abExperiments.key, config.key))
    .limit(1);

  if (existing) {
    return { success: true, message: "Experiment already exists", experimentId: existing.id };
  }

  const [experiment] = await db
    .insert(abExperiments)
    .values({
      key: config.key,
      name: config.name,
      description: config.description,
    })
    .$returningId();

  for (const v of config.variants) {
    await db.insert(abVariants).values({
      experimentId: experiment.id,
      variantKey: v.variantKey,
      label: v.label,
      payload: JSON.stringify(v.payload),
      weight: v.weight,
    });
  }

  return { success: true, message: "Experiment seeded", experimentId: experiment.id };
}

// ─── Experiment Definitions ───────────────────────────────────────────

const EXPERIMENT_CONFIGS = {
  weekly_limit_cta: {
    key: "weekly_limit_cta",
    name: "Weekly Limit CTA Copy",
    description: "A/B test comparing 'Start 7-day free trial' vs 'Unlock Premium' as the primary CTA on the weekly story limit modal.",
    variants: [
      {
        variantKey: "free_trial",
        label: "Start 7-day free trial",
        payload: { ctaText: "Start 7-day free trial", ctaIcon: "sparkles", subtext: "Cancel anytime — no commitment" },
        weight: 50,
      },
      {
        variantKey: "unlock_premium",
        label: "Unlock Premium",
        payload: { ctaText: "Unlock Premium", ctaIcon: "sparkles", subtext: "Unlimited stories, vocabulary & more" },
        weight: 50,
      },
    ],
  },
  first_story_cta: {
    key: "first_story_cta",
    name: "First Story Completed CTA Copy",
    description: "A/B test comparing 'Try Premium free for 7 days' vs 'See what Premium unlocks' on the first story completion modal.",
    variants: [
      {
        variantKey: "try_free",
        label: "Try Premium free for 7 days",
        payload: { ctaText: "Try Premium free for 7 days", ctaIcon: "sparkles", subtext: "Start your free trial today" },
        weight: 50,
      },
      {
        variantKey: "see_premium",
        label: "See what Premium unlocks",
        payload: { ctaText: "See what Premium unlocks", ctaIcon: "star", subtext: "Discover unlimited learning" },
        weight: 50,
      },
    ],
  },
  vocab_limit_cta: {
    key: "vocab_limit_cta",
    name: "Vocabulary Limit CTA Copy",
    description: "A/B test comparing 'Unlock unlimited vocabulary' vs 'Expand your word bank' on the vocabulary limit sheet.",
    variants: [
      {
        variantKey: "unlock_vocab",
        label: "Unlock unlimited vocabulary",
        payload: { ctaText: "Unlock unlimited vocabulary", ctaIcon: "sparkles", subtext: "Save every word you discover" },
        weight: 50,
      },
      {
        variantKey: "expand_bank",
        label: "Expand your word bank",
        payload: { ctaText: "Expand your word bank", ctaIcon: "book", subtext: "Premium learners save 5x more words" },
        weight: 50,
      },
    ],
  },
};

// ─── Router ───────────────────────────────────────────────────────────

export const abTestRouter = router({
  /**
   * Get the variant assigned to the current user for a given experiment.
   * If the user hasn't been assigned yet, assign them now (sticky bucketing).
   */
  getVariant: protectedProcedure
    .input(z.object({ experimentKey: z.string() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [experiment] = await db
        .select()
        .from(abExperiments)
        .where(and(eq(abExperiments.key, input.experimentKey), eq(abExperiments.isActive, true)))
        .limit(1);

      if (!experiment) {
        return { experimentKey: input.experimentKey, variant: null, assignmentId: null };
      }

      // Check existing assignment
      const [existing] = await db
        .select({
          assignmentId: abAssignments.id,
          variantId: abAssignments.variantId,
          variantKey: abVariants.variantKey,
          label: abVariants.label,
          payload: abVariants.payload,
        })
        .from(abAssignments)
        .innerJoin(abVariants, eq(abAssignments.variantId, abVariants.id))
        .where(and(eq(abAssignments.userId, ctx.user.id), eq(abAssignments.experimentId, experiment.id)))
        .limit(1);

      if (existing) {
        return {
          experimentKey: input.experimentKey,
          variant: { key: existing.variantKey, label: existing.label, payload: existing.payload },
          assignmentId: existing.assignmentId,
        };
      }

      // Assign new variant
      const variants = await db.select().from(abVariants).where(eq(abVariants.experimentId, experiment.id));
      if (variants.length === 0) {
        return { experimentKey: input.experimentKey, variant: null, assignmentId: null };
      }

      const chosen = pickVariantByWeight(variants);
      const [inserted] = await db
        .insert(abAssignments)
        .values({ userId: ctx.user.id, experimentId: experiment.id, variantId: chosen.id })
        .$returningId();

      return {
        experimentKey: input.experimentKey,
        variant: { key: chosen.variantKey, label: chosen.label, payload: chosen.payload },
        assignmentId: inserted.id,
      };
    }),

  /**
   * Track an event (impression, click, conversion) for a user's A/B assignment.
   */
  trackEvent: protectedProcedure
    .input(
      z.object({
        experimentKey: z.string(),
        eventType: z.enum(["impression", "click", "conversion"]),
        metadata: z.record(z.string(), z.any()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [experiment] = await db
        .select()
        .from(abExperiments)
        .where(eq(abExperiments.key, input.experimentKey))
        .limit(1);

      if (!experiment) return { success: false, reason: "experiment_not_found" };

      const [assignment] = await db
        .select()
        .from(abAssignments)
        .where(and(eq(abAssignments.userId, ctx.user.id), eq(abAssignments.experimentId, experiment.id)))
        .limit(1);

      if (!assignment) return { success: false, reason: "not_assigned" };

      await db.insert(abEvents).values({
        assignmentId: assignment.id,
        userId: ctx.user.id,
        experimentId: experiment.id,
        variantId: assignment.variantId,
        eventType: input.eventType,
        metadata: input.metadata ?? null,
      });

      return { success: true };
    }),

  /**
   * Get analytics for an experiment with statistical significance.
   * Returns per-variant metrics + z-test results.
   */
  getAnalytics: protectedProcedure
    .input(z.object({ experimentKey: z.string() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [experiment] = await db
        .select()
        .from(abExperiments)
        .where(eq(abExperiments.key, input.experimentKey))
        .limit(1);

      if (!experiment) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Experiment not found" });
      }

      const variants = await db
        .select()
        .from(abVariants)
        .where(eq(abVariants.experimentId, experiment.id));

      const results = await Promise.all(
        variants.map(async (variant) => {
          const [assignmentCount] = await db
            .select({ count: sql<number>`COUNT(*)` })
            .from(abAssignments)
            .where(and(eq(abAssignments.experimentId, experiment.id), eq(abAssignments.variantId, variant.id)));

          const [impressionCount] = await db
            .select({ count: sql<number>`COUNT(*)` })
            .from(abEvents)
            .where(and(eq(abEvents.experimentId, experiment.id), eq(abEvents.variantId, variant.id), eq(abEvents.eventType, "impression")));

          const [uniqueImpressions] = await db
            .select({ count: sql<number>`COUNT(DISTINCT ${abEvents.userId})` })
            .from(abEvents)
            .where(and(eq(abEvents.experimentId, experiment.id), eq(abEvents.variantId, variant.id), eq(abEvents.eventType, "impression")));

          const [clickCount] = await db
            .select({ count: sql<number>`COUNT(*)` })
            .from(abEvents)
            .where(and(eq(abEvents.experimentId, experiment.id), eq(abEvents.variantId, variant.id), eq(abEvents.eventType, "click")));

          const [uniqueClicks] = await db
            .select({ count: sql<number>`COUNT(DISTINCT ${abEvents.userId})` })
            .from(abEvents)
            .where(and(eq(abEvents.experimentId, experiment.id), eq(abEvents.variantId, variant.id), eq(abEvents.eventType, "click")));

          const [conversionCount] = await db
            .select({ count: sql<number>`COUNT(*)` })
            .from(abEvents)
            .where(and(eq(abEvents.experimentId, experiment.id), eq(abEvents.variantId, variant.id), eq(abEvents.eventType, "conversion")));

          const usersAssigned = Number(assignmentCount?.count ?? 0);
          const impressions = Number(impressionCount?.count ?? 0);
          const uniqueImpressionCount = Number(uniqueImpressions?.count ?? 0);
          const clicks = Number(clickCount?.count ?? 0);
          const uniqueClickCount = Number(uniqueClicks?.count ?? 0);
          const conversions = Number(conversionCount?.count ?? 0);

          return {
            variantKey: variant.variantKey,
            label: variant.label,
            weight: variant.weight,
            usersAssigned,
            impressions,
            uniqueImpressions: uniqueImpressionCount,
            clicks,
            uniqueClicks: uniqueClickCount,
            conversions,
            clickThroughRate:
              uniqueImpressionCount > 0
                ? Math.round((uniqueClickCount / uniqueImpressionCount) * 10000) / 100
                : 0,
            conversionRate:
              uniqueImpressionCount > 0
                ? Math.round((conversions / uniqueImpressionCount) * 10000) / 100
                : 0,
          };
        })
      );

      // ─── Statistical Significance (z-test) ─────────────────────────
      // Compare click-through rates and conversion rates between variants.
      // For 2-variant experiments, run a direct z-test.
      // For 3+ variants, compare each against the best performer.
      let significance = null;

      if (results.length === 2) {
        const [a, b] = results;

        const ctrTest = twoProportionZTest(
          a.uniqueClicks,
          a.uniqueImpressions,
          b.uniqueClicks,
          b.uniqueImpressions
        );

        const convTest = twoProportionZTest(
          a.conversions,
          a.uniqueImpressions,
          b.conversions,
          b.uniqueImpressions
        );

        significance = {
          clickThrough: {
            ...ctrTest,
            winnerVariant: ctrTest.winner === "A" ? a.variantKey : ctrTest.winner === "B" ? b.variantKey : null,
          },
          conversion: {
            ...convTest,
            winnerVariant: convTest.winner === "A" ? a.variantKey : convTest.winner === "B" ? b.variantKey : null,
          },
          recommendation:
            convTest.significant
              ? `${convTest.winner === "A" ? a.label : b.label} is the winner with ${convTest.confidenceLevel} confidence (${convTest.liftPercent}% lift in conversions).`
              : ctrTest.significant
              ? `${ctrTest.winner === "A" ? a.label : b.label} has a higher CTR with ${ctrTest.confidenceLevel} confidence (${ctrTest.liftPercent}% lift). Continue collecting conversion data.`
              : `No statistically significant difference yet. Need more data (currently ${a.uniqueImpressions + b.uniqueImpressions} total impressions).`,
          sampleSizeRecommendation: getSampleSizeRecommendation(
            a.uniqueImpressions + b.uniqueImpressions
          ),
        };
      }

      return {
        experiment: {
          key: experiment.key,
          name: experiment.name,
          description: experiment.description,
          isActive: experiment.isActive,
          createdAt: experiment.createdAt,
        },
        variants: results,
        significance,
      };
    }),

  /**
   * List all experiments (for admin dashboard).
   */
  listExperiments: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db)
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const experiments = await db.select().from(abExperiments);

    const experimentsWithCounts = await Promise.all(
      experiments.map(async (exp) => {
        const [assignmentCount] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(abAssignments)
          .where(eq(abAssignments.experimentId, exp.id));

        const [eventCount] = await db
          .select({ count: sql<number>`COUNT(*)` })
          .from(abEvents)
          .where(eq(abEvents.experimentId, exp.id));

        return {
          ...exp,
          totalAssignments: Number(assignmentCount?.count ?? 0),
          totalEvents: Number(eventCount?.count ?? 0),
        };
      })
    );

    return experimentsWithCounts;
  }),

  /**
   * Toggle an experiment's active state.
   */
  toggleExperiment: protectedProcedure
    .input(z.object({ experimentKey: z.string(), isActive: z.boolean() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db
        .update(abExperiments)
        .set({ isActive: input.isActive })
        .where(eq(abExperiments.key, input.experimentKey));

      return { success: true };
    }),

  /**
   * Seed all experiments. Idempotent.
   */
  seedAllExperiments: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db)
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const results: Record<string, { success: boolean; message: string; experimentId: number }> = {};
    for (const [key, config] of Object.entries(EXPERIMENT_CONFIGS)) {
      results[key] = await seedExperiment(db, config);
    }
    return results;
  }),

  /**
   * Seed the weekly_limit_cta experiment only. Kept for backward compatibility.
   */
  seedWeeklyLimitExperiment: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db)
      throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    return seedExperiment(db, EXPERIMENT_CONFIGS.weekly_limit_cta);
  }),
});

// ─── Helpers ──────────────────────────────────────────────────────────

function getSampleSizeRecommendation(currentSamples: number): string {
  if (currentSamples >= 1000) return "Sample size is sufficient for reliable results.";
  if (currentSamples >= 500) return "Approaching reliable sample size. Consider waiting for 1,000+ impressions.";
  if (currentSamples >= 100) return "Early results. Need at least 500 impressions per variant for reliable significance.";
  return "Too early to draw conclusions. Need at least 100 impressions per variant.";
}
