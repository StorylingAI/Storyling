import { useState } from "react";
import { Link } from "wouter";
import { CheckCircle2, Circle, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
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
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl transition-all duration-300 hover:shadow-lg",
      )}
      style={{
        background: completed 
          ? 'rgba(52, 211, 153, 0.1)' 
          : 'rgba(255, 255, 255, 0.1)',
        backdropFilter: 'blur(16px)',
        border: completed 
          ? '1px solid rgba(52, 211, 153, 0.25)' 
          : '1px solid rgba(255, 255, 255, 0.12)',
        boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
      }}
    >
      {/* Confetti effect */}
      {showConfetti && (
        <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center">
          <div className="animate-ping absolute h-20 w-20 rounded-full bg-emerald-400 opacity-75"></div>
          <Sparkles className="h-12 w-12 text-emerald-400 animate-bounce" />
        </div>
      )}

      <div className="p-4 sm:p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="text-3xl">{icon}</div>
            <div>
              <h4 className="text-base font-bold text-white" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                {title}
              </h4>
              <p className="text-sm text-white/50 mt-0.5" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                {description}
              </p>
            </div>
          </div>
          
          {completed ? (
            <CheckCircle2 className="h-6 w-6 text-emerald-400 shrink-0" />
          ) : (
            <Circle className="h-6 w-6 text-white/30 shrink-0" />
          )}
        </div>

        <div className="mt-4 flex items-center justify-between">
          {completed ? (
            <div className="text-sm text-white/40" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              Completed {completedAt ? new Date(completedAt).toLocaleDateString() : ""}
            </div>
          ) : (
            <Link href={actionUrl}>
              <Button
                size="sm"
                className="rounded-full text-white border-0 font-semibold"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED, #06B6D4)',
                  fontFamily: 'Fredoka, sans-serif',
                }}
              >
                {actionLabel} →
              </Button>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
