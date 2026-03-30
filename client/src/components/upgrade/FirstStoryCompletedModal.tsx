import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Heart, Star } from "lucide-react";
import { useLocation } from "wouter";
import { useABTest } from "@/hooks/useABTest";
import { useEffect } from "react";

interface FirstStoryCompletedModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const DEFAULT_CTA = {
  ctaText: "Try Premium free for 7 days",
};

/**
 * Trigger #1: Soft modal after completing first story
 * Emotional, celebratory tone — "You did it! Imagine what's next..."
 * This is NOT a hard block. User can dismiss easily.
 *
 * A/B TEST: CTA text driven by "first_story_cta" experiment.
 * Variant A = "Try Premium free for 7 days"
 * Variant B = "See what Premium unlocks"
 */
export function FirstStoryCompletedModal({
  open,
  onOpenChange,
}: FirstStoryCompletedModalProps) {
  const [, setLocation] = useLocation();
  const {
    variant,
    isLoading: abLoading,
    trackImpression,
    trackClick,
  } = useABTest("first_story_cta");

  // Track impression when modal opens
  useEffect(() => {
    if (open && !abLoading) {
      trackImpression();
    }
  }, [open, abLoading, trackImpression]);

  const ctaText = variant?.payload?.ctaText ?? DEFAULT_CTA.ctaText;

  const handleCtaClick = () => {
    trackClick();
    onOpenChange(false);
    setLocation("/pricing");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[440px] p-0 border-0 overflow-hidden rounded-3xl">
        {/* Warm gradient header */}
        <div
          className="relative px-8 pt-10 pb-8 text-center"
          style={{
            background:
              "linear-gradient(135deg, #E9D5FF 0%, #DBEAFE 50%, #D1FAE5 100%)",
          }}
        >
          {/* Sparkle decorations */}
          <span className="absolute top-4 left-6 text-purple-400 text-lg animate-pulse">
            ✦
          </span>
          <span
            className="absolute top-8 right-8 text-blue-400 text-sm animate-pulse"
            style={{ animationDelay: "0.5s" }}
          >
            ✦
          </span>
          <span
            className="absolute bottom-6 left-10 text-emerald-400 text-xs animate-pulse"
            style={{ animationDelay: "1s" }}
          >
            ✦
          </span>

          {/* Mascot */}
          <img
            src="/flip-mascot.png"
            alt="Flip celebrating"
            className="w-24 h-24 mx-auto mb-4 drop-shadow-lg"
          />

          <h2
            className="text-2xl font-bold text-purple-800 mb-2"
            style={{ fontFamily: "Fredoka, sans-serif" }}
          >
            You finished your first story! 🎉
          </h2>
          <p className="text-purple-600/80 text-base leading-relaxed">
            That feeling? That's your brain growing new language pathways.
            You're already on your way!
          </p>
        </div>

        {/* Content area */}
        <div className="px-8 py-6 space-y-5">
          {/* What's next teaser */}
          <div className="space-y-3">
            <p
              className="text-sm font-semibold text-gray-700 flex items-center gap-2"
              style={{ fontFamily: "Fredoka, sans-serif" }}
            >
              <Star className="h-4 w-4 text-amber-400 fill-amber-400" />
              Imagine what you could do with Premium:
            </p>
            <div className="space-y-2.5">
              {[
                { emoji: "📚", text: "Unlimited stories every week" },
                { emoji: "🎯", text: "All difficulty levels (A1 → C1)" },
                { emoji: "✨", text: "Create stories with your own vocabulary" },
              ].map((item, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 text-sm text-gray-600"
                >
                  <span className="text-base">{item.emoji}</span>
                  <span>{item.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA buttons — text driven by A/B test */}
          <div className="space-y-3 pt-1">
            <Button
              onClick={handleCtaClick}
              className="w-full h-12 rounded-2xl text-base font-semibold text-white border-0 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
              style={{
                fontFamily: "Fredoka, sans-serif",
                background:
                  "linear-gradient(135deg, #8B5CF6 0%, #6366F1 50%, #3B82F6 100%)",
              }}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              {ctaText}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>

            <button
              onClick={() => onOpenChange(false)}
              className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors py-2"
              style={{ fontFamily: "Fredoka, sans-serif" }}
            >
              I'll keep exploring for now
              <Heart className="inline ml-1 h-3 w-3" />
            </button>
          </div>

          {/* A/B test variant indicator (dev only) */}
          {variant && import.meta.env.DEV && (
            <div className="text-center">
              <span className="text-[10px] text-gray-300 font-mono">
                AB: {variant.key}
              </span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
