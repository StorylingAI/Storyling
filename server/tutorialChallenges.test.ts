import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users, tutorialChallenges, achievements, userAchievements, userStats, wordbank, quizAttempts } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { getVocabularyRequirement } from "./tutorialRouter";

describe("Tutorial Challenges Enhancements", () => {
  let testUserId: number;
  let testContext: any;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const uniqueOpenId = `test-tutorial-user-${Date.now()}`;

    // Clean up any existing test user
    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.openId, uniqueOpenId))
      .limit(1);
    
    if (existingUser.length > 0) {
      const userId = existingUser[0].id;
      await db.delete(userAchievements).where(eq(userAchievements.userId, userId));
      await db.delete(tutorialChallenges).where(eq(tutorialChallenges.userId, userId));
      await db.delete(quizAttempts).where(eq(quizAttempts.userId, userId));
      await db.delete(wordbank).where(eq(wordbank.userId, userId));
      await db.delete(userStats).where(eq(userStats.userId, userId));
      await db.delete(users).where(eq(users.id, userId));
    }

    // Create test user
    const result = await db.insert(users).values({
      openId: uniqueOpenId,
      name: "Tutorial Test User",
      email: "tutorial@test.com",
      preferredLanguage: "chinese",
      preferredTranslationLanguage: "en",
    });
    
    // Get the created user to get proper ID
    const createdUser = await db
      .select()
      .from(users)
      .where(eq(users.openId, uniqueOpenId))
      .limit(1);
    
    if (createdUser.length === 0) {
      throw new Error("Failed to create test user");
    }
    
    testUserId = createdUser[0].id;

    // Create user stats
    await db.insert(userStats).values({
      userId: testUserId,
      currentStreak: 0,
      longestStreak: 0,
      totalXp: 0,
      level: 1,
      storiesCompleted: 0,
      quizzesCompleted: 0,
      wordsLearned: 0,
    });

    testContext = {
      user: {
        id: testUserId,
        openId: uniqueOpenId,
        name: "Tutorial Test User",
        email: "tutorial@test.com",
        role: "user",
        preferredLanguage: "chinese",
        preferredTranslationLanguage: "en",
      },
    };
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Cleanup
    await db.delete(userAchievements).where(eq(userAchievements.userId, testUserId));
    await db.delete(tutorialChallenges).where(eq(tutorialChallenges.userId, testUserId));
    await db.delete(quizAttempts).where(eq(quizAttempts.userId, testUserId));
    await db.delete(wordbank).where(eq(wordbank.userId, testUserId));
    await db.delete(userStats).where(eq(userStats.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  describe("Personalized Vocabulary Requirements", () => {
    it("should require 3 words for Chinese", () => {
      const requirement = getVocabularyRequirement("chinese");
      expect(requirement).toBe(3);
    });

    it("should require 3 words for Japanese", () => {
      const requirement = getVocabularyRequirement("japanese");
      expect(requirement).toBe(3);
    });

    it("should require 3 words for Korean", () => {
      const requirement = getVocabularyRequirement("korean");
      expect(requirement).toBe(3);
    });

    it("should require 3 words for Arabic", () => {
      const requirement = getVocabularyRequirement("arabic");
      expect(requirement).toBe(3);
    });

    it("should require 3 words for Hebrew", () => {
      const requirement = getVocabularyRequirement("hebrew");
      expect(requirement).toBe(3);
    });

    it("should require 5 words for Spanish", () => {
      const requirement = getVocabularyRequirement("spanish");
      expect(requirement).toBe(5);
    });

    it("should require 5 words for French", () => {
      const requirement = getVocabularyRequirement("french");
      expect(requirement).toBe(5);
    });

    it("should require 5 words for English", () => {
      const requirement = getVocabularyRequirement("english");
      expect(requirement).toBe(5);
    });

    it("should return correct requirement via API", async () => {
      const caller = appRouter.createCaller(testContext);
      const result = await caller.tutorial.getVocabularyRequirement();
      
      expect(result.count).toBe(3); // User's preferred language is Chinese
      expect(result.language).toBe("chinese");
    });
  });

  describe("Quick Start Champion Achievement", () => {
    it("should award achievement when all 5 challenges are completed", async () => {
      const caller = appRouter.createCaller(testContext);
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Complete all 5 challenges
      await caller.tutorial.completeChallenge({ challengeId: "create_story" });
      await caller.tutorial.completeChallenge({ challengeId: "add_vocabulary" });
      await caller.tutorial.completeChallenge({ challengeId: "play_content" });
      await caller.tutorial.completeChallenge({ challengeId: "take_quiz" });
      const result = await caller.tutorial.completeChallenge({ challengeId: "explore_progress" });

      // Check if achievement was awarded
      expect(result.achievement).toBeTruthy();
      expect(result.achievement.awarded).toBe(true);
      expect(result.achievement.achievement.name).toBe("Quick Start Champion");
      expect(result.achievement.xpReward).toBe(100);

      // Verify achievement is in database
      const achievementRecord = await db
        .select()
        .from(achievements)
        .where(eq(achievements.key, "quick_start_champion"))
        .limit(1);
      
      expect(achievementRecord.length).toBe(1);
      expect(achievementRecord[0].name).toBe("Quick Start Champion");
      expect(achievementRecord[0].xpReward).toBe(100);

      // Verify user received the achievement
      const userAchievement = await db
        .select()
        .from(userAchievements)
        .where(eq(userAchievements.userId, testUserId))
        .limit(1);
      
      expect(userAchievement.length).toBe(1);
    });

    it("should grant 100 XP when achievement is awarded", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const stats = await db
        .select()
        .from(userStats)
        .where(eq(userStats.userId, testUserId))
        .limit(1);

      // User should have received 100 XP from the achievement
      expect(stats[0].totalXp).toBeGreaterThanOrEqual(100);
    });

    it("should not award achievement twice", async () => {
      const caller = appRouter.createCaller(testContext);
      
      // Try to complete a challenge again
      const result = await caller.tutorial.completeChallenge({ challengeId: "create_story" });
      
      // Achievement should not be awarded again
      expect(result.achievement).toBeNull();
    });
  });

  describe("Challenge Auto-Detection", () => {
    // Note: Quiz challenge completion is tested manually via the UI
    // The saveAttempt endpoint in routers.ts includes the challenge tracking code

    it("should mark audio playback challenge when play count is incremented", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Reset playback challenge
      await db
        .delete(tutorialChallenges)
        .where(
          eq(tutorialChallenges.userId, testUserId)
        );

      const caller = appRouter.createCaller(testContext);

      // Increment play count (this should auto-complete the challenge)
      await caller.content.incrementPlayCount({ contentId: 1 });

      // Check if challenge was marked as completed
      const challenges = await caller.tutorial.getChallenges();
      const playbackChallenge = challenges.find(c => c.challengeId === "play_content");
      
      expect(playbackChallenge?.completed).toBe(true);
    });
  });

  describe("Challenge Statistics", () => {
    it("should calculate correct completion statistics", async () => {
      const caller = appRouter.createCaller(testContext);
      const stats = await caller.tutorial.getStats();

      expect(stats.totalCount).toBe(5);
      expect(stats.completedCount).toBeGreaterThanOrEqual(0);
      expect(stats.completedCount).toBeLessThanOrEqual(5);
      expect(stats.percentage).toBe(Math.round((stats.completedCount / stats.totalCount) * 100));
      expect(stats.allCompleted).toBe(stats.completedCount === 5);
    });
  });
});
