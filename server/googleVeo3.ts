/**
 * Google Veo 3 video generation via Replicate.
 *
 * Kept under the historical googleVeo3 module name so existing imports keep
 * working while the provider moved from direct Google/Vertex calls to Replicate.
 */

import {
  generateReplicateVeo3Video,
  getReplicatePrediction,
  materializeReplicateVideoPrediction,
} from "./replicateGeneration";

interface Veo3GenerationRequest {
  prompt: string;
  duration?: number;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  seed?: number;
  persistToStorage?: boolean;
  sourceImageUrl?: string;
  generateAudio?: boolean;
  negativePrompt?: string;
}

interface Veo3GenerationResponse {
  videoUrl: string;
  status: "completed" | "processing" | "failed";
  taskId?: string;
  error?: string;
}

export async function generateVeo3Video(
  request: Veo3GenerationRequest,
): Promise<Veo3GenerationResponse> {
  const result = await generateReplicateVeo3Video(request);
  return {
    videoUrl: result.videoUrl,
    status: result.status,
    taskId: result.requestId,
    error: result.error,
  };
}

export async function pollVeo3Status(taskId: string): Promise<Veo3GenerationResponse> {
  const prediction = await getReplicatePrediction(taskId);
  const result = await materializeReplicateVideoPrediction(prediction, true);
  return {
    videoUrl: result.videoUrl,
    status: result.status,
    taskId: result.requestId,
    error: result.error,
  };
}
