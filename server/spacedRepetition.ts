/**
 * Spaced Repetition System based on SuperMemo SM-2 Algorithm
 * 
 * The SM-2 algorithm calculates optimal review intervals based on:
 * - Easiness Factor (EF): How easy the word is to remember (1.3 - 2.5+)
 * - Interval: Days until next review
 * - Repetitions: Number of consecutive successful reviews
 * 
 * Quality ratings:
 * 0 - Complete blackout
 * 1 - Incorrect, but familiar
 * 2 - Incorrect, but easy to recall
 * 3 - Correct with difficulty
 * 4 - Correct with hesitation
 * 5 - Perfect recall
 */

export interface WordMasteryData {
  easinessFactor: number; // Stored as integer (2.5 = 2500)
  interval: number; // Days
  repetitions: number;
  nextReviewDate: Date;
}

export interface SM2Result {
  easinessFactor: number;
  interval: number;
  repetitions: number;
  nextReviewDate: Date;
}

/**
 * Calculate next review parameters using SM-2 algorithm
 * @param quality - Performance quality (0-5)
 * @param currentData - Current word mastery data
 * @returns Updated mastery parameters
 */
export function calculateSM2(quality: number, currentData: WordMasteryData): SM2Result {
  // Convert easiness factor from integer storage (2500 = 2.5)
  let ef = currentData.easinessFactor / 1000;
  let interval = currentData.interval;
  let repetitions = currentData.repetitions;

  // Update easiness factor based on quality
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));

  // Ensure EF stays within bounds (minimum 1.3)
  if (ef < 1.3) {
    ef = 1.3;
  }

  // If quality < 3, reset repetitions and interval
  if (quality < 3) {
    repetitions = 0;
    interval = 1; // Review again tomorrow
  } else {
    // Successful recall
    if (repetitions === 0) {
      interval = 1; // First successful review: 1 day
    } else if (repetitions === 1) {
      interval = 6; // Second successful review: 6 days
    } else {
      // Subsequent reviews: multiply previous interval by EF
      interval = Math.round(interval * ef);
    }
    repetitions += 1;
  }

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    easinessFactor: Math.round(ef * 1000), // Convert back to integer storage
    interval,
    repetitions,
    nextReviewDate,
  };
}

/**
 * Convert quiz answer correctness to SM-2 quality rating
 * @param correct - Whether the answer was correct
 * @param timeToAnswer - Optional: time taken to answer (seconds)
 * @returns Quality rating (0-5)
 */
export function answerToQuality(correct: boolean, timeToAnswer?: number): number {
  if (!correct) {
    return 1; // Incorrect, but familiar (saw the word)
  }

  // If correct, adjust quality based on response time
  if (timeToAnswer === undefined) {
    return 4; // Correct with hesitation (default)
  }

  // Fast response (< 3 seconds) = perfect recall
  if (timeToAnswer < 3) {
    return 5;
  }

  // Medium response (3-10 seconds) = correct with hesitation
  if (timeToAnswer < 10) {
    return 4;
  }

  // Slow response (> 10 seconds) = correct with difficulty
  return 3;
}

/**
 * Get words due for review
 * @param allWords - All word mastery records for a user
 * @returns Words that should be reviewed now
 */
export function getWordsDueForReview(allWords: WordMasteryData[]): WordMasteryData[] {
  const now = new Date();
  return allWords.filter((word) => word.nextReviewDate <= now);
}

/**
 * Prioritize words for quiz generation
 * Prioritizes: 1) Due for review, 2) Most incorrect, 3) Lowest easiness factor
 * @param allWords - All word mastery records
 * @param limit - Maximum number of words to return
 * @returns Prioritized words for quiz
 */
export function prioritizeWordsForQuiz(
  allWords: Array<WordMasteryData & { word: string; incorrectCount: number; correctCount: number }>,
  limit: number
): Array<WordMasteryData & { word: string; incorrectCount: number; correctCount: number }> {
  const now = new Date();

  // Score each word based on priority factors
  const scoredWords = allWords.map((word) => {
    let score = 0;

    // Priority 1: Due for review (highest priority)
    if (word.nextReviewDate <= now) {
      score += 1000;
      // Add extra points for overdue words
      const daysOverdue = Math.floor(
        (now.getTime() - word.nextReviewDate.getTime()) / (1000 * 60 * 60 * 24)
      );
      score += daysOverdue * 100;
    }

    // Priority 2: High incorrect rate
    const totalAttempts = word.correctCount + word.incorrectCount;
    if (totalAttempts > 0) {
      const incorrectRate = word.incorrectCount / totalAttempts;
      score += incorrectRate * 500;
    }

    // Priority 3: Low easiness factor (difficult words)
    const efScore = (2500 - word.easinessFactor) / 100;
    score += efScore * 10;

    // Priority 4: Never reviewed before
    if (word.repetitions === 0 && totalAttempts === 0) {
      score += 200;
    }

    return { ...word, priority: score };
  });

  // Sort by priority (highest first) and return top N
  return scoredWords
    .sort((a, b) => b.priority - a.priority)
    .slice(0, limit)
    .map(({ priority, ...word }) => word);
}

/**
 * Calculate mastery level percentage
 * @param word - Word mastery data
 * @returns Mastery percentage (0-100)
 */
export function calculateMasteryLevel(word: WordMasteryData & { correctCount: number; incorrectCount: number }): number {
  const totalAttempts = word.correctCount + word.incorrectCount;
  
  if (totalAttempts === 0) {
    return 0; // Not yet learned
  }

  // Base score from correct rate
  const correctRate = word.correctCount / totalAttempts;
  let masteryScore = correctRate * 50; // Max 50 points from accuracy

  // Add points for repetitions (successful reviews)
  masteryScore += Math.min(word.repetitions * 5, 25); // Max 25 points from repetitions

  // Add points for easiness factor
  const efScore = ((word.easinessFactor / 1000) - 1.3) / (2.5 - 1.3); // Normalize to 0-1
  masteryScore += efScore * 25; // Max 25 points from EF

  return Math.min(Math.round(masteryScore), 100);
}
