import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowRight, Lock, Wand2 } from "lucide-react";
import { useLocation } from "wouter";

interface PersonalizedStoryOverlayProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * Trigger #4: Blur overlay when clicking "Create Story with My Vocabulary"
 * Shows a preview of what the feature looks like, blurred behind the overlay.
 * Tone: "This magical feature is waiting for you!"
 */
export function PersonalizedStoryOverlay({
  open,
  onOpenChange,
}: PersonalizedStoryOverlayProps) {
  const [, setLocation] = useLocation();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[460px] p-0 border-0 overflow-hidden rounded-3xl">
        {/* Blurred preview mockup */}
        <div className="relative">
          {/* Simulated blurred content behind */}
          <div
            className="px-6 py-8 filter blur-[3px] select-none pointer-events-none"
            style={{
              background:
                "linear-gradient(180deg, #F5F3FF 0%, #FFFFFF 100%)",
            }}
          >
            <div className="space-y-4">
              <div className="h-6 bg-purple-200/60 rounded-lg w-3/4" />
              <div className="h-4 bg-gray-200/60 rounded w-full" />
              <div className="h-4 bg-gray-200/60 rounded w-5/6" />
              <div className="grid grid-cols-3 gap-2 mt-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div
                    key={i}
                    className="h-10 bg-purple-100/60 rounded-xl flex items-center justify-center"
                  >
                    <span className="text-xs text-purple-400/60">word {i}</span>
                  </div>
                ))}
              </div>
              <div className="h-12 bg-purple-300/40 rounded-2xl mt-4" />
            </div>
          </div>

          {/* Overlay content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/80 backdrop-blur-sm px-8">
            {/* Lock icon with glow */}
            <div className="relative mb-4">
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center shadow-lg"
                style={{
                  background:
                    "linear-gradient(135deg, #E9D5FF 0%, #DBEAFE 50%, #D1FAE5 100%)",
                }}
              >
                <Wand2 className="h-9 w-9 text-purple-600" />
              </div>
              <div className="absolute -top-1 -right-1 w-7 h-7 bg-amber-400 rounded-full flex items-center justify-center shadow-md">
                <Lock className="h-3.5 w-3.5 text-white" />
              </div>
              {/* Sparkles */}
              <span className="absolute -top-3 left-0 text-purple-400 text-sm animate-pulse">
                ✦
              </span>
              <span
                className="absolute -bottom-2 -right-3 text-blue-400 text-xs animate-pulse"
                style={{ animationDelay: "0.6s" }}
              >
                ✦
              </span>
            </div>

            <h3
              className="text-xl font-bold text-purple-800 text-center mb-2"
              style={{ fontFamily: "Fredoka, sans-serif" }}
            >
              Personalized stories await! ✨
            </h3>
            <p className="text-gray-500 text-sm text-center leading-relaxed mb-6 max-w-xs">
              Turn your saved vocabulary into custom stories made just for you.
              Premium members create stories with the exact words they're
              learning.
            </p>

            {/* Feature highlights */}
            <div className="flex gap-4 mb-6">
              {[
                { emoji: "📝", label: "Your words" },
                { emoji: "🪄", label: "AI magic" },
                { emoji: "📖", label: "Your story" },
              ].map((item, i) => (
                <div key={i} className="text-center">
                  <span className="text-xl block mb-1">{item.emoji}</span>
                  <span
                    className="text-xs text-gray-500 font-medium"
                    style={{ fontFamily: "Fredoka, sans-serif" }}
                  >
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* CTA area */}
        <div className="px-8 pb-7 pt-4 space-y-3">
          <Button
            onClick={() => {
              onOpenChange(false);
              setLocation("/pricing");
            }}
            className="w-full h-12 rounded-2xl text-base font-semibold text-white border-0 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
            style={{
              fontFamily: "Fredoka, sans-serif",
              background:
                "linear-gradient(135deg, #8B5CF6 0%, #6366F1 50%, #3B82F6 100%)",
            }}
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Unlock personalized stories
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>

          <button
            onClick={() => onOpenChange(false)}
            className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors py-2"
            style={{ fontFamily: "Fredoka, sans-serif" }}
          >
            Not right now
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
