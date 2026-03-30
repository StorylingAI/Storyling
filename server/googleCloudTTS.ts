import { storagePut } from "./storage";

// Google Cloud TTS REST API endpoint
const GOOGLE_TTS_API_URL = "https://texttospeech.googleapis.com/v1/text:synthesize";

/**
 * Generate audio for Chinese character with accurate tone using Google Cloud TTS
 * Uses WaveNet voices which are trained on native speaker recordings
 */
export async function generateChineseToneAudioGoogleCloud(
  character: string,
  pinyin: string
): Promise<string> {
  try {
    const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_CLOUD_API_KEY environment variable is not set");
    }

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
    const apiKey = process.env.GOOGLE_CLOUD_API_KEY;
    if (!apiKey) {
      throw new Error("GOOGLE_CLOUD_API_KEY environment variable is not set");
    }

    // Map target language to Google Cloud language codes
    const languageCodeMap: Record<string, string> = {
      chinese: "cmn-CN",
      spanish: "es-ES",
      french: "fr-FR",
      german: "de-DE",
      japanese: "ja-JP",
      korean: "ko-KR",
    };

    const languageKey = targetLanguage.toLowerCase().split(" ")[0];
    const languageCode = languageCodeMap[languageKey] || "en-US";

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
