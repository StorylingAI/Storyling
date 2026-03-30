import { Lock, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

interface LockedContentPreviewProps {
  title: string;
  level: string;
  theme?: string;
  thumbnailUrl?: string;
  onUpgradeClick: () => void;
}

/**
 * Soft preview card for locked content.
 * Instead of a hard block, shows the story title, level, and a blurred preview
 * with an "Available in Premium" overlay.
 */
export function LockedContentPreview({
  title,
  level,
  theme,
  thumbnailUrl,
  onUpgradeClick,
}: LockedContentPreviewProps) {
  return (
    <div className="relative rounded-2xl overflow-hidden border-2 border-purple-100 bg-white group cursor-pointer" onClick={onUpgradeClick}>
      {/* Blurred thumbnail / placeholder */}
      <div className="relative h-32 overflow-hidden">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover filter blur-[6px] scale-110"
          />
        ) : (
          <div
            className="w-full h-full"
            style={{
              background: "linear-gradient(135deg, #E9D5FF 0%, #DBEAFE 50%, #D1FAE5 100%)",
            }}
          />
        )}

        {/* Lock overlay */}
        <div className="absolute inset-0 bg-black/30 flex items-center justify-center">
          <div className="flex flex-col items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
              <Lock className="h-5 w-5 text-purple-600" />
            </div>
            <span
              className="text-xs font-bold text-white bg-purple-600/80 backdrop-blur-sm px-3 py-1 rounded-full"
              style={{ fontFamily: "Fredoka, sans-serif" }}
            >
              Available in Premium
            </span>
          </div>
        </div>
      </div>

      {/* Content info */}
      <div className="p-4">
        <div className="flex items-center gap-2 mb-1">
          {level && (
            <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
              {level}
            </span>
          )}
          {theme && (
            <span className="text-[10px] text-gray-400">
              {theme}
            </span>
          )}
        </div>
        <h4
          className="text-sm font-bold text-gray-900 line-clamp-1 mb-2"
          style={{ fontFamily: "Fredoka, sans-serif" }}
        >
          {title}
        </h4>
        <Button
          size="sm"
          className="w-full h-8 rounded-xl text-xs font-semibold text-white border-0 transition-all group-hover:scale-[1.02]"
          style={{
            fontFamily: "Fredoka, sans-serif",
            background: "linear-gradient(135deg, #8B5CF6 0%, #6366F1 50%, #3B82F6 100%)",
          }}
        >
          <Sparkles className="mr-1.5 h-3 w-3" />
          Unlock with Premium
          <ArrowRight className="ml-1.5 h-3 w-3" />
        </Button>
      </div>
    </div>
  );
}
