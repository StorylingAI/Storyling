import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { InteractiveChallengeCard } from "./InteractiveChallengeCard";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Trophy, Loader2, Sparkles, Award } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";


export function TutorialChallenges() {
  const { data: challenges, isLoading, refetch } = trpc.tutorial.getChallenges.useQuery();
  const { data: stats } = trpc.tutorial.getStats.useQuery();
  const { data: vocabRequirement } = trpc.tutorial.getVocabularyRequirement.useQuery();
  const [showAchievementModal, setShowAchievementModal] = useState(false);
  const [achievementData, setAchievementData] = useState<any>(null);

  // IMPORTANT: All hooks must be called before any conditional returns
  // Poll for challenge updates every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
    }, 5000);

    return () => clearInterval(interval);
  }, [refetch]);

  // Check if achievement was just unlocked
  useEffect(() => {
    if (stats?.allCompleted && !achievementData) {
      // Show achievement modal on first completion
      setAchievementData({
        name: "Quick Start Champion",
        description: "Complete all 5 tutorial challenges",
        icon: "🏆",
        xpReward: 100,
      });
      setShowAchievementModal(true);
    }
  }, [stats?.allCompleted, achievementData]);

  // Conditional returns AFTER all hooks
  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!challenges || challenges.length === 0) {
    return null;
  }

  const handleChallengeComplete = () => {
    refetch();
  };

  return (
    <div className="space-y-6">
      {/* Progress Header */}
      <Card className="border-2 border-primary/20 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="h-8 w-8 text-yellow-500" />
              <div>
                <CardTitle>Quick Start Challenges</CardTitle>
                <CardDescription>
                  Complete these tasks to get familiar with Storyling AI
                </CardDescription>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-primary">
                {stats?.completedCount || 0}/{stats?.totalCount || 5}
              </div>
              <div className="text-sm text-muted-foreground">Completed</div>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <Progress value={stats?.percentage || 0} className="h-3" />
            <div className="text-sm text-muted-foreground text-center">
              {stats?.percentage || 0}% Complete
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Challenge Cards */}
      <div className="grid gap-4 md:grid-cols-2">
        {challenges.map((challenge) => {
          // Personalize vocabulary challenge description
          let description = challenge.description;
          if (challenge.challengeId === 'add_vocabulary' && vocabRequirement) {
            description = `Add ${vocabRequirement.count} words to your personal vocabulary collection`;
          }
          
          return (
            <InteractiveChallengeCard
              key={challenge.challengeId}
              challengeId={challenge.challengeId}
              title={challenge.title}
              description={description}
              icon={challenge.icon}
              actionLabel={challenge.actionLabel}
              actionUrl={challenge.actionUrl}
              completed={challenge.completed}
              completedAt={challenge.completedAt}
              onComplete={handleChallengeComplete}
            />
          );
        })}
      </div>

      {/* Completion Message */}
      {stats?.allCompleted && (
        <Card className="border-2 border-green-500/50 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-950/20 dark:to-emerald-950/20">
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <div className="text-4xl">🎊</div>
              <h3 className="text-xl font-bold text-green-700 dark:text-green-400">
                All Challenges Completed!
              </h3>
              <p className="text-muted-foreground">
                You've earned the <strong>Quick Start Champion</strong> achievement and <strong>100 XP</strong>!
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievement Modal */}
      <Dialog open={showAchievementModal} onOpenChange={setShowAchievementModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex flex-col items-center space-y-4">
              <div className="relative">
                <div className="absolute inset-0 animate-ping rounded-full bg-yellow-400 opacity-75"></div>
                <Award className="relative h-16 w-16 text-yellow-500" />
              </div>
              <DialogTitle className="text-2xl text-center">
                Achievement Unlocked!
              </DialogTitle>
            </div>
          </DialogHeader>
          <div className="text-center space-y-4">
            <div className="text-6xl">{achievementData?.icon}</div>
            <div>
              <h3 className="text-xl font-bold">{achievementData?.name}</h3>
              <p className="text-sm text-muted-foreground mt-1">
                {achievementData?.description}
              </p>
            </div>
            <div className="flex items-center justify-center gap-2 text-lg font-semibold text-yellow-600 dark:text-yellow-400">
              <Sparkles className="h-5 w-5" />
              +{achievementData?.xpReward} XP
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
