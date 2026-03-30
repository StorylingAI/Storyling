import { describe, it, expect } from "vitest";
import { extractTextFromDocument, extractVocabularyFromText } from "./documentExtraction";
import { writeFile } from "fs/promises";

describe("Document Extraction", () => {
  describe("extractTextFromDocument", () => {
    it("should extract text from a plain text file", async () => {
      const testFilePath = "/tmp/test_extraction.txt";
      const testContent = "这是一个测试文件。\n包含中文内容。";
      
      await writeFile(testFilePath, testContent);
      
      const result = await extractTextFromDocument(testFilePath, "text/plain");
      
      expect(result).toBe(testContent.trim());
    });

    it("should throw error for unsupported file types", async () => {
      await expect(
        extractTextFromDocument("/tmp/test.xyz", "application/xyz")
      ).rejects.toThrow("Unsupported document type");
    });
  });

  describe("extractVocabularyFromText", () => {
    it("should extract vocabulary words from Chinese text", async () => {
      const chineseText = `
        今天天气很好。我和朋友去公园散步。
        我们看到很多人在运动。有人在跑步，有人在打太极拳。
        公园里有很多树和花。空气很新鲜。
      `;
      
      const result = await extractVocabularyFromText(
        chineseText,
        "Chinese (Mandarin)",
        20
      );
      
      expect(result).toBeInstanceOf(Array);
      expect(result.length).toBeGreaterThan(0);
      expect(result.length).toBeLessThanOrEqual(20);
      
      // Check that we got Chinese words
      const hasChinese = result.some(word => /[\u4e00-\u9fa5]/.test(word));
      expect(hasChinese).toBe(true);
    }, 30000); // 30 second timeout for LLM call

    it("should respect maxWords limit", async () => {
      const longText = "今天 天气 很好 我 和 朋友 去 公园 散步 运动 跑步 太极拳 树 花 空气 新鲜 咖啡馆 咖啡 周末 愉快".repeat(5);
      
      const result = await extractVocabularyFromText(
        longText,
        "Chinese (Mandarin)",
        10
      );
      
      expect(result.length).toBeLessThanOrEqual(10);
    }, 30000);

    it("should return unique words only", async () => {
      const textWithDuplicates = "今天 今天 天气 天气 很好 很好 我 我 朋友 朋友";
      
      const result = await extractVocabularyFromText(
        textWithDuplicates,
        "Chinese (Mandarin)",
        10
      );
      
      // Check for uniqueness
      const uniqueWords = new Set(result);
      expect(uniqueWords.size).toBe(result.length);
    }, 30000);
  });
});
