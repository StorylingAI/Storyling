import { useState, useEffect } from "react";
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
    position: "center",
  },
  {
    id: "referral-code",
    title: "Your Unique Referral Code",
    description: "This is your personal referral code. Share it with friends to track your referrals and earn rewards!",
    icon: Copy,
    targetSelector: '[data-tutorial="referral-code"]',
    position: "bottom",
  },
  {
    id: "share-links",
    title: "Easy Sharing Options",
    description: "Use these buttons to quickly share your referral link on social media or via email. The more you share, the more you earn!",
    icon: Share2,
    targetSelector: '[data-tutorial="share-buttons"]',
    position: "bottom",
  },
  {
    id: "earnings",
    title: "Track Your Earnings",
    description: "Monitor your successful referrals, total earnings, and available balance here. You'll earn 1 free month for each friend who subscribes!",
    icon: TrendingUp,
    targetSelector: '[data-tutorial="earnings-stats"]',
    position: "bottom",
  },
];

export function ReferralOnboardingTutorial({ referralCode, onComplete }: ReferralOnboardingTutorialProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [targetElement, setTargetElement] = useState<HTMLElement | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });

  const step = tutorialSteps[currentStep];
  const Icon = step.icon;

  useEffect(() => {
    if (step.targetSelector) {
      const element = document.querySelector(step.targetSelector) as HTMLElement;
      setTargetElement(element);

      if (element) {
        // Scroll element into view
        element.scrollIntoView({ behavior: "smooth", block: "center" });

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

        // Add highlight effect
        element.style.position = "relative";
        element.style.zIndex = "1001";
        element.style.boxShadow = "0 0 0 4px rgba(147, 51, 234, 0.3)";
        element.style.borderRadius = "8px";
        element.style.transition = "all 0.3s ease";
      }
    } else {
      setTargetElement(null);
    }

    return () => {
      if (targetElement) {
        targetElement.style.boxShadow = "";
        targetElement.style.zIndex = "";
      }
    };
  }, [currentStep, step]);

  const handleNext = () => {
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleComplete = () => {
    if (targetElement) {
      targetElement.style.boxShadow = "";
      targetElement.style.zIndex = "";
    }
    onComplete();
  };

  if (step.position === "center") {
    return (
      <>
        {/* Overlay */}
        <div className="fixed inset-0 bg-black/60 z-[1000] animate-in fade-in" />

        {/* Center Modal */}
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
                  <Button variant="ghost" onClick={handleSkip}>
                    Skip Tour
                  </Button>
                  <Button onClick={handleNext}>
                    Get Started
                    <ArrowRight className="ml-2 h-4 w-4" />
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
      {/* Overlay */}
      <div className="fixed inset-0 bg-black/40 z-[1000] animate-in fade-in" />

      {/* Tooltip */}
      <div
        className="fixed z-[1002] animate-in zoom-in-95 slide-in-from-top-2"
        style={{
          top: `${tooltipPosition.top}px`,
          left: `${tooltipPosition.left}px`,
          transform: "translateX(-50%)",
          maxWidth: "400px",
          width: "90vw",
        }}
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
                <Button variant="ghost" size="sm" onClick={handleSkip}>
                  Skip
                </Button>
                <Button size="sm" onClick={handleNext}>
                  {currentStep === tutorialSteps.length - 1 ? "Finish" : "Next"}
                  <ArrowRight className="ml-1 h-3 w-3" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Arrow pointing to target */}
        <div
          className={cn(
            "absolute w-0 h-0 border-l-8 border-r-8 border-transparent",
            step.position === "bottom" ? "border-b-8 border-b-white -top-2 left-1/2 -translate-x-1/2" : "border-t-8 border-t-white -bottom-2 left-1/2 -translate-x-1/2"
          )}
        />
      </div>
    </>
  );
}
