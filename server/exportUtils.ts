import { getDb } from "./db";
import { wordbank, wordMastery, userStats, storyProgress, generatedContent, watchHistory, vocabularyLists } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

/**
 * Generate CSV content from wordbank data
 */
export async function generateWordbankCSV(userId: number, targetLanguage?: string): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database connection not available");
  
  const whereConditions = targetLanguage
    ? and(eq(wordbank.userId, userId), eq(wordbank.targetLanguage, targetLanguage))
    : eq(wordbank.userId, userId);

  const words = await db
    .select({
      word: wordbank.word,
      translation: wordbank.translation,
      targetLanguage: wordbank.targetLanguage,
      pinyin: wordbank.pinyin,
      exampleSentences: wordbank.exampleSentences,
      createdAt: wordbank.createdAt,
    })
    .from(wordbank)
    .where(whereConditions)
    .orderBy(desc(wordbank.createdAt));

  // CSV header
  const headers = ["Word", "Translation", "Language", "Pinyin", "Example Sentences", "Date Added"];
  const rows = [headers.join(",")];

  // CSV rows
  for (const word of words) {
    const exampleSentences = word.exampleSentences 
      ? (typeof word.exampleSentences === 'string' ? word.exampleSentences : JSON.stringify(word.exampleSentences))
      : "";
    
    const row = [
      escapeCSV(word.word),
      escapeCSV(word.translation || ""),
      escapeCSV(word.targetLanguage),
      escapeCSV(word.pinyin || ""),
      escapeCSV(exampleSentences),
      escapeCSV(word.createdAt?.toISOString().split('T')[0] || ""),
    ];
    rows.push(row.join(","));
  }

  return rows.join("\n");
}

/**
 * Generate CSV content from watch history data
 */
export async function generateWatchHistoryCSV(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database connection not available");
  const history = await db
    .select({
      contentId: watchHistory.contentId,
      title: generatedContent.title,
      targetLanguage: vocabularyLists.targetLanguage,
      mode: generatedContent.mode,
      watchedAt: watchHistory.watchedAt,
      duration: watchHistory.duration,
      completed: watchHistory.completed,
    })
    .from(watchHistory)
    .leftJoin(generatedContent, eq(watchHistory.contentId, generatedContent.id))
    .leftJoin(vocabularyLists, eq(generatedContent.vocabularyListId, vocabularyLists.id))
    .where(eq(watchHistory.userId, userId))
    .orderBy(desc(watchHistory.watchedAt));

  // CSV header
  const headers = ["Story Title", "Language", "Mode", "Date Watched", "Duration (seconds)", "Completed"];
  const rows = [headers.join(",")];

  // CSV rows
  for (const entry of history) {
    const row = [
      escapeCSV(entry.title || "Unknown"),
      escapeCSV(entry.targetLanguage || ""),
      escapeCSV(entry.mode || ""),
      escapeCSV(entry.watchedAt?.toISOString() || ""),
      escapeCSV(entry.duration?.toString() || "0"),
      escapeCSV(entry.completed ? "Yes" : "No"),
    ];
    rows.push(row.join(","));
  }

  return rows.join("\n");
}

/**
 * Generate JSON content from watch history data
 */
export async function generateWatchHistoryJSON(userId: number): Promise<string> {
  const db = await getDb();
  if (!db) throw new Error("Database connection not available");
  const history = await db
    .select({
      contentId: watchHistory.contentId,
      title: generatedContent.title,
      targetLanguage: vocabularyLists.targetLanguage,
      mode: generatedContent.mode,
      watchedAt: watchHistory.watchedAt,
      duration: watchHistory.duration,
      completed: watchHistory.completed,
    })
    .from(watchHistory)
    .leftJoin(generatedContent, eq(watchHistory.contentId, generatedContent.id))
    .leftJoin(vocabularyLists, eq(generatedContent.vocabularyListId, vocabularyLists.id))
    .where(eq(watchHistory.userId, userId))
    .orderBy(desc(watchHistory.watchedAt));

  return JSON.stringify(history, null, 2);
}

/**
 * Generate progress report data for PDF generation
 */
export async function generateProgressReportData(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database connection not available");
  // Get user stats
  const statsData = await db
    .select()
    .from(userStats)
    .where(eq(userStats.userId, userId))
    .limit(1);

  const userStatsData = statsData[0] || {
    currentStreak: 0,
    longestStreak: 0,
    totalXp: 0,
    level: 1,
    quizzesCompleted: 0,
    storiesCompleted: 0,
    wordsLearned: 0,
  };

  // Get wordbank stats
  const wordbankData = await db
    .select()
    .from(wordbank)
    .where(eq(wordbank.userId, userId));

  // Get mastery stats
  const masteryStats = await db
    .select()
    .from(wordMastery)
    .where(eq(wordMastery.userId, userId));

  // Calculate mastery levels
  const masteryLevels = {
    mastered: masteryStats.filter((w: typeof masteryStats[0]) => w.easinessFactor >= 2500 && w.interval >= 30).length,
    learning: masteryStats.filter((w: typeof masteryStats[0]) => w.easinessFactor < 2500 || w.interval < 30).length,
  };

  // Get content stats with language info
  const contentData = await db
    .select({
      id: generatedContent.id,
      mode: generatedContent.mode,
      targetLanguage: vocabularyLists.targetLanguage,
    })
    .from(generatedContent)
    .leftJoin(vocabularyLists, eq(generatedContent.vocabularyListId, vocabularyLists.id))
    .where(eq(generatedContent.userId, userId));

  const contentByLanguage = contentData.reduce((acc: Record<string, number>, content: typeof contentData[0]) => {
    const lang = content.targetLanguage || "Unknown";
    acc[lang] = (acc[lang] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get progress stats
  const progressStats = await db
    .select()
    .from(storyProgress)
    .where(eq(storyProgress.userId, userId));

  const completedStories = progressStats.filter((p: typeof progressStats[0]) => p.completed).length;
  const inProgressStories = progressStats.filter((p: typeof progressStats[0]) => !p.completed && p.currentTime > 0).length;

  return {
    userStats: userStatsData,
    wordbankStats: {
      total: wordbankData.length,
      byLanguage: wordbankData.reduce((acc: Record<string, number>, word: typeof wordbankData[0]) => {
        const lang = word.targetLanguage;
        acc[lang] = (acc[lang] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
    },
    masteryLevels,
    contentStats: {
      total: contentData.length,
      byLanguage: contentByLanguage,
      podcasts: contentData.filter((c: typeof contentData[0]) => c.mode === "podcast").length,
      films: contentData.filter((c: typeof contentData[0]) => c.mode === "film").length,
    },
    progressStats: {
      completed: completedStories,
      inProgress: inProgressStories,
      notStarted: contentData.length - completedStories - inProgressStories,
    },
    generatedAt: new Date().toISOString(),
  };
}

/**
 * Escape CSV field value
 */
function escapeCSV(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}
