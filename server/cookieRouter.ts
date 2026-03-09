import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { cookiePreferences } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const cookieRouter = router({
  /**
   * Get user's cookie preferences
   */
  getPreferences: publicProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return null;
    if (!ctx.user?.id) return null;

    const [prefs] = await db
      .select()
      .from(cookiePreferences)
      .where(eq(cookiePreferences.userId, ctx.user.id))
      .limit(1);

    return prefs || null;
  }),

  /**
   * Save or update user's cookie preferences
   */
  savePreferences: protectedProcedure
    .input(
      z.object({
        necessary: z.boolean(),
        analytics: z.boolean(),
        marketing: z.boolean(),
        preferences: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check if preferences already exist
      const [existing] = await db
        .select()
        .from(cookiePreferences)
        .where(eq(cookiePreferences.userId, ctx.user.id))
        .limit(1);

      if (existing) {
        // Update existing preferences
        await db
          .update(cookiePreferences)
          .set({
            necessary: input.necessary,
            analytics: input.analytics,
            marketing: input.marketing,
            preferences: input.preferences,
            updatedAt: new Date(),
          })
          .where(eq(cookiePreferences.userId, ctx.user.id));
      } else {
        // Insert new preferences
        await db.insert(cookiePreferences).values({
          userId: ctx.user.id,
          necessary: input.necessary,
          analytics: input.analytics,
          marketing: input.marketing,
          preferences: input.preferences,
        });
      }

      return { success: true };
    }),
});
