import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Trophy, Flame, Star, Crown, Sparkles } from "lucide-react";

const STREAK_BADGES = [
  { weeks: 2, icon: Flame, color: "text-orange-500", bg: "bg-orange-100", label: "2 Week Streak", emoji: "🔥" },
  { weeks: 4, icon: Star, color: "text-yellow-500", bg: "bg-yellow-100", label: "4 Week Champion", emoji: "⭐" },
  { weeks: 8, icon: Trophy, color: "text-purple-500", bg: "bg-purple-100", label: "8 Week Master", emoji: "🏆" },
  { weeks: 12, icon: Crown, color: "text-blue-500", bg: "bg-blue-100", label: "12 Week Legend", emoji: "👑" },
  { weeks: 26, icon: Sparkles, color: "text-pink-500", bg: "bg-pink-100", label: "26 Week Hero", emoji: "✨" },
  { weeks: 52, icon: Crown, color: "text-gradient-to-r from-yellow-500 to-orange-500", bg: "bg-gradient-to-r from-yellow-100 to-orange-100", label: "52 Week Champion", emoji: "🎖️" },
];

export function WeeklyGoalBadges() {
  const { data: streakData } = trpc.weeklyGoal.getWeeklyGoalStreak.useQuery();

  if (!streakData) return null;

  const currentStreak = streakData.weeklyGoalStreak;

  return (
    <Card className="rounded-card shadow-playful border-2">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Trophy className="h-5 w-5 text-purple-600" />
          Weekly Goal Achievements
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Current Streak Display */}
          {currentStreak > 0 && (
            <div className="p-4 rounded-lg bg-gradient-to-r from-purple-50 to-teal-50 border-2 border-purple-200">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-gradient-to-br from-purple-500 to-teal-500 flex items-center justify-center">
                  <Flame className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold gradient-text-primary">{currentStreak} Week Streak!</p>
                  <p className="text-sm text-muted-foreground">Keep crushing your goals! 🚀</p>
                </div>
              </div>
            </div>
          )}

          {/* Badge Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {STREAK_BADGES.map((badge) => {
              const isUnlocked = currentStreak >= badge.weeks;
              const Icon = badge.icon;

              return (
                <div
                  key={badge.weeks}
                  className={`relative p-4 rounded-lg border-2 transition-all ${
                    isUnlocked
                      ? `${badge.bg} border-current ${badge.color} hover:scale-105`
                      : "bg-gray-50 border-gray-200 opacity-50"
                  }`}
                >
                  {isUnlocked && (
                    <div className="absolute -top-2 -right-2">
                      <Badge className="rounded-full bg-green-500 text-white border-0 h-6 w-6 p-0 flex items-center justify-center">
                        ✓
                      </Badge>
                    </div>
                  )}
                  <div className="flex flex-col items-center text-center space-y-2">
                    <div
                      className={`h-12 w-12 rounded-full flex items-center justify-center ${
                        isUnlocked ? badge.bg : "bg-gray-200"
                      }`}
                    >
                      {isUnlocked ? (
                        <span className="text-2xl">{badge.emoji}</span>
                      ) : (
                        <Icon className={`h-6 w-6 ${isUnlocked ? badge.color : "text-gray-400"}`} />
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-semibold ${isUnlocked ? badge.color : "text-gray-500"}`}>
                        {badge.label}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {isUnlocked ? "Unlocked!" : `Reach ${badge.weeks} weeks`}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Motivational Message */}
          {currentStreak === 0 && (
            <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>Start your streak today!</strong> Reach your weekly goal to unlock amazing badges and rewards. 🎯
              </p>
            </div>
          )}

          {currentStreak > 0 && currentStreak < 52 && (
            <div className="text-center p-4 bg-purple-50 rounded-lg border border-purple-200">
              <p className="text-sm text-purple-900">
                <strong>You're on fire!</strong> Keep going to unlock the next badge. Only{" "}
                {STREAK_BADGES.find((b) => b.weeks > currentStreak)?.weeks! - currentStreak} more weeks! 💪
              </p>
            </div>
          )}

          {currentStreak >= 52 && (
            <div className="text-center p-4 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border-2 border-yellow-400">
              <p className="text-sm font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
                🎉 LEGENDARY STATUS! You've unlocked all badges! You're a true language learning champion! 🏆
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
