import { useCallback, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

export interface ABTestVariant {
  key: string;
  label: string;
  payload: {
    ctaText: string;
    ctaIcon: string;
    subtext: string;
  } | null;
}

/**
 * Hook to get the user's A/B test variant and track events.
 * Handles:
 * - Fetching/assigning the variant (sticky bucketing via server)
 * - Tracking impressions (once per mount)
 * - Tracking clicks (on demand)
 */
export function useABTest(experimentKey: string) {
  const { user } = useAuth();
  const impressionTracked = useRef(false);

  const { data, isLoading } = trpc.abTest.getVariant.useQuery(
    { experimentKey },
    {
      enabled: !!user && user.subscriptionTier !== "premium",
      staleTime: Infinity, // Variant never changes for a user
      refetchOnWindowFocus: false,
    }
  );

  const trackEventMutation = trpc.abTest.trackEvent.useMutation();

  const trackImpression = useCallback(() => {
    if (impressionTracked.current) return;
    if (!data?.variant) return;
    impressionTracked.current = true;
    trackEventMutation.mutate({
      experimentKey,
      eventType: "impression",
    });
  }, [data?.variant, experimentKey, trackEventMutation]);

  const trackClick = useCallback(() => {
    if (!data?.variant) return;
    trackEventMutation.mutate({
      experimentKey,
      eventType: "click",
    });
  }, [data?.variant, experimentKey, trackEventMutation]);

  const trackConversion = useCallback(() => {
    if (!data?.variant) return;
    trackEventMutation.mutate({
      experimentKey,
      eventType: "conversion",
    });
  }, [data?.variant, experimentKey, trackEventMutation]);

  // Parse payload safely
  const variant: ABTestVariant | null = data?.variant
    ? {
        key: data.variant.key,
        label: data.variant.label,
        payload: (() => {
          try {
            const p =
              typeof data.variant.payload === "string"
                ? JSON.parse(data.variant.payload)
                : data.variant.payload;
            return p as ABTestVariant["payload"];
          } catch {
            return null;
          }
        })(),
      }
    : null;

  return {
    variant,
    isLoading,
    trackImpression,
    trackClick,
    trackConversion,
  };
}
