export interface DisplayLineTranslation {
  original: string;
  pinyin?: string;
  english: string;
}

export interface DisplayVocabularyData {
  word: string;
  pinyin?: string;
  translation: string;
  exampleSentences: string[];
}

export interface DisplaySubtitleSegment {
  startTime: number;
  endTime: number;
  text: string;
}

function maybeParseJson(value: unknown): unknown {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  if (!trimmed || (!trimmed.startsWith("{") && !trimmed.startsWith("["))) {
    return value;
  }

  try {
    return JSON.parse(trimmed);
  } catch {
    return value;
  }
}

const LIST_SEPARATOR_PATTERN = /[,;\n\r\uFF0C\u3001\uFF1B]+/;

function splitListText(value: string): string[] {
  return value
    .split(LIST_SEPARATOR_PATTERN)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function safeString(value: unknown, fallback = ""): string {
  if (typeof value === "string") {
    return value;
  }

  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }

  return fallback;
}

function pickString(record: Record<string, unknown>, keys: string[]): string {
  for (const key of keys) {
    const value = safeString(record[key]).trim();
    if (value) {
      return value;
    }
  }

  return "";
}

export function normalizeStringArray(value: unknown): string[] {
  const parsed = maybeParseJson(value);

  if (Array.isArray(parsed)) {
    return parsed
      .flatMap((item) => splitListText(safeString(item)))
      .filter(Boolean);
  }

  if (typeof parsed === "string") {
    return splitListText(parsed);
  }

  return [];
}

export function normalizeLineTranslations(value: unknown): DisplayLineTranslation[] {
  const parsed = maybeParseJson(value);

  if (!Array.isArray(parsed)) {
    return [];
  }

  return parsed.flatMap((entry): DisplayLineTranslation[] => {
    if (typeof entry === "string") {
      const original = entry.trim();
      return original ? [{ original, english: "" }] : [];
    }

    if (!entry || typeof entry !== "object") {
      return [];
    }

    const record = entry as Record<string, unknown>;
    const original = pickString(record, [
      "original",
      "text",
      "sentence",
      "line",
      "target",
      "targetText",
      "source",
      "sourceText",
    ]);

    if (!original) {
      return [];
    }

    const english = pickString(record, [
      "english",
      "translation",
      "translated",
      "translatedText",
      "meaning",
    ]);
    const pinyin = pickString(record, ["pinyin", "romanization"]);

    return [
      {
        original,
        english,
        ...(pinyin ? { pinyin } : {}),
      },
    ];
  });
}

function normalizeForLineMatch(value: string): string {
  return value
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1")
    .replace(/~~(.+?)~~/g, "$1")
    .replace(/\s+/g, " ")
    .trim();
}

export function findMatchingLineTranslation(
  text: string,
  lineTranslations: DisplayLineTranslation[],
): DisplayLineTranslation | null {
  const cleanText = normalizeForLineMatch(text);
  if (!cleanText) return null;

  return (
    lineTranslations.find((translation) => {
      const cleanOriginal = normalizeForLineMatch(translation.original);
      return cleanOriginal === cleanText;
    }) || null
  );
}

export function buildLineTranslationsForDisplay(
  subtitleSegments: DisplaySubtitleSegment[],
  lineTranslations: unknown,
): DisplayLineTranslation[] {
  const safeLineTranslations = normalizeLineTranslations(lineTranslations);
  if (subtitleSegments.length === 0) {
    return safeLineTranslations;
  }

  return subtitleSegments
    .map((segment) => {
      const original = safeString(segment.text).trim();
      if (!original) return null;
      const match = findMatchingLineTranslation(original, safeLineTranslations);
      return {
        original,
        english: match?.english || "",
        ...(match?.pinyin ? { pinyin: match.pinyin } : {}),
      };
    })
    .filter((line): line is DisplayLineTranslation => line !== null);
}

export function normalizeVocabularyTranslations(
  value: unknown,
): Record<string, DisplayVocabularyData> {
  const parsed = maybeParseJson(value);
  const normalized: Record<string, DisplayVocabularyData> = {};

  const addEntry = (fallbackKey: string, rawValue: unknown) => {
    const fallbackWord = fallbackKey.trim();

    if (typeof rawValue === "string") {
      if (!fallbackWord) {
        return;
      }

      normalized[fallbackWord] = {
        word: fallbackWord,
        translation: rawValue,
        exampleSentences: [],
      };
      return;
    }

    if (!rawValue || typeof rawValue !== "object") {
      if (fallbackWord) {
        normalized[fallbackWord] = {
          word: fallbackWord,
          translation: "",
          exampleSentences: [],
        };
      }
      return;
    }

    const record = rawValue as Record<string, unknown>;
    const word = pickString(record, ["word", "original", "term"]) || fallbackWord;
    if (!word) {
      return;
    }

    const translation = pickString(record, [
      "translation",
      "english",
      "meaning",
      "translated",
      "definition",
    ]);
    const pinyin = pickString(record, ["pinyin", "romanization"]);
    const exampleSentences = normalizeStringArray(record.exampleSentences);

    normalized[word] = {
      word,
      translation,
      exampleSentences,
      ...(pinyin ? { pinyin } : {}),
    };
  };

  if (Array.isArray(parsed)) {
    parsed.forEach((entry) => {
      if (typeof entry === "string") {
        addEntry(entry, entry);
        return;
      }

      if (entry && typeof entry === "object") {
        const record = entry as Record<string, unknown>;
        addEntry(pickString(record, ["word", "original", "term"]), entry);
      }
    });
    return normalized;
  }

  if (!parsed || typeof parsed !== "object") {
    return normalized;
  }

  Object.entries(parsed as Record<string, unknown>).forEach(([key, rawValue]) => {
    addEntry(key, rawValue);
  });

  return normalized;
}
