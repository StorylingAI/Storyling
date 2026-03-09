import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Trophy, Medal, Award, TrendingUp } from "lucide-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";

export function LeaderboardWidget() {
  const { data: topAchievers, isLoading } = trpc.leaderboard.getTopWeeklyAchievers.useQuery({ limit: 10 });

  if (isLoading) {
    return (
      <Card className="rounded-card shadow-playful-lg border-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <CardTitle>Weekly Leaderboard</CardTitle>
          </div>
          <CardDescription>Top 10 achievers this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  if (!topAchievers || topAchievers.length === 0) {
    return (
      <Card className="rounded-card shadow-playful-lg border-2">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <CardTitle>Weekly Leaderboard</CardTitle>
          </div>
          <CardDescription>Top 10 achievers this week</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            <p>No leaderboard data yet.</p>
            <p className="text-sm mt-2">Complete goals and earn XP to appear here!</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="h-5 w-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-gray-400" />;
    if (rank === 3) return <Award className="h-5 w-5 text-amber-600" />;
    return <span className="text-sm font-semibold text-muted-foreground">#{rank}</span>;
  };

  const getRankBgColor = (rank: number) => {
    if (rank === 1) return "bg-yellow-50 border-yellow-200";
    if (rank === 2) return "bg-gray-50 border-gray-200";
    if (rank === 3) return "bg-amber-50 border-amber-200";
    return "bg-background border-border";
  };

  return (
    <Card className="rounded-card shadow-playful-lg border-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            <CardTitle>Weekly Leaderboard</CardTitle>
          </div>
          <Link href="/leaderboard">
            <Button variant="ghost" size="sm" className="gap-1">
              View All <TrendingUp className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        <CardDescription>Top 10 achievers this week</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {topAchievers.map((entry, index) => (
            <div
              key={entry.userId}
              className={`flex items-center gap-3 p-3 rounded-lg border transition-all hover:shadow-md ${getRankBgColor(index + 1)}`}
            >
              {/* Rank Icon */}
              <div className="flex-shrink-0 w-8 flex items-center justify-center">
                {getRankIcon(index + 1)}
              </div>

              {/* User Avatar */}
              <Avatar className="h-10 w-10">
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-teal-500 text-white font-semibold">
                  {entry.userName?.charAt(0).toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>

              {/* User Info */}
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm truncate">{entry.userName || "Anonymous"}</p>
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  <span>🎯 {entry.goalsCompleted} goals</span>
                  <span>🔥 {entry.streakDays} day streak</span>
                </div>
              </div>

              {/* XP Badge */}
              <div className="flex-shrink-0 text-right">
                <div className="text-lg font-bold text-purple-600">{entry.xpEarned}</div>
                <div className="text-xs text-muted-foreground">XP</div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
