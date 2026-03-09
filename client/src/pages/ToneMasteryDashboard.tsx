import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  BarChart3,
  Lightbulb
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { APP_LOGO } from "@/const";

const TONE_COLORS = {
  1: { bg: "bg-blue-500", text: "text-blue-600", light: "bg-blue-100" },
  2: { bg: "bg-green-500", text: "text-green-600", light: "bg-green-100" },
  3: { bg: "bg-amber-500", text: "text-amber-600", light: "bg-amber-100" },
  4: { bg: "bg-red-500", text: "text-red-600", light: "bg-red-100" },
};

const TONE_NAMES = {
  1: "First Tone",
  2: "Second Tone",
  3: "Third Tone",
  4: "Fourth Tone",
};

export default function ToneMasteryDashboard() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  
  const { data: masteryStats, isLoading: statsLoading } = trpc.tonePractice.getMasteryStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const { data: weakTones, isLoading: weakLoading } = trpc.tonePractice.getWeakTones.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  const { data: confusionMatrix } = trpc.tonePractice.getConfusionMatrix.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  if (authLoading || statsLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <img src={APP_LOGO} alt="Flip" className="h-16 w-16 mx-auto mb-4 animate-bounce" />
          <p className="text-muted-foreground">Loading your progress...</p>
        </div>
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <img src={APP_LOGO} alt="Flip" className="h-16 w-16 mx-auto mb-2" />
            <CardTitle>Sign in Required</CardTitle>
            <CardDescription>Please sign in to view your tone mastery progress</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/">
              <Button>Go to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  // Calculate overall statistics
  const totalAttempts = masteryStats?.reduce((sum, stat) => sum + stat.totalAttempts, 0) || 0;
  const totalCorrect = masteryStats?.reduce((sum, stat) => sum + stat.correctAttempts, 0) || 0;
  const overallAccuracy = totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;
  
  // Find strongest and weakest tones
  const sortedByAccuracy = [...(masteryStats || [])].sort((a, b) => b.accuracyPercentage - a.accuracyPercentage);
  const strongestTone = sortedByAccuracy[0];
  const weakestTone = sortedByAccuracy[sortedByAccuracy.length - 1];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border/40">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => window.history.back()}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold">Tone Mastery Dashboard</h1>
            </div>
          </div>
        </div>
      </header>
      
      <main className="container max-w-6xl py-8 px-4">
        {/* Overall Stats */}
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Practice</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{totalAttempts}</div>
              <p className="text-xs text-muted-foreground mt-1">questions answered</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Overall Accuracy</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-600">{overallAccuracy}%</div>
              <p className="text-xs text-muted-foreground mt-1">{totalCorrect} correct answers</p>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-muted-foreground">Tones Mastered</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-primary">
                {masteryStats?.filter(s => s.accuracyPercentage >= 80 && s.totalAttempts >= 10).length || 0}/4
              </div>
              <p className="text-xs text-muted-foreground mt-1">≥80% accuracy, ≥10 attempts</p>
            </CardContent>
          </Card>
        </div>
        
        {/* Tone Breakdown */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Tone-by-Tone Breakdown
            </CardTitle>
            <CardDescription>Your performance on each of the four tones</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {masteryStats?.map((stat) => {
                const colors = TONE_COLORS[stat.tone as keyof typeof TONE_COLORS];
                const isMastered = stat.accuracyPercentage >= 80 && stat.totalAttempts >= 10;
                const needsPractice = stat.totalAttempts < 10 || stat.accuracyPercentage < 70;
                
                return (
                  <div key={stat.tone} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${colors.bg} flex items-center justify-center text-white font-bold`}>
                          {stat.tone}
                        </div>
                        <div>
                          <h3 className="font-medium">{TONE_NAMES[stat.tone as keyof typeof TONE_NAMES]}</h3>
                          <p className="text-sm text-muted-foreground">
                            {stat.totalAttempts} attempts • {stat.correctAttempts} correct
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className={`text-2xl font-bold ${colors.text}`}>
                            {stat.accuracyPercentage.toFixed(0)}%
                          </div>
                        </div>
                        {isMastered && (
                          <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Mastered
                          </Badge>
                        )}
                        {needsPractice && (
                          <Badge variant="outline" className="bg-orange-50 text-orange-700 border-orange-200">
                            <AlertCircle className="h-3 w-3 mr-1" />
                            Needs Practice
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Progress value={stat.accuracyPercentage} className="h-2" />
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
        
        {/* Weak Tones & Recommendations */}
        {weakTones && weakTones.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5 text-yellow-500" />
                Personalized Recommendations
              </CardTitle>
              <CardDescription>Focus on these tones to improve your mastery</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {weakTones.map((stat) => {
                  const colors = TONE_COLORS[stat.tone as keyof typeof TONE_COLORS];
                  const reason = stat.totalAttempts < 10 
                    ? "Not enough practice yet" 
                    : `Low accuracy (${stat.accuracyPercentage.toFixed(0)}%)`;
                  
                  return (
                    <div key={stat.tone} className={`p-4 rounded-lg ${colors.light} border border-${colors.bg}/20`}>
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full ${colors.bg} flex items-center justify-center text-white font-bold text-sm`}>
                            {stat.tone}
                          </div>
                          <div>
                            <h4 className="font-medium">{TONE_NAMES[stat.tone as keyof typeof TONE_NAMES]}</h4>
                            <p className="text-sm text-muted-foreground">{reason}</p>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => navigate("/tone-practice")}
                            className="gap-2"
                          >
                            <Target className="h-4 w-4" />
                            Practice
                          </Button>
                          <Button 
                            size="sm" 
                            onClick={() => navigate("/tone-pair-drills")}
                            className="gap-2"
                          >
                            Tone Pairs
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Confusion Matrix */}
        {confusionMatrix && confusionMatrix.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5" />
                Common Confusions
              </CardTitle>
              <CardDescription>Tone pairs you frequently mix up</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {confusionMatrix.slice(0, 5).map((confusion, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-8 h-8 rounded-full ${TONE_COLORS[confusion.correctTone as keyof typeof TONE_COLORS].bg} flex items-center justify-center text-white font-bold text-sm`}>
                          {confusion.correctTone}
                        </div>
                        <span className="text-muted-foreground">→</span>
                        <div className={`w-8 h-8 rounded-full ${TONE_COLORS[confusion.selectedTone as keyof typeof TONE_COLORS].bg} flex items-center justify-center text-white font-bold text-sm`}>
                          {confusion.selectedTone}
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium">
                          {TONE_NAMES[confusion.correctTone as keyof typeof TONE_NAMES]} confused with{" "}
                          {TONE_NAMES[confusion.selectedTone as keyof typeof TONE_NAMES]}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary">{confusion.count} times</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Empty State */}
        {totalAttempts === 0 && (
          <Card className="text-center py-12">
            <CardContent>
              <img src={APP_LOGO} alt="Flip" className="h-24 w-24 mx-auto mb-4 opacity-50" />
              <h3 className="text-xl font-bold mb-2">Start Practicing!</h3>
              <p className="text-muted-foreground mb-6">
                You haven't practiced any tones yet. Start now to see your progress here.
              </p>
              <Button onClick={() => navigate("/tone-practice")} className="gap-2">
                <Target className="h-4 w-4" />
                Start Tone Practice
              </Button>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
