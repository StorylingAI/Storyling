import { Badge } from "@/components/ui/badge";
import { GraduationCap } from "lucide-react";

interface DifficultyBadgeProps {
  difficultyLevel: string | null | undefined;
  className?: string;
}

/**
 * Get color scheme for difficulty badge based on level
 */
function getDifficultyColor(difficultyLevel: string): {
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

export function DifficultyBadge({ difficultyLevel, className = "" }: DifficultyBadgeProps) {
  if (!difficultyLevel) return null;
  
  const colors = getDifficultyColor(difficultyLevel);
  
  return (
    <Badge 
      variant="outline" 
      className={`rounded-full ${colors.bg} ${colors.text} ${colors.border} border-2 font-semibold ${className}`}
    >
      <GraduationCap className="h-3 w-3 mr-1" />
      {difficultyLevel}
    </Badge>
  );
}
