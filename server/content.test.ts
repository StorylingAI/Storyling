import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

type AuthenticatedUser = NonNullable<TrpcContext["user"]>;

function createAuthContext(): { ctx: TrpcContext } {
  const user: AuthenticatedUser = {
    id: 1,
    openId: "test-user",
    email: "test@storylingai.com",
    name: "Test User",
    loginMethod: "manus",
    role: "user",
    createdAt: new Date(),
    updatedAt: new Date(),
    lastSignedIn: new Date(),
  };

  const ctx: TrpcContext = {
    user,
    req: {
      protocol: "https",
      headers: {},
    } as TrpcContext["req"],
    res: {
      clearCookie: () => {},
    } as TrpcContext["res"],
  };

  return { ctx };
}

describe("content generation", () => {
  it("generates a preview for a story", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.content.generatePreview({
      targetLanguage: "Spanish",
      proficiencyLevel: "A2",
      vocabularyText: "casa, perro, gato, comer, dormir",
      theme: "Comedy",
      topicPrompt: "A funny story about pets",
    });

    expect(result).toBeDefined();
    expect(result.preview).toBeDefined();
    expect(typeof result.preview).toBe("string");
    expect(result.preview.length).toBeGreaterThan(0);
  }, 30000);

  it("starts content generation and returns a content ID", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const result = await caller.content.generate({
      targetLanguage: "French",
      proficiencyLevel: "B1",
      vocabularyText: "maison, chat, manger, dormir, jouer",
      theme: "Adventure",
      mode: "podcast",
      voiceType: "Warm & Friendly",
    });

    expect(result).toBeDefined();
    expect(result.contentId).toBeDefined();
    expect(typeof result.contentId).toBe("number");
    expect(result.contentId).toBeGreaterThan(0);
  }, 30000);
});

describe("content library", () => {
  it("retrieves user's content library", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const library = await caller.content.getLibrary();

    expect(library).toBeDefined();
    expect(Array.isArray(library)).toBe(true);
  });

  it("retrieves user's favorites", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const favorites = await caller.content.getFavorites();

    expect(favorites).toBeDefined();
    expect(Array.isArray(favorites)).toBe(true);
  });
});

describe("learning progress", () => {
  it("retrieves user's learning progress", async () => {
    const { ctx } = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const progress = await caller.progress.get();

    expect(progress).toBeDefined();
    expect(Array.isArray(progress)).toBe(true);
  });
});
