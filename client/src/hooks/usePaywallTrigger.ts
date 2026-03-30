import { useState, useCallback, useEffect } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import type { PaywallTrigger, PaywallHeadline } from "@/components/upgrade/PaywallModal";

interface PaywallState {
  open: boolean;
  trigger: PaywallTrigger;
  headline: PaywallHeadline;
  progressStat?: { value: string; label: string };
  skipToStep2: boolean;
}

/**
 * Hook that manages paywall trigger logic and dynamic messaging.
 * 
 * Determines the best headline based on what the user was doing:
 * - Reading stories → "Go unlimited"
 * - Using dictionary lookups → "Unlock unlimited lookups"
 * - Saving vocabulary → "Build your vocabulary faster"
 * - Generic/first story → "Keep the story going"
 */
export function usePaywallTrigger() {
  const { user } = useAuth();
  const [state, setState] = useState<PaywallState>({
    open: false,
    trigger: "generic",
    headline: "keep_going",
    skipToStep2: false,
  });

  // Get today's vocab count for progress stats
  const { data: todayVocabData } = trpc.wordbank.getTodayWordCount.useQuery(undefined, {
    enabled: !!user && user.subscriptionTier === "free",
  });

  // Get usage stats
  const { data: usageStats } = trpc.subscription.getUsageStats.useQuery(undefined, {
    enabled: !!user && user.subscriptionTier === "free",
  });

  const isPremium = user?.subscriptionTier === "premium" || user?.subscriptionTier === "premium_plus";

  /**
   * Trigger the paywall with context-aware messaging
   */
  const triggerPaywall = useCallback((trigger: PaywallTrigger, options?: { skipToStep2?: boolean }) => {
    if (isPremium) return; // Never show to premium users

    let headline: PaywallHeadline = "keep_going";
    let progressStat: { value: string; label: string } | undefined;

    switch (trigger) {
      case "daily_limit":
        headline = "go_unlimited";
        if (todayVocabData && todayVocabData.count > 0) {
          progressStat = {
            value: `${todayVocabData.count}`,
            label: "new words learned today",
          };
        }
        break;

      case "vocab_limit":
        headline = "build_vocab";
        if (todayVocabData) {
          progressStat = {
            value: `${todayVocabData.count}`,
            label: "words saved today",
          };
        }
        break;

      case "lookup_limit":
        headline = "unlock_lookups";
        break;

      case "first_story":
        headline = "keep_going";
        break;

      case "locked_content":
        headline = "go_unlimited";
        break;

      default:
        headline = "generic";
    }

    setState({
      open: true,
      trigger,
      headline,
      progressStat,
      skipToStep2: options?.skipToStep2 ?? false,
    });
  }, [isPremium, todayVocabData]);

  const closePaywall = useCallback(() => {
    setState(prev => ({ ...prev, open: false }));
  }, []);

  /**
   * Auto-trigger after first story completion
   * Uses localStorage to track if the user has seen the first-story paywall
   */
  const triggerFirstStoryPaywall = useCallback(() => {
    if (isPremium) return;
    const hasSeenFirstStory = localStorage.getItem("storyling_first_story_paywall_seen");
    if (!hasSeenFirstStory) {
      localStorage.setItem("storyling_first_story_paywall_seen", "true");
      triggerPaywall("first_story");
    }
  }, [isPremium, triggerPaywall]);

  /**
   * Check if user should see the daily limit paywall
   */
  const checkDailyLimit = useCallback(() => {
    if (isPremium) return false;
    if (usageStats && !usageStats.canCreateStory) {
      triggerPaywall("daily_limit");
      return true;
    }
    return false;
  }, [isPremium, usageStats, triggerPaywall]);

  return {
    paywallState: state,
    triggerPaywall,
    closePaywall,
    triggerFirstStoryPaywall,
    checkDailyLimit,
    isPremium,
    wordsLearnedToday: todayVocabData?.count ?? 0,
    storiesToday: usageStats?.storiesToday ?? 0,
    canCreateStory: usageStats?.canCreateStory ?? true,
  };
}
