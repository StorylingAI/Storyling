/**
 * Google Veo 3 Video Generation Integration
 * 
 * This module handles video generation using Google's Veo 3 API
 * through the Vertex AI platform.
 */

import axios from 'axios';
import { storagePut } from './storage';

const GOOGLE_VEO_API_KEY = process.env.GOOGLE_VEO_API_KEY;
const GOOGLE_PROJECT_ID = process.env.GOOGLE_PROJECT_ID || 'storylingai';
const GOOGLE_LOCATION = process.env.GOOGLE_LOCATION || 'us-central1';

interface Veo3GenerationRequest {
  prompt: string;
  duration?: number; // Duration in seconds (default: 5)
  aspectRatio?: '16:9' | '9:16' | '1:1'; // Default: 16:9
}

interface Veo3GenerationResponse {
  videoUrl: string;
  status: 'completed' | 'processing' | 'failed';
  taskId?: string;
}

/**
 * Generate a video using Google Veo 3 API
 * @param request - Video generation request parameters
 * @returns Video URL and generation status
 */
export async function generateVeo3Video(
  request: Veo3GenerationRequest
): Promise<Veo3GenerationResponse> {
  if (!GOOGLE_VEO_API_KEY) {
    throw new Error('GOOGLE_VEO_API_KEY is not configured');
  }

  const { prompt, duration = 5, aspectRatio = '16:9' } = request;

  console.log('[Veo3] Starting video generation:', { prompt, duration, aspectRatio });

  try {
    // Google Veo 3 API endpoint (using Imagen/Veo through Vertex AI)
    const endpoint = `https://${GOOGLE_LOCATION}-aiplatform.googleapis.com/v1/projects/${GOOGLE_PROJECT_ID}/locations/${GOOGLE_LOCATION}/publishers/google/models/veo-001:predict`;

    // Make API request to Google Veo 3
    const response = await axios.post(
      endpoint,
      {
        instances: [
          {
            prompt: prompt,
            parameters: {
              duration: duration,
              aspectRatio: aspectRatio,
              outputFormat: 'mp4',
            },
          },
        ],
      },
      {
        headers: {
          'Authorization': `Bearer ${GOOGLE_VEO_API_KEY}`,
          'Content-Type': 'application/json',
        },
        timeout: 120000, // 2 minute timeout
      }
    );

    console.log('[Veo3] API response received:', response.data);

    // Check if video generation is complete or needs polling
    if (response.data.predictions && response.data.predictions[0]) {
      const prediction = response.data.predictions[0];

      // If video is ready, download and upload to S3
      if (prediction.videoUri) {
        console.log('[Veo3] Video ready, downloading from:', prediction.videoUri);
        
        // Download video from Google Cloud Storage
        const videoResponse = await axios.get(prediction.videoUri, {
          responseType: 'arraybuffer',
          headers: {
            'Authorization': `Bearer ${GOOGLE_VEO_API_KEY}`,
          },
        });

        // Upload to persistent storage
        const timestamp = Date.now();
        const filename = `veo3-video-${timestamp}.mp4`;
        const s3Key = `generated-videos/${filename}`;

        console.log('[Veo3] Uploading video to storage:', s3Key);
        const { url } = await storagePut(s3Key, videoResponse.data, 'video/mp4');

        console.log('[Veo3] Video generation complete:', url);
        return {
          videoUrl: url,
          status: 'completed',
        };
      }

      // If video is still processing, return task ID for polling
      if (prediction.taskId) {
        console.log('[Veo3] Video still processing, task ID:', prediction.taskId);
        return {
          videoUrl: '',
          status: 'processing',
          taskId: prediction.taskId,
        };
      }
    }

    throw new Error('Unexpected API response format');
  } catch (error: any) {
    console.error('[Veo3] Video generation failed:', error.response?.data || error.message);
    
    // Provide more specific error messages
    if (error.response?.status === 401) {
      throw new Error('Google Veo 3 API authentication failed. Please check your API key.');
    } else if (error.response?.status === 403) {
      throw new Error('Google Veo 3 API access denied. Please ensure the API is enabled for your project.');
    } else if (error.response?.status === 429) {
      throw new Error('Google Veo 3 API rate limit exceeded. Please try again later.');
    }

    throw new Error(`Google Veo 3 video generation failed: ${error.message}`);
  }
}

/**
 * Poll for video generation status
 * @param taskId - Task ID from initial generation request
 * @returns Video URL when complete
 */
export async function pollVeo3Status(taskId: string): Promise<Veo3GenerationResponse> {
  if (!GOOGLE_VEO_API_KEY) {
    throw new Error('GOOGLE_VEO_API_KEY is not configured');
  }

  console.log('[Veo3] Polling status for task:', taskId);

  try {
    const endpoint = `https://${GOOGLE_LOCATION}-aiplatform.googleapis.com/v1/projects/${GOOGLE_PROJECT_ID}/locations/${GOOGLE_LOCATION}/operations/${taskId}`;

    const response = await axios.get(endpoint, {
      headers: {
        'Authorization': `Bearer ${GOOGLE_VEO_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const operation = response.data;

    // Check if operation is complete
    if (operation.done) {
      if (operation.error) {
        throw new Error(`Video generation failed: ${operation.error.message}`);
      }

      // Download and upload video to persistent storage
      const videoUri = operation.response?.videoUri;
      if (videoUri) {
        const videoResponse = await axios.get(videoUri, {
          responseType: 'arraybuffer',
          headers: {
            'Authorization': `Bearer ${GOOGLE_VEO_API_KEY}`,
          },
        });

        const timestamp = Date.now();
        const filename = `veo3-video-${timestamp}.mp4`;
        const s3Key = `generated-videos/${filename}`;

        const { url } = await storagePut(s3Key, videoResponse.data, 'video/mp4');

        console.log('[Veo3] Video generation complete:', url);
        return {
          videoUrl: url,
          status: 'completed',
        };
      }
    }

    // Still processing
    return {
      videoUrl: '',
      status: 'processing',
      taskId: taskId,
    };
  } catch (error: any) {
    console.error('[Veo3] Status polling failed:', error.response?.data || error.message);
    throw new Error(`Failed to poll video status: ${error.message}`);
  }
}
