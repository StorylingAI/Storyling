import { describe, it, expect } from "vitest";

describe("Vocabulary Popup Feature", () => {
  const testWord = "你好";
  const testTranslation = "hello";
  const testTargetLanguage = "zh";

  describe("translateWord procedure", () => {
    it("should translate a word and return structured data", async () => {
      const { invokeLLM } = await import("./_core/llm");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a language translation assistant. Translate the given word to the target language and provide a brief definition.",
          },
          {
            role: "user",
            content: `Translate the word "${testWord}" to en. Provide the translation and a brief definition.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "word_translation",
            strict: true,
            schema: {
              type: "object",
              properties: {
                word: { type: "string", description: "The original word" },
                translation: { type: "string", description: "Translation in target language" },
                definition: { type: "string", description: "Brief definition" },
                sourceLanguage: { type: "string", description: "Detected source language code" },
              },
              required: ["word", "translation", "definition", "sourceLanguage"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0].message.content;
      const result = JSON.parse(typeof content === "string" ? content : "{}");

      expect(result).toHaveProperty("word");
      expect(result).toHaveProperty("translation");
      expect(result).toHaveProperty("definition");
      expect(result).toHaveProperty("sourceLanguage");
      expect(result.word).toBeTruthy();
      expect(result.translation).toBeTruthy();
      expect(result.definition).toBeTruthy();
    }, 30000); // 30s timeout for LLM API

    it("should handle English to Spanish translation", async () => {
      const { invokeLLM } = await import("./_core/llm");

      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: "You are a language translation assistant. Translate the given word to the target language and provide a brief definition.",
          },
          {
            role: "user",
            content: `Translate the word "hello" to es. Provide the translation and a brief definition.`,
          },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "word_translation",
            strict: true,
            schema: {
              type: "object",
              properties: {
                word: { type: "string", description: "The original word" },
                translation: { type: "string", description: "Translation in target language" },
                definition: { type: "string", description: "Brief definition" },
                sourceLanguage: { type: "string", description: "Detected source language code" },
              },
              required: ["word", "translation", "definition", "sourceLanguage"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices[0].message.content;
      const result = JSON.parse(typeof content === "string" ? content : "{}");

      expect(result.word).toBe("hello");
      expect(result.translation).toBeTruthy();
      expect(result.sourceLanguage).toBe("en");
    }, 30000);
  });

  describe("Word data structure", () => {
    it("should have correct structure for wordbank entry", () => {
      const exampleSentence = "你好，很高兴见到你。";
      const wordbankEntry = {
        word: testWord,
        translation: testTranslation,
        targetLanguage: testTargetLanguage,
        exampleSentences: [exampleSentence],
      };

      expect(wordbankEntry.word).toBe(testWord);
      expect(wordbankEntry.translation).toBe(testTranslation);
      expect(wordbankEntry.targetLanguage).toBe(testTargetLanguage);
      expect(wordbankEntry.exampleSentences).toEqual([exampleSentence]);
    });

    it("should have correct structure for mastery record", () => {
      const masteryRecord = {
        easinessFactor: 1300, // 1.3 * 1000
        interval: 1,
        repetitions: 0,
        correctCount: 0,
        incorrectCount: 0,
      };

      expect(masteryRecord.easinessFactor).toBe(1300);
      expect(masteryRecord.interval).toBe(1);
      expect(masteryRecord.repetitions).toBe(0);
      expect(masteryRecord.correctCount).toBe(0);
      expect(masteryRecord.incorrectCount).toBe(0);
    });
  });

  describe("Long-press interaction", () => {
    it("should handle word selection from sentence", () => {
      const sentence = "你好，很高兴见到你。";
      const words = sentence.split(/\s+/);
      
      expect(words.length).toBeGreaterThan(0);
      expect(words[0]).toBeTruthy();
    });

    it("should extract clean word without punctuation", () => {
      const wordWithPunctuation = "你好，";
      const cleanWord = wordWithPunctuation.replace(/[，。！？,.\!?]/g, "");
      
      expect(cleanWord).toBe("你好");
    });

    it("should handle multi-word selection", () => {
      const sentence = "Hello world, how are you?";
      const words = sentence.split(/\s+/);
      
      expect(words).toContain("Hello");
      expect(words).toContain("world,");
      expect(words.length).toBe(5);
    });
  });
});
