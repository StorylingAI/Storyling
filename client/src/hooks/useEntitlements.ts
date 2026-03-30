/**
 * useEntitlements — Frontend hook for the server-side entitlement system.
 * 
 * This is the SINGLE SOURCE OF TRUTH for plan access, limits, and feature gating.
 * All components should use this hook instead of checking subscription tier directly.
 */

import { trpc } from "../lib/trpc";
import { useAuth } from "../_core/hooks/useAuth";

export function useEntitlements() {
  const { user } = useAuth();
  
  // Get user's timezone for accurate daily reset
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  
  const { data, isLoading, refetch } = trpc.entitlement.getEntitlements.useQuery(
    { timezone },
    {
      enabled: !!user,
      staleTime: 60_000, // Cache for 1 minute
      refetchOnWindowFocus: true, // Refresh when user returns to tab
    }
  );

  const isPremium = data?.isPremium ?? false;
  const planState = data?.planState ?? "free";

  return {
    // Raw data
    entitlements: data,
    isLoading,
    refetch,

    // Plan state
    isPremium,
    isFree: !isPremium,
    planState,
    isTrialing: planState === "trialing",
    isCanceledPending: planState === "canceled_pending_expiry",
    isExpired: planState === "expired",

    // Story limits
    canCreateStory: data?.canCreateStory ?? true,
    dailyStoriesUsed: data?.dailyStoriesUsed ?? 0,
    dailyStoryLimit: data?.dailyStoryLimit,
    starterStoriesUsed: data?.starterStoriesUsed ?? 0,
    starterStoriesTotal: data?.starterStoriesTotal ?? 3,
    starterPackCompleted: data?.starterPackCompleted ?? false,
    canRereadStories: true, // Always allowed

    // Lookup limits
    canLookup: data?.canLookup ?? true,
    dailyLookupsUsed: data?.dailyLookupsUsed ?? 0,
    dailyLookupLimit: data?.dailyLookupLimit,

    // Vocab save limits
    canSaveVocab: data?.canSaveVocab ?? true,
    dailyVocabSavesUsed: data?.dailyVocabSavesUsed ?? 0,
    dailyVocabSaveLimit: data?.dailyVocabSaveLimit,

    // Feature gating
    canUseAudioSpeedControl: data?.canUseAudioSpeedControl ?? false,
    canDownloadOffline: data?.canDownloadOffline ?? false,
    canUseAdvancedComprehension: data?.canUseAdvancedComprehension ?? false,
    canUseFilmFormat: data?.canUseFilmFormat ?? false,

    // Audio
    audioPlayback: data?.audioPlayback ?? "standard",

    // Reset info
    nextResetAt: data?.nextResetAt,
  };
}
