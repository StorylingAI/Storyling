/**
 * Higgsfield Video Generation Integration
 * 
 * This module handles video generation using Higgsfield's API
 * Documentation: https://docs.higgsfield.ai
 */

import axios from 'axios';
import { storagePut } from './storage';

const HIGGSFIELD_API_KEY_ID = process.env.HIGGSFIELD_API_KEY_ID;
const HIGGSFIELD_API_KEY_SECRET = process.env.HIGGSFIELD_API_KEY_SECRET;
const HIGGSFIELD_API_BASE = 'https://api.higgsfield.ai/v1';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;

function isCloudflareOrServerError(error: any): boolean {
  const status = error.response?.status;
  if (status && status >= 500) return true;
  const data = error.response?.data;
  if (typeof data === 'string' && (data.includes('cloudflare') || data.includes('<!DOCTYPE'))) return true;
  return false;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface HiggsfieldGenerationRequest {
  prompt: string;
  duration?: number; // Duration in seconds (default: 5)
  aspectRatio?: '16:9' | '9:16' | '1:1'; // Default: 16:9
  model?: 'standard' | 'pro'; // Default: standard
}

interface HiggsfieldGenerationResponse {
  videoUrl: string;
  status: 'completed' | 'processing' | 'failed';
  taskId?: string;
  error?: string;
}

/**
 * Generate a video using Higgsfield API
 * @param request - Video generation request parameters
 * @returns Video URL and generation status
 */
export async function generateHiggsfieldVideo(
  request: HiggsfieldGenerationRequest
): Promise<HiggsfieldGenerationResponse> {
  if (!HIGGSFIELD_API_KEY_ID || !HIGGSFIELD_API_KEY_SECRET) {
    throw new Error('Higgsfield API credentials are not configured');
  }

  const { prompt, duration = 5, aspectRatio = '16:9', model = 'standard' } = request;

  console.log('[Higgsfield] Starting video generation:', { prompt, duration, aspectRatio, model });

  try {
    // Step 1: Create video generation task (with retry for server/Cloudflare errors)
    let createResponse: any;
    for (let retry = 0; retry <= MAX_RETRIES; retry++) {
      try {
        createResponse = await axios.post(
          `${HIGGSFIELD_API_BASE}/generate`,
          {
            prompt: prompt,
            duration: duration,
            aspect_ratio: aspectRatio,
            model: model,
          },
          {
            headers: {
              'X-API-Key-ID': HIGGSFIELD_API_KEY_ID,
              'X-API-Key-Secret': HIGGSFIELD_API_KEY_SECRET,
              'Content-Type': 'application/json',
            },
            timeout: 60000,
          }
        );
        break; // Success
      } catch (err: any) {
        if (isCloudflareOrServerError(err) && retry < MAX_RETRIES) {
          console.warn(`[Higgsfield] Server error (attempt ${retry + 1}/${MAX_RETRIES + 1}), retrying in ${RETRY_DELAY_MS / 1000}s...`);
          await sleep(RETRY_DELAY_MS);
          continue;
        }
        throw err;
      }
    }

    const taskId = createResponse.data.task_id || createResponse.data.id;
    console.log('[Higgsfield] Task created:', taskId);

    // Step 2: Poll for completion (Higgsfield typically takes 30-120 seconds)
    const maxAttempts = 60; // 5 minutes max
    const pollInterval = 5000; // 5 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      await new Promise(resolve => setTimeout(resolve, pollInterval));

      let statusResponse: any;
      try {
        statusResponse = await axios.get(
          `${HIGGSFIELD_API_BASE}/generate/${taskId}`,
          {
            headers: {
              'X-API-Key-ID': HIGGSFIELD_API_KEY_ID,
              'X-API-Key-Secret': HIGGSFIELD_API_KEY_SECRET,
            },
            timeout: 30000,
          }
        );
      } catch (pollError: any) {
        if (isCloudflareOrServerError(pollError)) {
          console.warn(`[Higgsfield] Server error during polling (attempt ${attempt + 1}), will retry...`);
          continue; // Skip this poll attempt, try again next loop
        }
        throw pollError;
      }

      const status = statusResponse.data.status;
      console.log(`[Higgsfield] Status check ${attempt + 1}/${maxAttempts}:`, status);

      if (status === 'completed' || status === 'succeeded') {
        const videoUrl = statusResponse.data.video_url || statusResponse.data.output_url;
        
        if (!videoUrl) {
          throw new Error('Video URL not found in completed response');
        }

        console.log('[Higgsfield] Video ready, downloading from:', videoUrl);

        // Step 3: Download video and upload to S3
        const videoResponse = await axios.get(videoUrl, {
          responseType: 'arraybuffer',
          timeout: 120000, // 2 minute timeout for download
        });

        const timestamp = Date.now();
        const filename = `higgsfield-video-${timestamp}.mp4`;
        const s3Key = `generated-videos/${filename}`;

        console.log('[Higgsfield] Uploading video to S3:', s3Key);
        const { url } = await storagePut(s3Key, videoResponse.data, 'video/mp4');

        console.log('[Higgsfield] Video generation complete:', url);
        return {
          videoUrl: url,
          status: 'completed',
          taskId: taskId,
        };
      } else if (status === 'failed' || status === 'error') {
        const errorMessage = statusResponse.data.error || 'Video generation failed';
        console.error('[Higgsfield] Generation failed:', errorMessage);
        return {
          videoUrl: '',
          status: 'failed',
          taskId: taskId,
          error: errorMessage,
        };
      }

      // Still processing, continue polling
    }

    // Timeout after max attempts
    console.warn('[Higgsfield] Generation timeout after', maxAttempts * pollInterval / 1000, 'seconds');
    return {
      videoUrl: '',
      status: 'processing',
      taskId: taskId,
      error: 'Video generation timeout - please try again',
    };

  } catch (error: any) {
    const status = error.response?.status;
    const rawData = error.response?.data;

    // Log clean message, not raw HTML
    if (isCloudflareOrServerError(error)) {
      console.error(`[Higgsfield] Service unavailable (HTTP ${status || 'timeout'})`);
      throw new Error('Video generation service is temporarily unavailable. Please try again in a few minutes.');
    }

    console.error('[Higgsfield] Video generation error:', typeof rawData === 'string' ? rawData.slice(0, 200) : rawData || error.message);

    if (status === 401 || status === 403) {
      throw new Error('Higgsfield API authentication failed. Please check your API credentials.');
    } else if (status === 429) {
      throw new Error('Higgsfield API rate limit exceeded. Please try again later.');
    } else if (status === 400) {
      const errorMsg = rawData?.error || 'Invalid request parameters';
      throw new Error(`Higgsfield API error: ${errorMsg}`);
    } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new Error('Video generation service timed out. Please try again later.');
    }

    throw new Error(`Higgsfield video generation failed: ${error.message}`);
  }
}

/**
 * Check the status of a video generation task
 * @param taskId - Task ID from initial generation request
 * @returns Current status and video URL if complete
 */
export async function checkHiggsfieldStatus(taskId: string): Promise<HiggsfieldGenerationResponse> {
  if (!HIGGSFIELD_API_KEY_ID || !HIGGSFIELD_API_KEY_SECRET) {
    throw new Error('Higgsfield API credentials are not configured');
  }

  console.log('[Higgsfield] Checking status for task:', taskId);

  try {
    const response = await axios.get(
      `${HIGGSFIELD_API_BASE}/generate/${taskId}`,
      {
        headers: {
          'X-API-Key-ID': HIGGSFIELD_API_KEY_ID,
          'X-API-Key-Secret': HIGGSFIELD_API_KEY_SECRET,
        },
      }
    );

    const status = response.data.status;

    if (status === 'completed' || status === 'succeeded') {
      const videoUrl = response.data.video_url || response.data.output_url;
      
      if (videoUrl) {
        // Download and upload to S3 if not already done
        const videoResponse = await axios.get(videoUrl, {
          responseType: 'arraybuffer',
        });

        const timestamp = Date.now();
        const filename = `higgsfield-video-${timestamp}.mp4`;
        const s3Key = `generated-videos/${filename}`;

        const { url } = await storagePut(s3Key, videoResponse.data, 'video/mp4');

        return {
          videoUrl: url,
          status: 'completed',
          taskId: taskId,
        };
      }
    } else if (status === 'failed' || status === 'error') {
      return {
        videoUrl: '',
        status: 'failed',
        taskId: taskId,
        error: response.data.error || 'Generation failed',
      };
    }

    // Still processing
    return {
      videoUrl: '',
      status: 'processing',
      taskId: taskId,
    };

  } catch (error: any) {
    if (isCloudflareOrServerError(error)) {
      console.error(`[Higgsfield] Status check: service unavailable (HTTP ${error.response?.status || 'timeout'})`);
      throw new Error('Video generation service is temporarily unavailable. Please try again in a few minutes.');
    }
    console.error('[Higgsfield] Status check error:', error.message);
    throw new Error(`Failed to check video status: ${error.message}`);
  }
}
