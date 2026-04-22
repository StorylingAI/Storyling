/**
 * Document Text Extraction Utility
 * 
 * Extracts text content from various document formats:
 * - PDF files
 * - Word documents (DOCX)
 * - Excel spreadsheets (XLSX)
 * - Plain text files (TXT / CSV)
 */

import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, unlink } from "fs/promises";
import { randomBytes } from "crypto";
import path from "path";
import os from "os";

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
 * Extract text from a Word document using Python's standard library.
 */
async function extractTextFromDOCX(filePath: string): Promise<string> {
  try {
    // Create a temporary Python script to extract text
    const pythonScript = `
import sys
import zipfile
import xml.etree.ElementTree as ET

WORD_NS = "http://schemas.openxmlformats.org/wordprocessingml/2006/main"

def qname(name):
    return "{%s}%s" % (WORD_NS, name)

def collect_text(parent):
    parts = []
    for node in parent.iter():
        if node.tag == qname("t"):
            parts.append(node.text or "")
        elif node.tag == qname("tab"):
            parts.append("\\t")
        elif node.tag == qname("br"):
            parts.append("\\n")
    return "".join(parts).strip()

lines = []
with zipfile.ZipFile(sys.argv[1]) as docx:
    if "word/document.xml" not in docx.namelist():
        raise ValueError("Missing word/document.xml")

    root = ET.fromstring(docx.read("word/document.xml"))
    body = root.find(qname("body"))
    if body is not None:
        for child in list(body):
            if child.tag == qname("p"):
                text = collect_text(child)
                if text:
                    lines.append(text)
            elif child.tag == qname("tbl"):
                for row in child.findall(".//" + qname("tr")):
                    cells = []
                    for cell in row.findall(qname("tc")):
                        cell_text = " ".join(
                            filter(None, (collect_text(paragraph) for paragraph in cell.findall(".//" + qname("p"))))
                        )
                        if cell_text:
                            cells.append(cell_text)
                    if cells:
                        lines.append(", ".join(cells))

print("\\n".join(lines))
`;
    
    const scriptPath = path.join(os.tmpdir(), `extract_docx_${randomBytes(8).toString("hex")}.py`);
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
 * Extract text from an Excel spreadsheet using Python's standard library.
 */
async function extractTextFromXLSX(filePath: string): Promise<string> {
  try {
    const pythonScript = `
import sys
import zipfile
import xml.etree.ElementTree as ET

MAIN_NS = "http://schemas.openxmlformats.org/spreadsheetml/2006/main"
REL_NS = "http://schemas.openxmlformats.org/package/2006/relationships"
DOC_REL_NS = "http://schemas.openxmlformats.org/officeDocument/2006/relationships"

def qname(namespace, name):
    return f"{{{namespace}}}{name}"

shared_strings = []
sheet_rows = []

with zipfile.ZipFile(sys.argv[1]) as workbook:
    if "xl/sharedStrings.xml" in workbook.namelist():
        root = ET.fromstring(workbook.read("xl/sharedStrings.xml"))
        for item in root.findall(qname(MAIN_NS, "si")):
            texts = [node.text or "" for node in item.iter(qname(MAIN_NS, "t"))]
            shared_strings.append("".join(texts))

    workbook_xml = ET.fromstring(workbook.read("xl/workbook.xml"))
    relationships_xml = ET.fromstring(workbook.read("xl/_rels/workbook.xml.rels"))
    relationships = {
        rel.attrib.get("Id"): rel.attrib.get("Target", "")
        for rel in relationships_xml.findall(qname(REL_NS, "Relationship"))
    }

    sheets = workbook_xml.find(qname(MAIN_NS, "sheets"))
    if sheets is not None:
        for sheet in sheets.findall(qname(MAIN_NS, "sheet")):
            relation_id = sheet.attrib.get(qname(DOC_REL_NS, "id"))
            target = relationships.get(relation_id)
            if not target:
                continue

            normalized_target = target.lstrip("/")
            if normalized_target.startswith("../"):
                normalized_target = normalized_target[3:]
            if not normalized_target.startswith("xl/"):
                normalized_target = f"xl/{normalized_target}"

            if normalized_target not in workbook.namelist():
                continue

            sheet_xml = ET.fromstring(workbook.read(normalized_target))
            for row in sheet_xml.findall(f".//{qname(MAIN_NS, 'row')}"):
                values = []
                for cell in row.findall(qname(MAIN_NS, "c")):
                    cell_type = cell.attrib.get("t")
                    value = ""

                    if cell_type == "inlineStr":
                        inline_str = cell.find(qname(MAIN_NS, "is"))
                        if inline_str is not None:
                            texts = [node.text or "" for node in inline_str.iter(qname(MAIN_NS, "t"))]
                            value = "".join(texts)
                    else:
                        value_node = cell.find(qname(MAIN_NS, "v"))
                        if value_node is not None and value_node.text is not None:
                            if cell_type == "s":
                                try:
                                    index = int(value_node.text)
                                    value = shared_strings[index] if 0 <= index < len(shared_strings) else ""
                                except ValueError:
                                    value = value_node.text
                            else:
                                value = value_node.text

                    value = value.strip()
                    if value:
                        values.append(value)

                if values:
                    sheet_rows.append(", ".join(values))

print("\\n".join(sheet_rows))
`;

    const scriptPath = path.join(os.tmpdir(), `extract_xlsx_${randomBytes(8).toString("hex")}.py`);
    await writeFile(scriptPath, pythonScript);

    try {
      const { stdout } = await execAsync(`python3 "${scriptPath}" "${filePath}"`);
      return stdout.trim();
    } finally {
      await unlink(scriptPath);
    }
  } catch (error) {
    console.error("[extractTextFromXLSX] Error:", error);
    throw new Error("Failed to extract text from XLSX");
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
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return extractTextFromDOCX(filePath);
  } else if (mimeType === "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet") {
    return extractTextFromXLSX(filePath);
  } else if (mimeType === "text/plain" || mimeType === "text/csv") {
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
