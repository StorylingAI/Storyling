import { normalizeLearningLanguage } from "./languagePreferences";

const WORD_IMPORT_SEPARATOR = /[,;\n\r\uFF0C\u3001\uFF1B]+/;

export function parseWordImportText(value: string): string[] {
  return Array.from(
    new Set(
      value
        .split(WORD_IMPORT_SEPARATOR)
        .map(word => word.trim())
        .filter(Boolean)
    )
  );
}

export function normalizeWordbankTargetLanguage(language?: string | null): string {
  return normalizeLearningLanguage(language || "Spanish");
}
