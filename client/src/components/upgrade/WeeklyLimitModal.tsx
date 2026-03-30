import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ArrowRight,
  Clock,
  Zap,
  BookOpen,
  Headphones,
} from "lucide-react";
import { useLocation } from "wouter";
import { useABTest } from "@/hooks/useABTest";
import { useEffect } from "react";

interface WeeklyLimitModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storiesUsed: number;
  storiesLimit: number;
}

/**
 * Default CTA config used when the A/B test hasn't loaded or the user
 * is not enrolled in the experiment.
 */
const DEFAULT_CTA = {
  ctaText: "Unlock unlimited stories",
  subtext: "Start with a free 7-day trial — then just $16/month",
};

/**
 * Trigger #2: Hard modal when weekly story limit is reached.
 * This is the STRONGEST conversion point — user wants to create but can't.
 *
 * A/B TEST: The primary CTA button text is driven by the "weekly_limit_cta"
 * experiment. Variant A = "Start 7-day free trial", Variant B = "Unlock Premium".
 * Impressions are tracked when the modal opens; clicks when the CTA is pressed.
 */
export function WeeklyLimitModal({
  open,
  onOpenChange,
  storiesUsed,
  storiesLimit,
}: WeeklyLimitModalProps) {
  const [, setLocation] = useLocation();
  const {
    variant,
    isLoading: abLoading,
    trackImpression,
    trackClick,
  } = useABTest("weekly_limit_cta");

  // Track impression when the modal opens
  useEffect(() => {
    if (open && !abLoading) {
      trackImpression();
    }
  }, [open, abLoading, trackImpression]);

  // Resolve CTA copy from A/B variant or fall back to default
  const ctaText = variant?.payload?.ctaText ?? DEFAULT_CTA.ctaText;
  const subtextOverride = variant?.payload?.subtext;

  const handleCtaClick = () => {
    trackClick();
    onOpenChange(false);
    setLocation("/pricing");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] p-0 border-0 overflow-hidden rounded-3xl">
        {/* Header with warm gradient */}
        <div
          className="relative px-8 pt-10 pb-8 text-center"
          style={{
            background:
              "linear-gradient(135deg, #FEF3C7 0%, #FCE7F3 50%, #E9D5FF 100%)",
          }}
        >
          {/* Sparkles */}
          <span className="absolute top-4 right-6 text-amber-400 text-lg animate-pulse">
            ✦
          </span>
          <span
            className="absolute top-10 left-8 text-pink-400 text-sm animate-pulse"
            style={{ animationDelay: "0.7s" }}
          >
            ✦
          </span>
          <span
            className="absolute bottom-4 right-12 text-purple-400 text-xs animate-pulse"
            style={{ animationDelay: "1.2s" }}
          >
            ✦
          </span>

          {/* Progress indicator */}
          <div className="inline-flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-4 py-2 mb-5">
            <Clock className="h-4 w-4 text-amber-600" />
            <span
              className="text-sm font-semibold text-amber-700"
              style={{ fontFamily: "Fredoka, sans-serif" }}
            >
              {storiesUsed}/{storiesLimit} stories this week
            </span>
          </div>

          <h2
            className="text-2xl font-bold text-purple-800 mb-2"
            style={{ fontFamily: "Fredoka, sans-serif" }}
          >
            You're on fire! 🔥
          </h2>
          <p className="text-purple-600/80 text-base leading-relaxed max-w-sm mx-auto">
            You've used all your free stories this week — that means you're
            making real progress! Ready to keep the momentum going?
          </p>
        </div>

        {/* Content */}
        <div className="px-8 py-6 space-y-5">
          {/* What Premium unlocks */}
          <div className="grid grid-cols-2 gap-3">
            {[
              {
                icon: Zap,
                label: "Unlimited stories",
                color: "text-purple-500",
                bg: "bg-purple-50",
              },
              {
                icon: BookOpen,
                label: "All difficulty levels",
                color: "text-blue-500",
                bg: "bg-blue-50",
              },
              {
                icon: Sparkles,
                label: "Custom vocabulary",
                color: "text-emerald-500",
                bg: "bg-emerald-50",
              },
              {
                icon: Headphones,
                label: "Voice selection",
                color: "text-amber-500",
                bg: "bg-amber-50",
              },
            ].map((item, i) => (
              <div
                key={i}
                className={`flex items-center gap-2.5 ${item.bg} rounded-xl px-3.5 py-3`}
              >
                <item.icon className={`h-4 w-4 ${item.color} flex-shrink-0`} />
                <span
                  className="text-sm font-medium text-gray-700"
                  style={{ fontFamily: "Fredoka, sans-serif" }}
                >
                  {item.label}
                </span>
              </div>
            ))}
          </div>

          {/* Pricing nudge — subtext can also be driven by A/B variant */}
          <div
            className="text-center rounded-2xl py-3 px-4"
            style={{
              background:
                "linear-gradient(135deg, #F3E8FF 0%, #EDE9FE 100%)",
            }}
          >
            <p
              className="text-sm text-purple-700"
              style={{ fontFamily: "Fredoka, sans-serif" }}
            >
              {subtextOverride ?? DEFAULT_CTA.subtext}
            </p>
          </div>

          {/* CTA — text driven by A/B test variant */}
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
              I'll wait until next week
            </button>
          </div>

          {/* A/B test variant indicator (dev only, hidden in production) */}
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
