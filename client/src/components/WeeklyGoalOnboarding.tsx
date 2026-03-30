import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { Target, Sparkles, TrendingUp } from "lucide-react";

export function WeeklyGoalOnboarding() {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedGoal, setSelectedGoal] = useState("3");
  const utils = trpc.useUtils();
  const { user, loading: authLoading } = useAuth();
  const { data: goalStatus } = trpc.weeklyGoal.getWeeklyGoalStatus.useQuery(
    undefined,
    {
      enabled: Boolean(user) && !authLoading,
    }
  );

  const updateGoalMutation = trpc.weeklyGoal.updateWeeklyGoal.useMutation({
    onSuccess: () => {
      utils.weeklyGoal.getWeeklyGoalStatus.invalidate();
      toast.success("Weekly goal set successfully! 🎯");
      setIsOpen(false);
      
      // Mark onboarding as completed
      localStorage.setItem("hasCompletedWeeklyGoalOnboarding", "true");
    },
    onError: (error) => {
      toast.error("Failed to set weekly goal: " + error.message);
    },
  });

  useEffect(() => {
    // Check if user is logged in and hasn't completed onboarding
    if (user && goalStatus) {
      const hasCompletedOnboarding = localStorage.getItem("hasCompletedWeeklyGoalOnboarding");
      
      // Show onboarding if:
      // 1. User hasn't completed onboarding before
      // 2. User has default goal (3 stories) - indicating they haven't customized it
      if (!hasCompletedOnboarding && goalStatus.weeklyGoal === 3 && goalStatus.weeklyProgress === 0) {
        // Delay showing modal slightly to avoid overwhelming new users
        setTimeout(() => setIsOpen(true), 2000);
      }
    }
  }, [goalStatus, user]);

  const handleSetGoal = () => {
    const goal = parseInt(selectedGoal);
    if (isNaN(goal) || goal < 1 || goal > 100) {
      toast.error("Please select a valid goal");
      return;
    }
    updateGoalMutation.mutate({ weeklyGoal: goal });
  };

  const handleSkip = () => {
    localStorage.setItem("hasCompletedWeeklyGoalOnboarding", "true");
    setIsOpen(false);
    toast.info("You can set your weekly goal anytime in Settings");
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-100 to-teal-100 flex items-center justify-center">
              <Target className="h-8 w-8 text-purple-600" />
            </div>
          </div>
          <DialogTitle className="text-center text-2xl">Set Your Weekly Goal</DialogTitle>
          <DialogDescription className="text-center">
            Stay motivated by setting a weekly story creation goal. Consistent practice is key to language learning success!
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Benefits */}
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <Sparkles className="h-5 w-5 text-purple-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Build Consistency</p>
                <p className="text-xs text-muted-foreground">Regular practice accelerates your learning</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <TrendingUp className="h-5 w-5 text-teal-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Track Progress</p>
                <p className="text-xs text-muted-foreground">See your achievements and stay motivated</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <Target className="h-5 w-5 text-pink-500 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm">Earn Badges</p>
                <p className="text-xs text-muted-foreground">Unlock streak achievements and rewards</p>
              </div>
            </div>
          </div>

          {/* Goal Selection */}
          <div className="space-y-3">
            <Label htmlFor="goal-select" className="text-sm font-medium">
              How many stories per week?
            </Label>
            <Select value={selectedGoal} onValueChange={setSelectedGoal}>
              <SelectTrigger id="goal-select" className="w-full">
                <SelectValue placeholder="Select your weekly goal" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">1 story - Getting Started</SelectItem>
                <SelectItem value="2">2 stories - Light Practice</SelectItem>
                <SelectItem value="3">3 stories - Recommended</SelectItem>
                <SelectItem value="5">5 stories - Committed</SelectItem>
                <SelectItem value="7">7 stories - Daily Practice</SelectItem>
                <SelectItem value="10">10+ stories - Intensive</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Don't worry, you can change this anytime in Settings
            </p>
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2">
            <Button
              onClick={handleSetGoal}
              disabled={updateGoalMutation.isPending}
              className="w-full rounded-full bg-gradient-to-r from-purple-500 to-teal-500 hover:opacity-90 text-white border-0"
            >
              {updateGoalMutation.isPending ? "Setting Goal..." : "Set My Goal"}
            </Button>
            <Button
              variant="ghost"
              onClick={handleSkip}
              className="w-full rounded-full"
            >
              Skip for Now
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
