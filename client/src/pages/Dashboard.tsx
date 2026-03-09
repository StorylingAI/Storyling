import React from "react";
import { useState, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { APP_TITLE, APP_LOGO, getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { 
  Mic, 
  Film, 
  Play, 
  Clock, 
  Sparkles, 
  Home,
  BookOpen,
  PlusCircle,
  TrendingUp,
  Home as HomeIcon,
  User,
  Flame,
  Target,
  Library,
  Settings,
  History,
  FolderHeart
} from "lucide-react";
import { trpc } from "@/lib/trpc";

import RecentlyWatchedSection from "@/components/RecentlyWatchedSection";
import { LanguageTips } from "@/components/LanguageTips";
import { QuickStartTutorial } from "@/components/QuickStartTutorial";
import { TutorialChallenges } from "@/components/TutorialChallenges";
import { useChallengeDetection } from "@/hooks/useChallengeDetection";
import { PremiumWelcomeModal } from "@/components/PremiumWelcomeModal";
import { WeeklyGoalWidget } from "@/components/WeeklyGoalWidget";
import { WeeklyGoalOnboarding } from "@/components/WeeklyGoalOnboarding";
import { WeeklyGoalReminder } from "@/components/WeeklyGoalReminder";
import { LeaderboardWidget } from "@/components/LeaderboardWidget";
import { PremiumShowcase } from "@/components/PremiumShowcase";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { AppFooter } from "@/components/AppFooter";

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [showPremiumWelcome, setShowPremiumWelcome] = useState(false);
  useChallengeDetection(); // Auto-detect challenge completion

  // Weekly goal onboarding will auto-show for new users


  const completePremiumOnboarding = trpc.auth.completePremiumOnboarding.useMutation();
  const utils = trpc.useUtils();

  // Check for premium upgrade success
  useEffect(() => {
    if (user && isAuthenticated) {
      const params = new URLSearchParams(window.location.search);
      const subscriptionStatus = params.get("subscription");
      
      if (subscriptionStatus === "success") {
        // Clear URL params immediately
        window.history.replaceState({}, "", "/dashboard");
        
        // Verify checkout with Stripe API, then poll for update
        const checkSubscription = async () => {
          // Trigger server-side verification (handles missing webhook)
          try {
            await utils.client.checkout.verifyCheckout.mutate({});
          } catch {}

          let attempts = 0;
          const maxAttempts = 5;

          const pollInterval = setInterval(async () => {
            attempts++;

            // Refetch user data
            await utils.auth.me.invalidate();
            const updatedUser = await utils.auth.me.fetch();
            
            if (updatedUser?.subscriptionTier === "premium") {
              clearInterval(pollInterval);
              
              // Show premium welcome modal if not completed
              if (!updatedUser.premiumOnboardingCompleted) {
                setShowPremiumWelcome(true);
              }
            } else if (attempts >= maxAttempts) {
              clearInterval(pollInterval);
              // Fallback: show welcome modal anyway after max attempts
              setShowPremiumWelcome(true);
            }
          }, 1000); // Check every second
        };
        
        checkSubscription();
      }
    }
  }, [user, isAuthenticated, utils]);

  const { data: progressData } = trpc.progress.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: dueReviewsData } = trpc.wordbank.getDueCount.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: chineseStoriesData } = trpc.content.hasChineseStories.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const dueReviewsCount = dueReviewsData?.count || 0;
  const hasChineseStories = chineseStoriesData?.hasChineseStories || false;

  // Calculate aggregate progress from all languages
  const progress = progressData && progressData.length > 0 ? {
    currentStreak: Math.max(...progressData.map(p => p.currentStreak)),
    storiesThisWeek: progressData.reduce((sum, p) => sum + p.totalStoriesGenerated, 0),
  } : { currentStreak: 0, storiesThisWeek: 0 };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50 flex items-center justify-center">
        <img src={APP_LOGO} alt="Loading" className="h-24 w-24 animate-float" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-card shadow-playful-lg border-2">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <img src={APP_LOGO} alt="Flip" className="h-32 w-32 mx-auto animate-float" />
            <div>
              <h2 className="text-3xl font-bold mb-2">Welcome to {APP_TITLE}</h2>
              <p className="text-muted-foreground text-lg">
                Sign in to start your language learning journey!
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => window.location.href = getLoginUrl()}
              className="rounded-button gradient-primary text-white hover-lift hover-glow active-scale border-0 h-12 px-8 transition-all"
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Sign In to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStreak = progress?.currentStreak || 0;
  const weeklyGoal = 5; // Stories per week
  const storiesThisWeek = progress?.storiesThisWeek || 0;
  const weeklyProgress = Math.min((storiesThisWeek / weeklyGoal) * 100, 100);
  const goalExceeded = storiesThisWeek > weeklyGoal;

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50">
      <div className="container mx-auto px-4 py-8 pb-24 md:pb-8">
        <EmailVerificationBanner />
      </div>
      <QuickStartTutorial />
      <WeeklyGoalOnboarding />
      <PremiumWelcomeModal open={showPremiumWelcome} onClose={() => setShowPremiumWelcome(false)} />
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b shadow-playful sticky top-0 z-40">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setLocation("/")}>
            <img src={APP_LOGO} alt="Flip" className="h-10 w-10" />
            <h1 className="text-2xl font-bold gradient-text-primary hidden sm:block">{APP_TITLE}</h1>
          </div>
          <div className="flex items-center gap-2">
            {user?.role === 'teacher' && (
              <Button
                variant="ghost"
                onClick={() => setLocation("/teacher")}
                className="rounded-button hover-lift active-scale transition-all"
              >
                <Target className="h-4 w-4 mr-2" />
                Teacher Dashboard
              </Button>
            )}
            <Button
              variant="outline"
              onClick={() => setLocation("/library")}
              className="rounded-button hover-lift active-scale transition-all"
              data-tutorial="library"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">My Library</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/settings")}
              className="rounded-button hover-lift active-scale transition-all"
            >
              <Settings className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      <div className="container py-8 space-y-8">
        {/* Weekly Goal Reminder Banner */}
        <WeeklyGoalReminder />
        {/* Welcome Section - Simplified */}
        <div className="relative">
          <Card className="rounded-card shadow-playful-lg border-2 overflow-hidden animate-slide-up">
            <div className="absolute top-4 right-4 hidden md:block">
              <img src={APP_LOGO} alt="Flip" className="h-20 w-20 animate-float opacity-80" />
            </div>
            <CardContent className="pt-8 pb-8">
              <div className="space-y-6">
                <div>
                  <h2 className="text-3xl md:text-4xl font-bold mb-2">
                    Hey {user?.name || "friend"}! 👋
                  </h2>
                  <p className="text-xl text-muted-foreground">Ready to learn?</p>
                </div>

                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
                  {/* Streak */}
                  <div className="flex items-center gap-3 animate-scale-in stagger-1">
                    <div className="w-14 h-14 rounded-full gradient-warm flex items-center justify-center hover-bounce transition-all">
                      <Flame className="h-7 w-7 text-white" />
                    </div>
                    <div>
                      <p className="text-2xl font-bold">{currentStreak} day streak!</p>
                      <p className="text-sm text-muted-foreground">Keep it going!</p>
                    </div>
                  </div>

                  {/* Weekly Goal */}
                  <div className="flex-1 w-full sm:w-auto animate-scale-in stagger-2">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">Weekly Goal</p>
                      <div className="flex items-center gap-2">
                        <p className="text-sm text-muted-foreground">
                          {storiesThisWeek}/{weeklyGoal} stories
                        </p>
                        {goalExceeded && (
                          <Badge variant="default" className="bg-gradient-to-r from-purple-500 to-pink-500 text-white text-xs">
                            🎉 Exceeded!
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Progress value={weeklyProgress} className="h-3" />
                  </div>
                </div>

                {/* Simplified Quick Actions - Only 2 most important */}
                <div className="pt-2 flex gap-3">
                  <Button
                    onClick={() => setLocation("/wordbank")}
                    variant="outline"
                    className="rounded-button hover-lift active-scale transition-all flex-1 relative"
                    data-tutorial="wordbank"
                  >
                    <Library className="h-4 w-4 mr-2" />
                    Wordbank
                    {dueReviewsCount > 0 && (
                      <Badge className="absolute -top-2 -right-2 bg-red-500 text-white px-2 py-0.5 text-xs">
                        {dueReviewsCount}
                      </Badge>
                    )}
                  </Button>
                  <Button
                    onClick={() => setLocation("/progress")}
                    variant="outline"
                    className="rounded-button hover-lift active-scale transition-all flex-1"
                    data-tutorial="progress-tracking"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Progress
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Primary Actions - Create & Continue */}
        <div className="grid md:grid-cols-2 gap-6">
          {/* Create New Story - Simplified */}
          <Card className="rounded-card shadow-playful-lg border-2 hover-lift hover-glow active-scale transition-all animate-slide-up stagger-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                Create New Story
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Choose your learning format
              </p>
              <div className="grid grid-cols-2 gap-3">
                <Button
                  onClick={() => setLocation("/create?mode=podcast")}
                  className="rounded-button gradient-primary text-white hover-lift border-0 h-24 flex-col gap-2"
                >
                  <Mic className="h-8 w-8" />
                  <span className="text-base font-semibold">Podcast</span>
                </Button>
                <Button
                  onClick={() => setLocation("/create?mode=film")}
                  className="rounded-button gradient-warm text-white hover-lift border-0 h-24 flex-col gap-2"
                >
                  <Film className="h-8 w-8" />
                  <span className="text-base font-semibold">Film</span>
                </Button>
              </div>
              <Button
                onClick={() => setLocation("/create")}
                variant="outline"
                className="rounded-button hover-lift border-2 w-full"
                data-tutorial="create-story"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                More Options
              </Button>
            </CardContent>
          </Card>

          {/* Browse Library */}
          <Card className="rounded-card shadow-playful-lg border-2 hover-lift hover-glow active-scale transition-all animate-slide-up stagger-2" data-tutorial="browse-library">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Library className="h-5 w-5 text-primary" />
                Browse Library
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-muted-foreground">
                Access all your stories and continue learning
              </p>
              <div className="space-y-3">
                <Button
                  onClick={() => setLocation("/library")}
                  className="rounded-button gradient-primary text-white hover-lift border-0 w-full h-16 text-lg font-semibold"
                >
                  <BookOpen className="h-6 w-6 mr-2" />
                  View All Stories
                </Button>
                <div className="grid grid-cols-2 gap-3">
                  <Button
                    onClick={() => setLocation("/library?filter=continue")}
                    variant="outline"
                    className="rounded-button hover-lift border-2 h-12 flex-col gap-1"
                  >
                    <Play className="h-5 w-5" />
                    <span className="text-xs">Continue</span>
                  </Button>
                  <Button
                    onClick={() => setLocation("/history")}
                    variant="outline"
                    className="rounded-button hover-lift border-2 h-12 flex-col gap-1"
                  >
                    <History className="h-5 w-5" />
                    <span className="text-xs">History</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Review Reminder Alert */}
        {dueReviewsCount > 0 && (
          <Card className="rounded-card shadow-playful-lg border-2 border-orange-300 bg-gradient-to-r from-orange-50 to-yellow-50 animate-slide-up">
            <CardContent className="py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-orange-500 flex items-center justify-center">
                    <Clock className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Time to Review!</h3>
                    <p className="text-sm text-muted-foreground">
                      You have <strong>{dueReviewsCount}</strong> word{dueReviewsCount > 1 ? 's' : ''} due for review
                    </p>
                  </div>
                </div>
                <Button
                  onClick={() => setLocation("/review")}
                  className="rounded-button bg-orange-500 hover:bg-orange-600 text-white hover-lift active-scale transition-all"
                >
                  Start Review
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tone Practice Card - Only show for users with Chinese stories */}
        {hasChineseStories && (
          <Card className="rounded-card shadow-playful-lg border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-teal-50 hover-lift transition-all cursor-pointer" onClick={() => setLocation("/tone-practice")}>
            <CardContent className="py-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-teal-500 flex items-center justify-center">
                    <Target className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">Practice Chinese Tones</h3>
                    <p className="text-sm text-muted-foreground">
                      Master the four tones with interactive exercises
                    </p>
                  </div>
                </div>
                <Button
                  className="rounded-button gradient-primary text-white hover-lift border-0"
                >
                  Start Practice
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Tutorial Challenges */}
        <TutorialChallenges />

        {/* Premium Showcase - Only for free users */}
        <PremiumShowcase />

        {/* Weekly Goal Widget */}
        <WeeklyGoalWidget />

        {/* Leaderboard Widget */}
        <LeaderboardWidget />

        {/* Recently Watched Section */}
        <div data-tutorial="recently-watched">
          <RecentlyWatchedSection />
        </div>

        {/* Language Learning Tips - Moved to bottom */}
        {progressData && progressData.length > 0 && progressData[0].targetLanguage && (
          <div className="animate-slide-up mt-8">
            <LanguageTips language={progressData[0].targetLanguage} maxTips={3} variant="compact" />
          </div>
        )}
      </div>

      {/* Bottom Navigation (Mobile) - Simplified */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-playful-lg md:hidden z-50">
        <div className="flex items-center justify-around h-20 px-4">
          <button
            onClick={() => setLocation("/app")}
            className="flex flex-col items-center gap-1 text-primary"
          >
            <HomeIcon className="h-6 w-6" />
            <span className="text-xs font-medium">Home</span>
          </button>

          <button
            onClick={() => setLocation("/library")}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <BookOpen className="h-6 w-6" />
            <span className="text-xs font-medium">Library</span>
          </button>

          <button
            onClick={() => setLocation("/create")}
            className="flex flex-col items-center gap-1 -mt-8"
          >
            <div className="w-16 h-16 rounded-full gradient-primary shadow-playful-lg flex items-center justify-center hover-lift">
              <PlusCircle className="h-8 w-8 text-white" />
            </div>
          </button>

          <button
            onClick={() => setLocation("/collections")}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <FolderHeart className="h-6 w-6" />
            <span className="text-xs font-medium">Collections</span>
          </button>

          <button
            onClick={() => setLocation("/progress")}
            className="flex flex-col items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
          >
            <TrendingUp className="h-6 w-6" />
            <span className="text-xs font-medium">Progress</span>
          </button>
        </div>
      </nav>
    </div>
    {showPremiumWelcome && (
      <PremiumWelcomeModal
        open={showPremiumWelcome}
        onClose={() => {
          setShowPremiumWelcome(false);
          completePremiumOnboarding.mutate();
        }}
      />
    )}
    <AppFooter />
    </>
  );
}