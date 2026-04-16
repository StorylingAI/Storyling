import { router, protectedProcedure } from './_core/trpc';
import { z } from 'zod';
import { getDb } from './db';
import { chatConversations, chatMessages } from '../drizzle/schema';
import { eq, and, desc } from 'drizzle-orm';
import OpenAI from 'openai';
import {
  getSpanishDialectInstruction,
  normalizeLearningLanguage,
} from '@shared/languagePreferences';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Booki's core persona
const BOOKI_PERSONA = `You are Booki, a friendly and enthusiastic story companion on Storyling.ai — an AI-powered language learning platform. Your personality:
- Warm, encouraging, and playful — like a knowledgeable friend who loves stories and languages
- You use light, natural language (not overly formal or robotic)
- You celebrate user progress and gently correct mistakes
- You love books, stories, and the magic of learning languages through narrative
- You occasionally use a book emoji 📖 or sparkle ✨ but don't overdo it
- Keep responses concise (2-4 sentences max) unless the user asks for a detailed explanation`;

// Build system prompt based on context
function buildSystemPrompt(context: {
  mode: string;
  language?: string;
  level?: string;
  storyTitle?: string;
  storyTranslation?: string;
  storyTheme?: string;
  currentSentence?: string;
  currentSentenceTranslation?: string;
  vocabularyWords?: string[];
  page?: string;
}): string {
  let prompt = BOOKI_PERSONA + '\n\n';
  const practiceLanguage = normalizeLearningLanguage(context.language);
  const dialectInstruction = getSpanishDialectInstruction(practiceLanguage);

  // Add page/context awareness
  if (context.storyTitle) {
    prompt += `CURRENT STORY CONTEXT:
- Story title: "${context.storyTitle}"${context.storyTranslation ? ` (${context.storyTranslation})` : ''}
- Theme: ${context.storyTheme || 'General'}
- Language: ${practiceLanguage || 'Unknown'}
- User's level: ${context.level || 'Intermediate'}
${context.currentSentence ? `- Current sentence: "${context.currentSentence}"` : ''}
${context.currentSentenceTranslation ? `- Translation: "${context.currentSentenceTranslation}"` : ''}
${context.vocabularyWords && context.vocabularyWords.length > 0 ? `- Key vocabulary in this story: ${context.vocabularyWords.slice(0, 10).join(', ')}` : ''}

You can help the user:
1. Understand vocabulary and grammar from the story
2. Practice speaking/writing in ${practiceLanguage || 'the target language'}
3. Answer questions about the story content
4. Explain cultural context related to the story
5. Quiz them on vocabulary they've learned

`;
  } else if (context.page === 'library') {
    prompt += `The user is browsing their story library. You can help them:
1. Find stories that match their interests or level
2. Suggest what to read/listen to next
3. Answer questions about how the library works
4. Explain difficulty levels (A1-C2 CEFR scale)

`;
  } else if (context.page === 'create') {
    prompt += `The user is creating a new story. You can help them:
1. Choose the right language and difficulty level
2. Suggest interesting themes or topics
3. Explain what the different story modes do (podcast vs. film)
4. Answer questions about the story creation process

`;
  } else if (context.page === 'wordbank') {
    prompt += `The user is in their Word Bank. You can help them:
1. Explain vocabulary words and their usage
2. Create example sentences with their saved words
3. Suggest memory techniques for difficult words
4. Quiz them on their saved vocabulary

`;
  }

  // Mode-specific instructions
  if (context.mode === 'languagePractice' && context.language) {
    prompt += `LANGUAGE PRACTICE MODE:
You are helping the user practice ${practiceLanguage} at ${context.level || 'intermediate'} level.
- Engage in natural conversation in ${practiceLanguage}
- Your main reply language must be ${practiceLanguage}; do not default to English.
- Use English only for short corrections, translations, or explanations when it helps.
- If the user writes in English, answer first in ${practiceLanguage}, then add a brief English gloss.
${dialectInstruction ? `- Dialect: ${dialectInstruction}` : ''}
- Gently correct grammar and vocabulary mistakes
- Adjust complexity to match their level (${context.level || 'intermediate'})
- Celebrate their progress and encourage them

`;
  } else if (context.mode === 'support') {
    prompt += `SUPPORT MODE:
Help the user with questions about Storyling.ai. Key features:
- AI-generated stories and podcasts in multiple languages (Spanish, French, Chinese, Japanese, Korean, German, Italian, Portuguese, Arabic, and more)
- Interactive vocabulary learning with click-to-translate
- Personalized content based on CEFR proficiency levels (A1-C2)
- Film mode: convert podcast stories into cinematic videos
- Collections: curated story sets for specific learning goals
- Word Bank: save and review vocabulary
- SRS (Spaced Repetition System) for vocabulary review
- Progress tracking and gamification (XP, streaks, badges)
- Premium features: unlimited stories, film mode, advanced analytics

If you don't know something specific, suggest contacting support@storyling.ai.

`;
  } else {
    // General/all-purpose mode
    prompt += `GENERAL MODE:
You can help with anything related to language learning, the current story, vocabulary, grammar, or how to use Storyling.ai. Be helpful and friendly.

`;
  }

  prompt += `Always respond in a warm, encouraging tone. Keep responses brief and conversational unless the user asks for more detail.`;

  return prompt;
}

export const chatbotRouter = router({
  // Get or create a conversation
  getConversation: protectedProcedure
    .input(
      z.object({
        mode: z.enum(['languagePractice', 'support', 'general']),
        language: z.string().optional(),
        level: z.string().optional(),
        storyId: z.number().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');
      const language = normalizeLearningLanguage(input.language || 'English');
      
      const existing = await db
        .select()
        .from(chatConversations)
        .where(
          and(
            eq(chatConversations.userId, ctx.user.id),
            eq(chatConversations.mode, input.mode),
            eq(chatConversations.language, language)
          )
        )
        .orderBy(desc(chatConversations.updatedAt))
        .limit(1);

      if (existing.length > 0) {
        const messages = await db
          .select()
          .from(chatMessages)
          .where(eq(chatMessages.conversationId, existing[0].id))
          .orderBy(chatMessages.createdAt)
          .limit(50);

        return {
          conversation: existing[0],
          messages,
        };
      }

      const result = await db
        .insert(chatConversations)
        .values({
          userId: ctx.user.id,
          mode: input.mode,
          language,
          level: input.level || 'intermediate',
        });
      
      const rawId = (result as any)[0]?.insertId ?? (result as any).insertId;
      const insertId = Number(rawId);

      const [newConversation] = await db
        .select()
        .from(chatConversations)
        .where(eq(chatConversations.id, insertId));

      return {
        conversation: newConversation,
        messages: [],
      };
    }),

  // Send a message and get AI response
  sendMessage: protectedProcedure
    .input(
      z.object({
        conversationId: z.number(),
        message: z.string().min(1).max(2000),
        // Context injection
        context: z.object({
          page: z.string().optional(),
          storyTitle: z.string().optional(),
          storyTranslation: z.string().optional(),
          storyTheme: z.string().optional(),
          storyLanguage: z.string().optional(),
          userLevel: z.string().optional(),
          currentSentence: z.string().optional(),
          currentSentenceTranslation: z.string().optional(),
          vocabularyWords: z.array(z.string()).optional(),
        }).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');
      
      const [conversation] = await db
        .select()
        .from(chatConversations)
        .where(
          and(
            eq(chatConversations.id, input.conversationId),
            eq(chatConversations.userId, ctx.user.id)
          )
        );

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Save user message
      await db.insert(chatMessages).values({
        conversationId: input.conversationId,
        role: 'user',
        content: input.message,
      });

      // Get conversation history (last 20 messages)
      const history = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.conversationId, input.conversationId))
        .orderBy(chatMessages.createdAt)
        .limit(20);

      // Build context-aware system prompt
      const systemPrompt = buildSystemPrompt({
        mode: conversation.mode,
        language: input.context?.storyLanguage || conversation.language,
        level: input.context?.userLevel || conversation.level,
        storyTitle: input.context?.storyTitle,
        storyTranslation: input.context?.storyTranslation,
        storyTheme: input.context?.storyTheme,
        currentSentence: input.context?.currentSentence,
        currentSentenceTranslation: input.context?.currentSentenceTranslation,
        vocabularyWords: input.context?.vocabularyWords,
        page: input.context?.page,
      });

      // Call GPT-4o
      let aiResponse: string;
      try {
        const completion = await openai.chat.completions.create({
          model: 'gpt-4o',
          messages: [
            { role: 'system', content: systemPrompt },
            ...history.map((msg) => ({
              role: msg.role as 'user' | 'assistant',
              content: msg.content,
            })),
          ],
          temperature: 0.75,
          max_tokens: 600,
        });
        aiResponse = completion.choices[0]?.message?.content || "Sorry, I couldn't generate a response right now. Please try again!";
      } catch (err: any) {
        console.error('[Chatbot] OpenAI API error:', err?.message || err);
        if (err?.status === 429 || err?.message?.includes('429') || err?.message?.includes('quota')) {
          throw new Error('429 You exceeded your current quota, please check your plan and billing details.');
        }
        throw new Error('Failed to generate a response. Please try again later.');
      }

      // Save AI response
      const messageResult = await db
        .insert(chatMessages)
        .values({
          conversationId: input.conversationId,
          role: 'assistant',
          content: aiResponse,
        });
      
      const rawMsgId = (messageResult as any)[0]?.insertId ?? (messageResult as any).insertId;
      const messageId = Number(rawMsgId);

      const [savedMessage] = await db
        .select()
        .from(chatMessages)
        .where(eq(chatMessages.id, messageId));

      // Update conversation timestamp
      await db
        .update(chatConversations)
        .set({ updatedAt: new Date() })
        .where(eq(chatConversations.id, input.conversationId));

      return savedMessage;
    }),

  // Clear conversation history
  clearConversation: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error('Database unavailable');
      
      const [conversation] = await db
        .select()
        .from(chatConversations)
        .where(
          and(
            eq(chatConversations.id, input.conversationId),
            eq(chatConversations.userId, ctx.user.id)
          )
        );

      if (!conversation) {
        throw new Error('Conversation not found');
      }

      await db
        .delete(chatMessages)
        .where(eq(chatMessages.conversationId, input.conversationId));

      return { success: true };
    }),

  // Get all conversations for user
  getConversations: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error('Database unavailable');
    
    const conversations = await db
      .select()
      .from(chatConversations)
      .where(eq(chatConversations.userId, ctx.user.id))
      .orderBy(desc(chatConversations.updatedAt));

    return conversations;
  }),
});
