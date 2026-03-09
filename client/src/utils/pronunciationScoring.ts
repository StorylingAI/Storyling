/**
 * Pronunciation scoring utilities
 * Analyzes speech quality based on confidence scores and provides feedback
 */

export interface PronunciationScore {
  stars: number; // 1-5 stars
  percentage: number; // 0-100
  level: "poor" | "fair" | "good" | "very-good" | "excellent";
  feedback: string;
  tips: string[];
}

/**
 * Calculate pronunciation score from confidence value (0-1)
 */
export function calculatePronunciationScore(confidence: number): PronunciationScore {
  // Convert confidence (0-1) to percentage
  const percentage = Math.round(confidence * 100);
  
  // Determine star rating and level
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

/**
 * Get color class for pronunciation score level
 */
export function getScoreColor(level: PronunciationScore["level"]): string {
  const colorMap: Record<PronunciationScore["level"], string> = {
    excellent: "text-green-600",
    "very-good": "text-blue-600",
    good: "text-yellow-600",
    fair: "text-orange-600",
    poor: "text-red-600",
  };
  return colorMap[level];
}

/**
 * Get background color class for pronunciation score level
 */
export function getScoreBgColor(level: PronunciationScore["level"]): string {
  const colorMap: Record<PronunciationScore["level"], string> = {
    excellent: "bg-green-50 border-green-300",
    "very-good": "bg-blue-50 border-blue-300",
    good: "bg-yellow-50 border-yellow-300",
    fair: "bg-orange-50 border-orange-300",
    poor: "bg-red-50 border-red-300",
  };
  return colorMap[level];
}
