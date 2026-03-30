import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Weekly Goal Router", () => {
  let testUserId: number;
  let testOpenId: string;
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Create a test user with unique openId
    testOpenId = `test-weekly-goal-${Date.now()}`;
    await db.insert(users).values({
      openId: testOpenId,
      name: "Test User",
      email: "test@example.com",
      role: "user",
      weeklyGoal: 5,
      weeklyProgress: 0,
      weekStartDate: new Date(),
    });

    // Get the inserted user ID
    const insertedUsers = await db
      .select()
      .from(users)
      .where(eq(users.openId, testOpenId))
      .limit(1);
    
    if (!insertedUsers.length) throw new Error("Failed to create test user");
    testUserId = insertedUsers[0].id;

    // Create caller with mock context
    caller = appRouter.createCaller({
      user: {
        id: testUserId,
        openId: testOpenId,
        name: "Test User",
        email: "test@example.com",
        role: "user",
        preferredLanguage: "en",
        preferredTranslationLanguage: "en",
        subscriptionTier: "free",
        premiumOnboardingCompleted: false,
        weeklyGoal: 5,
        weeklyProgress: 0,
        weekStartDate: new Date(),
        weeklyGoalEmailSent: false,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastSignedIn: new Date(),
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        subscriptionStatus: null,
        subscriptionCurrentPeriodEnd: null,
      },
      req: {} as any,
      res: {} as any,
    });
  });

  it("should get weekly goal status", async () => {
    const status = await caller.weeklyGoal.getWeeklyGoalStatus();

    expect(status).toBeDefined();
    expect(status.weeklyGoal).toBe(5);
    expect(status.weeklyProgress).toBe(0);
    expect(status.isGoalReached).toBe(false);
    expect(status.weekStartDate).toBeInstanceOf(Date);
  });

  it("should update weekly goal", async () => {
    const result = await caller.weeklyGoal.updateWeeklyGoal({
      weeklyGoal: 10,
    });

    expect(result.success).toBe(true);

    // Verify the update
    const status = await caller.weeklyGoal.getWeeklyGoalStatus();
    expect(status.weeklyGoal).toBe(10);
  });

  it("should reject invalid weekly goal values", async () => {
    await expect(
      caller.weeklyGoal.updateWeeklyGoal({ weeklyGoal: 0 })
    ).rejects.toThrow();

    await expect(
      caller.weeklyGoal.updateWeeklyGoal({ weeklyGoal: 101 })
    ).rejects.toThrow();
  });

  it("should calculate goal reached status correctly", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Set progress to meet goal
    await db
      .update(users)
      .set({ weeklyProgress: 10, weeklyGoal: 10 })
      .where(eq(users.id, testUserId));

    const status = await caller.weeklyGoal.getWeeklyGoalStatus();
    expect(status.isGoalReached).toBe(true);
  });

  it("should reset weekly progress after a week", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");

    // Set week start date to 8 days ago
    const eightDaysAgo = new Date();
    eightDaysAgo.setDate(eightDaysAgo.getDate() - 8);

    await db
      .update(users)
      .set({
        weekStartDate: eightDaysAgo,
        weeklyProgress: 5,
        weeklyGoalEmailSent: true,
      })
      .where(eq(users.id, testUserId));

    // Getting status should trigger reset
    const status = await caller.weeklyGoal.getWeeklyGoalStatus();

    expect(status.weeklyProgress).toBe(0);
    expect(status.weekStartDate.getTime()).toBeGreaterThan(eightDaysAgo.getTime());
  });
});
