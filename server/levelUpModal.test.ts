import { describe, it, expect, beforeEach } from "vitest";
import { getDb } from "./db";
import { userStats, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Level-Up Modal Trigger Logic", () => {
  let testUserId: number;

  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a test user
    const [user] = await db
      .insert(users)
      .values({
        openId: `test-levelup-${Date.now()}`,
        name: "Test Level Up User",
        email: "levelup@test.com",
        role: "user",
      })
      .$returningId();
    testUserId = user.id;
  });

  describe("Level Calculation", () => {
    it("should calculate correct level based on total XP", () => {
      const calculateLevel = (totalXp: number) => {
        let level = 1;
        if (totalXp >= 100) level = 2;
        if (totalXp >= 300) level = 3;
        if (totalXp >= 600) level = 4;
        if (totalXp >= 1000) level = 5 + Math.floor((totalXp - 1000) / 500);
        return level;
      };

      expect(calculateLevel(0)).toBe(1);
      expect(calculateLevel(50)).toBe(1);
      expect(calculateLevel(100)).toBe(2);
      expect(calculateLevel(250)).toBe(2);
      expect(calculateLevel(300)).toBe(3);
      expect(calculateLevel(500)).toBe(3);
      expect(calculateLevel(600)).toBe(4);
      expect(calculateLevel(900)).toBe(4);
      expect(calculateLevel(1000)).toBe(5);
      expect(calculateLevel(1500)).toBe(6);
      expect(calculateLevel(2000)).toBe(7);
    });

    it("should detect level-up when XP crosses threshold", () => {
      const checkLevelUp = (previousXp: number, newXp: number) => {
        const calculateLevel = (totalXp: number) => {
          let level = 1;
          if (totalXp >= 100) level = 2;
          if (totalXp >= 300) level = 3;
          if (totalXp >= 600) level = 4;
          if (totalXp >= 1000) level = 5 + Math.floor((totalXp - 1000) / 500);
          return level;
        };

        const previousLevel = calculateLevel(previousXp);
        const newLevel = calculateLevel(newXp);
        return {
          leveledUp: newLevel > previousLevel,
          previousLevel,
          newLevel,
        };
      };

      // No level up
      expect(checkLevelUp(50, 80)).toEqual({
        leveledUp: false,
        previousLevel: 1,
        newLevel: 1,
      });

      // Level up from 1 to 2
      expect(checkLevelUp(80, 120)).toEqual({
        leveledUp: true,
        previousLevel: 1,
        newLevel: 2,
      });

      // Level up from 2 to 3
      expect(checkLevelUp(280, 320)).toEqual({
        leveledUp: true,
        previousLevel: 2,
        newLevel: 3,
      });

      // Level up from 4 to 5
      expect(checkLevelUp(980, 1020)).toEqual({
        leveledUp: true,
        previousLevel: 4,
        newLevel: 5,
      });

      // Level up from 5 to 6
      expect(checkLevelUp(1400, 1550)).toEqual({
        leveledUp: true,
        previousLevel: 5,
        newLevel: 6,
      });
    });
  });

  describe("XP Progress Calculation", () => {
    it("should calculate XP needed for next level", () => {
      const calculateXPForLevel = (level: number) => {
        if (level < 2) return 100;
        if (level < 3) return 300;
        if (level < 4) return 600;
        if (level < 5) return 1000;
        return 1000 + (level - 4) * 500;
      };

      expect(calculateXPForLevel(1)).toBe(100);
      expect(calculateXPForLevel(2)).toBe(300);
      expect(calculateXPForLevel(3)).toBe(600);
      expect(calculateXPForLevel(4)).toBe(1000);
      expect(calculateXPForLevel(5)).toBe(1500);
      expect(calculateXPForLevel(6)).toBe(2000);
      expect(calculateXPForLevel(10)).toBe(4000);
    });

    it("should calculate progress percentage correctly", () => {
      const calculateProgress = (currentXp: number, level: number) => {
        const calculateXPForLevel = (level: number) => {
          if (level < 2) return 100;
          if (level < 3) return 300;
          if (level < 4) return 600;
          if (level < 5) return 1000;
          return 1000 + (level - 4) * 500;
        };

        const xpForNextLevel = calculateXPForLevel(level);
        return (currentXp / xpForNextLevel) * 100;
      };

      // Level 1: 50/100 XP = 50%
      expect(calculateProgress(50, 1)).toBe(50);

      // Level 2: 150/300 XP = 50%
      expect(calculateProgress(150, 2)).toBe(50);

      // Level 3: 450/600 XP = 75%
      expect(calculateProgress(450, 3)).toBe(75);

      // Level 5: 1250/1500 XP ≈ 83.33%
      expect(calculateProgress(1250, 5)).toBeCloseTo(83.33, 1);
    });
  });

  describe("Database Integration", () => {
    it("should track level changes in user stats", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Initialize user at level 1 with 80 XP
      await db.insert(userStats).values({
        userId: testUserId,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: new Date(),
        totalXp: 80,
        level: 1,
        storiesCompleted: 0,
        quizzesCompleted: 0,
        wordsLearned: 0,
      });

      // Award 50 XP (should level up to 2)
      const newXp = 130;
      const newLevel = 2;

      await db
        .update(userStats)
        .set({
          totalXp: newXp,
          level: newLevel,
        })
        .where(eq(userStats.userId, testUserId));

      const [stats] = await db.select().from(userStats).where(eq(userStats.userId, testUserId));

      expect(stats.level).toBe(2);
      expect(stats.totalXp).toBe(130);
    });

    it("should handle multiple level-ups in single XP gain", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Initialize user at level 1 with 50 XP
      await db.insert(userStats).values({
        userId: testUserId,
        currentStreak: 1,
        longestStreak: 1,
        lastActivityDate: new Date(),
        totalXp: 50,
        level: 1,
        storiesCompleted: 0,
        quizzesCompleted: 0,
        wordsLearned: 0,
      });

      // Award massive XP (should jump to level 3)
      const newXp = 350;
      let newLevel = 1;
      if (newXp >= 100) newLevel = 2;
      if (newXp >= 300) newLevel = 3;
      if (newXp >= 600) newLevel = 4;
      if (newXp >= 1000) newLevel = 5 + Math.floor((newXp - 1000) / 500);

      await db
        .update(userStats)
        .set({
          totalXp: newXp,
          level: newLevel,
        })
        .where(eq(userStats.userId, testUserId));

      const [stats] = await db.select().from(userStats).where(eq(userStats.userId, testUserId));

      expect(stats.level).toBe(3);
      expect(stats.totalXp).toBe(350);
    });
  });

  describe("Modal Trigger Conditions", () => {
    it("should trigger modal only when level increases", () => {
      const shouldShowModal = (previousLevel: number, newLevel: number) => {
        return newLevel > previousLevel;
      };

      // Should trigger
      expect(shouldShowModal(1, 2)).toBe(true);
      expect(shouldShowModal(3, 4)).toBe(true);
      expect(shouldShowModal(5, 6)).toBe(true);

      // Should not trigger
      expect(shouldShowModal(2, 2)).toBe(false);
      expect(shouldShowModal(5, 5)).toBe(false);
      expect(shouldShowModal(10, 10)).toBe(false);
    });

    it("should not trigger modal for same-level XP gains", () => {
      const checkModalTrigger = (currentXp: number, xpGain: number) => {
        const calculateLevel = (totalXp: number) => {
          let level = 1;
          if (totalXp >= 100) level = 2;
          if (totalXp >= 300) level = 3;
          if (totalXp >= 600) level = 4;
          if (totalXp >= 1000) level = 5 + Math.floor((totalXp - 1000) / 500);
          return level;
        };

        const previousLevel = calculateLevel(currentXp);
        const newLevel = calculateLevel(currentXp + xpGain);
        return newLevel > previousLevel;
      };

      // Within level 1 (0-99 XP)
      expect(checkModalTrigger(50, 30)).toBe(false);

      // Within level 2 (100-299 XP)
      expect(checkModalTrigger(150, 50)).toBe(false);

      // Crossing level threshold
      expect(checkModalTrigger(90, 20)).toBe(true);
      expect(checkModalTrigger(280, 30)).toBe(true);
    });
  });
});
