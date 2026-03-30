import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { breadcrumbPreferences } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const breadcrumbRouter = router({
  /**
   * Get breadcrumb preferences for current user
   */
  getPreferences: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection not available");

    const prefs = await db
      .select()
      .from(breadcrumbPreferences)
      .where(eq(breadcrumbPreferences.userId, ctx.user.id))
      .limit(1);

    if (prefs.length === 0) {
      // Return default preferences
      return {
        showIcons: true,
        compactMode: false,
        hideOnMobile: false,
      };
    }

    return {
      showIcons: Boolean(prefs[0].showIcons),
      compactMode: Boolean(prefs[0].compactMode),
      hideOnMobile: Boolean(prefs[0].hideOnMobile),
    };
  }),

  /**
   * Update breadcrumb preferences for current user
   */
  updatePreferences: protectedProcedure
    .input(
      z.object({
        showIcons: z.boolean().optional(),
        compactMode: z.boolean().optional(),
        hideOnMobile: z.boolean().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database connection not available");

      // Check if preferences exist
      const existing = await db
        .select()
        .from(breadcrumbPreferences)
        .where(eq(breadcrumbPreferences.userId, ctx.user.id))
        .limit(1);

      if (existing.length === 0) {
        // Insert new preferences
        await db.insert(breadcrumbPreferences).values({
          userId: ctx.user.id,
          showIcons: input.showIcons !== undefined ? input.showIcons : true,
          compactMode: input.compactMode !== undefined ? input.compactMode : false,
          hideOnMobile: input.hideOnMobile !== undefined ? input.hideOnMobile : false,
        });
      } else {
        // Update existing preferences
        const updates: Record<string, boolean> = {};
        if (input.showIcons !== undefined) updates.showIcons = input.showIcons;
        if (input.compactMode !== undefined) updates.compactMode = input.compactMode;
        if (input.hideOnMobile !== undefined) updates.hideOnMobile = input.hideOnMobile;

        if (Object.keys(updates).length > 0) {
          await db
            .update(breadcrumbPreferences)
            .set(updates)
            .where(eq(breadcrumbPreferences.userId, ctx.user.id));
        }
      }

      // Return updated preferences
      const updated = await db
        .select()
        .from(breadcrumbPreferences)
        .where(eq(breadcrumbPreferences.userId, ctx.user.id))
        .limit(1);

      return {
        showIcons: Boolean(updated[0].showIcons),
        compactMode: Boolean(updated[0].compactMode),
        hideOnMobile: Boolean(updated[0].hideOnMobile),
      };
    }),
});
