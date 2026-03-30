import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Target, TrendingUp, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export function WeeklyGoalWidget() {
  const [, setLocation] = useLocation();
  const { data: goalStatus, isLoading } = trpc.weeklyGoal.getWeeklyGoalStatus.useQuery();

  if (isLoading || !goalStatus) {
    return (
      <Card className="rounded-card shadow-playful border-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            Weekly Goal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-24 flex items-center justify-center">
            <div className="animate-pulse text-muted-foreground">Loading...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { weeklyGoal, weeklyProgress, isGoalReached } = goalStatus;
  const progressPercentage = Math.min((weeklyProgress / weeklyGoal) * 100, 100);

  return (
    <Card className="rounded-card shadow-playful border-2 overflow-hidden">
      <CardHeader className={`${isGoalReached ? 'bg-gradient-to-r from-purple-50 to-teal-50' : ''}`}>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            Weekly Goal
          </div>
          {isGoalReached && (
            <div className="flex items-center gap-1 text-sm font-normal text-green-600">
              <Sparkles className="h-4 w-4" />
              Exceeded!
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <div className="space-y-4">
          {/* Progress Stats */}
          <div className="flex items-end justify-between">
            <div>
              <div className="text-3xl font-bold gradient-text-primary">
                {weeklyProgress}/{weeklyGoal}
              </div>
              <div className="text-sm text-muted-foreground">
                stories this week
              </div>
            </div>
            {isGoalReached && (
              <div className="text-5xl animate-bounce">🎉</div>
            )}
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ease-out ${
                  isGoalReached
                    ? 'bg-gradient-to-r from-green-500 to-emerald-500'
                    : 'bg-gradient-to-r from-purple-500 to-teal-500'
                }`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{progressPercentage.toFixed(0)}% complete</span>
              {!isGoalReached && (
                <span>{weeklyGoal - weeklyProgress} more to go!</span>
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            {!isGoalReached ? (
              <Button
                onClick={() => setLocation("/create")}
                className="flex-1 rounded-button gradient-primary text-white hover-lift border-0"
                size="sm"
              >
                <TrendingUp className="mr-2 h-4 w-4" />
                Create Story
              </Button>
            ) : (
              <Button
                onClick={() => setLocation("/practice")}
                className="flex-1 rounded-button gradient-primary text-white hover-lift border-0"
                size="sm"
              >
                <Sparkles className="mr-2 h-4 w-4" />
                Practice Now
              </Button>
            )}
            <Button
              onClick={() => setLocation("/settings")}
              variant="outline"
              className="rounded-button"
              size="sm"
            >
              Settings
            </Button>
          </div>

          {/* Motivational Message */}
          {!isGoalReached && weeklyProgress > 0 && (
            <div className="text-xs text-center text-muted-foreground pt-2 border-t">
              {weeklyProgress >= weeklyGoal * 0.75
                ? "Almost there! You're doing amazing! 🌟"
                : weeklyProgress >= weeklyGoal * 0.5
                ? "Great progress! Keep it up! 💪"
                : "You've got this! One story at a time! 🚀"}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
