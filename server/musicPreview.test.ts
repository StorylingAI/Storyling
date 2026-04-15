import { describe, it, expect } from 'vitest';
import { generateMusicPreview } from './musicPreview';
import { getTrackById } from './musicLibrary';

describe('Music Preview', () => {
  it('should return preview URL for valid track ID', async () => {
    const trackId = 'calm-1';
    const previewUrl = await generateMusicPreview(trackId);
    
    expect(previewUrl).toBeDefined();
    expect(typeof previewUrl).toBe('string');
    expect(previewUrl).toBe('/api/music/preview/calm-1');
  });

  it('should return proxied URL instead of direct provider URL', async () => {
    const trackId = 'calm-1';
    const previewUrl = await generateMusicPreview(trackId);
    
    expect(previewUrl).toContain('/api/music/preview/');
    expect(previewUrl).not.toContain('incompetech.com');
  });

  it('should throw error for invalid track ID', async () => {
    const trackId = 'invalid-track-id';
    
    await expect(generateMusicPreview(trackId)).rejects.toThrow('Track not found');
  });

  it('should return correct track URL from music library', async () => {
    const trackId = 'upbeat-1';
    const track = getTrackById(trackId);
    const previewUrl = await generateMusicPreview(trackId);
    
    expect(track).toBeDefined();
    expect(previewUrl).toBe(`/api/music/preview/${track!.id}`);
  });

  it('should work for all mood categories', async () => {
    const testTracks = [
      'calm-1',
      'upbeat-1',
      'romantic-1',
      'comedic-1',
    ];

    for (const trackId of testTracks) {
      const previewUrl = await generateMusicPreview(trackId);
      expect(previewUrl).toBeDefined();
      expect(previewUrl).toContain('/api/music/preview/');
    }
  });
});
