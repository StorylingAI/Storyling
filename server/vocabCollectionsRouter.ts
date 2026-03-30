import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { vocabularyCollections, vocabularyCollectionLikes, users } from "../drizzle/schema";
import { getDb } from "./db";
import { eq, and, desc, sql, like, or } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

/**
 * Helper to generate SEO-friendly slug from title
 */
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special chars
    .replace(/\s+/g, "-") // Replace spaces with hyphens
    .replace(/-+/g, "-") // Remove duplicate hyphens
    .trim();
}

/**
 * Helper to ensure unique slug
 */
async function ensureUniqueSlug(baseSlug: string, excludeId?: number): Promise<string> {
  const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await db
      .select({ id: vocabularyCollections.id })
      .from(vocabularyCollections)
      .where(
        excludeId
          ? and(eq(vocabularyCollections.slug, slug), sql`${vocabularyCollections.id} != ${excludeId}`)
          : eq(vocabularyCollections.slug, slug)
      )
      .limit(1);

    if (existing.length === 0) {
      return slug;
    }

    slug = `${baseSlug}-${counter}`;
    counter++;
  }
}

export const vocabCollectionsRouter = router({
  /**
   * Create a new vocabulary collection
   */
  create: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1).max(255),
        description: z.string().optional(),
        targetLanguage: z.string(),
        proficiencyLevel: z.string(),
        category: z.string().optional(),
        tags: z.string().optional(), // Comma-separated
        words: z.array(
          z.object({
            word: z.string(),
            translation: z.string(),
            example: z.string().optional(),
          })
        ),
        isPublic: z.boolean().default(false),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        metaKeywords: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const baseSlug = generateSlug(input.title);
      const slug = await ensureUniqueSlug(baseSlug);

      const [collection] = await db.insert(vocabularyCollections).values({
        userId: ctx.user.id,
        title: input.title,
        description: input.description,
        slug,
        targetLanguage: input.targetLanguage,
        proficiencyLevel: input.proficiencyLevel,
        category: input.category,
        tags: input.tags,
        words: input.words,
        wordCount: input.words.length,
        isPublic: input.isPublic,
        metaTitle: input.metaTitle || input.title,
        metaDescription: input.metaDescription || input.description,
        metaKeywords: input.metaKeywords || input.tags,
      });

      return { collectionId: collection.insertId, slug };
    }),

  /**
   * Update an existing collection
   */
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        title: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        category: z.string().optional(),
        tags: z.string().optional(),
        words: z
          .array(
            z.object({
              word: z.string(),
              translation: z.string(),
              example: z.string().optional(),
            })
          )
          .optional(),
        isPublic: z.boolean().optional(),
        metaTitle: z.string().optional(),
        metaDescription: z.string().optional(),
        metaKeywords: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Verify ownership
      const [existing] = await db
        .select()
        .from(vocabularyCollections)
        .where(eq(vocabularyCollections.id, input.id))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Collection not found" });
      }

      if (existing.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN", message: "You can only edit your own collections" });
      }

      const updates: any = {};

      if (input.title) {
        updates.title = input.title;
        const baseSlug = generateSlug(input.title);
        updates.slug = await ensureUniqueSlug(baseSlug, input.id);
      }

      if (input.description !== undefined) updates.description = input.description;
      if (input.category !== undefined) updates.category = input.category;
      if (input.tags !== undefined) updates.tags = input.tags;
      if (input.words) {
        updates.words = input.words;
        updates.wordCount = input.words.length;
      }
      if (input.isPublic !== undefined) updates.isPublic = input.isPublic;
      if (input.metaTitle !== undefined) updates.metaTitle = input.metaTitle;
      if (input.metaDescription !== undefined) updates.metaDescription = input.metaDescription;
      if (input.metaKeywords !== undefined) updates.metaKeywords = input.metaKeywords;

      await db.update(vocabularyCollections).set(updates).where(eq(vocabularyCollections.id, input.id));

      return { success: true };
    }),

  /**
   * Delete a collection
   */
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [existing] = await db
        .select()
        .from(vocabularyCollections)
        .where(eq(vocabularyCollections.id, input.id))
        .limit(1);

      if (!existing) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (existing.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      await db.delete(vocabularyCollections).where(eq(vocabularyCollections.id, input.id));

      return { success: true };
    }),

  /**
   * Get collection by slug (public access)
   */
  getBySlug: publicProcedure
    .input(z.object({ slug: z.string() }))
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [collection] = await db
        .select({
          id: vocabularyCollections.id,
          userId: vocabularyCollections.userId,
          title: vocabularyCollections.title,
          description: vocabularyCollections.description,
          slug: vocabularyCollections.slug,
          targetLanguage: vocabularyCollections.targetLanguage,
          proficiencyLevel: vocabularyCollections.proficiencyLevel,
          category: vocabularyCollections.category,
          tags: vocabularyCollections.tags,
          words: vocabularyCollections.words,
          wordCount: vocabularyCollections.wordCount,
          isPublic: vocabularyCollections.isPublic,
          isFeatured: vocabularyCollections.isFeatured,
          viewCount: vocabularyCollections.viewCount,
          cloneCount: vocabularyCollections.cloneCount,
          likeCount: vocabularyCollections.likeCount,
          createdAt: vocabularyCollections.createdAt,
          updatedAt: vocabularyCollections.updatedAt,
          creatorName: users.name,
        })
        .from(vocabularyCollections)
        .leftJoin(users, eq(vocabularyCollections.userId, users.id))
        .where(eq(vocabularyCollections.slug, input.slug))
        .limit(1);

      if (!collection) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Collection not found" });
      }

      // Check if user can access
      const isOwner = ctx.user && collection.userId === ctx.user.id;
      if (!collection.isPublic && !isOwner) {
        throw new TRPCError({ code: "FORBIDDEN", message: "This collection is private" });
      }

      // Increment view count (only for public collections and non-owners)
      if (collection.isPublic && !isOwner) {
        await db
          .update(vocabularyCollections)
          .set({ viewCount: sql`${vocabularyCollections.viewCount} + 1` })
          .where(eq(vocabularyCollections.id, collection.id));
      }

      // Check if current user liked this collection
      let isLiked = false;
      if (ctx.user) {
        const [like] = await db
          .select()
          .from(vocabularyCollectionLikes)
          .where(
            and(
              eq(vocabularyCollectionLikes.userId, ctx.user.id),
              eq(vocabularyCollectionLikes.collectionId, collection.id)
            )
          )
          .limit(1);
        isLiked = !!like;
      }

      return { ...collection, isOwner, isLiked };
    }),

  /**
   * Browse public collections
   */
  browse: publicProcedure
    .input(
      z.object({
        search: z.string().optional(),
        targetLanguage: z.string().optional(),
        proficiencyLevel: z.string().optional(),
        category: z.string().optional(),
        sortBy: z.enum(["popular", "recent", "mostCloned"]).default("popular"),
        limit: z.number().min(1).max(100).default(20),
        offset: z.number().min(0).default(0),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Build filter conditions
      const conditions = [eq(vocabularyCollections.isPublic, true)];

      if (input.search) {
        conditions.push(
          or(
            like(vocabularyCollections.title, `%${input.search}%`),
            like(vocabularyCollections.description, `%${input.search}%`),
            like(vocabularyCollections.tags, `%${input.search}%`)
          )!
        );
      }

      if (input.targetLanguage) {
        conditions.push(eq(vocabularyCollections.targetLanguage, input.targetLanguage));
      }

      if (input.proficiencyLevel) {
        conditions.push(eq(vocabularyCollections.proficiencyLevel, input.proficiencyLevel));
      }

      if (input.category) {
        conditions.push(eq(vocabularyCollections.category, input.category));
      }

      // Determine sort order
      let orderByClause;
      if (input.sortBy === "popular") {
        orderByClause = desc(vocabularyCollections.viewCount);
      } else if (input.sortBy === "recent") {
        orderByClause = desc(vocabularyCollections.createdAt);
      } else {
        orderByClause = desc(vocabularyCollections.cloneCount);
      }

      // Build and execute query
      const collections = await db
        .select({
          id: vocabularyCollections.id,
          userId: vocabularyCollections.userId,
          title: vocabularyCollections.title,
          description: vocabularyCollections.description,
          slug: vocabularyCollections.slug,
          targetLanguage: vocabularyCollections.targetLanguage,
          proficiencyLevel: vocabularyCollections.proficiencyLevel,
          category: vocabularyCollections.category,
          tags: vocabularyCollections.tags,
          wordCount: vocabularyCollections.wordCount,
          isFeatured: vocabularyCollections.isFeatured,
          viewCount: vocabularyCollections.viewCount,
          cloneCount: vocabularyCollections.cloneCount,
          likeCount: vocabularyCollections.likeCount,
          createdAt: vocabularyCollections.createdAt,
          creatorName: users.name,
        })
        .from(vocabularyCollections)
        .leftJoin(users, eq(vocabularyCollections.userId, users.id))
        .where(and(...conditions))
        .orderBy(orderByClause)
        .limit(input.limit)
        .offset(input.offset);

      return { collections };
    }),

  /**
   * Get user's own collections
   */
  getMine: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    const collections = await db
      .select({
        id: vocabularyCollections.id,
        title: vocabularyCollections.title,
        description: vocabularyCollections.description,
        slug: vocabularyCollections.slug,
        targetLanguage: vocabularyCollections.targetLanguage,
        proficiencyLevel: vocabularyCollections.proficiencyLevel,
        category: vocabularyCollections.category,
        wordCount: vocabularyCollections.wordCount,
        isPublic: vocabularyCollections.isPublic,
        isFeatured: vocabularyCollections.isFeatured,
        viewCount: vocabularyCollections.viewCount,
        cloneCount: vocabularyCollections.cloneCount,
        likeCount: vocabularyCollections.likeCount,
        createdAt: vocabularyCollections.createdAt,
      })
      .from(vocabularyCollections)
      .where(eq(vocabularyCollections.userId, ctx.user.id))
      .orderBy(desc(vocabularyCollections.createdAt));

    return { collections };
  }),

  /**
   * Clone a public collection
   */
  clone: protectedProcedure
    .input(z.object({ collectionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [original] = await db
        .select()
        .from(vocabularyCollections)
        .where(eq(vocabularyCollections.id, input.collectionId))
        .limit(1);

      if (!original) {
        throw new TRPCError({ code: "NOT_FOUND" });
      }

      if (!original.isPublic && original.userId !== ctx.user.id) {
        throw new TRPCError({ code: "FORBIDDEN" });
      }

      // Create cloned collection
      const baseSlug = generateSlug(`${original.title}-copy`);
      const slug = await ensureUniqueSlug(baseSlug);

      const [cloned] = await db.insert(vocabularyCollections).values({
        userId: ctx.user.id,
        title: `${original.title} (Copy)`,
        description: original.description,
        slug,
        targetLanguage: original.targetLanguage,
        proficiencyLevel: original.proficiencyLevel,
        category: original.category,
        tags: original.tags,
        words: original.words,
        wordCount: original.wordCount,
        isPublic: false, // Clones are private by default
        metaTitle: original.metaTitle,
        metaDescription: original.metaDescription,
        metaKeywords: original.metaKeywords,
      });

      // Increment clone count
      await db
        .update(vocabularyCollections)
        .set({ cloneCount: sql`${vocabularyCollections.cloneCount} + 1` })
        .where(eq(vocabularyCollections.id, input.collectionId));

      return { collectionId: cloned.insertId, slug };
    }),

  /**
   * Like/unlike a collection
   */
  toggleLike: protectedProcedure
    .input(z.object({ collectionId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [existing] = await db
        .select()
        .from(vocabularyCollectionLikes)
        .where(
          and(
            eq(vocabularyCollectionLikes.userId, ctx.user.id),
            eq(vocabularyCollectionLikes.collectionId, input.collectionId)
          )
        )
        .limit(1);

      if (existing) {
        // Unlike
        await db
          .delete(vocabularyCollectionLikes)
          .where(
            and(
              eq(vocabularyCollectionLikes.userId, ctx.user.id),
              eq(vocabularyCollectionLikes.collectionId, input.collectionId)
            )
          );

        await db
          .update(vocabularyCollections)
          .set({ likeCount: sql`${vocabularyCollections.likeCount} - 1` })
          .where(eq(vocabularyCollections.id, input.collectionId));

        return { liked: false };
      } else {
        // Like
        await db.insert(vocabularyCollectionLikes).values({
          userId: ctx.user.id,
          collectionId: input.collectionId,
        });

        await db
          .update(vocabularyCollections)
          .set({ likeCount: sql`${vocabularyCollections.likeCount} + 1` })
          .where(eq(vocabularyCollections.id, input.collectionId));

        return { liked: true };
      }
    }),
});
