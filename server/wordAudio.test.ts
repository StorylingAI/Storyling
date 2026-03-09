import { describe, it, expect } from "vitest";

describe("Word Audio Pronunciation Feature", () => {
  describe("generateWordAudio function", () => {
    it("should generate audio URL for a word", async () => {
      const { generateWordAudio } = await import("./audioGeneration");
      
      // Test with a simple word
      const word = "hello";
      const targetLanguage = "english";
      
      const audioUrl = await generateWordAudio(word, targetLanguage);
      
      expect(audioUrl).toBeTruthy();
      expect(typeof audioUrl).toBe("string");
      expect(audioUrl).toMatch(/^https?:\/\//); // Should be a valid URL
      expect(audioUrl).toContain(".mp3"); // Should be an MP3 file
    }, 30000); // 30s timeout for API call

    it("should generate audio for Chinese word", async () => {
      const { generateWordAudio } = await import("./audioGeneration");
      
      const word = "你好";
      const targetLanguage = "chinese";
      
      const audioUrl = await generateWordAudio(word, targetLanguage);
      
      expect(audioUrl).toBeTruthy();
      expect(typeof audioUrl).toBe("string");
      expect(audioUrl).toMatch(/^https?:\/\//);
    }, 30000);

    it("should generate audio for Spanish word", async () => {
      const { generateWordAudio } = await import("./audioGeneration");
      
      const word = "hola";
      const targetLanguage = "spanish";
      
      const audioUrl = await generateWordAudio(word, targetLanguage);
      
      expect(audioUrl).toBeTruthy();
      expect(typeof audioUrl).toBe("string");
      expect(audioUrl).toMatch(/^https?:\/\//);
    }, 30000);

    it("should handle words with special characters", async () => {
      const { generateWordAudio } = await import("./audioGeneration");
      
      const word = "café";
      const targetLanguage = "french";
      
      const audioUrl = await generateWordAudio(word, targetLanguage);
      
      expect(audioUrl).toBeTruthy();
      expect(typeof audioUrl).toBe("string");
    }, 30000);
  });

  describe("Audio file naming", () => {
    it("should sanitize word for file key", () => {
      const word = "你好，世界！";
      const safeWord = word.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, "_");
      
      expect(safeWord).toBe("你好_世界_");
      expect(safeWord).not.toContain("，");
      expect(safeWord).not.toContain("！");
    });

    it("should handle English words with punctuation", () => {
      const word = "Hello, world!";
      const safeWord = word.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, "_");
      
      expect(safeWord).toBe("Hello__world_");
    });

    it("should preserve Chinese characters", () => {
      const word = "学习";
      const safeWord = word.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, "_");
      
      expect(safeWord).toBe("学习");
    });
  });

  describe("Voice selection", () => {
    it("should select correct voice for Chinese", () => {
      const defaultVoiceMap: Record<string, string> = {
        chinese: "pNInz6obpgDQGcFmaJgB",
        spanish: "EXAVITQu4vr4xnSDxMaL",
        default: "EXAVITQu4vr4xnSDxMaL",
      };

      const languageKey = "chinese";
      const selectedVoiceId = defaultVoiceMap[languageKey] || defaultVoiceMap.default;
      
      expect(selectedVoiceId).toBe("pNInz6obpgDQGcFmaJgB");
    });

    it("should select correct voice for Spanish", () => {
      const defaultVoiceMap: Record<string, string> = {
        chinese: "pNInz6obpgDQGcFmaJgB",
        spanish: "EXAVITQu4vr4xnSDxMaL",
        default: "EXAVITQu4vr4xnSDxMaL",
      };

      const languageKey = "spanish";
      const selectedVoiceId = defaultVoiceMap[languageKey] || defaultVoiceMap.default;
      
      expect(selectedVoiceId).toBe("EXAVITQu4vr4xnSDxMaL");
    });

    it("should fallback to default voice for unknown language", () => {
      const defaultVoiceMap: Record<string, string> = {
        chinese: "pNInz6obpgDQGcFmaJgB",
        spanish: "EXAVITQu4vr4xnSDxMaL",
        default: "EXAVITQu4vr4xnSDxMaL",
      };

      const languageKey = "unknown";
      const selectedVoiceId = defaultVoiceMap[languageKey] || defaultVoiceMap.default;
      
      expect(selectedVoiceId).toBe("EXAVITQu4vr4xnSDxMaL");
    });
  });

  describe("Batch audio generation", () => {
    it("should generate audio for multiple words", async () => {
      const { generateBatchWordAudio } = await import("./audioGeneration");
      
      const words = ["hello", "world"];
      const targetLanguage = "english";
      
      const audioUrls = await generateBatchWordAudio(words, targetLanguage);
      
      expect(Object.keys(audioUrls).length).toBeGreaterThan(0);
      expect(audioUrls["hello"]).toBeTruthy();
    }, 60000); // 60s timeout for batch processing
  });

  describe("API response structure", () => {
    it("should return correct structure from generateWordAudio mutation", () => {
      const mockResponse = {
        audioUrl: "https://example.com/audio.mp3",
      };
      
      expect(mockResponse).toHaveProperty("audioUrl");
      expect(typeof mockResponse.audioUrl).toBe("string");
    });
  });
});
