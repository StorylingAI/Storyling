import { getDb } from "./db";
import { wordbank, wordMastery, type Wordbank, type InsertWordbank } from "../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

export async function saveWordToWordbank(data: InsertWordbank): Promise<Wordbank> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  
  // Insert word into wordbank
  const [result] = await db.insert(wordbank).values(data);
  const savedWord = await getWordbankById(result.insertId);
  
  // Automatically create word_mastery record for SRS
  const now = new Date();
  const nextReview = new Date(now); // Review immediately (due now)
  
  await db.insert(wordMastery).values({
    userId: data.userId,
    word: data.word,
    targetLanguage: data.targetLanguage,
    easinessFactor: 2500, // Default 2.5 * 1000
    interval: 1, // 1 day
    repetitions: 0,
    nextReviewDate: nextReview,
    lastReviewedAt: now,
    correctCount: 0,
    incorrectCount: 0,
  });
  
  return savedWord;
}

export async function getWordbankById(id: number): Promise<Wordbank> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const [result] = await db.select().from(wordbank).where(eq(wordbank.id, id));
  return result;
}

export async function getWordbankByUserId(userId: number): Promise<Wordbank[]> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  return await db
    .select()
    .from(wordbank)
    .where(eq(wordbank.userId, userId))
    .orderBy(desc(wordbank.createdAt));
}

export async function getWordbankByUserIdAndLanguage(
  userId: number,
  targetLanguage: string
): Promise<Wordbank[]> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  return await db
    .select()
    .from(wordbank)
    .where(
      and(
        eq(wordbank.userId, userId),
        eq(wordbank.targetLanguage, targetLanguage)
      )
    )
    .orderBy(desc(wordbank.createdAt));
}

export async function checkWordInWordbank(
  userId: number,
  word: string,
  targetLanguage: string
): Promise<boolean> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  const [result] = await db
    .select()
    .from(wordbank)
    .where(
      and(
        eq(wordbank.userId, userId),
        eq(wordbank.word, word),
        eq(wordbank.targetLanguage, targetLanguage)
      )
    )
    .limit(1);
  return !!result;
}

export async function removeWordFromWordbank(
  userId: number,
  wordId: number
): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database connection failed");
  await db
    .delete(wordbank)
    .where(
      and(
        eq(wordbank.id, wordId),
        eq(wordbank.userId, userId)
      )
    );
}
