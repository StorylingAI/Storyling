import { storagePut } from "./storage";
import { isSpanishLanguage } from "@shared/languagePreferences";

/**
 * Generate audio for Chinese character with tone using ElevenLabs Turbo v2.5
 * Uses language code "zh" and sends pinyin to improve tone accuracy
 */
export async function generateChineseToneAudioElevenLabs(
  character: string,
  pinyin: string
): Promise<string> {
  const voiceId = "bhJUNIXWQQ94l8eI2VUf"; // Amy (native Beijing Mandarin)
  
  try {
    // Use Turbo v2.5 model with language code as suggested by ElevenLabs community
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
        },
        body: JSON.stringify({
          text: pinyin, // Send pinyin with tone marks instead of character
          model_id: "eleven_turbo_v2_5", // Use Turbo v2.5 for better Chinese support
          language_code: "zh", // Explicitly specify Chinese
          voice_settings: {
            stability: 0.70,
            similarity_boost: 0.90,
            style: 0.20,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const audioData = Buffer.from(audioBuffer);

    // Upload to S3
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    const safeCharacter = character.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, "_");
    const fileKey = `tone-audio-elevenlabs/${safeCharacter}-${pinyin}-${timestamp}-${randomSuffix}.mp3`;

    const { url: audioUrl } = await storagePut(fileKey, audioData, "audio/mpeg");

    return audioUrl;
  } catch (error) {
    console.error("Error generating Chinese tone audio:", error);
    throw new Error("Failed to generate Chinese tone audio");
  }
}

/**
 * Generate audio pronunciation for a single word
 * Uses Google Cloud TTS for Chinese (accurate tones), ElevenLabs for other languages
 */
export async function generateWordAudio(
  word: string,
  targetLanguage: string,
  voiceId?: string
): Promise<string> {
  const languageKey = targetLanguage.toLowerCase().split(" ")[0];
  const googleSupportedLanguages = new Set([
    "arabic",
    "chinese",
    "danish",
    "dutch",
    "english",
    "farsi",
    "french",
    "german",
    "hebrew",
    "hindi",
    "italian",
    "japanese",
    "korean",
    "mandarin",
    "norwegian",
    "persian",
    "portuguese",
    "russian",
    "spanish",
    "swedish",
    "turkish",
  ]);
  
  // Prefer Google Cloud TTS for languages where exact language codes are available.
  if (
    googleSupportedLanguages.has(languageKey) ||
    isSpanishLanguage(targetLanguage) ||
    targetLanguage.toLowerCase().includes("chinese") ||
    targetLanguage.toLowerCase().includes("mandarin")
  ) {
    try {
      const { generateWordAudioGoogleCloud } = await import("./googleCloudTTS");
      return await generateWordAudioGoogleCloud(word, targetLanguage);
    } catch (error) {
      console.warn(
        `[Word Audio] Google Cloud TTS failed for ${targetLanguage}; falling back to ElevenLabs:`,
        error instanceof Error ? error.message : String(error),
      );
    }
  }
  
  // Use ElevenLabs for other languages
  // Default voice IDs for different languages
  const defaultVoiceMap: Record<string, string> = {
    spanish: "EXAVITQu4vr4xnSDxMaL", // Sarah (supports Spanish)
    french: "21m00Tcm4TlvDq8ikWAM", // Rachel (supports French)
    german: "ThT5KcBeYPX3keUQqHPh", // Dorothy (supports German)
    japanese: "AZnzlk1XvdvUeBnXmlld", // Domi (supports Japanese)
    korean: "onwK4e9ZLuTAKqWW03F9", // Daniel (supports Korean)
    arabic: "Qp2PG6sgef1EHtrNQKnf",
    hebrew: "pNInz6obpgDQGcFmaJgB",
    persian: "pNInz6obpgDQGcFmaJgB",
    farsi: "pNInz6obpgDQGcFmaJgB",
    turkish: "pNInz6obpgDQGcFmaJgB",
    hindi: "pNInz6obpgDQGcFmaJgB",
    dutch: "pNInz6obpgDQGcFmaJgB",
    swedish: "pNInz6obpgDQGcFmaJgB",
    norwegian: "pNInz6obpgDQGcFmaJgB",
    danish: "pNInz6obpgDQGcFmaJgB",
    default: "EXAVITQu4vr4xnSDxMaL", // Sarah (multilingual)
  };

  const selectedVoiceId = voiceId || defaultVoiceMap[languageKey] || defaultVoiceMap.default;

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${selectedVoiceId}`,
      {
        method: "POST",
        headers: {
          Accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
        },
        body: JSON.stringify({
          text: word,
          model_id: "eleven_multilingual_v2",
          voice_settings: {
            stability: 0.60,
            similarity_boost: 0.85,
            style: 0.30,
            use_speaker_boost: true,
          },
        }),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error("ElevenLabs API error:", response.status, errorText);
      throw new Error(`ElevenLabs API error: ${response.statusText}`);
    }

    const audioBuffer = await response.arrayBuffer();
    const audioData = Buffer.from(audioBuffer);

    // Upload to S3
    const timestamp = Date.now();
    const randomSuffix = Math.random().toString(36).substring(7);
    const safeWord = word.replace(/[^a-zA-Z0-9\u4e00-\u9fff]/g, "_");
    const fileKey = `word-audio/${safeWord}-${timestamp}-${randomSuffix}.mp3`;

    const { url: audioUrl } = await storagePut(fileKey, audioData, "audio/mpeg");

    return audioUrl;
  } catch (error) {
    console.error("Error generating word audio:", error);
    throw new Error("Failed to generate word audio");
  }
}

/**
 * Generate audio for multiple words in batch
 */
export async function generateBatchWordAudio(
  words: string[],
  targetLanguage: string
): Promise<Record<string, string>> {
  const audioUrls: Record<string, string> = {};

  // Process words sequentially to avoid rate limiting
  for (const word of words) {
    try {
      const audioUrl = await generateWordAudio(word, targetLanguage);
      audioUrls[word] = audioUrl;
      
      // Add small delay to avoid rate limiting
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      console.error(`Failed to generate audio for word: ${word}`, error);
      // Continue with other words even if one fails
    }
  }

  return audioUrls;
}
