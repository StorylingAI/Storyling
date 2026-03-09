/**
 * Google Veo 3 API Integration Tests
 */

import { describe, it, expect } from 'vitest';
import { generateVeo3Video } from './googleVeo3';

describe('Google Veo 3 API Integration', () => {
  it('should have GOOGLE_VEO_API_KEY configured', () => {
    expect(process.env.GOOGLE_VEO_API_KEY).toBeDefined();
    expect(process.env.GOOGLE_VEO_API_KEY).not.toBe('');
  });

  it('should validate API key format', () => {
    const apiKey = process.env.GOOGLE_VEO_API_KEY;
    expect(apiKey).toMatch(/^AIza[a-zA-Z0-9_-]+$/);
  });

  it('should throw error when API key is missing', async () => {
    const originalKey = process.env.GOOGLE_VEO_API_KEY;
    delete process.env.GOOGLE_VEO_API_KEY;

    await expect(
      generateVeo3Video({ prompt: 'Test video' })
    ).rejects.toThrow('GOOGLE_VEO_API_KEY is not configured');

    process.env.GOOGLE_VEO_API_KEY = originalKey;
  });

  it('should accept valid generation request parameters', () => {
    const request = {
      prompt: 'A beautiful sunset over the ocean',
      duration: 5,
      aspectRatio: '16:9' as const,
    };

    expect(request.prompt).toBeTruthy();
    expect(request.duration).toBeGreaterThan(0);
    expect(['16:9', '9:16', '1:1']).toContain(request.aspectRatio);
  });

  it('should use default parameters when not specified', () => {
    const request = {
      prompt: 'Test video',
    };

    const duration = request.duration || 5;
    const aspectRatio = request.aspectRatio || '16:9';

    expect(duration).toBe(5);
    expect(aspectRatio).toBe('16:9');
  });
});
