import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { collections, users } from "../drizzle/schema";
import { eq, and, desc, lte, gte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const featuredRouter = router({
  // Get current featured collection (public)
  getFeaturedCollection: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const now = new Date();

    // Find active featured collection
    const [featured] = await db
      .select({
        id: collections.id,
        name: collections.name,
        description: collections.description,
        color: collections.color,
        shareToken: collections.shareToken,
        cloneCount: collections.cloneCount,
        featuredAt: collections.featuredAt,
        featuredUntil: collections.featuredUntil,
        createdAt: collections.createdAt,
        userId: collections.userId,
        userName: users.name,
      })
      .from(collections)
      .innerJoin(users, eq(collections.userId, users.id))
      .where(
        and(
          eq(collections.isFeatured, true),
          eq(collections.isPublic, true),
          lte(collections.featuredAt, now),
          gte(collections.featuredUntil, now)
        )
      )
      .orderBy(desc(collections.featuredAt))
      .limit(1);

    return featured || null;
  }),

  // Set featured collection (admin only)
  setFeaturedCollection: protectedProcedure
    .input(
      z.object({
        collectionId: z.number(),
        durationDays: z.number().min(1).max(30).default(7), // Default to 7 days
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Check if user is admin
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can feature collections",
        });
      }

      // Verify collection exists and is public
      const [collection] = await db
        .select({
          id: collections.id,
          isPublic: collections.isPublic,
        })
        .from(collections)
        .where(eq(collections.id, input.collectionId))
        .limit(1);

      if (!collection) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Collection not found",
        });
      }

      if (!collection.isPublic) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Only public collections can be featured",
        });
      }

      // Unfeatured all currently featured collections
      await db
        .update(collections)
        .set({
          isFeatured: false,
          featuredUntil: new Date(), // Expire immediately
        })
        .where(eq(collections.isFeatured, true));

      // Feature the new collection
      const now = new Date();
      const featuredUntil = new Date(now.getTime() + input.durationDays * 24 * 60 * 60 * 1000);

      await db
        .update(collections)
        .set({
          isFeatured: true,
          featuredAt: now,
          featuredUntil,
        })
        .where(eq(collections.id, input.collectionId));

      return {
        success: true,
        featuredUntil,
      };
    }),

  // Remove featured status (admin only)
  unfeatureCollection: protectedProcedure
    .input(
      z.object({
        collectionId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Check if user is admin
      if (ctx.user.role !== "admin") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only admins can unfeature collections",
        });
      }

      await db
        .update(collections)
        .set({
          isFeatured: false,
          featuredUntil: new Date(), // Expire immediately
        })
        .where(eq(collections.id, input.collectionId));

      return {
        success: true,
      };
    }),
});
