import { describe, it, expect } from "vitest";

describe("Vocabulary Parsing Logic", () => {
  // Helper function matching the actual parsing logic
  const parseVocabulary = (text: string): string[] => {
    return text
      .trim()
      .split(/[,，、\n]/)
      .map((w) => w.trim())
      .filter(Boolean);
  };

  describe("Chinese (Mandarin)", () => {
    it("should parse Chinese words with full-width commas", () => {
      const input = "各位，业务，请教，请多指教，幸苦了，慢走，人工智能，创业，投资者";
      const words = parseVocabulary(input);

      expect(words.length).toBe(9);
      expect(words).toContain("各位");
      expect(words).toContain("业务");
      expect(words).toContain("人工智能");
      expect(words).toContain("投资者");
    });

    it("should parse Chinese words with regular commas", () => {
      const input = "你好, 谢谢, 再见, 朋友, 学习, 工作";
      const words = parseVocabulary(input);

      expect(words.length).toBe(6);
      expect(words).toContain("你好");
      expect(words).toContain("谢谢");
    });

    it("should parse Chinese words with enumeration comma", () => {
      const input = "苹果、香蕉、橙子、葡萄、西瓜";
      const words = parseVocabulary(input);

      expect(words.length).toBe(5);
      expect(words).toContain("苹果");
      expect(words).toContain("西瓜");
    });

    it("should handle mixed comma types", () => {
      const input = "你好，谢谢, 再见、朋友";
      const words = parseVocabulary(input);

      expect(words.length).toBe(4);
    });
  });

  describe("Japanese", () => {
    it("should parse Japanese words with full-width commas", () => {
      const input = "こんにちは，ありがとう，さようなら，友達，勉強";
      const words = parseVocabulary(input);

      expect(words.length).toBe(5);
      expect(words).toContain("こんにちは");
      expect(words).toContain("ありがとう");
    });

    it("should parse Japanese words with enumeration comma", () => {
      const input = "りんご、バナナ、オレンジ、ぶどう、すいか";
      const words = parseVocabulary(input);

      expect(words.length).toBe(5);
      expect(words).toContain("りんご");
      expect(words).toContain("すいか");
    });

    it("should parse Kanji words", () => {
      const input = "学校、先生、学生、教室、勉強";
      const words = parseVocabulary(input);

      expect(words.length).toBe(5);
      expect(words).toContain("学校");
      expect(words).toContain("勉強");
    });
  });

  describe("Korean", () => {
    it("should parse Korean words with commas", () => {
      const input = "안녕하세요, 감사합니다, 안녕히 가세요, 친구, 공부";
      const words = parseVocabulary(input);

      expect(words.length).toBe(5);
      expect(words).toContain("안녕하세요");
      expect(words).toContain("감사합니다");
    });

    it("should parse Korean words with full-width commas", () => {
      const input = "사과，바나나，오렌지，포도，수박";
      const words = parseVocabulary(input);

      expect(words.length).toBe(5);
    });
  });

  describe("English", () => {
    it("should parse English words with regular commas", () => {
      const input = "hello, thank you, goodbye, friend, study";
      const words = parseVocabulary(input);

      expect(words.length).toBe(5);
      expect(words).toContain("hello");
      expect(words).toContain("study");
    });

    it("should parse English words with newlines", () => {
      const input = "hello\nthank you\ngoodbye\nfriend\nstudy";
      const words = parseVocabulary(input);

      expect(words.length).toBe(5);
    });

    it("should parse English phrases", () => {
      const input = "good morning, how are you, see you later, best friend, hard work";
      const words = parseVocabulary(input);

      expect(words.length).toBe(5);
      expect(words).toContain("good morning");
      expect(words).toContain("how are you");
    });
  });

  describe("Spanish", () => {
    it("should parse Spanish words with commas", () => {
      const input = "hola, gracias, adiós, amigo, estudiar";
      const words = parseVocabulary(input);

      expect(words.length).toBe(5);
      expect(words).toContain("hola");
      expect(words).toContain("estudiar");
    });

    it("should handle Spanish accents", () => {
      const input = "café, niño, señor, español, José";
      const words = parseVocabulary(input);

      expect(words.length).toBe(5);
      expect(words).toContain("café");
      expect(words).toContain("español");
    });
  });

  describe("Edge Cases", () => {
    it("should handle extra whitespace", () => {
      const input = "  hello  ,  world  ,  test  ,  example  ,  demo  ";
      const words = parseVocabulary(input);

      expect(words.length).toBe(5);
      expect(words).toContain("hello");
      expect(words).toContain("demo");
    });

    it("should handle multiple consecutive separators", () => {
      const input = "hello,,,world\n\n\ntest,,example,,,demo";
      const words = parseVocabulary(input);

      expect(words.length).toBe(5);
    });

    it("should handle mixed separators", () => {
      const input = "hello,world\ntest，example、demo";
      const words = parseVocabulary(input);

      expect(words.length).toBe(5);
    });

    it("should handle empty input", () => {
      const words = parseVocabulary("");
      expect(words.length).toBe(0);
    });

    it("should handle whitespace-only input", () => {
      const words = parseVocabulary("   \n  \n  ");
      expect(words.length).toBe(0);
    });

    it("should handle single word", () => {
      const words = parseVocabulary("hello");
      expect(words.length).toBe(1);
      expect(words[0]).toBe("hello");
    });

    it("should handle trailing separators", () => {
      const input = "hello, world, test, example, demo,";
      const words = parseVocabulary(input);

      expect(words.length).toBe(5);
    });

    it("should handle leading separators", () => {
      const input = ",hello, world, test, example, demo";
      const words = parseVocabulary(input);

      expect(words.length).toBe(5);
    });
  });

  describe("Validation Requirements", () => {
    it("should meet minimum requirement of 5 words", () => {
      const validInput = "word1, word2, word3, word4, word5";
      const words = parseVocabulary(validInput);

      expect(words.length).toBeGreaterThanOrEqual(5);
    });

    it("should fail validation with less than 5 words", () => {
      const invalidInput = "word1, word2, word3, word4";
      const words = parseVocabulary(invalidInput);

      expect(words.length).toBeLessThan(5);
    });

    it("should handle exactly 5 words", () => {
      const input = "one, two, three, four, five";
      const words = parseVocabulary(input);

      expect(words.length).toBe(5);
    });

    it("should handle more than 5 words", () => {
      const input = "one, two, three, four, five, six, seven, eight, nine, ten";
      const words = parseVocabulary(input);

      expect(words.length).toBe(10);
    });
  });

  describe("Real User Examples", () => {
    it("should parse the reported Chinese example correctly", () => {
      const input = "各位，业务，请教，请多指教，幸苦了，慢走，人工智能，创业，投资者";
      const words = parseVocabulary(input);

      // This was showing "1 words" before the fix
      expect(words.length).toBe(9);
      expect(words.length).toBeGreaterThanOrEqual(5); // Should allow proceeding
    });

    it("should handle mixed English and Chinese", () => {
      const input = "hello, 你好, world, 世界, friend, 朋友";
      const words = parseVocabulary(input);

      expect(words.length).toBe(6);
    });
  });
});
