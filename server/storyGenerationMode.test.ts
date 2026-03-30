import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import { generateStory } from "./contentGeneration";
import { invokeLLM } from "./_core/llm";

const mockedInvokeLLM = vi.mocked(invokeLLM);

describe("generateStory film mode shaping", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("requests film-friendly beats for video stories", async () => {
    mockedInvokeLLM.mockResolvedValueOnce({
      id: "test",
      created: Date.now(),
      model: "gpt-4o-mini",
      choices: [
        {
          index: 0,
          message: {
            role: "assistant" as const,
            content: JSON.stringify({
              title: "Une arrivee calme",
              titleTranslation: "A calm arrival",
              storyText:
                "Une voyageuse arrive a la gare. Elle marche dans la rue du marche. Elle s arrete pres de la fontaine.",
              vocabularyUsage: {
                gare: ["Une voyageuse arrive a la gare."],
              },
              visualBeats: [
                "Une voyageuse arrive a la gare.",
                "Elle marche dans la rue du marche.",
                "Elle s arrete pres de la fontaine.",
                "Elle observe la place calme.",
                "Elle sourit en regardant les lumieres.",
                "Elle repart tranquillement.",
              ],
              lineTranslations: [
                { original: "Une voyageuse arrive a la gare.", english: "A traveler arrives at the station." },
              ],
              vocabularyTranslations: {
                gare: {
                  word: "gare",
                  translation: "station",
                  exampleSentences: ["La gare est calme."],
                },
              },
            }),
          },
          finish_reason: "stop",
        },
      ],
    });

    const result = await generateStory({
      targetLanguage: "French",
      proficiencyLevel: "B1",
      vocabularyWords: ["gare", "marche", "fontaine", "lumiere", "sourire"],
      theme: "Travel",
      mode: "film",
      targetSceneCount: 6,
      targetVideoDuration: 30,
    });

    expect(result.visualBeats).toHaveLength(6);

    const call = mockedInvokeLLM.mock.calls[0][0];
    const systemPrompt = call.messages.find((message: any) => message.role === "system")?.content;
    const userPrompt = call.messages.find((message: any) => message.role === "user")?.content;

    expect(systemPrompt).toContain("Use minimal dialogue");
    expect(systemPrompt).toContain("Avoid crowds");
    expect(systemPrompt).toContain("visualBeats");
    expect(systemPrompt).toContain("30 seconds");
    expect(systemPrompt).toContain("54-66 words");
    expect(systemPrompt).toContain("smooth progression");
    expect(userPrompt).toContain("film-friendly");
    expect(userPrompt).toContain("exactly 6 visual beats");
    expect(userPrompt).toContain("close to 30 seconds");
    expect(userPrompt).toContain("next shot of the same short film");
  });
});
