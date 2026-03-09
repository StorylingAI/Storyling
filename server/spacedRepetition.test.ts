import { describe, it, expect } from "vitest";
import {
  calculateSM2,
  answerToQuality,
  getWordsDueForReview,
  prioritizeWordsForQuiz,
  calculateMasteryLevel,
  type WordMasteryData,
} from "./spacedRepetition";

describe("Spaced Repetition System", () => {
  describe("calculateSM2", () => {
    it("should increase interval on successful recall (quality >= 3)", () => {
      const initial: WordMasteryData = {
        easinessFactor: 2500, // 2.5
        interval: 0,
        repetitions: 0,
        nextReviewDate: new Date(),
      };

      const result = calculateSM2(4, initial);

      expect(result.interval).toBe(1); // First successful review: 1 day
      expect(result.repetitions).toBe(1);
      expect(result.easinessFactor).toBeGreaterThanOrEqual(2500); // EF should stay same or increase
    });

    it("should reset interval on failed recall (quality < 3)", () => {
      const initial: WordMasteryData = {
        easinessFactor: 2500,
        interval: 6,
        repetitions: 2,
        nextReviewDate: new Date(),
      };

      const result = calculateSM2(2, initial);

      expect(result.interval).toBe(1); // Reset to 1 day
      expect(result.repetitions).toBe(0); // Reset repetitions
      expect(result.easinessFactor).toBeLessThan(2500); // EF should decrease
    });

    it("should follow SM-2 interval progression (1, 6, then EF-based)", () => {
      let data: WordMasteryData = {
        easinessFactor: 2500,
        interval: 0,
        repetitions: 0,
        nextReviewDate: new Date(),
      };

      // First successful review
      data = calculateSM2(4, data);
      expect(data.interval).toBe(1);
      expect(data.repetitions).toBe(1);

      // Second successful review
      data = calculateSM2(4, data);
      expect(data.interval).toBe(6);
      expect(data.repetitions).toBe(2);

      // Third successful review (EF-based)
      const thirdResult = calculateSM2(4, data);
      expect(thirdResult.interval).toBeGreaterThan(6);
      expect(thirdResult.repetitions).toBe(3);
    });

    it("should maintain minimum EF of 1.3", () => {
      const initial: WordMasteryData = {
        easinessFactor: 1300, // Already at minimum
        interval: 1,
        repetitions: 0,
        nextReviewDate: new Date(),
      };

      const result = calculateSM2(0, initial); // Very poor quality

      expect(result.easinessFactor).toBeGreaterThanOrEqual(1300);
    });

    it("should calculate correct next review date", () => {
      const now = new Date();
      const initial: WordMasteryData = {
        easinessFactor: 2500,
        interval: 0,
        repetitions: 0,
        nextReviewDate: now,
      };

      const result = calculateSM2(4, initial);

      const expectedDate = new Date(now);
      expectedDate.setDate(expectedDate.getDate() + 1);

      // Allow 1 second tolerance for test execution time
      const timeDiff = Math.abs(result.nextReviewDate.getTime() - expectedDate.getTime());
      expect(timeDiff).toBeLessThan(1000);
    });
  });

  describe("answerToQuality", () => {
    it("should return 1 for incorrect answers", () => {
      expect(answerToQuality(false)).toBe(1);
      expect(answerToQuality(false, 5)).toBe(1);
    });

    it("should return 5 for fast correct answers (< 3 seconds)", () => {
      expect(answerToQuality(true, 2)).toBe(5);
      expect(answerToQuality(true, 1)).toBe(5);
    });

    it("should return 4 for medium-speed correct answers (3-10 seconds)", () => {
      expect(answerToQuality(true, 5)).toBe(4);
      expect(answerToQuality(true, 8)).toBe(4);
    });

    it("should return 3 for slow correct answers (> 10 seconds)", () => {
      expect(answerToQuality(true, 15)).toBe(3);
      expect(answerToQuality(true, 20)).toBe(3);
    });

    it("should default to 4 when time is not provided", () => {
      expect(answerToQuality(true)).toBe(4);
    });
  });

  describe("getWordsDueForReview", () => {
    it("should return words with nextReviewDate in the past", () => {
      const past = new Date();
      past.setDate(past.getDate() - 1);

      const future = new Date();
      future.setDate(future.getDate() + 1);

      const words: WordMasteryData[] = [
        {
          easinessFactor: 2500,
          interval: 1,
          repetitions: 1,
          nextReviewDate: past,
        },
        {
          easinessFactor: 2500,
          interval: 6,
          repetitions: 2,
          nextReviewDate: future,
        },
      ];

      const due = getWordsDueForReview(words);

      expect(due.length).toBe(1);
      expect(due[0].nextReviewDate).toEqual(past);
    });

    it("should return words with nextReviewDate equal to now", () => {
      const now = new Date();

      const words: WordMasteryData[] = [
        {
          easinessFactor: 2500,
          interval: 1,
          repetitions: 1,
          nextReviewDate: now,
        },
      ];

      const due = getWordsDueForReview(words);

      expect(due.length).toBe(1);
    });

    it("should return empty array when no words are due", () => {
      const future = new Date();
      future.setDate(future.getDate() + 10);

      const words: WordMasteryData[] = [
        {
          easinessFactor: 2500,
          interval: 6,
          repetitions: 2,
          nextReviewDate: future,
        },
      ];

      const due = getWordsDueForReview(words);

      expect(due.length).toBe(0);
    });
  });

  describe("prioritizeWordsForQuiz", () => {
    it("should prioritize words due for review", () => {
      const past = new Date();
      past.setDate(past.getDate() - 1);

      const future = new Date();
      future.setDate(future.getDate() + 1);

      const words = [
        {
          word: "not-due",
          easinessFactor: 2500,
          interval: 6,
          repetitions: 2,
          nextReviewDate: future,
          correctCount: 5,
          incorrectCount: 0,
        },
        {
          word: "due",
          easinessFactor: 2500,
          interval: 1,
          repetitions: 1,
          nextReviewDate: past,
          correctCount: 3,
          incorrectCount: 1,
        },
      ];

      const prioritized = prioritizeWordsForQuiz(words, 1);

      expect(prioritized.length).toBe(1);
      expect(prioritized[0].word).toBe("due");
    });

    it("should prioritize words with high incorrect rate", () => {
      const future = new Date();
      future.setDate(future.getDate() + 1);

      const words = [
        {
          word: "easy",
          easinessFactor: 2500,
          interval: 6,
          repetitions: 2,
          nextReviewDate: future,
          correctCount: 9,
          incorrectCount: 1,
        },
        {
          word: "difficult",
          easinessFactor: 2500,
          interval: 1,
          repetitions: 1,
          nextReviewDate: future,
          correctCount: 3,
          incorrectCount: 7,
        },
      ];

      const prioritized = prioritizeWordsForQuiz(words, 1);

      expect(prioritized.length).toBe(1);
      expect(prioritized[0].word).toBe("difficult");
    });

    it("should prioritize words with low easiness factor", () => {
      const future = new Date();
      future.setDate(future.getDate() + 1);

      const words = [
        {
          word: "easy-word",
          easinessFactor: 2800,
          interval: 10,
          repetitions: 5,
          nextReviewDate: future,
          correctCount: 5,
          incorrectCount: 0,
        },
        {
          word: "hard-word",
          easinessFactor: 1500,
          interval: 1,
          repetitions: 1,
          nextReviewDate: future,
          correctCount: 2,
          incorrectCount: 2,
        },
      ];

      const prioritized = prioritizeWordsForQuiz(words, 1);

      expect(prioritized.length).toBe(1);
      expect(prioritized[0].word).toBe("hard-word");
    });

    it("should prioritize never-reviewed words", () => {
      const future = new Date();
      future.setDate(future.getDate() + 1);

      const words = [
        {
          word: "reviewed",
          easinessFactor: 2500,
          interval: 6,
          repetitions: 2,
          nextReviewDate: future,
          correctCount: 5,
          incorrectCount: 0,
        },
        {
          word: "new",
          easinessFactor: 2500,
          interval: 0,
          repetitions: 0,
          nextReviewDate: new Date(),
          correctCount: 0,
          incorrectCount: 0,
        },
      ];

      const prioritized = prioritizeWordsForQuiz(words, 1);

      expect(prioritized.length).toBe(1);
      expect(prioritized[0].word).toBe("new");
    });

    it("should respect the limit parameter", () => {
      const words = Array.from({ length: 10 }, (_, i) => ({
        word: `word-${i}`,
        easinessFactor: 2500,
        interval: 1,
        repetitions: 0,
        nextReviewDate: new Date(),
        correctCount: 0,
        incorrectCount: 0,
      }));

      const prioritized = prioritizeWordsForQuiz(words, 3);

      expect(prioritized.length).toBe(3);
    });
  });

  describe("calculateMasteryLevel", () => {
    it("should return 0 for words with no attempts", () => {
      const word = {
        easinessFactor: 2500,
        interval: 0,
        repetitions: 0,
        nextReviewDate: new Date(),
        correctCount: 0,
        incorrectCount: 0,
      };

      expect(calculateMasteryLevel(word)).toBe(0);
    });

    it("should calculate mastery based on correct rate", () => {
      const word = {
        easinessFactor: 2500,
        interval: 6,
        repetitions: 2,
        nextReviewDate: new Date(),
        correctCount: 8,
        incorrectCount: 2,
      };

      const mastery = calculateMasteryLevel(word);

      expect(mastery).toBeGreaterThan(0);
      expect(mastery).toBeLessThanOrEqual(100);
    });

    it("should give higher mastery for more repetitions", () => {
      const lowReps = {
        easinessFactor: 2500,
        interval: 1,
        repetitions: 1,
        nextReviewDate: new Date(),
        correctCount: 5,
        incorrectCount: 0,
      };

      const highReps = {
        easinessFactor: 2500,
        interval: 10,
        repetitions: 5,
        nextReviewDate: new Date(),
        correctCount: 5,
        incorrectCount: 0,
      };

      expect(calculateMasteryLevel(highReps)).toBeGreaterThan(calculateMasteryLevel(lowReps));
    });

    it("should give higher mastery for higher easiness factor", () => {
      const lowEF = {
        easinessFactor: 1500,
        interval: 1,
        repetitions: 1,
        nextReviewDate: new Date(),
        correctCount: 5,
        incorrectCount: 0,
      };

      const highEF = {
        easinessFactor: 2800,
        interval: 10,
        repetitions: 5,
        nextReviewDate: new Date(),
        correctCount: 5,
        incorrectCount: 0,
      };

      expect(calculateMasteryLevel(highEF)).toBeGreaterThan(calculateMasteryLevel(lowEF));
    });

    it("should cap mastery at 100", () => {
      const perfectWord = {
        easinessFactor: 3000,
        interval: 100,
        repetitions: 20,
        nextReviewDate: new Date(),
        correctCount: 100,
        incorrectCount: 0,
      };

      expect(calculateMasteryLevel(perfectWord)).toBe(100);
    });
  });
});
