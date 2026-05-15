import { describe, expect, it } from "vitest";
import { SPAIN_SPANISH_LABEL } from "@shared/languagePreferences";
import {
  normalizeWordbankTargetLanguage,
  parseWordImportText,
} from "./wordbankImport";

describe("wordbank import helpers", () => {
  it("normalizes language codes before saving imported words", () => {
    expect(normalizeWordbankTargetLanguage("es")).toBe(SPAIN_SPANISH_LABEL);
    expect(normalizeWordbankTargetLanguage("Spanish")).toBe(SPAIN_SPANISH_LABEL);
    expect(normalizeWordbankTargetLanguage(" Spanish (Spain) ")).toBe(SPAIN_SPANISH_LABEL);
  });

  it("parses pasted or file-loaded words with unicode separators", () => {
    expect(parseWordImportText("hola\nmundo, amigo\uFF1Bcasa\u3001libro")).toEqual([
      "hola",
      "mundo",
      "amigo",
      "casa",
      "libro",
    ]);
  });
});
