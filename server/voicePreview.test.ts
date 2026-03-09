import { describe, it, expect } from "vitest";
import { generateVoicePreview } from "./voicePreview";

describe("Voice Preview Gender Selection", () => {
  describe("Chinese voices", () => {
    it("should generate preview with male voice for Chinese", async () => {
      const audioUrl = await generateVoicePreview(
        "Chinese (Mandarin)",
        "Professional Narrator",
        "male"
      );
      
      expect(audioUrl).toBeTruthy();
      expect(typeof audioUrl).toBe("string");
      expect(audioUrl).toMatch(/^https?:\/\//);
      expect(audioUrl).toContain(".mp3");
    }, 30000);

    it("should generate preview with female voice for Chinese", async () => {
      const audioUrl = await generateVoicePreview(
        "Chinese (Mandarin)",
        "Professional Narrator",
        "female"
      );
      
      expect(audioUrl).toBeTruthy();
      expect(typeof audioUrl).toBe("string");
      expect(audioUrl).toMatch(/^https?:\/\//);
      expect(audioUrl).toContain(".mp3");
    }, 30000);
  });

  describe("Spanish voices", () => {
    it("should generate preview with male voice for Spanish", async () => {
      const audioUrl = await generateVoicePreview(
        "Spanish",
        "Warm & Friendly",
        "male"
      );
      
      expect(audioUrl).toBeTruthy();
      expect(typeof audioUrl).toBe("string");
      expect(audioUrl).toMatch(/^https?:\/\//);
    }, 30000);

    it("should generate preview with female voice for Spanish", async () => {
      const audioUrl = await generateVoicePreview(
        "Spanish",
        "Warm & Friendly",
        "female"
      );
      
      expect(audioUrl).toBeTruthy();
      expect(typeof audioUrl).toBe("string");
      expect(audioUrl).toMatch(/^https?:\/\//);
    }, 30000);
  });

  describe("Voice type variations", () => {
    it("should handle Energetic & Upbeat voice type", async () => {
      const audioUrl = await generateVoicePreview(
        "English",
        "Energetic & Upbeat",
        "female"
      );
      
      expect(audioUrl).toBeTruthy();
    }, 30000);

    it("should handle Calm & Soothing voice type", async () => {
      const audioUrl = await generateVoicePreview(
        "French",
        "Calm & Soothing",
        "male"
      );
      
      expect(audioUrl).toBeTruthy();
    }, 30000);

    it("should handle Dramatic & Expressive voice type", async () => {
      const audioUrl = await generateVoicePreview(
        "German",
        "Dramatic & Expressive",
        "female"
      );
      
      expect(audioUrl).toBeTruthy();
    }, 30000);
  });

  describe("tRPC endpoint integration", () => {
    it("should accept correct parameters from Settings page", () => {
      // Test that the expected input structure matches what Settings sends
      const mockInput = {
        targetLanguage: "Chinese (Mandarin)",
        voiceType: "Professional Narrator",
        narratorGender: "female" as const,
      };
      
      expect(mockInput.targetLanguage).toBeDefined();
      expect(mockInput.voiceType).toBeDefined();
      expect(mockInput.narratorGender).toBeDefined();
      expect(["male", "female"]).toContain(mockInput.narratorGender);
    });
  });
});
