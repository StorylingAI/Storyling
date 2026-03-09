import { describe, it, expect } from "vitest";
import { calculateDifficultyLevel, getDifficultyColor } from "./difficultyLevel";

describe("Difficulty Level Calculation", () => {
  describe("calculateDifficultyLevel", () => {
    it("should map CEFR to HSK for Chinese", () => {
      expect(calculateDifficultyLevel("Chinese", "A1")).toBe("HSK 1");
      expect(calculateDifficultyLevel("Chinese", "A2")).toBe("HSK 2");
      expect(calculateDifficultyLevel("Chinese", "B1")).toBe("HSK 3");
      expect(calculateDifficultyLevel("Chinese", "B2")).toBe("HSK 4");
      expect(calculateDifficultyLevel("Chinese", "C1")).toBe("HSK 5");
      expect(calculateDifficultyLevel("Chinese", "C2")).toBe("HSK 6");
    });

    it("should map CEFR to HSK for Mandarin", () => {
      expect(calculateDifficultyLevel("Mandarin", "A1")).toBe("HSK 1");
      expect(calculateDifficultyLevel("Mandarin", "B1")).toBe("HSK 3");
    });

    it("should return CEFR for other languages", () => {
      expect(calculateDifficultyLevel("Spanish", "A1")).toBe("A1");
      expect(calculateDifficultyLevel("French", "B2")).toBe("B2");
      expect(calculateDifficultyLevel("German", "C1")).toBe("C1");
      expect(calculateDifficultyLevel("Japanese", "A2")).toBe("A2");
    });

    it("should handle case-insensitive language names", () => {
      expect(calculateDifficultyLevel("chinese", "A1")).toBe("HSK 1");
      expect(calculateDifficultyLevel("CHINESE", "A2")).toBe("HSK 2");
      expect(calculateDifficultyLevel("mandarin", "B1")).toBe("HSK 3");
    });
  });

  describe("getDifficultyColor", () => {
    it("should return green for beginner HSK levels", () => {
      const hsk1 = getDifficultyColor("HSK 1");
      expect(hsk1.bg).toBe("bg-green-100");
      expect(hsk1.text).toBe("text-green-700");
      expect(hsk1.border).toBe("border-green-300");

      const hsk2 = getDifficultyColor("HSK 2");
      expect(hsk2.bg).toBe("bg-green-100");
    });

    it("should return yellow for intermediate HSK levels", () => {
      const hsk3 = getDifficultyColor("HSK 3");
      expect(hsk3.bg).toBe("bg-yellow-100");
      expect(hsk3.text).toBe("text-yellow-700");

      const hsk4 = getDifficultyColor("HSK 4");
      expect(hsk4.bg).toBe("bg-yellow-100");
    });

    it("should return red for advanced HSK levels", () => {
      const hsk5 = getDifficultyColor("HSK 5");
      expect(hsk5.bg).toBe("bg-red-100");
      expect(hsk5.text).toBe("text-red-700");

      const hsk6 = getDifficultyColor("HSK 6");
      expect(hsk6.bg).toBe("bg-red-100");
    });

    it("should return green for CEFR A levels", () => {
      const a1 = getDifficultyColor("A1");
      expect(a1.bg).toBe("bg-green-100");

      const a2 = getDifficultyColor("A2");
      expect(a2.bg).toBe("bg-green-100");
    });

    it("should return yellow for CEFR B levels", () => {
      const b1 = getDifficultyColor("B1");
      expect(b1.bg).toBe("bg-yellow-100");

      const b2 = getDifficultyColor("B2");
      expect(b2.bg).toBe("bg-yellow-100");
    });

    it("should return red for CEFR C levels", () => {
      const c1 = getDifficultyColor("C1");
      expect(c1.bg).toBe("bg-red-100");

      const c2 = getDifficultyColor("C2");
      expect(c2.bg).toBe("bg-red-100");
    });

    it("should return gray for unknown levels", () => {
      const unknown = getDifficultyColor("Unknown");
      expect(unknown.bg).toBe("bg-gray-100");
      expect(unknown.text).toBe("text-gray-700");
      expect(unknown.border).toBe("border-gray-300");
    });
  });
});
