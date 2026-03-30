import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { recentlyViewed } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const recentlyViewedRouter = router({
  /**
   * Track a recently viewed item
   */
  trackView: protectedProcedure
    .input(
      z.object({
        itemType: z.enum(["story", "collection", "wordbank"]),
        itemId: z.number(),
        itemTitle: z.string().optional(),
        itemThumbnail: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      // Check if this item was already viewed recently (within last 5 minutes)
      const recentView = await db
        .select()
        .from(recentlyViewed)
        .where(
          and(
            eq(recentlyViewed.userId, ctx.user.id),
            eq(recentlyViewed.itemType, input.itemType),
            eq(recentlyViewed.itemId, input.itemId)
          )
        )
        .limit(1);

      if (recentView.length > 0) {
        // Update the viewedAt timestamp
        await db
          .update(recentlyViewed)
          .set({
            viewedAt: new Date(),
            itemTitle: input.itemTitle || recentView[0].itemTitle,
            itemThumbnail: input.itemThumbnail || recentView[0].itemThumbnail,
          })
          .where(eq(recentlyViewed.id, recentView[0].id));
      } else {
        // Insert new record
        await db.insert(recentlyViewed).values({
          userId: ctx.user.id,
          itemType: input.itemType,
          itemId: input.itemId,
          itemTitle: input.itemTitle || null,
          itemThumbnail: input.itemThumbnail || null,
          viewedAt: new Date(),
        });
      }

      // Keep only the 10 most recent items per user
      const allViews = await db
        .select()
        .from(recentlyViewed)
        .where(eq(recentlyViewed.userId, ctx.user.id))
        .orderBy(desc(recentlyViewed.viewedAt));

      if (allViews.length > 10) {
        const idsToDelete = allViews.slice(10).map((v) => v.id);
        await db.delete(recentlyViewed).where(
          and(
            eq(recentlyViewed.userId, ctx.user.id),
            // @ts-ignore - inArray type issue
            eq(recentlyViewed.id, idsToDelete[0])
          )
        );
      }

      return { success: true };
    }),

  /**
   * Get recently viewed items for the current user
   */
  getRecentlyViewed: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(20).default(5),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const items = await db
        .select()
        .from(recentlyViewed)
        .where(eq(recentlyViewed.userId, ctx.user.id))
        .orderBy(desc(recentlyViewed.viewedAt))
        .limit(input.limit);

      return items;
    }),

  /**
   * Clear all recently viewed items for the current user
   */
  clearRecentlyViewed: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

    await db.delete(recentlyViewed).where(eq(recentlyViewed.userId, ctx.user.id));

    return { success: true };
  }),
});
