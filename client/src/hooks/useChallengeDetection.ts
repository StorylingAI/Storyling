import { useEffect } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

/**
 * Hook to automatically detect and mark challenges as completed
 * based on user actions
 */
export function useChallengeDetection() {
  const [location] = useLocation();
  const completeMutation = trpc.tutorial.completeChallenge.useMutation();
  const { data: challenges } = trpc.tutorial.getChallenges.useQuery(undefined, {
    enabled: location === "/progress",
  });

  useEffect(() => {
    // Detect "Explore Progress" challenge when user visits /progress
    if (location === "/progress") {
      const progressChallenge = challenges?.find(c => c.challengeId === "explore_progress");
      if (progressChallenge && !progressChallenge.completed) {
        completeMutation.mutate({ challengeId: "explore_progress" });
      }
    }
  }, [location, challenges, completeMutation]);

  return {
    markChallengeComplete: (challengeId: string) => {
      completeMutation.mutate({ 
        challengeId: challengeId as any 
      });
    },
  };
}
