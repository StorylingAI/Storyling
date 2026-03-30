import { Sparkles, ArrowRight, Flame } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DailyLimitBannerProps {
  /** Number of new words learned today */
  wordsLearnedToday?: number;
  /** Number of stories read today */
  storiesReadToday?: number;
  onUpgradeClick: () => void;
  onDismiss?: () => void;
}

/**
 * Progress-based paywall banner.
 * Shown when daily story limit is hit.
 * Celebrates the user's progress and nudges upgrade.
 *
 * "You're on a roll. You learned 14 new words today."
 */
export function DailyLimitBanner({
  wordsLearnedToday = 0,
  storiesReadToday = 0,
  onUpgradeClick,
  onDismiss,
}: DailyLimitBannerProps) {
  const hasWords = wordsLearnedToday > 0;
  const hasStories = storiesReadToday > 0;

  return (
    <div
      className="relative rounded-2xl overflow-hidden shadow-md"
      style={{
        background: "linear-gradient(135deg, #FEF3C7 0%, #FCE7F3 50%, #E9D5FF 100%)",
      }}
    >
      {/* Sparkle decorations */}
      <span className="absolute top-3 right-5 text-amber-400 text-sm animate-pulse">
        ✦
      </span>
      <span
        className="absolute bottom-3 left-6 text-purple-400 text-xs animate-pulse"
        style={{ animationDelay: "0.8s" }}
      >
        ✦
      </span>

      <div className="px-5 py-5 flex items-start gap-4">
        {/* Fire icon */}
        <div
          className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
          style={{
            background: "linear-gradient(135deg, #FDE68A 0%, #FBBF24 100%)",
          }}
        >
          <Flame className="h-6 w-6 text-amber-700" />
        </div>

        <div className="flex-1 min-w-0">
          <h3
            className="text-base font-bold text-purple-800 mb-1"
            style={{ fontFamily: "Fredoka, sans-serif" }}
          >
            You're on a roll! 🔥
          </h3>
          <p className="text-sm text-purple-600/70 leading-relaxed mb-3">
            {hasWords && hasStories
              ? `You learned ${wordsLearnedToday} new words and read ${storiesReadToday} ${storiesReadToday === 1 ? "story" : "stories"} today.`
              : hasWords
                ? `You learned ${wordsLearnedToday} new words today. Keep the momentum going!`
                : hasStories
                  ? `You read ${storiesReadToday} ${storiesReadToday === 1 ? "story" : "stories"} today. Ready for more?`
                  : "You've been making great progress. Ready for more?"}
          </p>

          <div className="flex items-center gap-3">
            <Button
              onClick={onUpgradeClick}
              size="sm"
              className="h-9 rounded-xl text-xs font-semibold text-white border-0 transition-all hover:scale-[1.02] hover:shadow-lg px-4"
              style={{
                fontFamily: "Fredoka, sans-serif",
                background: "linear-gradient(135deg, #8B5CF6 0%, #6366F1 50%, #3B82F6 100%)",
              }}
            >
              <Sparkles className="mr-1.5 h-3.5 w-3.5" />
              Upgrade to keep going
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>

            {onDismiss && (
              <button
                onClick={onDismiss}
                className="text-xs text-gray-400 hover:text-gray-600 transition-colors"
                style={{ fontFamily: "Fredoka, sans-serif" }}
              >
                Later
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
