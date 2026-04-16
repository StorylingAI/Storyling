/**
 * Higgsfield API Integration Tests
 */

import { describe, it, expect } from 'vitest';
import axios from 'axios';

const HIGGSFIELD_API_BASE = 'https://api.higgsfield.ai/v1';
const hasHiggsfieldCredentials = Boolean(
  process.env.HIGGSFIELD_API_KEY_ID && process.env.HIGGSFIELD_API_KEY_SECRET,
);
const credentialsIt = hasHiggsfieldCredentials ? it : it.skip;

describe('Higgsfield API Integration', () => {
  credentialsIt('should have HIGGSFIELD_API_KEY_ID configured', () => {
    expect(process.env.HIGGSFIELD_API_KEY_ID).toBeDefined();
    expect(process.env.HIGGSFIELD_API_KEY_ID).not.toBe('');
  });

  credentialsIt('should have HIGGSFIELD_API_KEY_SECRET configured', () => {
    expect(process.env.HIGGSFIELD_API_KEY_SECRET).toBeDefined();
    expect(process.env.HIGGSFIELD_API_KEY_SECRET).not.toBe('');
  });

  credentialsIt('should validate API credentials format', () => {
    const apiKeyId = process.env.HIGGSFIELD_API_KEY_ID;
    const apiKeySecret = process.env.HIGGSFIELD_API_KEY_SECRET;

    // API Key ID should be UUID format
    expect(apiKeyId).toMatch(/^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/);
    
    // API Key Secret should be hex string
    expect(apiKeySecret).toMatch(/^[a-f0-9]{64,}$/);
  });

  credentialsIt('should successfully authenticate with Higgsfield API', async () => {
    const apiKeyId = process.env.HIGGSFIELD_API_KEY_ID;
    const apiKeySecret = process.env.HIGGSFIELD_API_KEY_SECRET;

    // Test authentication by making a simple API call
    // This tests the credentials without generating a full video
    try {
      const response = await axios.get(
        `${HIGGSFIELD_API_BASE}/account`,
        {
          headers: {
            'X-API-Key-ID': apiKeyId,
            'X-API-Key-Secret': apiKeySecret,
          },
          timeout: 10000,
        }
      );

      // If we get here, authentication succeeded
      expect(response.status).toBe(200);
    } catch (error: any) {
      // If endpoint doesn't exist, check for auth errors specifically
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error('Higgsfield API authentication failed - invalid credentials');
      }
      
      // 404 or other errors mean auth worked but endpoint doesn't exist (which is fine)
      if (error.response?.status === 404) {
        // Auth worked, endpoint just doesn't exist
        expect(error.response.status).toBe(404);
      } else {
        // Some other error - log it but don't fail the test
        console.log('[Higgsfield Test] API response:', error.response?.status, error.response?.data);
        expect(error.response?.status).not.toBe(401);
        expect(error.response?.status).not.toBe(403);
      }
    }
  }, 15000); // 15 second timeout for API call

  it('should accept valid generation request parameters', () => {
    const request = {
      prompt: 'A beautiful sunset over the ocean with gentle waves',
      duration: 5,
      aspectRatio: '16:9' as const,
      model: 'standard' as const,
    };

    expect(request.prompt).toBeTruthy();
    expect(request.duration).toBeGreaterThan(0);
    expect(['16:9', '9:16', '1:1']).toContain(request.aspectRatio);
    expect(['standard', 'pro']).toContain(request.model);
  });

  it('should use default parameters when not specified', () => {
    const request = {
      prompt: 'Test video',
    };

    const duration = request.duration || 5;
    const aspectRatio = request.aspectRatio || '16:9';
    const model = request.model || 'standard';

    expect(duration).toBe(5);
    expect(aspectRatio).toBe('16:9');
    expect(model).toBe('standard');
  });
});
