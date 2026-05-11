export const TRACKED_CONTENT_GENERATIONS_STORAGE_KEY =
  "storyling:tracked-content-generations";

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
    const localIds = normalizeIds(
      JSON.parse(
        window.localStorage.getItem(TRACKED_CONTENT_GENERATIONS_STORAGE_KEY) ||
          "[]"
      )
    );
    const sessionIds = normalizeIds(
      JSON.parse(
        window.sessionStorage.getItem(TRACKED_CONTENT_GENERATIONS_STORAGE_KEY) ||
          "[]"
      )
    );
    const ids = normalizeIds([...localIds, ...sessionIds]);

    if (sessionIds.length > 0) {
      setTrackedContentGenerationIds(ids);
    }

    return ids;
  } catch {
    return [];
  }
}

function setTrackedContentGenerationIds(ids: number[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    TRACKED_CONTENT_GENERATIONS_STORAGE_KEY,
    JSON.stringify(normalizeIds(ids))
  );
  window.sessionStorage.removeItem(TRACKED_CONTENT_GENERATIONS_STORAGE_KEY);
}

export function getLatestTrackedContentGenerationId(): number | null {
  const ids = getTrackedContentGenerationIds();
  return ids.length > 0 ? ids[ids.length - 1] : null;
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
