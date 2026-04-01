import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { X, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { tutorialSounds } from "@/lib/tutorialSounds";
import { TutorialCompletionCelebration } from "@/components/TutorialCompletionCelebration";

interface TutorialStep {
  id: string;
  title: string;
  description: string;
  targetSelector?: string;
  position?: "top" | "bottom" | "left" | "right";
}

const tutorialSteps: TutorialStep[] = [
  {
    id: "welcome",
    title: "Welcome to Storyling AI! 🎉",
    description: "Let's take a quick tour to help you get started with your language learning journey.",
  },
  {
    id: "create-story",
    title: "Create Your First Story",
    description: "Choose between Podcast (audio) or Film (video) format. You can also upload your own content or create multiple stories at once with Batch.",
    targetSelector: "[data-tutorial='create-story']",
    position: "bottom",
  },
  {
    id: "library",
    title: "Your Library",
    description: "All your created stories will appear here. You can filter, sort, and manage your content easily.",
    targetSelector: "[data-tutorial='library']",
    position: "bottom",
  },
  {
    id: "wordbank",
    title: "Build Your Vocabulary",
    description: "Save words while learning and review them later with spaced repetition. Check the badge for words due for review!",
    targetSelector: "[data-tutorial='wordbank']",
    position: "bottom",
  },
  {
    id: "progress",
    title: "Track Your Progress",
    description: "Monitor your learning streak, weekly goals, and achievements to stay motivated!",
    targetSelector: "[data-tutorial='progress']",
    position: "bottom",
  },
  {
    id: "complete",
    title: "You're All Set! 🚀",
    description: "Start creating your first story and begin your language learning adventure. You can always access help from Settings.",
  },
];

export function QuickStartTutorial() {
  const [isActive, setIsActive] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(false);
  const [showCelebration, setShowCelebration] = useState(false);

  const step = tutorialSteps[currentStep];
  const isFirstStep = currentStep === 0;
  const isLastStep = currentStep === tutorialSteps.length - 1;

  useEffect(() => {
    // Check if user has seen the tutorial and is on dashboard
    const seen = localStorage.getItem("hasSeenQuickStartTutorial");
    const currentPath = window.location.pathname;
    const isDashboard = currentPath === '/app' || currentPath === '/dashboard';
    
    if (!seen && isDashboard) {
      // Add a small delay to ensure page is fully loaded
      const timer = setTimeout(() => {
        setIsActive(true);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (seen) {
      setHasSeenTutorial(true);
    }
  }, []);

  const [highlightRect, setHighlightRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    // Scroll target element into view and update highlight when step changes
    if (isActive && step.targetSelector) {
      const selector = step.targetSelector;
      
      // Wait for DOM to be ready
      const updateHighlight = () => {
        const target = document.querySelector(selector) as HTMLElement;
        if (target) {
          // Make sure element is visible and scrolled into view
          target.scrollIntoView({ behavior: 'smooth', block: 'center' });
          
          // Update highlight rectangle
          setTimeout(() => {
            const rect = target.getBoundingClientRect();
            setHighlightRect(rect);
            // Play pop sound when cursor appears
            tutorialSounds.playPopSound();
          }, 300); // Wait for scroll to complete
        } else {
          console.warn(`Tutorial: Element not found for selector: ${selector}`);
          setHighlightRect(null);
        }
      };
      
      // Initial update
      setTimeout(updateHighlight, 100);
      
      // Update on window resize or scroll
      const handleUpdate = () => {
        const target = document.querySelector(selector);
        if (target) {
          setHighlightRect(target.getBoundingClientRect());
        }
      };
      
      window.addEventListener('resize', handleUpdate);
      window.addEventListener('scroll', handleUpdate, true);
      
      return () => {
        window.removeEventListener('resize', handleUpdate);
        window.removeEventListener('scroll', handleUpdate, true);
      };
    } else {
      setHighlightRect(null);
    }
  }, [currentStep, isActive, step.targetSelector]);

  const handleNext = () => {
    tutorialSounds.playClickSound();
    if (currentStep < tutorialSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevious = () => {
    tutorialSounds.playClickSound();
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeTutorial = () => {
    tutorialSounds.playCelebrationSound();
    localStorage.setItem("hasSeenQuickStartTutorial", "true");
    setIsActive(false);
    setShowCelebration(true);
  };

  const handleCelebrationClose = () => {
    setShowCelebration(false);
    setHasSeenTutorial(true);
  };

  const skipTutorial = () => {
    completeTutorial();
  };

  const restartTutorial = () => {
    setCurrentStep(0);
    setIsActive(true);
  };

  if (!isActive) {
    return hasSeenTutorial ? (
      <Button
        variant="ghost"
        size="sm"
        onClick={restartTutorial}
        className="fixed bottom-4 left-4 z-50 rounded-button hover-lift active-scale transition-all"
      >
        <Sparkles className="h-4 w-4 mr-2" />
        Show Tutorial
      </Button>
    ) : null;
  }

  // Calculate position for tooltip - avoid covering the highlighted element
  const getTooltipPosition = () => {
    if (!step.targetSelector || !highlightRect) {
      return {
        position: "fixed" as const,
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
      };
    }

    const rect = highlightRect;
    const cardWidth = 448;
    const cardHeight = 280;
    const gap = 24;
    const viewportHeight = window.innerHeight;
    const viewportWidth = window.innerWidth;
    const padding = 16;

    const positions = [
      {
        name: 'right',
        top: rect.top + rect.height / 2 - cardHeight / 2,
        left: rect.right + gap,
        fits: rect.right + gap + cardWidth + padding < viewportWidth,
      },
      {
        name: 'left',
        top: rect.top + rect.height / 2 - cardHeight / 2,
        left: rect.left - cardWidth - gap,
        fits: rect.left - cardWidth - gap > padding,
      },
      {
        name: 'bottom',
        top: rect.bottom + gap,
        left: rect.left + rect.width / 2 - cardWidth / 2,
        fits: rect.bottom + gap + cardHeight + padding < viewportHeight,
      },
      {
        name: 'top',
        top: rect.top - cardHeight - gap,
        left: rect.left + rect.width / 2 - cardWidth / 2,
        fits: rect.top - cardHeight - gap > padding,
      },
    ];

    let selectedPosition = positions.find(p => p.fits) || positions[2];

    let calculatedTop = selectedPosition.top;
    let calculatedLeft = selectedPosition.left;

    if (calculatedTop < padding) {
      calculatedTop = padding;
    } else if (calculatedTop + cardHeight > viewportHeight - padding) {
      calculatedTop = viewportHeight - cardHeight - padding;
    }

    if (calculatedLeft < padding) {
      calculatedLeft = padding;
    } else if (calculatedLeft + cardWidth > viewportWidth - padding) {
      calculatedLeft = viewportWidth - cardWidth - padding;
    }

    return {
      position: "fixed" as const,
      top: `${calculatedTop}px`,
      left: `${calculatedLeft}px`,
    };
  };

  // Render overlay with cutout hole for the target element
  const renderOverlay = () => {
    if (highlightRect) {
      const padding = 8;
      const r = {
        top: highlightRect.top - padding,
        left: highlightRect.left - padding,
        width: highlightRect.width + padding * 2,
        height: highlightRect.height + padding * 2,
      };
      return (
        <div className="fixed inset-0 z-40 animate-fade-in" onClick={skipTutorial}>
          <svg width="100%" height="100%" className="absolute inset-0">
            <defs>
              <mask id="quickstart-tutorial-mask">
                <rect width="100%" height="100%" fill="white" />
                <rect x={r.left} y={r.top} width={r.width} height={r.height} rx="16" fill="black" />
              </mask>
            </defs>
            <rect width="100%" height="100%" fill="rgba(0,0,0,0.5)" mask="url(#quickstart-tutorial-mask)" />
          </svg>
        </div>
      );
    }
    return <div className="fixed inset-0 bg-black/50 z-40 animate-fade-in" onClick={skipTutorial} />;
  };

  // Render pulse indicator instead of cartoon hand
  const renderPulseIndicator = () => {
    if (!highlightRect) return null;
    return (
      <div
        className="fixed pointer-events-none z-[45]"
        style={{
          top: highlightRect.top + highlightRect.height / 2 - 24,
          left: highlightRect.left + highlightRect.width / 2 - 24,
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
        <style>{`@keyframes tutorialPing { 0% { transform: scale(1); opacity: 0.8; } 75%, 100% { transform: scale(2.2); opacity: 0; } }`}</style>
      </div>
    );
  };

  return (
    <>
      {renderOverlay()}

      {/* Highlight border around target element */}
      {step.targetSelector && highlightRect && (
        <div
          className="fixed pointer-events-none animate-pulse"
          style={{
            top: `${highlightRect.top - 8}px`,
            left: `${highlightRect.left - 8}px`,
            width: `${highlightRect.width + 16}px`,
            height: `${highlightRect.height + 16}px`,
            border: "4px solid #8b5cf6",
            borderRadius: "16px",
            boxShadow: "0 0 0 8px rgba(139, 92, 246, 0.3), 0 0 32px rgba(139, 92, 246, 0.5)",
            zIndex: 45,
            transition: "all 0.3s ease-in-out",
          }}
        />
      )}

      {renderPulseIndicator()}

      {/* Tutorial Card */}
      <Card
        className="z-50 w-full max-w-md rounded-card shadow-playful-lg border-2 animate-scale-in"
        style={getTooltipPosition()}
      >
        <CardContent className="p-6 space-y-4">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-xl font-bold mb-2">{step.title}</h3>
              <p className="text-muted-foreground">{step.description}</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={skipTutorial}
              className="rounded-button hover-lift active-scale transition-all -mt-2 -mr-2"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          <div className="flex items-center justify-between pt-4">
            <div className="flex gap-1">
              {tutorialSteps.map((_, index) => (
                <div
                  key={index}
                  className={`h-2 w-2 rounded-full transition-all ${
                    index === currentStep
                      ? "bg-primary w-6"
                      : index < currentStep
                      ? "bg-primary/50"
                      : "bg-muted"
                  }`}
                />
              ))}
            </div>

            <div className="flex gap-2">
              {!isFirstStep && (
                <Button
                  variant="outline"
                  onClick={handlePrevious}
                  className="rounded-button hover-lift active-scale transition-all"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              )}
              {!isLastStep && (
                <Button
                  onClick={handleNext}
                  className="rounded-button gradient-primary text-white hover-lift border-0"
                >
                  Next
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              )}
              {isLastStep && (
                <Button
                  onClick={completeTutorial}
                  className="rounded-button gradient-primary text-white hover-lift border-0"
                >
                  Get Started
                  <Sparkles className="h-4 w-4 ml-2" />
                </Button>
              )}
            </div>
          </div>

          {isFirstStep && (
            <Button
              variant="ghost"
              onClick={skipTutorial}
              className="w-full rounded-button hover-lift active-scale transition-all"
            >
              Skip Tutorial
            </Button>
          )}
        </CardContent>
      </Card>

      {/* Celebration Modal */}
      <TutorialCompletionCelebration
        isOpen={showCelebration}
        onClose={handleCelebrationClose}
        tutorialName="Quick Start Tutorial"
        badgeTitle="Quick Start Champion"
        badgeDescription="You've mastered the basics of Storyling AI!"
      />
    </>
  );
}
