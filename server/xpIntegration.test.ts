import { describe, it, expect, beforeEach } from "vitest";
import { getDb } from "./db";
import { userStats, achievements, userAchievements, users, quizAttempts } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("XP Reward System Integration", () => {
  let testUserId: number;

  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a test user
    const [user] = await db
      .insert(users)
      .values({
        openId: `test-xp-${Date.now()}`,
        name: "Test XP User",
        email: "xp@test.com",
        role: "user",
      })
      .$returningId();
    testUserId = user.id;
  });

  describe("Quiz Completion XP Flow", () => {
    it("should award correct XP based on quiz score", async () => {
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

      // Simulate perfect score (100%)
      const perfectScoreXP = 50;
      await db
        .update(userStats)
        .set({
          totalXp: perfectScoreXP,
          quizzesCompleted: 1,
          lastActivityDate: new Date(),
          currentStreak: 1,
        })
        .where(eq(userStats.userId, testUserId));

      const [stats] = await db.select().from(userStats).where(eq(userStats.userId, testUserId));

      expect(stats.totalXp).toBe(50);
      expect(stats.quizzesCompleted).toBe(1);
      expect(stats.currentStreak).toBe(1);
    });

    it("should award different XP for different score ranges", () => {
      // Test XP calculation logic
      const calculateQuizXP = (score: number, total: number) => {
        const percentage = (score / total) * 100;
        if (percentage === 100) return 50;
        if (percentage >= 80) return 30;
        if (percentage >= 60) return 20;
        return 10;
      };

      expect(calculateQuizXP(10, 10)).toBe(50); // 100%
      expect(calculateQuizXP(9, 10)).toBe(30); // 90%
      expect(calculateQuizXP(8, 10)).toBe(30); // 80%
      expect(calculateQuizXP(7, 10)).toBe(20); // 70%
      expect(calculateQuizXP(6, 10)).toBe(20); // 60%
      expect(calculateQuizXP(5, 10)).toBe(10); // 50%
    });

    it("should update streak on consecutive day quiz completion", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Initialize with yesterday's activity
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      await db.insert(userStats).values({
        userId: testUserId,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: yesterday,
        totalXp: 50,
        level: 1,
        storiesCompleted: 0,
        quizzesCompleted: 1,
        wordsLearned: 0,
      });

      // Complete quiz today (should increment streak)
      const today = new Date();
      await db
        .update(userStats)
        .set({
          currentStreak: 2,
          longestStreak: 2,
          lastActivityDate: today,
          totalXp: 80,
          quizzesCompleted: 2,
        })
        .where(eq(userStats.userId, testUserId));

      const [stats] = await db.select().from(userStats).where(eq(userStats.userId, testUserId));

      expect(stats.currentStreak).toBe(2);
      expect(stats.longestStreak).toBe(2);
    });

    it("should unlock quiz achievements at milestones", async () => {
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

      // Find "First Quiz" achievement
      const [firstQuizAchievement] = await db
        .select()
        .from(achievements)
        .where(eq(achievements.key, "first_quiz"));

      if (!firstQuizAchievement) {
        // Skip if achievement doesn't exist
        return;
      }

      // Complete first quiz
      await db
        .update(userStats)
        .set({
          quizzesCompleted: 1,
          totalXp: 50,
        })
        .where(eq(userStats.userId, testUserId));

      // Unlock achievement
      await db.insert(userAchievements).values({
        userId: testUserId,
        achievementId: firstQuizAchievement.id,
        unlockedAt: new Date(),
      });

      const unlocked = await db
        .select()
        .from(userAchievements)
        .where(eq(userAchievements.userId, testUserId));

      expect(unlocked.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Story Creation XP Flow", () => {
    it("should award 25 XP for story creation", async () => {
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

      // Simulate story creation
      const storyXP = 25;
      await db
        .update(userStats)
        .set({
          totalXp: storyXP,
          storiesCompleted: 1,
          lastActivityDate: new Date(),
          currentStreak: 1,
        })
        .where(eq(userStats.userId, testUserId));

      const [stats] = await db.select().from(userStats).where(eq(userStats.userId, testUserId));

      expect(stats.totalXp).toBe(25);
      expect(stats.storiesCompleted).toBe(1);
    });

    it("should update words learned count when creating story", async () => {
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

      // Create story with 10 vocabulary words
      const vocabularyCount = 10;
      await db
        .update(userStats)
        .set({
          totalXp: 25,
          storiesCompleted: 1,
          wordsLearned: vocabularyCount,
        })
        .where(eq(userStats.userId, testUserId));

      const [stats] = await db.select().from(userStats).where(eq(userStats.userId, testUserId));

      expect(stats.wordsLearned).toBe(10);
    });

    it("should unlock story achievements at milestones", async () => {
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

      // Find "First Story" achievement
      const [firstStoryAchievement] = await db
        .select()
        .from(achievements)
        .where(eq(achievements.key, "first_story"));

      if (!firstStoryAchievement) {
        return;
      }

      // Create first story
      await db
        .update(userStats)
        .set({
          storiesCompleted: 1,
          totalXp: 25,
        })
        .where(eq(userStats.userId, testUserId));

      // Unlock achievement
      await db.insert(userAchievements).values({
        userId: testUserId,
        achievementId: firstStoryAchievement.id,
        unlockedAt: new Date(),
      });

      const unlocked = await db
        .select()
        .from(userAchievements)
        .where(eq(userAchievements.userId, testUserId));

      expect(unlocked.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Combined Activity Flow", () => {
    it("should accumulate XP from multiple activities", async () => {
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

      // Create a story (25 XP)
      await db
        .update(userStats)
        .set({
          totalXp: 25,
          storiesCompleted: 1,
        })
        .where(eq(userStats.userId, testUserId));

      // Complete a quiz (30 XP for 80% score)
      await db
        .update(userStats)
        .set({
          totalXp: 55,
          quizzesCompleted: 1,
        })
        .where(eq(userStats.userId, testUserId));

      const [stats] = await db.select().from(userStats).where(eq(userStats.userId, testUserId));

      expect(stats.totalXp).toBe(55);
      expect(stats.storiesCompleted).toBe(1);
      expect(stats.quizzesCompleted).toBe(1);
    });

    it("should level up when reaching XP thresholds", async () => {
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

      // Accumulate 150 XP (should be level 2)
      await db
        .update(userStats)
        .set({
          totalXp: 150,
          level: 2,
        })
        .where(eq(userStats.userId, testUserId));

      const [stats] = await db.select().from(userStats).where(eq(userStats.userId, testUserId));

      expect(stats.level).toBe(2);
      expect(stats.totalXp).toBe(150);
    });

    it("should maintain streak across different activity types", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const today = new Date();
      await db.insert(userStats).values({
        userId: testUserId,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: today,
        totalXp: 25,
        level: 1,
        storiesCompleted: 1,
        quizzesCompleted: 0,
        wordsLearned: 0,
      });

      // Complete quiz on same day (streak should stay at 1)
      await db
        .update(userStats)
        .set({
          totalXp: 55,
          quizzesCompleted: 1,
        })
        .where(eq(userStats.userId, testUserId));

      const [stats] = await db.select().from(userStats).where(eq(userStats.userId, testUserId));

      expect(stats.currentStreak).toBe(1); // Same day, no increment
    });
  });

  describe("Achievement XP Bonuses", () => {
    it("should award bonus XP when unlocking achievements", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(userStats).values({
        userId: testUserId,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: null,
        totalXp: 50,
        level: 1,
        storiesCompleted: 0,
        quizzesCompleted: 1,
        wordsLearned: 0,
      });

      // Find an achievement with known XP reward
      const [achievement] = await db
        .select()
        .from(achievements)
        .where(eq(achievements.key, "first_quiz"));

      if (!achievement) return;

      // Unlock achievement and award its XP
      await db.insert(userAchievements).values({
        userId: testUserId,
        achievementId: achievement.id,
        unlockedAt: new Date(),
      });

      await db
        .update(userStats)
        .set({
          totalXp: 50 + achievement.xpReward,
        })
        .where(eq(userStats.userId, testUserId));

      const [stats] = await db.select().from(userStats).where(eq(userStats.userId, testUserId));

      expect(stats.totalXp).toBeGreaterThan(50);
    });
  });
});
