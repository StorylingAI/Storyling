import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { tutorialChallenges, users } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";

describe("Tutorial Challenges", () => {
  let testUserId: number;
  let caller: any;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a test user
    const testUsers = await db
      .select()
      .from(users)
      .where(eq(users.openId, "test-tutorial-user"))
      .limit(1);

    if (testUsers.length === 0) {
      const [newUser] = await db.insert(users).values({
        openId: "test-tutorial-user",
        name: "Test Tutorial User",
        email: "test-tutorial@example.com",
        role: "user",
      });
      testUserId = newUser.insertId;
    } else {
      testUserId = testUsers[0].id;
    }

    // Create caller with test user context
    caller = appRouter.createCaller({
      user: {
        id: testUserId,
        openId: "test-tutorial-user",
        name: "Test Tutorial User",
        email: "test-tutorial@example.com",
        role: "user",
        preferredLanguage: "en",
        preferredTranslationLanguage: "en",
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        loginMethod: "oauth",
      },
    });

    // Clean up any existing challenges for this test user
    await db
      .delete(tutorialChallenges)
      .where(eq(tutorialChallenges.userId, testUserId));
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    await db
      .delete(tutorialChallenges)
      .where(eq(tutorialChallenges.userId, testUserId));
  });

  it("should return all challenges with initial uncompleted status", async () => {
    const challenges = await caller.tutorial.getChallenges();

    expect(challenges).toBeDefined();
    expect(challenges.length).toBe(5);
    expect(challenges.every((c: any) => c.completed === false)).toBe(true);
    expect(challenges.every((c: any) => c.challengeId)).toBeDefined();
    expect(challenges.every((c: any) => c.title)).toBeDefined();
    expect(challenges.every((c: any) => c.description)).toBeDefined();
  });

  it("should return initial stats with 0 completed", async () => {
    const stats = await caller.tutorial.getStats();

    expect(stats).toBeDefined();
    expect(stats.completedCount).toBe(0);
    expect(stats.totalCount).toBe(5);
    expect(stats.percentage).toBe(0);
    expect(stats.allCompleted).toBe(false);
  });

  it("should mark a challenge as completed", async () => {
    await caller.tutorial.completeChallenge({
      challengeId: "create_story",
    });

    const challenges = await caller.tutorial.getChallenges();
    const createStoryChallenge = challenges.find(
      (c: any) => c.challengeId === "create_story"
    );

    expect(createStoryChallenge).toBeDefined();
    expect(createStoryChallenge.completed).toBe(true);
    expect(createStoryChallenge.completedAt).toBeDefined();
  });

  it("should update stats after completing a challenge", async () => {
    const stats = await caller.tutorial.getStats();

    expect(stats.completedCount).toBe(1);
    expect(stats.totalCount).toBe(5);
    expect(stats.percentage).toBe(20);
    expect(stats.allCompleted).toBe(false);
  });

  it("should mark multiple challenges as completed", async () => {
    await caller.tutorial.completeChallenge({
      challengeId: "add_vocabulary",
    });
    await caller.tutorial.completeChallenge({
      challengeId: "explore_progress",
    });

    const stats = await caller.tutorial.getStats();

    expect(stats.completedCount).toBe(3);
    expect(stats.percentage).toBe(60);
  });

  it("should handle completing the same challenge twice", async () => {
    await caller.tutorial.completeChallenge({
      challengeId: "create_story",
    });

    const challenges = await caller.tutorial.getChallenges();
    const createStoryChallenge = challenges.find(
      (c: any) => c.challengeId === "create_story"
    );

    expect(createStoryChallenge.completed).toBe(true);

    const stats = await caller.tutorial.getStats();
    expect(stats.completedCount).toBe(3); // Should still be 3, not 4
  });

  it("should detect all challenges completed", async () => {
    await caller.tutorial.completeChallenge({
      challengeId: "play_content",
    });
    await caller.tutorial.completeChallenge({
      challengeId: "take_quiz",
    });

    const stats = await caller.tutorial.getStats();

    expect(stats.completedCount).toBe(5);
    expect(stats.totalCount).toBe(5);
    expect(stats.percentage).toBe(100);
    expect(stats.allCompleted).toBe(true);
  });

  it("should reset all challenges", async () => {
    await caller.tutorial.resetChallenges();

    const challenges = await caller.tutorial.getChallenges();
    expect(challenges.every((c: any) => c.completed === false)).toBe(true);

    const stats = await caller.tutorial.getStats();
    expect(stats.completedCount).toBe(0);
    expect(stats.percentage).toBe(0);
  });
});
