import { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Target, X, Sparkles, TrendingUp, Clock } from "lucide-react";

export function WeeklyGoalReminder() {
  const [, setLocation] = useLocation();
  const [isDismissed, setIsDismissed] = useState(false);
  const { data: goalStatus } = trpc.weeklyGoal.getWeeklyGoalStatus.useQuery();

  // Check if reminder should be shown
  const shouldShowReminder = () => {
    if (!goalStatus || isDismissed) return false;

    const { weeklyGoal, weeklyProgress, isGoalReached } = goalStatus;
    
    // Don't show if goal is already reached
    if (isGoalReached) return false;

    // Calculate days remaining in the week
    const now = new Date();
    const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
    const daysRemaining = 7 - dayOfWeek;

    // Show reminder if:
    // 1. Less than 3 days remaining in the week
    // 2. User is behind on their goal
    const storiesRemaining = weeklyGoal - weeklyProgress;
    const isRunningLate = daysRemaining <= 3 && storiesRemaining > 0;
    const isFallingBehind = daysRemaining <= 2 && storiesRemaining >= 2;

    return isRunningLate || isFallingBehind;
  };

  const getReminderMessage = () => {
    if (!goalStatus) return null;

    const { weeklyGoal, weeklyProgress } = goalStatus;
    const storiesRemaining = weeklyGoal - weeklyProgress;
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysRemaining = 7 - dayOfWeek;

    if (daysRemaining === 1) {
      return {
        icon: Clock,
        color: "red",
        title: "Last Day to Reach Your Goal!",
        message: `You need ${storiesRemaining} more ${storiesRemaining === 1 ? "story" : "stories"} to hit your weekly goal. You've got this! 🔥`,
        cta: "Create Story Now",
      };
    } else if (daysRemaining === 2) {
      return {
        icon: TrendingUp,
        color: "orange",
        title: "Only 2 Days Left!",
        message: `${storiesRemaining} more ${storiesRemaining === 1 ? "story" : "stories"} to reach your goal. Keep the momentum going! 💪`,
        cta: "Continue Learning",
      };
    } else {
      return {
        icon: Target,
        color: "blue",
        title: "Stay on Track!",
        message: `You have ${storiesRemaining} ${storiesRemaining === 1 ? "story" : "stories"} left to complete this week - ${daysRemaining} days remaining!`,
        cta: "Create Story",
      };
    }
  };

  const handleDismiss = () => {
    setIsDismissed(true);
    // Store dismissal in sessionStorage (resets when browser closes)
    sessionStorage.setItem("weeklyGoalReminderDismissed", "true");
  };

  const handleAction = () => {
    setLocation("/create");
  };

  // Check sessionStorage on mount
  useEffect(() => {
    const dismissed = sessionStorage.getItem("weeklyGoalReminderDismissed");
    if (dismissed) {
      setIsDismissed(true);
    }
  }, []);

  if (!shouldShowReminder()) return null;

  const reminder = getReminderMessage();
  if (!reminder) return null;

  const Icon = reminder.icon;
  const bgColorClass = 
    reminder.color === "red" ? "bg-red-50 border-red-200" :
    reminder.color === "orange" ? "bg-orange-50 border-orange-200" :
    "bg-blue-50 border-blue-200";
  
  const iconColorClass =
    reminder.color === "red" ? "text-red-600" :
    reminder.color === "orange" ? "text-orange-600" :
    "text-blue-600";

  const buttonColorClass =
    reminder.color === "red" ? "bg-gradient-to-r from-red-500 to-pink-500" :
    reminder.color === "orange" ? "bg-gradient-to-r from-orange-500 to-yellow-500" :
    "bg-gradient-to-r from-blue-500 to-purple-500";

  return (
    <Alert className={`${bgColorClass} border-2 relative animate-slide-down rounded-xl shadow-sm`}>
      <button
        onClick={handleDismiss}
        className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-black/10 transition-colors z-10"
        aria-label="Dismiss reminder"
      >
        <X className="h-4 w-4" />
      </button>
      
      <div className="flex items-center gap-4 pr-12">
        <div className="flex-shrink-0">
          <div className={`w-12 h-12 rounded-full ${bgColorClass} flex items-center justify-center`}>
            <Icon className={`h-6 w-6 ${iconColorClass}`} />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="font-bold text-lg mb-1">{reminder.title}</div>
          <p className="text-sm text-muted-foreground leading-relaxed">{reminder.message}</p>
        </div>
        <Button
          size="default"
          onClick={handleAction}
          className={`${buttonColorClass} hover:opacity-90 text-white border-0 rounded-full px-6 py-2 whitespace-nowrap flex-shrink-0 shadow-md hover:shadow-lg transition-all font-semibold`}
        >
          <Sparkles className="h-4 w-4 mr-2" />
          {reminder.cta}
        </Button>
      </div>
    </Alert>
  );
}
