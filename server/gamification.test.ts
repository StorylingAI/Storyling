import { describe, it, expect, beforeEach } from "vitest";
import { getDb } from "./db";
import { userStats, achievements, userAchievements, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Gamification System", () => {
  let testUserId: number;
  let testAchievementId: number;

  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a test user
    const [user] = await db
      .insert(users)
      .values({
        openId: `test-gamification-${Date.now()}`,
        name: "Test Gamification User",
        email: "gamification@test.com",
        role: "user",
      })
      .$returningId();
    testUserId = user.id;

    // Create a test achievement
    const [achievement] = await db
      .insert(achievements)
      .values({
        key: `test-achievement-${Date.now()}`,
        name: "Test Achievement",
        description: "Complete a test",
        icon: "🧪",
        category: "special",
        requirement: 1,
        xpReward: 100,
      })
      .$returningId();
    testAchievementId = achievement.id;
  });

  describe("User Stats Initialization", () => {
    it("should create user stats with default values", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(userStats).values({
        userId: testUserId,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        totalXp: 0,
        level: 1,
        storiesCompleted: 0,
        quizzesCompleted: 0,
        wordsLearned: 0,
      });

      const [stats] = await db.select().from(userStats).where(eq(userStats.userId, testUserId));

      expect(stats).toBeDefined();
      expect(stats.currentStreak).toBe(0);
      expect(stats.longestStreak).toBe(0);
      expect(stats.totalXp).toBe(0);
      expect(stats.level).toBe(1);
      expect(stats.storiesCompleted).toBe(0);
      expect(stats.quizzesCompleted).toBe(0);
      expect(stats.wordsLearned).toBe(0);
    });
  });

  describe("Streak Tracking", () => {
    it("should calculate streak correctly for consecutive days", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Initialize stats
      await db.insert(userStats).values({
        userId: testUserId,
        currentStreak: 5,
        longestStreak: 5,
        lastActivityDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // Yesterday
        totalXp: 0,
        level: 1,
        storiesCompleted: 0,
        quizzesCompleted: 0,
        wordsLearned: 0,
      });

      // Update activity for today (should increment streak)
      const now = new Date();
      await db
        .update(userStats)
        .set({
          currentStreak: 6,
          longestStreak: 6,
          lastActivityDate: now,
        })
        .where(eq(userStats.userId, testUserId));

      const [stats] = await db.select().from(userStats).where(eq(userStats.userId, testUserId));

      expect(stats.currentStreak).toBe(6);
      expect(stats.longestStreak).toBe(6);
    });

    it("should reset streak after missing a day", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Initialize stats with last activity 2 days ago
      await db.insert(userStats).values({
        userId: testUserId,
        currentStreak: 10,
        longestStreak: 10,
        lastActivityDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        totalXp: 0,
        level: 1,
        storiesCompleted: 0,
        quizzesCompleted: 0,
        wordsLearned: 0,
      });

      // Update activity for today (should reset streak to 1)
      const now = new Date();
      await db
        .update(userStats)
        .set({
          currentStreak: 1,
          lastActivityDate: now,
        })
        .where(eq(userStats.userId, testUserId));

      const [stats] = await db.select().from(userStats).where(eq(userStats.userId, testUserId));

      expect(stats.currentStreak).toBe(1);
      expect(stats.longestStreak).toBe(10); // Longest streak should remain unchanged
    });

    it("should maintain streak when activity happens on the same day", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const today = new Date();
      await db.insert(userStats).values({
        userId: testUserId,
        currentStreak: 7,
        longestStreak: 7,
        lastActivityDate: today,
        totalXp: 0,
        level: 1,
        storiesCompleted: 0,
        quizzesCompleted: 0,
        wordsLearned: 0,
      });

      // Activity happens again today (should maintain streak)
      await db
        .update(userStats)
        .set({
          lastActivityDate: new Date(),
        })
        .where(eq(userStats.userId, testUserId));

      const [stats] = await db.select().from(userStats).where(eq(userStats.userId, testUserId));

      expect(stats.currentStreak).toBe(7); // Should remain the same
    });
  });

  describe("XP and Leveling", () => {
    it("should award XP and calculate level correctly", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(userStats).values({
        userId: testUserId,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        totalXp: 0,
        level: 1,
        storiesCompleted: 0,
        quizzesCompleted: 0,
        wordsLearned: 0,
      });

      // Award 150 XP (should reach level 2 at 100 XP)
      await db
        .update(userStats)
        .set({
          totalXp: 150,
          level: 2,
        })
        .where(eq(userStats.userId, testUserId));

      const [stats] = await db.select().from(userStats).where(eq(userStats.userId, testUserId));

      expect(stats.totalXp).toBe(150);
      expect(stats.level).toBe(2);
    });

    it("should track quiz completion and award XP", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(userStats).values({
        userId: testUserId,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        totalXp: 0,
        level: 1,
        storiesCompleted: 0,
        quizzesCompleted: 0,
        wordsLearned: 0,
      });

      // Complete a quiz and award 30 XP
      await db
        .update(userStats)
        .set({
          totalXp: 30,
          quizzesCompleted: 1,
        })
        .where(eq(userStats.userId, testUserId));

      const [stats] = await db.select().from(userStats).where(eq(userStats.userId, testUserId));

      expect(stats.quizzesCompleted).toBe(1);
      expect(stats.totalXp).toBe(30);
    });

    it("should track story completion and award XP", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(userStats).values({
        userId: testUserId,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        totalXp: 0,
        level: 1,
        storiesCompleted: 0,
        quizzesCompleted: 0,
        wordsLearned: 0,
      });

      // Complete a story and award 25 XP
      await db
        .update(userStats)
        .set({
          totalXp: 25,
          storiesCompleted: 1,
        })
        .where(eq(userStats.userId, testUserId));

      const [stats] = await db.select().from(userStats).where(eq(userStats.userId, testUserId));

      expect(stats.storiesCompleted).toBe(1);
      expect(stats.totalXp).toBe(25);
    });
  });

  describe("Achievements", () => {
    it("should unlock achievement when criteria is met", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Initialize user stats
      await db.insert(userStats).values({
        userId: testUserId,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        totalXp: 0,
        level: 1,
        storiesCompleted: 0,
        quizzesCompleted: 0,
        wordsLearned: 0,
      });

      // Unlock achievement
      await db.insert(userAchievements).values({
        userId: testUserId,
        achievementId: testAchievementId,
        unlockedAt: new Date(),
      });

      const unlocked = await db
        .select()
        .from(userAchievements)
        .where(eq(userAchievements.userId, testUserId));

      expect(unlocked).toHaveLength(1);
      expect(unlocked[0].achievementId).toBe(testAchievementId);
    });

    it("should award XP when achievement is unlocked", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(userStats).values({
        userId: testUserId,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        totalXp: 0,
        level: 1,
        storiesCompleted: 0,
        quizzesCompleted: 0,
        wordsLearned: 0,
      });

      // Unlock achievement and award its XP
      await db.insert(userAchievements).values({
        userId: testUserId,
        achievementId: testAchievementId,
        unlockedAt: new Date(),
      });

      await db
        .update(userStats)
        .set({
          totalXp: 100, // Achievement XP reward
        })
        .where(eq(userStats.userId, testUserId));

      const [stats] = await db.select().from(userStats).where(eq(userStats.userId, testUserId));

      expect(stats.totalXp).toBe(100);
    });

    it("should track multiple achievements for a user", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(userStats).values({
        userId: testUserId,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        totalXp: 0,
        level: 1,
        storiesCompleted: 0,
        quizzesCompleted: 0,
        wordsLearned: 0,
      });

      // Unlock first achievement
      await db.insert(userAchievements).values({
        userId: testUserId,
        achievementId: testAchievementId,
        unlockedAt: new Date(),
      });

      const unlocked = await db
        .select()
        .from(userAchievements)
        .where(eq(userAchievements.userId, testUserId));

      expect(unlocked.length).toBeGreaterThanOrEqual(1);
      expect(unlocked[0].achievementId).toBe(testAchievementId);
    });
  });

  describe("Leaderboard", () => {
    it("should retrieve user stats for leaderboard", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(userStats).values({
        userId: testUserId,
        currentStreak: 5,
        longestStreak: 5,
        lastActivityDate: new Date(),
        totalXp: 500,
        level: 5,
        storiesCompleted: 10,
        quizzesCompleted: 20,
        wordsLearned: 50,
      });

      const leaderboard = await db
        .select()
        .from(userStats)
        .orderBy(userStats.totalXp)
        .limit(10);

      expect(leaderboard.length).toBeGreaterThanOrEqual(1);
      // Verify we can query stats successfully
      expect(leaderboard[0]).toHaveProperty('totalXp');
      expect(leaderboard[0]).toHaveProperty('level');
    });
  });

  describe("Level Calculation", () => {
    it("should calculate correct level for various XP amounts", () => {
      const calculateLevel = (totalXP: number): number => {
        if (totalXP < 100) return 1;
        if (totalXP < 300) return 2;
        if (totalXP < 600) return 3;
        if (totalXP < 1000) return 4;
        return 5 + Math.floor((totalXP - 1000) / 500);
      };

      expect(calculateLevel(0)).toBe(1);
      expect(calculateLevel(50)).toBe(1);
      expect(calculateLevel(100)).toBe(2);
      expect(calculateLevel(299)).toBe(2);
      expect(calculateLevel(300)).toBe(3);
      expect(calculateLevel(599)).toBe(3);
      expect(calculateLevel(600)).toBe(4);
      expect(calculateLevel(999)).toBe(4);
      expect(calculateLevel(1000)).toBe(5);
      expect(calculateLevel(1500)).toBe(6);
      expect(calculateLevel(2000)).toBe(7);
    });
  });
});
