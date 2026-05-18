export type CreateStoryMode = "podcast" | "film" | "";
export type SpanishDialect = "spain" | "latam" | "";

export interface CreateStoryDraft {
  step?: number;
  targetLanguage?: string;
  spanishDialect?: SpanishDialect;
  proficiencyLevel?: string;
  vocabularyText?: string;
  topicPrompt?: string;
  translationLanguage?: string;
  mode?: CreateStoryMode;
  theme?: string;
  storyLength?: "short" | "medium" | "long";
  voiceType?: string;
  narratorGender?: "male" | "female";
  cinematicStyle?: string;
  videoDuration?: number;
  backgroundMusic?: string;
  musicVolume?: number;
  selectedMusicTrack?: string;
  addSubtitles?: boolean;
  subtitleFontSize?: "small" | "medium" | "large";
  subtitlePosition?: "top" | "bottom";
  subtitleColor?: "white" | "yellow" | "cyan";
  subtitleFontFamily?: "Arial" | "Times New Roman" | "Courier New" | "Georgia" | "Verdana";
  subtitleOutlineThickness?: number;
  subtitleBackgroundOpacity?: number;
}

const CREATE_STORY_DRAFT_STORAGE_KEY = "storyling:create-story-draft";
const CREATE_STORY_DRAFT_VERSION = 1;

interface StoredCreateStoryDraft {
  version: number;
  updatedAt: string;
  draft: CreateStoryDraft;
}

function getLocalStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function sanitizeStep(value: unknown): number | undefined {
  const step = Number(value);
  if (!Number.isInteger(step)) return undefined;
  return Math.min(Math.max(step, 1), 3);
}

function sanitizeString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

function sanitizeNumber(value: unknown): number | undefined {
  return typeof value === "number" && Number.isFinite(value) ? value : undefined;
}

function sanitizeBoolean(value: unknown): boolean | undefined {
  return typeof value === "boolean" ? value : undefined;
}

function sanitizeCreateStoryDraft(value: unknown): CreateStoryDraft | null {
  if (!value || typeof value !== "object") return null;
  const raw = value as Record<string, unknown>;
  const draft = (raw.draft && typeof raw.draft === "object"
    ? raw.draft
    : raw) as Record<string, unknown>;

  return {
    step: sanitizeStep(draft.step),
    targetLanguage: sanitizeString(draft.targetLanguage),
    spanishDialect: sanitizeString(draft.spanishDialect) as CreateStoryDraft["spanishDialect"],
    proficiencyLevel: sanitizeString(draft.proficiencyLevel),
    vocabularyText: sanitizeString(draft.vocabularyText),
    topicPrompt: sanitizeString(draft.topicPrompt),
    translationLanguage: sanitizeString(draft.translationLanguage),
    mode: sanitizeString(draft.mode) as CreateStoryDraft["mode"],
    theme: sanitizeString(draft.theme),
    storyLength: sanitizeString(draft.storyLength) as CreateStoryDraft["storyLength"],
    voiceType: sanitizeString(draft.voiceType),
    narratorGender: sanitizeString(draft.narratorGender) as CreateStoryDraft["narratorGender"],
    cinematicStyle: sanitizeString(draft.cinematicStyle),
    videoDuration: sanitizeNumber(draft.videoDuration),
    backgroundMusic: sanitizeString(draft.backgroundMusic),
    musicVolume: sanitizeNumber(draft.musicVolume),
    selectedMusicTrack: sanitizeString(draft.selectedMusicTrack),
    addSubtitles: sanitizeBoolean(draft.addSubtitles),
    subtitleFontSize: sanitizeString(draft.subtitleFontSize) as CreateStoryDraft["subtitleFontSize"],
    subtitlePosition: sanitizeString(draft.subtitlePosition) as CreateStoryDraft["subtitlePosition"],
    subtitleColor: sanitizeString(draft.subtitleColor) as CreateStoryDraft["subtitleColor"],
    subtitleFontFamily: sanitizeString(draft.subtitleFontFamily) as CreateStoryDraft["subtitleFontFamily"],
    subtitleOutlineThickness: sanitizeNumber(draft.subtitleOutlineThickness),
    subtitleBackgroundOpacity: sanitizeNumber(draft.subtitleBackgroundOpacity),
  };
}

export function loadCreateStoryDraft(): CreateStoryDraft | null {
  const storage = getLocalStorage();
  if (!storage) return null;

  try {
    const stored = storage.getItem(CREATE_STORY_DRAFT_STORAGE_KEY);
    if (!stored) return null;
    return sanitizeCreateStoryDraft(JSON.parse(stored));
  } catch {
    return null;
  }
}

export function saveCreateStoryDraft(draft: CreateStoryDraft): void {
  const storage = getLocalStorage();
  if (!storage) return;

  const payload: StoredCreateStoryDraft = {
    version: CREATE_STORY_DRAFT_VERSION,
    updatedAt: new Date().toISOString(),
    draft,
  };

  storage.setItem(CREATE_STORY_DRAFT_STORAGE_KEY, JSON.stringify(payload));
}

export function resolveDraftValue<T>(
  urlValue: T | null | undefined,
  draftValue: T | null | undefined,
  fallback: T,
): T {
  if (typeof urlValue === "string") {
    return urlValue.trim() ? urlValue : draftValue ?? fallback;
  }

  return urlValue ?? draftValue ?? fallback;
}
