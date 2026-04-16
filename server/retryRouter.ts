import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { resolveFilmNarrationSettings } from "@shared/filmDefaults";
import { protectedProcedure, router } from "./_core/trpc";

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1 * 60 * 1000, 5 * 60 * 1000, 15 * 60 * 1000]; // 1min, 5min, 15min

/**
 * Calculate if enough time has passed for next retry based on exponential backoff
 */
function canRetry(retryCount: number, lastRetryAt: Date | null): boolean {
  if (retryCount >= MAX_RETRIES) return false;
  if (!lastRetryAt) return true;
  
  const delayIndex = Math.min(retryCount, RETRY_DELAYS.length - 1);
  const requiredDelay = RETRY_DELAYS[delayIndex];
  const timeSinceLastRetry = Date.now() - lastRetryAt.getTime();
  
  return timeSinceLastRetry >= requiredDelay;
}

/**
 * Retry a single failed story generation
 */
async function retryStoryGeneration(contentId: number) {
  const { getDb } = await import("./db");
  const { generatedContent, vocabularyLists } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");
  const { generateStory, generatePodcast, generateFilm } = await import("./contentGeneration");
  
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Fetch the content record
  const contents = await db
    .select()
    .from(generatedContent)
    .where(eq(generatedContent.id, contentId))
    .limit(1);

  if (contents.length === 0) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Content not found" });
  }

  const content = contents[0];

  // Check if retry is allowed
  if (content.status !== "failed") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Only failed stories can be retried" });
  }

  if (content.retryCount >= MAX_RETRIES) {
    throw new TRPCError({ 
      code: "BAD_REQUEST", 
      message: `Maximum retry attempts (${MAX_RETRIES}) reached` 
    });
  }

  // Fetch vocabulary list
  const vocabLists = await db
    .select()
    .from(vocabularyLists)
    .where(eq(vocabularyLists.id, content.vocabularyListId))
    .limit(1);

  if (vocabLists.length === 0) {
    throw new TRPCError({ code: "NOT_FOUND", message: "Vocabulary list not found" });
  }

  const vocabList = vocabLists[0];
  const vocabularyWords = vocabList.words.split(",").map(w => w.trim());

  try {
    // Update status to generating
    await db
      .update(generatedContent)
      .set({ 
        status: "generating",
        retryCount: content.retryCount + 1,
        lastRetryAt: new Date(),
      })
      .where(eq(generatedContent.id, contentId));

    // Generate story
    // TODO: Fetch user's preferredTranslationLanguage from database
    const story = await generateStory({
      targetLanguage: vocabList.targetLanguage,
      proficiencyLevel: vocabList.proficiencyLevel,
      vocabularyWords,
      theme: content.theme,
      topicPrompt: vocabList.topicPrompt || undefined,
      translationLanguage: "English", // Default for retries
      mode: content.mode as "podcast" | "film",
      targetSceneCount: content.mode === "film" ? 6 : undefined,
    });

    // Generate audio/video
    let audioUrl: string | undefined;
    let videoUrl: string | undefined;
    let transcript: string | undefined;
    let thumbnailUrl = content.thumbnailUrl || undefined;

    if (content.mode === "podcast" && content.voiceType) {
      const podcast = await generatePodcast(
        {
          targetLanguage: vocabList.targetLanguage,
          proficiencyLevel: vocabList.proficiencyLevel,
          vocabularyWords,
          theme: content.theme,
          topicPrompt: vocabList.topicPrompt || undefined,
          voiceType: content.voiceType,
        },
        story.storyText
      );
      audioUrl = podcast.audioUrl;
      transcript = podcast.transcript;
    } else if (content.mode === "film" && content.cinematicStyle) {
      const filmNarration = resolveFilmNarrationSettings(
        content.voiceType,
        content.narratorGender,
      );
      const film = await generateFilm(
        {
          targetLanguage: vocabList.targetLanguage,
          proficiencyLevel: vocabList.proficiencyLevel,
          vocabularyWords,
          theme: content.theme,
          topicPrompt: vocabList.topicPrompt || undefined,
          cinematicStyle: content.cinematicStyle,
          voiceType: filmNarration.voiceType,
          narratorGender: filmNarration.narratorGender,
          sceneBeats: story.visualBeats,
        },
        story.storyText
      );
      videoUrl = film.videoUrl;
      transcript = film.transcript;
      thumbnailUrl = film.thumbnailUrl || thumbnailUrl;
    }

    // Update content with success
    await db
      .update(generatedContent)
      .set({
        storyText: story.storyText,
        lineTranslations: story.lineTranslations as any,
        vocabularyTranslations: story.vocabularyTranslations as any,
        audioUrl,
        videoUrl,
        thumbnailUrl,
        transcript,
        status: "completed",
        failureReason: null,
      })
      .where(eq(generatedContent.id, contentId));

    return { success: true, contentId };
  } catch (error) {
    // Mark as failed with reason
    const failureReason = error instanceof Error ? error.message : String(error);
    await db
      .update(generatedContent)
      .set({
        status: "failed",
        failureReason,
      })
      .where(eq(generatedContent.id, contentId));

    throw new TRPCError({ 
      code: "INTERNAL_SERVER_ERROR", 
      message: `Retry failed: ${failureReason}` 
    });
  }
}

export const retryRouter = router({
  /**
   * Manually retry a single failed story
   */
  retryStory: protectedProcedure
    .input(z.object({ contentId: z.number() }))
    .mutation(async ({ input }) => {
      return await retryStoryGeneration(input.contentId);
    }),

  /**
   * Get list of failed stories eligible for retry
   */
  getRetryableStories: protectedProcedure.query(async ({ ctx }) => {
    const { getDb } = await import("./db");
    const { generatedContent } = await import("../drizzle/schema");
    const { eq, and, lt } = await import("drizzle-orm");
    
    const db = await getDb();
    if (!db) return [];

    const stories = await db
      .select()
      .from(generatedContent)
      .where(
        and(
          eq(generatedContent.userId, ctx.user.id),
          eq(generatedContent.status, "failed"),
          lt(generatedContent.retryCount, MAX_RETRIES)
        )
      );

    return stories.map(story => ({
      ...story,
      canRetryNow: canRetry(story.retryCount, story.lastRetryAt),
      nextRetryIn: story.lastRetryAt 
        ? Math.max(0, RETRY_DELAYS[Math.min(story.retryCount, RETRY_DELAYS.length - 1)] - (Date.now() - story.lastRetryAt.getTime()))
        : 0,
    }));
  }),

  /**
   * Automatically retry all eligible failed stories (background job)
   */
  autoRetryFailed: protectedProcedure.mutation(async ({ ctx }) => {
    const { getDb } = await import("./db");
    const { generatedContent } = await import("../drizzle/schema");
    const { eq, and, lt } = await import("drizzle-orm");
    
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Find eligible stories
    const stories = await db
      .select()
      .from(generatedContent)
      .where(
        and(
          eq(generatedContent.userId, ctx.user.id),
          eq(generatedContent.status, "failed"),
          lt(generatedContent.retryCount, MAX_RETRIES)
        )
      );

    const results = [];
    for (const story of stories) {
      if (canRetry(story.retryCount, story.lastRetryAt)) {
        try {
          const result = await retryStoryGeneration(story.id);
          results.push({ contentId: story.id, success: true });
        } catch (error) {
          results.push({ 
            contentId: story.id, 
            success: false, 
            error: error instanceof Error ? error.message : String(error) 
          });
        }
      }
    }

    return { 
      total: stories.length, 
      retried: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results 
    };
  }),
});
