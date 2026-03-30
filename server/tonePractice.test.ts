import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";
import { getDb } from "./db";
import { users, tonePracticeHistory, toneMasteryStats } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createTestContext(user: AuthenticatedUser): TrpcContext {
  return {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };
}

describe("Tone Practice Router", () => {
  let testUserId: number;
  let testOpenId: string;
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Create a test user
    testOpenId = `test-tone-practice-${Date.now()}`;
    const [insertedUser] = await db
      .insert(users)
      .values({
        openId: testOpenId,
        name: "Tone Practice Test User",
        email: "tone-test@example.com",
        role: "user",
      })
      .$returningId();

    testUserId = insertedUser.id;

    // Create caller with test user context
    const testUser: AuthenticatedUser = {
      id: testUserId,
      openId: testOpenId,
      name: "Tone Practice Test User",
      email: "tone-test@example.com",
      loginMethod: "manus",
      role: "user",
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    };
    const ctx = createTestContext(testUser);
    caller = appRouter.createCaller(ctx);
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    await db.delete(tonePracticeHistory).where(eq(tonePracticeHistory.userId, testUserId));
    await db.delete(toneMasteryStats).where(eq(toneMasteryStats.userId, testUserId));
    await db.delete(users).where(eq(users.openId, testOpenId));
  });

  describe("recordAttempt", () => {
    it("should record a correct tone practice attempt", async () => {
      const result = await caller.tonePractice.recordAttempt({
        character: "妈",
        pinyin: "mā",
        correctTone: 1,
        selectedTone: 1,
        responseTimeMs: 1500,
      });

      expect(result.success).toBe(true);
      expect(result.isCorrect).toBe(true);
    });

    it("should record an incorrect tone practice attempt", async () => {
      const result = await caller.tonePractice.recordAttempt({
        character: "妈",
        pinyin: "mā",
        correctTone: 1,
        selectedTone: 2,
        responseTimeMs: 2000,
      });

      expect(result.success).toBe(true);
      expect(result.isCorrect).toBe(false);
    });

    it("should update tone mastery stats after attempt", async () => {
      // Record a few attempts
      await caller.tonePractice.recordAttempt({
        character: "马",
        pinyin: "mǎ",
        correctTone: 3,
        selectedTone: 3,
      });

      await caller.tonePractice.recordAttempt({
        character: "马",
        pinyin: "mǎ",
        correctTone: 3,
        selectedTone: 3,
      });

      await caller.tonePractice.recordAttempt({
        character: "马",
        pinyin: "mǎ",
        correctTone: 3,
        selectedTone: 4,
      });

      // Check mastery stats
      const stats = await caller.tonePractice.getMasteryStats();
      const tone3Stats = stats.find((s) => s.tone === 3);

      expect(tone3Stats).toBeDefined();
      expect(tone3Stats!.totalAttempts).toBeGreaterThanOrEqual(3);
      expect(tone3Stats!.correctAttempts).toBeGreaterThanOrEqual(2);
      expect(tone3Stats!.accuracyPercentage).toBeGreaterThan(0);
    });
  });

  describe("getMasteryStats", () => {
    it("should return stats for all 4 tones", async () => {
      const stats = await caller.tonePractice.getMasteryStats();

      expect(stats).toHaveLength(4);
      expect(stats.map((s) => s.tone).sort()).toEqual([1, 2, 3, 4]);
    });

    it("should return default stats for unpracticed tones", async () => {
      const stats = await caller.tonePractice.getMasteryStats();
      const unpracticedTones = stats.filter((s) => s.totalAttempts === 0);

      unpracticedTones.forEach((stat) => {
        expect(stat.totalAttempts).toBe(0);
        expect(stat.correctAttempts).toBe(0);
        expect(stat.accuracyPercentage).toBe(0);
      });
    });
  });

  describe("getPracticeHistory", () => {
    it("should return practice history with default limit", async () => {
      // Record some attempts
      await caller.tonePractice.recordAttempt({
        character: "大",
        pinyin: "dà",
        correctTone: 4,
        selectedTone: 4,
      });

      const history = await caller.tonePractice.getPracticeHistory({ limit: 10 });

      expect(Array.isArray(history)).toBe(true);
      expect(history.length).toBeGreaterThan(0);
      expect(history[0]).toHaveProperty("character");
      expect(history[0]).toHaveProperty("pinyin");
      expect(history[0]).toHaveProperty("correctTone");
      expect(history[0]).toHaveProperty("selectedTone");
      expect(history[0]).toHaveProperty("isCorrect");
    });

    it("should filter history by specific tone", async () => {
      // Record attempts for tone 2
      await caller.tonePractice.recordAttempt({
        character: "人",
        pinyin: "rén",
        correctTone: 2,
        selectedTone: 2,
      });

      await caller.tonePractice.recordAttempt({
        character: "来",
        pinyin: "lái",
        correctTone: 2,
        selectedTone: 3,
      });

      const history = await caller.tonePractice.getPracticeHistory({
        limit: 10,
        tone: 2,
      });

      expect(history.every((h) => h.correctTone === 2)).toBe(true);
    });
  });

  describe("getWeakTones", () => {
    it("should identify tones with low accuracy", async () => {
      // Create a tone with low accuracy
      for (let i = 0; i < 10; i++) {
        await caller.tonePractice.recordAttempt({
          character: "是",
          pinyin: "shì",
          correctTone: 4,
          selectedTone: i < 3 ? 4 : 3, // 30% accuracy
        });
      }

      const weakTones = await caller.tonePractice.getWeakTones();
      const tone4 = weakTones.find((t) => t.tone === 4);

      expect(tone4).toBeDefined();
      expect(tone4!.accuracyPercentage).toBeLessThan(70);
    });

    it("should identify tones with insufficient practice", async () => {
      const weakTones = await caller.tonePractice.getWeakTones();
      const unpracticedTones = weakTones.filter((t) => t.totalAttempts < 10);

      expect(unpracticedTones.length).toBeGreaterThan(0);
    });
  });

  describe("getConfusionMatrix", () => {
    it("should track commonly confused tone pairs", async () => {
      // Create confusion between tone 1 and tone 4
      for (let i = 0; i < 5; i++) {
        await caller.tonePractice.recordAttempt({
          character: "他",
          pinyin: "tā",
          correctTone: 1,
          selectedTone: 4,
        });
      }

      const confusionMatrix = await caller.tonePractice.getConfusionMatrix();
      const confusion1to4 = confusionMatrix.find(
        (c) => c.correctTone === 1 && c.selectedTone === 4
      );

      expect(confusion1to4).toBeDefined();
      expect(confusion1to4!.count).toBeGreaterThanOrEqual(5);
    });

    it("should only include incorrect attempts", async () => {
      const confusionMatrix = await caller.tonePractice.getConfusionMatrix();

      confusionMatrix.forEach((confusion) => {
        expect(confusion.correctTone).not.toBe(confusion.selectedTone);
      });
    });
  });

  describe("accuracy calculation", () => {
    it("should calculate accuracy correctly", async () => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");

      // Clear existing stats for tone 1
      await db
        .delete(toneMasteryStats)
        .where(and(eq(toneMasteryStats.userId, testUserId), eq(toneMasteryStats.tone, 1)));

      // Record 10 attempts: 7 correct, 3 incorrect
      for (let i = 0; i < 10; i++) {
        await caller.tonePractice.recordAttempt({
          character: "八",
          pinyin: "bā",
          correctTone: 1,
          selectedTone: i < 7 ? 1 : 2,
        });
      }

      const stats = await caller.tonePractice.getMasteryStats();
      const tone1Stats = stats.find((s) => s.tone === 1);

      expect(tone1Stats).toBeDefined();
      expect(tone1Stats!.accuracyPercentage).toBeCloseTo(70, 0);
    });
  });
});
