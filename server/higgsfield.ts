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
const HIGGSFIELD_API_BASE = 'https://platform.higgsfield.ai';

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 5000;
const IMAGE_POLL_MAX_ATTEMPTS = 75;
const IMAGE_POLL_INTERVAL_MS = 4000;
const IMAGE_TIMEOUT_RETRIES = 1;
const DOP_POLL_MAX_ATTEMPTS = 60;
const DOP_POLL_INTERVAL_MS = 5000;
const DOP_TIMEOUT_RETRIES = 1;

function getAuthHeader(): string {
  return `Key ${HIGGSFIELD_API_KEY_ID}:${HIGGSFIELD_API_KEY_SECRET}`;
}

function isCloudflareOrServerError(error: any): boolean {
  const status = error.response?.status;
  if (status && status >= 500) return true;
  const data = error.response?.data;
  if (typeof data === 'string' && (data.includes('cloudflare') || data.includes('<!DOCTYPE'))) return true;
  return false;
}

function formatProviderErrorDetail(rawData: any): string {
  const detail = rawData?.detail;
  if (typeof detail === 'string' && detail.trim()) {
    return detail.trim();
  }
  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((item) => {
        if (typeof item === 'string') {
          return item;
        }
        const location = Array.isArray(item?.loc) ? item.loc.join('.') : '';
        const message = item?.msg || item?.message || JSON.stringify(item);
        return location ? `${location}: ${message}` : message;
      })
      .join('; ');
  }
  if (typeof rawData?.error === 'string' && rawData.error.trim()) {
    return rawData.error.trim();
  }
  return '';
}

function shouldLogPollingStatus(
  status: string | undefined,
  lastStatus: string | undefined,
  attempt: number,
): boolean {
  const noisyStatuses = new Set(['queued', 'in_progress']);
  return !noisyStatuses.has(status || '') || attempt < 3 || (attempt + 1) % 5 === 0 || status !== lastStatus;
}

async function sleep(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

interface HiggsfieldGenerationRequest {
  prompt: string;
  duration?: number;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  model?: 'standard' | 'pro';
  seed?: number; // Deterministic seed for consistent visual style
  persistToStorage?: boolean; // Persist locally/Forge or keep provider CDN URL
  referenceImageUrls?: string[]; // Extra image references to preserve subject identity
}

interface HiggsfieldGenerationResponse {
  videoUrl: string;
  status: 'completed' | 'processing' | 'failed';
  requestId?: string;
  error?: string;
}

interface HiggsfieldImageRequest {
  prompt: string;
  aspectRatio?: '16:9' | '9:16' | '1:1';
  resolution?: '720p' | '1080p';
  seed?: number;
}

const DOP_MAX_INPUT_IMAGES = 1;

export async function generateHiggsfieldImage(
  request: HiggsfieldImageRequest,
): Promise<{ imageUrl: string; requestId?: string }> {
  const {
    prompt,
    aspectRatio = '16:9',
    resolution = '720p',
    seed,
  } = request;

  console.log('[Higgsfield] Generating reference image:', {
    prompt: prompt.substring(0, 100),
    aspectRatio,
    resolution,
  });

  let lastStatus = 'unknown';
  const maxImageWaitSeconds = Math.floor((IMAGE_POLL_MAX_ATTEMPTS * IMAGE_POLL_INTERVAL_MS) / 1000);

  for (let submissionAttempt = 0; submissionAttempt <= IMAGE_TIMEOUT_RETRIES; submissionAttempt++) {
    let imageResponse: any;
    for (let retry = 0; retry <= MAX_RETRIES; retry++) {
      try {
        imageResponse = await axios.post(
          `${HIGGSFIELD_API_BASE}/higgsfield-ai/soul/standard`,
          {
            prompt,
            aspect_ratio: aspectRatio,
            resolution,
            ...(seed !== undefined && { seed }),
          },
          {
            headers: {
              'Authorization': getAuthHeader(),
              'Content-Type': 'application/json',
              'Accept': 'application/json',
            },
            timeout: 60000,
          }
        );
        break;
      } catch (err: any) {
        if (isCloudflareOrServerError(err) && retry < MAX_RETRIES) {
          console.warn(`[Higgsfield] Reference image server error (attempt ${retry + 1}/${MAX_RETRIES + 1}), retrying...`);
          await sleep(RETRY_DELAY_MS);
          continue;
        }
        throw err;
      }
    }

    const imageRequestId = imageResponse.data.request_id;
    console.log('[Higgsfield] Image request created:', imageRequestId);

    lastStatus = 'submitted';

    for (let attempt = 0; attempt < IMAGE_POLL_MAX_ATTEMPTS; attempt++) {
      await sleep(IMAGE_POLL_INTERVAL_MS);
      try {
        const statusResp = await axios.get(
          `${HIGGSFIELD_API_BASE}/requests/${imageRequestId}/status`,
          { headers: { 'Authorization': getAuthHeader() }, timeout: 30000 }
        );
        const imgStatus = statusResp.data.status;
        if (shouldLogPollingStatus(imgStatus, lastStatus, attempt)) {
          console.log(`[Higgsfield] Image status check ${attempt + 1}/${IMAGE_POLL_MAX_ATTEMPTS}:`, imgStatus);
        }

        lastStatus = imgStatus;

        if (imgStatus === 'completed') {
          const imageUrl = statusResp.data.images?.[0]?.url;
          if (!imageUrl) {
            console.error('[Higgsfield] Image completed but no URL found:', JSON.stringify(statusResp.data));
            throw new Error('Image generation completed but no image URL found');
          }
          console.log('[Higgsfield] Image ready:', imageUrl);
          return {
            imageUrl,
            requestId: imageRequestId,
          };
        }

        if (imgStatus === 'failed') {
          throw new Error(statusResp.data.error || 'Image generation failed');
        }

        if (imgStatus === 'nsfw') {
          throw new Error('Content was flagged as inappropriate. Please try a different prompt.');
        }
      } catch (pollErr: any) {
        if (isCloudflareOrServerError(pollErr)) {
          continue;
        }
        throw pollErr;
      }
    }

    const canRetrySubmission =
      submissionAttempt < IMAGE_TIMEOUT_RETRIES &&
      (lastStatus === 'queued' || lastStatus === 'submitted' || lastStatus === 'unknown');

    if (canRetrySubmission) {
      console.warn(
        `[Higgsfield] Image request ${imageRequestId} remained ${lastStatus} for ${maxImageWaitSeconds}s, submitting a fresh image request (${submissionAttempt + 2}/${IMAGE_TIMEOUT_RETRIES + 1})`,
      );
      continue;
    }

    break;
  }

  throw new Error(`Image generation timeout after ${maxImageWaitSeconds}s (last status: ${lastStatus})`);
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

  const {
    prompt,
    duration = 5,
    aspectRatio = '16:9',
    model = 'standard',
    seed,
    persistToStorage = true,
    referenceImageUrls = [],
  } = request;

  // Two-step generation: text→image (soul) then image→video (DoP)
  const dopModel = model === 'pro' ? 'dop-turbo' : 'dop-preview';

  console.log('[Higgsfield] Starting video generation (text→image→video):', { prompt: prompt.substring(0, 100), duration, aspectRatio, model: dopModel });

  try {
    // Step 1: Generate image from text prompt using soul/standard
    console.log('[Higgsfield] Step 1: Generating image from text...');
    let imageUrl: string;
    let imageRequestId: string | undefined;
    try {
      const imageResult = await generateHiggsfieldImage({
        prompt,
        aspectRatio,
        resolution: '720p',
        seed,
      });
      imageUrl = imageResult.imageUrl;
      imageRequestId = imageResult.requestId;
    } catch (imageError: any) {
      if (imageError?.message?.includes('flagged as inappropriate')) {
        return {
          videoUrl: '',
          status: 'failed' as const,
          requestId: imageRequestId,
          error: imageError.message,
        };
      }
      throw imageError;
    }

    const normalizedReferenceImages = Array.from(
      new Set(referenceImageUrls.map((url) => url.trim()).filter(Boolean)),
    );

    if (normalizedReferenceImages.length > 0) {
      console.warn(
        `[Higgsfield] DoP currently accepts at most ${DOP_MAX_INPUT_IMAGES} input image; ignoring ${normalizedReferenceImages.length} extra character reference image(s)`,
      );
    }

    // Step 2: Convert image to video using DoP
    console.log('[Higgsfield] Step 2: Converting image to video via DoP...');
    const createDopJob = async (): Promise<{ requestId: string; pollUrl: string }> => {
      let createResponse: any;
      for (let retry = 0; retry <= MAX_RETRIES; retry++) {
        try {
          const params = {
              model: dopModel,
              input_images: [{ type: 'image_url', image_url: imageUrl }],
              prompt,
              duration: [5, 10, 15].includes(duration) ? duration : 5,
            };
          console.log('[Higgsfield] DoP request body:', JSON.stringify({ params: { ...params, prompt: params.prompt.substring(0, 80) + '...', input_images: ['<truncated>'] } }));
          createResponse = await axios.post(
            `${HIGGSFIELD_API_BASE}/v1/image2video/dop`,
            { params },
            {
              headers: {
                'Authorization': getAuthHeader(),
                'Content-Type': 'application/json',
                'Accept': 'application/json',
              },
              timeout: 60000,
            }
          );
          break;
        } catch (err: any) {
          if (isCloudflareOrServerError(err) && retry < MAX_RETRIES) {
            console.warn(`[Higgsfield] Server error (attempt ${retry + 1}/${MAX_RETRIES + 1}), retrying in ${RETRY_DELAY_MS / 1000}s...`);
            await sleep(RETRY_DELAY_MS);
            continue;
          }
          throw err;
        }
      }

      console.log('[Higgsfield] DoP response:', JSON.stringify(createResponse.data));
      const requestId = createResponse.data.request_id || createResponse.data.id;
      if (!requestId) {
        throw new Error('No request/job ID returned from DoP API');
      }

      const isV1 = !!createResponse.data.id && !createResponse.data.request_id;
      const pollUrl = isV1
        ? `${HIGGSFIELD_API_BASE}/v1/job-sets/${requestId}`
        : `${HIGGSFIELD_API_BASE}/requests/${requestId}/status`;

      console.log('[Higgsfield] DoP video request created:', requestId, 'polling via:', pollUrl);
      return { requestId, pollUrl };
    };

    // Step 3: Poll for video completion (Higgsfield typically takes 30-120 seconds)
    const maxVideoWaitSeconds = Math.floor((DOP_POLL_MAX_ATTEMPTS * DOP_POLL_INTERVAL_MS) / 1000);
    let requestId: string | undefined;
    let lastVideoStatus = 'unknown';

    for (let submissionAttempt = 0; submissionAttempt <= DOP_TIMEOUT_RETRIES; submissionAttempt++) {
      const createdJob = await createDopJob();
      requestId = createdJob.requestId;
      lastVideoStatus = 'submitted';

      for (let attempt = 0; attempt < DOP_POLL_MAX_ATTEMPTS; attempt++) {
        await sleep(DOP_POLL_INTERVAL_MS);

        let statusResponse: any;
        try {
          statusResponse = await axios.get(
            createdJob.pollUrl,
            {
              headers: {
                'Authorization': getAuthHeader(),
              },
              timeout: 30000,
            }
          );
        } catch (pollError: any) {
          if (isCloudflareOrServerError(pollError)) {
            console.warn(`[Higgsfield] Server error during polling (attempt ${attempt + 1}), will retry...`);
            continue;
          }
          throw pollError;
        }

        const data = statusResponse.data;
        // V1 job-set: status is in jobs[0].status, V2: status is at root
        const status = data.status || data.jobs?.[0]?.status;
        if (shouldLogPollingStatus(status, lastVideoStatus, attempt)) {
          console.log(`[Higgsfield] Status check ${attempt + 1}/${DOP_POLL_MAX_ATTEMPTS}:`, status);
        }

        lastVideoStatus = status;

        if (status === 'completed') {
          console.log('[Higgsfield] Completed response data:', JSON.stringify(data, null, 2));

          // V1: video URL in jobs[0].results.raw.url, V2: in video.url
          const videoUrl = data.video?.url
            || data.jobs?.[0]?.results?.raw?.url
            || data.jobs?.[0]?.results?.min?.url;

          if (!videoUrl) {
            console.error('[Higgsfield] No video URL found in response keys:', Object.keys(statusResponse.data));
            throw new Error('Video URL not found in completed response');
          }

          if (!persistToStorage) {
            console.log('[Higgsfield] Video ready, returning provider URL without storage upload');
            return {
              videoUrl,
              status: 'completed',
              requestId,
            };
          }

          console.log('[Higgsfield] Video ready, downloading from:', videoUrl);

          // Step 3: Download video and upload to persistent storage
          const videoResponse = await axios.get(videoUrl, {
            responseType: 'arraybuffer',
            timeout: 120000,
          });

          const timestamp = Date.now();
          const filename = `higgsfield-video-${timestamp}.mp4`;
          const s3Key = `generated-videos/${filename}`;

          console.log('[Higgsfield] Uploading video to storage:', s3Key);
          const { url } = await storagePut(s3Key, videoResponse.data, 'video/mp4');

          console.log('[Higgsfield] Video generation complete:', url);
          return {
            videoUrl: url,
            status: 'completed',
            requestId,
          };
        } else if (status === 'failed') {
          const errorMessage = statusResponse.data.error || 'Video generation failed';
          console.error('[Higgsfield] Generation failed:', errorMessage);
          return {
            videoUrl: '',
            status: 'failed',
            requestId,
            error: errorMessage,
          };
        } else if (status === 'nsfw') {
          console.error('[Higgsfield] Content rejected: NSFW detected');
          return {
            videoUrl: '',
            status: 'failed',
            requestId,
            error: 'Content was flagged as inappropriate. Please try a different prompt.',
          };
        }
      }

      const canRetrySubmission =
        submissionAttempt < DOP_TIMEOUT_RETRIES &&
        (lastVideoStatus === 'queued' || lastVideoStatus === 'in_progress' || lastVideoStatus === 'submitted' || lastVideoStatus === 'unknown');

      if (canRetrySubmission) {
        console.warn(
          `[Higgsfield] DoP request ${requestId} remained ${lastVideoStatus} for ${maxVideoWaitSeconds}s, submitting a fresh video request (${submissionAttempt + 2}/${DOP_TIMEOUT_RETRIES + 1})`,
        );
        continue;
      }

      break;
    }

    // Timeout after max attempts
    console.warn('[Higgsfield] Generation timeout after', maxVideoWaitSeconds, 'seconds');
    return {
      videoUrl: '',
      status: 'processing',
      requestId,
      error: `Video generation timeout after ${maxVideoWaitSeconds}s (last status: ${lastVideoStatus})`,
    };

  } catch (error: any) {
    const status = error.response?.status;
    const rawData = error.response?.data;

    if (isCloudflareOrServerError(error)) {
      console.error(`[Higgsfield] Service unavailable (HTTP ${status || 'timeout'})`);
      throw new Error('Video generation service is temporarily unavailable. Please try again in a few minutes.');
    }

    console.error('[Higgsfield] Video generation error:', JSON.stringify(rawData, null, 2) || error.message);

    // Check for "not enough credits" before generic auth errors
    const detailMsg = formatProviderErrorDetail(rawData);
    const isCreditsError = detailMsg.toLowerCase().includes('not enough credits');

    if (isCreditsError) {
      console.error('[Higgsfield] Not enough credits');
      throw new Error('Not enough Higgsfield credits to generate this video. Please add credits to your Higgsfield account.');
    } else if (status === 401 || status === 403) {
      throw new Error('Higgsfield API authentication failed. Please check your API credentials.');
    } else if (status === 429) {
      throw new Error('Higgsfield API rate limit exceeded. Please try again later.');
    } else if (status === 400 || status === 422) {
      const errorMsg = detailMsg || 'Invalid request parameters';
      throw new Error(`Higgsfield API error: ${errorMsg}`);
    } else if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new Error('Video generation service timed out. Please try again later.');
    }

    throw new Error(`Higgsfield video generation failed: ${error.message}`);
  }
}

/**
 * Check the status of a video generation request
 * @param requestId - Request ID from initial generation request
 * @returns Current status and video URL if complete
 */
export async function checkHiggsfieldStatus(requestId: string): Promise<HiggsfieldGenerationResponse> {
  if (!HIGGSFIELD_API_KEY_ID || !HIGGSFIELD_API_KEY_SECRET) {
    throw new Error('Higgsfield API credentials are not configured');
  }

  console.log('[Higgsfield] Checking status for request:', requestId);

  try {
    const response = await axios.get(
      `${HIGGSFIELD_API_BASE}/requests/${requestId}/status`,
      {
        headers: {
          'Authorization': getAuthHeader(),
        },
        timeout: 30000,
      }
    );

    const status = response.data.status;

    if (status === 'completed') {
      console.log('[Higgsfield] Status check completed response:', JSON.stringify(response.data, null, 2));

      const videoUrl = response.data.video?.url;

      if (videoUrl) {
        // Download and upload to persistent storage if not already done
        const videoResponse = await axios.get(videoUrl, {
          responseType: 'arraybuffer',
          timeout: 120000,
        });

        const timestamp = Date.now();
        const filename = `higgsfield-video-${timestamp}.mp4`;
        const s3Key = `generated-videos/${filename}`;

        console.log('[Higgsfield] Uploading completed status video to storage:', s3Key);
        const { url } = await storagePut(s3Key, videoResponse.data, 'video/mp4');

        return {
          videoUrl: url,
          status: 'completed',
          requestId,
        };
      }
    } else if (status === 'failed') {
      return {
        videoUrl: '',
        status: 'failed',
        requestId,
        error: response.data.error || 'Generation failed',
      };
    } else if (status === 'nsfw') {
      return {
        videoUrl: '',
        status: 'failed',
        requestId,
        error: 'Content was flagged as inappropriate.',
      };
    }

    // Still processing (queued or in_progress)
    return {
      videoUrl: '',
      status: 'processing',
      requestId,
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
