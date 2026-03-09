import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, CheckCircle2, Sparkles } from "lucide-react";
import { useLocation } from "wouter";

interface UpgradePromptModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  reason: "story_limit" | "film_format" | "analytics";
}

const UPGRADE_MESSAGES = {
  story_limit: {
    title: "Monthly Story Limit Reached",
    description: "You've created 5 stories this month. Upgrade to Premium for unlimited story generation!",
    icon: Sparkles,
  },
  film_format: {
    title: "Film Format is Premium Only",
    description: "Create immersive AI-generated video stories with Premium. Upgrade now to unlock this feature!",
    icon: Crown,
  },
  analytics: {
    title: "Advanced Analytics is Premium Only",
    description: "Get detailed insights into your learning progress with Premium analytics and reports.",
    icon: Crown,
  },
};

export function UpgradePromptModal({ open, onOpenChange, reason }: UpgradePromptModalProps) {
  const [, setLocation] = useLocation();
  const message = UPGRADE_MESSAGES[reason];
  const Icon = message.icon;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 rounded-full bg-amber-100 dark:bg-amber-900/20">
              <Icon className="h-6 w-6 text-amber-600 dark:text-amber-400" />
            </div>
            <DialogTitle className="text-xl">{message.title}</DialogTitle>
          </div>
          <DialogDescription className="text-base pt-2">{message.description}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-4">
          <h4 className="font-semibold text-sm">Premium Features:</h4>
          <ul className="space-y-2">
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>Unlimited story generation</span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>Access to Film format with AI-generated videos</span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>Advanced vocabulary mastery system</span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>Detailed analytics and insights</span>
            </li>
            <li className="flex items-center gap-2 text-sm">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>Priority support</span>
            </li>
          </ul>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Maybe Later
          </Button>
          <Button
            className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700"
            onClick={() => {
              onOpenChange(false);
              setLocation("/pricing");
            }}
          >
            <Crown className="mr-2 h-4 w-4" />
            Upgrade to Premium
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
