import { describe, expect, it } from "vitest";
import {
  normalizeLineTranslations,
  normalizeStringArray,
  normalizeVocabularyTranslations,
  safeString,
} from "./contentDisplay";

describe("content display normalization", () => {
  it("keeps missing text fields from crashing transcript rendering", () => {
    expect(safeString(undefined)).toBe("");
    expect(safeString(null)).toBe("");
    expect(safeString(42)).toBe("42");
  });

  it("drops malformed line translations and accepts legacy field names", () => {
    const result = normalizeLineTranslations([
      undefined,
      { english: "No source" },
      { sentence: "Hola mundo.", translation: "Hello world." },
      { original: "Adios.", english: "Goodbye." },
    ]);

    expect(result).toEqual([
      { original: "Hola mundo.", english: "Hello world." },
      { original: "Adios.", english: "Goodbye." },
    ]);
  });

  it("parses JSON-encoded translations safely", () => {
    const result = normalizeLineTranslations(
      JSON.stringify([{ original: "Bonjour.", english: "Hello." }]),
    );

    expect(result).toEqual([{ original: "Bonjour.", english: "Hello." }]);
  });

  it("normalizes vocabulary translation variants", () => {
    const result = normalizeVocabularyTranslations({
      maison: "house",
      chat: {
        translation: "cat",
        exampleSentences: ["Le chat dort."],
      },
    });

    expect(result.maison.translation).toBe("house");
    expect(result.chat.word).toBe("chat");
    expect(result.chat.exampleSentences).toEqual(["Le chat dort."]);
  });

  it("normalizes vocabulary word lists from strings and arrays", () => {
    expect(normalizeStringArray("hola, adios\ngracias")).toEqual([
      "hola",
      "adios",
      "gracias",
    ]);
    expect(normalizeStringArray(["bonjour", null, "merci"])).toEqual([
      "bonjour",
      "merci",
    ]);
  });

  it("splits Chinese punctuation-separated vocabulary lists", () => {
    expect(normalizeStringArray(["喜欢， 展会， 软件、成功；快乐"])).toEqual([
      "喜欢",
      "展会",
      "软件",
      "成功",
      "快乐",
    ]);
  });
});
