export const SPAIN_SPANISH_LABEL = "Spanish (Spain / Castellano)";
export const LATAM_SPANISH_LABEL = "Spanish (Latin America)";

const LANGUAGE_CODE_TO_NAME: Record<string, string> = {
  en: "English",
  english: "English",
  zh: "Chinese (Mandarin)",
  chinese: "Chinese (Mandarin)",
  mandarin: "Chinese (Mandarin)",
  es: SPAIN_SPANISH_LABEL,
  "es-es": SPAIN_SPANISH_LABEL,
  "es-419": LATAM_SPANISH_LABEL,
  "es-us": LATAM_SPANISH_LABEL,
  spanish: SPAIN_SPANISH_LABEL,
  fr: "French",
  french: "French",
  de: "German",
  german: "German",
  ja: "Japanese",
  japanese: "Japanese",
  ko: "Korean",
  korean: "Korean",
  pt: "Portuguese",
  portuguese: "Portuguese",
  ru: "Russian",
  russian: "Russian",
  ar: "Arabic",
  arabic: "Arabic",
  it: "Italian",
  italian: "Italian",
  nl: "Dutch",
  dutch: "Dutch",
  he: "Hebrew",
  hebrew: "Hebrew",
  fa: "Persian (Farsi)",
  farsi: "Persian (Farsi)",
  persian: "Persian (Farsi)",
  tr: "Turkish",
  turkish: "Turkish",
  hi: "Hindi",
  hindi: "Hindi",
};

export function normalizeLearningLanguage(language?: string | null): string {
  const value = language?.trim();
  if (!value) return "English";

  const normalized = value.toLowerCase();
  if (normalized.includes("latin america") || normalized.includes("latam")) {
    return LATAM_SPANISH_LABEL;
  }
  if (
    normalized.includes("spain") ||
    normalized.includes("castellano") ||
    normalized.includes("castilian")
  ) {
    return SPAIN_SPANISH_LABEL;
  }

  return LANGUAGE_CODE_TO_NAME[normalized] ?? value;
}

export function isSpanishLanguage(language?: string | null): boolean {
  const normalized = normalizeLearningLanguage(language).toLowerCase();
  return normalized.includes("spanish");
}

export function isSpainSpanishLanguage(language?: string | null): boolean {
  if (!isSpanishLanguage(language)) return false;

  const normalized = (language || "").toLowerCase();
  if (normalized.includes("latin america") || normalized.includes("latam")) {
    return false;
  }
  return true;
}

export function getSpanishDialectInstruction(language?: string | null): string | null {
  if (!isSpanishLanguage(language)) return null;

  if (isSpainSpanishLanguage(language)) {
    return [
      "Use European Spanish from Spain (Castilian).",
      "Use vosotros/vosotras naturally when the informal plural is appropriate.",
      "Prefer Spain vocabulary and idioms, and avoid Latin American regionalisms.",
    ].join(" ");
  }

  return [
    "Use natural Latin American Spanish.",
    "Use ustedes for plural you and avoid Spain-specific vosotros conjugations.",
    "Prefer broadly understood Latin American vocabulary.",
  ].join(" ");
}
