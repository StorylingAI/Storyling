const STORAGE_KEY = "storyling:tracked-content-generations";

export const CONTENT_GENERATION_TRACK_EVENT =
  "storyling:track-content-generation";

function normalizeIds(value: unknown): number[] {
  if (!Array.isArray(value)) return [];

  return Array.from(
    new Set(
      value.map(id => Number(id)).filter(id => Number.isInteger(id) && id > 0)
    )
  );
}

export function getTrackedContentGenerationIds(): number[] {
  if (typeof window === "undefined") return [];

  try {
    return normalizeIds(
      JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || "[]")
    );
  } catch {
    return [];
  }
}

function setTrackedContentGenerationIds(ids: number[]) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(normalizeIds(ids)));
}

export function trackContentGeneration(contentId: number) {
  if (typeof window === "undefined") return;

  const ids = getTrackedContentGenerationIds();
  if (!ids.includes(contentId)) {
    setTrackedContentGenerationIds([...ids, contentId]);
  }

  window.dispatchEvent(
    new CustomEvent(CONTENT_GENERATION_TRACK_EVENT, { detail: { contentId } })
  );
}

export function untrackContentGenerations(contentIds: number[]) {
  if (typeof window === "undefined") return;

  const done = new Set(contentIds);
  const remaining = getTrackedContentGenerationIds().filter(
    id => !done.has(id)
  );
  setTrackedContentGenerationIds(remaining);
}
