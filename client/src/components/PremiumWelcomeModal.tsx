import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Sparkles, Film, Infinity, BarChart3, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import confetti from "canvas-confetti";

interface PremiumWelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

const premiumFeatures = [
  {
    icon: Infinity,
    title: "Unlimited Stories",
    description: "Create as many stories as you want - no monthly limits",
    gradient: "from-purple-500 to-pink-500"
  },
  {
    icon: Film,
    title: "Film Format Access",
    description: "Generate cinematic video stories with AI-powered visuals",
    gradient: "from-blue-500 to-cyan-500"
  },
  {
    icon: Zap,
    title: "Priority Generation",
    description: "Skip the queue with faster story and video generation",
    gradient: "from-orange-500 to-yellow-500"
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Track your learning progress with detailed insights",
    gradient: "from-green-500 to-emerald-500"
  },
  {
    icon: Sparkles,
    title: "Premium Support",
    description: "Get priority help from our support team",
    gradient: "from-indigo-500 to-purple-500"
  }
];

export function PremiumWelcomeModal({ open, onClose }: PremiumWelcomeModalProps) {
  const [hasTriggeredConfetti, setHasTriggeredConfetti] = useState(false);

  useEffect(() => {
    if (open && !hasTriggeredConfetti) {
      // Trigger confetti animation
      const duration = 3000;
      const animationEnd = Date.now() + duration;
      const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 1000 };

      const randomInRange = (min: number, max: number) => {
        return Math.random() * (max - min) + min;
      };

      const interval = setInterval(() => {
        const timeLeft = animationEnd - Date.now();

        if (timeLeft <= 0) {
          clearInterval(interval);
          return;
        }

        const particleCount = 50 * (timeLeft / duration);
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 }
        });
        confetti({
          ...defaults,
          particleCount,
          origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 }
        });
      }, 250);

      setHasTriggeredConfetti(true);

      return () => clearInterval(interval);
    }
  }, [open, hasTriggeredConfetti]);

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose()}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <Sparkles className="w-16 h-16 text-yellow-500 animate-pulse" />
              <div className="absolute inset-0 bg-yellow-500/20 rounded-full blur-xl animate-pulse" />
            </div>
          </div>
          <DialogTitle className="text-3xl font-bold text-center bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Welcome to Premium! 🎉
          </DialogTitle>
          <p className="text-center text-muted-foreground mt-2">
            You now have access to all premium features. Here's what you can do:
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
          {premiumFeatures.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div
                key={index}
                className="relative group p-6 rounded-lg border bg-card hover:shadow-lg transition-all duration-300"
              >
                <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 rounded-lg transition-opacity duration-300" 
                     style={{
                       backgroundImage: `linear-gradient(to bottom right, var(--tw-gradient-stops))`
                     }}
                />
                <div className={`inline-flex p-3 rounded-lg bg-gradient-to-br ${feature.gradient} mb-4`}>
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-semibold text-lg mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            );
          })}
        </div>

        <div className="mt-8 flex justify-center">
          <Button
            size="lg"
            onClick={onClose}
            className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-8"
          >
            Start Exploring
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
