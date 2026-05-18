import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  fetch: vi.fn(),
  generateSpeechGoogleCloud: vi.fn(),
  storagePut: vi.fn(),
}));

vi.mock("./googleCloudTTS", () => ({
  generateSpeechGoogleCloud: mocks.generateSpeechGoogleCloud,
}));

vi.mock("./storage", () => ({
  storagePut: mocks.storagePut,
}));

import { generatePodcast } from "./contentGeneration";

describe("generatePodcast", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal("fetch", mocks.fetch);
    process.env.ELEVENLABS_API_KEY = "test-elevenlabs-key";
    mocks.storagePut.mockResolvedValue({ url: "https://cdn.example.com/podcast.mp3" });
    mocks.generateSpeechGoogleCloud.mockResolvedValue("https://cdn.example.com/google.mp3");
  });

  it("uses ElevenLabs timestamps before Google TTS for Spanish podcasts", async () => {
    const alignment = {
      characters: ["H", "o", "l", "a"],
      character_start_times_seconds: [0, 0.1, 0.2, 0.3],
      character_end_times_seconds: [0.1, 0.2, 0.3, 0.4],
    };

    mocks.fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        audio_base64: Buffer.from("audio").toString("base64"),
        normalized_alignment: alignment,
      }),
      text: async () => "",
    });

    const result = await generatePodcast(
      {
        targetLanguage: "Spanish",
        proficiencyLevel: "A2",
        vocabularyWords: ["poder", "acordarse"],
        theme: "Slice-of-Life",
        voiceType: "Warm & Friendly",
        narratorGender: "female",
      },
      "Hola mundo.",
    );

    expect(mocks.fetch).toHaveBeenCalledWith(
      expect.stringContaining("/with-timestamps"),
      expect.any(Object),
    );
    expect(mocks.generateSpeechGoogleCloud).not.toHaveBeenCalled();
    expect(result.audioUrl).toBe("https://cdn.example.com/podcast.mp3");
    expect(result.audioAlignment).toEqual(alignment);
  });
});
