import { storagePut } from "./storage";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Tone instruction mapping for Chinese pronunciation
 * These instructions explicitly guide the TTS model to produce correct pitch contours
 */
const CHINESE_TONE_INSTRUCTIONS: Record<number, string> = {
  1: "Speak with a high, level pitch throughout the syllable, maintaining the same pitch from start to finish.",
  2: "Start at a mid pitch and rise smoothly to a high pitch, like asking a question in English.",
  3: "Start at mid pitch, dip down to a low pitch, then rise back up. This creates a falling-rising contour.",
  4: "Start at a high pitch and fall sharply and quickly to a low pitch, like a command.",
};

/**
 * Generate audio pronunciation for a Chinese character with specific tone
 * Uses OpenAI TTS with explicit tone instructions for accurate Chinese pronunciation
 */
export async function generateChineseToneAudio(
  character: string,
  tone: 1 | 2 | 3 | 4,
  pinyin: string
): Promise<string> {
  try {
    const toneInstruction = CHINESE_TONE_INSTRUCTIONS[tone];
    
    // Create the audio with explicit tone instructions
    const response = await openai.audio.speech.create({
      model: "gpt-4o-audio-2025-12-15", // This model supports instructions parameter
      voice: "coral", // Using coral voice for clear pronunciation
      input: character,
      instructions: `You are pronouncing a single Mandarin Chinese character. The pinyin is "${pinyin}". ${toneInstruction} Pronounce only this one character clearly and naturally.`,
      response_format: "mp3",
    });

    // Convert response to buffer
    const audioBuffer = Buffer.from(await response.arrayBuffer());

    // Upload to S3
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    const safeCharacter = character.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, "_");
    const fileKey = `tone-audio/${safeCharacter}-${pinyin}-tone${tone}-${timestamp}-${randomSuffix}.mp3`;

    const { url: audioUrl } = await storagePut(fileKey, audioBuffer, "audio/mpeg");

    return audioUrl;
  } catch (error) {
    console.error("Error generating Chinese tone audio:", error);
    throw new Error("Failed to generate Chinese tone audio");
  }
}

/**
 * Generate audio pronunciation for a word using OpenAI TTS
 * General purpose function for non-tone-specific pronunciation
 */
export async function generateWordAudioOpenAI(
  word: string,
  targetLanguage: string
): Promise<string> {
  try {
    const response = await openai.audio.speech.create({
      model: "gpt-4o-audio-2025-12-15", // This model supports instructions parameter
      voice: "coral",
      input: word,
      instructions: `Pronounce this ${targetLanguage} word clearly and naturally.`,
      response_format: "mp3",
    });

    const audioBuffer = Buffer.from(await response.arrayBuffer());

    // Upload to S3
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    const safeWord = word.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, "_");
    const fileKey = `word-audio-openai/${safeWord}-${timestamp}-${randomSuffix}.mp3`;

    const { url: audioUrl } = await storagePut(fileKey, audioBuffer, "audio/mpeg");

    return audioUrl;
  } catch (error) {
    console.error("Error generating word audio with OpenAI:", error);
    throw new Error("Failed to generate word audio");
  }
}
