/**
 * CSV Parser for batch content generation
 * Expected CSV format:
 * vocabulary_words,target_language,proficiency_level,theme,format,voice_type,cinematic_style,topic_prompt
 * "hello,world,friend",Spanish,A2,Comedy,podcast,Warm & Friendly,,Learn basic greetings
 */

export interface BatchItem {
  vocabularyWords: string[]; // Array of vocabulary words
  targetLanguage: string;
  proficiencyLevel: string; // A1, A2, B1, B2, C1, C2
  theme: string; // Comedy, Romance, Adventure, etc.
  format: "podcast" | "film";
  voiceType?: string; // For podcast mode
  cinematicStyle?: string; // For film mode
  topicPrompt?: string; // Optional topic prompt
}

/**
 * Parse CSV content into batch items
 */
export function parseCSV(csvContent: string): BatchItem[] {
  const lines = csvContent.trim().split("\n");
  
  if (lines.length < 2) {
    throw new Error("CSV must contain at least a header row and one data row");
  }

  // Parse header
  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  
  // Validate required columns
  const requiredColumns = ["vocabulary_words", "target_language", "proficiency_level", "theme", "format"];
  for (const col of requiredColumns) {
    if (!header.includes(col)) {
      throw new Error(`Missing required column: ${col}`);
    }
  }

  // Parse data rows
  const items: BatchItem[] = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    const values = parseCSVLine(line);
    
    if (values.length !== header.length) {
      throw new Error(`Row ${i + 1}: Column count mismatch. Expected ${header.length}, got ${values.length}`);
    }

    const row: Record<string, string> = {};
    header.forEach((col, idx) => {
      row[col] = values[idx];
    });

    // Validate and parse row
    const vocabularyWords = row.vocabulary_words
      .split(/[,;]/)
      .map((w) => w.trim())
      .filter((w) => w.length > 0);

    if (vocabularyWords.length === 0) {
      throw new Error(`Row ${i + 1}: vocabulary_words cannot be empty`);
    }

    const format = row.format?.toLowerCase();
    if (format !== "podcast" && format !== "film") {
      throw new Error(`Row ${i + 1}: format must be either 'podcast' or 'film', got '${row.format}'`);
    }

    const proficiencyLevel = row.proficiency_level?.toUpperCase();
    if (!["A1", "A2", "B1", "B2", "C1", "C2"].includes(proficiencyLevel)) {
      throw new Error(`Row ${i + 1}: proficiency_level must be A1, A2, B1, B2, C1, or C2, got '${row.proficiency_level}'`);
    }

    items.push({
      vocabularyWords,
      targetLanguage: row.target_language || "Spanish",
      proficiencyLevel,
      theme: row.theme || "Adventure",
      format: format as "podcast" | "film",
      voiceType: row.voice_type || undefined,
      cinematicStyle: row.cinematic_style || undefined,
      topicPrompt: row.topic_prompt || undefined,
    });
  }

  return items;
}

/**
 * Parse a single CSV line, handling quoted values
 */
function parseCSVLine(line: string): string[] {
  const values: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === "," && !inQuotes) {
      values.push(current.trim());
      current = "";
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
}

/**
 * Generate a CSV template for download
 */
export function generateCSVTemplate(): string {
  const header = "vocabulary_words,target_language,proficiency_level,theme,format,voice_type,cinematic_style,topic_prompt";
  const example1 = '"hello,world,friend",Spanish,A2,Comedy,podcast,Warm & Friendly,,Learn basic greetings';
  const example2 = '"mountain,river,forest",French,B1,Adventure,film,,Cinematic & Epic,Nature vocabulary';
  
  return `${header}\n${example1}\n${example2}`;
}
