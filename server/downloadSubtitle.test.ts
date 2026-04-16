import { describe, expect, it } from "vitest";
import { generateSrtContent } from "./downloadRouter";

describe("generateSrtContent", () => {
  it("exports timed transcript segments starting at zero", () => {
    const srt = generateSrtContent({
      transcript: JSON.stringify({
        segments: [
          { startTime: 0, endTime: 2.5, text: "Hello world" },
        ],
      }),
    });

    expect(srt).toContain("1\n00:00:00,000 --> 00:00:02,500");
    expect(srt).toContain("Hello world");
  });

  it("exports subtitles from plain text film transcripts", () => {
    const srt = generateSrtContent({
      transcript: "Un matin, Marc regarde l'ocean. Il prepare son bateau.",
      storyText: "Un matin, Marc regarde l'ocean. Il prepare son bateau.",
    });

    expect(srt).toContain("1\n00:00:00,000 -->");
    expect(srt).toContain("Un matin, Marc regarde l'ocean.");
    expect(srt).toContain("Il prepare son bateau.");
  });
});
