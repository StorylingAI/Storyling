import { describe, it, expect } from "vitest";
import { calculateSM2, answerToQuality } from "./spacedRepetition";

describe("Spaced Repetition System", () => {
  describe("answerToQuality", () => {
    it("should convert correct answer to quality 4", () => {
      expect(answerToQuality(true)).toBe(4);
    });

    it("should convert incorrect answer to quality 1", () => {
      expect(answerToQuality(false)).toBe(1);
    });
  });

  describe("calculateSM2", () => {
    it("should calculate next review for new word (repetition 0)", () => {
      const result = calculateSM2(4, {
        repetitions: 0,
        easinessFactor: 2500, // 2.5 stored as integer
        interval: 0,
        nextReviewDate: new Date(),
      });

      expect(result.repetitions).toBe(1);
      expect(result.interval).toBe(1); // 1 day for first review
      expect(result.easinessFactor / 1000).toBeGreaterThanOrEqual(2.5);
    });

    it("should calculate next review for second repetition", () => {
      const result = calculateSM2(4, {
        repetitions: 1,
        easinessFactor: 2500,
        interval: 1,
        nextReviewDate: new Date(),
      });

      expect(result.repetitions).toBe(2);
      expect(result.interval).toBe(6); // 6 days for second review
    });

    it("should calculate next review for subsequent repetitions", () => {
      const result = calculateSM2(4, {
        repetitions: 2,
        easinessFactor: 2500,
        interval: 6,
        nextReviewDate: new Date(),
      });

      expect(result.repetitions).toBe(3);
      expect(result.interval).toBe(15); // 6 * 2.5 = 15 days
    });

    it("should reset repetitions on incorrect answer (quality < 3)", () => {
      const result = calculateSM2(2, {
        repetitions: 5,
        easinessFactor: 2500,
        interval: 30,
        nextReviewDate: new Date(),
      });

      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(1); // Reset to 1 day
    });

    it("should adjust ease factor based on quality", () => {
      // Quality 5 should increase ease factor
      const result1 = calculateSM2(5, {
        repetitions: 2,
        easinessFactor: 2500,
        interval: 6,
        nextReviewDate: new Date(),
      });
      expect(result1.easinessFactor / 1000).toBeGreaterThan(2.5);

      // Quality 3 should decrease ease factor
      const result2 = calculateSM2(3, {
        repetitions: 2,
        easinessFactor: 2500,
        interval: 6,
        nextReviewDate: new Date(),
      });
      expect(result2.easinessFactor / 1000).toBeLessThan(2.5);
    });

    it("should maintain minimum ease factor of 1.3", () => {
      const result = calculateSM2(0, {
        repetitions: 2,
        easinessFactor: 1400, // 1.4
        interval: 6,
        nextReviewDate: new Date(),
      });

      expect(result.easinessFactor / 1000).toBeGreaterThanOrEqual(1.3);
    });

    it("should calculate correct next review date", () => {
      const now = new Date();
      const result = calculateSM2(4, {
        repetitions: 2,
        easinessFactor: 2500,
        interval: 6,
        nextReviewDate: now,
      });

      const expectedDate = new Date(now);
      expectedDate.setDate(expectedDate.getDate() + result.interval);

      // Check that dates are close (within 1 second)
      const timeDiff = Math.abs(result.nextReviewDate.getTime() - expectedDate.getTime());
      expect(timeDiff).toBeLessThan(2000); // 2 seconds tolerance
    });
  });

  describe("SM-2 Algorithm Edge Cases", () => {
    it("should handle quality value of 0", () => {
      const result = calculateSM2(0, {
        repetitions: 3,
        easinessFactor: 2500,
        interval: 15,
        nextReviewDate: new Date(),
      });

      expect(result.repetitions).toBe(0);
      expect(result.interval).toBe(1);
    });

    it("should handle quality value of 5", () => {
      const result = calculateSM2(5, {
        repetitions: 3,
        easinessFactor: 2500,
        interval: 15,
        nextReviewDate: new Date(),
      });

      expect(result.repetitions).toBe(4);
      expect(result.easinessFactor / 1000).toBeGreaterThan(2.5);
    });

    it("should handle very high repetition count", () => {
      const result = calculateSM2(4, {
        repetitions: 20,
        easinessFactor: 2800, // 2.8
        interval: 180,
        nextReviewDate: new Date(),
      });

      expect(result.repetitions).toBe(21);
      expect(result.interval).toBeGreaterThan(180);
    });
  });
});
