import { useState, useCallback, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export type UpgradeTriggerType =
  | "first_story_completed"
  | "weekly_limit_reached"
  | "vocabulary_limit"
  | "personalized_story_locked"
  | "progress_milestone";

interface UpgradeFlowState {
  activeTrigger: UpgradeTriggerType | null;
  isOpen: boolean;
}

const STORAGE_KEY = "storyling_upgrade_triggers";

function getShownTriggers(): Record<string, boolean> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function markTriggerShown(trigger: string) {
  const shown = getShownTriggers();
  shown[trigger] = true;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(shown));
}

function hasTriggerBeenShown(trigger: string): boolean {
  return getShownTriggers()[trigger] === true;
}

export function useUpgradeFlow() {
  const { user } = useAuth();
  const [state, setState] = useState<UpgradeFlowState>({
    activeTrigger: null,
    isOpen: false,
  });

  const isPremium = user?.subscriptionTier === "premium";

  const showTrigger = useCallback(
    (trigger: UpgradeTriggerType, options?: { force?: boolean }) => {
      // Never show to premium users
      if (isPremium) return;

      // For soft triggers (first_story, progress_milestone), only show once
      const softTriggers: UpgradeTriggerType[] = [
        "first_story_completed",
        "progress_milestone",
      ];
      if (
        softTriggers.includes(trigger) &&
        !options?.force &&
        hasTriggerBeenShown(trigger)
      ) {
        return;
      }

      setState({ activeTrigger: trigger, isOpen: true });

      if (softTriggers.includes(trigger)) {
        markTriggerShown(trigger);
      }
    },
    [isPremium]
  );

  const closeTrigger = useCallback(() => {
    setState({ activeTrigger: null, isOpen: false });
  }, []);

  return {
    activeTrigger: state.activeTrigger,
    isOpen: state.isOpen,
    isPremium,
    showTrigger,
    closeTrigger,
  };
}

/**
 * Hook to check if user should see the first-story-completed trigger
 * Returns a function to call after story completion
 */
export function useFirstStoryTrigger() {
  const { user } = useAuth();
  const { data: allProgress } = trpc.storyProgress.getAllProgress.useQuery(
    undefined,
    { enabled: !!user && user.subscriptionTier !== "premium" }
  );

  const shouldTrigger = useCallback(() => {
    if (!user || user.subscriptionTier === "premium") return false;
    if (hasTriggerBeenShown("first_story_completed")) return false;
    // Trigger after completing first story
    const completedCount =
      allProgress?.filter((p) => p.completed).length ?? 0;
    return completedCount >= 1;
  }, [user, allProgress]);

  return { shouldTrigger };
}

/**
 * Hook to check if user has reached the weekly story limit
 */
export function useWeeklyLimitCheck() {
  const { user } = useAuth();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const { data: usageStats } = trpc.subscription.getUsageStats.useQuery(
    { timezone },
    { enabled: !!user && user.subscriptionTier === "free" }
  );

  return {
    hasReachedLimit: usageStats ? !usageStats.canCreateStory : false,
    storiesUsed: usageStats?.storiesToday ?? 0,
    storiesLimit: usageStats?.storiesLimit ?? 1,
    tier: usageStats?.tier ?? "free",
  };
}

/**
 * Hook to check vocabulary word count for limit trigger
 */
export function useVocabularyLimitCheck() {
  const { user } = useAuth();
  const { data: todayVocabData } = trpc.wordbank.getTodayWordCount.useQuery(undefined, {
    enabled: !!user && user.subscriptionTier !== "premium",
  });

  const wordCount = todayVocabData?.count ?? 0;
  const wordLimit = todayVocabData?.limit ?? 3;

  return {
    hasReachedLimit: wordCount >= wordLimit,
    wordCount,
    wordLimit,
  };
}

/**
 * Hook to check if user has completed enough stories for progress milestone
 */
export function useProgressMilestoneCheck() {
  const { user } = useAuth();
  const { data: allProgress } = trpc.storyProgress.getAllProgress.useQuery(
    undefined,
    { enabled: !!user && user.subscriptionTier !== "premium" }
  );

  const completedCount = allProgress?.filter((p) => p.completed).length ?? 0;
  const MILESTONE_THRESHOLD = 3;

  return {
    hasReachedMilestone:
      completedCount >= MILESTONE_THRESHOLD &&
      !hasTriggerBeenShown("progress_milestone"),
    completedCount,
    milestoneThreshold: MILESTONE_THRESHOLD,
  };
}
