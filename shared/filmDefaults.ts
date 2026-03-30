export const DEFAULT_FILM_VOICE_TYPE = "Professional Narrator";
export const DEFAULT_FILM_NARRATOR_GENDER = "female" as const;

export function resolveFilmNarrationSettings(
  voiceType?: string | null,
  narratorGender?: "male" | "female" | null,
) {
  return {
    voiceType: voiceType?.trim() || DEFAULT_FILM_VOICE_TYPE,
    narratorGender: narratorGender ?? DEFAULT_FILM_NARRATOR_GENDER,
  };
}
