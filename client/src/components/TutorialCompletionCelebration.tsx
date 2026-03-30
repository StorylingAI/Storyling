import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trophy, Star, Sparkles, X } from "lucide-react";
import confetti from "canvas-confetti";

interface TutorialCompletionCelebrationProps {
  isOpen: boolean;
  onClose: () => void;
  tutorialName?: string;
  badgeTitle?: string;
  badgeDescription?: string;
}

export function TutorialCompletionCelebration({
  isOpen,
  onClose,
  tutorialName = "Quick Start Tutorial",
  badgeTitle = "Tutorial Master",
  badgeDescription = "Completed your first tutorial!",
}: TutorialCompletionCelebrationProps) {
  const [showBadge, setShowBadge] = useState(false);

  useEffect(() => {
    if (isOpen) {
      // Trigger confetti animation
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval = setInterval(function () {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);

        // Launch confetti from two different origins
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        });
      }, 250);

      // Show badge with delay for dramatic effect
      setTimeout(() => setShowBadge(true), 500);

      return () => clearInterval(interval);
    } else {
      setShowBadge(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/60 z-[100] animate-fade-in backdrop-blur-sm" />

      {/* Celebration Card */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4">
        <Card className="w-full max-w-md animate-scale-in shadow-2xl border-2 border-purple-200">
          <CardContent className="p-8 text-center space-y-6">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute top-4 right-4 rounded-button hover-lift active-scale"
            >
              <X className="h-4 w-4" />
            </Button>

            {/* Trophy Icon with Animation */}
            <div className="flex justify-center">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full blur-xl opacity-50 animate-pulse" />
                <div className="relative bg-gradient-to-br from-yellow-400 via-orange-500 to-pink-500 rounded-full p-6">
                  <Trophy className="h-16 w-16 text-white" />
                </div>
              </div>
            </div>

            {/* Congratulations Text */}
            <div className="space-y-2">
              <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                Congratulations! 🎉
              </h2>
              <p className="text-lg text-gray-700">
                You've completed the <span className="font-semibold">{tutorialName}</span>!
              </p>
            </div>

            {/* Badge Display with Animation */}
            {showBadge && (
              <div className="animate-scale-in">
                <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 border-2 border-purple-200 space-y-3">
                  <div className="flex items-center justify-center gap-2">
                    <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                    <h3 className="text-xl font-bold text-purple-900">{badgeTitle}</h3>
                    <Star className="h-6 w-6 text-yellow-500 fill-yellow-500" />
                  </div>
                  <p className="text-gray-600">{badgeDescription}</p>
                  
                  {/* Achievement Badge Visual */}
                  <div className="flex justify-center pt-2">
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-r from-purple-400 to-blue-400 rounded-full blur-md opacity-50" />
                      <div className="relative bg-gradient-to-br from-purple-500 to-blue-500 rounded-full p-4">
                        <Sparkles className="h-8 w-8 text-white" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Encouragement Message */}
            <p className="text-gray-600 text-sm">
              You're now ready to make the most of your language learning journey!
            </p>

            {/* Action Button */}
            <Button
              onClick={onClose}
              size="lg"
              className="w-full rounded-button gradient-primary text-white hover-lift border-0"
            >
              Start Learning
              <Sparkles className="h-4 w-4 ml-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
