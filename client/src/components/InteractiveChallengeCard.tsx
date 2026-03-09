import { useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface InteractiveChallengeCardProps {
  challengeId: string;
  title: string;
  description: string;
  icon: string;
  actionLabel: string;
  actionUrl: string;
  completed: boolean;
  completedAt: Date | null;
  onComplete?: () => void;
}

export function InteractiveChallengeCard({
  challengeId,
  title,
  description,
  icon,
  actionLabel,
  actionUrl,
  completed,
  completedAt,
  onComplete,
}: InteractiveChallengeCardProps) {
  const [showConfetti, setShowConfetti] = useState(false);

  const handleComplete = () => {
    if (!completed && onComplete) {
      setShowConfetti(true);
      onComplete();
      setTimeout(() => setShowConfetti(false), 2000);
    }
  };

  return (
    <Card
      className={cn(
        "relative overflow-hidden transition-all duration-300 hover:shadow-lg",
        completed ? "border-green-500/50 bg-green-50/50 dark:bg-green-950/20" : "border-border"
      )}
    >
      {/* Confetti effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
          <div className="animate-ping absolute h-20 w-20 rounded-full bg-green-400 opacity-75"></div>
          <Sparkles className="h-12 w-12 text-green-500 animate-bounce" />
        </div>
      )}

      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{icon}</div>
            <div>
              <CardTitle className="text-lg">{title}</CardTitle>
              <CardDescription className="mt-1">{description}</CardDescription>
            </div>
          </div>
          
          {completed ? (
            <CheckCircle2 className="h-6 w-6 text-green-500 shrink-0" />
          ) : (
            <Circle className="h-6 w-6 text-muted-foreground shrink-0" />
          )}
        </div>
      </CardHeader>

      <CardContent>
        <div className="flex items-center justify-between">
          {completed ? (
            <div className="text-sm text-muted-foreground">
              Completed {completedAt ? new Date(completedAt).toLocaleDateString() : ""}
            </div>
          ) : (
            <Link href={actionUrl}>
              <Button
                size="sm"
                className="bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600 text-white"
              >
                {actionLabel} →
              </Button>
            </Link>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
