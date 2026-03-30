import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users, vocabularyLists, generatedContent } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("hasChineseStories API", () => {
  let testUserId: number;
  let testVocabListId: number;
  let testContentId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a test user
    const userResult = await db
      .insert(users)
      .values({
        openId: `test-chinese-stories-${Date.now()}`,
        name: "Test User Chinese Stories",
        email: `test-chinese-${Date.now()}@example.com`,
        role: "user",
      });
    testUserId = Number(userResult[0].insertId);

    // Create a Chinese vocabulary list
    const vocabResult = await db
      .insert(vocabularyLists)
      .values({
        userId: testUserId,
        targetLanguage: "Chinese (Mandarin)",
        proficiencyLevel: "HSK 1",
        words: JSON.stringify(["你好", "谢谢"]),
      });
    testVocabListId = Number(vocabResult[0].insertId);

    // Create a completed Chinese story
    const contentResult = await db
      .insert(generatedContent)
      .values({
        userId: testUserId,
        vocabularyListId: testVocabListId,
        mode: "podcast",
        theme: "Daily Life",
        voiceType: "conversational",
        narratorGender: "female",
        duration: 300,
        status: "completed",
        title: "Test Chinese Story",
        storyText: "Test story content",
        content: JSON.stringify([]),
      });
    testContentId = Number(contentResult[0].insertId);
  });

  it("should return true when user has completed Chinese stories", async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, openId: "test", name: "Test User", email: "test@example.com", role: "user" },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.content.hasChineseStories();
    expect(result.hasChineseStories).toBe(true);
  });

  it("should return false when user has no Chinese stories", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a new user without Chinese stories
    const newUserResult = await db
      .insert(users)
      .values({
        openId: `test-no-chinese-${Date.now()}`,
        name: "Test User No Chinese",
        email: `test-no-chinese-${Date.now()}@example.com`,
        role: "user",
      });
    const newUserId = Number(newUserResult[0].insertId);

    const caller = appRouter.createCaller({
      user: { id: newUserId, openId: "test", name: "Test User", email: "test@example.com", role: "user" },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.content.hasChineseStories();
    expect(result.hasChineseStories).toBe(false);
  });

  it("should return false when Chinese stories are not completed", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a new user with pending Chinese story
    const pendingUserResult = await db
      .insert(users)
      .values({
        openId: `test-pending-chinese-${Date.now()}`,
        name: "Test User Pending Chinese",
        email: `test-pending-chinese-${Date.now()}@example.com`,
        role: "user",
      });
    const pendingUserId = Number(pendingUserResult[0].insertId);

    const pendingVocabResult = await db
      .insert(vocabularyLists)
      .values({
        userId: pendingUserId,
        targetLanguage: "Chinese (Mandarin)",
        proficiencyLevel: "HSK 1",
        words: JSON.stringify(["你好"]),
      });
    const pendingVocabId = Number(pendingVocabResult[0].insertId);

    await db
      .insert(generatedContent)
      .values({
        userId: pendingUserId,
        vocabularyListId: pendingVocabId,
        mode: "podcast",
        theme: "Daily Life",
        voiceType: "conversational",
        narratorGender: "female",
        duration: 300,
        status: "pending",
        title: "Pending Chinese Story",
        storyText: "Pending story content",
        content: JSON.stringify([]),
      });

    const caller = appRouter.createCaller({
      user: { id: pendingUserId, openId: "test", name: "Test User", email: "test@example.com", role: "user" },
      req: {} as any,
      res: {} as any,
    });

    const result = await caller.content.hasChineseStories();
    expect(result.hasChineseStories).toBe(false);
  });
});
