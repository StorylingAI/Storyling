import { z } from "zod";
import { router, protectedProcedure, publicProcedure } from "./_core/trpc";
import {
  getDb,
  getAllCategories,
  assignCollectionCategory,
  getCollectionCategories,
  removeCollectionCategory,
  createOrGetTag,
  assignCollectionTag,
  getCollectionTags,
  removeCollectionTag,
  getPopularTags,
} from "./db";
import { collections, collectionCategoryAssignments, collectionTagAssignments, users } from "../drizzle/schema";
import { eq, and, inArray, desc, sql } from "drizzle-orm";

export const categoryRouter = router({
  /**
   * Get all available categories
   */
  getAllCategories: publicProcedure.query(async () => {
    return getAllCategories();
  }),

  /**
   * Get popular tags
   */
  getPopularTags: publicProcedure
    .input(z.object({ limit: z.number().default(20) }))
    .query(async ({ input }) => {
      return getPopularTags(input.limit);
    }),

  /**
   * Get categories for a specific collection
   */
  getCollectionCategories: publicProcedure
    .input(z.object({ collectionId: z.number() }))
    .query(async ({ input }) => {
      return getCollectionCategories(input.collectionId);
    }),

  /**
   * Get tags for a specific collection
   */
  getCollectionTags: publicProcedure
    .input(z.object({ collectionId: z.number() }))
    .query(async ({ input }) => {
      return getCollectionTags(input.collectionId);
    }),

  /**
   * Assign category to collection (owner only)
   */
  assignCategory: protectedProcedure
    .input(
      z.object({
        collectionId: z.number(),
        categoryId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check ownership
      const [collection] = await db
        .select()
        .from(collections)
        .where(eq(collections.id, input.collectionId))
        .limit(1);

      if (!collection || collection.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      return assignCollectionCategory(input.collectionId, input.categoryId);
    }),

  /**
   * Remove category from collection (owner only)
   */
  removeCategory: protectedProcedure
    .input(
      z.object({
        collectionId: z.number(),
        categoryId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check ownership
      const [collection] = await db
        .select()
        .from(collections)
        .where(eq(collections.id, input.collectionId))
        .limit(1);

      if (!collection || collection.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      await removeCollectionCategory(input.collectionId, input.categoryId);
      return { success: true };
    }),

  /**
   * Add tag to collection (owner only)
   */
  addTag: protectedProcedure
    .input(
      z.object({
        collectionId: z.number(),
        tagName: z.string().min(1).max(50),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check ownership
      const [collection] = await db
        .select()
        .from(collections)
        .where(eq(collections.id, input.collectionId))
        .limit(1);

      if (!collection || collection.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      // Create or get tag
      const tag = await createOrGetTag(input.tagName);
      if (!tag) throw new Error("Failed to create tag");

      // Assign tag to collection
      return assignCollectionTag(input.collectionId, tag.id);
    }),

  /**
   * Remove tag from collection (owner only)
   */
  removeTag: protectedProcedure
    .input(
      z.object({
        collectionId: z.number(),
        tagId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check ownership
      const [collection] = await db
        .select()
        .from(collections)
        .where(eq(collections.id, input.collectionId))
        .limit(1);

      if (!collection || collection.userId !== ctx.user.id) {
        throw new Error("Unauthorized");
      }

      await removeCollectionTag(input.collectionId, input.tagId);
      return { success: true };
    }),

  /**
   * Browse collections by category
   */
  browseByCategory: publicProcedure
    .input(
      z.object({
        categoryId: z.number(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { collections: [], total: 0 };

      // Get collection IDs for this category
      const categoryCollections = await db
        .select({ collectionId: collectionCategoryAssignments.collectionId })
        .from(collectionCategoryAssignments)
        .where(eq(collectionCategoryAssignments.categoryId, input.categoryId));

      if (categoryCollections.length === 0) {
        return { collections: [], total: 0 };
      }

      const collectionIds = categoryCollections.map(c => c.collectionId);

      // Get collections with user info
      const results = await db
        .select({
          id: collections.id,
          name: collections.name,
          description: collections.description,
          viewCount: collections.viewCount,
          cloneCount: collections.cloneCount,
          createdAt: collections.createdAt,
          userName: users.name,
          userId: users.id,
        })
        .from(collections)
        .innerJoin(users, eq(collections.userId, users.id))
        .where(
          and(
            inArray(collections.id, collectionIds),
            eq(collections.isPublic, true)
          )
        )
        .orderBy(desc(collections.viewCount))
        .limit(input.limit)
        .offset(input.offset);

      // Get total count
      const countResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(collections)
        .where(
          and(
            inArray(collections.id, collectionIds),
            eq(collections.isPublic, true)
          )
        );

      return {
        collections: results,
        total: countResult[0]?.count || 0,
      };
    }),

  /**
   * Browse collections by tag
   */
  browseByTag: publicProcedure
    .input(
      z.object({
        tagId: z.number(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { collections: [], total: 0 };

      // Get collection IDs for this tag
      const tagCollections = await db
        .select({ collectionId: collectionTagAssignments.collectionId })
        .from(collectionTagAssignments)
        .where(eq(collectionTagAssignments.tagId, input.tagId));

      if (tagCollections.length === 0) {
        return { collections: [], total: 0 };
      }

      const collectionIds = tagCollections.map(c => c.collectionId);

      // Get collections with user info
      const results = await db
        .select({
          id: collections.id,
          name: collections.name,
          description: collections.description,
          viewCount: collections.viewCount,
          cloneCount: collections.cloneCount,
          createdAt: collections.createdAt,
          userName: users.name,
          userId: users.id,
        })
        .from(collections)
        .innerJoin(users, eq(collections.userId, users.id))
        .where(
          and(
            inArray(collections.id, collectionIds),
            eq(collections.isPublic, true)
          )
        )
        .orderBy(desc(collections.viewCount))
        .limit(input.limit)
        .offset(input.offset);

      // Get total count
      const countResult = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(collections)
        .where(
          and(
            inArray(collections.id, collectionIds),
            eq(collections.isPublic, true)
          )
        );

      return {
        collections: results,
        total: countResult[0]?.count || 0,
      };
    }),

  /**
   * Get category statistics
   */
  getCategoryStats: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const { collectionCategories } = await import("../drizzle/schema");

    const stats = await db
      .select({
        categoryId: collectionCategories.id,
        categoryName: collectionCategories.name,
        categorySlug: collectionCategories.slug,
        categoryIcon: collectionCategories.icon,
        categoryColor: collectionCategories.color,
        collectionCount: sql<number>`COUNT(${collectionCategoryAssignments.collectionId})`,
      })
      .from(collectionCategories)
      .leftJoin(
        collectionCategoryAssignments,
        eq(collectionCategoryAssignments.categoryId, collectionCategories.id)
      )
      .where(eq(collectionCategories.isActive, true))
      .groupBy(collectionCategories.id)
      .orderBy(desc(sql`COUNT(${collectionCategoryAssignments.collectionId})`));

    return stats;
  }),
});
