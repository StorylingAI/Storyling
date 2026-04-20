import { useState, useEffect, useRef, useCallback } from "react";
import { X, ArrowRight, Library, Filter, Play, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface LibraryOnboardingTutorialProps {
  onComplete: () => void;
}

const tutorialSteps = [
  {
    id: "welcome",
    title: "Welcome to Your Library! 📚",
    description: "Your personal collection of AI-powered stories. Let's explore how to make the most of it!",
    icon: Library,
    position: "center" as const,
  },
  {
    id: "search-filter",
    title: "Search and Filter Stories",
    description: "Use the search bar and filters to quickly find stories by title, language, theme, or difficulty level.",
    icon: Filter,
    targetSelector: '[data-tutorial="search-filter"]',
    position: "bottom" as const,
  },
  {
    id: "content-tabs",
    title: "Filter by Content Type",
    description: "Switch between All stories, Podcasts, or Films to view specific content formats.",
    icon: Play,
    targetSelector: '[data-tutorial="content-tabs"]',
    position: "bottom" as const,
  },
  {
    id: "story-grid",
    title: "Your Story Collection",
    description: "All your stories are displayed here with progress indicators. Click any story to continue learning!",
    icon: Library,
    targetSelector: '[data-tutorial="story-grid"]',
    position: "top" as const,
  },
  {
    id: "collections",
    title: "Organize with Collections",
    description: "Create collections to organize your stories by topic, language, or learning goals. After this tour, use the Tutorial button at the bottom whenever you need it again.",
    icon: FolderOpen,
    targetSelector: '[data-tutorial="collections-button"]',
    position: "bottom" as const,
  },
];

export function LibraryOnboardingTutorial({ onComplete }: LibraryOnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState(() => {
    if (typeof window === "undefined") {
      return { top: 0, left: 0 };
    }
    return { top: window.innerHeight / 2, left: window.innerWidth / 2 };
  });
  const prevElementRef = useRef<HTMLElement | null>(null);

  const step = tutorialSteps[currentStep];
  const Icon = step.icon;

  const cleanupElement = useCallback((el: HTMLElement | null) => {
    if (el) {
      el.style.boxShadow = "";
      el.style.zIndex = "";
      el.style.position = "";
      el.style.borderRadius = "";
      el.style.transition = "";
    }
  }, []);

  useEffect(() => {
    cleanupElement(prevElementRef.current);

    if (step.targetSelector) {
      const element = document.querySelector(step.targetSelector) as HTMLElement;
      prevElementRef.current = element;

      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });

        const updatePositions = () => {
          const rect = element.getBoundingClientRect();
          setTargetRect(rect);

          const viewportPadding = 16;
          const tooltipWidth = Math.min(400, window.innerWidth - viewportPadding * 2);
          const estimatedTooltipHeight = window.innerWidth < 640 ? 300 : 260;

          let top =
            step.position === "top"
              ? rect.top - estimatedTooltipHeight - 16
              : rect.bottom + 16;

          if (step.position === "top" && top < viewportPadding) {
            top = rect.bottom + 16;
          }

          const maxTop = Math.max(
            viewportPadding,
            window.innerHeight - estimatedTooltipHeight - viewportPadding
          );
          top = Math.max(viewportPadding, Math.min(maxTop, top));

          let left = window.innerWidth / 2;
          const minLeft = viewportPadding + tooltipWidth / 2;
          const maxLeft = window.innerWidth - viewportPadding - tooltipWidth / 2;
          left = Math.max(minLeft, Math.min(maxLeft, left));

          setTooltipPosition({ top, left });
        };

        const animationFrameId = window.requestAnimationFrame(updatePositions);
        const timeoutId = window.setTimeout(updatePositions, 300);
        window.addEventListener("resize", updatePositions);
        window.addEventListener("scroll", updatePositions, { passive: true });

        element.style.position = "relative";
        element.style.zIndex = "1002";
        element.style.boxShadow = "0 0 0 4px rgba(147, 51, 234, 0.5), 0 0 20px rgba(147, 51, 234, 0.2)";
        element.style.borderRadius = "8px";
        element.style.transition = "all 0.3s ease";

        return () => {
          window.cancelAnimationFrame(animationFrameId);
          window.clearTimeout(timeoutId);
          window.removeEventListener("resize", updatePositions);
          window.removeEventListener("scroll", updatePositions);
        };
      }

      setTargetRect(null);
      prevElementRef.current = null;
      setTooltipPosition({ top: window.innerHeight / 2, left: window.innerWidth / 2 });
      return;
    }

    setTargetRect(null);
    prevElementRef.current = null;
    setTooltipPosition({ top: window.innerHeight / 2, left: window.innerWidth / 2 });
    return;
  }, [currentStep, step, cleanupElement]);

  useEffect(() => {
    return () => {
      cleanupElement(prevElementRef.current);
    };
  }, [cleanupElement]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      cleanupElement(prevElementRef.current);
      onComplete();
    }
  };

  const handleSkip = () => {
    cleanupElement(prevElementRef.current);
    onComplete();
  };

  const renderOverlay = () => {
    if (targetRect) {
      const padding = 6;
      const r = {
        top: targetRect.top - padding,
        left: targetRect.left - padding,
        width: targetRect.width + padding * 2,
        height: targetRect.height + padding * 2,
      };
      return (
        <div className="fixed inset-0 z-[1000]" onClick={handleSkip}>
          <svg width="100%" height="100%" className="absolute inset-0">
            <defs>
              <mask id="tutorial-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect
                  x={r.left}
                  y={r.top}
                  width={r.width}
                  height={r.height}
                  rx="8"
                  fill="black"
                />
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0,0,0,0.5)"
              mask="url(#tutorial-mask)"
            />
          </svg>
        </div>
      );
    }

    return (
      <div className="fixed inset-0 bg-black/50 z-[1000]" onClick={handleSkip} />
    );
  };

  const renderPulseIndicator = () => {
    if (!targetRect) return null;
    return (
      <div
        className="fixed pointer-events-none z-[1001]"
        style={{
          top: targetRect.top + targetRect.height / 2 - 24,
          left: targetRect.left + targetRect.width / 2 - 24,
        }}
      >
        <div className="relative w-12 h-12">
          <div
            className="absolute inset-0 rounded-full border-2 border-purple-400"
            style={{ animation: "tutorialPing 1.5s cubic-bezier(0, 0, 0.2, 1) infinite" }}
          />
          <div
            className="absolute inset-2 rounded-full border-2 border-purple-500"
            style={{ animation: "tutorialPing 1.5s cubic-bezier(0, 0, 0.2, 1) infinite 0.3s" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-purple-500 shadow-lg" />
          </div>
        </div>
        <style>{`
          @keyframes tutorialPing {
            0% { transform: scale(1); opacity: 0.8; }
            75%, 100% { transform: scale(2.2); opacity: 0; }
          }
        `}</style>
      </div>
    );
  };

  return (
    <>
      {renderOverlay()}
      {renderPulseIndicator()}

      <Card
        className={cn(
          "fixed z-[1003] w-[calc(100vw-2rem)] max-w-[400px] shadow-2xl",
          step.position === "center" && "top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
        )}
        style={
          step.position !== "center"
            ? {
                top: `${tooltipPosition.top}px`,
                left: `${tooltipPosition.left}px`,
                transform: "translateX(-50%)",
              }
            : undefined
        }
      >
        <CardContent className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Icon className="h-5 w-5 text-purple-600" />
              </div>
              <div className="text-sm text-muted-foreground">
                Step {currentStep + 1} of {tutorialSteps.length}
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={handleSkip} className="h-8 w-8 p-0">
              <X className="h-4 w-4" />
            </Button>
          </div>

          <h3 className="text-xl font-semibold mb-2">{step.title}</h3>
          <p className="text-muted-foreground mb-6">{step.description}</p>

          <div className="flex items-center justify-between">
            <Button variant="ghost" size="sm" onClick={handleSkip}>
              Skip Tour
            </Button>
            <Button onClick={handleNext} className="gap-2">
              {currentStep < tutorialSteps.length - 1 ? (
                <>
                  Next <ArrowRight className="h-4 w-4" />
                </>
              ) : (
                "Get Started"
              )}
            </Button>
          </div>

          <div className="flex justify-center gap-1.5 mt-4">
            {tutorialSteps.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "h-1.5 rounded-full transition-all",
                  index === currentStep ? "w-8 bg-purple-600" : "w-1.5 bg-gray-300"
                )}
              />
            ))}
          </div>
        </CardContent>
      </Card>
    </>
  );
}
