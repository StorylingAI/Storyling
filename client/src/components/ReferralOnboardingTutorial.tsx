import { useState, useEffect, useRef, useCallback } from "react";
import { X, ArrowRight, Copy, Share2, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

interface ReferralOnboardingTutorialProps {
  referralCode: string;
  onComplete: () => void;
}

const tutorialSteps = [
  {
    id: "welcome",
    title: "Welcome to the Referral Program! 🎉",
    description: "Let's take a quick tour to help you get started earning free Premium months.",
    icon: TrendingUp,
    position: "center" as "center" | "bottom" | "top",
  },
  {
    id: "referral-code",
    title: "Your Unique Referral Code",
    description: "This is your personal referral code. Share it with friends to track your referrals and earn rewards!",
    icon: Copy,
    targetSelector: '[data-tutorial="referral-code"]',
    position: "bottom" as "center" | "bottom" | "top",
  },
  {
    id: "share-links",
    title: "Easy Sharing Options",
    description: "Use these buttons to quickly share your referral link on social media or via email. The more you share, the more you earn!",
    icon: Share2,
    targetSelector: '[data-tutorial="share-buttons"]',
    position: "bottom" as "center" | "bottom" | "top",
  },
  {
    id: "earnings",
    title: "Track Your Earnings",
    description: "Monitor your successful referrals, total earnings, and available balance here. You'll earn 1 free month for each friend who subscribes!",
    icon: TrendingUp,
    targetSelector: '[data-tutorial="earnings-stats"]',
    position: "bottom" as "center" | "bottom" | "top",
  },
];

export function ReferralOnboardingTutorial({ referralCode, onComplete }: ReferralOnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
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

          let top = rect.bottom + 16;
          let left = rect.left + rect.width / 2;

          if (step.position === "top") {
            top = rect.top - 220;
          }

          const maxLeft = window.innerWidth - 220;
          const minLeft = 220;
          left = Math.max(minLeft, Math.min(maxLeft, left));
          top = Math.max(16, Math.min(window.innerHeight - 240, top));

          setTooltipPosition({ top, left });
        };

        setTimeout(updatePositions, 300);

        element.style.position = "relative";
        element.style.zIndex = "1002";
        element.style.boxShadow = "0 0 0 4px rgba(147, 51, 234, 0.5), 0 0 20px rgba(147, 51, 234, 0.2)";
        element.style.borderRadius = "8px";
        element.style.transition = "all 0.3s ease";
      } else {
        setTargetRect(null);
        prevElementRef.current = null;
      }
    } else {
      setTargetRect(null);
      prevElementRef.current = null;
    }
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
        <div className="fixed inset-0 z-[1000] animate-in fade-in" onClick={handleSkip}>
          <svg width="100%" height="100%" className="absolute inset-0">
            <defs>
              <mask id="referral-tutorial-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect x={r.left} y={r.top} width={r.width} height={r.height} rx="8" fill="black" />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.5)" mask="url(#referral-tutorial-mask)" />
          </svg>
        </div>
      );
    }
    return <div className="fixed inset-0 bg-black/60 z-[1000] animate-in fade-in" onClick={handleSkip} />;
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
          <div className="absolute inset-0 rounded-full border-2 border-purple-400" style={{ animation: "tutorialPing 1.5s cubic-bezier(0, 0, 0.2, 1) infinite" }} />
          <div className="absolute inset-2 rounded-full border-2 border-purple-500" style={{ animation: "tutorialPing 1.5s cubic-bezier(0, 0, 0.2, 1) infinite 0.3s" }} />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-3 h-3 rounded-full bg-purple-500 shadow-lg" />
          </div>
        </div>
        <style>{`@keyframes tutorialPing { 0% { transform: scale(1); opacity: 0.8; } 75%, 100% { transform: scale(2.2); opacity: 0; } }`}</style>
      </div>
    );
  };

  if (step.position === "center") {
    return (
      <>
        {renderOverlay()}

        <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4">
          <Card className="max-w-md w-full animate-in zoom-in-95 slide-in-from-bottom-4">
            <CardContent className="pt-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <Icon className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-xl font-semibold">{step.title}</h3>
                </div>
                <Button variant="ghost" size="icon" onClick={handleSkip}>
                  <X className="h-4 w-4" />
                </Button>
              </div>

              <p className="text-muted-foreground mb-6">{step.description}</p>

              <div className="flex items-center justify-between">
                <div className="flex gap-1">
                  {tutorialSteps.map((_, index) => (
                    <div
                      key={index}
                      className={cn(
                        "h-2 w-2 rounded-full transition-all",
                        index === currentStep ? "bg-purple-600 w-6" : "bg-gray-300"
                      )}
                    />
                  ))}
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={handleSkip}>Skip Tour</Button>
                  <Button onClick={handleNext}>
                    Get Started <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </>
    );
  }

  return (
    <>
      {renderOverlay()}
      {renderPulseIndicator()}

      <div
        className="fixed z-[1003] animate-in zoom-in-95 slide-in-from-top-2"
        style={
          targetRect
            ? {
                top: `${tooltipPosition.top}px`,
                left: `${tooltipPosition.left}px`,
                transform: "translateX(-50%)",
                maxWidth: "400px",
                width: "90vw",
              }
            : {
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                maxWidth: "400px",
                width: "90vw",
              }
        }
      >
        <Card className="shadow-2xl border-purple-200">
          <CardContent className="pt-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 bg-purple-100 rounded">
                  <Icon className="h-4 w-4 text-purple-600" />
                </div>
                <h4 className="font-semibold text-sm">{step.title}</h4>
              </div>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={handleSkip}>
                <X className="h-3 w-3" />
              </Button>
            </div>

            <p className="text-sm text-muted-foreground mb-4">{step.description}</p>

            <div className="flex items-center justify-between">
              <div className="flex gap-1">
                {tutorialSteps.map((_, index) => (
                  <div
                    key={index}
                    className={cn(
                      "h-1.5 w-1.5 rounded-full transition-all",
                      index === currentStep ? "bg-purple-600 w-4" : "bg-gray-300"
                    )}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={handleSkip}>Skip</Button>
                <Button size="sm" onClick={handleNext}>
                  {currentStep === tutorialSteps.length - 1 ? "Finish" : "Next"}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
