import { describe, expect, it } from "vitest";
import { SPAIN_SPANISH_LABEL } from "@shared/languagePreferences";
import {
  createWordbankImportBatches,
  normalizeWordbankTargetLanguage,
  parseWordImportText,
} from "./wordbankImport";

describe("wordbank import helpers", () => {
  it("normalizes language codes before saving imported words", () => {
    expect(normalizeWordbankTargetLanguage("es")).toBe(SPAIN_SPANISH_LABEL);
    expect(normalizeWordbankTargetLanguage("Spanish")).toBe(SPAIN_SPANISH_LABEL);
    expect(normalizeWordbankTargetLanguage(" Spanish (Spain) ")).toBe(SPAIN_SPANISH_LABEL);
  });

  it("parses pasted or file-loaded words with unicode separators", () => {
    expect(parseWordImportText("hola\nmundo, amigo\uFF1Bcasa\u3001libro")).toEqual([
      "hola",
      "mundo",
      "amigo",
      "casa",
      "libro",
    ]);
  });

  it("keeps only the target-language column from bilingual CSV imports", () => {
    const csv = [
      "Spanish,English",
      "Poder,To be able to",
      "Acordarse,To remember",
      "volver,return",
    ].join("\n");

    expect(parseWordImportText(csv, { targetLanguage: "Spanish", source: "csv" })).toEqual([
      "Poder",
      "Acordarse",
      "volver",
    ]);
  });

  it("drops obvious English translations and grammar notes from Spanish OCR imports", () => {
    const ocrText = [
      "Poder",
      "To be able to",
      "Acordarse",
      "To remember",
      "Vowel Change (E > IE)",
    ].join("\n");

    expect(parseWordImportText(ocrText, { targetLanguage: "Spanish" })).toEqual([
      "Poder",
      "Acordarse",
    ]);
  });

  it("deduplicates and chunks auto-saved imports at the endpoint limit", () => {
    const words = Array.from({ length: 105 }, (_, index) => `word-${index}`);

    const batches = createWordbankImportBatches([
      ...words,
      "word-0",
      " word-104 ",
    ]);

    expect(batches).toHaveLength(2);
    expect(batches[0]).toHaveLength(100);
    expect(batches[1]).toEqual(["word-100", "word-101", "word-102", "word-103", "word-104"]);
  });
});
