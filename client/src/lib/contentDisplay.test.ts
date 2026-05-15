import { describe, expect, it } from "vitest";
import {
  buildLineTranslationsForDisplay,
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

  it("does not pair film subtitle segments with unrelated translations by index", () => {
    const result = buildLineTranslationsForDisplay(
      [
        {
          startTime: 0,
          endTime: 3,
          text: "Clara se sienta a desayunar en la mesa con su madre.",
        },
        { startTime: 3, endTime: 6, text: "Ana abre su cuaderno azul." },
      ],
      [
        {
          original: "Ana se levanta temprano cada dia.",
          english: "Ana wakes up early every day.",
        },
        {
          original: "Ella suele sentir que el dia va a ser bueno.",
          english: "She usually feels that the day is going to be good.",
        },
        {
          original: "Ana abre su cuaderno azul.",
          english: "Ana opens her blue notebook.",
        },
      ],
    );

    expect(result).toEqual([
      {
        original: "Clara se sienta a desayunar en la mesa con su madre.",
        english: "",
      },
      {
        original: "Ana abre su cuaderno azul.",
        english: "Ana opens her blue notebook.",
      },
    ]);
  });

  it("splits Chinese punctuation-separated vocabulary lists", () => {
    expect(normalizeStringArray(["xihuan\uFF0C zhanhui\uFF0C ruanjian\u3001chenggong\uFF1Bkuaile"])).toEqual([
      "xihuan",
      "zhanhui",
      "ruanjian",
      "chenggong",
      "kuaile",
    ]);
  });
});
