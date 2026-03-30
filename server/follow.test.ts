import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users, userFollows, notifications, collections } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

describe("Follow System", () => {
  let testUser1: any;
  let testUser2: any;
  let testUser3: any;
  let testCollection: any;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Create test users
    const [user1] = await db
      .insert(users)
      .values({
        openId: "test-follow-user-1",
        name: "Test Creator",
        email: "creator@test.com",
        role: "user",
      })
      .$returningId();

    const [user2] = await db
      .insert(users)
      .values({
        openId: "test-follow-user-2",
        name: "Test Follower",
        email: "follower@test.com",
        role: "user",
      })
      .$returningId();

    const [user3] = await db
      .insert(users)
      .values({
        openId: "test-follow-user-3",
        name: "Test User 3",
        email: "user3@test.com",
        role: "user",
      })
      .$returningId();

    testUser1 = { id: user1.id, openId: "test-follow-user-1", name: "Test Creator", email: "creator@test.com", role: "user" };
    testUser2 = { id: user2.id, openId: "test-follow-user-2", name: "Test Follower", email: "follower@test.com", role: "user" };
    testUser3 = { id: user3.id, openId: "test-follow-user-3", name: "Test User 3", email: "user3@test.com", role: "user" };

    // Create a test collection
    const [collection] = await db
      .insert(collections)
      .values({
        userId: testUser1.id,
        name: "Test Collection",
        description: "A test collection",
        isPublic: false,
      })
      .$returningId();

    testCollection = { id: collection.id };
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Cleanup
    await db.delete(notifications).where(
      eq(notifications.userId, testUser1.id)
    );
    await db.delete(notifications).where(
      eq(notifications.userId, testUser2.id)
    );
    await db.delete(userFollows).where(
      eq(userFollows.followerId, testUser2.id)
    );
    await db.delete(userFollows).where(
      eq(userFollows.followerId, testUser3.id)
    );
    await db.delete(collections).where(
      eq(collections.id, testCollection.id)
    );
    await db.delete(users).where(eq(users.id, testUser1.id));
    await db.delete(users).where(eq(users.id, testUser2.id));
    await db.delete(users).where(eq(users.id, testUser3.id));
  });

  describe("Follow/Unfollow", () => {
    it("should allow user to follow another user", async () => {
      const caller = appRouter.createCaller({
        user: testUser2,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.follow.followUser({ userId: testUser1.id });
      expect(result.success).toBe(true);

      // Verify follow relationship exists
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [follow] = await db
        .select()
        .from(userFollows)
        .where(
          and(
            eq(userFollows.followerId, testUser2.id),
            eq(userFollows.followingId, testUser1.id)
          )
        );

      expect(follow).toBeDefined();
      expect(follow.followerId).toBe(testUser2.id);
      expect(follow.followingId).toBe(testUser1.id);
    });

    it("should create notification when user is followed", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Check for new_follower notification
      const [notification] = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, testUser1.id),
            eq(notifications.type, "new_follower"),
            eq(notifications.relatedUserId, testUser2.id)
          )
        );

      expect(notification).toBeDefined();
      expect(notification.title).toBe("New Follower");
      expect(notification.isRead).toBe(false);
    });

    it("should prevent user from following themselves", async () => {
      const caller = appRouter.createCaller({
        user: testUser1,
        req: {} as any,
        res: {} as any,
      });

      await expect(
        caller.follow.followUser({ userId: testUser1.id })
      ).rejects.toThrow("You cannot follow yourself");
    });

    it("should prevent duplicate follows", async () => {
      const caller = appRouter.createCaller({
        user: testUser2,
        req: {} as any,
        res: {} as any,
      });

      await expect(
        caller.follow.followUser({ userId: testUser1.id })
      ).rejects.toThrow("Already following this user");
    });

    it("should check if user is following another user", async () => {
      const caller = appRouter.createCaller({
        user: testUser2,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.follow.isFollowing({ userId: testUser1.id });
      expect(result.isFollowing).toBe(true);
    });

    it("should return false for non-following relationship", async () => {
      const caller = appRouter.createCaller({
        user: testUser3,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.follow.isFollowing({ userId: testUser1.id });
      expect(result.isFollowing).toBe(false);
    });

    it("should allow user to unfollow", async () => {
      const caller = appRouter.createCaller({
        user: testUser2,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.follow.unfollowUser({ userId: testUser1.id });
      expect(result.success).toBe(true);

      // Verify follow relationship is removed
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      const [follow] = await db
        .select()
        .from(userFollows)
        .where(
          and(
            eq(userFollows.followerId, testUser2.id),
            eq(userFollows.followingId, testUser1.id)
          )
        );

      expect(follow).toBeUndefined();
    });
  });

  describe("Follow Stats", () => {
    beforeAll(async () => {
      // Re-establish follows for stats testing
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      await db.insert(userFollows).values([
        { followerId: testUser2.id, followingId: testUser1.id },
        { followerId: testUser3.id, followingId: testUser1.id },
      ]);
    });

    it("should get correct follower count", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const stats = await caller.follow.getFollowStats({ userId: testUser1.id });
      expect(stats.followers).toBe(2);
    });

    it("should get correct following count", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const stats = await caller.follow.getFollowStats({ userId: testUser2.id });
      expect(stats.following).toBe(1);
    });

    it("should get list of followers", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const followers = await caller.follow.getFollowers({
        userId: testUser1.id,
        limit: 50,
      });

      expect(followers.length).toBe(2);
      expect(followers.some((f) => f.id === testUser2.id)).toBe(true);
      expect(followers.some((f) => f.id === testUser3.id)).toBe(true);
    });

    it("should get list of following", async () => {
      const caller = appRouter.createCaller({
        user: null,
        req: {} as any,
        res: {} as any,
      });

      const following = await caller.follow.getFollowing({
        userId: testUser2.id,
        limit: 50,
      });

      expect(following.length).toBe(1);
      expect(following[0].id).toBe(testUser1.id);
    });
  });

  describe("Notifications", () => {
    it("should create notification when collection is published", async () => {
      const caller = appRouter.createCaller({
        user: testUser1,
        req: {} as any,
        res: {} as any,
      });

      // Make collection public (should trigger notifications)
      await caller.collections.togglePublicSharing({
        collectionId: testCollection.id,
        isPublic: true,
      });

      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Check for new_collection notifications
      const collectionNotifications = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.type, "new_collection"),
            eq(notifications.relatedCollectionId, testCollection.id)
          )
        );

      expect(collectionNotifications.length).toBeGreaterThan(0);
      expect(collectionNotifications.some((n) => n.userId === testUser2.id)).toBe(true);
    });

    it("should get notifications for user", async () => {
      const caller = appRouter.createCaller({
        user: testUser2,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.follow.getNotifications({
        limit: 20,
        unreadOnly: false,
      });

      expect(result.length).toBeGreaterThan(0);
    });

    it("should get unread notification count", async () => {
      const caller = appRouter.createCaller({
        user: testUser2,
        req: {} as any,
        res: {} as any,
      });

      const result = await caller.follow.getUnreadCount();
      expect(result.count).toBeGreaterThan(0);
    });

    it("should mark notification as read", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Get an unread notification
      const [notification] = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, testUser2.id),
            eq(notifications.isRead, false)
          )
        )
        .limit(1);

      expect(notification).toBeDefined();

      const caller = appRouter.createCaller({
        user: testUser2,
        req: {} as any,
        res: {} as any,
      });

      await caller.follow.markAsRead({ notificationId: notification.id });

      // Verify notification is marked as read
      const [updated] = await db
        .select()
        .from(notifications)
        .where(eq(notifications.id, notification.id));

      expect(updated.isRead).toBe(true);
    });

    it("should mark all notifications as read", async () => {
      const caller = appRouter.createCaller({
        user: testUser2,
        req: {} as any,
        res: {} as any,
      });

      await caller.follow.markAllAsRead();

      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Verify all notifications are marked as read
      const unreadNotifications = await db
        .select()
        .from(notifications)
        .where(
          and(
            eq(notifications.userId, testUser2.id),
            eq(notifications.isRead, false)
          )
        );

      expect(unreadNotifications.length).toBe(0);
    });
  });
});
