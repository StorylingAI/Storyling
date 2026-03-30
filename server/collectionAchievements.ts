import { getDb } from "./db";
import { achievements, userAchievements, collections } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

// Collection achievement definitions
export const COLLECTION_ACHIEVEMENTS = [
  {
    key: "collection_starter",
    name: "Collection Starter",
    description: "Your collection has been cloned 10 times",
    icon: "🌱",
    category: "collections" as const,
    requirement: 10,
    xpReward: 50,
  },
  {
    key: "collection_rising",
    name: "Rising Creator",
    description: "Your collection has been cloned 50 times",
    icon: "📈",
    category: "collections" as const,
    requirement: 50,
    xpReward: 100,
  },
  {
    key: "collection_popular",
    name: "Popular Collection",
    description: "Your collection has been cloned 100 times",
    icon: "⭐",
    category: "collections" as const,
    requirement: 100,
    xpReward: 250,
  },
  {
    key: "collection_viral",
    name: "Viral Collection",
    description: "Your collection has been cloned 500 times",
    icon: "🔥",
    category: "collections" as const,
    requirement: 500,
    xpReward: 500,
  },
  {
    key: "collection_legend",
    name: "Legend Creator",
    description: "Your collection has been cloned 1,000 times",
    icon: "👑",
    category: "collections" as const,
    requirement: 1000,
    xpReward: 1000,
  },
  {
    key: "collection_icon",
    name: "Iconic Collection",
    description: "Your collection has been cloned 10,000 times",
    icon: "💎",
    category: "collections" as const,
    requirement: 10000,
    xpReward: 5000,
  },
];

/**
 * Initialize collection achievements in the database
 * Call this once during setup or migration
 */
export async function initializeCollectionAchievements() {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  for (const achievement of COLLECTION_ACHIEVEMENTS) {
    // Check if achievement already exists
    const existing = await db
      .select()
      .from(achievements)
      .where(eq(achievements.key, achievement.key))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(achievements).values(achievement);
    }
  }
}

/**
 * Check and award achievements for a collection based on its clone count
 * Returns array of newly unlocked achievements
 */
export async function checkAndAwardCollectionAchievements(
  collectionId: number,
  userId: number,
  cloneCount: number
): Promise<Array<{ key: string; name: string; icon: string; xpReward: number }>> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  const newlyUnlocked: Array<{ key: string; name: string; icon: string; xpReward: number }> = [];

  // Get all collection achievements that this clone count qualifies for
  const qualifyingAchievements = COLLECTION_ACHIEVEMENTS.filter(
    (ach) => cloneCount >= ach.requirement
  );

  for (const achievement of qualifyingAchievements) {
    // Get the achievement ID from database
    const achievementRecord = await db
      .select()
      .from(achievements)
      .where(eq(achievements.key, achievement.key))
      .limit(1);

    if (achievementRecord.length === 0) continue;

    const achievementId = achievementRecord[0].id;

    // Check if user already has this achievement
    const existing = await db
      .select()
      .from(userAchievements)
      .where(
        and(
          eq(userAchievements.userId, userId),
          eq(userAchievements.achievementId, achievementId)
        )
      )
      .limit(1);

    // If not already unlocked, award it
    if (existing.length === 0) {
      await db.insert(userAchievements).values({
        userId,
        achievementId,
      });

      newlyUnlocked.push({
        key: achievement.key,
        name: achievement.name,
        icon: achievement.icon,
        xpReward: achievement.xpReward,
      });
    }
  }

  return newlyUnlocked;
}

/**
 * Get all achievements earned for a specific collection
 */
export async function getCollectionAchievements(collectionId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");

  // Get collection and owner
  const collection = await db
    .select()
    .from(collections)
    .where(eq(collections.id, collectionId))
    .limit(1);

  if (collection.length === 0) return [];

  const cloneCount = collection[0].cloneCount;
  const userId = collection[0].userId;

  // Get all achievements the user has unlocked in the collections category
  const userAchievementRecords = await db
    .select({
      key: achievements.key,
      name: achievements.name,
      description: achievements.description,
      icon: achievements.icon,
      requirement: achievements.requirement,
      unlockedAt: userAchievements.unlockedAt,
    })
    .from(userAchievements)
    .innerJoin(achievements, eq(userAchievements.achievementId, achievements.id))
    .where(
      and(
        eq(userAchievements.userId, userId),
        eq(achievements.category, "collections")
      )
    );

  return userAchievementRecords;
}

/**
 * Get next milestone for a collection
 */
export function getNextMilestone(cloneCount: number): { requirement: number; name: string; icon: string } | null {
  const nextAchievement = COLLECTION_ACHIEVEMENTS.find(
    (ach) => cloneCount < ach.requirement
  );

  if (!nextAchievement) return null;

  return {
    requirement: nextAchievement.requirement,
    name: nextAchievement.name,
    icon: nextAchievement.icon,
  };
}
