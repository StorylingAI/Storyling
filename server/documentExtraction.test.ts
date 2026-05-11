import { describe, it, expect } from "vitest";
import { extractTextFromDocument, extractVocabularyFromText } from "./documentExtraction";
import { writeFile } from "fs/promises";
import os from "os";
import path from "path";

function createPlainTextPdf(text: string): string {
  return [
    "%PDF-1.4",
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
    `4 0 obj << /Length ${text.length + 42} >> stream`,
    "BT",
    "/F1 24 Tf",
    "72 720 Td",
    `(${text}) Tj`,
    "ET",
    "endstream endobj",
    "5 0 obj << /Type /Font /Subtype /Type1 /BaseFont /Helvetica >> endobj",
    "xref",
    "0 6",
    "0000000000 65535 f ",
    "trailer << /Root 1 0 R /Size 6 >>",
    "startxref",
    "0",
    "%%EOF",
  ].join("\n");
}

function createToUnicodeEncodedPdf(): string {
  const cmap = [
    "/CIDInit /ProcSet findresource begin",
    "12 dict begin",
    "begincmap",
    "/CIDSystemInfo << /Registry (Adobe) /Ordering (UCS) /Supplement 0 >> def",
    "/CMapName /Adobe-Identity-UCS def",
    "/CMapType 2 def",
    "1 begincodespacerange",
    "<0000> <ffff>",
    "endcodespacerange",
    "10 beginbfchar",
    "<0037> <0056>",
    "<0050> <006f>",
    "<0044> <0063>",
    "<0042> <0061>",
    "<0043> <0062>",
    "<0056> <0075>",
    "<004d> <006c>",
    "<0053> <0072>",
    "<004a> <0069>",
    "<0001> <0020>",
    "endbfchar",
    "endcmap",
    "CMapName currentdict /CMap defineresource pop",
    "end",
    "end",
  ].join("\n");
  const content = "BT\n/F1 12 Tf\n[<003700500044004200430056004d00420053004a00500001003700500044004200430056004d00420053004a0050>] TJ\nET";

  return [
    "%PDF-1.4",
    "1 0 obj << /Type /Catalog /Pages 2 0 R >> endobj",
    "2 0 obj << /Type /Pages /Kids [3 0 R] /Count 1 >> endobj",
    "3 0 obj << /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >> endobj",
    `4 0 obj << /Length ${content.length} >> stream`,
    content,
    "endstream endobj",
    "5 0 obj << /Type /Font /Subtype /Type0 /BaseFont /FakeFont /ToUnicode 6 0 R /Encoding /Identity-H /DescendantFonts [7 0 R] >> endobj",
    "7 0 obj << /Type /Font /Subtype /CIDFontType0 /BaseFont /FakeFont >> endobj",
    `6 0 obj << /Length ${cmap.length} >> stream`,
    cmap,
    "endstream endobj",
    "xref",
    "0 8",
    "0000000000 65535 f ",
    "trailer << /Root 1 0 R /Size 8 >>",
    "startxref",
    "0",
    "%%EOF",
  ].join("\n");
}

describe("Document Extraction", () => {
  describe("extractTextFromDocument", () => {
    it("should extract text from a plain text file", async () => {
      const testFilePath = "/tmp/test_extraction.txt";
      const testContent = "这是一个测试文件。\n包含中文内容。";
      
      await writeFile(testFilePath, testContent);
      
      const result = await extractTextFromDocument(testFilePath, "text/plain");
      
      expect(result).toBe(testContent.trim());
    });

    it("should extract text from a readable PDF even when pdftotext is unavailable", async () => {
      const testFilePath = "/tmp/test_extraction.pdf";
      const testContent = "hola mundo amigo casa libro";

      await writeFile(testFilePath, createPlainTextPdf(testContent), "latin1");

      const result = await extractTextFromDocument(testFilePath, "application/pdf");

      expect(result).toContain(testContent);
    });

    it("should decode PDF text through the active font ToUnicode map", async () => {
      const testFilePath = path.join(os.tmpdir(), "test_tounicode_extraction.pdf");

      await writeFile(testFilePath, createToUnicodeEncodedPdf(), "latin1");

      const result = await extractTextFromDocument(testFilePath, "application/pdf");

      expect(result).toContain("Vocabulario Vocabulario");
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
