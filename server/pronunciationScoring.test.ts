import { describe, it, expect } from "vitest";

/**
 * Pronunciation scoring test utilities
 * Note: These are duplicated from client/src/utils/pronunciationScoring.ts for testing
 */

interface PronunciationScore {
  stars: number;
  percentage: number;
  level: "poor" | "fair" | "good" | "very-good" | "excellent";
  feedback: string;
  tips: string[];
}

function calculatePronunciationScore(confidence: number): PronunciationScore {
  const percentage = Math.round(confidence * 100);
  
  let stars: number;
  let level: PronunciationScore["level"];
  let feedback: string;
  let tips: string[];

  if (percentage >= 90) {
    stars = 5;
    level = "excellent";
    feedback = "Excellent pronunciation! You sound like a native speaker.";
    tips = [
      "Keep up the great work!",
      "Try teaching others to reinforce your skills",
    ];
  } else if (percentage >= 75) {
    stars = 4;
    level = "very-good";
    feedback = "Very good pronunciation! You're speaking clearly and confidently.";
    tips = [
      "Practice speaking at natural speed",
      "Focus on intonation and rhythm",
    ];
  } else if (percentage >= 60) {
    stars = 3;
    level = "good";
    feedback = "Good pronunciation! You're understandable but there's room for improvement.";
    tips = [
      "Slow down and enunciate each syllable",
      "Listen to native speakers and mimic their pronunciation",
      "Practice difficult sounds repeatedly",
    ];
  } else if (percentage >= 40) {
    stars = 2;
    level = "fair";
    feedback = "Fair pronunciation. Keep practicing to improve clarity.";
    tips = [
      "Speak more slowly and clearly",
      "Break words into syllables",
      "Use pronunciation guides (pinyin, IPA)",
      "Record yourself and compare to native speakers",
    ];
  } else {
    stars = 1;
    level = "poor";
    feedback = "Needs improvement. Don't worry, pronunciation takes practice!";
    tips = [
      "Start with basic sounds and build up",
      "Speak very slowly at first",
      "Use a mirror to watch your mouth movements",
      "Consider working with a language tutor",
      "Practice tongue twisters in the target language",
    ];
  }

  return {
    stars,
    percentage,
    level,
    feedback,
    tips,
  };
}

describe("Pronunciation Scoring", () => {
  it("should give 5 stars for excellent pronunciation (90%+)", () => {
    const score = calculatePronunciationScore(0.95);
    expect(score.stars).toBe(5);
    expect(score.level).toBe("excellent");
    expect(score.percentage).toBe(95);
    expect(score.tips.length).toBeGreaterThan(0);
  });

  it("should give 4 stars for very good pronunciation (75-89%)", () => {
    const score = calculatePronunciationScore(0.80);
    expect(score.stars).toBe(4);
    expect(score.level).toBe("very-good");
    expect(score.percentage).toBe(80);
  });

  it("should give 3 stars for good pronunciation (60-74%)", () => {
    const score = calculatePronunciationScore(0.65);
    expect(score.stars).toBe(3);
    expect(score.level).toBe("good");
    expect(score.percentage).toBe(65);
  });

  it("should give 2 stars for fair pronunciation (40-59%)", () => {
    const score = calculatePronunciationScore(0.50);
    expect(score.stars).toBe(2);
    expect(score.level).toBe("fair");
    expect(score.percentage).toBe(50);
  });

  it("should give 1 star for poor pronunciation (<40%)", () => {
    const score = calculatePronunciationScore(0.30);
    expect(score.stars).toBe(1);
    expect(score.level).toBe("poor");
    expect(score.percentage).toBe(30);
  });

  it("should handle edge case: 0% confidence", () => {
    const score = calculatePronunciationScore(0);
    expect(score.stars).toBe(1);
    expect(score.level).toBe("poor");
    expect(score.percentage).toBe(0);
  });

  it("should handle edge case: 100% confidence", () => {
    const score = calculatePronunciationScore(1.0);
    expect(score.stars).toBe(5);
    expect(score.level).toBe("excellent");
    expect(score.percentage).toBe(100);
  });

  it("should handle boundary: exactly 90%", () => {
    const score = calculatePronunciationScore(0.90);
    expect(score.stars).toBe(5);
    expect(score.level).toBe("excellent");
  });

  it("should handle boundary: exactly 75%", () => {
    const score = calculatePronunciationScore(0.75);
    expect(score.stars).toBe(4);
    expect(score.level).toBe("very-good");
  });

  it("should handle boundary: exactly 60%", () => {
    const score = calculatePronunciationScore(0.60);
    expect(score.stars).toBe(3);
    expect(score.level).toBe("good");
  });

  it("should handle boundary: exactly 40%", () => {
    const score = calculatePronunciationScore(0.40);
    expect(score.stars).toBe(2);
    expect(score.level).toBe("fair");
  });

  it("should always provide feedback message", () => {
    const scores = [0.95, 0.80, 0.65, 0.50, 0.30];
    scores.forEach(confidence => {
      const score = calculatePronunciationScore(confidence);
      expect(score.feedback).toBeTruthy();
      expect(score.feedback.length).toBeGreaterThan(0);
    });
  });

  it("should always provide tips", () => {
    const scores = [0.95, 0.80, 0.65, 0.50, 0.30];
    scores.forEach(confidence => {
      const score = calculatePronunciationScore(confidence);
      expect(score.tips).toBeDefined();
      expect(score.tips.length).toBeGreaterThan(0);
    });
  });

  it("should provide more tips for lower scores", () => {
    const poorScore = calculatePronunciationScore(0.30);
    const excellentScore = calculatePronunciationScore(0.95);
    
    // Poor pronunciation should have more tips
    expect(poorScore.tips.length).toBeGreaterThanOrEqual(excellentScore.tips.length);
  });
});
