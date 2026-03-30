import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { X, Star, Sparkles, TrendingUp, Share2, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { generateProgressCard, downloadProgressCard, shareToSocial } from "@/lib/generateProgressCard";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

interface LevelUpModalProps {
  isOpen: boolean;
  onClose: () => void;
  newLevel: number;
  totalXp: number;
  previousLevel?: number;
}

export function LevelUpModal({ isOpen, onClose, newLevel, totalXp, previousLevel }: LevelUpModalProps) {
  const [showContent, setShowContent] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const { user } = useAuth();
  const { data: stats } = trpc.gamification.getMyStats.useQuery(undefined, { enabled: isOpen });

  // Calculate XP needed for next level
  const calculateXPForLevel = (level: number) => {
    if (level < 2) return 100;
    if (level < 3) return 300;
    if (level < 4) return 600;
    if (level < 5) return 1000;
    return 1000 + (level - 4) * 500;
  };

  const xpForNextLevel = calculateXPForLevel(newLevel);
  const xpProgress = (totalXp / xpForNextLevel) * 100;

  const handleShare = async (action: 'download' | 'twitter' | 'facebook') => {
    if (!user || !stats) return;

    setIsGenerating(true);
    try {
      const dataUrl = await generateProgressCard({
        userName: user.name || 'Language Learner',
        level: newLevel,
        totalXp,
        streak: stats.currentStreak,
      });

      if (action === 'download') {
        downloadProgressCard(dataUrl, `storyling-level-${newLevel}.png`);
        toast.success('Progress card downloaded!');
      } else {
        shareToSocial(action, newLevel, totalXp);
        toast.success(`Opening ${action === 'twitter' ? 'Twitter' : 'Facebook'}...`);
      }
    } catch (error) {
      console.error('Failed to generate progress card:', error);
      toast.error('Failed to generate progress card');
    } finally {
      setIsGenerating(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Delay content appearance for dramatic effect
      setTimeout(() => setShowContent(true), 300);

      // Fire confetti multiple times
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 9999 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);

        // Fire from left
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
          colors: ["#a855f7", "#ec4899", "#f97316", "#eab308"],
        });

        // Fire from right
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
          colors: ["#3b82f6", "#06b6d4", "#10b981", "#84cc16"],
        });
      }, 250);

      // Auto-close after 5 seconds
      const autoCloseTimer = setTimeout(() => {
        handleClose();
      }, 5000);

      return () => {
        clearInterval(interval);
        clearTimeout(autoCloseTimer);
      };
    } else {
      setShowContent(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    setShowContent(false);
    setTimeout(() => onClose(), 300);
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm transition-opacity duration-300 ${
        showContent ? "opacity-100" : "opacity-0"
      }`}
      onClick={handleClose}
    >
      <div
        className={`relative w-full max-w-2xl mx-4 transition-all duration-500 ${
          showContent ? "scale-100 opacity-100" : "scale-75 opacity-0"
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <Button
          variant="ghost"
          size="icon"
          onClick={handleClose}
          className="absolute -top-4 -right-4 z-10 rounded-full bg-white/10 hover:bg-white/20 text-white backdrop-blur-sm"
        >
          <X className="h-5 w-5" />
        </Button>

        {/* Main content card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500 p-1">
          <div className="rounded-3xl bg-gradient-to-br from-purple-950/95 via-pink-950/95 to-orange-950/95 backdrop-blur-xl p-12">
            {/* Sparkle effects */}
            <div className="absolute top-8 left-8 animate-pulse">
              <Sparkles className="h-8 w-8 text-yellow-300" />
            </div>
            <div className="absolute top-12 right-12 animate-pulse delay-300">
              <Sparkles className="h-6 w-6 text-pink-300" />
            </div>
            <div className="absolute bottom-12 left-16 animate-pulse delay-500">
              <Sparkles className="h-7 w-7 text-purple-300" />
            </div>

            {/* Content */}
            <div className="relative z-10 text-center space-y-8">
              {/* Title */}
              <div className="space-y-2">
                <h2 className="text-5xl font-bold text-white animate-bounce-in" style={{ fontFamily: "Fredoka One, cursive" }}>
                  Level Up! 🎉
                </h2>
                <p className="text-xl text-white/80">Congratulations on your progress!</p>
              </div>

              {/* Level badge */}
              <div className="flex items-center justify-center gap-8 my-8">
                {previousLevel && (
                  <>
                    <div className="relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full blur-xl opacity-50 animate-pulse"></div>
                      <div className="relative flex items-center justify-center w-32 h-32 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 border-4 border-white/20">
                        <div className="text-center">
                          <Star className="h-10 w-10 text-white mx-auto mb-1" />
                          <p className="text-4xl font-bold text-white">{previousLevel}</p>
                        </div>
                      </div>
                    </div>

                    <TrendingUp className="h-12 w-12 text-white animate-pulse" />
                  </>
                )}

                <div className="relative animate-scale-in">
                  {/* Glow effect */}
                  <div className="absolute inset-0 bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-400 rounded-full blur-2xl opacity-75 animate-pulse"></div>
                  
                  {/* Badge */}
                  <div className="relative flex items-center justify-center w-40 h-40 rounded-full bg-gradient-to-br from-yellow-400 via-orange-400 to-pink-500 border-8 border-white/30 shadow-2xl">
                    <div className="text-center">
                      <Star className="h-14 w-14 text-white mx-auto mb-2 drop-shadow-lg" fill="currentColor" />
                      <p className="text-5xl font-bold text-white drop-shadow-lg">{newLevel}</p>
                    </div>
                  </div>

                  {/* Rotating ring */}
                  <div className="absolute inset-0 rounded-full border-4 border-dashed border-white/40 animate-spin-slow"></div>
                </div>
              </div>

              {/* Stats */}
              <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 space-y-4">
                <div className="flex items-center justify-between text-white">
                  <span className="text-lg font-semibold">Total XP</span>
                  <span className="text-2xl font-bold">{totalXp}</span>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-white/80 text-sm">
                    <span>Progress to Level {newLevel + 1}</span>
                    <span>{totalXp} / {xpForNextLevel} XP</span>
                  </div>
                  <Progress value={xpProgress} className="h-3 bg-white/20" />
                </div>
              </div>

              {/* Message */}
              <div className="text-white/90 text-lg">
                <p>You're making amazing progress! 🌟</p>
                <p className="text-white/70 text-base mt-2">Keep learning to unlock more achievements and rewards.</p>
              </div>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row gap-3 w-full">
                {/* Share dropdown */}
                <div className="flex gap-2 flex-1">
                  <Button
                    onClick={() => handleShare('download')}
                    disabled={isGenerating}
                    size="lg"
                    variant="outline"
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white border-white/30 font-semibold rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-105"
                  >
                    <Download className="h-5 w-5 mr-2" />
                    {isGenerating ? 'Generating...' : 'Download'}
                  </Button>
                  <Button
                    onClick={() => handleShare('twitter')}
                    disabled={isGenerating}
                    size="lg"
                    variant="outline"
                    className="flex-1 bg-white/10 hover:bg-white/20 text-white border-white/30 font-semibold rounded-full backdrop-blur-sm transition-all duration-300 hover:scale-105"
                  >
                    <Share2 className="h-5 w-5 mr-2" />
                    Share
                  </Button>
                </div>
              </div>

              {/* Continue button */}
              <Button
                onClick={handleClose}
                size="lg"
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold text-lg px-8 py-6 rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
              >
                Continue Learning
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
