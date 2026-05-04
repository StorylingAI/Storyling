import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import {
  CONTENT_GENERATION_TRACK_EVENT,
  getTrackedContentGenerationIds,
  untrackContentGenerations,
} from "@/lib/generationTracking";

interface GenerationStatusWatcherProps {
  enabled: boolean;
}

export function GenerationStatusWatcher({
  enabled,
}: GenerationStatusWatcherProps) {
  const [, setLocation] = useLocation();
  const [trackedIds, setTrackedIds] = useState<number[]>(() =>
    getTrackedContentGenerationIds()
  );

  useEffect(() => {
    if (!enabled) {
      setTrackedIds([]);
      return;
    }

    const syncTrackedIds = () =>
      setTrackedIds(getTrackedContentGenerationIds());
    const handleTrackEvent = (event: Event) => {
      const contentId = Number(
        (event as CustomEvent<{ contentId?: number }>).detail?.contentId
      );
      if (!Number.isInteger(contentId) || contentId <= 0) return;

      setTrackedIds(current =>
        current.includes(contentId) ? current : [...current, contentId]
      );
    };

    syncTrackedIds();
    window.addEventListener(CONTENT_GENERATION_TRACK_EVENT, handleTrackEvent);
    return () => {
      window.removeEventListener(
        CONTENT_GENERATION_TRACK_EVENT,
        handleTrackEvent
      );
    };
  }, [enabled]);

  const { data: library = [] } = trpc.content.getLibrary.useQuery(undefined, {
    enabled: enabled && trackedIds.length > 0,
    refetchInterval: enabled && trackedIds.length > 0 ? 3000 : false,
  });

  useEffect(() => {
    if (!enabled || trackedIds.length === 0 || library.length === 0) return;

    const storedTrackedIds = getTrackedContentGenerationIds();
    const idsToCheck = trackedIds.filter(id => storedTrackedIds.includes(id));
    if (idsToCheck.length !== trackedIds.length) {
      setTrackedIds(storedTrackedIds);
    }
    if (idsToCheck.length === 0) return;

    const byId = new Map(library.map(item => [item.id, item]));
    const finishedIds: number[] = [];

    for (const contentId of idsToCheck) {
      const content = byId.get(contentId);
      if (!content) continue;

      if (content.status === "completed") {
        finishedIds.push(contentId);
        toast.success("Your story is ready!", {
          description: content.title
            ? `"${content.title}" is ready to enjoy.`
            : "Open it from your Library.",
          action: {
            label: "Open",
            onClick: () => setLocation(`/content/${contentId}`),
          },
        });
      }

      if (content.status === "failed") {
        finishedIds.push(contentId);
        toast.error("Story generation failed", {
          description:
            content.failureReason || "You can retry it from your Library.",
          action: {
            label: "Library",
            onClick: () => setLocation("/library"),
          },
        });
      }
    }

    if (finishedIds.length > 0) {
      untrackContentGenerations(finishedIds);
      setTrackedIds(getTrackedContentGenerationIds());
    }
  }, [enabled, library, setLocation, trackedIds]);

  return null;
}
