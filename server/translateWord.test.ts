import { describe, it, expect } from "vitest";
import { wordbankRouter } from "./wordbankRouters";

describe("translateWord procedure", () => {
  it("should translate a Spanish word to English", async () => {
    // Create a mock context with a user
    const mockContext = {
      user: {
        id: "test-user-id",
        openId: "test-open-id",
        name: "Test User",
        email: "test@example.com",
        role: "user" as const,
        preferredLanguage: "en",
        createdAt: new Date(),
      },
    };

    // Create a caller with the mock context
    const caller = wordbankRouter.createCaller(mockContext as any);

    // Call the translateWord procedure
    const result = await caller.translateWord({
      word: "hola",
      targetLanguage: "en",
    });

    console.log("Translation result:", result);

    // Check that we got a result
    expect(result).toBeDefined();
    expect(result.word).toBe("hola");
    expect(result.translation).toBeDefined();
    expect(result.definition).toBeDefined();
  });
});
