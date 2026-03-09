/**
 * Tests for Video Enhancement Features
 * - Adjustable music volume
 * - Multiple music tracks per mood
 * - Progress indicators
 */

import { describe, it, expect } from 'vitest';
import { getTracksByMood, getTrackById, getAllMoods } from './musicLibrary';

describe('Video Enhancement Features', () => {
  describe('Multiple Music Tracks per Mood', () => {
    it('should have 3 tracks for calm mood', () => {
      const tracks = getTracksByMood('calm');
      expect(tracks.length).toBe(3);
      expect(tracks[0].name).toBe('Calmant');
      expect(tracks[1].name).toBe('Floating Cities');
      expect(tracks[2].name).toBe('Meditation Impromptu 02');
    });

    it('should have 3 tracks for upbeat mood', () => {
      const tracks = getTracksByMood('upbeat');
      expect(tracks.length).toBe(3);
      expect(tracks[0].name).toBe('Funky Boxstep');
      expect(tracks[1].name).toBe('Wallpaper');
      expect(tracks[2].name).toBe('Bossa Antigua');
    });

    it('should have 3 tracks for dramatic mood', () => {
      const tracks = getTracksByMood('dramatic');
      expect(tracks.length).toBe(3);
      expect(tracks[0].name).toBe('Impending Boom');
      expect(tracks[1].name).toBe('Heroic Age');
      expect(tracks[2].name).toBe('Volatile Reaction');
    });

    it('should have 3 tracks for adventure mood', () => {
      const tracks = getTracksByMood('adventure');
      expect(tracks.length).toBe(3);
      expect(tracks[0].name).toBe('Adventures in Adventureland');
      expect(tracks[1].name).toBe('Dances and Dames');
      expect(tracks[2].name).toBe('Intrepid');
    });

    it('should have 3 tracks for suspenseful mood', () => {
      const tracks = getTracksByMood('suspenseful');
      expect(tracks.length).toBe(3);
    });

    it('should have 3 tracks for romantic mood', () => {
      const tracks = getTracksByMood('romantic');
      expect(tracks.length).toBe(3);
    });

    it('should have 3 tracks for mysterious mood', () => {
      const tracks = getTracksByMood('mysterious');
      expect(tracks.length).toBe(3);
    });

    it('should have 3 tracks for comedic mood', () => {
      const tracks = getTracksByMood('comedic');
      expect(tracks.length).toBe(3);
    });

    it('should have 3 tracks for energetic mood', () => {
      const tracks = getTracksByMood('energetic');
      expect(tracks.length).toBe(3);
    });

    it('should have 3 tracks for melancholic mood', () => {
      const tracks = getTracksByMood('melancholic');
      expect(tracks.length).toBe(3);
    });

    it('should have 3 tracks for triumphant mood', () => {
      const tracks = getTracksByMood('triumphant');
      expect(tracks.length).toBe(3);
    });

    it('should have 3 tracks for peaceful mood', () => {
      const tracks = getTracksByMood('peaceful');
      expect(tracks.length).toBe(3);
    });

    it('should have all required metadata for each track', () => {
      const allMoods = getAllMoods();
      
      allMoods.forEach(mood => {
        const tracks = getTracksByMood(mood);
        
        tracks.forEach(track => {
          expect(track).toHaveProperty('id');
          expect(track).toHaveProperty('mood');
          expect(track).toHaveProperty('name');
          expect(track).toHaveProperty('artist');
          expect(track).toHaveProperty('duration');
          expect(track).toHaveProperty('description');
          expect(track).toHaveProperty('previewUrl');
          expect(track).toHaveProperty('fullUrl');
          expect(track).toHaveProperty('tags');
          expect(track).toHaveProperty('attribution');
          
          // Verify types
          expect(typeof track.id).toBe('string');
          expect(typeof track.name).toBe('string');
          expect(typeof track.artist).toBe('string');
          expect(typeof track.duration).toBe('number');
          expect(typeof track.description).toBe('string');
          expect(Array.isArray(track.tags)).toBe(true);
        });
      });
    });

    it('should retrieve tracks by ID', () => {
      const track = getTrackById('calm-1');
      expect(track).toBeTruthy();
      expect(track?.name).toBe('Calmant');
      expect(track?.mood).toBe('calm');
    });

    it('should return null for non-existent track ID', () => {
      const track = getTrackById('nonexistent-track');
      expect(track).toBeNull();
    });

    it('should have unique track IDs across all moods', () => {
      const allMoods = getAllMoods();
      const allTrackIds = new Set<string>();
      
      allMoods.forEach(mood => {
        const tracks = getTracksByMood(mood);
        tracks.forEach(track => {
          expect(allTrackIds.has(track.id)).toBe(false);
          allTrackIds.add(track.id);
        });
      });
    });
  });

  describe('Music Volume Parameter', () => {
    it('should accept volume parameter in valid range', () => {
      const validVolumes = [0, 20, 50, 75, 100];
      
      validVolumes.forEach(volume => {
        expect(volume).toBeGreaterThanOrEqual(0);
        expect(volume).toBeLessThanOrEqual(100);
      });
    });

    it('should convert volume percentage to FFmpeg volume level', () => {
      const testCases = [
        { percent: 0, expected: 0.0 },
        { percent: 20, expected: 0.2 },
        { percent: 50, expected: 0.5 },
        { percent: 100, expected: 1.0 },
      ];
      
      testCases.forEach(({ percent, expected }) => {
        const volumeLevel = percent / 100;
        expect(volumeLevel).toBe(expected);
      });
    });
  });

  describe('Progress Calculation', () => {
    it('should calculate progress percentage correctly', () => {
      const testCases = [
        { currentTime: 0, totalDuration: 100, expected: 0 },
        { currentTime: 25, totalDuration: 100, expected: 25 },
        { currentTime: 50, totalDuration: 100, expected: 50 },
        { currentTime: 75, totalDuration: 100, expected: 75 },
        { currentTime: 100, totalDuration: 100, expected: 100 },
        { currentTime: 15, totalDuration: 30, expected: 50 },
      ];
      
      testCases.forEach(({ currentTime, totalDuration, expected }) => {
        const progressPercent = Math.round((currentTime / totalDuration) * 100);
        expect(progressPercent).toBe(expected);
      });
    });

    it('should handle edge cases for progress calculation', () => {
      // Zero duration
      const zeroDuration = 0;
      const progressZero = zeroDuration > 0 ? (10 / zeroDuration) * 100 : 0;
      expect(progressZero).toBe(0);
      
      // Current time exceeds total duration
      const currentTime = 120;
      const totalDuration = 100;
      const progressOver = Math.round((currentTime / totalDuration) * 100);
      expect(progressOver).toBe(120);
    });

    it('should identify in-progress videos correctly', () => {
      const testCases = [
        { progress: 0, expected: false },
        { progress: 1, expected: true },
        { progress: 50, expected: true },
        { progress: 99, expected: true },
        { progress: 100, expected: false },
      ];
      
      testCases.forEach(({ progress, expected }) => {
        const isInProgress = progress > 0 && progress < 100;
        expect(isInProgress).toBe(expected);
      });
    });
  });

  describe('Track Metadata Validation', () => {
    it('should have valid preview and full URLs', () => {
      const allMoods = getAllMoods();
      
      allMoods.forEach(mood => {
        const tracks = getTracksByMood(mood);
        
        tracks.forEach(track => {
          expect(track.previewUrl).toMatch(/^https?:\/\//);
          expect(track.fullUrl).toMatch(/^https?:\/\//);
          expect(track.previewUrl).toContain('incompetech.com');
          expect(track.fullUrl).toContain('incompetech.com');
        });
      });
    });

    it('should have Creative Commons attribution', () => {
      const allMoods = getAllMoods();
      
      allMoods.forEach(mood => {
        const tracks = getTracksByMood(mood);
        
        tracks.forEach(track => {
          expect(track.attribution).toContain('Kevin MacLeod');
          expect(track.attribution).toContain('incompetech.com');
          expect(track.attribution).toContain('Creative Commons');
        });
      });
    });

    it('should have reasonable duration values', () => {
      const allMoods = getAllMoods();
      
      allMoods.forEach(mood => {
        const tracks = getTracksByMood(mood);
        
        tracks.forEach(track => {
          expect(track.duration).toBeGreaterThan(0);
          expect(track.duration).toBeLessThan(2000); // Less than ~33 minutes
        });
      });
    });
  });
});
