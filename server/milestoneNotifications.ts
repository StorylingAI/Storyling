import { getDb } from "./db";
import { collections, collectionMilestones, users } from "../drizzle/schema";
import { eq, and, sql } from "drizzle-orm";
import { notifyOwner } from "./_core/notification";

type MilestoneType = "views_100" | "clones_50" | "views_500" | "clones_100";

interface MilestoneConfig {
  type: MilestoneType;
  threshold: number;
  field: "viewCount" | "cloneCount";
  message: (collectionName: string, count: number) => string;
}

const MILESTONES: MilestoneConfig[] = [
  {
    type: "views_100",
    threshold: 100,
    field: "viewCount",
    message: (name, count) => `Your collection "${name}" has reached ${count} views! 🎉`,
  },
  {
    type: "clones_50",
    threshold: 50,
    field: "cloneCount",
    message: (name, count) => `Your collection "${name}" has been cloned ${count} times! 🌟`,
  },
  {
    type: "views_500",
    threshold: 500,
    field: "viewCount",
    message: (name, count) => `Amazing! Your collection "${name}" has reached ${count} views! 🚀`,
  },
  {
    type: "clones_100",
    threshold: 100,
    field: "cloneCount",
    message: (name, count) => `Incredible! Your collection "${name}" has been cloned ${count} times! 💫`,
  },
];

/**
 * Check and notify collection milestones for a specific collection
 */
export async function checkCollectionMilestones(collectionId: number): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("[Milestones] Database unavailable");
    return;
  }

  try {
    // Get collection details
    const [collection] = await db
      .select({
        id: collections.id,
        name: collections.name,
        viewCount: collections.viewCount,
        cloneCount: collections.cloneCount,
        userId: collections.userId,
        userEmail: users.email,
        userName: users.name,
      })
      .from(collections)
      .innerJoin(users, eq(collections.userId, users.id))
      .where(eq(collections.id, collectionId))
      .limit(1);

    if (!collection) {
      console.error(`[Milestones] Collection ${collectionId} not found`);
      return;
    }

    // Get already achieved milestones
    const achievedMilestones = await db
      .select({
        milestoneType: collectionMilestones.milestoneType,
        notificationSent: collectionMilestones.notificationSent,
      })
      .from(collectionMilestones)
      .where(eq(collectionMilestones.collectionId, collectionId));

    const achievedTypes = new Set(achievedMilestones.map(m => m.milestoneType));

    // Check each milestone
    for (const milestone of MILESTONES) {
      const currentCount = collection[milestone.field];
      
      // Check if milestone is reached and not yet recorded
      if (currentCount >= milestone.threshold && !achievedTypes.has(milestone.type)) {
        // Record milestone achievement
        await db.insert(collectionMilestones).values({
          collectionId: collection.id,
          milestoneType: milestone.type,
          achievedAt: new Date(),
          notificationSent: false,
        });

        // Send notification to collection owner
        const message = milestone.message(collection.name, currentCount);
        const success = await notifyOwner({
          title: "Collection Milestone Reached! 🎉",
          content: message,
        });

        if (success) {
          // Mark notification as sent
          await db
            .update(collectionMilestones)
            .set({
              notificationSent: true,
              notificationSentAt: new Date(),
            })
            .where(
              and(
                eq(collectionMilestones.collectionId, collectionId),
                eq(collectionMilestones.milestoneType, milestone.type)
              )
            );

          console.log(`[Milestones] Notified user ${collection.userId} about ${milestone.type} for collection ${collectionId}`);
        } else {
          console.error(`[Milestones] Failed to send notification for ${milestone.type} on collection ${collectionId}`);
        }
      }
    }
  } catch (error) {
    console.error(`[Milestones] Error checking milestones for collection ${collectionId}:`, error);
  }
}

/**
 * Batch check milestones for all collections (for scheduled jobs)
 */
export async function checkAllCollectionMilestones(): Promise<void> {
  const db = await getDb();
  if (!db) {
    console.error("[Milestones] Database unavailable");
    return;
  }

  try {
    // Get all public collections
    const publicCollections = await db
      .select({ id: collections.id })
      .from(collections)
      .where(eq(collections.isPublic, true));

    console.log(`[Milestones] Checking ${publicCollections.length} collections`);

    // Check each collection
    for (const collection of publicCollections) {
      await checkCollectionMilestones(collection.id);
    }

    console.log("[Milestones] Batch check completed");
  } catch (error) {
    console.error("[Milestones] Error in batch check:", error);
  }
}
