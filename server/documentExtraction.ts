/**
 * Document Text Extraction Utility
 * 
 * Extracts text content from various document formats:
 * - PDF files
 * - Word documents (DOCX)
 * - Excel spreadsheets (XLSX)
 * - Plain text files (TXT / CSV)
 */

import { execFile } from "child_process";
import { promisify } from "util";
import { writeFile, unlink, readFile } from "fs/promises";
import { randomBytes } from "crypto";
import path from "path";
import os from "os";
import { inflateSync } from "zlib";

const execFileAsync = promisify(execFile);

async function runPythonScript(scriptPath: string, filePath: string): Promise<string> {
  const commands = ["python3", "python"];
  let lastError: unknown;

  for (const command of commands) {
    try {
      const { stdout } = await execFileAsync(command, [scriptPath, filePath]);
      return stdout.trim();
    } catch (error) {
      lastError = error;
    }
  }

  throw lastError instanceof Error ? lastError : new Error("Python is not available");
}

/**
 * Extract text from a PDF file using pdftotext (poppler-utils)
 */
async function extractTextFromPDF(filePath: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync("pdftotext", [filePath, "-"]);
    const text = stdout.trim();
    if (text) return text;
  } catch (error) {
    console.warn(
      "[extractTextFromPDF] pdftotext failed, using built-in fallback:",
      error instanceof Error ? error.message : String(error),
    );
  }

  const fallbackText = await extractTextFromPDFWithFallbackParser(filePath);
  if (fallbackText) return fallbackText;

  throw new Error("Failed to extract text from PDF");
}

function decodePdfString(value: string): string {
  let decoded = "";

  for (let i = 0; i < value.length; i++) {
    const char = value[i];
    if (char !== "\\") {
      decoded += char;
      continue;
    }

    const next = value[++i];
    if (!next) break;

    if (next === "n") decoded += "\n";
    else if (next === "r") decoded += "\r";
    else if (next === "t") decoded += "\t";
    else if (next === "b") decoded += "\b";
    else if (next === "f") decoded += "\f";
    else if (next === "(" || next === ")" || next === "\\") decoded += next;
    else if (/[0-7]/.test(next)) {
      let octal = next;
      for (let count = 0; count < 2 && /[0-7]/.test(value[i + 1] || ""); count++) {
        octal += value[++i];
      }
      decoded += String.fromCharCode(parseInt(octal, 8));
    } else {
      decoded += next;
    }
  }

  if (decoded.charCodeAt(0) === 0xfe && decoded.charCodeAt(1) === 0xff) {
    const bytes = Buffer.from(decoded, "latin1");
    let utf16 = "";
    for (let i = 2; i + 1 < bytes.length; i += 2) {
      utf16 += String.fromCharCode((bytes[i] << 8) | bytes[i + 1]);
    }
    return utf16;
  }

  return decoded;
}

function decodeUtf16BeHexString(hex: string): string {
  const cleaned = hex.replace(/\s+/g, "");
  if (!cleaned || cleaned.length % 4 !== 0) return "";

  const bytes = Buffer.from(cleaned, "hex");
  let start = 0;
  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    start = 2;
  }

  let utf16 = "";
  for (let i = start; i + 1 < bytes.length; i += 2) {
    utf16 += String.fromCharCode((bytes[i] << 8) | bytes[i + 1]);
  }
  return utf16;
}

function decodePdfHexStringRaw(hex: string): string {
  const cleaned = hex.replace(/\s+/g, "");
  if (!cleaned || cleaned.length % 2 !== 0) return "";

  const bytes = Buffer.from(cleaned, "hex");
  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    return decodeUtf16BeHexString(cleaned);
  }

  return bytes.toString("utf8");
}

function decodePdfHexString(hex: string, toUnicodeMap?: Map<string, string>): string {
  const cleaned = hex.replace(/\s+/g, "").toLowerCase();
  if (!cleaned || cleaned.length % 2 !== 0) return "";

  if (!toUnicodeMap || toUnicodeMap.size === 0) {
    return decodePdfHexStringRaw(cleaned);
  }

  const codeLengths = Array.from(new Set(Array.from(toUnicodeMap.keys()).map(key => key.length)))
    .sort((a, b) => b - a);
  const fallbackLength = codeLengths[codeLengths.length - 1] || 2;
  let decoded = "";
  let index = 0;

  while (index < cleaned.length) {
    let mapped = false;
    for (const length of codeLengths) {
      const code = cleaned.slice(index, index + length);
      const value = toUnicodeMap.get(code);
      if (value !== undefined) {
        decoded += value;
        index += length;
        mapped = true;
        break;
      }
    }

    if (!mapped) {
      const fallbackCode = cleaned.slice(index, index + fallbackLength);
      decoded += decodePdfHexStringRaw(fallbackCode);
      index += fallbackLength;
    }
  }

  return decoded;
}

function extractPdfLiteralStrings(source: string): string[] {
  const strings: string[] = [];

  for (let i = 0; i < source.length; i++) {
    if (source[i] !== "(") continue;

    let depth = 1;
    let escaped = false;
    let value = "";

    for (let j = i + 1; j < source.length; j++) {
      const char = source[j];

      if (escaped) {
        value += `\\${char}`;
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === "(") {
        depth++;
        value += char;
        continue;
      }

      if (char === ")") {
        depth--;
        if (depth === 0) {
          strings.push(decodePdfString(value));
          i = j;
          break;
        }
        value += char;
        continue;
      }

      value += char;
    }
  }

  return strings;
}

function extractPdfTextOperand(operand: string, toUnicodeMap?: Map<string, string>): string {
  if (operand.startsWith("[")) {
    const chunks: string[] = [];
    const itemPattern = /\((?:\\.|[^\\)])*\)|<[\da-fA-F\s]+>/g;
    let itemMatch: RegExpExecArray | null;

    while ((itemMatch = itemPattern.exec(operand)) !== null) {
      const item = itemMatch[0];
      if (item.startsWith("(")) {
        chunks.push(...extractPdfLiteralStrings(item));
      } else if (item.startsWith("<")) {
        chunks.push(decodePdfHexString(item.slice(1, -1), toUnicodeMap));
      }
    }

    return chunks.join("");
  }

  if (operand.startsWith("(")) {
    return extractPdfLiteralStrings(operand).join("");
  }

  if (operand.startsWith("<")) {
    return decodePdfHexString(operand.slice(1, -1), toUnicodeMap);
  }

  return "";
}

function extractTextFromPDFContentStream(
  stream: Buffer,
  fontToUnicodeMaps: Map<string, Map<string, string>>,
): string[] {
  const content = stream.toString("latin1");
  const chunks: string[] = [];
  const textOperators =
    /(\/([A-Za-z0-9_.-]+)\s+[-+]?\d*\.?\d+\s+Tf)|(\[(?:.|\n|\r)*?\]|\((?:\\.|[^\\)])*\)|<[\da-fA-F\s]+>)\s*(?:Tj|TJ|')/g;
  let match: RegExpExecArray | null;
  let currentFontMap: Map<string, string> | undefined;

  while ((match = textOperators.exec(content)) !== null) {
    const fontName = match[2];
    if (fontName) {
      currentFontMap = fontToUnicodeMaps.get(fontName);
      continue;
    }

    const operand = match[3];
    const text = operand ? extractPdfTextOperand(operand, currentFontMap) : "";
    if (text) chunks.push(text);
  }

  return chunks;
}

interface PdfStream {
  objectNumber?: number;
  dictionary: string;
  stream: Buffer;
}

function getPdfObjectNumberBefore(pdfSource: string, dictionaryStart: number): number | undefined {
  const prefix = pdfSource.slice(Math.max(0, dictionaryStart - 100), dictionaryStart);
  const match = prefix.match(/(\d+)\s+\d+\s+obj\s*$/);
  return match ? Number(match[1]) : undefined;
}

function inflatePdfStreamIfNeeded(stream: Buffer, dictionary: string): Buffer {
  if (!/\/FlateDecode\b/.test(dictionary)) return stream;

  try {
    return inflateSync(stream);
  } catch (error) {
    console.warn(
      "[extractTextFromPDF] Failed to inflate PDF stream:",
      error instanceof Error ? error.message : String(error),
    );
    return stream;
  }
}

function collectPdfStreams(pdfBuffer: Buffer, pdfSource: string): PdfStream[] {
  const streams: PdfStream[] = [];
  let cursor = 0;

  while (cursor < pdfSource.length) {
    const streamMarker = pdfSource.indexOf("stream", cursor);
    if (streamMarker === -1) break;

    let streamStart = streamMarker + "stream".length;
    if (pdfSource[streamStart] === "\r" && pdfSource[streamStart + 1] === "\n") {
      streamStart += 2;
    } else if (pdfSource[streamStart] === "\n" || pdfSource[streamStart] === "\r") {
      streamStart += 1;
    }

    const streamEnd = pdfSource.indexOf("endstream", streamStart);
    if (streamEnd === -1) break;

    const dictionaryStart = pdfSource.lastIndexOf("<<", streamMarker);
    const dictionaryEnd = pdfSource.lastIndexOf(">>", streamMarker);
    const dictionary =
      dictionaryStart !== -1 && dictionaryEnd !== -1 && dictionaryEnd > dictionaryStart
        ? pdfSource.slice(dictionaryStart, dictionaryEnd + 2)
        : "";

    streams.push({
      objectNumber: getPdfObjectNumberBefore(pdfSource, dictionaryStart),
      dictionary,
      stream: inflatePdfStreamIfNeeded(pdfBuffer.subarray(streamStart, streamEnd), dictionary),
    });

    cursor = streamEnd + "endstream".length;
  }

  return streams;
}

function collectPdfObjectDefinitions(pdfSource: string, streams: PdfStream[]): Map<number, string> {
  const objects = new Map<number, string>();
  const objectPattern = /(\d+)\s+\d+\s+obj\b([\s\S]*?)endobj/g;
  let match: RegExpExecArray | null;

  while ((match = objectPattern.exec(pdfSource)) !== null) {
    objects.set(Number(match[1]), match[2].trim());
  }

  for (const pdfStream of streams) {
    if (!/\/Type\s*\/ObjStm\b/.test(pdfStream.dictionary)) continue;

    const firstMatch = pdfStream.dictionary.match(/\/First\s+(\d+)/);
    const countMatch = pdfStream.dictionary.match(/\/N\s+(\d+)/);
    if (!firstMatch || !countMatch) continue;

    const first = Number(firstMatch[1]);
    const count = Number(countMatch[1]);
    const objectStream = pdfStream.stream.toString("latin1");
    const headerValues = objectStream.slice(0, first).trim().split(/\s+/).map(Number);
    const body = objectStream.slice(first);

    for (let index = 0; index < count; index++) {
      const objectNumber = headerValues[index * 2];
      const offset = headerValues[index * 2 + 1];
      const nextOffset = index + 1 < count ? headerValues[(index + 1) * 2 + 1] : body.length;

      if (!Number.isFinite(objectNumber) || !Number.isFinite(offset)) continue;
      objects.set(objectNumber, body.slice(offset, nextOffset).trim());
    }
  }

  return objects;
}

function parsePdfToUnicodeCMap(cmapSource: string): Map<string, string> {
  const toUnicodeMap = new Map<string, string>();
  const bfCharPattern = /beginbfchar([\s\S]*?)endbfchar/g;
  let bfCharMatch: RegExpExecArray | null;

  while ((bfCharMatch = bfCharPattern.exec(cmapSource)) !== null) {
    const pairPattern = /<([\da-fA-F\s]+)>\s*<([\da-fA-F\s]+)>/g;
    let pairMatch: RegExpExecArray | null;
    while ((pairMatch = pairPattern.exec(bfCharMatch[1])) !== null) {
      const source = pairMatch[1].replace(/\s+/g, "").toLowerCase();
      const target = decodeUtf16BeHexString(pairMatch[2]);
      if (source && target) toUnicodeMap.set(source, target);
    }
  }

  const bfRangePattern = /beginbfrange([\s\S]*?)endbfrange/g;
  let bfRangeMatch: RegExpExecArray | null;
  while ((bfRangeMatch = bfRangePattern.exec(cmapSource)) !== null) {
    const lines = bfRangeMatch[1].split(/\r?\n/);
    for (const line of lines) {
      const rangeWithArray = line.match(/<([\da-fA-F\s]+)>\s*<([\da-fA-F\s]+)>\s*\[([^\]]+)\]/);
      if (rangeWithArray) {
        const start = parseInt(rangeWithArray[1].replace(/\s+/g, ""), 16);
        const targets = Array.from(rangeWithArray[3].matchAll(/<([\da-fA-F\s]+)>/g));
        targets.forEach((targetMatch, offset) => {
          const source = (start + offset)
            .toString(16)
            .padStart(rangeWithArray[1].replace(/\s+/g, "").length, "0")
            .toLowerCase();
          const target = decodeUtf16BeHexString(targetMatch[1]);
          if (target) toUnicodeMap.set(source, target);
        });
        continue;
      }

      const range = line.match(/<([\da-fA-F\s]+)>\s*<([\da-fA-F\s]+)>\s*<([\da-fA-F\s]+)>/);
      if (!range) continue;

      const startHex = range[1].replace(/\s+/g, "");
      const endHex = range[2].replace(/\s+/g, "");
      const targetHex = range[3].replace(/\s+/g, "");
      const start = parseInt(startHex, 16);
      const end = parseInt(endHex, 16);
      const targetStart = parseInt(targetHex, 16);

      for (let sourceCode = start; sourceCode <= end; sourceCode++) {
        const source = sourceCode.toString(16).padStart(startHex.length, "0").toLowerCase();
        const target = decodeUtf16BeHexString((targetStart + sourceCode - start).toString(16).padStart(targetHex.length, "0"));
        if (target) toUnicodeMap.set(source, target);
      }
    }
  }

  return toUnicodeMap;
}

function buildPdfFontToUnicodeMaps(
  objects: Map<number, string>,
  streams: PdfStream[],
): Map<string, Map<string, string>> {
  const cmapByObjectNumber = new Map<number, Map<string, string>>();
  for (const pdfStream of streams) {
    if (pdfStream.objectNumber === undefined) continue;
    const streamText = pdfStream.stream.toString("latin1");
    if (!/begincmap\b/.test(streamText)) continue;

    const cmap = parsePdfToUnicodeCMap(streamText);
    if (cmap.size > 0) {
      cmapByObjectNumber.set(pdfStream.objectNumber, cmap);
    }
  }

  const fontObjectMaps = new Map<number, Map<string, string>>();
  for (const [objectNumber, objectSource] of Array.from(objects.entries())) {
    const toUnicodeMatch = objectSource.match(/\/ToUnicode\s+(\d+)\s+\d+\s+R/);
    if (!toUnicodeMatch) continue;

    const cmap = cmapByObjectNumber.get(Number(toUnicodeMatch[1]));
    if (cmap) {
      fontObjectMaps.set(objectNumber, cmap);
    }
  }

  const fontToUnicodeMaps = new Map<string, Map<string, string>>();
  for (const objectSource of Array.from(objects.values())) {
    const resourcePattern = /\/([A-Za-z0-9_.-]+)\s+(\d+)\s+\d+\s+R/g;
    let resourceMatch: RegExpExecArray | null;
    while ((resourceMatch = resourcePattern.exec(objectSource)) !== null) {
      const cmap = fontObjectMaps.get(Number(resourceMatch[2]));
      if (cmap) {
        fontToUnicodeMaps.set(resourceMatch[1], cmap);
      }
    }
  }

  return fontToUnicodeMaps;
}

async function extractTextFromPDFWithFallbackParser(filePath: string): Promise<string> {
  const pdfBuffer = await readFile(filePath);
  const pdfSource = pdfBuffer.toString("latin1");
  const streams = collectPdfStreams(pdfBuffer, pdfSource);
  const objects = collectPdfObjectDefinitions(pdfSource, streams);
  const fontToUnicodeMaps = buildPdfFontToUnicodeMaps(objects, streams);
  const chunks: string[] = [];

  for (const pdfStream of streams) {
    if (/\/Type\s*\/ObjStm\b/.test(pdfStream.dictionary)) continue;
    if (/\/Subtype\s*\/OpenType\b/.test(pdfStream.dictionary)) continue;

    chunks.push(...extractTextFromPDFContentStream(pdfStream.stream, fontToUnicodeMaps));
  }

  return chunks
    .map(chunk => chunk.replace(/\s+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .trim();
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
      return await runPythonScript(scriptPath, filePath);
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
      return await runPythonScript(scriptPath, filePath);
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
  toString?: () => string;
}

function createVocabularyWord(data: VocabularyWord): VocabularyWord {
  return {
    ...data,
    toString() {
      return data.word;
    },
  };
}

const COMMON_WORDS = new Set([
  "the", "and", "for", "that", "with", "this", "from", "are", "was", "were",
  "have", "has", "had", "you", "your", "they", "their", "them", "she", "her",
  "his", "him", "but", "not", "all", "can", "will", "would", "there", "then",
  "than", "into", "about", "after", "before", "because", "como", "para", "por",
  "que", "con", "una", "uno", "les", "des", "dans", "pour", "est", "sont",
]);

function extractHeuristicVocabularyFromText(
  text: string,
  targetLanguage: string,
  maxWords: number,
): VocabularyWord[] {
  const normalizedLanguage = targetLanguage.toLowerCase();
  const patterns: RegExp[] = [];

  if (normalizedLanguage.includes("chinese") || normalizedLanguage.includes("mandarin")) {
    patterns.push(/[\u4e00-\u9fff]{1,4}/g);
  } else if (normalizedLanguage.includes("japanese")) {
    patterns.push(/[\u3040-\u30ff\u4e00-\u9fff]{1,8}/g);
  } else if (normalizedLanguage.includes("korean")) {
    patterns.push(/[\uac00-\ud7af]{1,8}/g);
  } else if (normalizedLanguage.includes("arabic")) {
    patterns.push(/[\u0600-\u06ff]{2,}/g);
  } else if (normalizedLanguage.includes("hebrew")) {
    patterns.push(/[\u0590-\u05ff]{2,}/g);
  } else if (normalizedLanguage.includes("russian")) {
    patterns.push(/[\u0400-\u04ff]{3,}/g);
  }

  patterns.push(/[A-Za-zÀ-ÖØ-öø-ÿĀ-ž]+(?:['-][A-Za-zÀ-ÖØ-öø-ÿĀ-ž]+)*/g);

  const counts = new Map<string, { word: string; count: number; firstIndex: number }>();
  for (const pattern of patterns) {
    pattern.lastIndex = 0;
    let match: RegExpExecArray | null;
    while ((match = pattern.exec(text)) !== null) {
      const word = match[0].trim();
      const key = word.toLocaleLowerCase();
      if (!word || /^\d+$/.test(word)) continue;
      if (/^[A-Za-zÀ-ÖØ-öø-ÿĀ-ž]/.test(word) && word.length < 3) continue;
      if (COMMON_WORDS.has(key)) continue;

      const existing = counts.get(key);
      if (existing) {
        existing.count += 1;
      } else {
        counts.set(key, {
          word,
          count: 1,
          firstIndex: match.index ?? Number.MAX_SAFE_INTEGER,
        });
      }
    }
  }

  return Array.from(counts.values())
    .sort((a, b) => b.count - a.count || a.firstIndex - b.firstIndex)
    .slice(0, maxWords)
    .map(({ word }) => createVocabularyWord({ word, translation: "" }));
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
  
  try {
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
    const enrichedWords: VocabularyWord[] = (result.words || [])
      .slice(0, maxWords)
      .map((item: any) => {
        const levelInfo = getWordLevel(item.word, targetLanguage);
        return createVocabularyWord({
          word: item.word,
          translation: item.translation,
          level: levelInfo?.level,
          frequency: levelInfo?.frequency,
        });
      });
    
    if (enrichedWords.length > 0) {
      return enrichedWords;
    }
  } catch (error) {
    console.warn(
      "[extractVocabularyFromText] LLM extraction failed, using heuristic fallback:",
      error instanceof Error ? error.message : String(error),
    );
  }

  return extractHeuristicVocabularyFromText(text, targetLanguage, maxWords);
}
