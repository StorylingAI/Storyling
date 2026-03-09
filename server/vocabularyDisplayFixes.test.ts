import { describe, it, expect } from "vitest";

describe("Vocabulary Display and Wordbank Fixes", () => {

  describe("Vocabulary Table Data Structure", () => {
    it("should properly parse comma-separated vocabulary words", () => {
      const vocabularyText = "各位，业务，请教，请多指教，幸苦了，慢走，人工智能，创业，投资者";
      const words = vocabularyText.split(/[,，、]/).map(w => w.trim()).filter(Boolean);
      
      expect(words.length).toBe(9);
      expect(words[0]).toBe("各位");
      expect(words[8]).toBe("投资者");
    });

    it("should handle mixed separators (commas and Chinese commas)", () => {
      const vocabularyText = "hello, world，你好、世界";
      const words = vocabularyText.split(/[,，、]/).map(w => w.trim()).filter(Boolean);
      
      expect(words.length).toBe(4);
      expect(words).toContain("hello");
      expect(words).toContain("world");
      expect(words).toContain("你好");
      expect(words).toContain("世界");
    });
  });

  describe("Story Tooltip Data", () => {
    it("should extract bold markdown words correctly", () => {
      const storyText = "今天**各位**都来了，大家一起讨论**业务**的事情。";
      const boldRegex = /\*\*([^*]+)\*\*/g;
      const matches = [];
      let match;
      
      while ((match = boldRegex.exec(storyText)) !== null) {
        matches.push(match[1]);
      }
      
      expect(matches.length).toBe(2);
      expect(matches[0]).toBe("各位");
      expect(matches[1]).toBe("业务");
    });

    it("should handle multiple bold words in a sentence", () => {
      const storyText = "The **investor** met with the **entrepreneur** to discuss **business** opportunities.";
      const boldRegex = /\*\*([^*]+)\*\*/g;
      const matches = [];
      let match;
      
      while ((match = boldRegex.exec(storyText)) !== null) {
        matches.push(match[1]);
      }
      
      expect(matches.length).toBe(3);
      expect(matches).toContain("investor");
      expect(matches).toContain("entrepreneur");
      expect(matches).toContain("business");
    });
  });
});
