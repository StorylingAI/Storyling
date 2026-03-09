import { useState, useEffect } from "react";
import { X, ArrowRight, Sparkles, BookOpen, TrendingUp, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface DashboardOnboardingTutorialProps {
  onComplete: () => void;
}

const tutorialSteps = [
  {
    id: "welcome",
    title: "Welcome to Your Dashboard! 🎉",
    description: "Let's take a quick tour to help you discover all the features available to you.",
    icon: Sparkles,
    position: "center",
  },
  {
    id: "create-story",
    title: "Create Your First Story",
    description: "Start your learning journey by creating an AI-powered story tailored to your language level and interests.",
    icon: Sparkles,
    targetSelector: '[data-tutorial="create-story"]',
    position: "bottom",
  },
  {
    id: "recently-watched",
    title: "Continue Where You Left Off",
    description: "Quickly resume stories you've started. Your progress is automatically saved!",
    icon: Play,
    targetSelector: '[data-tutorial="recently-watched"]',
    position: "bottom",
  },
  {
    id: "browse-library",
    title: "Explore Your Library",
    description: "Access all your stories, filter by language or theme, and track your learning progress.",
    icon: BookOpen,
    targetSelector: '[data-tutorial="browse-library"]',
    position: "bottom",
  },
  {
    id: "progress-tracking",
    title: "Track Your Progress",
    description: "Monitor your learning streaks, XP points, and achievements to stay motivated!",
    icon: TrendingUp,
    targetSelector: '[data-tutorial="progress-tracking"]',
    position: "bottom",
  },
];

export function DashboardOnboardingTutorial({ onComplete }: DashboardOnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [cursorPosition, setCursorPosition] = useState({ top: 0, left: 0 });

  const step = tutorialSteps[currentStep];
  const Icon = step.icon;

  useEffect(() => {
    if (step.targetSelector) {
      const element = document.querySelector(step.targetSelector) as HTMLElement;
      setTargetElement(element);

      if (element) {
        // Scroll element into view
        element.scrollIntoView({ behavior: "smooth", block: "center" });

        // Wait for scroll to complete before calculating positions
        setTimeout(() => {
          // Calculate tooltip position
          const rect = element.getBoundingClientRect();
          const scrollY = window.scrollY || window.pageYOffset;
          const scrollX = window.scrollX || window.pageXOffset;

          let top = rect.bottom + scrollY + 16;
          let left = rect.left + scrollX + rect.width / 2;

          // Adjust if tooltip would go off-screen
          if (step.position === "top") {
            top = rect.top + scrollY - 200;
          }

          setTooltipPosition({ top, left });

          // Calculate cursor position (center of target element)
          // Use viewport-relative coordinates for fixed positioning
          const cursorTop = rect.top + rect.height / 2 - 20;
          const cursorLeft = rect.left + rect.width / 2 - 16;
          setCursorPosition({ top: cursorTop, left: cursorLeft });
        }, 300);

        // Add highlight effect
        element.style.position = "relative";
        element.style.zIndex = "1001";
        element.style.boxShadow = "0 0 0 4px rgba(147, 51, 234, 0.5), 0 0 20px rgba(147, 51, 234, 0.3)";
        element.style.borderRadius = "12px";
        element.style.transition = "all 0.3s ease";
        element.style.backgroundColor = "white";
      }
    } else {
      setTargetElement(null);
    }

    return () => {
      if (targetElement) {
        targetElement.style.boxShadow = "";
        targetElement.style.zIndex = "";
        targetElement.style.backgroundColor = "";
      }
    };
  }, [currentStep, step]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handleSkip = () => {
    onComplete();
  };

  return (
    <>
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/50 z-[1000]" />

      {/* Animated cartoon hand cursor - only show when highlighting an element */}
      {targetElement && (
        <div
          className="fixed pointer-events-none z-[1003]"
          style={{
            top: `${cursorPosition.top}px`,
            left: `${cursorPosition.left}px`,
            animation: "bounce 1s ease-in-out infinite",
          }}
        >
          <img
            src="/cartoon-hand-cursor.png"
            alt="Click here"
            className="w-10 h-10 drop-shadow-2xl"
          />
        </div>
      )}

      {/* Tutorial Card */}
      <Card
        className={cn(
          "fixed z-[1002] w-[400px] shadow-2xl",
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

          {/* Progress Dots */}
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
