import { z } from "zod";
import { router, protectedProcedure } from "./_core/trpc";
import { tutorialChallenges, achievements, userAchievements, userStats, users } from "../drizzle/schema";
import { getDb } from "./db";
import { eq, and } from "drizzle-orm";

/**
 * Tutorial challenge definitions
 */
export const TUTORIAL_CHALLENGES = {
  CREATE_STORY: "create_story",
  ADD_VOCABULARY: "add_vocabulary",
  PLAY_CONTENT: "play_content",
  TAKE_QUIZ: "take_quiz",
  EXPLORE_PROGRESS: "explore_progress",
} as const;

export type TutorialChallengeId = typeof TUTORIAL_CHALLENGES[keyof typeof TUTORIAL_CHALLENGES];

/**
 * Challenge metadata for UI display
 */
export const CHALLENGE_METADATA: Record<TutorialChallengeId, {
  title: string;
  description: string;
  icon: string;
  actionLabel: string;
  actionUrl: string;
}> = {
  [TUTORIAL_CHALLENGES.CREATE_STORY]: {
    title: "Create Your First Story",
    description: "Generate a personalized story with vocabulary you want to learn",
    icon: "✍️",
    actionLabel: "Create Story",
    actionUrl: "/create",
  },
  [TUTORIAL_CHALLENGES.ADD_VOCABULARY]: {
    title: "Build Your Wordbank",
    description: "Add words to your personal vocabulary collection",
    icon: "📚",
    actionLabel: "Add Words",
    actionUrl: "/wordbank",
  },
  [TUTORIAL_CHALLENGES.PLAY_CONTENT]: {
    title: "Listen to a Story",
    description: "Experience immersive audio narration with native pronunciation",
    icon: "🎧",
    actionLabel: "Browse Library",
    actionUrl: "/library",
  },
  [TUTORIAL_CHALLENGES.TAKE_QUIZ]: {
    title: "Test Your Knowledge",
    description: "Complete a vocabulary quiz to reinforce what you've learned",
    icon: "🎯",
    actionLabel: "Take Quiz",
    actionUrl: "/review",
  },
  [TUTORIAL_CHALLENGES.EXPLORE_PROGRESS]: {
    title: "Check Your Progress",
    description: "View your learning statistics and achievements",
    icon: "📊",
    actionLabel: "View Progress",
    actionUrl: "/progress",
  },
};

/**
 * Get vocabulary requirement based on user's target language
 */
export function getVocabularyRequirement(targetLanguage: string): number {
  // Languages with complex writing systems require fewer words
  const complexLanguages = ['chinese', 'japanese', 'korean', 'arabic', 'hebrew'];
  return complexLanguages.includes(targetLanguage.toLowerCase()) ? 3 : 5;
}

/**
 * Get user's challenge completion status
 */
export async function getUserChallenges(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const challenges = await db
    .select()
    .from(tutorialChallenges)
    .where(eq(tutorialChallenges.userId, userId));

  // Create a map of completed challenges
  const completedMap = new Map(
    challenges.map(c => [c.challengeId, c])
  );

  // Return all challenges with completion status
  return Object.values(TUTORIAL_CHALLENGES).map(challengeId => ({
    challengeId,
    ...CHALLENGE_METADATA[challengeId],
    completed: completedMap.has(challengeId) && completedMap.get(challengeId)?.completed || false,
    completedAt: completedMap.get(challengeId)?.completedAt || null,
  }));
}

/**
 * Mark a challenge as completed
 */
export async function completeChallenge(userId: number, challengeId: TutorialChallengeId) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Check if challenge already exists
  const existing = await db
    .select()
    .from(tutorialChallenges)
    .where(
      and(
        eq(tutorialChallenges.userId, userId),
        eq(tutorialChallenges.challengeId, challengeId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    // Update existing challenge
    await db
      .update(tutorialChallenges)
      .set({
        completed: true,
        completedAt: new Date(),
      })
      .where(eq(tutorialChallenges.id, existing[0].id));
  } else {
    // Insert new challenge
    await db.insert(tutorialChallenges).values({
      userId,
      challengeId,
      completed: true,
      completedAt: new Date(),
    });
  }

  return { success: true };
}

/**
 * Get challenge completion statistics
 */
export async function getChallengeStats(userId: number) {
  const challenges = await getUserChallenges(userId);
  const completedCount = challenges.filter(c => c.completed).length;
  const totalCount = challenges.length;

  return {
    completedCount,
    totalCount,
    percentage: Math.round((completedCount / totalCount) * 100),
    allCompleted: completedCount === totalCount,
  };
}

/**
 * Award "Quick Start Champion" achievement when all tutorial challenges are completed
 */
export async function checkAndAwardQuickStartChampion(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");

  // Check if all challenges are completed
  const stats = await getChallengeStats(userId);
  if (!stats.allCompleted) {
    return { awarded: false };
  }

  // Check if achievement already exists
  const achievementKey = "quick_start_champion";
  let achievement = await db
    .select()
    .from(achievements)
    .where(eq(achievements.key, achievementKey))
    .limit(1);

  // Create achievement if it doesn't exist
  if (achievement.length === 0) {
    await db.insert(achievements).values({
      key: achievementKey,
      name: "Quick Start Champion",
      description: "Complete all 5 tutorial challenges",
      icon: "🏆",
      category: "special",
      requirement: 5,
      xpReward: 100,
    });
    achievement = await db
      .select()
      .from(achievements)
      .where(eq(achievements.key, achievementKey))
      .limit(1);
  }

  const achievementId = achievement[0].id;

  // Check if user already has this achievement
  const existingUserAchievement = await db
    .select()
    .from(userAchievements)
    .where(
      and(
        eq(userAchievements.userId, userId),
        eq(userAchievements.achievementId, achievementId)
      )
    )
    .limit(1);

  if (existingUserAchievement.length > 0) {
    return { awarded: false, alreadyAwarded: true };
  }

  // Award achievement
  await db.insert(userAchievements).values({
    userId,
    achievementId,
    unlockedAt: new Date(),
  });

  // Grant XP reward
  const xpReward = achievement[0].xpReward;
  const currentStats = await db
    .select()
    .from(userStats)
    .where(eq(userStats.userId, userId))
    .limit(1);
  
  if (currentStats.length > 0) {
    const current = currentStats[0];
    const newTotalXP = current.totalXp + xpReward;
    await db
      .update(userStats)
      .set({
        totalXp: newTotalXP,
      })
      .where(eq(userStats.userId, userId));
  }

  return {
    awarded: true,
    achievement: achievement[0],
    xpReward,
  };
}

/**
 * Tutorial router with challenge tracking endpoints
 */
export const tutorialRouter = router({
  /**
   * Get all challenges for the current user
   */
  getChallenges: protectedProcedure.query(async ({ ctx }) => {
    return getUserChallenges(ctx.user.id);
  }),

  /**
   * Get challenge completion statistics
   */
  getStats: protectedProcedure.query(async ({ ctx }) => {
    return getChallengeStats(ctx.user.id);
  }),

  /**
   * Mark a challenge as completed
   */
  completeChallenge: protectedProcedure
    .input(
      z.object({
        challengeId: z.enum([
          TUTORIAL_CHALLENGES.CREATE_STORY,
          TUTORIAL_CHALLENGES.ADD_VOCABULARY,
          TUTORIAL_CHALLENGES.PLAY_CONTENT,
          TUTORIAL_CHALLENGES.TAKE_QUIZ,
          TUTORIAL_CHALLENGES.EXPLORE_PROGRESS,
        ]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const result = await completeChallenge(ctx.user.id, input.challengeId);
      
      // Check if user completed all challenges and award achievement
      const achievementResult = await checkAndAwardQuickStartChampion(ctx.user.id);
      
      return {
        ...result,
        achievement: achievementResult.awarded ? achievementResult : null,
      };
    }),

  /**
   * Get vocabulary requirement based on user's target language
   */
  getVocabularyRequirement: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    
    const user = await db
      .select()
      .from(users)
      .where(eq(users.id, ctx.user.id))
      .limit(1);
    
    const targetLanguage = user[0]?.preferredLanguage || 'english';
    return {
      count: getVocabularyRequirement(targetLanguage),
      language: targetLanguage,
    };
  }),

  /**
   * Reset all challenges (for testing)
   */
  resetChallenges: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    await db
      .delete(tutorialChallenges)
      .where(eq(tutorialChallenges.userId, ctx.user.id));
    return { success: true };
  }),
});
