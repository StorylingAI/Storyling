import { describe, it, expect } from "vitest";
import { parseCSV, generateCSVTemplate } from "./csvParser";

describe("CSV Parser", () => {
  it("should parse valid CSV with all columns", () => {
    const csv = `vocabulary_words,target_language,proficiency_level,theme,format,voice_type,cinematic_style,topic_prompt
"hello,world,friend",Spanish,A2,Comedy,podcast,Warm & Friendly,,Learn basic greetings`;

    const items = parseCSV(csv);

    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      vocabularyWords: ["hello", "world", "friend"],
      targetLanguage: "Spanish",
      proficiencyLevel: "A2",
      theme: "Comedy",
      format: "podcast",
      voiceType: "Warm & Friendly",
      topicPrompt: "Learn basic greetings",
    });
  });

  it("should parse CSV with semicolon-separated vocabulary", () => {
    const csv = `vocabulary_words,target_language,proficiency_level,theme,format
"mountain;river;forest",French,B1,Adventure,film`;

    const items = parseCSV(csv);

    expect(items).toHaveLength(1);
    expect(items[0].vocabularyWords).toEqual(["mountain", "river", "forest"]);
  });

  it("should handle multiple rows", () => {
    const csv = `vocabulary_words,target_language,proficiency_level,theme,format
"hello,world",Spanish,A2,Comedy,podcast
"mountain,river",French,B1,Adventure,film`;

    const items = parseCSV(csv);

    expect(items).toHaveLength(2);
    expect(items[0].targetLanguage).toBe("Spanish");
    expect(items[1].targetLanguage).toBe("French");
  });

  it("should skip empty lines", () => {
    const csv = `vocabulary_words,target_language,proficiency_level,theme,format
"hello,world",Spanish,A2,Comedy,podcast

"mountain,river",French,B1,Adventure,film`;

    const items = parseCSV(csv);

    expect(items).toHaveLength(2);
  });

  it("should throw error for missing required column", () => {
    const csv = `vocabulary_words,target_language,proficiency_level,theme
"hello,world",Spanish,A2,Comedy`;

    expect(() => parseCSV(csv)).toThrow("Missing required column: format");
  });

  it("should throw error for empty vocabulary_words", () => {
    const csv = `vocabulary_words,target_language,proficiency_level,theme,format
"",Spanish,A2,Comedy,podcast`;

    expect(() => parseCSV(csv)).toThrow("vocabulary_words cannot be empty");
  });

  it("should throw error for invalid format", () => {
    const csv = `vocabulary_words,target_language,proficiency_level,theme,format
"hello,world",Spanish,A2,Comedy,invalid`;

    expect(() => parseCSV(csv)).toThrow("format must be either 'podcast' or 'film'");
  });

  it("should throw error for invalid proficiency level", () => {
    const csv = `vocabulary_words,target_language,proficiency_level,theme,format
"hello,world",Spanish,Z9,Comedy,podcast`;

    expect(() => parseCSV(csv)).toThrow("proficiency_level must be A1, A2, B1, B2, C1, or C2");
  });

  it("should throw error for column count mismatch", () => {
    const csv = `vocabulary_words,target_language,proficiency_level,theme,format
"hello,world",Spanish,A2`;

    expect(() => parseCSV(csv)).toThrow("Column count mismatch");
  });

  it("should throw error for CSV with only header", () => {
    const csv = `vocabulary_words,target_language,proficiency_level,theme,format`;

    expect(() => parseCSV(csv)).toThrow("CSV must contain at least a header row and one data row");
  });

  it("should handle optional columns gracefully", () => {
    const csv = `vocabulary_words,target_language,proficiency_level,theme,format,voice_type,cinematic_style,topic_prompt
"hello,world",Spanish,A2,Comedy,podcast,,,`;

    const items = parseCSV(csv);

    expect(items).toHaveLength(1);
    expect(items[0].voiceType).toBeUndefined();
    expect(items[0].cinematicStyle).toBeUndefined();
    expect(items[0].topicPrompt).toBeUndefined();
  });

  it("should generate valid CSV template", () => {
    const template = generateCSVTemplate();

    expect(template).toContain("vocabulary_words,target_language,proficiency_level,theme,format");
    expect(template).toContain("Spanish");
    expect(template).toContain("French");
    expect(template).toContain("podcast");
    expect(template).toContain("film");
  });

  it("should parse template successfully", () => {
    const template = generateCSVTemplate();
    const items = parseCSV(template);

    expect(items).toHaveLength(2);
    expect(items[0].format).toBe("podcast");
    expect(items[1].format).toBe("film");
  });
});
