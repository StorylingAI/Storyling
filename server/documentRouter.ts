import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { writeFile, unlink } from "fs/promises";
import { randomBytes } from "crypto";
import path from "path";
import { extractTextFromDocument, extractVocabularyFromText } from "./documentExtraction";

export const documentRouter = router({
  /**
   * Upload a document and extract vocabulary words
   * Supports PDF, DOCX, and TXT files
   */
  uploadAndExtractVocabulary: protectedProcedure
    .input(
      z.object({
        fileData: z.string(), // Base64 encoded file data
        fileName: z.string(),
        mimeType: z.string(),
        targetLanguage: z.string(),
        maxWords: z.number().min(10).max(200).default(50),
      })
    )
    .mutation(async ({ input, ctx }) => {
      console.log("[uploadAndExtractVocabulary] Starting:", {
        fileName: input.fileName,
        mimeType: input.mimeType,
        targetLanguage: input.targetLanguage,
        maxWords: input.maxWords,
      });

      // Validate file type
      const supportedTypes = [
        "application/pdf",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "application/msword",
        "text/plain",
      ];

      if (!supportedTypes.includes(input.mimeType)) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Unsupported file type. Please upload PDF, DOCX, or TXT files.",
        });
      }

      // Validate file size (max 10MB for base64 encoded data)
      const fileSizeBytes = (input.fileData.length * 3) / 4;
      const maxSizeBytes = 10 * 1024 * 1024; // 10MB
      if (fileSizeBytes > maxSizeBytes) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "File size exceeds 10MB limit",
        });
      }

      let tempFilePath: string | null = null;

      try {
        // Save uploaded file to temporary location
        const fileExtension = path.extname(input.fileName) || ".tmp";
        tempFilePath = `/tmp/upload_${randomBytes(8).toString("hex")}${fileExtension}`;
        
        // Decode base64 and write to file
        const fileBuffer = Buffer.from(input.fileData, "base64");
        await writeFile(tempFilePath, fileBuffer);

        console.log("[uploadAndExtractVocabulary] File saved to:", tempFilePath);

        // Extract text from document
        const extractedText = await extractTextFromDocument(tempFilePath, input.mimeType);
        
        if (!extractedText || extractedText.length < 10) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "Could not extract text from document. Please ensure the file contains readable text.",
          });
        }

        console.log("[uploadAndExtractVocabulary] Extracted text length:", extractedText.length);

        // Extract vocabulary words from text
        const vocabularyWords = await extractVocabularyFromText(
          extractedText,
          input.targetLanguage,
          input.maxWords
        );

        if (vocabularyWords.length === 0) {
          throw new TRPCError({
            code: "BAD_REQUEST",
            message: "No vocabulary words could be extracted from the document.",
          });
        }

        console.log("[uploadAndExtractVocabulary] Success:", {
          wordsExtracted: vocabularyWords.length,
        });

        return {
          success: true,
          vocabularyWords,
          extractedText: extractedText.substring(0, 500), // Return preview of text
          totalWords: vocabularyWords.length,
        };
      } catch (error) {
        console.error("[uploadAndExtractVocabulary] Error:", error);
        
        if (error instanceof TRPCError) {
          throw error;
        }
        
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to process document",
          cause: error,
        });
      } finally {
        // Clean up temporary file
        if (tempFilePath) {
          try {
            await unlink(tempFilePath);
            console.log("[uploadAndExtractVocabulary] Cleaned up temp file:", tempFilePath);
          } catch (cleanupError) {
            console.error("[uploadAndExtractVocabulary] Failed to clean up temp file:", cleanupError);
          }
        }
      }
    }),
});
