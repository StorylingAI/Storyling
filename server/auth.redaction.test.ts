import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): TrpcContext {
  const user: AuthenticatedUser = {
    id: 42,
    openId: "internal-open-id",
    email: "qa@example.com",
    name: "QA User",
    avatarUrl: null,
    passwordHash: "hashed-password",
    emailVerified: true,
    verificationToken: "verification-token",
    verificationTokenExpiry: new Date(),
    loginMethod: "email",
    role: "user",
    preferredLanguage: "en",
    preferredTranslationLanguage: "English",
    subscriptionTier: "premium",
    stripeCustomerId: "cus_internal",
    stripeSubscriptionId: "sub_internal",
    subscriptionStatus: "active",
    subscriptionCurrentPeriodEnd: new Date(),
    premiumOnboardingCompleted: false,
    weeklyGoal: 5,
    weeklyProgress: 1,
    weekStartDate: new Date(),
    weeklyGoalEmailSent: false,
    weeklyGoalStreak: 0,
    lastWeekGoalReached: false,
    bonusStoryCredits: 3,
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
    timezone: "Europe/Paris",
  };

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

describe("auth.me", () => {
  it("returns a client-safe user object without internal authentication or billing identifiers", async () => {
    const caller = appRouter.createCaller(createAuthContext());

    const result = await caller.auth.me();
    const user = result as Record<string, unknown>;

    expect(user).toMatchObject({
      id: 42,
      email: "qa@example.com",
      name: "QA User",
      subscriptionTier: "premium",
      role: "user",
    });
    expect(user).not.toHaveProperty("passwordHash");
    expect(user).not.toHaveProperty("verificationToken");
    expect(user).not.toHaveProperty("verificationTokenExpiry");
    expect(user).not.toHaveProperty("stripeCustomerId");
    expect(user).not.toHaveProperty("stripeSubscriptionId");
    expect(user).not.toHaveProperty("openId");
  });
});
