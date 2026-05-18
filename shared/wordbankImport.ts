import { normalizeLearningLanguage } from "./languagePreferences";

const WORD_IMPORT_SEPARATOR = /[,;\n\r\uFF0C\u3001\uFF1B]+/;
export const WORDBANK_IMPORT_BATCH_SIZE = 100;

export type WordImportSource = "text" | "csv";

export interface ParseWordImportOptions {
  targetLanguage?: string | null;
  source?: WordImportSource;
}

const CSV_DELIMITERS = [",", ";", "\t"];
const SPANISH_LANGUAGE_PATTERN = /\bspanish\b|\bespa(?:n|ñ)ol\b/i;
const CSV_WORD_HEADER_PATTERN =
  /\b(word|words|vocabulary|vocab|term|terms|target|study|spanish|espa(?:n|ñ)ol|français|french|german|italian|portuguese|chinese|japanese|korean)\b/i;
const STRUCTURAL_LABELS = new Set([
  "word",
  "words",
  "vocabulary",
  "vocab",
  "term",
  "terms",
  "translation",
  "translations",
  "english",
  "target language",
  "source language",
  "spanish",
  "espanol",
  "español",
]);
const ENGLISH_NOTE_PATTERN =
  /\b(vowel change|stem change|grammar|translation|english|pronunciation|conjugation|irregular|regular verb|reflexive verb)\b/i;
const ENGLISH_SPANISH_TRANSLATION_PATTERN =
  /^(?:to\s+(?:be\s+able\s+to|[a-z]+(?:\s+[a-z]+){0,4})|return|remember|change|vowel|able)$/i;

function cleanImportToken(value: string): string {
  return value
    .replace(/^\s*(?:[-*\u2022]+|\d+[.)])\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function countOccurrences(value: string, needle: string): number {
  return value.split(needle).length - 1;
}

function detectCsvDelimiter(line: string): string {
  return CSV_DELIMITERS
    .map(delimiter => ({ delimiter, count: countOccurrences(line, delimiter) }))
    .sort((a, b) => b.count - a.count)[0]?.delimiter || ",";
}

function parseDelimitedRow(row: string, delimiter: string): string[] {
  const cells: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let index = 0; index < row.length; index++) {
    const char = row[index];
    const next = row[index + 1];

    if (char === '"') {
      if (inQuotes && next === '"') {
        current += '"';
        index += 1;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }

    if (char === delimiter && !inQuotes) {
      cells.push(current.trim());
      current = "";
      continue;
    }

    current += char;
  }

  cells.push(current.trim());
  return cells;
}

function parseCsvCandidates(value: string, options: ParseWordImportOptions): string[] {
  const lines = value
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(Boolean);

  if (lines.length === 0) return [];

  const delimiter = detectCsvDelimiter(lines[0]);
  const rows = lines.map(line => parseDelimitedRow(line, delimiter));
  const header = rows[0] || [];
  const normalizedLanguage = normalizeWordbankTargetLanguage(options.targetLanguage);
  const headerIndex = findTargetCsvColumn(header, normalizedLanguage);
  const hasHeader = header.some(cell => CSV_WORD_HEADER_PATTERN.test(cell));
  const dataRows = hasHeader ? rows.slice(1) : rows;
  const targetColumnIndex = headerIndex ?? 0;

  return dataRows.flatMap(row => {
    const cell = row[targetColumnIndex] || row[0] || "";
    return cell.split(WORD_IMPORT_SEPARATOR);
  });
}

function findTargetCsvColumn(header: string[], targetLanguage: string): number | null {
  const normalizedTarget = targetLanguage.toLocaleLowerCase();
  const languageBase = normalizedTarget.split("(")[0]?.trim();

  const exactLanguageIndex = header.findIndex(cell => {
    const normalizedCell = normalizeWordbankTargetLanguage(cell).toLocaleLowerCase();
    const rawCell = cell.toLocaleLowerCase().trim();
    return (
      normalizedCell === normalizedTarget ||
      rawCell === languageBase ||
      (SPANISH_LANGUAGE_PATTERN.test(rawCell) && SPANISH_LANGUAGE_PATTERN.test(normalizedTarget))
    );
  });

  if (exactLanguageIndex !== -1) return exactLanguageIndex;

  const wordIndex = header.findIndex(cell =>
    /\b(vocabulary|vocab|word|term|target|study)\b/i.test(cell)
  );

  return wordIndex !== -1 ? wordIndex : null;
}

export function shouldSkipWordImportCandidate(
  value: string,
  targetLanguage?: string | null,
): boolean {
  const token = cleanImportToken(value);
  if (!token) return true;

  const lowered = token.toLocaleLowerCase();
  const normalizedLabel = lowered.normalize("NFKD").replace(/[\u0300-\u036f]/g, "");
  if (STRUCTURAL_LABELS.has(lowered) || STRUCTURAL_LABELS.has(normalizedLabel)) {
    return true;
  }

  if (!targetLanguage) return false;

  const normalizedTargetLanguage = normalizeWordbankTargetLanguage(targetLanguage);
  if (SPANISH_LANGUAGE_PATTERN.test(normalizedTargetLanguage)) {
    if (ENGLISH_NOTE_PATTERN.test(token) || /[<>]/.test(token)) {
      return true;
    }

    if (ENGLISH_SPANISH_TRANSLATION_PATTERN.test(token)) {
      return true;
    }
  }

  return false;
}

function splitInlineExplanation(value: string, options: ParseWordImportOptions): string[] {
  const parts = value.split(/\s+[-–—:]\s+/);
  if (parts.length < 2) return [value];

  const [first, ...rest] = parts;
  const explanation = rest.join(" ");
  if (shouldSkipWordImportCandidate(explanation, options.targetLanguage)) {
    return [first];
  }

  return [value];
}

export function parseWordImportText(
  value: string,
  options: ParseWordImportOptions = {},
): string[] {
  const rawTokens =
    options.source === "csv"
      ? parseCsvCandidates(value, options)
      : value.split(WORD_IMPORT_SEPARATOR);

  return Array.from(
    new Set(
      rawTokens
        .flatMap(word => splitInlineExplanation(word, options))
        .map(cleanImportToken)
        .filter(word => !shouldSkipWordImportCandidate(word, options.targetLanguage))
        .filter(Boolean)
    )
  );
}

export function createWordbankImportBatches(
  words: string[],
  batchSize = WORDBANK_IMPORT_BATCH_SIZE,
): string[][] {
  const safeBatchSize = Math.max(1, Math.floor(batchSize));
  const cleanedWords = parseWordImportText(words.join("\n"));
  const batches: string[][] = [];

  for (let index = 0; index < cleanedWords.length; index += safeBatchSize) {
    batches.push(cleanedWords.slice(index, index + safeBatchSize));
  }

  return batches;
}

export function normalizeWordbankTargetLanguage(language?: string | null): string {
  return normalizeLearningLanguage(language || "Spanish");
}
