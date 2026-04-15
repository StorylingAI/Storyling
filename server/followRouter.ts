import { z } from "zod";
import { router, publicProcedure, protectedProcedure } from "./_core/trpc";
import { getDb } from "./db";
import { userFollows, users, notifications } from "../drizzle/schema";
import { eq, and, sql, desc } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

export const followRouter = router({
  // Follow a user
  followUser: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Prevent self-follow
      if (input.userId === ctx.user.id) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "You cannot follow yourself",
        });
      }

      // Check if user exists
      const [targetUser] = await db
        .select({ id: users.id, name: users.name })
        .from(users)
        .where(eq(users.id, input.userId))
        .limit(1);

      if (!targetUser) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "User not found",
        });
      }

      // Check if already following
      const [existing] = await db
        .select()
        .from(userFollows)
        .where(
          and(
            eq(userFollows.followerId, ctx.user.id),
            eq(userFollows.followingId, input.userId)
          )
        )
        .limit(1);

      if (existing) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Already following this user",
        });
      }

      // Create follow relationship
      await db.insert(userFollows).values({
        followerId: ctx.user.id,
        followingId: input.userId,
      });

      // Create notification for the followed user
      await db.insert(notifications).values({
        userId: input.userId,
        type: "new_follower",
        title: "New Follower",
        content: `${ctx.user.name || "Someone"} started following you`,
        relatedUserId: ctx.user.id,
        isRead: false,
      });

      return {
        success: true,
      };
    }),

  // Unfollow a user
  unfollowUser: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const result = await db
        .delete(userFollows)
        .where(
          and(
            eq(userFollows.followerId, ctx.user.id),
            eq(userFollows.followingId, input.userId)
          )
        );

      return {
        success: true,
      };
    }),

  // Check if current user is following another user
  isFollowing: protectedProcedure
    .input(
      z.object({
        userId: z.number(),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [follow] = await db
        .select()
        .from(userFollows)
        .where(
          and(
            eq(userFollows.followerId, ctx.user.id),
            eq(userFollows.followingId, input.userId)
          )
        )
        .limit(1);

      return {
        isFollowing: !!follow,
      };
    }),

  // Get follow stats for a user
  getFollowStats: publicProcedure
    .input(
      z.object({
        userId: z.number(),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Get follower count
      const [followerCount] = await db
        .select({
          count: sql<number>`COUNT(*)`,
        })
        .from(userFollows)
        .where(eq(userFollows.followingId, input.userId));

      // Get following count
      const [followingCount] = await db
        .select({
          count: sql<number>`COUNT(*)`,
        })
        .from(userFollows)
        .where(eq(userFollows.followerId, input.userId));

      return {
        followers: Number(followerCount.count),
        following: Number(followingCount.count),
      };
    }),

  // Get list of followers
  getFollowers: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const followers = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          avatarUrl: users.avatarUrl,
          followedAt: userFollows.createdAt,
        })
        .from(userFollows)
        .innerJoin(users, eq(userFollows.followerId, users.id))
        .where(eq(userFollows.followingId, input.userId))
        .orderBy(desc(userFollows.createdAt))
        .limit(input.limit);

      return followers;
    }),

  // Get list of users someone is following
  getFollowing: publicProcedure
    .input(
      z.object({
        userId: z.number(),
        limit: z.number().min(1).max(100).default(50),
      })
    )
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const following = await db
        .select({
          id: users.id,
          name: users.name,
          email: users.email,
          avatarUrl: users.avatarUrl,
          followedAt: userFollows.createdAt,
        })
        .from(userFollows)
        .innerJoin(users, eq(userFollows.followingId, users.id))
        .where(eq(userFollows.followerId, input.userId))
        .orderBy(desc(userFollows.createdAt))
        .limit(input.limit);

      return following;
    }),

  // Get notifications for current user
  getNotifications: protectedProcedure
    .input(
      z.object({
        limit: z.number().min(1).max(50).default(20),
        unreadOnly: z.boolean().default(false),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const conditions = [eq(notifications.userId, ctx.user.id)];
      if (input.unreadOnly) {
        conditions.push(eq(notifications.isRead, false));
      }

      const userNotifications = await db
        .select()
        .from(notifications)
        .where(and(...conditions))
        .orderBy(desc(notifications.createdAt))
        .limit(input.limit);

      return userNotifications;
    }),

  // Get unread notification count
  getUnreadCount: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    const [result] = await db
      .select({
        count: sql<number>`COUNT(*)`,
      })
      .from(notifications)
      .where(
        and(
          eq(notifications.userId, ctx.user.id),
          eq(notifications.isRead, false)
        )
      );

    return {
      count: Number(result.count),
    };
  }),

  // Mark notification as read
  markAsRead: protectedProcedure
    .input(
      z.object({
        notificationId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db
        .update(notifications)
        .set({ isRead: true })
        .where(
          and(
            eq(notifications.id, input.notificationId),
            eq(notifications.userId, ctx.user.id)
          )
        );

      return {
        success: true,
      };
    }),

  // Mark all notifications as read
  markAllAsRead: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    await db
      .update(notifications)
      .set({ isRead: true })
      .where(
        and(
          eq(notifications.userId, ctx.user.id),
          eq(notifications.isRead, false)
        )
      );

    return {
      success: true,
    };
  }),
});
