import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { randomBytes } from "crypto";
import { COOKIE_NAME } from "@shared/const";
import { resolveFilmNarrationSettings } from "@shared/filmDefaults";
import { normalizeLearningLanguage } from "@shared/languagePreferences";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { calculateDifficultyLevel } from "./difficultyLevel";
import { backfillDifficultyLevels } from "./backfillDifficulty";
import {
  createVocabularyList,
  getVocabularyListsByUserId,
  createGeneratedContent,
  updateGeneratedContent,
  getGeneratedContentByUserId,
  getGeneratedContentById,
  incrementPlayCount,
  upsertLearningProgress,
  getLearningProgressByUserId,
  addFavorite,
  removeFavorite,
  getFavoritesByUserId,
  getDb,
} from "./db";
import {
  organizations,
  classes,
  classMembers,
  assignments,
  assignmentSubmissions,
  collections,
  collectionItems,
  organizationAdmins,
  users,
} from "../drizzle/schema";
import { eq, and, inArray, sql } from "drizzle-orm";
import {
  organizationRouter,
  classRouter,
  assignmentRouter,
  enrollmentRouter,
  analyticsRouter,
} from "./b2bRouters";
import { gamificationRouter } from "./gamificationRouters";
import { wordbankRouter } from "./wordbankRouters";
import { audioRouter } from "./audioRouters";
import { practiceRouter } from "./practiceRouters";
import { storyProgressRouter } from "./progressRouters";
import { collectionsRouter } from "./collectionsRouters";
import { collectionAnalyticsRouter } from "./collectionAnalyticsRouter";
import { leaderboardRouter } from "./leaderboardRouter";
import { featuredRouter } from "./featuredRouter";
import { discoveryRouter } from "./discoveryRouter";
import { followRouter } from "./followRouter";
import { retryRouter } from "./retryRouter";
import { levelTestRouter } from "./levelTestRouter";
import { documentRouter } from "./documentRouter";
import { recentlyViewedRouter } from "./recentlyViewedRouter";
import { tonePracticeRouter } from "./tonePracticeRouters";
import { watchHistoryRouter } from "./watchHistoryRouter";
import { tutorialRouter } from "./tutorialRouter";
import { exportRouter } from "./exportRouter";
import { downloadRouter } from "./downloadRouter";
import { breadcrumbRouter } from "./breadcrumbRouter";
import { vocabCollectionsRouter } from "./vocabCollectionsRouter";
import { checkoutRouter } from "./stripe/checkoutRouter";
import { subscriptionRouter } from "./subscriptionRouter";
import { adminAnalyticsRouter } from "./adminAnalyticsRouter";
import { badgeRouter } from "./badgeRouter";
import { digestRouter } from "./digestRouters";
import { categoryRouter } from "./categoryRouter";
import { weeklyGoalRouter } from "./weeklyGoalRouter";
import { cookieRouter } from "./cookieRouter";
import { contactRouter } from "./contactRouter";
import { referralRouter } from "./referralRouter";
import { referralAnalyticsRouter } from "./referralAnalytics";
import { tieredReferralRewardsRouter } from "./tieredReferralRewards";
import { adminReferralRouter } from "./adminReferralRouter";
import { affiliateRouter } from "./affiliateRouter";
import { chatbotRouter } from "./chatbot";
import { readingAssistantRouter } from "./readingAssistant";
import { ocrRouter } from "./ocr";
import { srsRouter } from "./srsRouter";
import { abTestRouter } from "./abTestRouter";
import { entitlementRouter } from "./entitlements";
import { authRouter as emailAuthRouter } from "./authRouter";
import { payoutRouter } from "./payoutRouter";
import {
  generateStory,
  generatePodcast,
  generateFilm,
  generatePreview,
} from "./contentGeneration";
import {
  claimDailyStoryGeneration,
  getDailyWindow,
  isFreeLimitedUser,
  releaseDailyStoryGeneration,
} from "./dailyUsage";
import { hasPremiumAccess } from "@shared/freemiumLimits";
import {
  getAvailableMoods,
  getTracksByMood,
  getMoodDisplayName,
} from "./musicLibrary";
import { generateMusicPreview } from "./musicPreview";
import { storagePut } from "./storage";

const AVATAR_MIME_TYPES = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
} as const;

const AVATAR_UPLOAD_SCHEMA = z
  .string()
  .regex(
    /^data:(image\/(?:jpeg|png|webp));base64,[A-Za-z0-9+/=]+$/,
    "Unsupported avatar format"
  );

const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
const VOCABULARY_LIST_SEPARATOR = /[,;\n\r\uFF0C\u3001\uFF1B]+/;

function splitVocabularyInput(value?: string | null): string[] {
  return (value || "")
    .split(VOCABULARY_LIST_SEPARATOR)
    .map(word => word.trim())
    .filter(Boolean);
}

function buildCuteStoryThumbnailPrompt(theme?: string | null, title?: string | null): string {
  const safeTheme = theme?.toLowerCase() || "adventure";
  const safeTitle = title || "Untitled Story";

  return [
    `A cute, warm, family-friendly Pixar-like 3D animated storybook cover for a ${safeTheme} language-learning story titled "${safeTitle}".`,
    "Use friendly expressive characters, soft rounded shapes, bright inviting color, clean coherent faces and hands, cinematic warm light, and a whimsical non-scary mood.",
    "No horror, no distorted faces, no glitch artifacts, no extra limbs, no creepy expressions, no text, no written words, no logo.",
  ].join(" ");
}

async function generateStoryThumbnailImage(theme?: string | null, title?: string | null): Promise<string | undefined> {
  const { generateImage } = await import("./_core/imageGeneration");
  const thumbnailPrompt = buildCuteStoryThumbnailPrompt(theme, title);
  const { url } = await generateImage({
    prompt: thumbnailPrompt,
    aspectRatio: "16:9",
  });
  return url;
}

async function isContentSharedViaPublicCollection(contentId: number): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;

  const rows = await db
    .select({ id: collectionItems.id })
    .from(collectionItems)
    .innerJoin(collections, eq(collections.id, collectionItems.collectionId))
    .where(
      and(
        eq(collectionItems.contentId, contentId),
        eq(collections.isPublic, true)
      )
    )
    .limit(1);

  return rows.length > 0;
}

export const appRouter = router({
  // if you need to use socket.io, read and register route in server/_core/index.ts, all api should start with '/api/' so that the gateway can route correctly
  system: systemRouter,
  emailAuth: emailAuthRouter,
  payout: payoutRouter,
  gamification: gamificationRouter,
  wordbank: wordbankRouter,
  audio: audioRouter,
  practice: practiceRouter,
  storyProgress: storyProgressRouter,
  collections: collectionsRouter,
  collectionAnalytics: collectionAnalyticsRouter,
  leaderboard: leaderboardRouter,
  featured: featuredRouter,
  discovery: discoveryRouter,
  follow: followRouter,
  retry: retryRouter,
  levelTest: levelTestRouter,
  document: documentRouter,
  recentlyViewed: recentlyViewedRouter,
  tonePractice: tonePracticeRouter,
  watchHistory: watchHistoryRouter,
  tutorial: tutorialRouter,
  export: exportRouter,
  download: downloadRouter,
  breadcrumb: breadcrumbRouter,
  vocabCollections: vocabCollectionsRouter,
  checkout: checkoutRouter,
  subscription: subscriptionRouter,
  adminAnalytics: adminAnalyticsRouter,
  badge: badgeRouter,
  digest: digestRouter,
  category: categoryRouter,
  weeklyGoal: weeklyGoalRouter,
  cookies: cookieRouter,
  contact: contactRouter,
  referral: referralRouter,
  referralAnalytics: referralAnalyticsRouter,
  tieredReferralRewards: tieredReferralRewardsRouter,
  adminReferral: adminReferralRouter,
  affiliate: affiliateRouter,
  chatbot: chatbotRouter,
  readingAssistant: readingAssistantRouter,
  ocr: ocrRouter,
  srs: srsRouter,
  abTest: abTestRouter,
  entitlement: entitlementRouter,
  achievements: router({
    trackShare: protectedProcedure
      .input(
        z.object({
          achievementType: z.string(),
          platform: z.enum(["twitter", "facebook", "linkedin"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database unavailable",
          });
        const { achievementShares } = await import("../drizzle/schema");
        await db.insert(achievementShares).values({
          userId: ctx.user.id,
          achievementType: input.achievementType,
          platform: input.platform,
        });
        return { success: true };
      }),
  }),
  notifications: router({
    subscribeToPush: protectedProcedure
      .input(z.object({ subscription: z.any() }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database unavailable",
          });
        const { pushSubscriptions } = await import("../drizzle/schema");
        await db
          .insert(pushSubscriptions)
          .values({
            userId: ctx.user.id,
            subscription: JSON.stringify(input.subscription),
          })
          .onDuplicateKeyUpdate({
            set: { subscription: JSON.stringify(input.subscription) },
          });
        return { success: true };
      }),
    unsubscribeFromPush: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      const { pushSubscriptions } = await import("../drizzle/schema");
      await db
        .delete(pushSubscriptions)
        .where(eq(pushSubscriptions.userId, ctx.user.id));
      return { success: true };
    }),
    getPreferences: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      const { notificationPreferences } = await import("../drizzle/schema");
      const prefs = await db
        .select()
        .from(notificationPreferences)
        .where(eq(notificationPreferences.userId, ctx.user.id))
        .limit(1);
      return (
        prefs[0] || {
          weeklyGoalReminders: true,
          achievementNotifications: true,
        }
      );
    }),
    updatePreferences: protectedProcedure
      .input(
        z.object({
          weeklyGoalReminders: z.boolean().optional(),
          achievementNotifications: z.boolean().optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database unavailable",
          });
        const { notificationPreferences } = await import("../drizzle/schema");
        await db
          .insert(notificationPreferences)
          .values({
            userId: ctx.user.id,
            ...input,
          })
          .onDuplicateKeyUpdate({ set: input });
        return { success: true };
      }),
  }),
  music: router({
    getAvailableMoods: publicProcedure.query(() => {
      const moods = getAvailableMoods();
      return moods.map(mood => ({
        value: mood,
        label: getMoodDisplayName(mood),
      }));
    }),
    getTracksByMood: publicProcedure
      .input(z.object({ mood: z.string() }))
      .query(({ input }) => {
        return getTracksByMood(input.mood as any);
      }),
    generatePreview: publicProcedure
      .input(z.object({ trackId: z.string() }))
      .mutation(async ({ input }) => {
        const previewUrl = await generateMusicPreview(input.trackId);
        return { previewUrl };
      }),
  }),
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
    updatePreferredLanguage: protectedProcedure
      .input(z.object({ language: z.string().max(10) }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database unavailable",
          });
        await db
          .update(users)
          .set({ preferredLanguage: input.language })
          .where(eq(users.id, ctx.user.id));
        return { success: true };
      }),
    updatePreferredTranslationLanguage: protectedProcedure
      .input(z.object({ language: z.string().max(10) }))
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database unavailable",
          });
        await db
          .update(users)
          .set({ preferredTranslationLanguage: input.language })
          .where(eq(users.id, ctx.user.id));
        return { success: true };
      }),
    updateProfile: protectedProcedure
      .input(
        z.object({
          name: z.string().trim().min(1).max(120),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database unavailable",
          });
        await db
          .update(users)
          .set({ name: input.name })
          .where(eq(users.id, ctx.user.id));
        const [updatedUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1);
        return { success: true, user: updatedUser };
      }),
    uploadAvatar: protectedProcedure
      .input(
        z.object({
          dataUrl: AVATAR_UPLOAD_SCHEMA,
        })
      )
      .mutation(async ({ input, ctx }) => {
        const db = await getDb();
        if (!db)
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Database unavailable",
          });

        const match = input.dataUrl.match(
          /^data:(image\/(?:jpeg|png|webp));base64,(.+)$/
        );
        if (!match) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Unsupported avatar format",
          });
        }

        const mimeType = match[1] as keyof typeof AVATAR_MIME_TYPES;
        const base64Payload = match[2];
        const buffer = Buffer.from(base64Payload, "base64");

        if (!buffer.length) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Avatar file is empty",
          });
        }

        if (buffer.length > MAX_AVATAR_BYTES) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Avatar must be 2MB or smaller",
          });
        }

        const extension = AVATAR_MIME_TYPES[mimeType];
        const fileKey = `avatars/user-${ctx.user.id}/${Date.now()}-${randomBytes(8).toString("hex")}.${extension}`;
        const { url } = await storagePut(fileKey, buffer, mimeType);

        await db
          .update(users)
          .set({ avatarUrl: url })
          .where(eq(users.id, ctx.user.id));

        const [updatedUser] = await db
          .select()
          .from(users)
          .where(eq(users.id, ctx.user.id))
          .limit(1);

        return { success: true, avatarUrl: url, user: updatedUser };
      }),
    removeAvatar: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });

      await db
        .update(users)
        .set({ avatarUrl: null })
        .where(eq(users.id, ctx.user.id));

      const [updatedUser] = await db
        .select()
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);

      return { success: true, user: updatedUser };
    }),
    completePremiumOnboarding: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db)
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Database unavailable",
        });
      await db
        .update(users)
        .set({ premiumOnboardingCompleted: true })
        .where(eq(users.id, ctx.user.id));
      return { success: true };
    }),
  }),

  content: router({
    generateVoicePreview: protectedProcedure
      .input(
        z.object({
          targetLanguage: z.string(),
          voiceType: z.string(),
          narratorGender: z.enum(["male", "female"]),
        })
      )
      .mutation(async ({ input }) => {
        const { generateVoicePreview } = await import("./voicePreview");
        const audioUrl = await generateVoicePreview(
          input.targetLanguage,
          input.voiceType,
          input.narratorGender
        );
        return { audioUrl };
      }),

    generatePreview: protectedProcedure
      .input(
        z.object({
          targetLanguage: z.string(),
          proficiencyLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
          vocabularyText: z.string(),
          theme: z.string(),
          topicPrompt: z.string().optional(),
        })
      )
      .mutation(async ({ input }) => {
        const vocabularyWords = splitVocabularyInput(input.vocabularyText);

        const preview = await generatePreview({
          targetLanguage: input.targetLanguage,
          proficiencyLevel: input.proficiencyLevel,
          vocabularyWords,
          theme: input.theme,
          topicPrompt: input.topicPrompt,
        });

        return { preview };
      }),

    generate: protectedProcedure
      .input(
        z.object({
          targetLanguage: z.string(),
          proficiencyLevel: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
          vocabularyText: z.string(),
          theme: z.string(),
          topicPrompt: z.string().optional(),
          translationLanguage: z.string().optional(),
          timezone: z.string().optional(),
          mode: z.enum(["podcast", "film"]),
          storyLength: z
            .enum(["short", "medium", "long"])
            .optional()
            .default("medium"),
          voiceType: z.string().optional(),
          narratorGender: z.enum(["male", "female"]).optional(),
          cinematicStyle: z.string().optional(),
          videoDuration: z.number().optional().default(30), // Video duration in seconds for film mode
          backgroundMusic: z
            .enum([
              "calm",
              "upbeat",
              "dramatic",
              "adventure",
              "suspenseful",
              "romantic",
              "mysterious",
              "comedic",
              "energetic",
              "melancholic",
              "triumphant",
              "peaceful",
              "none",
            ])
            .optional(),
          musicVolume: z.number().min(0).max(100).optional().default(20),
          selectedMusicTrack: z.string().optional(),
          addSubtitles: z.boolean().optional().default(true),
          subtitleFontSize: z.enum(["small", "medium", "large"]).optional(),
          subtitlePosition: z.enum(["top", "bottom"]).optional(),
          subtitleColor: z.enum(["white", "yellow", "cyan"]).optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // --- SERVER-SIDE FREE TIER LIMIT: 1 story per calendar day ---
        let shouldDecrementStarterCredit = false;
        let dailyClaimWindow: ReturnType<typeof getDailyWindow> | null = null;

        if (input.mode === "film" && !hasPremiumAccess((ctx.user.subscriptionTier ?? "free") as any)) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Film generation is available on Premium plans.",
          });
        }

        if (isFreeLimitedUser(ctx.user)) {
          const dailyWindow = getDailyWindow(input.timezone || ctx.user.timezone || null);
          dailyClaimWindow = dailyWindow;
          const claim = await claimDailyStoryGeneration(ctx.user.id, dailyWindow);

          if (!claim.allowed) {
            throw new TRPCError({
              code: "FORBIDDEN",
              message:
                "You've used your free story for today. Upgrade to Premium for unlimited stories!",
            });
          }

          const db = await getDb();
          if (db) {
            const { users: usersTable } = await import("../drizzle/schema");
            const { eq } = await import("drizzle-orm");
            const [currentUser] = await db
              .select({ bonusStoryCredits: usersTable.bonusStoryCredits })
              .from(usersTable)
              .where(eq(usersTable.id, ctx.user.id));
            shouldDecrementStarterCredit = (currentUser?.bonusStoryCredits ?? 0) > 0;
          }
        }

        // A1-only restriction removed — free users can access all CEFR levels

        const vocabularyWords = splitVocabularyInput(input.vocabularyText);
        if (input.translationLanguage) {
          const preferenceDb = await getDb();
          if (preferenceDb) {
            await preferenceDb
              .update(users)
              .set({
                preferredTranslationLanguage: normalizeLearningLanguage(input.translationLanguage),
              })
              .where(eq(users.id, ctx.user.id));
          }
        }

        const vocabList = await createVocabularyList({
          userId: ctx.user.id,
          targetLanguage: input.targetLanguage,
          proficiencyLevel: input.proficiencyLevel,
          words: vocabularyWords.join(", "),
          topicPrompt: input.topicPrompt,
        });

        // Generate a temporary title (will be replaced with AI-generated title)
        const tempTitle = input.topicPrompt
          ? `${input.theme}: ${input.topicPrompt.substring(0, 50)}${input.topicPrompt.length > 50 ? "..." : ""}`
          : `${input.theme} ${input.mode === "podcast" ? "Podcast" : "Film"} - ${input.targetLanguage}`;

        // Calculate difficulty level based on language and proficiency
        const difficultyLevel = calculateDifficultyLevel(
          input.targetLanguage,
          input.proficiencyLevel
        );
        const filmNarration =
          input.mode === "film"
            ? resolveFilmNarrationSettings(
                input.voiceType,
                input.narratorGender
              )
            : null;
        const effectiveVoiceType =
          input.mode === "film" ? filmNarration?.voiceType : input.voiceType;
        const effectiveNarratorGender =
          input.mode === "film"
            ? filmNarration?.narratorGender
            : input.narratorGender;
        const resolvedSelectedMusicTrack =
          input.mode === "film" &&
          input.backgroundMusic &&
          input.backgroundMusic !== "none"
            ? input.selectedMusicTrack || `${input.backgroundMusic}-1`
            : undefined;

        const content = await createGeneratedContent({
          userId: ctx.user.id,
          vocabularyListId: vocabList.id,
          mode: input.mode,
          theme: input.theme,
          title: tempTitle,
          difficultyLevel,
          voiceType: effectiveVoiceType,
          narratorGender: effectiveNarratorGender,
          cinematicStyle: input.cinematicStyle,
          musicVolume:
            input.mode === "film" &&
            input.backgroundMusic &&
            input.backgroundMusic !== "none"
              ? input.musicVolume
              : undefined,
          selectedMusicTrack: resolvedSelectedMusicTrack,
          storyText: "",
          status: "generating",
        });

        (async () => {
          try {
            // Import progress helper
            const { updateContentProgress } = await import("./db");

            // Get translation language from input or user preference
            const translationLanguage = normalizeLearningLanguage(
              input.translationLanguage ||
              ctx.user.preferredTranslationLanguage ||
              "English"
            );

            // Stage 1: Story Generation (0-40%)
            await updateContentProgress(content.id, 10, "Generating story...");

            const story = await generateStory({
              targetLanguage: input.targetLanguage,
              proficiencyLevel: input.proficiencyLevel,
              vocabularyWords,
              theme: input.theme,
              topicPrompt: input.topicPrompt,
              translationLanguage,
              storyLength: input.storyLength,
              mode: input.mode,
              targetSceneCount:
                input.mode === "film"
                  ? Math.max(1, Math.ceil((input.videoDuration ?? 30) / 10))
                  : undefined,
              targetVideoDuration:
                input.mode === "film" ? input.videoDuration : undefined,
            });

            await updateContentProgress(
              content.id,
              40,
              "Story created successfully"
            );

            // Use the AI-generated title from the story
            const finalTitle = story.title || tempTitle;

            let audioUrl: string | undefined;
            let videoUrl: string | undefined;
            let transcript: string | undefined;
            let thumbnailUrl: string | undefined;
            let audioAlignment: any = null;

            if (input.mode === "film") {
              await updateContentProgress(
                content.id,
                50,
                "Preparing video thumbnail..."
              );
            } else {
              await updateContentProgress(
                content.id,
                50,
                "Preparing audio..."
              );
            }

            if (input.mode === "podcast" && input.voiceType) {
              // Stage 3: Audio Generation (50-90%)
              await updateContentProgress(
                content.id,
                55,
                "Generating audio..."
              );

              console.log(
                "[Podcast Generation] Starting podcast generation for content ID:",
                content.id
              );
              console.log(
                "[Podcast Generation] Voice type:",
                input.voiceType,
                "Gender:",
                input.narratorGender
              );

              const podcast = (await generatePodcast(
                {
                  targetLanguage: input.targetLanguage,
                  proficiencyLevel: input.proficiencyLevel,
                  vocabularyWords,
                  theme: input.theme,
                  topicPrompt: input.topicPrompt,
                  voiceType: input.voiceType,
                  narratorGender: input.narratorGender,
                },
                story.storyText
              )) as {
                audioUrl: string;
                transcript: string;
                audioAlignment?: any;
              };

              console.log(
                "[Podcast Generation] Success! Audio URL:",
                podcast.audioUrl
              );
              audioUrl = podcast.audioUrl;
              transcript = podcast.transcript;
              if (podcast.audioAlignment) {
                audioAlignment = podcast.audioAlignment;
                console.log(
                  "[Podcast Generation] Saving audio alignment data with",
                  podcast.audioAlignment.characters.length,
                  "character timestamps"
                );
              }
              await updateContentProgress(
                content.id,
                90,
                "Audio generated successfully"
              );
            } else if (input.mode === "film" && input.cinematicStyle) {
              // Stage 3: Video Generation (50-90%)
              await updateContentProgress(
                content.id,
                55,
                "Generating video..."
              );

              const film = await generateFilm(
                {
                  targetLanguage: input.targetLanguage,
                  proficiencyLevel: input.proficiencyLevel,
                  vocabularyWords,
                  theme: input.theme,
                  topicPrompt: input.topicPrompt,
                  cinematicStyle: input.cinematicStyle,
                  targetVideoDuration: input.videoDuration,
                  backgroundMusic: input.backgroundMusic,
                  musicVolume: input.musicVolume,
                  selectedMusicTrack: resolvedSelectedMusicTrack,
                  addSubtitles: input.addSubtitles,
                  subtitleFontSize: input.subtitleFontSize,
                  subtitlePosition: input.subtitlePosition,
                  subtitleColor: input.subtitleColor,
                  voiceType: effectiveVoiceType,
                  narratorGender: effectiveNarratorGender,
                  sceneBeats: story.visualBeats,
                },
                story.storyText,
                async (stage: string, progress: number) => {
                  // Update progress with detailed stage information
                  await updateContentProgress(
                    content.id,
                    55 + Math.floor(progress * 0.35),
                    stage
                  );
                }
              );
              videoUrl = film.videoUrl;
              transcript = film.transcript;
              if (film.audioAlignment) {
                audioAlignment = film.audioAlignment;
              }
              thumbnailUrl = film.thumbnailUrl || thumbnailUrl;
              if (!thumbnailUrl) {
                try {
                  console.log(
                    "[Thumbnail Generation] Film did not return a scene still; generating fallback thumbnail for content ID:",
                    content.id
                  );
                  thumbnailUrl = await generateStoryThumbnailImage(
                    input.theme,
                    finalTitle
                  );
                } catch (error) {
                  console.error("[Thumbnail Generation] Film fallback failed:", error);
                }
              }
              await updateContentProgress(
                content.id,
                90,
                "Video generated successfully"
              );
            }

            // Stage 4: Finalizing (90-100%)
            await updateContentProgress(content.id, 95, "Finalizing...");

            await updateGeneratedContent(content.id, {
              title: finalTitle, // Update with AI-generated title
              titleTranslation: story.titleTranslation, // Save translated title
              storyText: story.storyText,
              lineTranslations: story.lineTranslations as any,
              vocabularyTranslations: story.vocabularyTranslations as any,
              audioUrl,
              audioAlignment: audioAlignment, // Character-level timing from ElevenLabs
              videoUrl,
              thumbnailUrl,
              transcript,
              status: "completed",
              progress: 100,
              progressStage: "Completed",
            });

            if (input.mode === "podcast" && process.env.GENERATE_STORY_THUMBNAILS !== "false") {
              generateStoryThumbnailImage(input.theme, finalTitle)
                .then(async (generatedThumbnailUrl) => {
                  if (generatedThumbnailUrl) {
                    await updateGeneratedContent(content.id, {
                      thumbnailUrl: generatedThumbnailUrl,
                      thumbnailStyle: "pixar" as any,
                    });
                  }
                })
                .catch((thumbnailError) => {
                  console.error("[Thumbnail Generation] Background thumbnail failed:", thumbnailError);
                });
            }

            const progress = await getLearningProgressByUserId(ctx.user.id);
            const existingProgress = progress.find(
              p => p.targetLanguage === input.targetLanguage
            );

            await upsertLearningProgress({
              userId: ctx.user.id,
              targetLanguage: input.targetLanguage,
              totalWordsLearned:
                (existingProgress?.totalWordsLearned || 0) +
                vocabularyWords.length,
              totalStoriesGenerated:
                (existingProgress?.totalStoriesGenerated || 0) + 1,
              totalTimeSpent: existingProgress?.totalTimeSpent || 0,
              currentStreak: existingProgress?.currentStreak || 1,
              longestStreak: existingProgress?.longestStreak || 1,
              lastActivityAt: new Date(),
            });

            // Award XP for story creation
            const xpReward = 25; // Story creation XP
            const { getDb } = await import("./db");
            const { userStats, achievements, userAchievements, notifications } =
              await import("../drizzle/schema");
            const { eq } = await import("drizzle-orm");
            const db = await getDb();
            if (!db) return;

            // Send notification to user
            await db.insert(notifications).values({
              userId: ctx.user.id,
              type: "story_ready",
              title: "Your story is ready! 🎉",
              content: `"${finalTitle}" has been generated and is ready to enjoy. Click to view it now!`,
              relatedContentId: content.id,
              isRead: false,
            });

            // Get or create user stats
            const existingStats = await db
              .select()
              .from(userStats)
              .where(eq(userStats.userId, ctx.user.id))
              .limit(1);

            if (existingStats.length === 0) {
              await db.insert(userStats).values({
                userId: ctx.user.id,
                currentStreak: 0,
                longestStreak: 0,
                lastActivityDate: null,
                totalXp: 0,
                coins: 0,
                level: 1,
                storiesCompleted: 0,
                quizzesCompleted: 0,
                wordsLearned: 0,
              });
            }

            // Calculate new streak
            const stats = await db
              .select()
              .from(userStats)
              .where(eq(userStats.userId, ctx.user.id))
              .limit(1);

            const current = stats[0];
            const now = new Date();
            const today = new Date(
              now.getFullYear(),
              now.getMonth(),
              now.getDate()
            );
            const lastActivity = current.lastActivityDate
              ? new Date(
                  current.lastActivityDate.getFullYear(),
                  current.lastActivityDate.getMonth(),
                  current.lastActivityDate.getDate()
                )
              : null;

            let newStreak = current.currentStreak;
            if (!lastActivity) {
              newStreak = 1;
            } else {
              const daysDiff = Math.floor(
                (today.getTime() - lastActivity.getTime()) /
                  (1000 * 60 * 60 * 24)
              );
              if (daysDiff === 0) {
                newStreak = current.currentStreak;
              } else if (daysDiff === 1) {
                newStreak = current.currentStreak + 1;
              } else {
                newStreak = 1;
              }
            }

            const longestStreak = Math.max(newStreak, current.longestStreak);

            // Calculate level
            const newTotalXp = current.totalXp + xpReward;
            let newLevel = 1;
            if (newTotalXp >= 100) newLevel = 2;
            if (newTotalXp >= 300) newLevel = 3;
            if (newTotalXp >= 600) newLevel = 4;
            if (newTotalXp >= 1000)
              newLevel = 5 + Math.floor((newTotalXp - 1000) / 500);

            // Update user stats
            await db
              .update(userStats)
              .set({
                currentStreak: newStreak,
                longestStreak,
                lastActivityDate: now,
                totalXp: newTotalXp,
                level: newLevel,
                storiesCompleted: current.storiesCompleted + 1,
                wordsLearned: current.wordsLearned + vocabularyWords.length,
              })
              .where(eq(userStats.userId, ctx.user.id));

            // Mark "Create Story" challenge as completed
            try {
              const { completeChallenge, TUTORIAL_CHALLENGES } =
                await import("./tutorialRouter");
              await completeChallenge(
                ctx.user.id,
                TUTORIAL_CHALLENGES.CREATE_STORY
              );
            } catch (error) {
              console.error("Failed to mark challenge as completed:", error);
            }

            // Increment weekly progress
            try {
              const { incrementWeeklyProgress } =
                await import("./weeklyGoalRouter");
              await incrementWeeklyProgress(ctx.user.id);
            } catch (error) {
              console.error("Failed to increment weekly progress:", error);
            }

            if (shouldDecrementStarterCredit) {
              await db
                .update(users)
                .set({
                  bonusStoryCredits: sql`GREATEST(${users.bonusStoryCredits} - 1, 0)`,
                })
                .where(eq(users.id, ctx.user.id));
              console.log(
                `[StarterPack] Tracked 1 completed starter story for user ${ctx.user.id}`
              );
            }

            // Check for new achievements
            const allAchievements = await db.select().from(achievements);
            const unlockedIds = (
              await db
                .select({ achievementId: userAchievements.achievementId })
                .from(userAchievements)
                .where(eq(userAchievements.userId, ctx.user.id))
            ).map(u => u.achievementId);

            for (const achievement of allAchievements) {
              if (unlockedIds.includes(achievement.id)) continue;

              let shouldUnlock = false;
              const updatedStats = await db
                .select()
                .from(userStats)
                .where(eq(userStats.userId, ctx.user.id))
                .limit(1);
              const latestStats = updatedStats[0];

              if (
                achievement.category === "streak" &&
                latestStats.currentStreak >= achievement.requirement
              ) {
                shouldUnlock = true;
              } else if (
                achievement.category === "quizzes" &&
                latestStats.quizzesCompleted >= achievement.requirement
              ) {
                shouldUnlock = true;
              } else if (
                achievement.category === "stories" &&
                latestStats.storiesCompleted >= achievement.requirement
              ) {
                shouldUnlock = true;
              } else if (
                achievement.category === "vocabulary" &&
                latestStats.wordsLearned >= achievement.requirement
              ) {
                shouldUnlock = true;
              }

              if (shouldUnlock) {
                await db.insert(userAchievements).values({
                  userId: ctx.user.id,
                  achievementId: achievement.id,
                  unlockedAt: new Date(),
                });

                // Award achievement XP
                await db
                  .update(userStats)
                  .set({
                    totalXp: latestStats.totalXp + achievement.xpReward,
                  })
                  .where(eq(userStats.userId, ctx.user.id));
              }
            }
          } catch (error) {
            console.error(
              "[Content Generation] Error generating content:",
              error
            );
            console.error("[Content Generation] Error details:", {
              message: error instanceof Error ? error.message : String(error),
              stack: error instanceof Error ? error.stack : undefined,
              contentId: content.id,
              mode: input.mode,
            });

            await updateGeneratedContent(content.id, {
              status: "failed",
              progressStage: "Failed",
              failureReason: error instanceof Error ? error.message : String(error),
            });

            if (dailyClaimWindow && isFreeLimitedUser(ctx.user)) {
              await releaseDailyStoryGeneration(ctx.user.id, dailyClaimWindow);
            }
          }
        })();

        return { contentId: content.id };
      }),

    // Public story preview for shared links — returns limited data, no auth required
    getPublicPreview: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        const content = await getGeneratedContentById(input.id);
        if (!content || content.status !== "completed") {
          throw new Error("Story not found");
        }

        if (!content.isPublic && !(await isContentSharedViaPublicCollection(input.id))) {
          throw new Error("Story not found");
        }
        // Return limited preview data — first 3 sentences, title, thumbnail, metadata
        const storyText = content.storyText || "";
        const sentences = storyText
          .split(/(?<=[.!?。！？])\s*/)
          .filter(s => s.trim());
        const previewText = sentences.slice(0, 3).join(" ");
        const lineTranslations = (content.lineTranslations || []) as Array<{
          original: string;
          english: string;
          pinyin?: string;
        }>;
        const previewTranslations = lineTranslations.slice(0, 3);

        // Get vocabulary list for language info
        const db = await getDb();
        const { vocabularyLists, users: usersTable } =
          await import("../drizzle/schema");
        let targetLanguage = "Unknown";
        if (db) {
          const vocabResult = await db
            .select()
            .from(vocabularyLists)
            .where(eq(vocabularyLists.id, content.vocabularyListId))
            .limit(1);
          if (vocabResult[0]) targetLanguage = vocabResult[0].targetLanguage;
        }

        // Get author name
        let authorName = "A Storyling learner";
        if (db) {
          const userResult = await db
            .select({ name: usersTable.name })
            .from(usersTable)
            .where(eq(usersTable.id, content.userId))
            .limit(1);
          if (userResult[0]?.name) authorName = userResult[0].name;
        }

        let thumbnailUrl: string | null | undefined = content.thumbnailUrl;
        if (!thumbnailUrl) {
          try {
            thumbnailUrl = await generateStoryThumbnailImage(content.theme, content.title);
            if (thumbnailUrl) {
              await updateGeneratedContent(content.id, {
                thumbnailUrl,
                thumbnailStyle: "pixar" as any,
              });
            }
          } catch (error) {
            console.error("[Public Preview] Failed to generate missing thumbnail:", error);
          }
        }

        return {
          id: content.id,
          title: content.title || "Untitled Story",
          titleTranslation: content.titleTranslation,
          previewText,
          previewTranslations,
          thumbnailUrl,
          theme: content.theme,
          difficultyLevel: content.difficultyLevel,
          mode: content.mode,
          targetLanguage,
          authorName,
          totalSentences: sentences.length,
        };
      }),

    updateVisibility: protectedProcedure
      .input(
        z.object({
          contentId: z.number(),
          isPublic: z.boolean(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const content = await getGeneratedContentById(input.contentId);
        if (!content || content.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Content not found",
          });
        }

        if (input.isPublic && content.status !== "completed") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Only completed stories can be made public.",
          });
        }

        await updateGeneratedContent(input.contentId, {
          isPublic: input.isPublic,
        });

        return { success: true, isPublic: input.isPublic };
      }),

    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input, ctx }) => {
        const content = await getGeneratedContentById(input.id);
        if (!content) {
          throw new Error("Content not found");
        }

        const canAccess =
          content.userId === ctx.user.id ||
          content.isPublic ||
          (await isContentSharedViaPublicCollection(input.id));

        if (!canAccess) {
          throw new Error("Content not found");
        }

        // Get vocabulary list to include target language and words
        const vocabList = await getVocabularyListsByUserId(content.userId);
        const matchingList = vocabList.find(
          v => v.id === content.vocabularyListId
        );

        // Parse vocabulary words from comma-separated string
        console.log("[getById] matchingList.words:", matchingList?.words);
        console.log(
          "[getById] matchingList.words type:",
          typeof matchingList?.words
        );

        const vocabularyWords = matchingList?.words
          ? splitVocabularyInput(matchingList.words)
          : [];

        console.log("[getById] vocabularyWords after split:", vocabularyWords);
        console.log(
          "[getById] content.vocabularyTranslations:",
          content.vocabularyTranslations
        );

        return {
          ...content,
          targetLanguage: matchingList?.targetLanguage || "Unknown",
          vocabularyWords,
          // Ensure vocabularyTranslations is always an object, never null
          vocabularyTranslations: content.vocabularyTranslations || {},
          // Ensure lineTranslations is always an array, never null
          lineTranslations: content.lineTranslations || [],
          isOwner: content.userId === ctx.user.id,
        };
      }),

    getLibrary: protectedProcedure.query(async ({ ctx }) => {
      const content = await getGeneratedContentByUserId(ctx.user.id);

      // Auto-cleanup: mark stories stuck in 'generating' for over 10 minutes as 'failed'
      const TEN_MINUTES = 10 * 60 * 1000;
      const stuckStories = content.filter(
        c =>
          c.status === "generating" &&
          c.generatedAt &&
          Date.now() - new Date(c.generatedAt).getTime() > TEN_MINUTES &&
          (!c.storyText || c.storyText.length === 0)
      );
      if (stuckStories.length > 0) {
        (async () => {
          try {
            for (const story of stuckStories) {
              await updateGeneratedContent(story.id, {
                status: "failed" as any,
              });
              console.log(
                `[Auto-Cleanup] Marked stuck story ${story.id} as failed (was generating for >10min)`
              );
            }
          } catch (err) {
            console.error("[Auto-Cleanup] Error:", err);
          }
        })();
      }

      // Get vocabulary lists to include target language
      const vocabLists = await getVocabularyListsByUserId(ctx.user.id);

      // Add targetLanguage to each content item
      const contentWithLanguage = content.map(c => {
        const matchingList = vocabLists.find(v => v.id === c.vocabularyListId);
        return {
          ...c,
          targetLanguage: matchingList?.targetLanguage || null,
        };
      });

      // Async backfill: translate titles for stories missing titleTranslation
      const storiesNeedingTranslation = content.filter(
        c => c.status === "completed" && c.title && !c.titleTranslation
      );
      if (storiesNeedingTranslation.length > 0) {
        (async () => {
          try {
            const { invokeLLM } = await import("./_core/llm");
            const batch = storiesNeedingTranslation.slice(0, 10);
            for (const story of batch) {
              try {
                const matchingList = vocabLists.find(
                  v => v.id === story.vocabularyListId
                );
                const targetLang = matchingList?.targetLanguage || "unknown";
                const result = await invokeLLM({
                  messages: [
                    {
                      role: "system",
                      content:
                        "You are a translator. Translate the given title to English. Return ONLY the English translation, nothing else.",
                    },
                    {
                      role: "user",
                      content: `Translate this ${targetLang} title to English: "${story.title}"`,
                    },
                  ],
                  maxTokens: 100,
                });
                const translation = result.choices?.[0]?.message?.content;
                if (translation && typeof translation === "string") {
                  const cleanTranslation = translation
                    .replace(/^"|"$/g, "")
                    .trim();
                  await updateGeneratedContent(story.id, {
                    titleTranslation: cleanTranslation,
                  });
                  console.log(
                    `[Title Translation Backfill] Translated "${story.title}" -> "${cleanTranslation}"`
                  );
                }
              } catch (err) {
                console.error(
                  `[Title Translation Backfill] Failed for story ${story.id}:`,
                  err
                );
              }
            }
          } catch (err) {
            console.error("[Title Translation Backfill] Error:", err);
          }
        })();
      }

      // Async backfill: generate Pixar-style thumbnails for completed stories that either:
      // 1. Don't have a thumbnail at all, or
      // 2. Have a non-pixar style thumbnail that needs upgrading
      const storiesNeedingThumbnails =
        process.env.AUTO_GENERATE_MISSING_THUMBNAILS === "true"
          ? content.filter(
              c =>
                c.status === "completed" &&
                c.title &&
                (!c.thumbnailUrl || c.thumbnailStyle !== "pixar")
            )
          : [];
      if (storiesNeedingThumbnails.length > 0) {
        // Fire and forget - don't block the response. Process max 20 at a time to catch up faster.
        (async () => {
          try {
            const { generateImage } = await import("./_core/imageGeneration");
            const batch = storiesNeedingThumbnails.slice(0, 20);
            for (const story of batch) {
              try {
                const thumbnailPrompt = buildCuteStoryThumbnailPrompt(
                  story.theme,
                  story.title
                );
                const { url } = await generateImage({
                  prompt: thumbnailPrompt,
                });
                if (url) {
                  await updateGeneratedContent(story.id, {
                    thumbnailUrl: url,
                    thumbnailStyle: "pixar" as any,
                  });
                  console.log(
                    `[Thumbnail Backfill] Generated Pixar thumbnail for story ${story.id}: ${story.title}`
                  );
                }
              } catch (err) {
                console.error(
                  `[Thumbnail Backfill] Failed for story ${story.id}:`,
                  err
                );
              }
            }
          } catch (err) {
            console.error("[Thumbnail Backfill] Error:", err);
          }
        })();
      }

      return contentWithLanguage;
    }),

    hasChineseStories: protectedProcedure.query(async ({ ctx }) => {
      const content = await getGeneratedContentByUserId(ctx.user.id);
      const vocabLists = await getVocabularyListsByUserId(ctx.user.id);

      // Check if user has any completed Chinese stories
      const hasChineseStory = content.some(c => {
        if (c.status !== "completed") return false;
        const matchingList = vocabLists.find(v => v.id === c.vocabularyListId);
        const lang = matchingList?.targetLanguage?.toLowerCase() || "";
        return lang.includes("chinese") || lang === "zh";
      });

      return { hasChineseStories: hasChineseStory };
    }),

    incrementPlayCount: protectedProcedure
      .input(z.object({ contentId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await incrementPlayCount(input.contentId);

        // Mark audio playback challenge as completed
        try {
          const { completeChallenge, TUTORIAL_CHALLENGES } =
            await import("./tutorialRouter");
          await completeChallenge(
            ctx.user.id,
            TUTORIAL_CHALLENGES.PLAY_CONTENT
          );
        } catch (error) {
          console.error("Failed to mark audio playback challenge:", error);
        }

        return { success: true };
      }),

    cleanupStuckStories: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const { generatedContent } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");

      // Find ALL stories stuck in generating status
      const stuckStories = await db
        .select()
        .from(generatedContent)
        .where(eq(generatedContent.status, "generating"));

      // Mark them as failed
      for (const story of stuckStories) {
        await db
          .update(generatedContent)
          .set({ status: "failed" })
          .where(eq(generatedContent.id, story.id));
      }

      return {
        cleaned: stuckStories.length,
        storyIds: stuckStories.map(s => s.id),
      };
    }),

    backfillTitles: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Find all content without titles
      const { generatedContent, vocabularyLists } =
        await import("../drizzle/schema");
      const { eq, isNull, or } = await import("drizzle-orm");

      const contentWithoutTitles = await db
        .select()
        .from(generatedContent)
        .where(
          or(isNull(generatedContent.title), eq(generatedContent.title, ""))
        );

      // Get all vocabulary lists for language info
      const vocabLists = await db.select().from(vocabularyLists);
      const vocabListMap = new Map(vocabLists.map(v => [v.id, v]));

      let updated = 0;
      for (const content of contentWithoutTitles) {
        const vocabList = vocabListMap.get(content.vocabularyListId);
        const targetLanguage = vocabList?.targetLanguage || "Unknown";

        // Generate title from theme and mode
        const title = `${content.theme} ${content.mode === "podcast" ? "Podcast" : "Film"} - ${targetLanguage}`;

        await db
          .update(generatedContent)
          .set({ title })
          .where(eq(generatedContent.id, content.id));

        updated++;
      }

      return { success: true, updated };
    }),

    addFavorite: protectedProcedure
      .input(z.object({ contentId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await addFavorite(ctx.user.id, input.contentId);
        return { success: true };
      }),

    removeFavorite: protectedProcedure
      .input(z.object({ contentId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        await removeFavorite(ctx.user.id, input.contentId);
        return { success: true };
      }),

    getFavorites: protectedProcedure.query(async ({ ctx }) => {
      const favorites = await getFavoritesByUserId(ctx.user.id);
      return favorites;
    }),

    regenerateThumbnail: protectedProcedure
      .input(
        z.object({
          contentId: z.number(),
          style: z
            .enum(["realistic", "illustrated", "minimalist", "pixar"])
            .optional(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Get the content to verify ownership and get theme/title
        const content = await getGeneratedContentById(input.contentId);
        if (!content || content.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Content not found or unauthorized",
          });
        }

        try {
          console.log(
            "[Thumbnail Regeneration] Starting for content ID:",
            input.contentId
          );
          const { generateImage } = await import("./_core/imageGeneration");

          // Determine style (use input style or existing style or default to pixar)
          const thumbnailStyle =
            input.style || content.thumbnailStyle || "pixar";

          // Generate style-specific prompts
          let thumbnailPrompt: string;
          if (thumbnailStyle === "pixar") {
            thumbnailPrompt = buildCuteStoryThumbnailPrompt(
              content.theme,
              content.title
            );
          } else if (thumbnailStyle === "realistic") {
            thumbnailPrompt = `A photorealistic, cinematic image representing a ${content.theme.toLowerCase()} story titled "${content.title}". The scene should be visually stunning, emotionally engaging, and capture the essence of the story. Style: realistic photography, professional lighting, high detail. No text or words in the image.`;
          } else if (thumbnailStyle === "illustrated") {
            thumbnailPrompt = `A vibrant, eye-catching illustrated image for a ${content.theme.toLowerCase()} story titled "${content.title}". The image should be colorful, engaging, and suitable for a language learning app. Style: modern, playful illustration with bold colors and clean lines. No text in the image.`;
          } else {
            // minimalist
            thumbnailPrompt = `A minimalist, clean image representing a ${content.theme.toLowerCase()} story titled "${content.title}". The design should be simple, elegant, and modern with limited colors and geometric shapes. Style: minimalist design, flat colors, negative space. No text in the image.`;
          }

          const { url } = await generateImage({ prompt: thumbnailPrompt });
          console.log("[Thumbnail Regeneration] Success! Thumbnail URL:", url);

          // Update the content with new thumbnail and style
          await updateGeneratedContent(input.contentId, {
            thumbnailUrl: url,
            thumbnailStyle: thumbnailStyle as
              | "realistic"
              | "illustrated"
              | "minimalist"
              | "pixar",
          });

          return { success: true, thumbnailUrl: url };
        } catch (error) {
          console.error("[Thumbnail Regeneration] Error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to regenerate thumbnail",
          });
        }
      }),

    updateTitle: protectedProcedure
      .input(
        z.object({
          contentId: z.number(),
          title: z.string().min(1).max(200),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Get the content to verify ownership
        const content = await getGeneratedContentById(input.contentId);
        if (!content || content.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Content not found or unauthorized",
          });
        }

        // Update the title
        await updateGeneratedContent(input.contentId, {
          title: input.title,
        });

        return { success: true };
      }),

    bulkDelete: protectedProcedure
      .input(z.object({ contentIds: z.array(z.number()) }))
      .mutation(async ({ input, ctx }) => {
        const { bulkDeleteContent } = await import("./db");

        try {
          await bulkDeleteContent(ctx.user.id, input.contentIds);
          return {
            success: true,
            deletedCount: input.contentIds.length,
          };
        } catch (error) {
          console.error("[Bulk Delete] Error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to delete stories",
          });
        }
      }),

    bulkMarkComplete: protectedProcedure
      .input(z.object({ contentIds: z.array(z.number()) }))
      .mutation(async ({ input, ctx }) => {
        const { bulkMarkComplete } = await import("./db");

        try {
          await bulkMarkComplete(ctx.user.id, input.contentIds);
          return {
            success: true,
            markedCount: input.contentIds.length,
          };
        } catch (error) {
          console.error("[Bulk Mark Complete] Error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to mark stories as complete",
          });
        }
      }),

    bulkRegenerateThumbnails: protectedProcedure
      .input(
        z.object({
          contentIds: z.array(z.number()),
          style: z.enum(["realistic", "illustrated", "minimalist", "pixar"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { generateImage } = await import("./_core/imageGeneration");

        let successCount = 0;
        let failureCount = 0;
        const errors: string[] = [];

        for (const contentId of input.contentIds) {
          try {
            // Get the content to verify ownership and get theme/title
            const content = await getGeneratedContentById(contentId);
            if (!content || content.userId !== ctx.user.id) {
              errors.push(`Content ${contentId}: Unauthorized or not found`);
              failureCount++;
              continue;
            }

            // Generate style-specific prompt
            let thumbnailPrompt: string;
            if (input.style === "pixar") {
              thumbnailPrompt = buildCuteStoryThumbnailPrompt(
                content.theme,
                content.title
              );
            } else if (input.style === "realistic") {
              thumbnailPrompt = `A photorealistic, cinematic image representing a ${content.theme.toLowerCase()} story titled "${content.title}". The scene should be visually stunning, emotionally engaging, and capture the essence of the story. Style: realistic photography, professional lighting, high detail. No text or words in the image.`;
            } else if (input.style === "illustrated") {
              thumbnailPrompt = `A vibrant, eye-catching illustrated image for a ${content.theme.toLowerCase()} story titled "${content.title}". The image should be colorful, engaging, and suitable for a language learning app. Style: modern, playful illustration with bold colors and clean lines. No text in the image.`;
            } else {
              // minimalist
              thumbnailPrompt = `A minimalist, clean image representing a ${content.theme.toLowerCase()} story titled "${content.title}". The design should be simple, elegant, and modern with limited colors and geometric shapes. Style: minimalist design, flat colors, negative space. No text in the image.`;
            }

            const { url } = await generateImage({ prompt: thumbnailPrompt });

            // Update the content with new thumbnail and style
            await updateGeneratedContent(contentId, {
              thumbnailUrl: url,
              thumbnailStyle: input.style,
            });

            successCount++;
          } catch (error) {
            console.error(
              `[Bulk Thumbnail Regeneration] Error for content ${contentId}:`,
              error
            );
            errors.push(
              `Content ${contentId}: ${error instanceof Error ? error.message : "Unknown error"}`
            );
            failureCount++;
          }
        }

        return {
          success: failureCount === 0,
          successCount,
          failureCount,
          errors: errors.length > 0 ? errors : undefined,
        };
      }),

    regenerateAllToPixar: protectedProcedure.mutation(async ({ ctx }) => {
      const content = await getGeneratedContentByUserId(ctx.user.id);
      const completedStories = content.filter(
        c => c.status === "completed" && c.title
      );

      if (completedStories.length === 0) {
        return { success: true, total: 0, queued: 0 };
      }

      // Fire and forget - process all in background
      const total = completedStories.length;
      (async () => {
        try {
          const { generateImage } = await import("./_core/imageGeneration");
          for (const story of completedStories) {
            try {
              const thumbnailPrompt = buildCuteStoryThumbnailPrompt(
                story.theme,
                story.title
              );
              const { url } = await generateImage({ prompt: thumbnailPrompt });
              if (url) {
                await updateGeneratedContent(story.id, {
                  thumbnailUrl: url,
                  thumbnailStyle: "pixar" as any,
                });
                console.log(
                  `[Pixar Migration] Generated thumbnail for story ${story.id}: ${story.title}`
                );
              }
            } catch (err) {
              console.error(
                `[Pixar Migration] Failed for story ${story.id}:`,
                err
              );
            }
          }
          console.log(
            `[Pixar Migration] Completed! Processed ${total} stories.`
          );
        } catch (err) {
          console.error("[Pixar Migration] Error:", err);
        }
      })();

      return {
        success: true,
        total,
        queued: total,
        message: `Regenerating ${total} story covers in Pixar style. This runs in the background.`,
      };
    }),

    regenerateStory: protectedProcedure
      .input(z.object({ contentId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Get the content to verify ownership
        const content = await getGeneratedContentById(input.contentId);
        if (!content || content.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Content not found or unauthorized",
          });
        }

        // Get vocabulary list for language info
        const vocabLists = await getVocabularyListsByUserId(ctx.user.id);
        const vocabList = vocabLists.find(
          v => v.id === content.vocabularyListId
        );
        if (!vocabList) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Vocabulary list not found",
          });
        }

        try {
          console.log(
            "[Story Regeneration] Starting for content ID:",
            input.contentId
          );

          const words = splitVocabularyInput(vocabList.words);

          // First generate the story content
          const storyResult = await generateStory({
            theme: content.theme,
            vocabularyWords: words,
            targetLanguage: vocabList.targetLanguage,
            proficiencyLevel: vocabList.proficiencyLevel,
            translationLanguage:
              ctx.user.preferredTranslationLanguage || "English",
            mode: content.mode as "podcast" | "film",
            targetSceneCount: content.mode === "film" ? 6 : undefined,
          });

          console.log(
            "[Story Regeneration] Story generated, updating database"
          );

          // Update the content with new story data (keeping original audio/video)
          await updateGeneratedContent(input.contentId, {
            title: storyResult.title,
            storyText: storyResult.storyText,
            lineTranslations: storyResult.lineTranslations as any,
            vocabularyTranslations: storyResult.vocabularyTranslations as any,
            status: "completed",
          });

          return { success: true, title: storyResult.title };
        } catch (error) {
          console.error("[Story Regeneration] Error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to regenerate story",
          });
        }
      }),

    regenerateTitle: protectedProcedure
      .input(z.object({ contentId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        // Get the content to verify ownership
        const content = await getGeneratedContentById(input.contentId);
        if (!content || content.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Content not found or unauthorized",
          });
        }

        // Get vocabulary list for language info
        const vocabLists = await getVocabularyListsByUserId(ctx.user.id);
        const vocabList = vocabLists.find(
          v => v.id === content.vocabularyListId
        );
        if (!vocabList) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Vocabulary list not found",
          });
        }

        try {
          console.log(
            "[Title Regeneration] Starting for content ID:",
            input.contentId
          );
          const { invokeLLM } = await import("./_core/llm");

          const words = splitVocabularyInput(vocabList.words);

          // Generate a new title based on the story content
          const titlePrompt = `Generate a creative, engaging title in ${vocabList.targetLanguage} for a ${content.theme.toLowerCase()} story that uses these vocabulary words: ${words.join(", ")}. The title should be concise (3-8 words), memorable, and capture the essence of a ${content.theme.toLowerCase()} story. Return ONLY the title text, nothing else.`;

          const response = await invokeLLM({
            messages: [
              {
                role: "system",
                content:
                  "You are a creative title generator for language learning stories.",
              },
              { role: "user", content: titlePrompt },
            ],
          });

          const responseContent = response.choices[0]?.message?.content;
          if (!responseContent || typeof responseContent !== "string") {
            throw new Error("Failed to generate new title");
          }
          const newTitle = responseContent.trim();

          console.log("[Title Regeneration] New title:", newTitle);

          // Update the content with new title
          await updateGeneratedContent(input.contentId, {
            title: newTitle,
          });

          return { success: true, title: newTitle };
        } catch (error) {
          console.error("[Title Regeneration] Error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to regenerate title",
          });
        }
      }),

    addVoiceFavorite: protectedProcedure
      .input(
        z.object({
          targetLanguage: z.string(),
          voiceType: z.string(),
          narratorGender: z.enum(["male", "female"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { addVoiceFavorite } = await import("./db");
        await addVoiceFavorite({
          userId: ctx.user.id,
          targetLanguage: input.targetLanguage,
          voiceType: input.voiceType,
          narratorGender: input.narratorGender,
        });
        return { success: true };
      }),

    removeVoiceFavorite: protectedProcedure
      .input(
        z.object({
          targetLanguage: z.string(),
          voiceType: z.string(),
          narratorGender: z.enum(["male", "female"]),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { removeVoiceFavorite } = await import("./db");
        await removeVoiceFavorite(
          ctx.user.id,
          input.targetLanguage,
          input.voiceType,
          input.narratorGender
        );
        return { success: true };
      }),

    getVoiceFavorites: protectedProcedure.query(async ({ ctx }) => {
      const { getVoiceFavoritesByUserId } = await import("./db");
      const favorites = await getVoiceFavoritesByUserId(ctx.user.id);
      return favorites;
    }),

    backfillVocabularyTranslations: protectedProcedure
      .input(z.object({ contentId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const content = await getGeneratedContentById(input.contentId);
        if (!content || content.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Content not found or unauthorized",
          });
        }
        console.log(
          "[backfillVocabularyTranslations] Content fields:",
          Object.keys(content)
        );
        console.log(
          "[backfillVocabularyTranslations] storyText type:",
          typeof content.storyText,
          "length:",
          content.storyText?.length
        );

        // Check if translations already exist
        const hasVocabTranslations =
          content.vocabularyTranslations &&
          Object.keys(content.vocabularyTranslations).length > 0;
        const hasLineTranslations =
          content.lineTranslations &&
          Array.isArray(content.lineTranslations) &&
          content.lineTranslations.length > 0;

        if (hasVocabTranslations && hasLineTranslations) {
          return {
            success: true,
            message: "Translations already exist",
            updated: false,
          };
        }

        try {
          console.log(
            "[backfillVocabularyTranslations] Starting for content ID:",
            input.contentId
          );

          // Get vocabulary list for language info
          const vocabLists = await getVocabularyListsByUserId(ctx.user.id);
          const vocabList = vocabLists.find(
            v => v.id === content.vocabularyListId
          );
          if (!vocabList) {
            throw new TRPCError({
              code: "NOT_FOUND",
              message: "Vocabulary list not found",
            });
          }

          const { invokeLLM } = await import("./_core/llm");
          const isChinese = vocabList.targetLanguage
            .toLowerCase()
            .includes("chinese");
          let vocabularyTranslations = content.vocabularyTranslations || {};

          // Generate vocabulary translations if missing
          if (!hasVocabTranslations) {
            const words = splitVocabularyInput(vocabList.words);
            console.log(
              "[backfillVocabularyTranslations] Processing",
              words.length,
              "words"
            );

            const prompt = `Translate these ${vocabList.targetLanguage} vocabulary words to English and provide example sentences.

Words: ${words.join(", ")}

For EACH word, provide:
- word: the vocabulary word itself
- translation: English translation${isChinese ? "\n- pinyin: romanization" : ""}
- exampleSentences: array of 1-2 simple example sentences

Return ONLY a JSON object where each vocabulary word is a key.`;

            const response = await invokeLLM({
              messages: [
                {
                  role: "system",
                  content:
                    "You are a helpful language learning assistant. Always respond with valid JSON.",
                },
                { role: "user", content: prompt },
              ],
              response_format: { type: "json_object" },
            });

            const messageContent = response.choices[0].message.content;
            console.log(
              "[backfillVocabularyTranslations] Raw LLM response:",
              messageContent
            );
            vocabularyTranslations = JSON.parse(
              typeof messageContent === "string" ? messageContent : "{}"
            );
            console.log(
              "[backfillVocabularyTranslations] Parsed translations:",
              vocabularyTranslations
            );
            console.log(
              "[backfillVocabularyTranslations] Generated translations:",
              Object.keys(vocabularyTranslations)
            );
          } else {
            console.log(
              "[backfillVocabularyTranslations] Vocabulary translations already exist, skipping"
            );
          }

          // Generate line translations if missing
          let lineTranslations = content.lineTranslations;
          console.log(
            "[backfillVocabularyTranslations] Checking line translations:",
            {
              hasLineTranslations,
              hasStoryText: !!content.storyText,
              storyTextLength: content.storyText?.length || 0,
            }
          );
          if (!hasLineTranslations && content.storyText) {
            console.log(
              "[backfillVocabularyTranslations] Generating line translations..."
            );

            // Split story into sentences
            const sentences = content.storyText
              .split(/([.!?。！？]+)/)
              .reduce((acc: string[], curr, idx, arr) => {
                if (idx % 2 === 0 && curr.trim()) {
                  const punctuation = arr[idx + 1] || "";
                  acc.push((curr + punctuation).trim());
                }
                return acc;
              }, [])
              .filter((s: string) => s.length > 0);

            console.log(
              "[backfillVocabularyTranslations] Found",
              sentences.length,
              "sentences to translate"
            );

            const linePrompt = `Translate these ${vocabList.targetLanguage} sentences to English.

Sentences:
${sentences.map((s: string, i: number) => `${i + 1}. ${s}`).join("\n")}

Return a JSON array where each element has:
- original: the original sentence
- english: English translation${isChinese ? "\n- pinyin: romanization" : ""}`;

            const lineResponse = await invokeLLM({
              messages: [
                {
                  role: "system",
                  content:
                    "You are a helpful language learning assistant. Always respond with valid JSON.",
                },
                { role: "user", content: linePrompt },
              ],
              response_format: { type: "json_object" },
            });

            const lineContent = lineResponse.choices[0].message.content;
            console.log(
              "[backfillVocabularyTranslations] Line translations response:",
              lineContent
            );
            const lineData = JSON.parse(
              typeof lineContent === "string" ? lineContent : "{}"
            );

            // Handle both array and object responses
            lineTranslations = Array.isArray(lineData)
              ? lineData
              : lineData.translations
                ? lineData.translations
                : lineData.sentences
                  ? lineData.sentences
                  : Object.values(lineData);

            console.log(
              "[backfillVocabularyTranslations] Generated",
              Array.isArray(lineTranslations) ? lineTranslations.length : 0,
              "line translations"
            );
          }

          // Update the content with translations
          const updateData: any = {};
          if (!hasVocabTranslations) {
            updateData.vocabularyTranslations = vocabularyTranslations;
          }
          if (!hasLineTranslations && lineTranslations) {
            updateData.lineTranslations = lineTranslations;
          }

          // Only update if there's data to update
          if (Object.keys(updateData).length > 0) {
            await updateGeneratedContent(input.contentId, updateData);
          }

          return {
            success: true,
            message: `Successfully generated translations for ${Object.keys(vocabularyTranslations).length} words`,
            updated: true,
            wordCount: Object.keys(vocabularyTranslations).length,
          };
        } catch (error) {
          console.error("[backfillVocabularyTranslations] Error:", error);
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "Failed to generate vocabulary translations",
          });
        }
      }),

    convertToFilm: protectedProcedure
      .input(
        z.object({
          contentId: z.number(),
          cinematicStyle: z.string().default("cinematic"),
          audioDuration: z.number().optional(), // Podcast audio duration in seconds (auto-detected on client)
          targetVideoDuration: z
            .number()
            .min(30)
            .max(90)
            .optional()
            .default(30),
          backgroundMusic: z
            .enum([
              "calm",
              "upbeat",
              "dramatic",
              "adventure",
              "suspenseful",
              "romantic",
              "mysterious",
              "comedic",
              "energetic",
              "melancholic",
              "triumphant",
              "peaceful",
              "none",
            ])
            .optional()
            .default("none"),
          musicVolume: z.number().min(0).max(100).optional().default(20),
          selectedMusicTrack: z.string().optional(),
          addSubtitles: z.boolean().optional().default(true),
          subtitleFontSize: z
            .enum(["small", "medium", "large"])
            .optional()
            .default("medium"),
          subtitlePosition: z
            .enum(["top", "bottom"])
            .optional()
            .default("bottom"),
          subtitleColor: z
            .enum(["white", "yellow", "cyan"])
            .optional()
            .default("white"),
        })
      )
      .mutation(async ({ input, ctx }) => {
        // Get the source podcast content
        const sourceContent = await getGeneratedContentById(input.contentId);
        if (!sourceContent || sourceContent.userId !== ctx.user.id) {
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Content not found",
          });
        }
        if (sourceContent.mode !== "podcast") {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Only podcast content can be converted to film",
          });
        }
        if (!sourceContent.storyText) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Source content has no story text",
          });
        }

        const targetVideoDuration = Math.ceil(input.targetVideoDuration || 30);
        console.log(
          `[convertToFilm] Target video duration: ${targetVideoDuration}s (requested: ${input.targetVideoDuration}, audioDuration: ${input.audioDuration}, storyWords: ${sourceContent.storyText.split(/\s+/).length})`
        );
        const filmNarration = resolveFilmNarrationSettings(
          sourceContent.voiceType,
          sourceContent.narratorGender
        );

        // Get vocabulary list for language info
        const vocabLists = await getVocabularyListsByUserId(ctx.user.id);
        const matchingList = vocabLists.find(
          v => v.id === sourceContent.vocabularyListId
        );
        const targetLanguage = matchingList?.targetLanguage || "Unknown";
        const proficiencyLevel = matchingList?.proficiencyLevel || "B1";
        const vocabularyWords = matchingList?.words
          ? splitVocabularyInput(matchingList.words)
          : [];

        // Calculate difficulty level
        const difficultyLevel = calculateDifficultyLevel(
          targetLanguage,
          proficiencyLevel
        );

        // Create new content entry for the film version
        const filmContent = await createGeneratedContent({
          userId: ctx.user.id,
          vocabularyListId: sourceContent.vocabularyListId,
          mode: "film",
          theme: sourceContent.theme,
          title: sourceContent.title || `Film: ${sourceContent.theme}`,
          titleTranslation: sourceContent.titleTranslation,
          difficultyLevel,
          voiceType: filmNarration.voiceType,
          narratorGender: filmNarration.narratorGender,
          cinematicStyle: input.cinematicStyle,
          musicVolume: input.musicVolume,
          selectedMusicTrack: input.selectedMusicTrack,
          storyText: sourceContent.storyText,
          lineTranslations: sourceContent.lineTranslations as any,
          vocabularyTranslations: sourceContent.vocabularyTranslations as any,
          thumbnailUrl: sourceContent.thumbnailUrl,
          status: "generating",
          sourceContentId: input.contentId, // Link back to source podcast
        });

        // Start async film generation (reuses existing story text)
        (async () => {
          try {
            const { updateContentProgress } = await import("./db");

            await updateContentProgress(
              filmContent.id,
              10,
              "Preparing film conversion..."
            );

            // Generate film from existing story text
            await updateContentProgress(
              filmContent.id,
              20,
              "Generating video clips..."
            );

            const film = await generateFilm(
              {
                targetLanguage,
                proficiencyLevel,
                vocabularyWords,
                theme: sourceContent.theme,
                cinematicStyle: input.cinematicStyle,
                targetVideoDuration,
                backgroundMusic: input.backgroundMusic,
                musicVolume: input.musicVolume,
                selectedMusicTrack: input.selectedMusicTrack,
                addSubtitles: input.addSubtitles,
                subtitleFontSize: input.subtitleFontSize,
                subtitlePosition: input.subtitlePosition,
                subtitleColor: input.subtitleColor,
                voiceType: filmNarration.voiceType,
                narratorGender: filmNarration.narratorGender,
              },
              sourceContent.storyText,
              async (stage: string, progress: number) => {
                await updateContentProgress(
                  filmContent.id,
                  20 + Math.floor(progress * 0.7),
                  stage
                );
              }
            );

            await updateContentProgress(filmContent.id, 95, "Finalizing...");

            await updateGeneratedContent(filmContent.id, {
              videoUrl: film.videoUrl,
              thumbnailUrl: film.thumbnailUrl || sourceContent.thumbnailUrl,
              transcript: film.transcript,
              audioAlignment: film.audioAlignment || null,
              status: "completed",
              progress: 100,
              progressStage: "Completed",
            });

            // Send notification
            const db = await getDb();
            if (db) {
              const { notifications } = await import("../drizzle/schema");
              await db.insert(notifications).values({
                userId: ctx.user.id,
                type: "story_ready",
                title: "Film conversion complete! 🎬",
                content: `Your podcast "${sourceContent.title}" has been converted to a film. Click to watch it now!`,
                relatedContentId: filmContent.id,
                isRead: false,
              });
            }
          } catch (error) {
            console.error("[convertToFilm] Error:", error);
            await updateGeneratedContent(filmContent.id, {
              status: "failed",
              failureReason:
                error instanceof Error ? error.message : String(error),
            });
          }
        })();

        return { contentId: filmContent.id };
      }),

    getLinkedVersions: protectedProcedure
      .input(z.object({ contentId: z.number() }))
      .query(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { generatedContent } = await import("../drizzle/schema");
        const { eq, and, or } = await import("drizzle-orm");
        const db = await getDb();

        // Get the current content first
        const current = await getGeneratedContentById(input.contentId);
        if (!current || current.userId !== ctx.user.id) return [];

        // Find all linked versions:
        // 1. If this content has a sourceContentId, find the source and all its derivatives
        // 2. If this content IS a source, find all derivatives
        const sourceId = current.sourceContentId || current.id;

        const versions = await db!
          .select({
            id: generatedContent.id,
            mode: generatedContent.mode,
            title: generatedContent.title,
            titleTranslation: generatedContent.titleTranslation,
            status: generatedContent.status,
            progress: generatedContent.progress,
            progressStage: generatedContent.progressStage,
            thumbnailUrl: generatedContent.thumbnailUrl,
            generatedAt: generatedContent.generatedAt,
            sourceContentId: generatedContent.sourceContentId,
          })
          .from(generatedContent)
          .where(
            and(
              eq(generatedContent.userId, ctx.user.id),
              or(
                eq(generatedContent.id, sourceId),
                eq(generatedContent.sourceContentId, sourceId)
              )
            )
          );

        // Filter out the current content and return the rest
        return versions.filter((v: { id: number }) => v.id !== input.contentId);
      }),

    getConversionProgress: protectedProcedure
      .input(z.object({ contentId: z.number() }))
      .query(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { generatedContent } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const db = await getDb();

        // Find any film being generated from this podcast
        const conversions = await db!
          .select({
            id: generatedContent.id,
            status: generatedContent.status,
            progress: generatedContent.progress,
            progressStage: generatedContent.progressStage,
            title: generatedContent.title,
          })
          .from(generatedContent)
          .where(
            and(
              eq(generatedContent.userId, ctx.user.id),
              eq(generatedContent.sourceContentId, input.contentId),
              eq(generatedContent.mode, "film")
            )
          );

        // Return the most recent active conversion (generating or just completed)
        const active = conversions.find(
          (c: { status: string }) => c.status === "generating"
        );
        const completed = conversions.find(
          (c: { status: string }) => c.status === "completed"
        );
        return active || completed || null;
      }),
  }),

  progress: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const progress = await getLearningProgressByUserId(ctx.user.id);
      return progress;
    }),

    getWordMastery: protectedProcedure
      .input(z.object({ targetLanguage: z.string().optional() }))
      .query(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { wordMastery } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const { calculateMasteryLevel } = await import("./spacedRepetition");
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const whereConditions = input.targetLanguage
          ? and(
              eq(wordMastery.userId, ctx.user.id),
              eq(wordMastery.targetLanguage, input.targetLanguage)
            )
          : eq(wordMastery.userId, ctx.user.id);

        const words = await db
          .select()
          .from(wordMastery)
          .where(whereConditions);

        const wordsWithMastery = words.map(word => ({
          ...word,
          masteryLevel: calculateMasteryLevel(word),
        }));

        return wordsWithMastery;
      }),

    getStatistics: protectedProcedure
      .input(z.object({ targetLanguage: z.string().optional() }))
      .query(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { wordMastery, quizAttempts } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const { calculateMasteryLevel } = await import("./spacedRepetition");
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const whereConditions = input.targetLanguage
          ? and(
              eq(wordMastery.userId, ctx.user.id),
              eq(wordMastery.targetLanguage, input.targetLanguage)
            )
          : eq(wordMastery.userId, ctx.user.id);

        const words = await db
          .select()
          .from(wordMastery)
          .where(whereConditions);

        const totalWords = words.length;
        const mastered = words.filter(
          w => calculateMasteryLevel(w) >= 80
        ).length;
        const learning = words.filter(w => {
          const level = calculateMasteryLevel(w);
          return level >= 40 && level < 80;
        }).length;
        const struggling = words.filter(
          w => calculateMasteryLevel(w) < 40
        ).length;

        const quizData = await db
          .select()
          .from(quizAttempts)
          .where(eq(quizAttempts.userId, ctx.user.id));

        const totalQuizzes = quizData.length;
        const averageScore =
          totalQuizzes > 0
            ? quizData.reduce(
                (sum, q) => sum + (q.score / q.totalQuestions) * 100,
                0
              ) / totalQuizzes
            : 0;

        const sortedAttempts = quizData.sort(
          (a, b) => b.completedAt.getTime() - a.completedAt.getTime()
        );
        let currentStreak = 0;
        if (sortedAttempts.length > 0) {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          let checkDate = new Date(today);

          for (const attempt of sortedAttempts) {
            const attemptDate = new Date(attempt.completedAt);
            attemptDate.setHours(0, 0, 0, 0);

            if (attemptDate.getTime() === checkDate.getTime()) {
              currentStreak++;
              checkDate.setDate(checkDate.getDate() - 1);
            } else if (attemptDate.getTime() < checkDate.getTime()) {
              break;
            }
          }
        }

        const now = new Date();
        const wordsDue = words.filter(w => w.nextReviewDate <= now).length;

        return {
          totalWords,
          mastered,
          learning,
          struggling,
          totalQuizzes,
          averageScore: Math.round(averageScore),
          currentStreak,
          wordsDue,
        };
      }),

    getActivityCalendar: protectedProcedure
      .input(z.object({ days: z.number().default(90) }))
      .query(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { quizAttempts } = await import("../drizzle/schema");
        const { eq, gte, and } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - input.days);

        const attempts = await db
          .select()
          .from(quizAttempts)
          .where(
            and(
              eq(quizAttempts.userId, ctx.user.id),
              gte(quizAttempts.completedAt, startDate)
            )
          );

        const activityByDate: Record<string, number> = {};
        attempts.forEach(attempt => {
          const dateKey = attempt.completedAt.toISOString().split("T")[0];
          activityByDate[dateKey] = (activityByDate[dateKey] || 0) + 1;
        });

        return activityByDate;
      }),

    getDifficultyProgression: protectedProcedure
      .input(z.object({ targetLanguage: z.string().optional() }))
      .query(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { generatedContent, vocabularyLists, storyProgress } =
          await import("../drizzle/schema");
        const { eq, and, desc } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Get all completed stories for the user
        const stories = await db
          .select({
            id: generatedContent.id,
            difficultyLevel: generatedContent.difficultyLevel,
            generatedAt: generatedContent.generatedAt,
            targetLanguage: vocabularyLists.targetLanguage,
          })
          .from(generatedContent)
          .innerJoin(
            vocabularyLists,
            eq(generatedContent.vocabularyListId, vocabularyLists.id)
          )
          .where(
            and(
              eq(generatedContent.userId, ctx.user.id),
              eq(generatedContent.status, "completed"),
              input.targetLanguage
                ? eq(vocabularyLists.targetLanguage, input.targetLanguage)
                : undefined
            )
          )
          .orderBy(desc(generatedContent.generatedAt));

        // Filter out stories without difficulty levels
        const storiesWithDifficulty = stories.filter(s => s.difficultyLevel);

        // Calculate difficulty distribution
        const difficultyDistribution: Record<string, number> = {};
        storiesWithDifficulty.forEach(story => {
          const level = story.difficultyLevel!;
          difficultyDistribution[level] =
            (difficultyDistribution[level] || 0) + 1;
        });

        // Calculate progression timeline (group by month)
        const progressionTimeline: Array<{
          month: string;
          difficulties: Record<string, number>;
        }> = [];

        const timelineMap = new Map<string, Record<string, number>>();
        storiesWithDifficulty.forEach(story => {
          const date = new Date(story.generatedAt);
          const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

          if (!timelineMap.has(monthKey)) {
            timelineMap.set(monthKey, {});
          }

          const monthData = timelineMap.get(monthKey)!;
          const level = story.difficultyLevel!;
          monthData[level] = (monthData[level] || 0) + 1;
        });

        // Convert map to sorted array
        const sortedMonths = Array.from(timelineMap.entries())
          .sort((a, b) => a[0].localeCompare(b[0]))
          .map(([month, difficulties]) => ({ month, difficulties }));

        // Calculate current level (most recent stories)
        const recentStories = storiesWithDifficulty.slice(0, 5);
        const currentLevel =
          recentStories.length > 0 ? recentStories[0].difficultyLevel : null;

        // Calculate highest level achieved
        const difficultyOrder = [
          "A1",
          "A2",
          "B1",
          "B2",
          "C1",
          "C2",
          "HSK 1",
          "HSK 2",
          "HSK 3",
          "HSK 4",
          "HSK 5",
          "HSK 6",
        ];
        const levelsAchieved = Object.keys(difficultyDistribution);
        const highestLevel =
          levelsAchieved.length > 0
            ? levelsAchieved.reduce((highest, level) => {
                const currentIndex = difficultyOrder.indexOf(level);
                const highestIndex = difficultyOrder.indexOf(highest);
                return currentIndex > highestIndex ? level : highest;
              }, levelsAchieved[0])
            : null;

        return {
          totalStories: storiesWithDifficulty.length,
          difficultyDistribution,
          progressionTimeline: sortedMonths,
          currentLevel,
          highestLevel,
        };
      }),
  }),

  vocabulary: router({
    getLists: protectedProcedure.query(async ({ ctx }) => {
      const lists = await getVocabularyListsByUserId(ctx.user.id);
      return lists;
    }),
  }),

  quiz: router({
    generate: protectedProcedure
      .input(z.object({ contentId: z.number() }))
      .mutation(async ({ input, ctx }) => {
        const content = await getGeneratedContentById(input.contentId);
        if (!content || content.userId !== ctx.user.id) {
          throw new Error("Content not found");
        }

        const vocabList = await getVocabularyListsByUserId(ctx.user.id);
        const matchingList = vocabList.find(
          v => v.id === content.vocabularyListId
        );
        if (!matchingList) {
          throw new Error("Vocabulary list not found");
        }

        const words = splitVocabularyInput(matchingList.words);
        const translationLanguage = normalizeLearningLanguage(
          ctx.user.preferredTranslationLanguage ||
          ctx.user.preferredLanguage ||
          "English",
        );
        const { invokeLLM } = await import("./_core/llm");
        const { getDb } = await import("./db");
        const { wordMastery } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const { prioritizeWordsForQuiz } = await import("./spacedRepetition");
        const db = await getDb();

        // Get word mastery data for prioritization
        let selectedWords = words;
        if (db) {
          const masteryRecords = await db
            .select()
            .from(wordMastery)
            .where(
              and(
                eq(wordMastery.userId, ctx.user.id),
                eq(wordMastery.targetLanguage, matchingList.targetLanguage)
              )
            );

          // Create a map of existing mastery records
          const masteryMap = new Map(
            masteryRecords.map(record => [record.word.toLowerCase(), record])
          );

          // Build word data with mastery info
          const wordData = words.map(word => {
            const mastery = masteryMap.get(word.toLowerCase());
            return {
              word,
              easinessFactor: mastery?.easinessFactor ?? 2500,
              interval: mastery?.interval ?? 0,
              repetitions: mastery?.repetitions ?? 0,
              nextReviewDate: mastery?.nextReviewDate ?? new Date(),
              correctCount: mastery?.correctCount ?? 0,
              incorrectCount: mastery?.incorrectCount ?? 0,
            };
          });

          // Prioritize words using SRS algorithm
          const prioritized = prioritizeWordsForQuiz(wordData, 5);
          selectedWords = prioritized.map(w => w.word);
        }

        // Generate quiz questions using AI
        const response = await invokeLLM({
          messages: [
            {
              role: "system",
              content: `You are a language learning quiz generator. Generate multiple-choice questions to test vocabulary comprehension in ${matchingList.targetLanguage} at ${matchingList.proficiencyLevel} level. Write every question, answer option, and explanation in ${translationLanguage}.`,
            },
            {
              role: "user",
              content: `Generate 5 multiple-choice questions based on these vocabulary words: ${selectedWords.join(", ")}. Each question should test understanding of word meaning, usage, or context. Translate meanings into ${translationLanguage}; do not default to English unless ${translationLanguage} is English. Return JSON with this structure:
{
  "questions": [
    {
      "word": "vocabulary word",
      "question": "Question written in ${translationLanguage}",
      "options": ["option1", "option2", "option3", "option4"],
      "correctIndex": 0,
      "explanation": "Brief explanation of the correct answer"
    }
  ]
}`,
            },
          ],
          response_format: {
            type: "json_schema",
            json_schema: {
              name: "quiz_questions",
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
                      required: [
                        "word",
                        "question",
                        "options",
                        "correctIndex",
                        "explanation",
                      ],
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

        const messageContent = response.choices[0].message.content;
        const contentString =
          typeof messageContent === "string" ? messageContent : "";
        const quizData = JSON.parse(contentString || "{}");
        return quizData;
      }),

    saveAttempt: protectedProcedure
      .input(
        z.object({
          contentId: z.number(),
          score: z.number(),
          totalQuestions: z.number(),
          answers: z.array(
            z.object({
              questionIndex: z.number(),
              selectedIndex: z.number(),
              correct: z.boolean(),
              word: z.string(),
            })
          ),
          targetLanguage: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { quizAttempts, wordMastery } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const { calculateSM2, answerToQuality } =
          await import("./spacedRepetition");
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Save quiz attempt
        await db.insert(quizAttempts).values({
          userId: ctx.user.id,
          contentId: input.contentId,
          score: input.score,
          totalQuestions: input.totalQuestions,
          answers: JSON.stringify(input.answers),
        });

        // Mark quiz challenge as completed
        try {
          const { completeChallenge, TUTORIAL_CHALLENGES } =
            await import("./tutorialRouter");
          await completeChallenge(ctx.user.id, TUTORIAL_CHALLENGES.TAKE_QUIZ);
        } catch (error) {
          console.error("Failed to mark quiz challenge:", error);
        }

        // Calculate XP reward based on score
        const percentage = (input.score / input.totalQuestions) * 100;
        let xpReward = 10; // Base participation XP
        if (percentage === 100)
          xpReward = 50; // Perfect score
        else if (percentage >= 80)
          xpReward = 30; // Great score
        else if (percentage >= 60) xpReward = 20; // Good score

        // Award XP and update streak
        const { userStats } = await import("../drizzle/schema");

        // Get or create user stats
        const existingStats = await db
          .select()
          .from(userStats)
          .where(eq(userStats.userId, ctx.user.id))
          .limit(1);

        if (existingStats.length === 0) {
          await db.insert(userStats).values({
            userId: ctx.user.id,
            currentStreak: 0,
            longestStreak: 0,
            lastActivityDate: null,
            totalXp: 0,
            coins: 0,
            level: 1,
            storiesCompleted: 0,
            quizzesCompleted: 0,
            wordsLearned: 0,
          });
        }

        // Calculate new streak
        const stats = await db
          .select()
          .from(userStats)
          .where(eq(userStats.userId, ctx.user.id))
          .limit(1);

        const current = stats[0];
        const now = new Date();
        const today = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate()
        );
        const lastActivity = current.lastActivityDate
          ? new Date(
              current.lastActivityDate.getFullYear(),
              current.lastActivityDate.getMonth(),
              current.lastActivityDate.getDate()
            )
          : null;

        let newStreak = current.currentStreak;
        if (!lastActivity) {
          newStreak = 1;
        } else {
          const daysDiff = Math.floor(
            (today.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24)
          );
          if (daysDiff === 0) {
            // Same day, maintain streak
            newStreak = current.currentStreak;
          } else if (daysDiff === 1) {
            // Consecutive day, increment
            newStreak = current.currentStreak + 1;
          } else {
            // Gap, reset to 1
            newStreak = 1;
          }
        }

        const longestStreak = Math.max(newStreak, current.longestStreak);

        // Calculate level
        const previousLevel = current.level;
        const newTotalXp = current.totalXp + xpReward;
        let newLevel = 1;
        if (newTotalXp >= 100) newLevel = 2;
        if (newTotalXp >= 300) newLevel = 3;
        if (newTotalXp >= 600) newLevel = 4;
        if (newTotalXp >= 1000)
          newLevel = 5 + Math.floor((newTotalXp - 1000) / 500);
        const leveledUp = newLevel > previousLevel;

        // Update user stats
        await db
          .update(userStats)
          .set({
            currentStreak: newStreak,
            longestStreak,
            lastActivityDate: now,
            totalXp: newTotalXp,
            level: newLevel,
            quizzesCompleted: current.quizzesCompleted + 1,
          })
          .where(eq(userStats.userId, ctx.user.id));

        // Check for new achievements
        const { achievements, userAchievements } =
          await import("../drizzle/schema");
        const allAchievements = await db.select().from(achievements);
        const unlockedIds = (
          await db
            .select({ achievementId: userAchievements.achievementId })
            .from(userAchievements)
            .where(eq(userAchievements.userId, ctx.user.id))
        ).map(u => u.achievementId);

        const newlyUnlocked: any[] = [];
        for (const achievement of allAchievements) {
          if (unlockedIds.includes(achievement.id)) continue;

          let shouldUnlock = false;
          const updatedStats = await db
            .select()
            .from(userStats)
            .where(eq(userStats.userId, ctx.user.id))
            .limit(1);
          const latestStats = updatedStats[0];

          if (
            achievement.category === "streak" &&
            latestStats.currentStreak >= achievement.requirement
          ) {
            shouldUnlock = true;
          } else if (
            achievement.category === "quizzes" &&
            latestStats.quizzesCompleted >= achievement.requirement
          ) {
            shouldUnlock = true;
          } else if (
            achievement.category === "stories" &&
            latestStats.storiesCompleted >= achievement.requirement
          ) {
            shouldUnlock = true;
          } else if (
            achievement.category === "vocabulary" &&
            latestStats.wordsLearned >= achievement.requirement
          ) {
            shouldUnlock = true;
          }

          if (shouldUnlock) {
            await db.insert(userAchievements).values({
              userId: ctx.user.id,
              achievementId: achievement.id,
              unlockedAt: new Date(),
            });
            newlyUnlocked.push(achievement);

            // Award achievement XP
            await db
              .update(userStats)
              .set({
                totalXp: latestStats.totalXp + achievement.xpReward,
              })
              .where(eq(userStats.userId, ctx.user.id));
          }
        }

        // Update word mastery for each answer
        for (const answer of input.answers) {
          const word = answer.word.toLowerCase();

          // Get existing mastery record
          const existing = await db
            .select()
            .from(wordMastery)
            .where(
              and(
                eq(wordMastery.userId, ctx.user.id),
                eq(wordMastery.word, word),
                eq(wordMastery.targetLanguage, input.targetLanguage)
              )
            )
            .limit(1);

          const quality = answerToQuality(answer.correct);

          if (existing.length > 0) {
            // Update existing record
            const current = existing[0];
            const sm2Result = calculateSM2(quality, {
              easinessFactor: current.easinessFactor,
              interval: current.interval,
              repetitions: current.repetitions,
              nextReviewDate: current.nextReviewDate,
            });

            await db
              .update(wordMastery)
              .set({
                easinessFactor: sm2Result.easinessFactor,
                interval: sm2Result.interval,
                repetitions: sm2Result.repetitions,
                nextReviewDate: sm2Result.nextReviewDate,
                lastReviewedAt: new Date(),
                correctCount: answer.correct
                  ? current.correctCount + 1
                  : current.correctCount,
                incorrectCount: !answer.correct
                  ? current.incorrectCount + 1
                  : current.incorrectCount,
              })
              .where(eq(wordMastery.id, current.id));
          } else {
            // Create new mastery record
            const sm2Result = calculateSM2(quality, {
              easinessFactor: 2500,
              interval: 0,
              repetitions: 0,
              nextReviewDate: new Date(),
            });

            await db.insert(wordMastery).values({
              userId: ctx.user.id,
              word,
              targetLanguage: input.targetLanguage,
              easinessFactor: sm2Result.easinessFactor,
              interval: sm2Result.interval,
              repetitions: sm2Result.repetitions,
              nextReviewDate: sm2Result.nextReviewDate,
              lastReviewedAt: new Date(),
              correctCount: answer.correct ? 1 : 0,
              incorrectCount: !answer.correct ? 1 : 0,
            });
          }
        }

        return {
          success: true,
          xpEarned: xpReward,
          newStreak,
          newLevel,
          previousLevel,
          leveledUp,
          totalXp: newTotalXp,
          achievementsUnlocked: newlyUnlocked,
        };
      }),

    getAttempts: protectedProcedure
      .input(z.object({ contentId: z.number() }))
      .query(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { quizAttempts } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const attempts = await db
          .select()
          .from(quizAttempts)
          .where(
            and(
              eq(quizAttempts.userId, ctx.user.id),
              eq(quizAttempts.contentId, input.contentId)
            )
          )
          .orderBy(quizAttempts.completedAt);

        return attempts;
      }),
  }),

  batch: router({
    uploadCSV: protectedProcedure
      .input(
        z.object({
          name: z.string(),
          csvContent: z.string(),
        })
      )
      .mutation(async ({ input, ctx }) => {
        const { parseCSV } = await import("./csvParser");
        const { getDb } = await import("./db");
        const { batchJobs } = await import("../drizzle/schema");
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        // Parse and validate CSV
        const items = parseCSV(input.csvContent);

        if (items.length === 0) {
          throw new Error("CSV must contain at least one valid row");
        }

        if (items.length > 100) {
          throw new Error("Batch size limited to 100 items");
        }

        // Create batch job
        const result = await db.insert(batchJobs).values({
          userId: ctx.user.id,
          name: input.name,
          totalItems: items.length,
          completedItems: 0,
          failedItems: 0,
          status: "pending",
          csvData: JSON.stringify(items),
        });

        const jobId = Number(result[0].insertId);

        // Start processing in background (non-blocking)
        processBatchJob(jobId).catch(error => {
          console.error(`Batch job ${jobId} failed:`, error);
        });

        return { jobId, totalItems: items.length };
      }),

    getJobs: protectedProcedure.query(async ({ ctx }) => {
      const { getDb } = await import("./db");
      const { batchJobs } = await import("../drizzle/schema");
      const { eq, desc } = await import("drizzle-orm");
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const jobs = await db
        .select()
        .from(batchJobs)
        .where(eq(batchJobs.userId, ctx.user.id))
        .orderBy(desc(batchJobs.createdAt));

      return jobs;
    }),

    getJob: protectedProcedure
      .input(z.object({ jobId: z.number() }))
      .query(async ({ input, ctx }) => {
        const { getDb } = await import("./db");
        const { batchJobs } = await import("../drizzle/schema");
        const { eq, and } = await import("drizzle-orm");
        const db = await getDb();
        if (!db) throw new Error("Database not available");

        const job = await db
          .select()
          .from(batchJobs)
          .where(
            and(
              eq(batchJobs.id, input.jobId),
              eq(batchJobs.userId, ctx.user.id)
            )
          )
          .limit(1);

        if (job.length === 0) {
          throw new Error("Batch job not found");
        }

        return job[0];
      }),

    downloadTemplate: publicProcedure.query(() => {
      const { generateCSVTemplate } = require("./csvParser");
      return { template: generateCSVTemplate() };
    }),

    // Backfill difficulty levels for existing stories
    backfillDifficultyLevels: protectedProcedure.mutation(async ({ ctx }) => {
      // Only allow admin users to run backfill
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can run backfill operations",
        });
      }

      const result = await backfillDifficultyLevels();
      return result;
    }),
  }),

  organization: organizationRouter,
  class: classRouter,
  assignment: assignmentRouter,
  enrollment: enrollmentRouter,
  analytics: analyticsRouter,
});

export type AppRouter = typeof appRouter;

/**
 * Background processor for batch jobs
 */
async function processBatchJob(jobId: number) {
  const { getDb } = await import("./db");
  const { batchJobs, vocabularyLists, generatedContent } =
    await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  const { generateStory, generatePodcast, generateFilm } =
    await import("./contentGeneration");
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Fetch job
  const jobs = await db
    .select()
    .from(batchJobs)
    .where(eq(batchJobs.id, jobId))
    .limit(1);
  if (jobs.length === 0) return;

  const job = jobs[0];
  const items = JSON.parse(job.csvData) as import("./csvParser").BatchItem[];
  const results: Array<{ contentId?: number; error?: string }> = [];

  // Update status to processing
  await db
    .update(batchJobs)
    .set({ status: "processing" })
    .where(eq(batchJobs.id, jobId));

  let completedCount = 0;
  let failedCount = 0;

  // Process each item
  for (const item of items) {
    let contentId: number | undefined;
    try {
      // 1. Create vocabulary list
      const vocabResult = await db.insert(vocabularyLists).values({
        userId: job.userId,
        targetLanguage: item.targetLanguage,
        proficiencyLevel: item.proficiencyLevel,
        words: item.vocabularyWords.join(", "),
        topicPrompt: item.topicPrompt,
      });

      const vocabularyListId = Number(vocabResult[0].insertId);

      // 2. Generate story
      // TODO: Fetch user's preferredTranslationLanguage from database
      const story = await generateStory({
        targetLanguage: item.targetLanguage,
        proficiencyLevel: item.proficiencyLevel,
        vocabularyWords: item.vocabularyWords,
        theme: item.theme,
        topicPrompt: item.topicPrompt,
        translationLanguage: "English", // Default for batch jobs
        mode: item.format,
        targetSceneCount: item.format === "film" ? 6 : undefined,
      });

      // 3. Create content record with AI-generated title
      const finalTitle =
        story.title ||
        (item.topicPrompt
          ? `${item.theme}: ${item.topicPrompt.substring(0, 50)}${item.topicPrompt.length > 50 ? "..." : ""}}`
          : `${item.theme} ${item.format === "podcast" ? "Podcast" : "Film"} - ${item.targetLanguage}`);

      const contentResult = await db.insert(generatedContent).values({
        userId: job.userId,
        vocabularyListId,
        mode: item.format,
        theme: item.theme,
        title: finalTitle,
        titleTranslation: story.titleTranslation,
        voiceType: item.voiceType,
        cinematicStyle: item.cinematicStyle,
        storyText: story.storyText,
        lineTranslations: story.lineTranslations as any,
        vocabularyTranslations: story.vocabularyTranslations as any,
        status: "generating",
      });

      contentId = Number(contentResult[0].insertId);

      // 4. Generate audio/video
      let audioUrl: string | undefined;
      let videoUrl: string | undefined;
      let thumbnailUrl: string | undefined;
      let audioAlignment: any = null;

      if (item.format === "podcast" && item.voiceType) {
        const podcast = (await generatePodcast(
          {
            ...item,
            voiceType: item.voiceType,
          },
          story.storyText
        )) as { audioUrl: string; transcript: string; audioAlignment?: any };
        audioUrl = podcast.audioUrl;
        if (podcast.audioAlignment) {
          audioAlignment = podcast.audioAlignment;
        }
      } else if (item.format === "film" && item.cinematicStyle) {
        const filmNarration = resolveFilmNarrationSettings(
          item.voiceType,
          undefined
        );
        const film = await generateFilm(
          {
            ...item,
            cinematicStyle: item.cinematicStyle,
            voiceType: filmNarration.voiceType,
            narratorGender: filmNarration.narratorGender,
            sceneBeats: story.visualBeats,
          },
          story.storyText
        );
        videoUrl = film.videoUrl;
        thumbnailUrl = film.thumbnailUrl;
      }

      // 5. Update content with URLs
      await db
        .update(generatedContent)
        .set({
          audioUrl,
          audioAlignment,
          videoUrl,
          thumbnailUrl,
          status: "completed",
        })
        .where(eq(generatedContent.id, contentId));

      results.push({ contentId });
      completedCount++;
    } catch (error) {
      console.error("Error processing batch item:", error);
      results.push({
        error: error instanceof Error ? error.message : String(error),
      });
      failedCount++;

      // Mark the content as failed if it was created
      if (contentId) {
        try {
          await db
            .update(generatedContent)
            .set({ status: "failed" })
            .where(eq(generatedContent.id, contentId));
        } catch (updateError) {
          console.error("Failed to update content status:", updateError);
        }
      }
    }

    // Update progress
    await db
      .update(batchJobs)
      .set({
        completedItems: completedCount,
        failedItems: failedCount,
      })
      .where(eq(batchJobs.id, jobId));
  }

  // Mark job as completed
  await db
    .update(batchJobs)
    .set({
      status: failedCount === items.length ? "failed" : "completed",
      results: JSON.stringify(results),
    })
    .where(eq(batchJobs.id, jobId));
}
