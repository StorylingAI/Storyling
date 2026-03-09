/**
 * Music Preview Module
 * Provide preview URLs for music tracks from the library
 */

import { getTrackById } from './musicLibrary';

/**
 * Get preview URL for a music track
 * Returns the direct URL to the full track from Incompetech (Kevin MacLeod)
 * All tracks are royalty-free and licensed under Creative Commons
 * 
 * @param trackId - ID of the music track
 * @returns URL of the music track
 */
export async function generateMusicPreview(trackId: string): Promise<string> {
  console.log(`[MusicPreview] Getting preview URL for track: ${trackId}`);

  const track = getTrackById(trackId);
  if (!track) {
    throw new Error(`Track not found: ${trackId}`);
  }

  // Return the direct URL to the full track from Incompetech
  // These are real, royalty-free music tracks, not placeholder tones
  console.log('[MusicPreview] Returning track URL:', track.previewUrl);
  return track.previewUrl;
}


