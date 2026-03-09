import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { 
  userDigests, 
  collections, 
  generatedContent,
  InsertUserDigest
} from "../drizzle/schema";
import { eq, and, gte, desc } from "drizzle-orm";

export const digestRouter = router({
  /**
   * Generate a weekly creator digest for the current user
   */
  generateCreatorDigest: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get user's collections
      const userCollections = await db
        .select({
          id: collections.id,
          name: collections.name,
          viewCount: collections.viewCount,
          cloneCount: collections.cloneCount,
        })
        .from(collections)
        .where(eq(collections.userId, ctx.user.id));

      if (userCollections.length === 0) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "You need to create at least one collection first" 
        });
      }

      // Calculate stats
      const totalViews = userCollections.reduce((sum, c) => sum + c.viewCount, 0);
      const totalClones = userCollections.reduce((sum, c) => sum + c.cloneCount, 0);

      // Find top performing collection
      const topCollection = userCollections.reduce((prev, current) => 
        (prev.viewCount + prev.cloneCount) > (current.viewCount + current.cloneCount) ? prev : current
      );

      const digestData = {
        totalViews,
        totalClones,
        topCollection,
        collections: userCollections,
      };

      // Calculate week dates
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);
      const weekEnd = new Date(now);

      // Store digest in database
      const digestRecord: InsertUserDigest = {
        userId: ctx.user.id,
        digestType: "weekly_creator",
        title: "📊 Your Weekly Creator Digest",
        content: digestData as any,
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        isRead: false,
      };
      
      const [result] = await db.insert(userDigests).values(digestRecord).$returningId();

      return { 
        success: true, 
        digestId: result.id,
        message: "Creator digest generated successfully!"
      };
    }),

  /**
   * Generate story highlights digest for the current user
   */
  generateStoryHighlights: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get user's recent stories (last 7 days, max 3 stories)
      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const recentStories = await db
        .select({
          id: generatedContent.id,
          title: generatedContent.title,
          titleTranslation: generatedContent.titleTranslation,
          theme: generatedContent.theme,
          mode: generatedContent.mode,
          thumbnailUrl: generatedContent.thumbnailUrl,
          storyText: generatedContent.storyText,
          generatedAt: generatedContent.generatedAt,
        })
        .from(generatedContent)
        .where(
          and(
            eq(generatedContent.userId, ctx.user.id),
            eq(generatedContent.status, "completed"),
            gte(generatedContent.generatedAt, weekAgo)
          )
        )
        .orderBy(desc(generatedContent.generatedAt))
        .limit(3);

      if (recentStories.length === 0) {
        throw new TRPCError({ 
          code: "BAD_REQUEST", 
          message: "You haven't created any stories in the last 7 days" 
        });
      }

      // Extract excerpts
      const storiesWithExcerpts = recentStories.map(story => ({
        ...story,
        excerpt: story.storyText.substring(0, 150) + (story.storyText.length > 150 ? "..." : ""),
      }));

      const digestData = {
        stories: storiesWithExcerpts,
        totalStories: recentStories.length,
      };

      // Calculate week dates
      const now = new Date();
      const weekStart = new Date(now);
      weekStart.setDate(weekStart.getDate() - 7);
      const weekEnd = new Date(now);

      // Store digest in database
      const digestRecord: InsertUserDigest = {
        userId: ctx.user.id,
        digestType: "story_highlights",
        title: "✨ Your Story Highlights",
        content: digestData as any,
        weekStartDate: weekStart,
        weekEndDate: weekEnd,
        isRead: false,
      };
      
      const [result] = await db.insert(userDigests).values(digestRecord).$returningId();

      return { 
        success: true, 
        digestId: result.id,
        message: "Story highlights generated successfully!"
      };
    }),

  /**
   * Get all digests for the current user
   */
  getMyDigests: protectedProcedure
    .input(z.object({
      limit: z.number().min(1).max(50).default(10),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const digests = await db
        .select()
        .from(userDigests)
        .where(eq(userDigests.userId, ctx.user.id))
        .orderBy(desc(userDigests.createdAt))
        .limit(input?.limit || 10);

      return digests.map(digest => ({
        ...digest,
        content: typeof digest.content === 'string' ? JSON.parse(digest.content) : digest.content,
      }));
    }),

  /**
   * Get a specific digest by ID
   */
  getDigestById: protectedProcedure
    .input(z.object({
      digestId: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [digest] = await db
        .select()
        .from(userDigests)
        .where(
          and(
            eq(userDigests.id, input.digestId),
            eq(userDigests.userId, ctx.user.id)
          )
        );

      if (!digest) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Digest not found" });
      }

      return {
        ...digest,
        content: typeof digest.content === 'string' ? JSON.parse(digest.content) : digest.content,
      };
    }),

  /**
   * Mark a digest as read
   */
  markAsRead: protectedProcedure
    .input(z.object({
      digestId: z.number(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      await db
        .update(userDigests)
        .set({ isRead: true })
        .where(
          and(
            eq(userDigests.id, input.digestId),
            eq(userDigests.userId, ctx.user.id)
          )
        );

      return { success: true };
    }),

  /**
   * Get unread digest count
   */
  getUnreadCount: protectedProcedure
    .query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const result = await db
        .select()
        .from(userDigests)
        .where(
          and(
            eq(userDigests.userId, ctx.user.id),
            eq(userDigests.isRead, false)
          )
        );

      return { count: result.length };
    }),
});
