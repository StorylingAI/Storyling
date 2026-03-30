import { router, protectedProcedure } from './_core/trpc';
import { z } from 'zod';
import { getDb } from './db';
import { eq } from 'drizzle-orm';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export const readingAssistantRouter = router({
  // Analyze text and extract vocabulary/grammar
  analyzeText: protectedProcedure
    .input(
      z.object({
        text: z.string().min(1).max(10000),
        targetLanguage: z.enum(['Chinese', 'French', 'Spanish', 'German']),
        userLevel: z.enum(['beginner', 'intermediate', 'advanced']).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');

      // Call OpenAI to analyze the text
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a language learning assistant analyzing ${input.targetLanguage} text. Extract key vocabulary, identify grammar patterns, and assess difficulty level. Provide explanations suitable for a ${input.userLevel || 'intermediate'} learner.`,
          },
          {
            role: 'user',
            content: `Analyze this ${input.targetLanguage} text and provide:
1. Difficulty level (beginner/intermediate/advanced)
2. Key vocabulary words (max 20) with translations
3. Important grammar patterns
4. Brief summary in English

Text: ${input.text}

Return as JSON with this structure:
{
  "difficultyLevel": "intermediate",
  "vocabulary": [{"word": "...", "translation": "...", "pinyin": "..." (for Chinese only)}],
  "grammarPatterns": ["pattern 1", "pattern 2"],
  "summary": "Brief summary..."
}`,
          },
        ],
        response_format: { type: 'json_object' },
      });

      const analysis = JSON.parse(completion.choices[0]?.message?.content || '{}');

      return {
        ...analysis,
        originalText: input.text,
        targetLanguage: input.targetLanguage,
      };
    }),

  // Get detailed explanation for a specific word/phrase
  explainWord: protectedProcedure
    .input(
      z.object({
        word: z.string().min(1).max(100),
        context: z.string().max(500).optional(),
        targetLanguage: z.enum(['Chinese', 'French', 'Spanish', 'German']),
      })
    )
    .mutation(async ({ input }) => {
      const completion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a ${input.targetLanguage} language tutor. Provide clear, concise explanations for vocabulary and grammar.`,
          },
          {
            role: 'user',
            content: `Explain the ${input.targetLanguage} word/phrase: "${input.word}"${
              input.context ? `\n\nContext: ${input.context}` : ''
            }

Provide:
1. Translation to English
2. ${input.targetLanguage === 'Chinese' ? 'Pinyin pronunciation\n3. ' : ''}Grammar notes (part of speech, usage)
3. 2 example sentences with translations
4. Cultural notes (if relevant)

Return as JSON with this structure:
{
  "word": "${input.word}",
  "translation": "...",
  ${input.targetLanguage === 'Chinese' ? '"pinyin": "...",' : ''}
  "partOfSpeech": "noun/verb/etc",
  "grammarNotes": "...",
  "examples": [
    {"sentence": "...", "translation": "..."},
    {"sentence": "...", "translation": "..."}
  ],
  "culturalNotes": "..." (optional)
}`,
          },
        ],
        response_format: { type: 'json_object' },
      });

      const explanation = JSON.parse(completion.choices[0]?.message?.content || '{}');
      return explanation;
    }),

  // Generate a story from the reading material
  generateStoryFromText: protectedProcedure
    .input(
      z.object({
        sourceText: z.string().min(1).max(5000),
        targetLanguage: z.enum(['Chinese', 'French', 'Spanish', 'German']),
        vocabularyFocus: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');

      // Extract key vocabulary if not provided
      let vocabList = input.vocabularyFocus || [];
      
      if (vocabList.length === 0) {
        const analysisCompletion = await openai.chat.completions.create({
          model: 'gpt-4o-mini',
          messages: [
            {
              role: 'system',
              content: `Extract 10-15 key vocabulary words from this ${input.targetLanguage} text.`,
            },
            {
              role: 'user',
              content: input.sourceText,
            },
          ],
        });

        const vocabText = analysisCompletion.choices[0]?.message?.content || '';
        vocabList = vocabText.split(/[,\n]/).map(w => w.trim()).filter(Boolean).slice(0, 15);
      }

      // Generate story using the vocabulary
      const storyCompletion = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are a creative language learning content creator. Create an engaging short story in ${input.targetLanguage} that naturally incorporates the given vocabulary words.`,
          },
          {
            role: 'user',
            content: `Create a short story (200-300 words) in ${input.targetLanguage} that uses these vocabulary words naturally: ${vocabList.join(', ')}

The story should be:
- Engaging and memorable
- Appropriate for language learners
- Use natural, conversational language
- Include the vocabulary in meaningful contexts

Return as JSON:
{
  "title": "Story title in ${input.targetLanguage}",
  "story": "The full story text...",
  "vocabularyUsed": ["word1", "word2", ...]
}`,
          },
        ],
        response_format: { type: 'json_object' },
      });

      const storyData = JSON.parse(storyCompletion.choices[0]?.message?.content || '{}');

      return {
        ...storyData,
        sourceVocabulary: vocabList,
        targetLanguage: input.targetLanguage,
      };
    }),

  // Save reading session
  saveReadingSession: protectedProcedure
    .input(
      z.object({
        text: z.string(),
        targetLanguage: z.string(),
        wordsLearned: z.number(),
        timeSpent: z.number(), // in seconds
        difficultyLevel: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');

      // TODO: Create reading_sessions table in schema
      // For now, just return success
      return {
        success: true,
        session: {
          userId: ctx.user.id,
          ...input,
          createdAt: new Date(),
        },
      };
    }),
});
