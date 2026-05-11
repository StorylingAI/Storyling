// @vitest-environment jsdom

import { beforeEach, describe, expect, it } from "vitest";
import {
  getTrackedContentGenerationIds,
  trackContentGeneration,
  untrackContentGenerations,
} from "./generationTracking";

describe("generationTracking", () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.sessionStorage.clear();
  });

  it("should persist tracked generations in localStorage so navigation and reloads keep notifications alive", () => {
    trackContentGeneration(43);
    trackContentGeneration(44);
    untrackContentGenerations([43]);

    expect(getTrackedContentGenerationIds()).toEqual([44]);
    expect(window.localStorage.getItem("storyling:tracked-content-generations")).toBe("[44]");
    expect(window.sessionStorage.getItem("storyling:tracked-content-generations")).toBeNull();
  });
});
