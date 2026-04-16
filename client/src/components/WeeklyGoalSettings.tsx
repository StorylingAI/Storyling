import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2, Target, TrendingUp } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export function WeeklyGoalSettings() {
  const utils = trpc.useUtils();
  const { data: goalStatus, isLoading } = trpc.weeklyGoal.getWeeklyGoalStatus.useQuery();
  const [selectedGoal, setSelectedGoal] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);

  const updateGoalMutation = trpc.weeklyGoal.updateWeeklyGoal.useMutation({
    onSuccess: () => {
      utils.weeklyGoal.getWeeklyGoalStatus.invalidate();
      setShowSuccess(true);
      toast.success("Weekly goal updated successfully!");
      setTimeout(() => setShowSuccess(false), 3000);
    },
    onError: (error) => {
      toast.error("Failed to update weekly goal: " + error.message);
    },
  });

  // Set initial value when data loads
  useEffect(() => {
    if (goalStatus && !selectedGoal) {
      setSelectedGoal(goalStatus.weeklyGoal.toString());
    }
  }, [goalStatus, selectedGoal]);

  const handleSave = () => {
    const goal = parseInt(selectedGoal);
    if (isNaN(goal) || goal < 1 || goal > 100) {
      toast.error("Please select a valid goal between 1 and 100");
      return;
    }
    updateGoalMutation.mutate({ weeklyGoal: goal });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="animate-pulse space-y-3">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="h-10 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  const hasChanged = selectedGoal !== goalStatus?.weeklyGoal.toString();

  return (
    <div className="space-y-6">
      {/* Current Progress */}
      {goalStatus && (
        <div className="bg-gradient-to-r from-purple-50 to-teal-50 rounded-lg p-4 border border-purple-200">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-600" />
              <span className="font-semibold text-gray-900">This Week's Progress</span>
            </div>
            <div className="text-2xl font-bold gradient-text-primary">
              {goalStatus.weeklyProgress}/{goalStatus.weeklyGoal}
            </div>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-purple-500 to-teal-500 transition-all duration-500"
              style={{
                width: `${Math.min((goalStatus.weeklyProgress / goalStatus.weeklyGoal) * 100, 100)}%`,
              }}
            />
          </div>
        </div>
      )}

      {/* Goal Selection */}
      <div className="space-y-3">
        <Label htmlFor="weekly-goal" className="text-sm font-medium">
          Weekly Story Goal
        </Label>
        <p className="text-xs text-muted-foreground">
          Set how many stories you want to create each week. Choose a goal that challenges you but remains achievable!
        </p>
        <Select value={selectedGoal} onValueChange={setSelectedGoal}>
          <SelectTrigger id="weekly-goal" className="w-full">
            <SelectValue placeholder="Select your weekly goal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="1">1 story per week - Getting Started</SelectItem>
            <SelectItem value="2">2 stories per week - Light Practice</SelectItem>
            <SelectItem value="3">3 stories per week - Steady Progress</SelectItem>
            <SelectItem value="5">5 stories per week - Committed Learner</SelectItem>
            <SelectItem value="7">7 stories per week - Daily Practice</SelectItem>
            <SelectItem value="10">10 stories per week - Intensive</SelectItem>
            <SelectItem value="15">15 stories per week - Advanced</SelectItem>
            <SelectItem value="20">20 stories per week - Expert</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Motivational Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
          <div className="space-y-2 text-sm text-blue-900">
            <p className="font-semibold">Tips for Success:</p>
            <ul className="space-y-1 text-xs">
              <li>• Start with a manageable goal and increase gradually</li>
              <li>• Consistency is more important than intensity</li>
              <li>• You'll receive a congratulatory email when you reach your goal</li>
              <li>• Your progress resets every Monday</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <Button
        onClick={handleSave}
        disabled={!hasChanged || updateGoalMutation.isPending}
        className="w-full rounded-button gradient-primary text-white hover-lift border-0"
      >
        {updateGoalMutation.isPending ? "Saving..." : "Save Weekly Goal"}
      </Button>

      {/* Success Message */}
      {showSuccess && (
        <Alert className="border-green-200 bg-green-50">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription className="text-green-900">
            Your weekly goal has been updated successfully!
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
