import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Trophy, Star, TrendingUp } from "lucide-react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

interface ProgressMilestoneCardProps {
  completedCount: number;
  onDismiss?: () => void;
}

/**
 * Trigger #5: In-feed progress card after completing 3 total stories
 * This is an inline card that appears in the library/dashboard feed.
 * Not a modal — it lives within the page content.
 * Tone: "Look how far you've come! You're ready for more."
 */
export function ProgressMilestoneCard({
  completedCount,
  onDismiss,
}: ProgressMilestoneCardProps) {
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Don't show to premium or premium_plus users
  if (user?.subscriptionTier === "premium" || user?.subscriptionTier === "premium_plus") return null;

  return (
    <div
      className="relative rounded-3xl overflow-hidden border-0 shadow-md"
      style={{
        background:
          "linear-gradient(135deg, #FEF3C7 0%, #FCE7F3 40%, #E9D5FF 100%)",
      }}
    >
      {/* Sparkle decorations */}
      <span className="absolute top-4 right-6 text-amber-400 text-lg animate-pulse">
        ✦
      </span>
      <span
        className="absolute top-8 left-8 text-pink-400 text-sm animate-pulse"
        style={{ animationDelay: "0.5s" }}
      >
        ✦
      </span>
      <span
        className="absolute bottom-6 right-12 text-purple-400 text-xs animate-pulse"
        style={{ animationDelay: "1s" }}
      >
        ✦
      </span>

      <div className="px-6 py-6">
        <div className="flex items-start gap-4">
          {/* Trophy icon */}
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm"
            style={{
              background:
                "linear-gradient(135deg, #FDE68A 0%, #FCD34D 100%)",
            }}
          >
            <Trophy className="h-7 w-7 text-amber-700" />
          </div>

          <div className="flex-1 min-w-0">
            <h3
              className="text-lg font-bold text-purple-800 mb-1"
              style={{ fontFamily: "Fredoka, sans-serif" }}
            >
              {completedCount} stories completed! 🌟
            </h3>
            <p className="text-sm text-purple-600/70 leading-relaxed">
              You're building a real language habit. Premium learners complete
              3x more stories and learn vocabulary 2x faster.
            </p>
          </div>
        </div>

        {/* Progress stats */}
        <div className="flex gap-3 mt-4 mb-5">
          {[
            {
              icon: Star,
              value: `${completedCount}`,
              label: "Stories done",
              color: "text-amber-600",
              bg: "bg-amber-50",
            },
            {
              icon: TrendingUp,
              value: "Growing",
              label: "Your skills",
              color: "text-emerald-600",
              bg: "bg-emerald-50",
            },
            {
              icon: Sparkles,
              value: "Ready",
              label: "For more",
              color: "text-purple-600",
              bg: "bg-purple-50",
            },
          ].map((stat, i) => (
            <div
              key={i}
              className={`flex-1 ${stat.bg} rounded-xl px-3 py-2.5 text-center`}
            >
              <stat.icon
                className={`h-4 w-4 ${stat.color} mx-auto mb-1`}
              />
              <div
                className={`text-sm font-bold ${stat.color}`}
                style={{ fontFamily: "Fredoka, sans-serif" }}
              >
                {stat.value}
              </div>
              <div className="text-xs text-gray-500">{stat.label}</div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="flex items-center gap-3">
          <Button
            onClick={() => setLocation("/pricing")}
            className="flex-1 h-11 rounded-2xl text-sm font-semibold text-white border-0 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
            style={{
              fontFamily: "Fredoka, sans-serif",
              background:
                "linear-gradient(135deg, #8B5CF6 0%, #6366F1 50%, #3B82F6 100%)",
            }}
          >
            <Sparkles className="mr-2 h-4 w-4" />
            Try Premium free
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          {onDismiss && (
            <button
              onClick={onDismiss}
              className="text-sm text-gray-400 hover:text-gray-600 transition-colors px-3 py-2"
              style={{ fontFamily: "Fredoka, sans-serif" }}
            >
              Dismiss
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
