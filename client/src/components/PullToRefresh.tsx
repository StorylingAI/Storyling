import { ReactNode } from "react";
import { Loader2, ArrowDown } from "lucide-react";
import { usePullToRefresh } from "@/hooks/usePullToRefresh";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: ReactNode;
  className?: string;
  style?: React.CSSProperties;
  threshold?: number;
  disabled?: boolean;
}

/**
 * A wrapper component that adds pull-to-refresh to its children.
 * Only active on touch devices (mobile). Shows a spinner indicator
 * when pulling down from the top of the page.
 */
export function PullToRefresh({
  onRefresh,
  children,
  className = "",
  style,
  threshold = 80,
  disabled = false,
}: PullToRefreshProps) {
  const { pullDistance, isRefreshing, containerRef } = usePullToRefresh({
    onRefresh,
    threshold,
    disabled,
  });

  const progress = Math.min(pullDistance / threshold, 1);
  const showIndicator = pullDistance > 10 || isRefreshing;

  return (
    <div ref={containerRef} className={className} style={style}>
      {/* Pull indicator */}
      <div
        className="flex items-center justify-center overflow-hidden transition-all duration-200 ease-out sm:hidden"
        style={{
          height: isRefreshing ? 56 : pullDistance > 10 ? pullDistance : 0,
          opacity: showIndicator ? 1 : 0,
        }}
      >
        <div
          className="flex flex-col items-center gap-1"
          style={{
            transform: `scale(${0.5 + progress * 0.5})`,
          }}
        >
          {isRefreshing ? (
            <div className="flex items-center gap-2 text-primary">
              <Loader2 className="h-5 w-5 animate-spin" />
              <span className="text-xs font-medium text-muted-foreground">Refreshing...</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-muted-foreground">
              <ArrowDown
                className="h-5 w-5 transition-transform duration-200"
                style={{
                  transform: progress >= 1 ? "rotate(180deg)" : "rotate(0deg)",
                }}
              />
              <span className="text-xs font-medium">
                {progress >= 1 ? "Release to refresh" : "Pull to refresh"}
              </span>
            </div>
          )}
        </div>
      </div>

      {children}
    </div>
  );
}
