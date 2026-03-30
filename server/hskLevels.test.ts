import { describe, it, expect } from "vitest";
import {
  getWordFrequency,
  getHSKLabel,
  getFrequencyLabel,
  getHSKBadgeColor,
  getFrequencyBadgeColor,
} from "./hskLevels";

describe("HSK Level and Frequency", () => {
  describe("getWordFrequency", () => {
    it("should return HSK 1 for basic words", () => {
      const result = getWordFrequency("你");
      expect(result.hskLevel).toBe(1);
      expect(result.frequency).toBe("very_common");
    });

    it("should return HSK 2 for elementary words", () => {
      const result = getWordFrequency("但是");
      expect(result.hskLevel).toBe(2);
      expect(result.frequency).toBe("very_common");
    });

    it("should return HSK 3 for intermediate words", () => {
      const result = getWordFrequency("开会");
      expect(result.hskLevel).toBe(3);
      expect(result.frequency).toBe("common");
    });

    it("should return HSK 4 for upper intermediate words", () => {
      const result = getWordFrequency("由于");
      expect(result.hskLevel).toBe(4);
      expect(result.frequency).toBe("common");
    });

    it("should return HSK 5 for advanced words", () => {
      const result = getWordFrequency("基于");
      expect(result.hskLevel).toBe(5);
      expect(result.frequency).toBe("uncommon");
    });

    it("should return HSK 6 for mastery words", () => {
      const result = getWordFrequency("鉴于");
      expect(result.hskLevel).toBe(6);
      expect(result.frequency).toBe("uncommon");
    });

    it("should return null HSK level for unknown words", () => {
      const result = getWordFrequency("未知词汇");
      expect(result.hskLevel).toBeNull();
      expect(result.frequency).toBe("rare");
    });
  });

  describe("getHSKLabel", () => {
    it("should return correct labels for each HSK level", () => {
      expect(getHSKLabel(1)).toBe("HSK 1");
      expect(getHSKLabel(2)).toBe("HSK 2");
      expect(getHSKLabel(3)).toBe("HSK 3");
      expect(getHSKLabel(4)).toBe("HSK 4");
      expect(getHSKLabel(5)).toBe("HSK 5");
      expect(getHSKLabel(6)).toBe("HSK 6");
    });

    it("should return 'Not in HSK' for null level", () => {
      expect(getHSKLabel(null)).toBe("Not in HSK");
    });
  });

  describe("getFrequencyLabel", () => {
    it("should return correct labels for each frequency", () => {
      expect(getFrequencyLabel("very_common")).toBe("Very Common");
      expect(getFrequencyLabel("common")).toBe("Common");
      expect(getFrequencyLabel("uncommon")).toBe("Uncommon");
      expect(getFrequencyLabel("rare")).toBe("Rare");
    });
  });

  describe("getHSKBadgeColor", () => {
    it("should return green for HSK 1-2", () => {
      expect(getHSKBadgeColor(1)).toBe("green");
      expect(getHSKBadgeColor(2)).toBe("green");
    });

    it("should return yellow for HSK 3-4", () => {
      expect(getHSKBadgeColor(3)).toBe("yellow");
      expect(getHSKBadgeColor(4)).toBe("yellow");
    });

    it("should return red for HSK 5-6", () => {
      expect(getHSKBadgeColor(5)).toBe("red");
      expect(getHSKBadgeColor(6)).toBe("red");
    });

    it("should return gray for null level", () => {
      expect(getHSKBadgeColor(null)).toBe("gray");
    });
  });

  describe("getFrequencyBadgeColor", () => {
    it("should return correct colors for each frequency", () => {
      expect(getFrequencyBadgeColor("very_common")).toBe("green");
      expect(getFrequencyBadgeColor("common")).toBe("blue");
      expect(getFrequencyBadgeColor("uncommon")).toBe("yellow");
      expect(getFrequencyBadgeColor("rare")).toBe("red");
    });
  });
});
