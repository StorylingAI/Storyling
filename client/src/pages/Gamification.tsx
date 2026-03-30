import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Flame, Trophy, Award, TrendingUp, Lock, Check, Star, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { MobileNav } from "@/components/MobileNav";

export default function Gamification() {
  const [leaderboardPeriod, setLeaderboardPeriod] = useState<"weekly" | "monthly" | "allTime">("weekly");

  const { data: stats } = trpc.gamification.getMyStats.useQuery();
  const { data: achievements } = trpc.gamification.getAchievements.useQuery();
  const { data: myAchievements } = trpc.gamification.getMyAchievements.useQuery();
  const { data: leaderboard } = trpc.gamification.getLeaderboard.useQuery({
    period: leaderboardPeriod,
    limit: 10,
  });

  // Calculate XP needed for next level
  const calculateXPForNextLevel = (level: number) => {
    if (level < 2) return 100;
    if (level < 3) return 300;
    if (level < 4) return 600;
    if (level < 5) return 1000;
    return 1000 + (level - 4) * 500;
  };

  const xpForNextLevel = stats ? calculateXPForNextLevel(stats.level) : 100;
  const xpProgress = stats ? (stats.totalXp / xpForNextLevel) * 100 : 0;

  // Get unlocked achievement IDs
  const unlockedIds = new Set(myAchievements?.map((a) => a.achievementId) || []);

  // Group achievements by category
  const achievementsByCategory = achievements?.reduce((acc, achievement) => {
    if (!acc[achievement.category]) {
      acc[achievement.category] = [];
    }
    acc[achievement.category].push(achievement);
    return acc;
  }, {} as Record<string, typeof achievements>);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50">
      <MobileNav title="Achievements" backPath="/app" />
      <div className="max-w-7xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2" style={{ fontFamily: "Fredoka One, cursive" }}>
            Your Progress
          </h1>
          <p className="text-gray-600">Track your streaks, achievements, and compete with others!</p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Current Streak */}
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-2 border-orange-200 hover-lift">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-orange-400 to-red-500 rounded-2xl">
                <Flame className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Current Streak</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.currentStreak || 0}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Longest: {stats?.longestStreak || 0} days</p>
          </Card>

          {/* Level & XP */}
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-2 border-purple-200 hover-lift">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-purple-400 to-pink-500 rounded-2xl">
                <Star className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Level</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.level || 1}</p>
              </div>
            </div>
            <div className="mt-2">
              <Progress value={xpProgress} className="h-2" />
              <p className="text-xs text-gray-500 mt-1">
                {stats?.totalXp || 0} / {xpForNextLevel} XP
              </p>
            </div>
          </Card>

          {/* Total Quizzes */}
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-2 border-teal-200 hover-lift">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-teal-400 to-cyan-500 rounded-2xl">
                <Award className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Quizzes</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.quizzesCompleted || 0}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Completed</p>
          </Card>

          {/* Total Stories */}
          <Card className="p-6 bg-white/80 backdrop-blur-sm border-2 border-pink-200 hover-lift">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-3 bg-gradient-to-br from-pink-400 to-rose-500 rounded-2xl">
                <Trophy className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">Stories</p>
                <p className="text-3xl font-bold text-gray-900">{stats?.storiesCompleted || 0}</p>
              </div>
            </div>
            <p className="text-xs text-gray-500">Created</p>
          </Card>
        </div>

        {/* Tabs for Achievements and Leaderboard */}
        <Tabs defaultValue="achievements" className="w-full">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 mb-6">
            <TabsTrigger value="achievements">
              <Trophy className="w-4 h-4 mr-2" />
              Achievements
            </TabsTrigger>
            <TabsTrigger value="leaderboard">
              <TrendingUp className="w-4 h-4 mr-2" />
              Leaderboard
            </TabsTrigger>
          </TabsList>

          {/* Achievements Tab */}
          <TabsContent value="achievements">
            <div className="space-y-6">
              {achievementsByCategory &&
                Object.entries(achievementsByCategory).map(([category, categoryAchievements]) => (
                  <div key={category}>
                    <h3 className="text-xl font-bold text-gray-900 mb-4 capitalize flex items-center gap-2">
                      {category === "streak" && <Flame className="w-5 h-5 text-orange-500" />}
                      {category === "quizzes" && <Award className="w-5 h-5 text-teal-500" />}
                      {category === "stories" && <Trophy className="w-5 h-5 text-pink-500" />}
                      {category === "vocabulary" && <Zap className="w-5 h-5 text-purple-500" />}
                      {category === "special" && <Star className="w-5 h-5 text-yellow-500" />}
                      {category} Achievements
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {categoryAchievements.map((achievement) => {
                        const isUnlocked = unlockedIds.has(achievement.id);
                        return (
                          <Card
                            key={achievement.id}
                            className={`p-6 transition-all duration-300 ${
                              isUnlocked
                                ? "bg-gradient-to-br from-purple-100 to-pink-100 border-2 border-purple-300 hover-lift"
                                : "bg-gray-100 border-2 border-gray-300 opacity-60"
                            }`}
                          >
                            <div className="flex items-start gap-4">
                              <div
                                className={`text-4xl ${
                                  isUnlocked ? "animate-bounce-in" : "grayscale opacity-50"
                                }`}
                              >
                                {achievement.icon}
                              </div>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-bold text-gray-900">{achievement.name}</h4>
                                  {isUnlocked && (
                                    <Check className="w-4 h-4 text-green-500 animate-scale-in" />
                                  )}
                                  {!isUnlocked && <Lock className="w-4 h-4 text-gray-400" />}
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{achievement.description}</p>
                                <Badge
                                  variant={isUnlocked ? "default" : "outline"}
                                  className={
                                    isUnlocked
                                      ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                                      : ""
                                  }
                                >
                                  {achievement.xpReward} XP
                                </Badge>
                              </div>
                            </div>
                          </Card>
                        );
                      })}
                    </div>
                  </div>
                ))}
            </div>
          </TabsContent>

          {/* Leaderboard Tab */}
          <TabsContent value="leaderboard">
            <Card className="p-6 bg-white/80 backdrop-blur-sm">
              {/* Period Selector */}
              <div className="flex gap-2 mb-6">
                <Button
                  variant={leaderboardPeriod === "weekly" ? "default" : "outline"}
                  onClick={() => setLeaderboardPeriod("weekly")}
                  className="flex-1"
                >
                  Weekly
                </Button>
                <Button
                  variant={leaderboardPeriod === "monthly" ? "default" : "outline"}
                  onClick={() => setLeaderboardPeriod("monthly")}
                  className="flex-1"
                >
                  Monthly
                </Button>
                <Button
                  variant={leaderboardPeriod === "allTime" ? "default" : "outline"}
                  onClick={() => setLeaderboardPeriod("allTime")}
                  className="flex-1"
                >
                  All Time
                </Button>
              </div>

              {/* Leaderboard List */}
              <div className="space-y-3">
                {leaderboard?.map((entry, index) => (
                  <div
                    key={entry.userId}
                    className={`flex items-center gap-4 p-4 rounded-2xl transition-all duration-300 hover-lift ${
                      index === 0
                        ? "bg-gradient-to-r from-yellow-100 to-orange-100 border-2 border-yellow-300"
                        : index === 1
                        ? "bg-gradient-to-r from-gray-100 to-gray-200 border-2 border-gray-300"
                        : index === 2
                        ? "bg-gradient-to-r from-orange-100 to-red-100 border-2 border-orange-300"
                        : "bg-gray-50 border-2 border-gray-200"
                    }`}
                  >
                    {/* Rank */}
                    <div
                      className={`flex items-center justify-center w-12 h-12 rounded-full font-bold text-lg ${
                        index === 0
                          ? "bg-gradient-to-br from-yellow-400 to-orange-500 text-white"
                          : index === 1
                          ? "bg-gradient-to-br from-gray-400 to-gray-500 text-white"
                          : index === 2
                          ? "bg-gradient-to-br from-orange-400 to-red-500 text-white"
                          : "bg-gray-200 text-gray-700"
                      }`}
                    >
                      {index < 3 ? ["🥇", "🥈", "🥉"][index] : entry.rank}
                    </div>

                    {/* User Info */}
                    <div className="flex-1">
                      <p className="font-bold text-gray-900">{entry.userName}</p>
                      <div className="flex items-center gap-3 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-purple-500" />
                          Level {entry.level}
                        </span>
                        <span className="flex items-center gap-1">
                          <Flame className="w-4 h-4 text-orange-500" />
                          {entry.currentStreak} day streak
                        </span>
                      </div>
                    </div>

                    {/* XP */}
                    <div className="text-right">
                      <p className="text-2xl font-bold text-gray-900">{entry.xp}</p>
                      <p className="text-xs text-gray-500">XP</p>
                    </div>
                  </div>
                ))}

                {(!leaderboard || leaderboard.length === 0) && (
                  <div className="text-center py-12">
                    <Trophy className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">No rankings yet. Start learning to appear on the leaderboard!</p>
                  </div>
                )}
              </div>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
