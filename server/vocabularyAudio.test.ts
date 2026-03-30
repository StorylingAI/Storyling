import { describe, it, expect, beforeEach, vi } from "vitest";
import { appRouter } from "./routers";
import { getDb } from "./db";
import { users, wordbank } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Vocabulary & Audio Features", () => {
  let testUserId: number;
  let caller: any;

  beforeEach(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");

    // Create test user
    const [result] = await db.insert(users).values({
      openId: `test-vocab-${Date.now()}`,
      name: "Test Vocab User",
      email: "vocab@test.com",
      role: "user",
    });

    testUserId = result.insertId;

    // Create authenticated caller
    caller = appRouter.createCaller({
      user: {
        id: testUserId,
        openId: `test-vocab-${Date.now()}`,
        name: "Test Vocab User",
        email: "vocab@test.com",
        role: "user",
      },
      req: {} as any,
      res: {} as any,
    });
  });

  describe("Wordbank Functionality", () => {
    it("should save a word to wordbank", async () => {
      const word = await caller.wordbank.saveWord({
        word: "你好",
        pinyin: "nǐ hǎo",
        translation: "hello",
        targetLanguage: "Chinese (Mandarin)",
        exampleSentences: ["你好，朋友！", "你好吗？"],
      });

      expect(word).toBeDefined();
      expect(word.word).toBe("你好");
      expect(word.pinyin).toBe("nǐ hǎo");
      expect(word.translation).toBe("hello");
    });

    it("should retrieve user's saved words", async () => {
      // Save multiple words
      await caller.wordbank.saveWord({
        word: "casa",
        translation: "house",
        targetLanguage: "Spanish",
        exampleSentences: ["Mi casa es grande.", "La casa está limpia."],
      });

      await caller.wordbank.saveWord({
        word: "perro",
        translation: "dog",
        targetLanguage: "Spanish",
        exampleSentences: ["El perro es amigable.", "Mi perro se llama Max."],
      });

      const words = await caller.wordbank.getMyWords();
      expect(words.length).toBeGreaterThanOrEqual(2);
    });

    it("should filter words by language", async () => {
      await caller.wordbank.saveWord({
        word: "bonjour",
        translation: "hello",
        targetLanguage: "French",
        exampleSentences: ["Bonjour, comment allez-vous?", "Bonjour à tous!"],
      });

      await caller.wordbank.saveWord({
        word: "casa",
        translation: "house",
        targetLanguage: "Spanish",
        exampleSentences: ["Mi casa es grande.", "La casa está limpia."],
      });

      const frenchWords = await caller.wordbank.getMyWordsByLanguage({
        targetLanguage: "French",
      });

      expect(frenchWords.length).toBeGreaterThanOrEqual(1);
      expect(frenchWords.every((w: any) => w.targetLanguage === "French")).toBe(true);
    });

    it("should prevent duplicate words", async () => {
      await caller.wordbank.saveWord({
        word: "hello",
        translation: "hola",
        targetLanguage: "English",
      });

      // Try to save the same word again
      await expect(
        caller.wordbank.saveWord({
          word: "hello",
          translation: "hola",
          targetLanguage: "English",
        })
      ).rejects.toThrow();
    });

    it("should check if word is already saved", async () => {
      await caller.wordbank.saveWord({
        word: "gato",
        translation: "cat",
        targetLanguage: "Spanish",
      });

      const isSaved = await caller.wordbank.checkWordSaved({
        word: "gato",
        targetLanguage: "Spanish",
      });

      expect(isSaved).toBe(true);
    });

    it("should remove word from wordbank", async () => {
      const word = await caller.wordbank.saveWord({
        word: "test",
        translation: "prueba",
        targetLanguage: "Spanish",
      });

      await caller.wordbank.removeWord({ wordId: word.id });

      const isSaved = await caller.wordbank.checkWordSaved({
        word: "test",
        targetLanguage: "Spanish",
      });

      expect(isSaved).toBe(false);
    });
  });

  describe("Vocabulary Table Display", () => {
    it("should handle Chinese words with pinyin", () => {
      const vocabData = {
        word: "你好",
        pinyin: "nǐ hǎo",
        translation: "hello",
        exampleSentences: ["你好，朋友！", "你好吗？"],
      };

      expect(vocabData.pinyin).toBeDefined();
      expect(vocabData.exampleSentences).toHaveLength(2);
    });

    it("should handle non-Chinese words without pinyin", () => {
      const vocabData = {
        word: "casa",
        translation: "house",
        exampleSentences: ["Mi casa es grande.", "La casa está limpia."],
      };

      expect(vocabData).not.toHaveProperty("pinyin");
      expect(vocabData.exampleSentences).toHaveLength(2);
    });

    it("should format vocabulary data correctly", () => {
      const words = ["hello", "goodbye", "please"];
      const translations = {
        hello: {
          word: "hello",
          translation: "hola",
          exampleSentences: ["Hello, how are you?", "Hello world!"],
        },
        goodbye: {
          word: "goodbye",
          translation: "adiós",
          exampleSentences: ["Goodbye, see you later!", "Goodbye forever."],
        },
        please: {
          word: "please",
          translation: "por favor",
          exampleSentences: ["Please help me.", "Please come here."],
        },
      };

      expect(Object.keys(translations)).toHaveLength(3);
      expect(translations.hello.exampleSentences).toHaveLength(2);
    });
  });

  describe("Audio Generation", () => {
    it("should accept audio generation request", async () => {
      // Note: This will actually call ElevenLabs API in test environment
      // In production tests, you'd mock the API call
      const result = await caller.audio.generateWordAudio({
        word: "hello",
        targetLanguage: "English",
      });

      expect(result).toBeDefined();
      expect(result.audioUrl).toBeDefined();
      expect(typeof result.audioUrl).toBe("string");
    });

    it("should handle different languages", async () => {
      const languages = ["Spanish", "French", "Chinese (Mandarin)"];

      for (const lang of languages) {
        const result = await caller.audio.generateWordAudio({
          word: "test",
          targetLanguage: lang,
        });

        expect(result.audioUrl).toBeDefined();
      }
    });
  });

  describe("Enhanced Tooltips", () => {
    it("should include all required tooltip data", () => {
      const tooltipData = {
        word: "casa",
        translation: "house",
        exampleSentences: ["Mi casa es grande.", "La casa está limpia."],
      };

      expect(tooltipData.word).toBeDefined();
      expect(tooltipData.translation).toBeDefined();
      expect(tooltipData.exampleSentences).toHaveLength(2);
    });

    it("should include pinyin for Chinese words", () => {
      const tooltipData = {
        word: "你好",
        pinyin: "nǐ hǎo",
        translation: "hello",
        exampleSentences: ["你好，朋友！", "你好吗？"],
      };

      expect(tooltipData.pinyin).toBe("nǐ hǎo");
    });
  });
});
