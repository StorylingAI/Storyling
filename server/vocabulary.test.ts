import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users, vocabularyLists, generatedContent } from "../drizzle/schema";

describe("Vocabulary Display", () => {
  let testUserId: number;
  let testVocabListId: number;
  let testContentId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a test user
    const [insertedUser] = await db.insert(users).values({
      openId: `test-vocab-${Date.now()}`,
      name: "Test User",
      email: "test@example.com",
      role: "user",
    });
    testUserId = Number(insertedUser.insertId);

    // Create a test vocabulary list
    const [insertedVocabList] = await db.insert(vocabularyLists).values({
      userId: testUserId,
      targetLanguage: "Spanish",
      proficiencyLevel: "A1",
      words: "hola, amigo, casa, comida, feliz",
      topicPrompt: "Basic greetings",
    });
    testVocabListId = Number(insertedVocabList.insertId);

    // Create test content
    const [insertedContent] = await db.insert(generatedContent).values({
      userId: testUserId,
      vocabularyListId: testVocabListId,
      mode: "podcast",
      theme: "Comedy",
      storyText: "Test story text",
      status: "completed",
    });
    testContentId = Number(insertedContent.insertId);
  });

  it("should return vocabulary words when fetching content by ID", async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, openId: "test-vocab", name: "Test User", role: "user" },
      req: {} as any,
      res: {} as any,
    });

    const content = await caller.content.getById({ id: testContentId });

    expect(content).toBeDefined();
    expect(content.vocabularyWords).toBeDefined();
    expect(Array.isArray(content.vocabularyWords)).toBe(true);
    expect(content.vocabularyWords.length).toBe(5);
    expect(content.vocabularyWords).toContain("hola");
    expect(content.vocabularyWords).toContain("amigo");
    expect(content.vocabularyWords).toContain("casa");
  });

  it("should parse comma-separated vocabulary correctly", async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, openId: "test-vocab", name: "Test User", role: "user" },
      req: {} as any,
      res: {} as any,
    });

    const content = await caller.content.getById({ id: testContentId });

    // Check that words are trimmed and filtered
    content.vocabularyWords.forEach((word) => {
      expect(word).toBe(word.trim());
      expect(word.length).toBeGreaterThan(0);
    });
  });

  it("should return empty array when vocabulary list has no words", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create vocabulary list with empty words
    const [emptyVocabList] = await db.insert(vocabularyLists).values({
      userId: testUserId,
      targetLanguage: "French",
      proficiencyLevel: "A1",
      words: "",
    });
    const emptyVocabListId = Number(emptyVocabList.insertId);

    const [emptyContent] = await db.insert(generatedContent).values({
      userId: testUserId,
      vocabularyListId: emptyVocabListId,
      mode: "podcast",
      theme: "Comedy",
      storyText: "Test story",
      status: "completed",
    });
    const emptyContentId = Number(emptyContent.insertId);

    const caller = appRouter.createCaller({
      user: { id: testUserId, openId: "test-vocab", name: "Test User", role: "user" },
      req: {} as any,
      res: {} as any,
    });

    const content = await caller.content.getById({ id: emptyContentId });

    expect(content.vocabularyWords).toBeDefined();
    expect(content.vocabularyWords.length).toBe(0);
  });

  it("should include target language with vocabulary data", async () => {
    const caller = appRouter.createCaller({
      user: { id: testUserId, openId: "test-vocab", name: "Test User", role: "user" },
      req: {} as any,
      res: {} as any,
    });

    const content = await caller.content.getById({ id: testContentId });

    expect(content.targetLanguage).toBe("Spanish");
  });

  it("should not allow access to other users' content vocabulary", async () => {
    const caller = appRouter.createCaller({
      user: { id: 99999, openId: "other-user", name: "Other User", role: "user" },
      req: {} as any,
      res: {} as any,
    });

    await expect(caller.content.getById({ id: testContentId })).rejects.toThrow("Content not found");
  });
});
