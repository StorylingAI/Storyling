import { storagePut } from "server/storage";

const REPLICATE_API_BASE = "https://api.replicate.com/v1";
const DEFAULT_VEO3_MODEL = "google/veo-3";
const DEFAULT_NANO_BANANA_2_MODEL = "google/nano-banana-2";
const DEFAULT_POLL_INTERVAL_MS = 5000;
const DEFAULT_SYNC_WAIT_SECONDS = 10;
const DEFAULT_VIDEO_MAX_WAIT_MS = 12 * 60 * 1000;
const DEFAULT_IMAGE_MAX_WAIT_MS = 5 * 60 * 1000;
const DEFAULT_VEO3_NEGATIVE_PROMPT =
  "text, captions, subtitles, logos, watermarks, flickering text, distorted faces, extra limbs, duplicated people, unstable anatomy";

type ReplicatePredictionStatus =
  | "starting"
  | "processing"
  | "succeeded"
  | "canceled"
  | "failed";

type ReplicatePrediction = {
  id?: string;
  status?: ReplicatePredictionStatus;
  output?: unknown;
  error?: unknown;
  logs?: string;
  urls?: {
    get?: string;
    cancel?: string;
    stream?: string;
    web?: string;
  };
};

export type ReplicateVideoResponse = {
  videoUrl: string;
  status: "completed" | "processing" | "failed";
  requestId?: string;
  error?: string;
};

export type ReplicateImageResponse = {
  url?: string;
  requestId?: string;
};

export type ReplicateVeo3Request = {
  prompt: string;
  duration?: number;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  seed?: number;
  persistToStorage?: boolean;
  sourceImageUrl?: string;
  resolution?: "720p" | "1080p";
  generateAudio?: boolean;
  negativePrompt?: string;
  modelId?: string;
};

export type ReplicateImageRequest = {
  prompt: string;
  aspectRatio?: string;
  resolution?: "1K" | "2K" | "4K";
  imageInputUrls?: string[];
  outputFormat?: "jpg" | "png";
  googleSearch?: boolean;
  imageSearch?: boolean;
  persistToStorage?: boolean;
  modelId?: string;
};

function hasConfiguredValue(value?: string): value is string {
  return Boolean(value && value.trim() && !value.includes("your_"));
}

function resolveReplicateApiToken(): string {
  const token = process.env.REPLICATE_API_TOKEN || process.env.REPLICATE_API_KEY;
  if (!hasConfiguredValue(token)) {
    throw new Error("REPLICATE_API_TOKEN is not configured");
  }
  return token.trim();
}

function resolveModelId(modelId: string | undefined, fallback: string): string {
  return (modelId || fallback).trim().replace(/^\/+/, "") || fallback;
}

function resolveModelPredictionEndpoint(modelId: string): string {
  const [owner, name] = modelId.split("/");
  if (!owner || !name || modelId.split("/").length !== 2) {
    throw new Error(`Invalid Replicate model id "${modelId}". Expected "owner/model".`);
  }
  return `${REPLICATE_API_BASE}/models/${encodeURIComponent(owner)}/${encodeURIComponent(name)}/predictions`;
}

function resolveNumberEnv(name: string, fallback: number): number {
  const parsed = Number(process.env[name]);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

function resolveBooleanEnv(name: string, fallback: boolean): boolean {
  const value = process.env[name]?.trim().toLowerCase();
  if (value === "true" || value === "1" || value === "yes") return true;
  if (value === "false" || value === "0" || value === "no") return false;
  return fallback;
}

function resolveVeo3Duration(duration?: number): 4 | 6 | 8 {
  if (duration !== undefined && duration <= 4) return 4;
  if (duration !== undefined && duration <= 6) return 6;
  return 8;
}

function resolveVeo3AspectRatio(aspectRatio?: string): "16:9" | "9:16" {
  return aspectRatio === "9:16" ? "9:16" : "16:9";
}

function resolveVeo3Resolution(resolution?: string): "720p" | "1080p" {
  const configured = (resolution || process.env.REPLICATE_VEO3_RESOLUTION || "").trim();
  return configured === "1080p" ? "1080p" : "720p";
}

function resolveNanoBananaResolution(resolution?: string): "1K" | "2K" | "4K" {
  const configured = (resolution || process.env.REPLICATE_NANO_BANANA_RESOLUTION || "").trim();
  if (configured === "2K" || configured === "4K") return configured;
  return "1K";
}

function resolveNanoBananaOutputFormat(outputFormat?: string): "jpg" | "png" {
  const configured = (outputFormat || process.env.REPLICATE_NANO_BANANA_OUTPUT_FORMAT || "").trim();
  return configured === "jpg" ? "jpg" : "png";
}

function resolvePublicUrl(url?: string): string | undefined {
  const trimmed = url?.trim();
  if (!trimmed) return undefined;
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const baseUrl = process.env.BASE_URL?.trim();
  if (baseUrl && /^https?:\/\//i.test(baseUrl)) {
    return new URL(trimmed, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).toString();
  }

  return undefined;
}

function uniquePublicUrls(urls: string[] = [], maxCount = 14): string[] {
  return Array.from(
    new Set(urls.map(resolvePublicUrl).filter((url): url is string => Boolean(url))),
  ).slice(0, maxCount);
}

function formatReplicateErrorDetail(data: unknown): string {
  if (!data) return "";
  if (typeof data === "string") return data;
  if (typeof data === "object") {
    const maybeError = data as { error?: unknown; detail?: unknown };
    if (typeof maybeError.error === "string") return maybeError.error;
    if (typeof maybeError.detail === "string") return maybeError.detail;
    if (Array.isArray(maybeError.detail)) {
      return maybeError.detail
        .map((item) => {
          if (typeof item === "string") return item;
          if (item && typeof item === "object") {
            const detail = item as { msg?: string; message?: string; loc?: unknown[] };
            const location = Array.isArray(detail.loc) ? detail.loc.join(".") : "";
            const message = detail.msg || detail.message || JSON.stringify(item);
            return location ? `${location}: ${message}` : message;
          }
          return String(item);
        })
        .join("; ");
    }
    return JSON.stringify(data);
  }
  return String(data);
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return undefined;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

function buildReplicateHttpError(response: Response, data: unknown): Error {
  const detail = formatReplicateErrorDetail(data);
  const suffix = detail ? `: ${detail}` : "";

  if (response.status === 401 || response.status === 403) {
    return new Error("Replicate API authentication failed. Check REPLICATE_API_TOKEN.");
  }
  if (response.status === 402) {
    return new Error("Replicate account has insufficient credit for this generation.");
  }
  if (response.status === 429) {
    return new Error("Replicate API rate limit exceeded. Please try again later.");
  }

  return new Error(`Replicate API request failed (${response.status} ${response.statusText})${suffix}`);
}

async function requestReplicateJson(url: string, init: RequestInit): Promise<ReplicatePrediction> {
  const response = await fetch(url, init);
  const data = await parseJsonResponse(response);
  if (!response.ok) {
    throw buildReplicateHttpError(response, data);
  }
  return data as ReplicatePrediction;
}

async function createReplicatePrediction(
  modelId: string,
  input: Record<string, unknown>,
  options: {
    cancelAfter?: string;
    syncWaitSeconds?: number;
  } = {},
): Promise<ReplicatePrediction> {
  const token = resolveReplicateApiToken();
  const syncWaitSeconds = Math.max(
    1,
    Math.min(60, Math.round(options.syncWaitSeconds ?? DEFAULT_SYNC_WAIT_SECONDS)),
  );

  return requestReplicateJson(resolveModelPredictionEndpoint(modelId), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: `wait=${syncWaitSeconds}`,
      ...(options.cancelAfter ? { "Cancel-After": options.cancelAfter } : {}),
    },
    body: JSON.stringify({ input }),
  });
}

export async function getReplicatePrediction(predictionId: string): Promise<ReplicatePrediction> {
  const token = resolveReplicateApiToken();
  return requestReplicateJson(`${REPLICATE_API_BASE}/predictions/${encodeURIComponent(predictionId)}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Prefer: `wait=${DEFAULT_SYNC_WAIT_SECONDS}`,
    },
  });
}

async function pollReplicatePrediction(
  initialPrediction: ReplicatePrediction,
  options: {
    maxWaitMs: number;
    pollIntervalMs: number;
  },
): Promise<ReplicatePrediction> {
  let prediction = initialPrediction;
  const maxAttempts = Math.max(1, Math.ceil(options.maxWaitMs / options.pollIntervalMs));

  for (let attempt = 0; attempt <= maxAttempts; attempt++) {
    if (
      prediction.status === "succeeded" ||
      prediction.status === "failed" ||
      prediction.status === "canceled"
    ) {
      return prediction;
    }

    if (attempt === maxAttempts) {
      return prediction;
    }

    await new Promise((resolve) => setTimeout(resolve, options.pollIntervalMs));

    const pollUrl = prediction.urls?.get;
    if (pollUrl) {
      const token = resolveReplicateApiToken();
      prediction = await requestReplicateJson(pollUrl, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Prefer: `wait=${DEFAULT_SYNC_WAIT_SECONDS}`,
        },
      });
    } else if (prediction.id) {
      prediction = await getReplicatePrediction(prediction.id);
    } else {
      return prediction;
    }
  }

  return prediction;
}

function extractFirstOutputUrl(output: unknown): string | undefined {
  if (typeof output === "string" && /^https?:\/\//i.test(output)) {
    return output;
  }

  if (Array.isArray(output)) {
    for (const item of output) {
      const nested = extractFirstOutputUrl(item);
      if (nested) return nested;
    }
  }

  if (output && typeof output === "object") {
    for (const value of Object.values(output)) {
      const nested = extractFirstOutputUrl(value);
      if (nested) return nested;
    }
  }

  return undefined;
}

function extensionForContentType(contentType: string | null, fallback: string): string {
  const type = contentType?.split(";")[0]?.trim().toLowerCase();
  if (type === "video/mp4") return "mp4";
  if (type === "video/webm") return "webm";
  if (type === "image/jpeg") return "jpg";
  if (type === "image/webp") return "webp";
  if (type === "image/png") return "png";
  return fallback;
}

async function persistRemoteFile(
  remoteUrl: string,
  storageNamePrefix: string,
  fallbackContentType: string,
  fallbackExtension: string,
): Promise<string> {
  try {
    const response = await fetch(remoteUrl);
    if (!response.ok) {
      console.warn(
        `[Replicate] Failed to persist output (${response.status} ${response.statusText}), using provider URL`,
      );
      return remoteUrl;
    }

    const contentType = response.headers.get("content-type") || fallbackContentType;
    const buffer = Buffer.from(await response.arrayBuffer());
    const extension = extensionForContentType(contentType, fallbackExtension);
    const { url } = await storagePut(
      `${storageNamePrefix}-${Date.now()}.${extension}`,
      buffer,
      contentType,
    );
    return url;
  } catch (error) {
    console.warn("[Replicate] Failed to persist output, using provider URL", error);
    return remoteUrl;
  }
}

export async function materializeReplicateVideoPrediction(
  prediction: ReplicatePrediction,
  persistToStorage = true,
): Promise<ReplicateVideoResponse> {
  const requestId = prediction.id;

  if (prediction.status === "failed" || prediction.status === "canceled") {
    return {
      videoUrl: "",
      status: "failed",
      requestId,
      error: formatReplicateErrorDetail(prediction.error) || `Replicate prediction ${prediction.status}`,
    };
  }

  if (prediction.status !== "succeeded") {
    return {
      videoUrl: "",
      status: "processing",
      requestId,
      error: `Video generation still ${prediction.status || "processing"}`,
    };
  }

  const outputUrl = extractFirstOutputUrl(prediction.output);
  if (!outputUrl) {
    return {
      videoUrl: "",
      status: "failed",
      requestId,
      error: "Replicate Veo 3 did not return a video URL",
    };
  }

  const videoUrl = persistToStorage
    ? await persistRemoteFile(outputUrl, "generated-videos/veo3-video", "video/mp4", "mp4")
    : outputUrl;

  return {
    videoUrl,
    status: "completed",
    requestId,
  };
}

async function materializeReplicateImagePrediction(
  prediction: ReplicatePrediction,
  persistToStorage = true,
): Promise<ReplicateImageResponse> {
  if (prediction.status === "failed" || prediction.status === "canceled") {
    throw new Error(
      formatReplicateErrorDetail(prediction.error) || `Replicate image prediction ${prediction.status}`,
    );
  }

  if (prediction.status !== "succeeded") {
    throw new Error(`Replicate image generation timeout (last status: ${prediction.status || "processing"})`);
  }

  const outputUrl = extractFirstOutputUrl(prediction.output);
  if (!outputUrl) {
    throw new Error("Replicate Nano Banana 2 did not return an image URL");
  }

  return {
    requestId: prediction.id,
    url: persistToStorage
      ? await persistRemoteFile(outputUrl, "generated/nano-banana-2", "image/png", "png")
      : outputUrl,
  };
}

export async function generateReplicateVeo3Video(
  request: ReplicateVeo3Request,
): Promise<ReplicateVideoResponse> {
  const modelId = resolveModelId(request.modelId || process.env.REPLICATE_VEO3_MODEL, DEFAULT_VEO3_MODEL);
  const duration = resolveVeo3Duration(request.duration);
  const aspectRatio = resolveVeo3AspectRatio(request.aspectRatio);
  const resolution = resolveVeo3Resolution(request.resolution);
  const sourceImageUrl = resolvePublicUrl(request.sourceImageUrl);

  if (request.sourceImageUrl && !sourceImageUrl) {
    console.warn(
      "[Replicate] Source image URL is not publicly reachable. Veo 3 will run without image guidance.",
    );
  }

  const input: Record<string, unknown> = {
    prompt: request.prompt,
    aspect_ratio: aspectRatio,
    duration,
    resolution,
    generate_audio:
      request.generateAudio ?? resolveBooleanEnv("REPLICATE_VEO3_GENERATE_AUDIO", false),
    negative_prompt:
      request.negativePrompt ||
      process.env.REPLICATE_VEO3_NEGATIVE_PROMPT ||
      DEFAULT_VEO3_NEGATIVE_PROMPT,
    ...(sourceImageUrl ? { image: sourceImageUrl } : {}),
    ...(request.seed !== undefined ? { seed: request.seed } : {}),
  };

  console.log("[Replicate] Starting Veo 3 video generation:", {
    modelId,
    prompt: request.prompt.substring(0, 100),
    duration,
    aspectRatio,
    resolution,
    mode: sourceImageUrl ? "image-to-video" : "text-to-video",
  });

  const initialPrediction = await createReplicatePrediction(modelId, input, {
    cancelAfter: process.env.REPLICATE_VEO3_CANCEL_AFTER || "20m",
    syncWaitSeconds: resolveNumberEnv("REPLICATE_SYNC_WAIT_SECONDS", DEFAULT_SYNC_WAIT_SECONDS),
  });
  const prediction = await pollReplicatePrediction(initialPrediction, {
    maxWaitMs: resolveNumberEnv("REPLICATE_VEO3_MAX_WAIT_MS", DEFAULT_VIDEO_MAX_WAIT_MS),
    pollIntervalMs: resolveNumberEnv("REPLICATE_POLL_INTERVAL_MS", DEFAULT_POLL_INTERVAL_MS),
  });

  return materializeReplicateVideoPrediction(prediction, request.persistToStorage ?? true);
}

export async function generateReplicateImage(
  request: ReplicateImageRequest,
): Promise<ReplicateImageResponse> {
  const modelId = resolveModelId(
    request.modelId || process.env.REPLICATE_NANO_BANANA_MODEL,
    DEFAULT_NANO_BANANA_2_MODEL,
  );
  const imageInput = uniquePublicUrls(request.imageInputUrls);
  const aspectRatio = request.aspectRatio || (imageInput.length > 0 ? "match_input_image" : "16:9");
  const resolution = resolveNanoBananaResolution(request.resolution);
  const outputFormat = resolveNanoBananaOutputFormat(request.outputFormat);

  if ((request.imageInputUrls?.length || 0) > imageInput.length) {
    console.warn(
      "[Replicate] Some image references were not publicly reachable and were omitted from Nano Banana 2 input.",
    );
  }

  const input: Record<string, unknown> = {
    prompt: request.prompt,
    image_input: imageInput,
    aspect_ratio: aspectRatio,
    resolution,
    output_format: outputFormat,
    google_search: request.googleSearch ?? resolveBooleanEnv("REPLICATE_NANO_BANANA_GOOGLE_SEARCH", false),
    image_search: request.imageSearch ?? resolveBooleanEnv("REPLICATE_NANO_BANANA_IMAGE_SEARCH", false),
  };

  console.log("[Replicate] Starting Nano Banana 2 image generation:", {
    modelId,
    prompt: request.prompt.substring(0, 100),
    aspectRatio,
    resolution,
    imageReferences: imageInput.length,
  });

  const initialPrediction = await createReplicatePrediction(modelId, input, {
    cancelAfter: process.env.REPLICATE_NANO_BANANA_CANCEL_AFTER || "10m",
    syncWaitSeconds: resolveNumberEnv("REPLICATE_SYNC_WAIT_SECONDS", DEFAULT_SYNC_WAIT_SECONDS),
  });
  const prediction = await pollReplicatePrediction(initialPrediction, {
    maxWaitMs: resolveNumberEnv("REPLICATE_IMAGE_MAX_WAIT_MS", DEFAULT_IMAGE_MAX_WAIT_MS),
    pollIntervalMs: resolveNumberEnv("REPLICATE_POLL_INTERVAL_MS", DEFAULT_POLL_INTERVAL_MS),
  });

  return materializeReplicateImagePrediction(prediction, request.persistToStorage ?? true);
}
