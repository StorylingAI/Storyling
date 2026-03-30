import { invokeLLM } from "./_core/llm";
import { storagePut } from "./storage";
import fs from "fs/promises";
import os from "os";
import path from "path";

interface StoryGenerationParams {
  targetLanguage: string;
  proficiencyLevel: string;
  vocabularyWords: string[];
  theme: string;
  topicPrompt?: string;
  translationLanguage?: string; // Language for translations (defaults to English)
  storyLength?: "short" | "medium" | "long"; // Story length preference
  mode?: "podcast" | "film";
  targetSceneCount?: number;
  targetVideoDuration?: number;
}

interface PodcastGenerationParams extends StoryGenerationParams {
  voiceType: string;
  narratorGender?: "male" | "female";
}

interface FilmGenerationParams extends StoryGenerationParams {
  cinematicStyle: string;
  targetVideoDuration?: number; // Target total video duration in seconds (default: 30)
  enableTransitions?: boolean; // Enable crossfade transitions between clips
  backgroundMusic?: 'calm' | 'upbeat' | 'dramatic' | 'adventure' | 'suspenseful' | 'romantic' | 'mysterious' | 'comedic' | 'energetic' | 'melancholic' | 'triumphant' | 'peaceful' | 'none'; // Background music mood
  musicVolume?: number; // Background music volume (0-100, default: 20)
  selectedMusicTrack?: string; // Selected music track filename
  addSubtitles?: boolean; // Whether to add subtitles to the video
  subtitleFontSize?: 'small' | 'medium' | 'large'; // Subtitle font size
  subtitlePosition?: 'top' | 'bottom'; // Subtitle position
  subtitleColor?: 'white' | 'yellow' | 'cyan'; // Subtitle color theme
  voiceType?: string; // TTS voice type for narration
  narratorGender?: 'male' | 'female'; // Narrator gender for TTS
  sceneBeats?: string[]; // Precomputed story beats to map one beat per clip
}

export interface GeneratedStory {
  title: string;
  titleTranslation?: string; // Title in user's translation language
  storyText: string;
  vocabularyUsage: Record<string, string[]>; // word -> sentences where it's used
  visualBeats?: string[]; // Film-friendly scene beats in story order
  lineTranslations?: Array<{
    original: string;
    pinyin?: string; // Only for Chinese
    english: string;
  }>;
  vocabularyTranslations?: Record<string, {
    word: string;
    pinyin?: string;
    translation: string;
    exampleSentences: string[];
  }>; // Enhanced vocabulary data with examples
}

function buildStoryGenerationInstructions(
  mode: "podcast" | "film",
  targetWordCount: string,
  targetSceneCount?: number,
  targetVideoDuration?: number,
): string {
  const sharedInstructions = [
    "1. Be appropriate for the requested CEFR level",
    "2. Use ALL provided vocabulary words naturally in context",
    "3. Be engaging and emotionally resonant",
    `4. Be approximately ${targetWordCount} words long`,
    "5. Have a clear beginning, middle, and end",
  ];

  if (mode === "film") {
    const sceneCount = targetSceneCount ?? 6;
    return `${sharedInstructions.join("\n")}
6. Use minimal dialogue and rely mostly on clean narrated action
7. Keep the cast visually simple: one main adult, maximum two recurring adults
8. Keep locations limited and reusable so scenes feel visually consistent
9. Avoid crowds, slapstick, fights, dancing, fast chases, object juggling, and complex hand-focused actions
10. Keep props simple and stable: at most one clearly held or carried prop in a beat
11. Write visually clean sentences so each beat is easy to render as a short AI video clip
12. Provide exactly ${sceneCount} visual beats in story order, each representing one simple moment
13. Keep the spoken narration concise enough to fit comfortably within about ${targetVideoDuration ?? 30} seconds
14. Keep consecutive beats in the same visual world with smooth progression: same outfit, same setting family, same time-of-day block, and no abrupt visual resets unless the story explicitly changes location`;
  }

  return `${sharedInstructions.join("\n")}
6. Include dialogue where appropriate`;
}

function getTargetWordCount(
  mode: "podcast" | "film",
  storyLength: "short" | "medium" | "long",
  targetVideoDuration?: number,
): string {
  if (mode === "film") {
    const safeDuration = Math.max(15, targetVideoDuration ?? 30);
    const minWords = Math.max(35, Math.round(safeDuration * 1.8));
    const maxWords = Math.max(minWords + 8, Math.round(safeDuration * 2.2));
    return `${minWords}-${maxWords}`;
  }

  const wordCountMap = {
    short: "300-500",
    medium: "500-800",
    long: "800-1200",
  };

  return wordCountMap[storyLength];
}

function buildStoryResponseFormatInstructions(
  targetLanguage: string,
  translationLanguage: string,
  isChinese: boolean,
  mode: "podcast" | "film",
  targetSceneCount?: number,
): string {
  const visualBeatsInstruction =
    mode === "film"
      ? `
- visualBeats: Array of exactly ${targetSceneCount ?? 6} short beat strings in ${targetLanguage}, in story order. Each beat must describe one simple visual moment with stable action, stable props, no complex choreography, and smooth continuity from the previous beat`
      : "";

  return `Return the response in JSON format with:
- title: Story title in ${targetLanguage}
- titleTranslation: Story title translated to ${translationLanguage}
- storyText: Complete story in plain text (no markdown formatting)
- vocabularyUsage: Object mapping each vocabulary word to sentences where it appears${visualBeatsInstruction}
- lineTranslations: Array of objects, one per sentence/line with:
  * original: The sentence in ${targetLanguage}${isChinese ? "\n  * pinyin: Pinyin romanization with ONE SYLLABLE PER CHARACTER separated by spaces. CRITICAL: Each Chinese character must have exactly one pinyin syllable. Example: For 'æž—è–‡ç«™åœ¨ç§‘æŠ€å±•çš„å±•ä½å‰' write 'LÃ­n WÄ“i zhÃ n zÃ i kÄ“ jÃ¬ zhÇŽn de zhÇŽn wÃ¨i qiÃ¡n' (11 characters = 11 syllables), NOT 'LÃ­n WÄ“i zhÃ n zÃ i kÄ“jÃ¬ zhÇŽn de zhÇŽnwÃ¨iqiÃ¡n'. Count the characters and syllables to verify they match." : ""}
  * english: ${translationLanguage} translation
- vocabularyTranslations: Object where EACH vocabulary word is a key, and the value is an object with:
  * word: The vocabulary word itself
  * pinyin: Pinyin with ONE SYLLABLE PER CHARACTER separated by spaces (Chinese only, e.g., for 'åˆ›ä¸š' write 'chuÃ ng yÃ¨' = 2 characters = 2 syllables)
  * translation: ${translationLanguage} translation of the word
  * exampleSentences: Array of 1-2 simple example sentences using this word`;
}

/**
 * Generate a story using OpenAI based on vocabulary and parameters
 */
export async function generateStory(params: StoryGenerationParams): Promise<GeneratedStory> {
  const {
    targetLanguage,
    proficiencyLevel,
    vocabularyWords,
    theme,
    topicPrompt,
    translationLanguage = "English",
    storyLength = "medium",
    mode = "podcast",
    targetSceneCount,
    targetVideoDuration,
  } = params;

  const targetWordCount = getTargetWordCount(mode, storyLength, targetVideoDuration);
  const storyInstructions = buildStoryGenerationInstructions(
    mode,
    targetWordCount,
    targetSceneCount,
    targetVideoDuration,
  );

  const isChinese = targetLanguage.toLowerCase().includes("chinese") || targetLanguage.toLowerCase().includes("mandarin");

  const systemPrompt = `You are an expert language learning content creator. Your task is to write an engaging, immersive story in ${targetLanguage} that naturally incorporates specific vocabulary words.

Requirements:
- Target language: ${targetLanguage}
- Proficiency level: ${proficiencyLevel} (CEFR)
- Theme: ${theme}
- Vocabulary to include: ${vocabularyWords.join(", ")}
${topicPrompt ? `- Story topic: ${topicPrompt}` : ""}

The story should:
${storyInstructions}

${buildStoryResponseFormatInstructions(targetLanguage, translationLanguage, isChinese, mode, targetSceneCount)}
- title: Story title in ${targetLanguage}
- titleTranslation: Story title translated to ${translationLanguage}
- storyText: Complete story in plain text (no markdown formatting)
- vocabularyUsage: Object mapping each vocabulary word to sentences where it appears
- lineTranslations: Array of objects, one per sentence/line with:
  * original: The sentence in ${targetLanguage}${isChinese ? "\n  * pinyin: Pinyin romanization with ONE SYLLABLE PER CHARACTER separated by spaces. CRITICAL: Each Chinese character must have exactly one pinyin syllable. Example: For '林薇站在科技展的展位前' write 'Lín Wēi zhàn zài kē jì zhǎn de zhǎn wèi qián' (11 characters = 11 syllables), NOT 'Lín Wēi zhàn zài kējì zhǎn de zhǎnwèiqián'. Count the characters and syllables to verify they match." : ""}
  * english: ${translationLanguage} translation
- vocabularyTranslations: Object where EACH vocabulary word is a key, and the value is an object with:
  * word: The vocabulary word itself
  * pinyin: Pinyin with ONE SYLLABLE PER CHARACTER separated by spaces (Chinese only, e.g., for '创业' write 'chuàng yè' = 2 characters = 2 syllables)
  * translation: ${translationLanguage} translation of the word
  * exampleSentences: Array of 1-2 simple example sentences using this word

EXAMPLE vocabularyTranslations structure:
{
  "mesa": { "word": "mesa", "translation": "table", "exampleSentences": ["La mesa es grande."] },
  "agua": { "word": "agua", "translation": "water", "exampleSentences": ["Bebo agua."] }
}`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      {
        role: "user",
        content:
          mode === "film"
            ? `Generate a film-friendly ${theme.toLowerCase()} story that teaches these vocabulary words: ${vocabularyWords.join(", ")}. Keep the visuals simple and consistent, keep the full narration close to ${targetVideoDuration ?? 30} seconds, include exactly ${targetSceneCount ?? 6} visual beats in story order, and make each beat feel like the next shot of the same short film. Include line-by-line translations${isChinese ? " with pinyin" : ""}.`
            : `Generate a ${theme.toLowerCase()} story that teaches these vocabulary words: ${vocabularyWords.join(", ")}. Include line-by-line translations${isChinese ? " with pinyin" : ""}.`,
      },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "story_generation",
        schema: {
          type: "object",
          properties: {
            title: { type: "string", description: "The story title in the target language" },
            titleTranslation: { type: "string", description: "The story title translated to the user's translation language" },
            storyText: { type: "string", description: "The complete story text in plain format without any markdown" },
            vocabularyUsage: {
              type: "object",
              description: "Mapping of vocabulary words to sentences where they are used",
            },
            visualBeats: {
              type: "array",
              description:
                mode === "film"
                  ? "Film-friendly story beats in chronological order, one simple beat per clip"
                  : "Optional visual beats",
              items: { type: "string" },
              ...(mode === "film"
                ? {
                    minItems: targetSceneCount ?? 6,
                    maxItems: targetSceneCount ?? 6,
                  }
                : {}),
            },
            lineTranslations: {
              type: "array",
              description: "Line-by-line translations",
              items: {
                type: "object",
                properties: {
                  original: { type: "string" },
                  ...(isChinese ? { pinyin: { type: "string" } } : {}),
                  english: { type: "string" },
                },
                required: isChinese ? ["original", "pinyin", "english"] : ["original", "english"],
              },
            },
            vocabularyTranslations: {
              type: "object",
              description: "Mapping of vocabulary words to detailed data with examples (word, translation, exampleSentences)",
            },
          },
          required: [
            "title",
            "titleTranslation",
            "storyText",
            "vocabularyUsage",
            "lineTranslations",
            "vocabularyTranslations",
            ...(mode === "film" ? ["visualBeats"] : []),
          ],
        },
      },
    },
  });

  const content = response.choices[0]?.message?.content;
  if (!content || typeof content !== "string") throw new Error("No content generated from OpenAI");

  console.log("[generateStory] Raw LLM response:", content.substring(0, 500));
  
  const result = JSON.parse(content) as GeneratedStory;
  
  console.log("[generateStory] Parsed result keys:", Object.keys(result));
  console.log("[generateStory] result.vocabularyTranslations:", result.vocabularyTranslations);
  console.log("[generateStory] vocabularyTranslations keys:", Object.keys(result.vocabularyTranslations || {}));
  console.log("[generateStory] vocabularyTranslations type:", typeof result.vocabularyTranslations);
  
  if (!result.vocabularyTranslations || Object.keys(result.vocabularyTranslations).length === 0) {
    console.error("[generateStory] WARNING: vocabularyTranslations is empty or missing!");
    console.error("[generateStory] Full result:", JSON.stringify(result, null, 2));
    
    // Fallback: Generate vocabulary translations by calling LLM again
    console.log("[generateStory] Attempting to generate vocabulary translations as fallback...");
    try {
      const vocabPrompt = `For the following vocabulary words in ${targetLanguage}, provide translations to ${translationLanguage} with example sentences.

Vocabulary words: ${vocabularyWords.join(", ")}

Return ONLY a JSON object where each word is a key, and the value is an object with:
- word: the vocabulary word
${isChinese ? '- pinyin: pinyin romanization\n' : ''}- translation: ${translationLanguage} translation
- exampleSentences: array of 1-2 simple example sentences using this word in ${targetLanguage}

Example format:
{
  "word1": { "word": "word1", ${isChinese ? '"pinyin": "pīnyīn", ' : ''}"translation": "translation1", "exampleSentences": ["Example sentence."] }
}`;
      
      const vocabResponse = await invokeLLM({
        messages: [{ role: "user", content: vocabPrompt }],
        response_format: { type: "json_object" },
      });
      
      const vocabContent = vocabResponse.choices[0]?.message?.content;
      if (vocabContent && typeof vocabContent === "string") {
        result.vocabularyTranslations = JSON.parse(vocabContent);
        console.log("[generateStory] Fallback vocabulary translations generated successfully:", Object.keys(result.vocabularyTranslations || {}));
      }
    } catch (fallbackError) {
      console.error("[generateStory] Fallback vocabulary generation failed:", fallbackError);
      // Initialize as empty object to prevent null errors
      result.vocabularyTranslations = {};
    }
  }
  
  return result;
}

/**
 * Generate a podcast (audio narration) using ElevenLabs
 */
// Helper function to get native voice ID based on language
function getNativeVoiceId(
  targetLanguage: string,
  voiceType: string,
  gender: "male" | "female"
): string {
  const lang = targetLanguage.toLowerCase();
  
  // Chinese (Mainland China Mandarin) native voices
  if (lang.includes("chinese") || lang.includes("mandarin")) {
    const chineseVoices: Record<string, { male: string; female: string }> = {
      "Warm & Friendly": {
        male: "4VZIsMPtgggwNg7OXbPY", // James Gao - calm, friendly
        female: "bhJUNIXWQQ94l8eI2VUf", // Amy - relaxed, friendly
      },
      "Professional Narrator": {
        male: "WuLq5z7nEcrhppO0ZQJw", // Martin Li - serious, intimate
        female: "gU2KtIu9OZWy3KqiqNj6", // LeeTingTing - gentle, sweet
      },
      "Energetic & Upbeat": {
        male: "5mZxJZhSmJTjL7GoYfYI", // Karo Yang - lively energy
        female: "fQj4gJSexpu8RDE2Ii5m", // Yu - vibrant, upbeat
      },
      "Calm & Soothing": {
        male: "M0TrFmFeBJS9H4xzdk8Z", // Steven Gor - low, calm, soothing
        female: "GgmlugwQ4LYXBbEXENWm", // Maya - calming tone
      },
      "Dramatic & Expressive": {
        male: "BrbEfHMQu0fyclQR7lfh", // Kevin Tu - high-mid voice, narrative
        female: "Ca5bKgudqKJzq8YRFoAz", // Coco Li - slight rasp, story narration
      },
    };
    return chineseVoices[voiceType]?.[gender] || chineseVoices["Warm & Friendly"][gender];
  }
  
  // Modern Standard Arabic native voices
  if (lang.includes("arabic") || lang.includes("عربي")) {
    const arabicVoices: Record<string, { male: string; female: string }> = {
      "Warm & Friendly": {
        male: "Qp2PG6sgef1EHtrNQKnf", // Mohamed Ben - warm, friendly
        female: "qi4PkV9c01kb869Vh7Su", // Asmaa - warm, conversational
      },
      "Professional Narrator": {
        male: "G1HOkzin3NMwRHSq60UI", // Chaouki - professional, clear
        female: "VwC51uc4PUblWEJSPzeo", // Abrar Sabbah - professional, articulate
      },
      "Energetic & Upbeat": {
        male: "DPd861uv5p6zeVV94qOT", // Mo Wiseman - energetic, upbeat
        female: "mRdG9GYEjJmIzqbYTidv", // Sana - vibrant, lively
      },
      "Calm & Soothing": {
        male: "kERwN6X2cY8g1XbfzJsX", // Mourad Sami - calm, soothing
        female: "u0TsaWvt0v8migutHM3M", // GHIZLANE - gentle, calming
      },
      "Dramatic & Expressive": {
        male: "JjTirzdD7T3GMLkwdd3a", // HMIDA - dramatic, expressive
        female: "yDl2vHQZjPaEFQPl8Tnr", // Mona - dramatic, storytelling
      },
    };
    return arabicVoices[voiceType]?.[gender] || arabicVoices["Warm & Friendly"][gender];
  }
  
  // Spanish native voices
  if (lang.includes("spanish") || lang.includes("español")) {
    const spanishVoices: Record<string, { male: string; female: string }> = {
      "Warm & Friendly": {
        male: "vAxdfYVShGAQEwKYqDZR", // Miguel - warm, friendly
        female: "GPzYRfJNEJniCw2WrKzi", // Yinet - warm, conversational
      },
      "Professional Narrator": {
        male: "BPoDAH7n4gFrnGY27Jkj", // Francisco - professional, clear
        female: "Xb7hH8MSUJpSbSDYk0k2", // Alice - professional, clear educator
      },
      "Energetic & Upbeat": {
        male: "15bJsujCI3tcDWeoZsQP", // Santiago - energetic, youthful
        female: "XrExE9yKIg1WjnnlVkGX", // Matilda - upbeat, professional
      },
      "Calm & Soothing": {
        male: "Yko7PKHZNXotIFUBG7I9", // Mateo - calm, soothing
        female: "EXAVITQu4vr4xnSDxMaL", // Sarah - reassuring, warm, mature
      },
      "Dramatic & Expressive": {
        male: "usTmJvQOCyW3nRcZ8OEo", // Dante - dramatic, expressive
        female: "pFZP5JQG7iQjIQuC4Bku", // Lily - velvety actress, dramatic
      },
    };
    return spanishVoices[voiceType]?.[gender] || spanishVoices["Warm & Friendly"][gender];
  }
  
  // French native voices - using multilingual voices with proper characteristics
  if (lang.includes("french") || lang.includes("français")) {
    const frenchVoices: Record<string, { male: string; female: string }> = {
      "Warm & Friendly": {
        male: "pNInz6obpgDQGcFmaJgB", // Adam - deep, warm
        female: "EXAVITQu4vr4xnSDxMaL", // Sarah - soft, warm
      },
      "Professional Narrator": {
        male: "VR6AewLTigWG4xSOukaG", // Arnold - crisp, professional
        female: "ThT5KcBeYPX3keUQqHPh", // Dorothy - pleasant, professional
      },
      "Energetic & Upbeat": {
        male: "TxGEqnHWrfWFTfGW9XjX", // Josh - young, energetic
        female: "jsCqWAovK2LkecY7zXl4", // Freya - upbeat, energetic
      },
      "Calm & Soothing": {
        male: "CwhRBWXzGAHq8TQ4Fs17", // Roger - calm, soothing
        female: "pFZP5JQG7iQjIQuC4Bku", // Lily - warm, calm
      },
      "Dramatic & Expressive": {
        male: "ErXwobaYiN019PkySvjV", // Antoni - well-rounded, upbeat
        female: "MF3mGyEYCl7XYWbV9V6O", // Elli - emotional, expressive
      },
    };
    return frenchVoices[voiceType]?.[gender] || frenchVoices["Warm & Friendly"][gender];
  }

  // Japanese native voices
  if (lang.includes("japanese") || lang.includes("日本")) {
    const japaneseVoices: Record<string, { male: string; female: string }> = {
      "Warm & Friendly": {
        male: "wAWUBOIVEUw9IEUYoNzR", // Junichi - conversational
        female: "8EkOjt4xTPGMclNlh1pk", // Morioki - conversational
      },
      "Professional Narrator": {
        male: "b34JylakFZPlGS0BnwyY", // Kenzo - calm, professional
        female: "RBnMinrYKeccY3vaUxlZ", // Sakura Suzuki - young, clear
      },
      "Energetic & Upbeat": {
        male: "bqpOyYNUu11tjjvRUbKn", // Yamato - 20s-30s, YouTube style
        female: "8kS8nwk1TQdxvQOmfTZA", // Ena - refreshing
      },
      "Calm & Soothing": {
        male: "MlgbiBnm4o8N3DaDzblH", // Hiro Satake - calm narration
        female: "8EkOjt4xTPGMclNlh1pk", // Morioki - calm conversations
      },
      "Dramatic & Expressive": {
        male: "7V2labMjY8jnJlxDRW75", // Koby - deep, husky, dramatic
        female: "RBnMinrYKeccY3vaUxlZ", // Sakura Suzuki - expressive
      },
    };
    return japaneseVoices[voiceType]?.[gender] || japaneseVoices["Warm & Friendly"][gender];
  }

  // Korean native voices
  if (lang.includes("korean") || lang.includes("한국")) {
    const koreanVoices: Record<string, { male: string; female: string }> = {
      "Warm & Friendly": {
        male: "Ir7oQcBXWiq4oFGROCfj", // Taemin - warm, natural, friendly
        female: "AW5wrnG1jVizOYY7R1Oo", // JiYoung - warm, clear, friendly
      },
      "Professional Narrator": {
        male: "s07IwTCOrCDCaETjUVjx", // Hyun Bin - cool, professional
        female: "sSoVF9lUgTGJz0Xz3J9y", // Jina - news broadcasting
      },
      "Energetic & Upbeat": {
        male: "PDoCXqBQFGsvfO0hNkEs", // KKC HQ - young, bright
        female: "z6Kj0hecH20CdetSElRT", // Jennie - youthful, engaging
      },
      "Calm & Soothing": {
        male: "5XgfKMHL4qnyg2mabE5t", // DeckYuk - steady, trusted
        female: "DMkRitQrfpiddSQT5adl", // Jjeong - calm, soothing
      },
      "Dramatic & Expressive": {
        male: "4JJwo477JUAx3HV0T7n7", // YohanKoo - confident, authoritative
        female: "xi3rF0t7dg7uN2M0WUhr", // Yuna - expressive storytelling
      },
    };
    return koreanVoices[voiceType]?.[gender] || koreanVoices["Warm & Friendly"][gender];
  }

  // Portuguese native voices (Brazilian Portuguese)
  if (lang.includes("portuguese") || lang.includes("português")) {
    const portugueseVoices: Record<string, { male: string; female: string }> = {
      "Warm & Friendly": {
        male: "Libc4Ixlrn2thn1XQaDL", // Higor Bourges - confident, natural
        female: "iScHbNW8K33gNo3lGgbo", // Marianne - sweet, calm
      },
      "Professional Narrator": {
        male: "96cLX3dkyNUmTHwkNXeS", // Thiago Realista - middle aged, clear
        female: "CZD4BJ803C6T0alQxsR7", // Andreia I. - confident, enthusiastic
      },
      "Energetic & Upbeat": {
        male: "36rVQA1AOIPwpA3Hg1tC", // Matheus - young, energetic
        female: "OB6x7EbXYlhG4DDTB1XU", // Michelle - sweet, vibrant
      },
      "Calm & Soothing": {
        male: "Jvj2FoZHFrWICKQxQXqy", // SamuelPro - warm, natural
        female: "iScHbNW8K33gNo3lGgbo", // Marianne - sweet, calm
      },
      "Dramatic & Expressive": {
        male: "y3X5crcIDtFawPx7bcNq", // Eliel - deep, gravelly, epic
        female: "PZIBrGsMjLyYasEz50bI", // Jennifer - hyper-naturalistic
      },
    };
    return portugueseVoices[voiceType]?.[gender] || portugueseVoices["Warm & Friendly"][gender];
  }

  // Hebrew voices - using multilingual voices optimized for Hebrew
  if (lang.includes("hebrew") || lang.includes("עברית")) {
    const hebrewVoices: Record<string, { male: string; female: string }> = {
      "Warm & Friendly": {
        male: "pNInz6obpgDQGcFmaJgB", // Adam - deep, warm
        female: "EXAVITQu4vr4xnSDxMaL", // Sarah - soft, warm
      },
      "Professional Narrator": {
        male: "onwK4e9ZLuTAKqWW03F9", // Daniel - deep, professional
        female: "Xb7hH8MSUJpSbSDYk0k2", // Alice - confident, clear
      },
      "Energetic & Upbeat": {
        male: "TxGEqnHWrfWFTfGW9XjX", // Josh - young, energetic
        female: "jsCqWAovK2LkecY7zXl4", // Freya - upbeat, bright
      },
      "Calm & Soothing": {
        male: "GBv7mTt0atIp3Br8iCZE", // Thomas - calm, soothing
        female: "LcfcDJNUP1GQjkzn1xUU", // Emily - calm, gentle
      },
      "Dramatic & Expressive": {
        male: "ErXwobaYiN019PkySvjV", // Antoni - well-rounded, expressive
        female: "pFZP5JQG7iQjIQuC4Bku", // Lily - dramatic, velvety
      },
    };
    return hebrewVoices[voiceType]?.[gender] || hebrewVoices["Warm & Friendly"][gender];
  }

  // Italian native voices
  if (lang.includes("italian") || lang.includes("italiano")) {
    const italianVoices: Record<string, { male: string; female: string }> = {
      "Warm & Friendly": {
        male: "ChJuCmdw5W6I2qZbzwVl", // Luigi - young adult, warm
        female: "MLpDWJvrjFIdb63xbJp8", // Angelina - warm, gentle, calm
      },
      "Professional Narrator": {
        male: "Ha21jUwaMwdgQvqNslSM", // Fabi - rich, warm, tutorials
        female: "QttbagfgqUCm9K0VgUyT", // Aida - professional, dynamic
      },
      "Energetic & Upbeat": {
        male: "slEjHpiFudesZaivDTNt", // Piero Italia - dynamic, engaging
        female: "YQ36DZjvxVXPUHeSwvFK", // Valentina - young, fresh
      },
      "Calm & Soothing": {
        male: "549McXP1DeaUBfISRSST", // Stefano - calm, middle-aged
        female: "PS6wM7QnnPTUDE3t4bbl", // Serena - soothing, gentle
      },
      "Dramatic & Expressive": {
        male: "HQ7Ez220YT02q2IAnVFl", // Alberto Arte - distinctive, expressive
        female: "fQmr8dTaOQq116mo2X7F", // Samanta - warm, deep, vibrant
      },
    };
    return italianVoices[voiceType]?.[gender] || italianVoices["Warm & Friendly"][gender];
  }

  // Russian native voices
  if (lang.includes("russian") || lang.includes("русский")) {
    const russianVoices: Record<string, { male: string; female: string }> = {
      "Warm & Friendly": {
        male: "0BcDz9UPwL3MpsnTeUlO", // Denis - pleasant young, social media
        female: "tOo2BJ74frmnPadsDNIi", // Kate - young, calm, friendly
      },
      "Professional Narrator": {
        male: "2OdNfs9Z4GCMvoFiCavC", // Max - clear, professional
        female: "OowtKaZH9N7iuGbsd00l", // Veronica С. - professional, films
      },
      "Energetic & Upbeat": {
        male: "hU3rD0Yk7DoiYULTX1pD", // Dmitry D - energetic, confident
        female: "8M81RK3MD7u4DOJpu2G5", // Viktoriia - clear, enthusiastic
      },
      "Calm & Soothing": {
        male: "rUOpAdbAl56KxO00wR5D", // Igor - soothing, gentle
        female: "rxEz5E7hIAPk7D3bXwf6", // Anna - calm, meditation
      },
      "Dramatic & Expressive": {
        male: "Ga0Zjw9ZBbevb3wIda0V", // Artemii Levkoy - deep, hoarse, dramatic
        female: "FZGeNF7bE3syeQOynDKC", // Victoria - warm, expressive, confident
      },
    };
    return russianVoices[voiceType]?.[gender] || russianVoices["Warm & Friendly"][gender];
  }

  // Dutch native voices
  if (lang.includes("dutch") || lang.includes("nederlands")) {
    const dutchVoices: Record<string, { male: string; female: string }> = {
      "Warm & Friendly": {
        male: "dLPO5AsXc3FZDbTh1IKa", // Ido - clear, warm, friendly
        female: "gC9jy9VUxaXAswovchvQ", // Laura Peeters - calm, enthusiastic
      },
      "Professional Narrator": {
        male: "vEJ3qtg3sMsfnn5mIDnG", // Victor - professional, editorial
        female: "YUdpWWny7k5yb4QCeweX", // Ruth Professional - warm, articulate
      },
      "Energetic & Upbeat": {
        male: "XSQQLeoHwWnBv8tjJ1T7", // Eric - young, entertainment
        female: "gC9jy9VUxaXAswovchvQ", // Laura Peeters - enthusiastic
      },
      "Calm & Soothing": {
        male: "LKZ8pGqli4t1rXhzN7hq", // Milan - calm, expressive, warm
        female: "yO6w2xlECAQRFP6pX7Hw", // Ruth Children's - casual, soothing
      },
      "Dramatic & Expressive": {
        male: "G53Wkf3yrsXvhoQsmslL", // James - deep, powerful
        female: "ANHrhmaFeVN0QJaa0PhL", // Petra Vlaams - variation, expressive
      },
    };
    return dutchVoices[voiceType]?.[gender] || dutchVoices["Warm & Friendly"][gender];
  }

  // Persian (Farsi) voices - using multilingual voices optimized for Persian
  if (lang.includes("persian") || lang.includes("farsi") || lang.includes("فارسی")) {
    const persianVoices: Record<string, { male: string; female: string }> = {
      "Warm & Friendly": {
        male: "pNInz6obpgDQGcFmaJgB", // Adam - deep, warm
        female: "EXAVITQu4vr4xnSDxMaL", // Sarah - soft, warm
      },
      "Professional Narrator": {
        male: "VR6AewLTigWG4xSOukaG", // Arnold - crisp, professional
        female: "ThT5KcBeYPX3keUQqHPh", // Dorothy - pleasant, professional
      },
      "Energetic & Upbeat": {
        male: "TxGEqnHWrfWFTfGW9XjX", // Josh - young, energetic
        female: "jsCqWAovK2LkecY7zXl4", // Freya - upbeat, bright
      },
      "Calm & Soothing": {
        male: "GBv7mTt0atIp3Br8iCZE", // Thomas - calm, soothing
        female: "LcfcDJNUP1GQjkzn1xUU", // Emily - calm, gentle
      },
      "Dramatic & Expressive": {
        male: "ErXwobaYiN019PkySvjV", // Antoni - well-rounded, expressive
        female: "pFZP5JQG7iQjIQuC4Bku", // Lily - dramatic, velvety
      },
    };
    return persianVoices[voiceType]?.[gender] || persianVoices["Warm & Friendly"][gender];
  }

  // Turkish voices - using multilingual voices optimized for Turkish
  if (lang.includes("turkish") || lang.includes("türkçe")) {
    const turkishVoices: Record<string, { male: string; female: string }> = {
      "Warm & Friendly": {
        male: "pNInz6obpgDQGcFmaJgB", // Adam - deep, warm
        female: "EXAVITQu4vr4xnSDxMaL", // Sarah - soft, warm
      },
      "Professional Narrator": {
        male: "onwK4e9ZLuTAKqWW03F9", // Daniel - deep, professional
        female: "Xb7hH8MSUJpSbSDYk0k2", // Alice - confident, clear
      },
      "Energetic & Upbeat": {
        male: "TxGEqnHWrfWFTfGW9XjX", // Josh - young, energetic
        female: "jsCqWAovK2LkecY7zXl4", // Freya - upbeat, bright
      },
      "Calm & Soothing": {
        male: "CwhRBWXzGAHq8TQ4Fs17", // Roger - calm, soothing
        female: "pFZP5JQG7iQjIQuC4Bku", // Lily - warm, calm
      },
      "Dramatic & Expressive": {
        male: "ErXwobaYiN019PkySvjV", // Antoni - well-rounded, expressive
        female: "MF3mGyEYCl7XYWbV9V6O", // Elli - emotional, expressive
      },
    };
    return turkishVoices[voiceType]?.[gender] || turkishVoices["Warm & Friendly"][gender];
  }

  // Hindi voices - using multilingual voices optimized for Hindi
  if (lang.includes("hindi") || lang.includes("हिंदी")) {
    const hindiVoices: Record<string, { male: string; female: string }> = {
      "Warm & Friendly": {
        male: "pNInz6obpgDQGcFmaJgB", // Adam - deep, warm
        female: "EXAVITQu4vr4xnSDxMaL", // Sarah - soft, warm
      },
      "Professional Narrator": {
        male: "VR6AewLTigWG4xSOukaG", // Arnold - crisp, professional
        female: "ThT5KcBeYPX3keUQqHPh", // Dorothy - pleasant, professional
      },
      "Energetic & Upbeat": {
        male: "TxGEqnHWrfWFTfGW9XjX", // Josh - young, energetic
        female: "jsCqWAovK2LkecY7zXl4", // Freya - upbeat, bright
      },
      "Calm & Soothing": {
        male: "GBv7mTt0atIp3Br8iCZE", // Thomas - calm, soothing
        female: "LcfcDJNUP1GQjkzn1xUU", // Emily - calm, gentle
      },
      "Dramatic & Expressive": {
        male: "ErXwobaYiN019PkySvjV", // Antoni - well-rounded, expressive
        female: "pFZP5JQG7iQjIQuC4Bku", // Lily - dramatic, velvety
      },
    };
    return hindiVoices[voiceType]?.[gender] || hindiVoices["Warm & Friendly"][gender];
  }

  // German native voices - using multilingual voices with proper characteristics
  if (lang.includes("german") || lang.includes("deutsch")) {
    const germanVoices: Record<string, { male: string; female: string }> = {
      "Warm & Friendly": {
        male: "pNInz6obpgDQGcFmaJgB", // Adam - deep, warm
        female: "EXAVITQu4vr4xnSDxMaL", // Sarah - soft, warm
      },
      "Professional Narrator": {
        male: "VR6AewLTigWG4xSOukaG", // Arnold - crisp, professional
        female: "ThT5KcBeYPX3keUQqHPh", // Dorothy - pleasant, professional
      },
      "Energetic & Upbeat": {
        male: "TxGEqnHWrfWFTfGW9XjX", // Josh - young, energetic
        female: "jsCqWAovK2LkecY7zXl4", // Freya - upbeat, energetic
      },
      "Calm & Soothing": {
        male: "CwhRBWXzGAHq8TQ4Fs17", // Roger - calm, soothing
        female: "pFZP5JQG7iQjIQuC4Bku", // Lily - warm, calm
      },
      "Dramatic & Expressive": {
        male: "ErXwobaYiN019PkySvjV", // Antoni - well-rounded, upbeat
        female: "MF3mGyEYCl7XYWbV9V6O", // Elli - emotional, expressive
      },
    };
    return germanVoices[voiceType]?.[gender] || germanVoices["Warm & Friendly"][gender];
  }
  
  // Default: English/multilingual voices for other languages
  // Fixed mappings based on actual voice characteristics
  const defaultVoices: Record<string, { male: string; female: string }> = {
    "Warm & Friendly": {
      male: "pNInz6obpgDQGcFmaJgB", // Adam - deep, warm
      female: "EXAVITQu4vr4xnSDxMaL", // Sarah - soft, warm
    },
    "Professional Narrator": {
      male: "VR6AewLTigWG4xSOukaG", // Arnold - crisp, professional
      female: "ThT5KcBeYPX3keUQqHPh", // Dorothy - pleasant, professional
    },
    "Energetic & Upbeat": {
      male: "TxGEqnHWrfWFTfGW9XjX", // Josh - young, energetic
      female: "jsCqWAovK2LkecY7zXl4", // Freya - upbeat, energetic
    },
    "Calm & Soothing": {
      male: "CwhRBWXzGAHq8TQ4Fs17", // Roger - calm, soothing
      female: "pFZP5JQG7iQjIQuC4Bku", // Lily - warm, calm
    },
    "Dramatic & Expressive": {
      male: "ErXwobaYiN019PkySvjV", // Antoni - well-rounded, upbeat
      female: "MF3mGyEYCl7XYWbV9V6O", // Elli - emotional, expressive
    },
  };
  
  return defaultVoices[voiceType]?.[gender] || defaultVoices["Warm & Friendly"][gender];
}

/**
 * Get voice settings based on voice type for distinct audio characteristics
 */
function getVoiceSettings(voiceType: string) {
  const settingsMap: Record<string, { stability: number; similarity_boost: number; style: number }> = {
    "Warm & Friendly": {
      stability: 0.50, // Moderate stability for friendly consistency
      similarity_boost: 0.75, // Balanced natural voice
      style: 0.60, // Moderate expressiveness
    },
    "Professional Narrator": {
      stability: 0.70, // Higher stability for professional consistency
      similarity_boost: 0.80, // Clear, accurate voice reproduction
      style: 0.40, // Lower style for neutral, professional tone
    },
    "Energetic & Upbeat": {
      stability: 0.30, // Lower stability for dynamic variation
      similarity_boost: 0.70, // Natural voice with variation
      style: 0.85, // High style for expressive, energetic delivery
    },
    "Calm & Soothing": {
      stability: 0.75, // High stability for smooth, consistent delivery
      similarity_boost: 0.80, // Clear, gentle voice
      style: 0.30, // Low style for calm, relaxed tone
    },
    "Dramatic & Expressive": {
      stability: 0.35, // Low stability for dramatic variation
      similarity_boost: 0.75, // Balanced for expressive range
      style: 0.90, // Maximum style for theatrical, emotional delivery
    },
  };
  
  return settingsMap[voiceType] || settingsMap["Warm & Friendly"];
}

export async function generatePodcast(
  params: PodcastGenerationParams,
  storyText: string
): Promise<{ audioUrl: string; transcript: string }> {
  const gender = params.narratorGender || "female";
  const voiceId = getNativeVoiceId(params.targetLanguage, params.voiceType, gender);
  const voiceSettings = getVoiceSettings(params.voiceType);

  // Strip markdown formatting (bold, italic, etc.) from story text for clean TTS
  // This prevents glitches when ElevenLabs encounters markdown syntax like **word**
  const cleanText = storyText
    .replace(/\*\*(.+?)\*\*/g, '$1')  // Remove bold: **text** -> text
    .replace(/\*(.+?)\*/g, '$1')      // Remove italic: *text* -> text
    .replace(/_(.+?)_/g, '$1')        // Remove underscore italic: _text_ -> text
    .replace(/~~(.+?)~~/g, '$1');     // Remove strikethrough: ~~text~~ -> text

  try {
    const response = await fetch("https://api.elevenlabs.io/v1/text-to-speech/" + voiceId, {
      method: "POST",
      headers: {
        Accept: "audio/mpeg",
        "Content-Type": "application/json",
        "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
      },
      body: JSON.stringify({
        text: cleanText,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: voiceSettings.stability,
          similarity_boost: voiceSettings.similarity_boost,
          style: voiceSettings.style,
          use_speaker_boost: true, // Enable speaker boost for clarity
        },
      }),
    });

    if (!response.ok) {
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const audioData = Buffer.from(audioBuffer);

    // Upload to S3
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    const fileKey = `podcasts/podcast-${timestamp}-${randomSuffix}.mp3`;

    const { url: audioUrl } = await storagePut(fileKey, audioData, "audio/mpeg");

    // Generate transcript (for now, just use the story text)
    const transcript = storyText;

    return { audioUrl, transcript };
  } catch (error) {
    console.error("Error generating podcast:", error);
    throw new Error("Failed to generate podcast audio");
  }
}

/**
 * Generate a character & visual consistency sheet from the story via LLM.
 * This sheet is injected into every scene's visual prompt to maintain
 * consistent character appearances and visual style across clips.
 */
export async function generateCharacterSheet(
  storyText: string,
  cinematicStyle: string,
  theme: string,
): Promise<string> {
  const systemPrompt = `You are a visual director. Extract character and setting information from a story to ensure visual consistency across multiple video scenes.

Analyze the story and produce a CHARACTER & SETTING SHEET.

Respond in this EXACT format:
VISUAL STYLE: [One line describing overall visual style, color palette, lighting, mood matching "${cinematicStyle}" style and "${theme}" theme]
PRIMARY SUBJECT LOCK: [One single sentence for the main recurring adult with immutable details: age impression, hair, face shape, exact jacket/top, exact pants/bottom, exact shoes, exact backpack/essential prop]

CHARACTERS:
- [Role/Name]: [Detailed physical description: approximate age as adult, hair color/style, clothing, distinguishing features]

SETTING LOCK: [Primary location description with key visual elements that should stay visually recognizable]

CONTINUITY NOTES: [Key visual elements that must remain consistent across all scenes]

IMPORTANT:
- Describe ALL characters as adults. No children or minors.
- Keep descriptions visual only — no dialogue, no names from the story.
- Limit recurring cast to 1-2 primary adults whenever possible.
- Lock clothing, hair, silhouette, and one essential carried prop per recurring character.
- The PRIMARY SUBJECT LOCK must be specific and reusable verbatim in every scene prompt.
- Emphasize physically plausible anatomy, grounded props, and clean separation between bodies and background objects.
- Mention continuity constraints that prevent wardrobe drift, floating objects, or extra limbs.`;

  console.log('[Film Generation] Generating character sheet for visual consistency...');

  try {
    const response = await invokeLLM({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: storyText.substring(0, 1500) },
      ],
      max_tokens: 512,
    });

    const content = response.choices[0]?.message?.content;
    const sheet = typeof content === 'string' ? content.trim() : '';

    if (sheet) {
      console.log(`[Film Generation] Character sheet generated (${sheet.length} chars)`);
    } else {
      console.warn('[Film Generation] Empty character sheet response');
    }

    return sheet;
  } catch (error) {
    console.error('[Film Generation] Character sheet generation failed:', error);
    return '';
  }
}

const FILM_SUBJECT_STABILITY_GUIDANCE =
  "one primary adult subject, one simple grounded action, stable anatomy, consistent clothing and props, no floating or detached objects, no crowds, gentle camera motion";

const FILM_LANDSCAPE_STABILITY_GUIDANCE =
  "stable environment, no people, no text, no morphing or drifting objects, gentle natural motion";

const FILM_CLIP_TRANSIENT_RETRIES = 1;

function buildFallbackVisualPrompt(
  cinematicStyle: string,
  theme: string,
  sceneIndex: number,
  totalScenes: number,
  retryLevel: 0 | 1 | 2,
): string {
  const guidance =
    retryLevel === 2
      ? FILM_LANDSCAPE_STABILITY_GUIDANCE
      : FILM_SUBJECT_STABILITY_GUIDANCE;

  return `${cinematicStyle} cinematic scene ${sceneIndex + 1}/${totalScenes}, ${theme.toLowerCase()} mood, ${guidance}.`;
}

function finalizeVisualPrompt(
  cinematicStyle: string,
  visualText: string,
  retryLevel: 0 | 1 | 2,
  characterSheet?: string,
  previousScenePrompt?: string,
): string {
  const guidance =
    retryLevel === 2
      ? FILM_LANDSCAPE_STABILITY_GUIDANCE
      : FILM_SUBJECT_STABILITY_GUIDANCE;
  const characterLock = extractCharacterLock(characterSheet);
  const visualStyleLock = extractSheetField(characterSheet, "VISUAL STYLE");
  const settingLock =
    extractSheetField(characterSheet, "SETTING LOCK") ||
    extractSheetField(characterSheet, "SETTING");
  const continuityNotes = extractSheetField(characterSheet, "CONTINUITY NOTES");
  const previousShotReference = summarizePromptForContinuity(previousScenePrompt);
  const styleDirective =
    visualStyleLock && retryLevel < 2
      ? `Keep the same palette, lighting, and overall visual treatment: ${visualStyleLock.replace(/[.\s]+$/g, "")}. `
      : "";
  const recurringSubjectLock =
    characterLock && retryLevel < 2
      ? `Same recurring adult in every human scene, with unchanged face, hairstyle, outerwear, bottoms, shoes, and backpack: ${characterLock.replace(/[.\s]+$/g, "")}. `
      : "";
  const settingDirective =
    settingLock
      ? `Keep the same recognizable setting family unless the story explicitly changes location: ${settingLock.replace(/[.\s]+$/g, "")}. `
      : "";
  const continuityDirective =
    continuityNotes && retryLevel < 2
      ? `Continuity rules: ${continuityNotes.replace(/[.\s]+$/g, "")}. `
      : "";
  const previousShotDirective =
    previousShotReference && retryLevel < 2
      ? `Direct continuation of the previous shot: ${previousShotReference}. `
      : "";

  return `${cinematicStyle}. ${styleDirective}${recurringSubjectLock}${settingDirective}${continuityDirective}${previousShotDirective}${visualText.replace(/[.\s]+$/g, "")}. ${guidance}.`;
}

function extractSheetField(characterSheet: string | undefined, label: string): string {
  if (!characterSheet) {
    return "";
  }

  const fieldMatch = characterSheet.match(new RegExp(`^${label}:\\s*(.+)$`, "im"));
  if (fieldMatch?.[1]) {
    return fieldMatch[1].trim();
  }

  return "";
}

function extractCharacterLock(characterSheet?: string): string {
  if (!characterSheet) {
    return "";
  }

  const explicitLock = extractSheetField(characterSheet, "PRIMARY SUBJECT LOCK");
  if (explicitLock) {
    return explicitLock;
  }

  const fallbackCharacterMatch = characterSheet.match(/^- [^:]+:\s*(.+)$/m);
  return fallbackCharacterMatch?.[1]?.trim() ?? "";
}

function summarizePromptForContinuity(previousScenePrompt?: string): string {
  if (!previousScenePrompt) {
    return "";
  }

  return previousScenePrompt
    .replace(/^[^.]+\.\s*/, "")
    .replace(
      /\.\s*(one primary adult subject, one simple grounded action, stable anatomy, consistent clothing and props, no floating or detached objects, no crowds, gentle camera motion|stable environment, no people, no text, no morphing or drifting objects, gentle natural motion)\.?$/i,
      "",
    )
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 260);
}

function isTransientClipFailure(message: string): boolean {
  const normalizedMessage = message.toLowerCase();
  return (
    normalizedMessage.includes('timeout') ||
    normalizedMessage.includes('temporarily unavailable') ||
    normalizedMessage.includes('rate limit') ||
    normalizedMessage.includes('server error') ||
    normalizedMessage.includes('connection') ||
    normalizedMessage.includes('network') ||
    normalizedMessage.includes('service unavailable')
  );
}

/**
 * Convert narrative story text into a visual-only cinematic prompt in English.
 * Used to avoid NSFW false positives from Higgsfield's content filter.
 */
export async function convertToVisualPrompt(
  sceneText: string,
  cinematicStyle: string,
  theme: string,
  sceneIndex: number,
  totalScenes: number,
  retryLevel: 0 | 1 | 2 = 0,
  characterSheet?: string,
  previousScenePrompt?: string,
): Promise<string> {
  const levelRules: Record<number, string> = {
    0: `Rules:
- Describe ONLY what the camera sees: actions, settings, lighting, colors, camera angles
- NO dialogue, NO character names, NO quoted speech
- Show ONE simple action beat only, with at most 1-2 adults in frame
- If the reference sheet defines a PRIMARY SUBJECT LOCK, preserve that exact adult identity, outfit, backpack/prop, hair, and silhouette
- Do not change jacket color, clothing type, pants vs shorts, backpack size, or hairstyle between scenes
- Keep anatomy physically plausible and fully coherent
- Keep clothing, hair, and carried props consistent with the reference sheet
- If a prop is held, it must stay naturally attached to the body
- Avoid crowds, slapstick motion, chaotic choreography, or object juggling
- Avoid limbs intersecting with trees, walls, furniture, or clothing
- Favor grounded compositions with subtle camera movement
- Treat this scene as the next shot of the same short film, not a reset
- Keep weather, time of day, and location family continuous unless the story explicitly changes them
- Change only one major variable from the previous shot: pose, camera angle, or nearby sub-location
- NO ages, NO "children", "kids", "boy", "girl" — use "person", "family members", "group"
- NO text overlays or written words in the scene
- Keep it under 220 characters
- Output a compact single-sentence shot description`,
    1: `Rules:
- Describe ONLY what the camera sees: actions, settings, lighting, colors, camera angles
- NO dialogue, NO character names, NO quoted speech
- Describe characters as adults only. Use "young adults", "couple", "travelers"
- If the reference sheet defines a PRIMARY SUBJECT LOCK, preserve that same adult identity and outfit exactly
- Do not swap outerwear, backpack, hairstyle, or body proportions between clips
- Use only one distant adult or a pair at most
- Focus 75% on environment/atmosphere, 25% on human presence
- Keep human action minimal and physically plausible
- Avoid any detailed anatomy, hand gestures, or prop choreography
- Prefer wide shots, silhouettes, and clean separation from the background
- Treat this scene as a smooth continuation of the previous shot, not a brand-new setup
- Keep palette, weather, and location continuity unless the story explicitly changes them
- Avoid any detailed anatomy or physical close-ups
- NO text overlays or written words in the scene
- Keep it under 220 characters
- Output a compact single-sentence shot description`,
    2: `Rules:
- NO human figures at all. Describe ONLY the landscape, environment, and atmosphere
- Focus on nature, architecture, light, weather, textures
- Pure environmental/artistic shot
- No moving props, creatures, or vehicles unless they are simple and clearly grounded
- Favor stable compositions and subtle natural motion only
- NO text overlays or written words in the scene
- Keep it under 220 characters
- Output a compact single-sentence shot description`,
  };

  const consistencyBlock = characterSheet
    ? `\nVISUAL REFERENCE (maintain these descriptions across all scenes):\n${characterSheet}\n`
    : '';
  const previousSceneBlock = previousScenePrompt
    ? `\nPREVIOUS SHOT REFERENCE (preserve continuity unless the story explicitly changes it):\n${summarizePromptForContinuity(previousScenePrompt)}\n`
    : '';

  const systemPrompt = `You are a cinematographic prompt engineer. Convert the following narrative text into a visual-only cinematic description in English for AI video generation.

${levelRules[retryLevel]}
${consistencyBlock}
${previousSceneBlock}
Scene context: ${cinematicStyle} style, ${theme.toLowerCase()} theme, scene ${sceneIndex + 1}/${totalScenes}

Respond with ONLY the visual description. No explanations, no markdown, no quotes.`;

  console.log(`[Film Generation] Converting scene text to visual prompt (level ${retryLevel})`);

  try {
    const response = await invokeLLM({
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: sceneText.substring(0, 500) },
      ],
      max_tokens: 256,
    });

    const content = response.choices[0]?.message?.content;
    const visualText = typeof content === 'string' ? content.trim() : '';

    if (!visualText) {
      console.warn('[Film Generation] Empty LLM response, falling back to safe prompt');
      return buildFallbackVisualPrompt(
        cinematicStyle,
        theme,
        sceneIndex,
        totalScenes,
        retryLevel,
      );
    }

    const finalPrompt = finalizeVisualPrompt(
      cinematicStyle,
      visualText,
      retryLevel,
      characterSheet,
      previousScenePrompt,
    );
    console.log(`[Film Generation] Visual prompt: "${finalPrompt.substring(0, 80)}..."`);
    return finalPrompt;
  } catch (error) {
    console.error('[Film Generation] LLM conversion failed, falling back to safe prompt:', error);
    return buildFallbackVisualPrompt(
      cinematicStyle,
      theme,
      sceneIndex,
      totalScenes,
      retryLevel,
    );
  }
}

/**
 * Generate a film (video) using Higgsfield API with multi-clip stitching
 *
 * This function creates longer videos by:
 * 1. Splitting the story into multiple scenes
 * 2. Generating a short video clip for each scene
 * 3. Stitching all clips together into a single video
 */
export async function generateFilm(
  params: FilmGenerationParams,
  storyText: string,
  onProgress?: (stage: string, progress: number) => void
): Promise<{ videoUrl: string; transcript: string; clipCount?: number; totalDuration?: number }> {
  const { 
    cinematicStyle, 
    theme, 
    targetVideoDuration = 30, 
    enableTransitions = false, 
    backgroundMusic = 'none',
    musicVolume = 20,
    selectedMusicTrack,
    addSubtitles = false,
    subtitleFontSize = 'medium',
    subtitlePosition = 'bottom',
    subtitleColor = 'white'
  } = params;

  // Import required modules
  const { generateHiggsfieldVideo } = await import("./higgsfield");
  const { fitSceneTextsToClipCount, splitStoryIntoScenes, stitchVideos } = await import("./videoStitching");
  let narrationAudioPath: string | undefined;

  try {
    const clipDuration = 5;
    const clipCount = Math.max(1, Math.ceil(targetVideoDuration / clipDuration));
    const plannedVideoDuration = clipCount * clipDuration;

    console.log(
      `[Film Generation] Creating ${clipCount} clips for target ${plannedVideoDuration}s (duration-driven)`,
    );

    if (onProgress) onProgress('Planning scenes...', 5);
    const scenes = params.sceneBeats?.length
      ? fitSceneTextsToClipCount(params.sceneBeats, clipCount)
      : splitStoryIntoScenes(storyText, plannedVideoDuration, clipDuration);
    console.log(
      `[Film Generation] Split into ${scenes.length} scenes (${params.sceneBeats?.length ? "story beats" : "story text"})`,
    );

    // Step 1: Generate TTS narration audio (if voice is provided)
    if (params.voiceType) {
      if (onProgress) onProgress('Generating narration audio...', 10);
      console.log('[Film Generation] Step 1: Generating TTS narration...');

      const gender = params.narratorGender || 'female';
      const voiceId = getNativeVoiceId(params.targetLanguage, params.voiceType, gender);
      const voiceSettings = getVoiceSettings(params.voiceType);
      const fullStoryWordCount = storyText.split(/\s+/).filter(Boolean).length;
      const maxNarrationWords = Math.max(35, Math.round(targetVideoDuration * 2.2));
      const narrationSourceText = fullStoryWordCount > maxNarrationWords
        ? scenes.join(' ')
        : storyText;

      if (narrationSourceText !== storyText) {
        console.log(
          `[Film Generation] Condensing narration from ${fullStoryWordCount} words to fit ${targetVideoDuration}s target`,
        );
      }

      const cleanText = narrationSourceText
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/_(.+?)_/g, '$1')
        .replace(/~~(.+?)~~/g, '$1');

      try {
        const ttsResponse = await fetch('https://api.elevenlabs.io/v1/text-to-speech/' + voiceId, {
          method: 'POST',
          headers: {
            Accept: 'audio/mpeg',
            'Content-Type': 'application/json',
            'xi-api-key': process.env.ELEVENLABS_API_KEY || '',
          },
          body: JSON.stringify({
            text: cleanText,
            model_id: 'eleven_multilingual_v2',
            voice_settings: {
              stability: voiceSettings.stability,
              similarity_boost: voiceSettings.similarity_boost,
              style: voiceSettings.style,
              use_speaker_boost: true,
            },
          }),
        });

        if (!ttsResponse.ok) {
          console.error('[Film Generation] TTS failed:', ttsResponse.statusText);
        } else {
          const audioBuffer = await ttsResponse.arrayBuffer();
          const audioData = Buffer.from(audioBuffer);
          narrationAudioPath = path.join(
            os.tmpdir(),
            `film-narration-${Date.now()}-${Math.random().toString(36).slice(2)}.mp3`,
          );
          await fs.writeFile(narrationAudioPath, audioData);
          console.log('[Film Generation] TTS narration saved locally:', narrationAudioPath);

          try {
            const { exec } = await import('child_process');
            const { promisify } = await import('util');
            const execAsync = promisify(exec);
            const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${narrationAudioPath}"`);
            const narrationDuration = Math.ceil(parseFloat(stdout.trim()));
            console.log(`[Film Generation] Narration duration: ${narrationDuration}s (target video: ${plannedVideoDuration}s)`);
          } catch (e) {
            console.warn('[Film Generation] Could not measure narration duration');
          }
        }
      } catch (ttsError) {
        console.error('[Film Generation] TTS generation failed, continuing without narration:', ttsError);
      }
    }

    // Step 2: Generate character sheet for visual consistency
    if (onProgress) onProgress('Analyzing visual style...', 15);
    const characterSheet = await generateCharacterSheet(storyText, cinematicStyle, theme);

    // Step 3: Deterministic seed from story text for consistent image style
    const storySeed = Array.from(storyText).reduce((hash, char) => {
      return ((hash << 5) - hash + char.charCodeAt(0)) | 0;
    }, 0);
    const consistentSeed = Math.abs(storySeed) % 10000;
    console.log('[Film Generation] Using consistent seed:', consistentSeed);

    // Step 5: Generate video clips with character sheet + consistent seed
    const clips: Array<{ url: string; order: number; duration: number }> = [];
    let previousVisualPrompt: string | undefined;

    for (let i = 0; i < scenes.length; i++) {
      const sceneText = scenes[i];
      const progressPercent = 25 + Math.floor((i / scenes.length) * 55);

      if (onProgress) {
        onProgress(`Generating clip ${i + 1}/${scenes.length}`, progressPercent);
      }

      let visualPrompt = await convertToVisualPrompt(
        sceneText,
        cinematicStyle,
        theme,
        i,
        scenes.length,
        0,
        characterSheet,
        previousVisualPrompt,
      );

      console.log(`[Film Generation] Generating clip ${i + 1}/${scenes.length}:`, visualPrompt.substring(0, 80) + '...');

      let result: Awaited<ReturnType<typeof generateHiggsfieldVideo>> | undefined;
      let clipAttempt = 0;
      let lastFailureMessage = '';

      while (clipAttempt <= FILM_CLIP_TRANSIENT_RETRIES) {
        let retryLevel = 0;
        let shouldRetryClip = false;

        do {
          try {
            result = await generateHiggsfieldVideo({
              prompt: visualPrompt,
              duration: clipDuration,
              aspectRatio: "16:9",
              model: "standard",
              seed: consistentSeed,
              persistToStorage: false,
            });
          } catch (clipError: any) {
            lastFailureMessage = clipError?.message || `Clip ${i + 1} generation failed`;

            if (lastFailureMessage.includes('flagged as inappropriate') && retryLevel < 2) {
              retryLevel++;
              console.log(`[Film Generation] NSFW retry ${retryLevel}/2 for clip ${i + 1}`);
              visualPrompt = await convertToVisualPrompt(
                sceneText,
                cinematicStyle,
                theme,
                i,
                scenes.length,
                retryLevel as 1 | 2,
                characterSheet,
                previousVisualPrompt,
              );
              continue;
            }

            if (clipAttempt < FILM_CLIP_TRANSIENT_RETRIES && isTransientClipFailure(lastFailureMessage)) {
              shouldRetryClip = true;
              break;
            }

            throw clipError;
          }

          if (result.status === 'failed' && result.error?.includes('flagged as inappropriate') && retryLevel < 2) {
            retryLevel++;
            console.log(`[Film Generation] NSFW retry ${retryLevel}/2 for clip ${i + 1}`);
            visualPrompt = await convertToVisualPrompt(
              sceneText,
              cinematicStyle,
              theme,
              i,
              scenes.length,
              retryLevel as 1 | 2,
              characterSheet,
              previousVisualPrompt,
            );
          } else {
            break;
          }
        } while (retryLevel <= 2);

        if (result?.status === 'completed') {
          break;
        }

        if (result?.status === 'failed' && result.error?.includes('flagged as inappropriate')) {
          throw new Error(`Scene ${i + 1} was flagged by content moderation after 3 attempts. Try modifying the story content.`);
        }

        if (result?.status === 'processing') {
          lastFailureMessage = result.error || `Clip ${i + 1} generation timeout`;
          shouldRetryClip =
            clipAttempt < FILM_CLIP_TRANSIENT_RETRIES && isTransientClipFailure(lastFailureMessage);
        } else if (result?.status === 'failed') {
          lastFailureMessage = result.error || `Clip ${i + 1} generation failed`;
          shouldRetryClip =
            clipAttempt < FILM_CLIP_TRANSIENT_RETRIES && isTransientClipFailure(lastFailureMessage);
        }

        if (shouldRetryClip) {
          clipAttempt++;
          console.warn(
            `[Film Generation] Retrying clip ${i + 1}/${scenes.length} after transient failure (${clipAttempt}/${FILM_CLIP_TRANSIENT_RETRIES}): ${lastFailureMessage}`,
          );
          result = undefined;
          continue;
        }

        if (result?.status === 'failed') {
          throw new Error(lastFailureMessage || result.error || `Clip ${i + 1} generation failed`);
        }

        if (result?.status === 'processing') {
          throw new Error(lastFailureMessage || `Clip ${i + 1} generation timeout`);
        }

        throw new Error(lastFailureMessage || `Clip ${i + 1} generation failed`);
      }

      if (!result || result.status !== 'completed') {
        throw new Error(lastFailureMessage || `Clip ${i + 1} generation failed`);
      }

      clips.push({
        url: result.videoUrl,
        order: i,
        duration: clipDuration,
      });
      previousVisualPrompt = visualPrompt;

      console.log(`[Film Generation] Clip ${i + 1}/${scenes.length} complete:`, result.videoUrl);
    }

    // Single clip without narration — return directly
    if (clips.length === 1 && !narrationAudioPath) {
      console.log('[Film Generation] Single clip, no stitching needed');
      return {
        videoUrl: clips[0].url,
        transcript: storyText,
        clipCount: 1,
        totalDuration: clipDuration,
      };
    }

    // Step 6: Stitch clips + overlay narration audio
    if (onProgress) onProgress('Stitching clips + adding audio...', 85);
    console.log(`[Film Generation] Stitching ${clips.length} clips together...`);

    const stitchResult = await stitchVideos(clips, {
      outputFormat: 'mp4',
      resolution: '720p',
      fps: 30,
      addTransitions: enableTransitions,
      transitionDuration: 0.5,
      backgroundMusic,
      musicVolume,
      selectedMusicTrack,
      addSubtitles,
      subtitleFontSize,
      subtitlePosition,
      subtitleColor,
      sceneTexts: scenes,
      clipDuration,
      narrationAudioPath,
    });

    if (onProgress) onProgress('Video generation complete', 100);
    console.log('[Film Generation] Stitching complete:', stitchResult.videoUrl);

    return {
      videoUrl: stitchResult.videoUrl,
      transcript: storyText,
      clipCount: stitchResult.clipCount,
      totalDuration: stitchResult.duration,
    };

  } catch (error) {
    console.error("[Film Generation] Error:", error);
    
    // Provide helpful error messages
    if (error instanceof Error) {
      if (error.message.includes('authentication failed')) {
        throw new Error("Higgsfield API authentication failed. Please check your API credentials.");
      } else if (error.message.includes('rate limit')) {
        throw new Error("Higgsfield API rate limit exceeded. Please try again later.");
      }
    }
    
    throw new Error(`Failed to generate film video: ${error instanceof Error ? error.message : String(error)}`);
  } finally {
    if (narrationAudioPath) {
      await fs.unlink(narrationAudioPath).catch(() => {});
    }
  }
}

/**
 * Generate a preview (short sample) of the story
 */
export async function generatePreview(params: StoryGenerationParams): Promise<string> {
  const { targetLanguage, proficiencyLevel, vocabularyWords, theme } = params;

  const systemPrompt = `You are an expert language learning content creator. Generate a brief, engaging preview (2-3 sentences) of a ${theme.toLowerCase()} story in ${targetLanguage} at ${proficiencyLevel} level that would use these vocabulary words: ${vocabularyWords.slice(0, 3).join(", ")}.

The preview should hook the learner and make them excited to generate the full story.`;

  const response = await invokeLLM({
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: "Generate the story preview." },
    ],
  });

  const preview = response.choices[0]?.message?.content;
  if (!preview || typeof preview !== "string") throw new Error("No preview generated");

  return preview;
}
