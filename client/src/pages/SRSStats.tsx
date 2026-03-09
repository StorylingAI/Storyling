import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import {
  Calendar,
  TrendingUp,
  Flame,
  BookOpen,
  Clock,
  Target,
  Award,
  ArrowLeft,
} from "lucide-react";

export default function SRSStats() {
  const [, setLocation] = useLocation();
  const [calendarDays, setCalendarDays] = useState(90);
  const [retentionDays, setRetentionDays] = useState(30);

  const { data: calendar, isLoading: calendarLoading } = trpc.wordbank.getReviewCalendar.useQuery({ days: calendarDays });
  const { data: retention, isLoading: retentionLoading } = trpc.wordbank.getRetentionRate.useQuery({ days: retentionDays });
  const { data: streak, isLoading: streakLoading } = trpc.wordbank.getReviewStreak.useQuery();
  const { data: stats, isLoading: statsLoading } = trpc.wordbank.getSRSStatistics.useQuery();

  const isLoading = calendarLoading || retentionLoading || streakLoading || statsLoading;

  // Generate calendar grid (last 90 days)
  const generateCalendarGrid = () => {
    const grid: Array<{ date: string; count: number }> = [];
    const today = new Date();
    
    for (let i = calendarDays - 1; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const activity = calendar?.find(c => c.date === dateStr);
      grid.push({
        date: dateStr,
        count: activity?.count || 0,
      });
    }
    
    return grid;
  };

  const calendarGrid = calendar ? generateCalendarGrid() : [];

  // Get color intensity based on activity count
  const getActivityColor = (count: number) => {
    if (count === 0) return "bg-gray-100 border border-gray-200";
    if (count <= 2) return "bg-teal-200";
    if (count <= 5) return "bg-teal-400";
    if (count <= 10) return "bg-teal-600";
    return "bg-teal-800";
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading statistics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50 pb-8">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b shadow-playful sticky top-0 z-40">
        <div className="container flex h-16 items-center gap-4">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => window.history.back()}
            className="rounded-full hover-lift"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold gradient-text-primary">SRS Statistics</h1>
            <p className="text-sm text-muted-foreground">Track your learning progress and retention</p>
          </div>
        </div>
      </header>

      <div className="container py-8 space-y-6">
        {/* Overview Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="rounded-card shadow-playful-lg border-2 animate-scale-in">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full gradient-primary flex items-center justify-center">
                  <BookOpen className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalWords || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Words</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-card shadow-playful-lg border-2 animate-scale-in stagger-1">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center">
                  <Flame className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{streak?.currentStreak || 0}</p>
                  <p className="text-sm text-muted-foreground">Day Streak</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-card shadow-playful-lg border-2 animate-scale-in stagger-2">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-green-500 flex items-center justify-center">
                  <Target className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.averageAccuracy || 0}%</p>
                  <p className="text-sm text-muted-foreground">Accuracy</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-card shadow-playful-lg border-2 animate-scale-in stagger-3">
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-blue-500 flex items-center justify-center">
                  <Award className="h-6 w-6 text-white" />
                </div>
                <div>
                  <p className="text-2xl font-bold">{stats?.totalReviews || 0}</p>
                  <p className="text-sm text-muted-foreground">Total Reviews</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mastery Distribution */}
        <Card className="rounded-card shadow-playful-lg border-2 animate-slide-up">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Mastery Distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">🏆 Mastered</span>
                    <span className="text-sm text-muted-foreground">{stats?.distribution.mastered || 0} words</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-teal-500 transition-all duration-500"
                      style={{ width: `${stats?.totalWords ? (stats.distribution.mastered / stats.totalWords) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">📚 Familiar</span>
                    <span className="text-sm text-muted-foreground">{stats?.distribution.familiar || 0} words</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-yellow-500 transition-all duration-500"
                      style={{ width: `${stats?.totalWords ? (stats.distribution.familiar / stats.totalWords) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium">🌱 Learning</span>
                    <span className="text-sm text-muted-foreground">{stats?.distribution.learning || 0} words</span>
                  </div>
                  <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-red-500 transition-all duration-500"
                      style={{ width: `${stats?.totalWords ? (stats.distribution.learning / stats.totalWords) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Review Calendar Heatmap */}
        <Card className="rounded-card shadow-playful-lg border-2 animate-slide-up stagger-1">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Review Activity Calendar
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-7 md:grid-cols-15 gap-1">
                {calendarGrid.map((day, index) => (
                  <div
                    key={index}
                    className={`aspect-square rounded ${getActivityColor(day.count)} hover:scale-110 transition-transform cursor-pointer`}
                    title={`${day.date}: ${day.count} review${day.count !== 1 ? 's' : ''}`}
                  />
                ))}
              </div>
              <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                <span>Less</span>
                <div className="flex gap-1">
                  <div className="w-4 h-4 rounded bg-gray-100 border border-gray-200" />
                  <div className="w-4 h-4 rounded bg-teal-200" />
                  <div className="w-4 h-4 rounded bg-teal-400" />
                  <div className="w-4 h-4 rounded bg-teal-600" />
                  <div className="w-4 h-4 rounded bg-teal-800" />
                </div>
                <span>More</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Retention Rate Trend */}
        <Card className="rounded-card shadow-playful-lg border-2 animate-slide-up stagger-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Retention Rate Trend
            </CardTitle>
          </CardHeader>
          <CardContent>
            {retention && retention.length > 0 ? (
              <div className="space-y-4">
                {retention.map((week, index) => (
                  <div key={index} className="flex items-center gap-4">
                    <div className="w-24 text-sm text-muted-foreground">Week {week.week}</div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{week.retentionRate}%</span>
                        <span className="text-xs text-muted-foreground">
                          {week.correctReviews}/{week.totalReviews} correct
                        </span>
                      </div>
                      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-purple-500 to-teal-500 transition-all duration-500"
                          style={{ width: `${week.retentionRate}%` }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No retention data available yet.</p>
                <p className="text-sm">Complete more reviews to see your retention trends!</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Review Queue Status */}
        <div className="grid md:grid-cols-2 gap-6">
          <Card className="rounded-card shadow-playful-lg border-2 animate-slide-up stagger-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                Due for Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-4xl font-bold text-orange-500">{stats?.dueWords || 0}</p>
                <p className="text-sm text-muted-foreground mt-2">words need review now</p>
                {(stats?.dueWords || 0) > 0 && (
                  <Button
                    onClick={() => setLocation("/wordbank")}
                    className="mt-4 rounded-button bg-orange-500 hover:bg-orange-600 text-white hover-lift active-scale"
                  >
                    Start Review
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-card shadow-playful-lg border-2 animate-slide-up stagger-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5 text-blue-500" />
                Upcoming Reviews
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-4">
                <p className="text-4xl font-bold text-blue-500">{stats?.upcomingReviews || 0}</p>
                <p className="text-sm text-muted-foreground mt-2">words due in next 7 days</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Streak Milestones */}
        <Card className="rounded-card shadow-playful-lg border-2 border-orange-300 bg-gradient-to-r from-orange-50 to-yellow-50 animate-slide-up stagger-5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Streak Milestones
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-around">
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-500">{streak?.currentStreak || 0}</p>
                <p className="text-sm text-muted-foreground">Current Streak</p>
              </div>
              <div className="h-12 w-px bg-gray-300" />
              <div className="text-center">
                <p className="text-3xl font-bold text-orange-600">{streak?.longestStreak || 0}</p>
                <p className="text-sm text-muted-foreground">Longest Streak</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 justify-center">
              {[3, 7, 14, 30, 100].map((milestone) => (
                <Badge
                  key={milestone}
                  variant={(streak?.longestStreak || 0) >= milestone ? "default" : "outline"}
                  className={`${(streak?.longestStreak || 0) >= milestone ? "bg-orange-500" : ""}`}
                >
                  {milestone} days
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
