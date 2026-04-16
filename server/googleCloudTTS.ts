import { storagePut } from "./storage";
import { isSpainSpanishLanguage } from "@shared/languagePreferences";

// Google Cloud TTS REST API endpoint
const GOOGLE_TTS_API_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";
const GOOGLE_TTS_MAX_CHARS = 4400;

function resolveGoogleCloudApiKey(): string {
  const apiKey =
    process.env.GOOGLE_CLOUD_API_KEY ||
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_VEO_API_KEY;
  if (!apiKey) {
    throw new Error("GOOGLE_CLOUD_API_KEY environment variable is not set");
  }
  return apiKey;
}

function resolveGoogleTtsLanguageCode(targetLanguage: string): string {
  const languageKey = targetLanguage.toLowerCase().split(" ")[0];

  if (targetLanguage.toLowerCase().includes("spanish") || languageKey === "es") {
    return isSpainSpanishLanguage(targetLanguage) ? "es-ES" : "es-US";
  }

  const languageCodeMap: Record<string, string> = {
    chinese: "cmn-CN",
    mandarin: "cmn-CN",
    french: "fr-FR",
    german: "de-DE",
    japanese: "ja-JP",
    korean: "ko-KR",
    portuguese: "pt-PT",
    italian: "it-IT",
    russian: "ru-RU",
    dutch: "nl-NL",
    arabic: "ar-XA",
    english: "en-US",
  };

  return languageCodeMap[languageKey] || "en-US";
}

function splitTextForTts(text: string): string[] {
  const cleanText = text.replace(/\s+/g, " ").trim();
  if (cleanText.length <= GOOGLE_TTS_MAX_CHARS) return [cleanText];

  const sentences = cleanText.match(/[^.!?]+[.!?]?/g) ?? [cleanText];
  const chunks: string[] = [];
  let current = "";

  for (const sentence of sentences) {
    const next = `${current} ${sentence.trim()}`.trim();
    if (next.length <= GOOGLE_TTS_MAX_CHARS) {
      current = next;
      continue;
    }

    if (current) chunks.push(current);
    current = sentence.trim();
  }

  if (current) chunks.push(current);
  return chunks.filter(Boolean);
}

async function synthesizeGoogleCloudChunk(
  text: string,
  targetLanguage: string,
  gender: "male" | "female" = "female"
): Promise<Buffer> {
  const apiKey = resolveGoogleCloudApiKey();
  const languageCode = resolveGoogleTtsLanguageCode(targetLanguage);

  const requestBody = {
    input: { text },
    voice: {
      languageCode,
      ssmlGender: gender.toUpperCase(),
    },
    audioConfig: {
      audioEncoding: "MP3",
      speakingRate: 0.95,
      pitch: 0,
    },
  };

  const response = await fetch(`${GOOGLE_TTS_API_URL}?key=${apiKey}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("Google Cloud TTS API error:", response.status, errorText);
    throw new Error(`Google Cloud TTS API error: ${response.statusText}`);
  }

  const data = await response.json();
  if (!data.audioContent) {
    throw new Error("No audio content received from Google Cloud TTS");
  }

  return Buffer.from(data.audioContent, "base64");
}

export async function synthesizeSpeechGoogleCloud(
  text: string,
  targetLanguage: string,
  gender: "male" | "female" = "female"
): Promise<Buffer> {
  const chunks = splitTextForTts(text);
  const buffers: Buffer[] = [];

  for (const chunk of chunks) {
    buffers.push(await synthesizeGoogleCloudChunk(chunk, targetLanguage, gender));
  }

  return Buffer.concat(buffers);
}

export async function generateSpeechGoogleCloud(
  text: string,
  targetLanguage: string,
  gender: "male" | "female" = "female"
): Promise<string> {
  const audioBuffer = await synthesizeSpeechGoogleCloud(text, targetLanguage, gender);
  const timestamp = Date.now();
  const randomSuffix = Math.random().toString(36).substring(7);
  const safeLanguage = targetLanguage.replace(/[^a-zA-Z0-9]/g, "_");
  const fileKey = `speech-google/${safeLanguage}-${timestamp}-${randomSuffix}.mp3`;

  const { url: audioUrl } = await storagePut(fileKey, audioBuffer, "audio/mpeg");
  return audioUrl;
}

/**
 * Generate audio for Chinese character with accurate tone using Google Cloud TTS
 * Uses WaveNet voices which are trained on native speaker recordings
 */
export async function generateChineseToneAudioGoogleCloud(
  character: string,
  pinyin: string
): Promise<string> {
  try {
    const apiKey = resolveGoogleCloudApiKey();

    // Use WaveNet voice for best tone accuracy
    // cmn-CN-Wavenet-A is a female voice with excellent tone reproduction
    const requestBody = {
      input: { text: character },
      voice: {
        languageCode: "cmn-CN",
        name: "cmn-CN-Wavenet-A", // Female WaveNet voice
      },
      audioConfig: {
        audioEncoding: "MP3",
        speakingRate: 0.9, // Slightly slower for clearer tone distinction
        pitch: 0, // Neutral pitch, let the model handle tones naturally
      },
    };

    const response = await fetch(`${GOOGLE_TTS_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Cloud TTS API error:", response.status, errorText);
      throw new Error(`Google Cloud TTS API error: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.audioContent) {
      throw new Error("No audio content received from Google Cloud TTS");
    }

    // audioContent is base64 encoded
    const audioBuffer = Buffer.from(data.audioContent, "base64");

    // Upload to S3
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    const safeCharacter = character.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, "_");
    const fileKey = `tone-audio-google/${safeCharacter}-${pinyin}-${timestamp}-${randomSuffix}.mp3`;

    const { url: audioUrl } = await storagePut(fileKey, audioBuffer, "audio/mpeg");

    return audioUrl;
  } catch (error) {
    console.error("Error generating Chinese tone audio with Google Cloud TTS:", error);
    throw new Error("Failed to generate Chinese tone audio");
  }
}

/**
 * Generate audio pronunciation for a word using Google Cloud TTS
 * General purpose function for non-tone-specific pronunciation
 */
export async function generateWordAudioGoogleCloud(
  word: string,
  targetLanguage: string
): Promise<string> {
  try {
    const apiKey = resolveGoogleCloudApiKey();
    const languageCode = resolveGoogleTtsLanguageCode(targetLanguage);

    const requestBody = {
      input: { text: word },
      voice: {
        languageCode: languageCode,
        // Use WaveNet voices when available for better quality
        name: languageCode === "cmn-CN" ? "cmn-CN-Wavenet-A" : undefined,
      },
      audioConfig: {
        audioEncoding: "MP3",
      },
    };

    const response = await fetch(`${GOOGLE_TTS_API_URL}?key=${apiKey}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Google Cloud TTS API error:", response.status, errorText);
      throw new Error(`Google Cloud TTS API error: ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.audioContent) {
      throw new Error("No audio content received from Google Cloud TTS");
    }

    const audioBuffer = Buffer.from(data.audioContent, "base64");

    // Upload to S3
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    const safeWord = word.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, "_");
    const fileKey = `word-audio-google/${safeWord}-${timestamp}-${randomSuffix}.mp3`;

    const { url: audioUrl } = await storagePut(fileKey, audioBuffer, "audio/mpeg");

    return audioUrl;
  } catch (error) {
    console.error("Error generating word audio with Google Cloud TTS:", error);
    throw new Error("Failed to generate word audio");
  }
}
