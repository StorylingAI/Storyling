/**
 * Music Preview Module
 * Provide preview URLs for music tracks from the library
 */

import { getTrackById } from './musicLibrary';

/**
 * Get preview URL for a music track
 * Returns a local proxy URL so browsers receive audio-friendly headers.
 * 
 * @param trackId - ID of the music track
 * @returns Local preview URL of the music track
 */
export async function generateMusicPreview(trackId: string): Promise<string> {
  console.log(`[MusicPreview] Getting preview URL for track: ${trackId}`);

  const track = getTrackById(trackId);
  if (!track) {
    throw new Error(`Track not found: ${trackId}`);
  }

  const previewUrl = `/api/music/preview/${encodeURIComponent(track.id)}`;
  console.log('[MusicPreview] Returning proxied track URL:', previewUrl);
  return previewUrl;
}

