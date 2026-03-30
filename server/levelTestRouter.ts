import { z } from "zod";
import { protectedProcedure, router } from "./_core/trpc";
import { invokeLLM } from "./_core/llm";
import {
  saveLevelTestResult,
  getLatestLevelTestResult,
  getAllLevelTestResults,
} from "./db";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  skillArea: "vocabulary" | "grammar" | "reading";
  explanation: string; // Brief explanation of why the correct answer is right
}

interface TestData {
  questions: Question[];
  answers: number[];
}

export const levelTestRouter = router({
  // Generate level test questions for a specific language
  generateTest: protectedProcedure
    .input(
      z.object({
        targetLanguage: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { targetLanguage } = input;

      // Generate questions using LLM
      const response = await invokeLLM({
        messages: [
          {
            role: "system",
            content: `You are a language proficiency test generator following the CEFR (Common European Framework of Reference) standards. Create 12 multiple-choice questions to accurately assess ${targetLanguage} proficiency from A1 to C2.

Return ONLY a JSON object in this exact format:
{
  "questions": [
    {
      "id": 1,
      "question": "What does 'hola' mean in English?",
      "options": ["Hello", "Goodbye", "Thank you", "Please"],
      "correctAnswer": 0,
      "difficulty": "A1",
      "skillArea": "vocabulary",
      "explanation": "'Hola' is the most common Spanish greeting, equivalent to 'Hello' in English."
    },
    {
      "id": 2,
      "question": "Choose the correct form: 'Yo ___ estudiante.'",
      "options": ["soy", "eres", "es", "somos"],
      "correctAnswer": 0,
      "difficulty": "A1",
      "skillArea": "grammar",
      "explanation": "'Soy' is the first person singular form of the verb 'ser' (to be), used with 'yo' (I)."
    }
  ]
}

Each question MUST include a brief 'explanation' field (1-2 sentences) explaining why the correct answer is right.

Question distribution by CEFR level:
- A1 (Beginner): 2 questions - Basic words, simple phrases
- A2 (Elementary): 2 questions - Common expressions, routine tasks
- B1 (Intermediate): 2 questions - Main points of clear texts, familiar matters
- B2 (Upper-Intermediate): 2 questions - Complex texts, abstract topics
- C1 (Advanced): 2 questions - Demanding texts, implicit meaning
- C2 (Proficient): 2 questions - Virtually everything, subtle distinctions

Skill areas to cover (use EXACTLY these values for skillArea field):
- "vocabulary" (4 questions): Word meanings, synonyms, context
- "grammar" (4 questions): Verb conjugation, sentence structure, tenses
- "reading" (4 questions): Short passages, inference, context

Ensure progressive difficulty - start with A1 and gradually increase to C2.`,
          },
          {
            role: "user",
            content: `Generate 12 ${targetLanguage} proficiency test questions following CEFR standards (A1 to C2).`,
          },
        ],
        response_format: {
          type: "json_object"
        },
      });

      // Check if response has the expected structure
      if (!response || !response.choices || !Array.isArray(response.choices) || response.choices.length === 0) {
        console.error("[levelTest] Invalid LLM response structure:", JSON.stringify(response, null, 2));
        throw new Error("Failed to generate test questions: Invalid response structure");
      }

      const content = response.choices[0].message?.content;
      if (!content || typeof content !== 'string') {
        console.error("[levelTest] Invalid content in response:", response.choices[0]);
        throw new Error("Failed to generate test questions: No content in response");
      }

      try {
        const testData = JSON.parse(content);
        if (!testData.questions || !Array.isArray(testData.questions)) {
          console.error("[levelTest] Invalid test data structure:", testData);
          throw new Error("Failed to generate test questions: Invalid questions array");
        }
        return testData.questions as Question[];
      } catch (parseError) {
        console.error("[levelTest] JSON parse error:", parseError);
        console.error("[levelTest] Content that failed to parse:", content);
        throw new Error("Failed to parse test questions from LLM response");
      }
    }),

  // Submit test answers and get results
  submitTest: protectedProcedure
    .input(
      z.object({
        targetLanguage: z.string(),
        questions: z.array(
          z.object({
            id: z.number(),
            question: z.string(),
            options: z.array(z.string()),
            correctAnswer: z.number(),
            difficulty: z.enum(["A1", "A2", "B1", "B2", "C1", "C2"]),
            skillArea: z.enum(["vocabulary", "grammar", "reading"]),
            explanation: z.string(),
          })
        ),
        answers: z.array(z.number()),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const { targetLanguage, questions, answers } = input;

      // Calculate score by CEFR level
      let correctAnswers = 0;
      const levelCorrect: Record<string, number> = {
        A1: 0, A2: 0, B1: 0, B2: 0, C1: 0, C2: 0
      };

      questions.forEach((q, idx) => {
        if (answers[idx] === q.correctAnswer) {
          correctAnswers++;
          levelCorrect[q.difficulty]++;
        }
      });

      const score = Math.round((correctAnswers / questions.length) * 100);

      // Determine CEFR proficiency level based on performance
      // User's level is the highest level where they got at least 1 question correct
      // AND they got at least 50% correct at that level or below
      let proficiencyLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";

      // C2: Got both C2 questions correct AND 90%+ overall
      if (levelCorrect.C2 >= 2 && score >= 90) {
        proficiencyLevel = "C2";
      }
      // C1: Got at least 1 C1 question correct AND 80%+ overall
      else if (levelCorrect.C1 >= 1 && score >= 80) {
        proficiencyLevel = "C1";
      }
      // B2: Got at least 1 B2 question correct AND 70%+ overall
      else if (levelCorrect.B2 >= 1 && score >= 70) {
        proficiencyLevel = "B2";
      }
      // B1: Got at least 1 B1 question correct AND 60%+ overall
      else if (levelCorrect.B1 >= 1 && score >= 60) {
        proficiencyLevel = "B1";
      }
      // A2: Got at least 1 A2 question correct AND 40%+ overall
      else if (levelCorrect.A2 >= 1 && score >= 40) {
        proficiencyLevel = "A2";
      }
      // A1: Everything else
      else {
        proficiencyLevel = "A1";
      }

      // Save result to database
      const testData: TestData = {
        questions,
        answers,
      };

      const result = await saveLevelTestResult({
        userId: ctx.user.id,
        targetLanguage,
        proficiencyLevel,
        score,
        totalQuestions: questions.length,
        correctAnswers,
        testData: JSON.stringify(testData),
      });

      return {
        proficiencyLevel,
        score,
        correctAnswers,
        totalQuestions: questions.length,
        breakdown: {
          A1: { correct: levelCorrect.A1, total: 2 },
          A2: { correct: levelCorrect.A2, total: 2 },
          B1: { correct: levelCorrect.B1, total: 2 },
          B2: { correct: levelCorrect.B2, total: 2 },
          C1: { correct: levelCorrect.C1, total: 2 },
          C2: { correct: levelCorrect.C2, total: 2 },
        },
      };
    }),

  // Get latest test result for a language
  getLatestResult: protectedProcedure
    .input(
      z.object({
        targetLanguage: z.string(),
      })
    )
    .query(async ({ input, ctx }) => {
      return await getLatestLevelTestResult(ctx.user.id, input.targetLanguage);
    }),

  // Get all test results for the user
  getAllResults: protectedProcedure.query(async ({ ctx }) => {
    return await getAllLevelTestResults(ctx.user.id);
  }),
});
