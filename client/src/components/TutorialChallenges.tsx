import { useEffect, useState } from "react";
import { trpc } from "@/lib/trpc";
import { InteractiveChallengeCard } from "./InteractiveChallengeCard";
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
        <Loader2 className="h-8 w-8 animate-spin text-white/40" />
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
    <div className="space-y-6" style={{ fontFamily: 'Fredoka, sans-serif' }}>
      {/* Progress Header — dark translucent card */}
      <div className="rounded-2xl overflow-hidden" style={{
        background: 'rgba(255,255,255,0.08)',
        backdropFilter: 'blur(16px)',
        border: '1px solid rgba(255,255,255,0.12)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
      }}>
        <div className="p-5 sm:p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <Trophy className="h-7 w-7 text-yellow-400" />
              <div>
<h3 className="text-lg font-bold text-white heading-glow" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                   Quick Start Challenges
                 </h3>
                <p className="text-sm text-white/50" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                  Complete these tasks to get familiar with Storyling AI
                </p>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-teal-300" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                {stats?.completedCount || 0}/{stats?.totalCount || 5}
              </div>
              <div className="text-xs text-white/40" style={{ fontFamily: 'Fredoka, sans-serif' }}>Completed</div>
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-3 rounded-full overflow-hidden" style={{ background: 'rgba(255,255,255,0.1)' }}>
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${stats?.percentage || 0}%`,
                  background: 'linear-gradient(90deg, #7C3AED, #06B6D4)',
                }}
              />
            </div>
            <div className="text-sm text-white/50 text-center" style={{ fontFamily: 'Fredoka, sans-serif' }}>
              {stats?.percentage || 0}% Complete
            </div>
          </div>
        </div>
      </div>

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
        <div className="rounded-2xl overflow-hidden" style={{
          background: 'rgba(16, 185, 129, 0.12)',
          backdropFilter: 'blur(16px)',
          border: '1px solid rgba(52, 211, 153, 0.25)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
        }}>
          <div className="p-6">
            <div className="text-center space-y-2">
              <div className="text-4xl">🎊</div>
              <h3 className="text-xl font-bold text-emerald-300" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                All Challenges Completed!
              </h3>
              <p className="text-white/60" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                You've earned the <strong className="text-white">Quick Start Champion</strong> achievement and <strong className="text-yellow-300">100 XP</strong>!
              </p>
            </div>
          </div>
        </div>
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
