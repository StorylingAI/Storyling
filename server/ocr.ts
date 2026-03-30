import { z } from 'zod';
import { router, protectedProcedure } from './_core/trpc';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const ocrRouter = router({
  // Extract vocabulary from an image using GPT-4 Vision
  extractVocabularyFromImage: protectedProcedure
    .input(
      z.object({
        imageBase64: z.string().describe('Base64 encoded image data'),
        targetLanguage: z.enum(['Chinese', 'French', 'Spanish', 'German']),
      })
    )
    .mutation(async ({ input }) => {
      const { imageBase64, targetLanguage } = input;

      // Use GPT-4 Vision to extract vocabulary from the image
      const response = await openai.chat.completions.create({
        model: 'gpt-4o',
        messages: [
          {
            role: 'system',
            content: `You are a language learning assistant. Extract vocabulary words from images of textbooks, handwritten notes, or vocabulary lists. 
            
            For ${targetLanguage}:
            - Extract all visible words/phrases in the target language
            - Ignore English translations or explanations (we'll generate those)
            - Preserve the original text exactly as written
            - If it's a vocab list with translations, only extract the ${targetLanguage} words
            - If it's a textbook page, extract key vocabulary (not full sentences)
            - Return one word/phrase per line
            - Remove any numbering, bullets, or formatting
            
            Return ONLY the extracted vocabulary, one per line, nothing else.`,
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Extract ${targetLanguage} vocabulary from this image:`,
              },
              {
                type: 'image_url',
                image_url: {
                  url: `data:image/jpeg;base64,${imageBase64}`,
                },
              },
            ],
          },
        ],
        max_tokens: 1000,
      });

      const extractedText = response.choices[0]?.message?.content || '';
      
      // Split by newlines and clean up
      const vocabularyList = extractedText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.match(/^[\d\.\-\*]+$/)); // Remove lines that are just numbers or bullets

      return {
        vocabulary: vocabularyList,
        rawText: extractedText,
        wordCount: vocabularyList.length,
      };
    }),

  // Extract text from document (PDF, DOCX, TXT)
  extractVocabularyFromDocument: protectedProcedure
    .input(
      z.object({
        documentText: z.string().describe('Extracted text from document'),
        targetLanguage: z.enum(['Chinese', 'French', 'Spanish', 'German']),
      })
    )
    .mutation(async ({ input }) => {
      const { documentText, targetLanguage } = input;

      // Use GPT-4 to extract vocabulary from document text
      const response = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a language learning assistant. Extract vocabulary words from document text.
            
            For ${targetLanguage}:
            - Extract all ${targetLanguage} words/phrases
            - Ignore English text
            - Extract key vocabulary (not full sentences unless they're useful phrases)
            - Return one word/phrase per line
            - Remove any numbering, bullets, or formatting
            
            Return ONLY the extracted vocabulary, one per line, nothing else.`,
          },
          {
            role: 'user',
            content: `Extract ${targetLanguage} vocabulary from this text:\n\n${documentText}`,
          },
        ],
        max_tokens: 1500,
      });

      const extractedText = response.choices[0]?.message?.content || '';
      
      const vocabularyList = extractedText
        .split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0 && !line.match(/^[\d\.\-\*]+$/));

      return {
        vocabulary: vocabularyList,
        rawText: extractedText,
        wordCount: vocabularyList.length,
      };
    }),
});
