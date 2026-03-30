/**
 * Document Text Extraction Utility
 * 
 * Extracts text content from various document formats:
 * - PDF files
 * - Word documents (DOCX)
 * - Plain text files (TXT)
 */

import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, unlink } from "fs/promises";
import { randomBytes } from "crypto";
import path from "path";

const execAsync = promisify(exec);

/**
 * Extract text from a PDF file using pdftotext (poppler-utils)
 */
async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    const { stdout } = await execAsync(`pdftotext "${filePath}" -`);
    return stdout.trim();
  } catch (error) {
    console.error("[extractTextFromPDF] Error:", error);
    throw new Error("Failed to extract text from PDF");
  }
}

/**
 * Extract text from a Word document using python-docx
 */
async function extractTextFromDOCX(filePath: string): Promise<string> {
  try {
    // Create a temporary Python script to extract text
    const pythonScript = `
import sys
from docx import Document

doc = Document(sys.argv[1])
text = []
for paragraph in doc.paragraphs:
    text.append(paragraph.text)
print('\\n'.join(text))
`;
    
    const scriptPath = `/tmp/extract_docx_${randomBytes(8).toString("hex")}.py`;
    await writeFile(scriptPath, pythonScript);
    
    try {
      const { stdout } = await execAsync(`python3 "${scriptPath}" "${filePath}"`);
      return stdout.trim();
    } finally {
      await unlink(scriptPath);
    }
  } catch (error) {
    console.error("[extractTextFromDOCX] Error:", error);
    throw new Error("Failed to extract text from DOCX");
  }
}

/**
 * Extract text from a plain text file
 */
async function extractTextFromTXT(filePath: string): Promise<string> {
  try {
    const { readFile } = await import("fs/promises");
    const content = await readFile(filePath, "utf-8");
    return content.trim();
  } catch (error) {
    console.error("[extractTextFromTXT] Error:", error);
    throw new Error("Failed to read text file");
  }
}

/**
 * Main function to extract text from any supported document format
 */
export async function extractTextFromDocument(
  filePath: string,
  mimeType: string
): Promise<string> {
  console.log("[extractTextFromDocument] Processing:", { filePath, mimeType });
  
  // Determine extraction method based on MIME type
  if (mimeType === "application/pdf") {
    return extractTextFromPDF(filePath);
  } else if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    return extractTextFromDOCX(filePath);
  } else if (mimeType === "text/plain") {
    return extractTextFromTXT(filePath);
  } else {
    throw new Error(`Unsupported document type: ${mimeType}`);
  }
}

/**
 * Extract vocabulary words from text using LLM
 */
interface VocabularyWord {
  word: string;
  level?: number;
  frequency?: string;
  translation?: string;
}

export async function extractVocabularyFromText(
  text: string,
  targetLanguage: string,
  maxWords: number = 50
): Promise<VocabularyWord[]> {
  const { invokeLLM } = await import("./_core/llm");
  
  console.log("[extractVocabularyFromText] Processing text:", {
    textLength: text.length,
    targetLanguage,
    maxWords,
  });
  
  const response = await invokeLLM({
    messages: [
      {
        role: "system",
        content: `You are a language learning assistant. Extract key vocabulary words from the provided text that would be useful for language learners. Focus on:
- Content words (nouns, verbs, adjectives, adverbs)
- Words that appear multiple times or are central to the text
- Words that are appropriate for the target language level
- Exclude common function words (the, a, is, etc.)
- Return unique words only (no duplicates)`,
      },
      {
        role: "user",
        content: `Extract up to ${maxWords} key vocabulary words from this ${targetLanguage} text:\n\n${text.substring(0, 5000)}`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "vocabulary_extraction",
        strict: true,
        schema: {
          type: "object",
          properties: {
            words: {
              type: "array",
              description: "List of extracted vocabulary words with metadata",
              items: {
                type: "object",
                properties: {
                  word: { type: "string", description: "The vocabulary word" },
                  translation: { type: "string", description: "English translation of the word" },
                },
                required: ["word", "translation"],
                additionalProperties: false,
              },
            },
          },
          required: ["words"],
          additionalProperties: false,
        },
      },
    },
  });
  
  const content = response.choices[0].message.content;
  if (!content) {
    throw new Error("No content returned from LLM");
  }
  
  const result = JSON.parse(typeof content === "string" ? content : "{}");
  console.log("[extractVocabularyFromText] Extracted words:", result.words);
  
  // Enrich words with level and frequency data from vocabulary database
  const { getWordLevel } = await import("./vocabularyDatabase");
  const enrichedWords: VocabularyWord[] = (result.words || []).map((item: any) => {
    const levelInfo = getWordLevel(item.word, targetLanguage);
    return {
      word: item.word,
      translation: item.translation,
      level: levelInfo?.level,
      frequency: levelInfo?.frequency,
    };
  });
  
  return enrichedWords;
}
