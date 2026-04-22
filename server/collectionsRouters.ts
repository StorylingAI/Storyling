import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "./db";
import { collections, collectionItems, generatedContent, userFollows, notifications, users } from "../drizzle/schema";
import { eq, and, desc, inArray } from "drizzle-orm";
import crypto from "crypto";
import { checkAndAwardCollectionAchievements } from "./collectionAchievements";

export const collectionsRouter = router({
  // Get all collections for the current user
  getMyCollections: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const userCollections = await db
      .select()
      .from(collections)
      .where(eq(collections.userId, ctx.user.id))
      .orderBy(desc(collections.createdAt));

    // Get item counts for each collection
    const collectionsWithCounts = await Promise.all(
      userCollections.map(async (collection) => {
        const items = await db
          .select()
          .from(collectionItems)
          .where(eq(collectionItems.collectionId, collection.id));
        
        return {
          ...collection,
          itemCount: items.length,
        };
      })
    );

    return collectionsWithCounts;
  }),

  // Get a single collection with its items
  getCollectionById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get collection
      const collection = await db
        .select()
        .from(collections)
        .where(eq(collections.id, input.id))
        .limit(1);

      if (collection.length === 0 || collection[0].userId !== ctx.user.id) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Collection not found" });
      }

      // Get collection items with content details
      const items = await db
        .select({
          id: collectionItems.id,
          collectionId: collectionItems.collectionId,
          contentId: collectionItems.contentId,
          position: collectionItems.position,
          addedAt: collectionItems.addedAt,
          content: generatedContent,
        })
        .from(collectionItems)
        .leftJoin(generatedContent, eq(collectionItems.contentId, generatedContent.id))
        .where(eq(collectionItems.collectionId, input.id))
        .orderBy(collectionItems.position);

      return {
        ...collection[0],
        items: items.map(item => ({
          id: item.id,
          collectionId: item.collectionId,
          contentId: item.contentId,
          position: item.position,
          addedAt: item.addedAt,
          content: item.content,
        })),
      };
    }),

  // Create a new collection
  createCollection: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(200),
        description: z.string().optional(),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const result = await db.insert(collections).values({
        userId: ctx.user.id,
        name: input.name,
        description: input.description || null,
        color: input.color || "#8B5CF6",
      });

      return { success: true, collectionId: Number((result as any).insertId) };
    }),

  // Update a collection
  updateCollection: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(200).optional(),
        description: z.string().optional(),
        color: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify ownership
      const collection = await db
        .select()
        .from(collections)
        .where(eq(collections.id, input.id))
        .limit(1);

      if (collection.length === 0 || collection[0].userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Collection not found or unauthorized" });
      }

      const updateData: any = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.color !== undefined) updateData.color = input.color;

      await db
        .update(collections)
        .set(updateData)
        .where(eq(collections.id, input.id));

      return { success: true };
    }),

  // Delete a collection
  deleteCollection: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify ownership
      const collection = await db
        .select()
        .from(collections)
        .where(eq(collections.id, input.id))
        .limit(1);

      if (collection.length === 0 || collection[0].userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Collection not found or unauthorized" });
      }

      // Delete all items in the collection first
      await db
        .delete(collectionItems)
        .where(eq(collectionItems.collectionId, input.id));

      // Delete the collection
      await db
        .delete(collections)
        .where(eq(collections.id, input.id));

      return { success: true };
    }),

  // Add a story to a collection
  addToCollection: protectedProcedure
    .input(
      z.object({
        collectionId: z.number(),
        contentId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify collection ownership
      const collection = await db
        .select()
        .from(collections)
        .where(eq(collections.id, input.collectionId))
        .limit(1);

      if (collection.length === 0 || collection[0].userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Collection not found or unauthorized" });
      }

      // Verify content ownership
      const content = await db
        .select()
        .from(generatedContent)
        .where(eq(generatedContent.id, input.contentId))
        .limit(1);

      if (content.length === 0 || content[0].userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Content not found or unauthorized" });
      }

      // Check if already in collection
      const existing = await db
        .select()
        .from(collectionItems)
        .where(
          and(
            eq(collectionItems.collectionId, input.collectionId),
            eq(collectionItems.contentId, input.contentId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Story already in collection" });
      }

      // Get max position
      const items = await db
        .select()
        .from(collectionItems)
        .where(eq(collectionItems.collectionId, input.collectionId));

      const maxPosition = items.length > 0 ? Math.max(...items.map(i => i.position)) : -1;

      // Add to collection
      await db.insert(collectionItems).values({
        collectionId: input.collectionId,
        contentId: input.contentId,
        position: maxPosition + 1,
      });

      return { success: true };
    }),

  // Remove a story from a collection
  removeFromCollection: protectedProcedure
    .input(
      z.object({
        collectionId: z.number(),
        contentId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify collection ownership
      const collection = await db
        .select()
        .from(collections)
        .where(eq(collections.id, input.collectionId))
        .limit(1);

      if (collection.length === 0 || collection[0].userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Collection not found or unauthorized" });
      }

      // Remove from collection
      await db
        .delete(collectionItems)
        .where(
          and(
            eq(collectionItems.collectionId, input.collectionId),
            eq(collectionItems.contentId, input.contentId)
          )
        );

      return { success: true };
    }),

  // Reorder items in a collection
  reorderCollection: protectedProcedure
    .input(
      z.object({
        collectionId: z.number(),
        itemIds: z.array(z.number()), // Array of collection_item IDs in new order
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify collection ownership
      const collection = await db
        .select()
        .from(collections)
        .where(eq(collections.id, input.collectionId))
        .limit(1);

      if (collection.length === 0 || collection[0].userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Collection not found or unauthorized" });
      }

      // Update positions
      for (let i = 0; i < input.itemIds.length; i++) {
        await db
          .update(collectionItems)
          .set({ position: i })
          .where(eq(collectionItems.id, input.itemIds[i]));
      }

      return { success: true };
    }),

  // Get collections that contain a specific story
  getCollectionsForContent: protectedProcedure
    .input(z.object({ contentId: z.number() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const items = await db
        .select({
          collection: collections,
        })
        .from(collectionItems)
        .leftJoin(collections, eq(collectionItems.collectionId, collections.id))
        .where(
          and(
            eq(collectionItems.contentId, input.contentId),
            eq(collections.userId, ctx.user.id)
          )
        );

      return items.map(item => item.collection).filter(Boolean);
    }),

  // Bulk add multiple stories to a collection
  bulkAddToCollection: protectedProcedure
    .input(
      z.object({
        collectionId: z.number(),
        contentIds: z.array(z.number()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify collection ownership
      const collection = await db
        .select()
        .from(collections)
        .where(eq(collections.id, input.collectionId))
        .limit(1);

      if (collection.length === 0 || collection[0].userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Collection not found or unauthorized" });
      }

      // Verify all content belongs to user
      const contents = await db
        .select()
        .from(generatedContent)
        .where(inArray(generatedContent.id, input.contentIds));

      if (contents.length !== input.contentIds.length || contents.some(c => c.userId !== ctx.user.id)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Some content not found or unauthorized" });
      }

      // Get existing items in collection
      const existingItems = await db
        .select()
        .from(collectionItems)
        .where(eq(collectionItems.collectionId, input.collectionId));

      const existingContentIds = new Set(existingItems.map(item => item.contentId));
      const maxPosition = existingItems.length > 0 ? Math.max(...existingItems.map(i => i.position)) : -1;

      // Filter out stories already in collection
      const newContentIds = input.contentIds.filter(id => !existingContentIds.has(id));

      if (newContentIds.length === 0) {
        return { success: true, added: 0, skipped: input.contentIds.length };
      }

      // Bulk insert new items
      const itemsToInsert = newContentIds.map((contentId, index) => ({
        collectionId: input.collectionId,
        contentId,
        position: maxPosition + 1 + index,
      }));

      await db.insert(collectionItems).values(itemsToInsert);

      return { 
        success: true, 
        added: newContentIds.length, 
        skipped: input.contentIds.length - newContentIds.length 
      };
    }),

  // Generate or regenerate share token for a collection
  generateShareToken: protectedProcedure
    .input(z.object({ collectionId: z.number() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify ownership
      const collection = await db
        .select()
        .from(collections)
        .where(eq(collections.id, input.collectionId))
        .limit(1);

      if (collection.length === 0 || collection[0].userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Collection not found or unauthorized" });
      }

      // Generate unique token
      const shareToken = crypto.randomBytes(32).toString('hex');

      // Update collection with share token
      await db
        .update(collections)
        .set({ shareToken })
        .where(eq(collections.id, input.collectionId));

      return { success: true, shareToken };
    }),

  // Toggle public sharing for a collection
  togglePublicSharing: protectedProcedure
    .input(z.object({ 
      collectionId: z.number(),
      isPublic: z.boolean(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify ownership
      const collection = await db
        .select()
        .from(collections)
        .where(eq(collections.id, input.collectionId))
        .limit(1);

      if (collection.length === 0 || collection[0].userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Collection not found or unauthorized" });
      }

      // If enabling public sharing and no token exists, generate one
      let shareToken = collection[0].shareToken;
      if (input.isPublic && !shareToken) {
        shareToken = crypto.randomBytes(32).toString('hex');
      }

      // Update collection
      await db
        .update(collections)
        .set({ 
          isPublic: input.isPublic,
          shareToken: shareToken || collection[0].shareToken,
        })
        .where(eq(collections.id, input.collectionId));

      // If making collection public, notify followers
      if (input.isPublic && !collection[0].isPublic) {
        // Get all followers
        const followers = await db
          .select({ followerId: userFollows.followerId })
          .from(userFollows)
          .where(eq(userFollows.followingId, ctx.user.id));

        // Create notifications for all followers
        if (followers.length > 0) {
          await db.insert(notifications).values(
            followers.map((follower) => ({
              userId: follower.followerId,
              type: "new_collection" as const,
              title: "New Collection Published",
              content: `${ctx.user.name || "A creator you follow"} published a new collection: ${collection[0].name}`,
              relatedUserId: ctx.user.id,
              relatedCollectionId: input.collectionId,
              isRead: false,
            }))
          );
        }
      }

      return { success: true, shareToken };
    }),

  // Get featured public collections for homepage (no auth required)
  getFeaturedCollections: publicProcedure
    .input(z.object({ limit: z.number().default(10) }).optional())
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const limit = input?.limit || 10;

      // Get featured collections sorted by featured_at date (most recently featured first)
      const publicCollections = await db
        .select({
          id: collections.id,
          name: collections.name,
          description: collections.description,
          color: collections.color,
          shareToken: collections.shareToken,
          cloneCount: collections.cloneCount,
          viewCount: collections.viewCount,
          userId: collections.userId,
          createdAt: collections.createdAt,
        })
        .from(collections)
        .where(and(eq(collections.isPublic, true), eq(collections.isFeatured, true)))
        .orderBy(desc(collections.featuredAt))
        .limit(limit);

      // Get user names for each collection
      const collectionsWithUsers = await Promise.all(
        publicCollections.map(async (collection) => {
          const [user] = await db
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, collection.userId))
            .limit(1);

          // Get item count
          const items = await db
            .select()
            .from(collectionItems)
            .where(eq(collectionItems.collectionId, collection.id));

          return {
            ...collection,
            userName: user?.name || "Anonymous",
            itemCount: items.length,
          };
        })
      );

      return collectionsWithUsers;
    }),

  // Get public collection by share token (no auth required)
  getPublicCollection: publicProcedure
    .input(z.object({ shareToken: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get collection by share token
      const collection = await db
        .select()
        .from(collections)
        .where(eq(collections.shareToken, input.shareToken))
        .limit(1);

      if (collection.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Collection not found" });
      }

      if (!collection[0].isPublic) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This collection is not publicly shared" });
      }

      // Increment view count
      const newViewCount = collection[0].viewCount + 1;
      await db
        .update(collections)
        .set({ viewCount: newViewCount })
        .where(eq(collections.id, collection[0].id));

      // Check milestones asynchronously (don't block response)
      import("./milestoneNotifications").then(({ checkCollectionMilestones }) => {
        checkCollectionMilestones(collection[0].id).catch(console.error);
      });

      // Get items in the collection with content details
      const items = await db
        .select({
          item: collectionItems,
          content: generatedContent,
        })
        .from(collectionItems)
        .leftJoin(generatedContent, eq(collectionItems.contentId, generatedContent.id))
        .where(eq(collectionItems.collectionId, collection[0].id))
        .orderBy(collectionItems.position);

      return {
        ...collection[0],
        items: items.map(({ item, content }) => ({
          ...item,
          content: content && content.status === "completed" ? {
            id: content.id,
            title: content.title,
            theme: content.theme,
            thumbnailUrl: content.thumbnailUrl,
            storyText: content.storyText,
            mode: content.mode,
          } : null,
        })).filter(item => item.content !== null),
      };
    }),

  // Clone a public collection to the current user's account
  cloneCollection: protectedProcedure
    .input(z.object({ shareToken: z.string() }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Get the source collection
      const sourceCollection = await db
        .select()
        .from(collections)
        .where(eq(collections.shareToken, input.shareToken))
        .limit(1);

      if (sourceCollection.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Collection not found" });
      }

      if (!sourceCollection[0].isPublic) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This collection is not publicly shared" });
      }

      // Check if user already cloned this collection (optional: prevent duplicates)
      // For now, we allow multiple clones

      // Create new collection for the current user
      const newCollectionResult = await db.insert(collections).values({
        userId: ctx.user.id,
        name: `${sourceCollection[0].name} (Copy)`,
        description: sourceCollection[0].description,
        color: sourceCollection[0].color,
        isPublic: false, // Cloned collections are private by default
        shareToken: null,
      });

      const newCollectionId = typeof newCollectionResult[0].insertId === 'string'
        ? parseInt(newCollectionResult[0].insertId)
        : Number(newCollectionResult[0].insertId);

      // Get all items from source collection
      const sourceItems = await db
        .select()
        .from(collectionItems)
        .where(eq(collectionItems.collectionId, sourceCollection[0].id))
        .orderBy(collectionItems.position);

      // Copy items to new collection
      if (sourceItems.length > 0) {
        await db.insert(collectionItems).values(
          sourceItems.map((item) => ({
            collectionId: newCollectionId,
            contentId: item.contentId,
            position: item.position,
          }))
        );
      }

      // Increment clone count on source collection
      const newCloneCount = sourceCollection[0].cloneCount + 1;
      await db
        .update(collections)
        .set({ cloneCount: newCloneCount })
        .where(eq(collections.id, sourceCollection[0].id));

      // Check milestones asynchronously (don't block response)
      import("./milestoneNotifications").then(({ checkCollectionMilestones }) => {
        checkCollectionMilestones(sourceCollection[0].id).catch(console.error);
      });

      // Check and award achievements to the collection owner
      const newAchievements = await checkAndAwardCollectionAchievements(
        sourceCollection[0].id,
        sourceCollection[0].userId,
        newCloneCount
      );

      return {
        success: true,
        collectionId: newCollectionId,
        itemCount: sourceItems.length,
        newAchievements, // Return newly unlocked achievements
      };
    }),
});
