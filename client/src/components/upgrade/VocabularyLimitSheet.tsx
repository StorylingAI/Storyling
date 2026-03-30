import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, BookOpen } from "lucide-react";
import { useLocation } from "wouter";
import { useABTest } from "@/hooks/useABTest";
import { useEffect } from "react";

interface VocabularyLimitSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wordCount: number;
  wordLimit: number;
}

const DEFAULT_CTA = {
  ctaText: "Unlock unlimited vocabulary",
};

/**
 * Trigger #3: Bottom sheet when trying to save the 11th vocabulary word
 * Gentle nudge — the user is actively learning and engaged.
 *
 * A/B TEST: CTA text driven by "vocab_limit_cta" experiment.
 * Variant A = "Unlock unlimited vocabulary"
 * Variant B = "Expand your word bank"
 */
export function VocabularyLimitSheet({
  open,
  onOpenChange,
  wordCount,
  wordLimit,
}: VocabularyLimitSheetProps) {
  const [, setLocation] = useLocation();
  const {
    variant,
    isLoading: abLoading,
    trackImpression,
    trackClick,
  } = useABTest("vocab_limit_cta");

  // Track impression when sheet opens
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

  // Visual progress bar
  const progressPercent = Math.min((wordCount / wordLimit) * 100, 100);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        className="rounded-t-3xl border-0 px-6 pb-8 pt-6"
        style={{
          background:
            "linear-gradient(180deg, #FFFFFF 0%, #F5F3FF 50%, #EDE9FE 100%)",
        }}
      >
        {/* Drag handle */}
        <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-5" />

        <SheetHeader className="text-center mb-5">
          {/* Icon */}
          <div className="mx-auto mb-3 relative">
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center"
              style={{
                background:
                  "linear-gradient(135deg, #E9D5FF 0%, #DBEAFE 100%)",
              }}
            >
              <BookOpen className="h-8 w-8 text-purple-600" />
            </div>
            {/* Sparkle */}
            <span className="absolute -top-1 -right-1 text-amber-400 text-sm animate-pulse">
              ✦
            </span>
          </div>

          <SheetTitle
            className="text-xl font-bold text-purple-800"
            style={{ fontFamily: "Fredoka, sans-serif" }}
          >
            You've saved {wordCount} words today!
          </SheetTitle>
          <p className="text-gray-500 text-sm mt-1 leading-relaxed">
            That's amazing progress! Upgrade to save unlimited vocabulary and master them with spaced repetition.
          </p>
        </SheetHeader>

        {/* Progress bar */}
        <div className="mb-6">
          <div className="flex justify-between text-xs text-gray-500 mb-2">
            <span style={{ fontFamily: "Fredoka, sans-serif" }}>
              {wordCount} words saved today
            </span>
            <span style={{ fontFamily: "Fredoka, sans-serif" }}>
              {wordLimit} daily limit
            </span>
          </div>
          <div className="h-3 bg-purple-100 rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{
                width: `${progressPercent}%`,
                background:
                  "linear-gradient(90deg, #8B5CF6 0%, #6366F1 50%, #3B82F6 100%)",
              }}
            />
          </div>
        </div>

        {/* Benefits */}
        <div className="flex items-center justify-center gap-6 mb-6">
          {[
            { emoji: "♾️", label: "Unlimited words" },
            { emoji: "🧠", label: "Spaced repetition" },
            { emoji: "📖", label: "Custom stories" },
          ].map((item, i) => (
            <div key={i} className="text-center">
              <span className="text-2xl block mb-1">{item.emoji}</span>
              <span
                className="text-xs text-gray-600 font-medium"
                style={{ fontFamily: "Fredoka, sans-serif" }}
              >
                {item.label}
              </span>
            </div>
          ))}
        </div>

        {/* CTA — text driven by A/B test */}
        <div className="space-y-3">
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
            Maybe later
          </button>
        </div>

        {/* A/B test variant indicator (dev only) */}
        {variant && import.meta.env.DEV && (
          <div className="text-center mt-2">
            <span className="text-[10px] text-gray-300 font-mono">
              AB: {variant.key}
            </span>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
