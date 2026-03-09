import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

describe("Wordbank Enhancements", () => {
  let testUserId: number;
  let testUser: AuthenticatedUser;
  let testCaller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a test user
    const { users } = await import("../drizzle/schema");
    const testOpenId = `test-wordbank-${Date.now()}`;
    const testEmail = `wordbank-test-${Date.now()}@test.com`;
    
    await db
      .insert(users)
      .values({
        openId: testOpenId,
        name: "Wordbank Test User",
        email: testEmail,
        role: "user",
      });

    // Get the inserted user
    const { eq } = await import("drizzle-orm");
    const insertedUsers = await db
      .select()
      .from(users)
      .where(eq(users.openId, testOpenId));
    
    const dbUser = insertedUsers[0];
    if (!dbUser) throw new Error("Failed to create test user");

    testUserId = dbUser.id;

    // Create authenticated user object
    const authUser: AuthenticatedUser = {
      id: testUserId,
      openId: dbUser.openId,
      name: dbUser.name,
      email: dbUser.email!,
      role: dbUser.role,
      loginMethod: "manus",
      createdAt: dbUser.createdAt,
      updatedAt: dbUser.updatedAt,
      lastSignedIn: new Date(),
    };

    // Create caller with test user context
    const ctx: TrpcContext = {
      user: authUser,
      req: {
        protocol: "https",
        headers: {},
      } as TrpcContext["req"],
      res: {} as TrpcContext["res"],
    };

    testCaller = appRouter.createCaller(ctx);
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    const { users, wordbank, wordMastery } = await import("../drizzle/schema");
    const { eq } = await import("drizzle-orm");

    await db.delete(wordMastery).where(eq(wordMastery.userId, testUserId));
    await db.delete(wordbank).where(eq(wordbank.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  describe("Bulk Import Words", () => {
    it("should import multiple words successfully", async () => {
      const result = await testCaller.wordbank.bulkImportWords({
        words: ["hello", "world", "friend"],
        targetLanguage: "Spanish",
      });

      expect(result.total).toBe(3);
      expect(result.success).toBeGreaterThan(0);
      expect(result.failed).toBe(0);
    });

    it("should skip duplicate words", async () => {
      // Import first time
      await testCaller.wordbank.bulkImportWords({
        words: ["test", "duplicate"],
        targetLanguage: "Spanish",
      });

      // Try to import again
      const result = await testCaller.wordbank.bulkImportWords({
        words: ["test", "duplicate", "new"],
        targetLanguage: "Spanish",
      });

      expect(result.skipped).toBeGreaterThan(0);
      expect(result.success).toBeGreaterThan(0);
    });

    it("should validate minimum word count", async () => {
      // API requires at least 1 word, empty arrays are rejected
      await expect(
        testCaller.wordbank.bulkImportWords({
          words: [],
          targetLanguage: "Spanish",
        })
      ).rejects.toThrow();
    });
  });

  describe("Export to CSV", () => {
    it("should export wordbank to CSV format", async () => {
      // Add some test words first
      await testCaller.wordbank.bulkImportWords({
        words: ["export", "test"],
        targetLanguage: "Spanish",
      });

      const result = await testCaller.wordbank.exportToCSV({
        targetLanguage: undefined,
        masteryLevel: undefined,
      });

      expect(result.csv).toBeDefined();
      expect(result.filename).toContain(".csv");
      expect(result.csv).toContain("Word");
      expect(result.csv).toContain("Translation");
    });

    it("should filter by language when exporting", async () => {
      await testCaller.wordbank.bulkImportWords({
        words: ["french"],
        targetLanguage: "French",
      });

      const result = await testCaller.wordbank.exportToCSV({
        targetLanguage: "French",
        masteryLevel: undefined,
      });

      expect(result.filename).toContain("French");
    });
  });

  describe("Export to PDF", () => {
    it(
      "should export wordbank to PDF format",
      async () => {
      // Add some test words first
      await testCaller.wordbank.bulkImportWords({
        words: ["pdf", "export"],
        targetLanguage: "Spanish",
      });

      const result = await testCaller.wordbank.exportToPDF({
        targetLanguage: undefined,
        masteryLevel: undefined,
      });

      expect(result.pdf).toBeDefined();
      expect(result.filename).toContain(".pdf");
      expect(result.pdf.length).toBeGreaterThan(0);
    },
      10000
    ); // 10s timeout for PDF generation
  });

  describe("Get My Words with SRS Data", () => {
    it("should return words with mastery data", async () => {
      await testCaller.wordbank.bulkImportWords({
        words: ["srs", "test"],
        targetLanguage: "Spanish",
      });

      const words = await testCaller.wordbank.getMyWords();

      expect(words.length).toBeGreaterThan(0);
      expect(words[0]).toHaveProperty("word");
      expect(words[0]).toHaveProperty("translation");
      expect(words[0]).toHaveProperty("easinessFactor");
      expect(words[0]).toHaveProperty("interval");
      expect(words[0]).toHaveProperty("nextReviewDate");
    });
  });

  describe("Update Mastery", () => {
    it("should mark word as mastered", async () => {
      await testCaller.wordbank.bulkImportWords({
        words: ["mastery"],
        targetLanguage: "Spanish",
      });

      const words = await testCaller.wordbank.getMyWords();
      const testWord = words.find((w) => w.word === "mastery");

      if (!testWord) throw new Error("Test word not found");

      const result = await testCaller.wordbank.updateMastery({
        wordbankId: testWord.id,
        action: "mastered",
      });

      expect(result.success).toBe(true);

      // Verify the word is marked as mastered
      const updatedWords = await testCaller.wordbank.getMyWords();
      const updatedWord = updatedWords.find((w) => w.id === testWord.id);

      expect(updatedWord?.easinessFactor).toBeGreaterThanOrEqual(2500);
      expect(updatedWord?.interval).toBeGreaterThanOrEqual(30);
    });

    it("should reset word to practice mode", async () => {
      await testCaller.wordbank.bulkImportWords({
        words: ["reset"],
        targetLanguage: "Spanish",
      });

      const words = await testCaller.wordbank.getMyWords();
      const testWord = words.find((w) => w.word === "reset");

      if (!testWord) throw new Error("Test word not found");

      // First mark as mastered
      await testCaller.wordbank.updateMastery({
        wordbankId: testWord.id,
        action: "mastered",
      });

      // Then reset to practice
      const result = await testCaller.wordbank.updateMastery({
        wordbankId: testWord.id,
        action: "need_practice",
      });

      expect(result.success).toBe(true);

      // Verify the word is reset
      const updatedWords = await testCaller.wordbank.getMyWords();
      const updatedWord = updatedWords.find((w) => w.id === testWord.id);

      expect(updatedWord?.easinessFactor).toBeLessThan(2500);
    });
  });
});
