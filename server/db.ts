import { eq, and, desc, inArray } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import { sql } from "drizzle-orm";
import {
  InsertUser,
  users,
  vocabularyLists,
  InsertVocabularyList,
  VocabularyList,
  generatedContent,
  InsertGeneratedContent,
  GeneratedContent,
  learningProgress,
  InsertLearningProgress,
  LearningProgress,
  favorites,
  InsertFavorite,
  Favorite,
  levelTestResults,
  InsertLevelTestResult,
  LevelTestResult,
  voiceFavorites,
  InsertVoiceFavorite,
  VoiceFavorite,
  affiliateClicks,
  InsertAffiliateClick,
  AffiliateClick,
  affiliateEarnings,
  InsertAffiliateEarning,
  AffiliateEarning,
  affiliatePayouts,
  InsertAffiliatePayout,
  AffiliatePayout,
  referralCodes,
  referralConversions,
} from "../drizzle/schema";
import { ENV } from './_core/env';

let _db: ReturnType<typeof drizzle> | null = null;

// Lazily create the drizzle instance so local tooling can run without a DB.
export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try {
      _db = drizzle(process.env.DATABASE_URL);
    } catch (error) {
      console.warn("[Database] Failed to connect:", error);
      _db = null;
    }
  }
  return _db;
}

export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) {
    throw new Error("User openId is required for upsert");
  }

  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot upsert user: database not available");
    return;
  }

  try {
    const values: InsertUser = {
      openId: user.openId,
    };
    const updateSet: Record<string, unknown> = {};

    const textFields = ["name", "email", "loginMethod"] as const;
    type TextField = (typeof textFields)[number];

    const assignNullable = (field: TextField) => {
      const value = user[field];
      if (value === undefined) return;
      const normalized = value ?? null;
      values[field] = normalized;
      updateSet[field] = normalized;
    };

    textFields.forEach(assignNullable);

    if (user.lastSignedIn !== undefined) {
      values.lastSignedIn = user.lastSignedIn;
      updateSet.lastSignedIn = user.lastSignedIn;
    }
    if (user.role !== undefined) {
      values.role = user.role;
      updateSet.role = user.role;
    } else if (user.openId === ENV.ownerOpenId) {
      values.role = 'admin';
      updateSet.role = 'admin';
    }

    if (!values.lastSignedIn) {
      values.lastSignedIn = new Date();
    }

    if (Object.keys(updateSet).length === 0) {
      updateSet.lastSignedIn = new Date();
    }

    await db.insert(users).values(values).onDuplicateKeyUpdate({
      set: updateSet,
    });
  } catch (error) {
    console.error("[Database] Failed to upsert user:", error);
    throw error;
  }
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) {
    console.warn("[Database] Cannot get user: database not available");
    return undefined;
  }

  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);

  return result.length > 0 ? result[0] : undefined;
}

// Vocabulary Lists
export async function createVocabularyList(data: InsertVocabularyList): Promise<VocabularyList> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(vocabularyLists).values(data);
  const insertedId = Number(result[0].insertId);

  const inserted = await db
    .select()
    .from(vocabularyLists)
    .where(eq(vocabularyLists.id, insertedId))
    .limit(1);

  if (!inserted[0]) throw new Error("Failed to retrieve inserted vocabulary list");
  return inserted[0];
}

export async function getVocabularyListsByUserId(userId: number): Promise<VocabularyList[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(vocabularyLists)
    .where(eq(vocabularyLists.userId, userId))
    .orderBy(desc(vocabularyLists.createdAt));
}

// Generated Content
export async function createGeneratedContent(
  data: InsertGeneratedContent
): Promise<GeneratedContent> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(generatedContent).values(data);
  const insertedId = Number(result[0].insertId);

  const inserted = await db
    .select()
    .from(generatedContent)
    .where(eq(generatedContent.id, insertedId))
    .limit(1);

  if (!inserted[0]) throw new Error("Failed to retrieve inserted content");
  return inserted[0];
}

export async function updateContentProgress(id: number, progress: number, stage: string): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  await db
    .update(generatedContent)
    .set({ progress, progressStage: stage })
    .where(eq(generatedContent.id, id));
}

export async function updateGeneratedContent(
  id: number,
  data: Partial<InsertGeneratedContent>
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db.update(generatedContent).set(data).where(eq(generatedContent.id, id));
}

export async function getGeneratedContentByUserId(userId: number): Promise<GeneratedContent[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(generatedContent)
    .where(eq(generatedContent.userId, userId))
    .orderBy(desc(generatedContent.generatedAt));
}

export async function getGeneratedContentById(id: number): Promise<GeneratedContent | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const result = await db
    .select()
    .from(generatedContent)
    .where(eq(generatedContent.id, id))
    .limit(1);

  return result[0];
}

export async function incrementPlayCount(contentId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const content = await getGeneratedContentById(contentId);
  if (!content) return;

  await db
    .update(generatedContent)
    .set({
      playCount: (content.playCount || 0) + 1,
      lastPlayedAt: new Date(),
    })
    .where(eq(generatedContent.id, contentId));
}

// Learning Progress
export async function upsertLearningProgress(
  data: InsertLearningProgress
): Promise<LearningProgress> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const existing = await db
    .select()
    .from(learningProgress)
    .where(
      and(
        eq(learningProgress.userId, data.userId),
        eq(learningProgress.targetLanguage, data.targetLanguage)
      )
    )
    .limit(1);

  if (existing[0]) {
    await db
      .update(learningProgress)
      .set({
        ...data,
        updatedAt: new Date(),
      })
      .where(eq(learningProgress.id, existing[0].id));

    const updated = await db
      .select()
      .from(learningProgress)
      .where(eq(learningProgress.id, existing[0].id))
      .limit(1);

    if (!updated[0]) throw new Error("Failed to retrieve updated progress");
    return updated[0];
  } else {
    const result = await db.insert(learningProgress).values(data);
    const insertedId = Number(result[0].insertId);

    const inserted = await db
      .select()
      .from(learningProgress)
      .where(eq(learningProgress.id, insertedId))
      .limit(1);

    if (!inserted[0]) throw new Error("Failed to retrieve inserted progress");
    return inserted[0];
  }
}

export async function getLearningProgressByUserId(userId: number): Promise<LearningProgress[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(learningProgress).where(eq(learningProgress.userId, userId));
}

// Favorites
export async function addFavorite(userId: number, contentId: number): Promise<Favorite> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const result = await db.insert(favorites).values({ userId, contentId });
  const insertedId = Number(result[0].insertId);

  const inserted = await db.select().from(favorites).where(eq(favorites.id, insertedId)).limit(1);

  if (!inserted[0]) throw new Error("Failed to retrieve inserted favorite");
  return inserted[0];
}

export async function removeFavorite(userId: number, contentId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(favorites)
    .where(and(eq(favorites.userId, userId), eq(favorites.contentId, contentId)));
}

export async function bulkDeleteContent(userId: number, contentIds: number[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(generatedContent)
    .where(and(eq(generatedContent.userId, userId), inArray(generatedContent.id, contentIds)));
}

export async function bulkMarkComplete(userId: number, contentIds: number[]): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Import story_progress table
  const { storyProgress } = await import("../drizzle/schema");
  
  // For each content, update or insert progress to mark as complete
  for (const contentId of contentIds) {
    // Get the content to find total duration
    const content = await db
      .select()
      .from(generatedContent)
      .where(and(eq(generatedContent.id, contentId), eq(generatedContent.userId, userId)))
      .limit(1);
    
    if (content.length > 0) {
      // Get existing progress or create new
      const existing = await db
        .select()
        .from(storyProgress)
        .where(and(eq(storyProgress.userId, userId), eq(storyProgress.contentId, contentId)))
        .limit(1);
      
      // Set a reasonable total duration if not available (e.g., 300 seconds for audio, 600 for video)
      const totalDuration = existing[0]?.totalDuration || (content[0].mode === 'podcast' ? 300 : 600);
      
      if (existing.length > 0) {
        // Update existing progress to mark as complete
        await db
          .update(storyProgress)
          .set({ 
            currentTime: totalDuration,
            totalDuration: totalDuration,
            updatedAt: new Date()
          })
          .where(eq(storyProgress.id, existing[0].id));
      } else {
        // Insert new progress record marked as complete
        await db.insert(storyProgress).values({
          userId,
          contentId,
          currentTime: totalDuration,
          totalDuration: totalDuration,
          completed: true,
        });
      }
    }
  }
}

export async function getFavoritesByUserId(userId: number): Promise<Favorite[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(favorites).where(eq(favorites.userId, userId));
}

// Level Test Results
export async function saveLevelTestResult(data: InsertLevelTestResult): Promise<LevelTestResult> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const [result] = await db.insert(levelTestResults).values(data).$returningId();
  const [inserted] = await db.select().from(levelTestResults).where(eq(levelTestResults.id, result.id));
  return inserted;
}

export async function getLatestLevelTestResult(
  userId: number,
  targetLanguage: string
): Promise<LevelTestResult | undefined> {
  const db = await getDb();
  if (!db) return undefined;

  const [result] = await db
    .select()
    .from(levelTestResults)
    .where(
      and(
        eq(levelTestResults.userId, userId),
        eq(levelTestResults.targetLanguage, targetLanguage)
      )
    )
    .orderBy(desc(levelTestResults.createdAt))
    .limit(1);

  return result;
}

export async function getAllLevelTestResults(userId: number): Promise<LevelTestResult[]> {
  const db = await getDb();
  if (!db) return [];

  return await db
    .select()
    .from(levelTestResults)
    .where(eq(levelTestResults.userId, userId))
    .orderBy(desc(levelTestResults.createdAt));
}

// Voice Favorites
export async function addVoiceFavorite(data: InsertVoiceFavorite): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  // Check if this favorite already exists
  const existing = await db
    .select()
    .from(voiceFavorites)
    .where(
      and(
        eq(voiceFavorites.userId, data.userId),
        eq(voiceFavorites.targetLanguage, data.targetLanguage),
        eq(voiceFavorites.voiceType, data.voiceType),
        eq(voiceFavorites.narratorGender, data.narratorGender)
      )
    )
    .limit(1);

  if (existing.length === 0) {
    await db.insert(voiceFavorites).values(data);
  }
}

export async function removeVoiceFavorite(
  userId: number,
  targetLanguage: string,
  voiceType: string,
  narratorGender: "male" | "female"
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  await db
    .delete(voiceFavorites)
    .where(
      and(
        eq(voiceFavorites.userId, userId),
        eq(voiceFavorites.targetLanguage, targetLanguage),
        eq(voiceFavorites.voiceType, voiceType),
        eq(voiceFavorites.narratorGender, narratorGender)
      )
    );
}

export async function getVoiceFavoritesByUserId(userId: number): Promise<VoiceFavorite[]> {
  const db = await getDb();
  if (!db) return [];

  return await db.select().from(voiceFavorites).where(eq(voiceFavorites.userId, userId));
}

// ========================================
// Collection Badges
// ========================================

export async function awardCollectionBadge(
  collectionId: number,
  badgeType: "trending" | "top_100" | "community_favorite" | "rising_star" | "viral" | "evergreen",
  expiresAt?: Date
) {
  const db = await getDb();
  if (!db) return null;

  const { collectionBadges } = await import("../drizzle/schema");
  const { eq, and } = await import("drizzle-orm");

  // Check if badge already exists and is active
  const existing = await db
    .select()
    .from(collectionBadges)
    .where(
      and(
        eq(collectionBadges.collectionId, collectionId),
        eq(collectionBadges.badgeType, badgeType),
        eq(collectionBadges.isActive, true)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  await db.insert(collectionBadges).values({
    collectionId,
    badgeType,
    expiresAt: expiresAt || null,
    isActive: true,
  });

  // Return the newly created badge
  const newBadge = await db
    .select()
    .from(collectionBadges)
    .where(
      and(
        eq(collectionBadges.collectionId, collectionId),
        eq(collectionBadges.badgeType, badgeType),
        eq(collectionBadges.isActive, true)
      )
    )
    .limit(1);

  return newBadge[0] || null;
}

export async function getCollectionBadges(collectionId: number) {
  const db = await getDb();
  if (!db) return [];

  const { collectionBadges } = await import("../drizzle/schema");
  const { eq, and, or, gt, isNull } = await import("drizzle-orm");

  return db
    .select()
    .from(collectionBadges)
    .where(
      and(
        eq(collectionBadges.collectionId, collectionId),
        eq(collectionBadges.isActive, true),
        or(
          isNull(collectionBadges.expiresAt),
          gt(collectionBadges.expiresAt, new Date())
        )
      )
    );
}

export async function expireOldBadges() {
  const db = await getDb();
  if (!db) return;

  const { collectionBadges } = await import("../drizzle/schema");
  const { and, lt, eq } = await import("drizzle-orm");

  await db
    .update(collectionBadges)
    .set({ isActive: false })
    .where(
      and(
        eq(collectionBadges.isActive, true),
        lt(collectionBadges.expiresAt, new Date())
      )
    );
}

// ========================================
// Collection Categories
// ========================================

export async function getAllCategories() {
  const db = await getDb();
  if (!db) return [];

  const { collectionCategories } = await import("../drizzle/schema");
  const { eq, asc } = await import("drizzle-orm");

  return db
    .select()
    .from(collectionCategories)
    .where(eq(collectionCategories.isActive, true))
    .orderBy(asc(collectionCategories.displayOrder));
}

export async function assignCollectionCategory(collectionId: number, categoryId: number) {
  const db = await getDb();
  if (!db) return null;

  const { collectionCategoryAssignments } = await import("../drizzle/schema");
  const { eq, and } = await import("drizzle-orm");

  // Check if already assigned
  const existing = await db
    .select()
    .from(collectionCategoryAssignments)
    .where(
      and(
        eq(collectionCategoryAssignments.collectionId, collectionId),
        eq(collectionCategoryAssignments.categoryId, categoryId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  await db.insert(collectionCategoryAssignments).values({
    collectionId,
    categoryId,
  });

  // Return the newly created assignment
  const newAssignment = await db
    .select()
    .from(collectionCategoryAssignments)
    .where(
      and(
        eq(collectionCategoryAssignments.collectionId, collectionId),
        eq(collectionCategoryAssignments.categoryId, categoryId)
      )
    )
    .limit(1);

  return newAssignment[0] || null;
}

export async function getCollectionCategories(collectionId: number) {
  const db = await getDb();
  if (!db) return [];

  const { collectionCategoryAssignments, collectionCategories } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  return db
    .select({
      id: collectionCategories.id,
      name: collectionCategories.name,
      slug: collectionCategories.slug,
      icon: collectionCategories.icon,
      color: collectionCategories.color,
    })
    .from(collectionCategoryAssignments)
    .innerJoin(
      collectionCategories,
      eq(collectionCategoryAssignments.categoryId, collectionCategories.id)
    )
    .where(eq(collectionCategoryAssignments.collectionId, collectionId));
}

export async function removeCollectionCategory(collectionId: number, categoryId: number) {
  const db = await getDb();
  if (!db) return;

  const { collectionCategoryAssignments } = await import("../drizzle/schema");
  const { eq, and } = await import("drizzle-orm");

  await db
    .delete(collectionCategoryAssignments)
    .where(
      and(
        eq(collectionCategoryAssignments.collectionId, collectionId),
        eq(collectionCategoryAssignments.categoryId, categoryId)
      )
    );
}

// ========================================
// Collection Tags
// ========================================

export async function createOrGetTag(name: string) {
  const db = await getDb();
  if (!db) return null;

  const { collectionTags } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  const slug = name.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");

  // Try to find existing tag
  const existing = await db
    .select()
    .from(collectionTags)
    .where(eq(collectionTags.slug, slug))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Create new tag
  await db.insert(collectionTags).values({
    name,
    slug,
    usageCount: 0,
  });

  // Return the newly created tag
  const newTag = await db
    .select()
    .from(collectionTags)
    .where(eq(collectionTags.slug, slug))
    .limit(1);

  return newTag[0] || null;
}

export async function assignCollectionTag(collectionId: number, tagId: number) {
  const db = await getDb();
  if (!db) return null;

  const { collectionTagAssignments, collectionTags } = await import("../drizzle/schema");
  const { eq, and } = await import("drizzle-orm");

  // Check if already assigned
  const existing = await db
    .select()
    .from(collectionTagAssignments)
    .where(
      and(
        eq(collectionTagAssignments.collectionId, collectionId),
        eq(collectionTagAssignments.tagId, tagId)
      )
    )
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  // Assign tag
  await db.insert(collectionTagAssignments).values({
    collectionId,
    tagId,
  });

  // Increment usage count
  await db
    .update(collectionTags)
    .set({ usageCount: sql`${collectionTags.usageCount} + 1` })
    .where(eq(collectionTags.id, tagId));

  // Return the newly created assignment
  const newAssignment = await db
    .select()
    .from(collectionTagAssignments)
    .where(
      and(
        eq(collectionTagAssignments.collectionId, collectionId),
        eq(collectionTagAssignments.tagId, tagId)
      )
    )
    .limit(1);

  return newAssignment[0] || null;
}

export async function getCollectionTags(collectionId: number) {
  const db = await getDb();
  if (!db) return [];

  const { collectionTagAssignments, collectionTags } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  return db
    .select({
      id: collectionTags.id,
      name: collectionTags.name,
      slug: collectionTags.slug,
    })
    .from(collectionTagAssignments)
    .innerJoin(
      collectionTags,
      eq(collectionTagAssignments.tagId, collectionTags.id)
    )
    .where(eq(collectionTagAssignments.collectionId, collectionId));
}

export async function removeCollectionTag(collectionId: number, tagId: number) {
  const db = await getDb();
  if (!db) return;

  const { collectionTagAssignments, collectionTags } = await import("../drizzle/schema");
  const { eq, and } = await import("drizzle-orm");

  await db
    .delete(collectionTagAssignments)
    .where(
      and(
        eq(collectionTagAssignments.collectionId, collectionId),
        eq(collectionTagAssignments.tagId, tagId)
      )
    );

  // Decrement usage count
  await db
    .update(collectionTags)
    .set({ usageCount: sql`${collectionTags.usageCount} - 1` })
    .where(eq(collectionTags.id, tagId));
}

export async function getPopularTags(limit: number = 20) {
  const db = await getDb();
  if (!db) return [];

  const { collectionTags } = await import("../drizzle/schema");
  const { desc, gt } = await import("drizzle-orm");

  return db
    .select()
    .from(collectionTags)
    .where(gt(collectionTags.usageCount, 0))
    .orderBy(desc(collectionTags.usageCount))
    .limit(limit);
}

// ========================================
// Email Digest Preferences
// ========================================

export async function getOrCreateDigestPreference(userId: number) {
  const db = await getDb();
  if (!db) return null;

  const { emailDigestPreferences } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  const existing = await db
    .select()
    .from(emailDigestPreferences)
    .where(eq(emailDigestPreferences.userId, userId))
    .limit(1);

  if (existing.length > 0) {
    return existing[0];
  }

  await db.insert(emailDigestPreferences).values({
    userId,
    isEnabled: true,
    frequency: "weekly",
  });

  // Return the newly created preference
  const newPref = await db
    .select()
    .from(emailDigestPreferences)
    .where(eq(emailDigestPreferences.userId, userId))
    .limit(1);

  return newPref[0] || null;
}

export async function updateDigestPreference(
  userId: number,
  updates: { isEnabled?: boolean; frequency?: "weekly" | "biweekly" | "monthly" }
) {
  const db = await getDb();
  if (!db) return null;

  const { emailDigestPreferences } = await import("../drizzle/schema");
  const { eq } = await import("drizzle-orm");

  await db
    .update(emailDigestPreferences)
    .set(updates)
    .where(eq(emailDigestPreferences.userId, userId));

  return getOrCreateDigestPreference(userId);
}

/**
 * Affiliate Analytics Helpers
 */

/**
 * Track an affiliate link click
 */
export async function trackAffiliateClick(click: InsertAffiliateClick): Promise<AffiliateClick | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(affiliateClicks).values(click);
  const insertId = Number(result[0].insertId);
  
  const [newClick] = await db.select().from(affiliateClicks).where(eq(affiliateClicks.id, insertId));
  return newClick || null;
}

/**
 * Get affiliate analytics for a specific user
 */
export async function getAffiliateAnalytics(userId: number) {
  const db = await getDb();
  if (!db) return null;

  // Get all referral codes for this user
  const codes = await db.select().from(referralCodes).where(eq(referralCodes.userId, userId));
  
  if (codes.length === 0) {
    return {
      totalClicks: 0,
      totalConversions: 0,
      conversionRate: 0,
      totalEarnings: "0.00",
      pendingEarnings: "0.00",
      paidEarnings: "0.00",
      clicksByCode: [],
      earningsByMonth: [],
    };
  }

  const codeIds = codes.map(c => c.id);

  // Get total clicks
  const [clicksResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(affiliateClicks)
    .where(sql`${affiliateClicks.referralCodeId} IN (${sql.join(codeIds, sql`, `)})`);

  const totalClicks = Number(clicksResult?.count || 0);

  // Get converted clicks
  const [conversionsResult] = await db
    .select({ count: sql<number>`count(*)` })
    .from(affiliateClicks)
    .where(
      sql`${affiliateClicks.referralCodeId} IN (${sql.join(codeIds, sql`, `)}) AND ${affiliateClicks.converted} = true`
    );

  const totalConversions = Number(conversionsResult?.count || 0);

  // Get earnings summary
  const [earningsResult] = await db
    .select({
      total: sql<string>`COALESCE(SUM(${affiliateEarnings.commissionAmount}), 0)`,
      pending: sql<string>`COALESCE(SUM(CASE WHEN ${affiliateEarnings.payoutStatus} = 'pending' THEN ${affiliateEarnings.commissionAmount} ELSE 0 END), 0)`,
      paid: sql<string>`COALESCE(SUM(CASE WHEN ${affiliateEarnings.payoutStatus} = 'paid' THEN ${affiliateEarnings.commissionAmount} ELSE 0 END), 0)`,
    })
    .from(affiliateEarnings)
    .where(eq(affiliateEarnings.affiliateUserId, userId));

  // Get clicks by code
  const clicksByCode = await db
    .select({
      codeId: affiliateClicks.referralCodeId,
      code: referralCodes.code,
      clicks: sql<number>`count(*)`,
      conversions: sql<number>`SUM(CASE WHEN ${affiliateClicks.converted} = true THEN 1 ELSE 0 END)`,
    })
    .from(affiliateClicks)
    .leftJoin(referralCodes, eq(affiliateClicks.referralCodeId, referralCodes.id))
    .where(sql`${affiliateClicks.referralCodeId} IN (${sql.join(codeIds, sql`, `)})`)
    .groupBy(affiliateClicks.referralCodeId, referralCodes.code);

  // Get earnings by month (last 12 months)
  const earningsByMonth = await db
    .select({
      month: sql<string>`DATE_FORMAT(${affiliateEarnings.createdAt}, '%Y-%m')`,
      earnings: sql<string>`SUM(${affiliateEarnings.commissionAmount})`,
      conversions: sql<number>`count(*)`,
    })
    .from(affiliateEarnings)
    .where(
      sql`${affiliateEarnings.affiliateUserId} = ${userId} AND ${affiliateEarnings.createdAt} >= DATE_SUB(NOW(), INTERVAL 12 MONTH)`
    )
    .groupBy(sql`DATE_FORMAT(${affiliateEarnings.createdAt}, '%Y-%m')`)
    .orderBy(sql`DATE_FORMAT(${affiliateEarnings.createdAt}, '%Y-%m') DESC`);

  return {
    totalClicks,
    totalConversions,
    conversionRate: totalClicks > 0 ? ((totalConversions / totalClicks) * 100).toFixed(2) : "0.00",
    totalEarnings: earningsResult?.total || "0.00",
    pendingEarnings: earningsResult?.pending || "0.00",
    paidEarnings: earningsResult?.paid || "0.00",
    clicksByCode: clicksByCode.map(c => ({
      codeId: c.codeId,
      code: c.code || "",
      clicks: Number(c.clicks),
      conversions: Number(c.conversions),
      conversionRate: Number(c.clicks) > 0 ? ((Number(c.conversions) / Number(c.clicks)) * 100).toFixed(2) : "0.00",
    })),
    earningsByMonth: earningsByMonth.map(e => ({
      month: e.month,
      earnings: e.earnings,
      conversions: Number(e.conversions),
    })),
  };
}

/**
 * Create an affiliate earning record and send email notification
 */
export async function createAffiliateEarning(earning: InsertAffiliateEarning): Promise<AffiliateEarning | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(affiliateEarnings).values(earning);
  const insertId = Number(result[0].insertId);
  
  const [newEarning] = await db.select().from(affiliateEarnings).where(eq(affiliateEarnings.id, insertId));
  
  // Send email notification to affiliate about commission earned
  if (newEarning) {
    try {
      const [affiliate] = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, earning.affiliateUserId))
        .limit(1);
      
      const [referred] = await db
        .select({ email: users.email })
        .from(users)
        .where(eq(users.id, earning.referredUserId))
        .limit(1);
      
      if (affiliate && referred) {
        // Import dynamically to avoid circular dependencies
        const { notifyCommissionEarned } = await import("./affiliateEmailNotifications");
        await notifyCommissionEarned({
          affiliate: {
            name: affiliate.name || "Affiliate",
            email: affiliate.email || "",
          },
          commissionAmount: Number(earning.commissionAmount),
          referredUserEmail: referred.email || "Unknown",
          conversionType: earning.conversionType,
        });
        
        // Check if affiliate reached payout threshold ($50)
        const [earningsSum] = await db
          .select({
            total: sql<string>`COALESCE(SUM(${affiliateEarnings.commissionAmount}), 0)`,
          })
          .from(affiliateEarnings)
          .where(
            and(
              eq(affiliateEarnings.affiliateUserId, earning.affiliateUserId),
              eq(affiliateEarnings.payoutStatus, "pending")
            )
          );
        
        const totalPending = Number(earningsSum?.total || 0);
        if (totalPending >= 50 && totalPending - Number(earning.commissionAmount) < 50) {
          // Just crossed the threshold with this commission
          const { notifyPayoutThresholdReached } = await import("./affiliateEmailNotifications");
          await notifyPayoutThresholdReached({
            affiliate: {
              name: affiliate.name || "Affiliate",
              email: affiliate.email || "",
            },
            totalPending,
            threshold: 50,
          });
        }
      }
    } catch (error) {
      console.error("Failed to send affiliate commission email:", error);
      // Don't fail the earning creation if email fails
    }
  }
  
  return newEarning || null;
}

/**
 * Get all earnings for an affiliate user
 */
export async function getAffiliateEarnings(userId: number): Promise<AffiliateEarning[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(affiliateEarnings)
    .where(eq(affiliateEarnings.affiliateUserId, userId))
    .orderBy(desc(affiliateEarnings.createdAt));
}

/**
 * Request an affiliate payout
 */
export async function createAffiliatePayout(payout: InsertAffiliatePayout): Promise<AffiliatePayout | null> {
  const db = await getDb();
  if (!db) return null;

  const result = await db.insert(affiliatePayouts).values(payout);
  const insertId = Number(result[0].insertId);
  
  const [newPayout] = await db.select().from(affiliatePayouts).where(eq(affiliatePayouts.id, insertId));
  return newPayout || null;
}

/**
 * Get payout history for an affiliate user
 */
export async function getAffiliatePayouts(userId: number): Promise<AffiliatePayout[]> {
  const db = await getDb();
  if (!db) return [];

  return db
    .select()
    .from(affiliatePayouts)
    .where(eq(affiliatePayouts.affiliateUserId, userId))
    .orderBy(desc(affiliatePayouts.createdAt));
}

/**
 * Update affiliate click to mark as converted
 */
export async function markAffiliateClickConverted(clickId: number, convertedUserId: number): Promise<void> {
  const db = await getDb();
  if (!db) return;

  await db
    .update(affiliateClicks)
    .set({ converted: true, convertedUserId })
    .where(eq(affiliateClicks.id, clickId));
}
