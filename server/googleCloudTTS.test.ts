import { describe, it, expect } from "vitest";
import { generateChineseToneAudioGoogleCloud } from "./googleCloudTTS";

describe("Google Cloud TTS Integration", () => {
  it("should generate audio for Chinese character with tone", async () => {
    // Test with first tone character 妈 (mā - mother)
    const audioUrl = await generateChineseToneAudioGoogleCloud("妈", "mā");
    
    // Verify that we got a valid URL back
    expect(audioUrl).toBeTruthy();
    expect(typeof audioUrl).toBe("string");
    expect(audioUrl).toMatch(/^https?:\/\//);
    
    // Verify the URL contains expected patterns
    expect(audioUrl).toContain(".mp3");
    
    console.log("✓ Google Cloud TTS API key is valid");
    console.log("✓ Successfully generated audio for 妈 (mā)");
    console.log(`Audio URL: ${audioUrl}`);
  }, 30000); // 30 second timeout for API call
});
