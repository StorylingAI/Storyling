/**
 * SM-2 Spaced Repetition Algorithm
 * Based on SuperMemo 2 algorithm for optimal learning intervals
 * 
 * Quality ratings:
 * 5 - perfect response
 * 4 - correct response after hesitation
 * 3 - correct response with serious difficulty
 * 2 - incorrect response; correct one remembered
 * 1 - incorrect response; correct one seemed familiar
 * 0 - complete blackout
 */

export interface SRSData {
  easeFactor: number;  // Ease factor (minimum 1.3)
  interval: number;    // Days until next review
  repetitions: number; // Number of successful reviews
  nextReviewDate: Date; // Calculated next review date
}

/**
 * Calculate next review schedule using SM-2 algorithm
 * @param quality - Quality of response (0-5)
 * @param currentData - Current SRS data
 * @returns Updated SRS data with new interval and review date
 */
export function calculateNextReview(
  quality: number,
  currentData: SRSData
): SRSData {
  // Validate quality (0-5)
  if (quality < 0 || quality > 5) {
    throw new Error("Quality must be between 0 and 5");
  }

  let { easeFactor, interval, repetitions } = currentData;

  // Update ease factor based on quality
  // EF' = EF + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
  easeFactor = easeFactor + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02));
  
  // Minimum ease factor is 1.3
  if (easeFactor < 1.3) {
    easeFactor = 1.3;
  }

  // Calculate new interval based on quality
  if (quality < 3) {
    // Incorrect response - reset interval and repetitions
    repetitions = 0;
    interval = 1;
  } else {
    // Correct response - increase interval
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions++;
  }

  // Calculate next review date
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + interval);

  return {
    easeFactor,
    interval,
    repetitions,
    nextReviewDate,
  };
}

/**
 * Convert practice performance to SM-2 quality rating
 * @param isCorrect - Whether the answer was correct
 * @param hesitation - Optional hesitation indicator (true if user took long time)
 * @returns Quality rating (0-5)
 */
export function performanceToQuality(
  isCorrect: boolean,
  hesitation?: boolean
): number {
  if (!isCorrect) {
    return 0; // Complete blackout / incorrect
  }
  
  if (hesitation) {
    return 4; // Correct after hesitation
  }
  
  return 5; // Perfect response
}

/**
 * Check if a word is due for review
 * @param nextReviewDate - Next scheduled review date
 * @returns True if word is due for review
 */
export function isDueForReview(nextReviewDate: Date | null): boolean {
  if (!nextReviewDate) {
    return true; // Never reviewed - due immediately
  }
  
  const now = new Date();
  return now >= nextReviewDate;
}

/**
 * Get days until next review
 * @param nextReviewDate - Next scheduled review date
 * @returns Number of days (negative if overdue)
 */
export function getDaysUntilReview(nextReviewDate: Date | null): number {
  if (!nextReviewDate) {
    return 0; // Due now
  }
  
  const now = new Date();
  const diffTime = nextReviewDate.getTime() - now.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  return diffDays;
}

/**
 * Initialize SRS data for a new word
 * @returns Initial SRS data
 */
export function initializeSRS(): SRSData {
  const nextReviewDate = new Date();
  nextReviewDate.setDate(nextReviewDate.getDate() + 1); // Review tomorrow
  
  return {
    easeFactor: 2.5,
    interval: 1,
    repetitions: 0,
    nextReviewDate,
  };
}
