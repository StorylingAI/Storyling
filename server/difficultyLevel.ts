/**
 * Calculate difficulty level for a story based on target language and proficiency level
 */
export function calculateDifficultyLevel(
  targetLanguage: string,
  proficiencyLevel: string
): string {
  // For Chinese, use HSK levels (1-6)
  if (targetLanguage.toLowerCase() === "chinese" || targetLanguage.toLowerCase() === "mandarin") {
    // Map CEFR to HSK
    const cefrToHsk: Record<string, string> = {
      "A1": "HSK 1",
      "A2": "HSK 2",
      "B1": "HSK 3",
      "B2": "HSK 4",
      "C1": "HSK 5",
      "C2": "HSK 6",
    };
    return cefrToHsk[proficiencyLevel] || proficiencyLevel;
  }
  
  // For other languages, use CEFR levels (A1-C2)
  return proficiencyLevel;
}

/**
 * Get color scheme for difficulty badge based on level
 */
export function getDifficultyColor(difficultyLevel: string): {
  bg: string;
  text: string;
  border: string;
} {
  // HSK levels
  if (difficultyLevel.startsWith("HSK")) {
    const level = parseInt(difficultyLevel.replace("HSK ", ""));
    if (level <= 2) {
      return { bg: "bg-green-100", text: "text-green-700", border: "border-green-300" };
    } else if (level <= 4) {
      return { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300" };
    } else {
      return { bg: "bg-red-100", text: "text-red-700", border: "border-red-300" };
    }
  }
  
  // CEFR levels
  if (difficultyLevel.startsWith("A")) {
    return { bg: "bg-green-100", text: "text-green-700", border: "border-green-300" };
  } else if (difficultyLevel.startsWith("B")) {
    return { bg: "bg-yellow-100", text: "text-yellow-700", border: "border-yellow-300" };
  } else if (difficultyLevel.startsWith("C")) {
    return { bg: "bg-red-100", text: "text-red-700", border: "border-red-300" };
  }
  
  // Default
  return { bg: "bg-gray-100", text: "text-gray-700", border: "border-gray-300" };
}
