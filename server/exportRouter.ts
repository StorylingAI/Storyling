import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import {
  generateWordbankCSV,
  generateWatchHistoryCSV,
  generateWatchHistoryJSON,
  generateProgressReportData,
} from "./exportUtils";
import { saveWordToWordbank } from "./wordbankDb";

export const exportRouter = router({
  /**
   * Export wordbank to CSV
   */
  exportWordbank: protectedProcedure
    .input(
      z.object({
        targetLanguage: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const csv = await generateWordbankCSV(ctx.user.id, input.targetLanguage);
      return { csv, filename: `wordbank_${input.targetLanguage || "all"}_${Date.now()}.csv` };
    }),

  /**
   * Export watch history to CSV
   */
  exportWatchHistoryCSV: protectedProcedure.mutation(async ({ ctx }) => {
    const csv = await generateWatchHistoryCSV(ctx.user.id);
    return { csv, filename: `watch_history_${Date.now()}.csv` };
  }),

  /**
   * Export watch history to JSON
   */
  exportWatchHistoryJSON: protectedProcedure.mutation(async ({ ctx }) => {
    const json = await generateWatchHistoryJSON(ctx.user.id);
    return { json, filename: `watch_history_${Date.now()}.json` };
  }),

  /**
   * Generate progress report data
   */
  generateProgressReport: protectedProcedure.mutation(async ({ ctx }) => {
    const reportData = await generateProgressReportData(ctx.user.id);
    return reportData;
  }),

  /**
   * Import words from CSV
   */
  importWordsFromCSV: protectedProcedure
    .input(
      z.object({
        csvContent: z.string(),
        targetLanguage: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { invokeLLM } = await import("./_core/llm");
      const lines = input.csvContent.split("\n").filter((line) => line.trim());
      
      // Skip header row if it exists
      const hasHeader = lines[0]?.toLowerCase().includes("word") || lines[0]?.toLowerCase().includes("translation");
      const dataLines = hasHeader ? lines.slice(1) : lines;

      const results = {
        total: dataLines.length,
        success: 0,
        failed: 0,
        skipped: 0,
        errors: [] as string[],
      };

      for (const line of dataLines) {
        try {
          // Parse CSV line (handle quoted fields)
          const fields = parseCSVLine(line);
          const word = fields[0]?.trim();
          
          if (!word) {
            results.skipped++;
            continue;
          }

          // Check if word already exists
          const { checkWordInWordbank } = await import("./wordbankDb");
          const exists = await checkWordInWordbank(ctx.user.id, word, input.targetLanguage);
          
          if (exists) {
            results.skipped++;
            continue;
          }

          // Generate translation and example sentences using LLM
          const prompt = `Translate the word "${word}" to English and provide 2 example sentences in ${input.targetLanguage}. 
          ${input.targetLanguage === "Chinese" ? "Include pinyin for Chinese characters." : ""}
          Return JSON format: { "translation": "...", "pinyin": "...", "exampleSentences": ["...", "..."] }`;

          const response = await invokeLLM({
            messages: [
              { role: "system", content: "You are a helpful language learning assistant." },
              { role: "user", content: prompt },
            ],
            response_format: {
              type: "json_schema",
              json_schema: {
                name: "word_translation",
                strict: true,
                schema: {
                  type: "object",
                  properties: {
                    translation: { type: "string" },
                    pinyin: { type: "string" },
                    exampleSentences: {
                      type: "array",
                      items: { type: "string" },
                    },
                  },
                  required: ["translation", "pinyin", "exampleSentences"],
                  additionalProperties: false,
                },
              },
            },
          });

          const content = response.choices[0]?.message?.content;
          if (!content || typeof content !== 'string') {
            results.failed++;
            results.errors.push(`Failed to generate translation for: ${word}`);
            continue;
          }

          const data = JSON.parse(content);

          // Save to wordbank
          await saveWordToWordbank({
            userId: ctx.user.id,
            word,
            translation: data.translation,
            targetLanguage: input.targetLanguage,
            pinyin: data.pinyin || null,
            exampleSentences: Array.isArray(data.exampleSentences) ? JSON.stringify(data.exampleSentences) : data.exampleSentences,
          });

          results.success++;
        } catch (error) {
          results.failed++;
          results.errors.push(`Error processing line: ${line.substring(0, 50)}...`);
        }
      }

      return results;
    }),
});

/**
 * Parse a CSV line handling quoted fields
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i++;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
      }
    } else if (char === "," && !inQuotes) {
      // Field separator
      fields.push(current);
      current = "";
    } else {
      current += char;
    }
  }

  // Add last field
  fields.push(current);

  return fields;
}
