import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  TrendingUp,
  Target,
  Flame,
  Calendar,
  Award,
  Brain,
  Clock,
  CheckCircle2,
  FileText,
  Goal,
} from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { DifficultyProgressionChart } from "@/components/DifficultyProgressionChart";
import { MobileNav } from "@/components/MobileNav";

export function Progress() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [selectedLanguage, setSelectedLanguage] = useState<string | undefined>(undefined);

  const { data: statistics, isLoading: statsLoading } = trpc.progress.getStatistics.useQuery(
    { targetLanguage: selectedLanguage },
    { enabled: isAuthenticated }
  );

  const { data: wordMastery, isLoading: wordsLoading } = trpc.progress.getWordMastery.useQuery(
    { targetLanguage: selectedLanguage },
    { enabled: isAuthenticated }
  );

  const { data: activityCalendar, isLoading: calendarLoading } =
    trpc.progress.getActivityCalendar.useQuery({ days: 90 }, { enabled: isAuthenticated });

  const { data: difficultyProgression, isLoading: progressionLoading } =
    trpc.progress.getDifficultyProgression.useQuery(
      { targetLanguage: selectedLanguage },
      { enabled: isAuthenticated }
    );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-card shadow-playful-lg border-2">
          <CardContent className="pt-6 text-center space-y-4">
            <h3 className="text-xl font-bold">Sign in to view progress</h3>
            <p className="text-muted-foreground">Track your learning journey</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isLoading = statsLoading || wordsLoading || calendarLoading || progressionLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50 flex flex-col items-center justify-center gap-4">
        <img src="/flip-mascot.png" alt="Loading" className="w-24 h-24 animate-flip" />
        <p className="text-muted-foreground">Loading your progress...</p>
      </div>
    );
  }

  // Categorize words by mastery level
  const masteredWords = wordMastery?.filter((w) => w.masteryLevel >= 80) || [];
  const learningWords = wordMastery?.filter((w) => w.masteryLevel >= 40 && w.masteryLevel < 80) || [];
  const strugglingWords = wordMastery?.filter((w) => w.masteryLevel < 40) || [];

  // Generate calendar heatmap data for last 90 days
  const generateCalendarDays = () => {
    const days = [];
    const today = new Date();
    for (let i = 89; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dateKey = date.toISOString().split("T")[0];
      const count = activityCalendar?.[dateKey] || 0;
      days.push({ date: dateKey, count, dateObj: date });
    }
    return days;
  };

  const calendarDays = generateCalendarDays();

  const getHeatmapColor = (count: number) => {
    if (count === 0) return "bg-border";
    if (count === 1) return "bg-teal-200";
    if (count === 2) return "bg-teal-400";
    if (count >= 3) return "bg-teal-600";
    return "bg-border";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50">
      <MobileNav title="Progress" backPath="/app" />
      <div className="container py-8 space-y-8 animate-fade-in">
        {/* Breadcrumb Navigation */}
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/app" },
            { label: "Progress", icon: <TrendingUp className="h-4 w-4" /> },
          ]}
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  toast.info("Export report feature coming soon!");
                }}
                className="gap-2"
              >
                <FileText className="h-4 w-4" />
                Export Report
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  toast.info("Goal setting feature coming soon!");
                }}
                className="gap-2 bg-gradient-to-r from-purple-600 to-teal-600 hover:from-purple-700 hover:to-teal-700"
              >
                <Goal className="h-4 w-4" />
                View Goals
              </Button>
            </>
          }
        />

        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl font-bold gradient-text">Your Learning Progress</h1>
          <p className="text-muted-foreground">
            Track your vocabulary mastery and learning journey
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-card shadow-playful border-2 hover-lift transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Words</CardTitle>
              <Brain className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{statistics?.totalWords || 0}</div>
              <p className="text-xs text-muted-foreground">Across all languages</p>
            </CardContent>
          </Card>

          <Card className="rounded-card shadow-playful border-2 hover-lift transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Mastered</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-teal-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-teal-600">{statistics?.mastered || 0}</div>
              <p className="text-xs text-muted-foreground">80%+ mastery level</p>
            </CardContent>
          </Card>

          <Card className="rounded-card shadow-playful border-2 hover-lift transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
              <Flame className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">
                {statistics?.currentStreak || 0}
              </div>
              <p className="text-xs text-muted-foreground">Days in a row</p>
            </CardContent>
          </Card>

          <Card className="rounded-card shadow-playful border-2 hover-lift transition-all">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Quiz Score</CardTitle>
              <Award className="h-4 w-4 text-pink-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-pink-600">
                {statistics?.averageScore || 0}%
              </div>
              <p className="text-xs text-muted-foreground">
                {statistics?.totalQuizzes || 0} quizzes taken
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Difficulty Progression */}
        {difficultyProgression && (
          <DifficultyProgressionChart data={difficultyProgression} />
        )}

        {/* Activity Calendar Heatmap */}
        <Card className="rounded-card shadow-playful-lg border-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-teal-500" />
              <CardTitle>Activity Calendar</CardTitle>
            </div>
            <CardDescription>Your quiz activity over the last 90 days</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Calendar Grid */}
              <div className="grid grid-cols-13 gap-1">
                {calendarDays.map((day, index) => (
                  <div
                    key={day.date}
                    className={`w-3 h-3 rounded-sm ${getHeatmapColor(day.count)} hover:ring-2 hover:ring-teal-500 transition-all cursor-pointer`}
                    title={`${day.date}: ${day.count} quiz${day.count !== 1 ? "zes" : ""}`}
                  />
                ))}
              </div>

              {/* Legend */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Less</span>
                <div className="flex gap-1">
                  <div className="w-3 h-3 rounded-sm bg-border" />
                  <div className="w-3 h-3 rounded-sm bg-teal-200" />
                  <div className="w-3 h-3 rounded-sm bg-teal-400" />
                  <div className="w-3 h-3 rounded-sm bg-teal-600" />
                </div>
                <span>More</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Vocabulary Mastery */}
        <Card className="rounded-card shadow-playful-lg border-2">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-500" />
              <CardTitle>Vocabulary Mastery</CardTitle>
            </div>
            <CardDescription>
              Words categorized by mastery level (Green = Mastered, Yellow = Learning, Red =
              Struggling)
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Mastery Distribution */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Mastered (80%+)</span>
                <span className="text-sm text-muted-foreground">{masteredWords.length} words</span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-teal-100">
                <div
                  className="h-full bg-teal-500 transition-all"
                  style={{ width: `${(masteredWords.length / (wordMastery?.length || 1)) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Learning (40-80%)</span>
                <span className="text-sm text-muted-foreground">{learningWords.length} words</span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-yellow-100">
                <div
                  className="h-full bg-yellow-500 transition-all"
                  style={{ width: `${(learningWords.length / (wordMastery?.length || 1)) * 100}%` }}
                />
              </div>

              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Struggling (&lt;40%)</span>
                <span className="text-sm text-muted-foreground">
                  {strugglingWords.length} words
                </span>
              </div>
              <div className="relative h-2 w-full overflow-hidden rounded-full bg-red-100">
                <div
                  className="h-full bg-red-500 transition-all"
                  style={{ width: `${(strugglingWords.length / (wordMastery?.length || 1)) * 100}%` }}
                />
              </div>
            </div>

            {/* Word Cards */}
            <Tabs defaultValue="struggling" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="struggling">Struggling</TabsTrigger>
                <TabsTrigger value="learning">Learning</TabsTrigger>
                <TabsTrigger value="mastered">Mastered</TabsTrigger>
              </TabsList>

              <TabsContent value="struggling" className="mt-4">
                {strugglingWords.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No struggling words! Keep up the great work! 🎉
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {strugglingWords.slice(0, 12).map((word) => (
                      <Card
                        key={word.id}
                        className="rounded-card border-2 border-red-200 bg-red-50 hover-lift transition-all"
                      >
                        <CardContent className="p-3 space-y-1">
                          <p className="font-semibold text-sm truncate">{word.word}</p>
                          <div className="flex items-center justify-between">
                            <Badge variant="destructive" className="text-xs">
                              {word.masteryLevel}%
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {word.incorrectCount}/{word.correctCount + word.incorrectCount}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="learning" className="mt-4">
                {learningWords.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No words in progress. Start learning!
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {learningWords.slice(0, 12).map((word) => (
                      <Card
                        key={word.id}
                        className="rounded-card border-2 border-yellow-200 bg-yellow-50 hover-lift transition-all"
                      >
                        <CardContent className="p-3 space-y-1">
                          <p className="font-semibold text-sm truncate">{word.word}</p>
                          <div className="flex items-center justify-between">
                            <Badge className="text-xs bg-yellow-500">
                              {word.masteryLevel}%
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {word.incorrectCount}/{word.correctCount + word.incorrectCount}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>

              <TabsContent value="mastered" className="mt-4">
                {masteredWords.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    No mastered words yet. Keep practicing!
                  </p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
                    {masteredWords.slice(0, 12).map((word) => (
                      <Card
                        key={word.id}
                        className="rounded-card border-2 border-teal-200 bg-teal-50 hover-lift transition-all"
                      >
                        <CardContent className="p-3 space-y-1">
                          <p className="font-semibold text-sm truncate">{word.word}</p>
                          <div className="flex items-center justify-between">
                            <Badge className="text-xs bg-teal-500">
                              {word.masteryLevel}%
                            </Badge>
                            <span className="text-xs text-muted-foreground">
                              {word.incorrectCount}/{word.correctCount + word.incorrectCount}
                            </span>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* Review Recommendations */}
        {statistics && statistics.wordsDue > 0 && (
          <Card className="rounded-card shadow-playful-lg border-2 border-orange-200 bg-orange-50 animate-slide-up">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-orange-500" />
                <CardTitle>Words Due for Review</CardTitle>
              </div>
              <CardDescription>
                You have {statistics.wordsDue} word{statistics.wordsDue !== 1 ? "s" : ""} ready for
                review based on spaced repetition
              </CardDescription>
            </CardHeader>
            <CardContent>
              <button
                onClick={() => setLocation("/review")}
                className="rounded-button gradient-primary text-white px-6 py-3 hover-lift active-scale transition-all border-0 font-semibold"
              >
                Start Review Quiz
              </button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
