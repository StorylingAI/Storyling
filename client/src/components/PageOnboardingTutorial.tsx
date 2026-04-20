import { useEffect, useState } from "react";
import { ArrowLeft, ArrowRight, HelpCircle, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

interface PageTutorialStep {
  title: string;
  description: string;
}

interface PageOnboardingTutorialProps {
  storageKey: string;
  title: string;
  steps: PageTutorialStep[];
}

export function PageOnboardingTutorial({ storageKey, title, steps }: PageOnboardingTutorialProps) {
  const [open, setOpen] = useState(false);
  const [hasSeen, setHasSeen] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const seen = localStorage.getItem(storageKey) === "true";
    setHasSeen(seen);

    if (!seen) {
      const timer = window.setTimeout(() => setOpen(true), 700);
      return () => window.clearTimeout(timer);
    }
  }, [storageKey]);

  const completeTutorial = () => {
    localStorage.setItem(storageKey, "true");
    setHasSeen(true);
    setOpen(false);
    setStepIndex(0);
  };

  const restartTutorial = () => {
    setStepIndex(0);
    setOpen(true);
  };

  const step = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  return (
    <>
      {hasSeen && !open && (
        <Button
          type="button"
          onClick={restartTutorial}
          className="fixed bottom-5 right-5 z-50 rounded-full bg-white text-purple-700 shadow-lg border border-purple-200 hover:bg-purple-50"
          variant="outline"
        >
          <HelpCircle className="mr-2 h-4 w-4" />
          Tutorial
        </Button>
      )}

      <Dialog
        open={open}
        onOpenChange={(nextOpen) => {
          if (!nextOpen) {
            completeTutorial();
          } else {
            setOpen(true);
          }
        }}
      >
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-purple-600">
                  Step {stepIndex + 1} of {steps.length}
                </p>
                <DialogTitle className="mt-1 text-2xl">{title}</DialogTitle>
              </div>
              <Button type="button" variant="ghost" size="icon" onClick={completeTutorial}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </DialogHeader>

          <div className="space-y-5">
            <div>
              <h3 className="text-lg font-semibold text-gray-900">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-gray-600">{step.description}</p>
            </div>

            <div className="flex justify-center gap-1.5">
              {steps.map((_, index) => (
                <span
                  key={index}
                  className={`h-1.5 rounded-full transition-all ${
                    index === stepIndex ? "w-8 bg-purple-600" : "w-1.5 bg-gray-300"
                  }`}
                />
              ))}
            </div>

            <div className="flex items-center justify-between gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStepIndex((current) => Math.max(current - 1, 0))}
                disabled={stepIndex === 0}
                className="rounded-lg"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back
              </Button>
              <Button
                type="button"
                onClick={() => {
                  if (isLastStep) {
                    completeTutorial();
                  } else {
                    setStepIndex((current) => current + 1);
                  }
                }}
                className="rounded-lg bg-purple-600 text-white hover:bg-purple-700"
              >
                {isLastStep ? "Done" : "Next"}
                {!isLastStep && <ArrowRight className="ml-2 h-4 w-4" />}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
