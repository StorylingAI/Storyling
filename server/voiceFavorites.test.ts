import { describe, it, expect, beforeAll } from "vitest";
import { appRouter } from "./routers";
import type { Context } from "./_core/context";
import { getDb } from "./db";
import { voiceFavorites, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

// Mock user context
const mockUser = {
  id: 999999,
  openId: "test-voice-favorites-user",
  name: "Test User",
  email: "test@example.com",
  role: "user" as const,
  createdAt: new Date(),
  updatedAt: new Date(),
  lastSignedIn: new Date(),
  loginMethod: "test",
  preferredLanguage: "en",
  preferredTranslationLanguage: "en",
};

const mockContext: Context = {
  user: mockUser,
  req: {} as any,
  res: {} as any,
};

describe("Voice Favorites API", () => {
  beforeAll(async () => {
    // Ensure test user exists
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const existingUser = await db
      .select()
      .from(users)
      .where(eq(users.openId, mockUser.openId))
      .limit(1);

    if (existingUser.length === 0) {
      await db.insert(users).values({
        openId: mockUser.openId,
        name: mockUser.name,
        email: mockUser.email,
        role: mockUser.role,
        loginMethod: mockUser.loginMethod,
        preferredLanguage: mockUser.preferredLanguage,
        preferredTranslationLanguage: mockUser.preferredTranslationLanguage,
      });
    }

    // Clean up any existing test favorites
    await db
      .delete(voiceFavorites)
      .where(eq(voiceFavorites.userId, mockUser.id));
  });

  it("should add a voice favorite", async () => {
    const caller = appRouter.createCaller(mockContext);

    const result = await caller.content.addVoiceFavorite({
      targetLanguage: "Spanish",
      voiceType: "Warm & Friendly",
      narratorGender: "female",
    });

    expect(result.success).toBe(true);

    // Verify it was added to database
    const favorites = await caller.content.getVoiceFavorites();
    expect(favorites.length).toBeGreaterThan(0);
    expect(favorites.some(
      (fav) =>
        fav.targetLanguage === "Spanish" &&
        fav.voiceType === "Warm & Friendly" &&
        fav.narratorGender === "female"
    )).toBe(true);
  });

  it("should not duplicate favorites", async () => {
    const caller = appRouter.createCaller(mockContext);

    // Add the same favorite twice
    await caller.content.addVoiceFavorite({
      targetLanguage: "French",
      voiceType: "Professional Narrator",
      narratorGender: "male",
    });

    await caller.content.addVoiceFavorite({
      targetLanguage: "French",
      voiceType: "Professional Narrator",
      narratorGender: "male",
    });

    const favorites = await caller.content.getVoiceFavorites();
    const frenchProfessionalMale = favorites.filter(
      (fav) =>
        fav.targetLanguage === "French" &&
        fav.voiceType === "Professional Narrator" &&
        fav.narratorGender === "male"
    );

    // Should only have one entry
    expect(frenchProfessionalMale.length).toBe(1);
  });

  it("should retrieve all voice favorites for a user", async () => {
    const caller = appRouter.createCaller(mockContext);

    // Add multiple favorites
    await caller.content.addVoiceFavorite({
      targetLanguage: "German",
      voiceType: "Energetic & Upbeat",
      narratorGender: "female",
    });

    await caller.content.addVoiceFavorite({
      targetLanguage: "German",
      voiceType: "Energetic & Upbeat",
      narratorGender: "male",
    });

    const favorites = await caller.content.getVoiceFavorites();

    expect(favorites.length).toBeGreaterThanOrEqual(2);
    expect(favorites.every((fav) => fav.userId === mockUser.id)).toBe(true);
  });

  it("should remove a voice favorite", async () => {
    const caller = appRouter.createCaller(mockContext);

    // Add a favorite
    await caller.content.addVoiceFavorite({
      targetLanguage: "Italian",
      voiceType: "Calm & Soothing",
      narratorGender: "female",
    });

    // Verify it exists
    let favorites = await caller.content.getVoiceFavorites();
    const initialCount = favorites.length;
    expect(favorites.some(
      (fav) =>
        fav.targetLanguage === "Italian" &&
        fav.voiceType === "Calm & Soothing" &&
        fav.narratorGender === "female"
    )).toBe(true);

    // Remove it
    const result = await caller.content.removeVoiceFavorite({
      targetLanguage: "Italian",
      voiceType: "Calm & Soothing",
      narratorGender: "female",
    });

    expect(result.success).toBe(true);

    // Verify it's gone
    favorites = await caller.content.getVoiceFavorites();
    expect(favorites.length).toBe(initialCount - 1);
    expect(favorites.some(
      (fav) =>
        fav.targetLanguage === "Italian" &&
        fav.voiceType === "Calm & Soothing" &&
        fav.narratorGender === "female"
    )).toBe(false);
  });

  it("should handle removing non-existent favorite gracefully", async () => {
    const caller = appRouter.createCaller(mockContext);

    // Try to remove a favorite that doesn't exist
    const result = await caller.content.removeVoiceFavorite({
      targetLanguage: "NonExistent",
      voiceType: "NonExistent",
      narratorGender: "male",
    });

    // Should not throw error
    expect(result.success).toBe(true);
  });

  it("should support different voice types and languages", async () => {
    const caller = appRouter.createCaller(mockContext);

    const testCases = [
      { language: "Chinese (Mandarin)", voiceType: "Dramatic & Expressive", gender: "male" as const },
      { language: "Japanese", voiceType: "Warm & Friendly", gender: "female" as const },
      { language: "Korean", voiceType: "Professional Narrator", gender: "male" as const },
    ];

    for (const testCase of testCases) {
      await caller.content.addVoiceFavorite({
        targetLanguage: testCase.language,
        voiceType: testCase.voiceType,
        narratorGender: testCase.gender,
      });
    }

    const favorites = await caller.content.getVoiceFavorites();

    for (const testCase of testCases) {
      expect(favorites.some(
        (fav) =>
          fav.targetLanguage === testCase.language &&
          fav.voiceType === testCase.voiceType &&
          fav.narratorGender === testCase.gender
      )).toBe(true);
    }
  });
});
