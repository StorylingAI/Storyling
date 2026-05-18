// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import {
  loadCreateStoryDraft,
  resolveDraftValue,
  saveCreateStoryDraft,
} from "./createStoryDraft";

describe("create story draft persistence", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("restores saved draft values across navigation", () => {
    saveCreateStoryDraft({
      step: 2,
      targetLanguage: "Spanish",
      spanishDialect: "spain",
      proficiencyLevel: "A2",
      vocabularyText: "poder, acordarse, volver",
      mode: "podcast",
    });

    expect(loadCreateStoryDraft()).toMatchObject({
      step: 2,
      targetLanguage: "Spanish",
      spanishDialect: "spain",
      proficiencyLevel: "A2",
      vocabularyText: "poder, acordarse, volver",
      mode: "podcast",
    });
  });

  it("lets URL prefill values override the saved draft", () => {
    expect(resolveDraftValue("French", "Spanish", "")).toBe("French");
    expect(resolveDraftValue(null, "Spanish", "")).toBe("Spanish");
    expect(resolveDraftValue(null, undefined, "A1")).toBe("A1");
  });
});
