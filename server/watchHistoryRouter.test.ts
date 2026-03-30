import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { watchHistory, generatedContent, vocabularyLists, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("watchHistoryRouter", () => {
  let testUserId: number;
  let testContentId: number;
  let testVocabListId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Create test user
    const userResult = await db.insert(users).values({
      openId: `test-watch-history-${Date.now()}`,
      name: "Test Watch History User",
      email: "test-watch-history@example.com",
    });
    testUserId = userResult[0].insertId;

    // Create test vocabulary list
    const vocabResult = await db.insert(vocabularyLists).values({
      userId: testUserId,
      targetLanguage: "Spanish",
      proficiencyLevel: "B1",
      words: "hola,adiós,gracias",
    });
    testVocabListId = vocabResult[0].insertId;

    // Create test content
    const contentResult = await db.insert(generatedContent).values({
      userId: testUserId,
      vocabularyListId: testVocabListId,
      mode: "podcast",
      theme: "Adventure",
      title: "Test Story",
      titleTranslation: "Historia de Prueba",
      storyText: "Test story content",
      status: "completed",
      thumbnailUrl: "https://example.com/thumb.jpg",
    });
    testContentId = contentResult[0].insertId;
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    await db.delete(watchHistory).where(eq(watchHistory.userId, testUserId));
    await db.delete(generatedContent).where(eq(generatedContent.id, testContentId));
    await db.delete(vocabularyLists).where(eq(vocabularyLists.id, testVocabListId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it("should record watch history", async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, openId: `test-${testUserId}`, name: "Test User", role: "user" },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.watchHistory.recordWatch({
      contentId: testContentId,
      duration: 120.5,
      completed: false,
      progressPercentage: 45.5,
    });

    expect(result.success).toBe(true);
  });

  it("should get watch history for user", async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, openId: `test-${testUserId}`, name: "Test User", role: "user" },
      req: {} as any,
      res: {} as any,
    });

    const history = await caller.watchHistory.getHistory({ limit: 10 });

    expect(Array.isArray(history)).toBe(true);
    expect(history.length).toBeGreaterThan(0);
    expect(history[0]).toHaveProperty("contentId");
    expect(history[0]).toHaveProperty("duration");
    expect(history[0]).toHaveProperty("contentTitle");
    expect(history[0]).toHaveProperty("contentTargetLanguage");
  });

  it("should get watch history grouped by date", async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, openId: `test-${testUserId}`, name: "Test User", role: "user" },
      req: {} as any,
      res: {} as any,
    });

    const grouped = await caller.watchHistory.getHistoryGroupedByDate();

    expect(typeof grouped).toBe("object");
    // Should have at least one date key
    const dates = Object.keys(grouped);
    if (dates.length > 0) {
      expect(Array.isArray(grouped[dates[0]])).toBe(true);
      expect(grouped[dates[0]][0]).toHaveProperty("contentTitle");
      expect(grouped[dates[0]][0]).toHaveProperty("contentTargetLanguage");
    }
  });

  it("should record completed watch", async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, openId: `test-${testUserId}`, name: "Test User", role: "user" },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.watchHistory.recordWatch({
      contentId: testContentId,
      duration: 300,
      completed: true,
      progressPercentage: 100,
    });

    expect(result.success).toBe(true);

    // Verify it was recorded
    const history = await caller.watchHistory.getHistory({ limit: 10 });
    const completedEntry = history.find(h => h.completed === true);
    expect(completedEntry).toBeDefined();
    expect(completedEntry?.progressPercentage).toBe(100);
  });
});
