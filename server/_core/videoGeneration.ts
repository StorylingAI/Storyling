import { generateReplicateVeo3Video } from "../replicateGeneration";

export type GenerateVideoOptions = {
  prompt: string;
  duration?: number;
  aspectRatio?: "16:9" | "9:16" | "1:1";
  model?: "standard" | "pro";
  seed?: number;
  persistToStorage?: boolean;
  sourceImageUrl?: string;
  referenceImageUrls?: string[];
  generateAudio?: boolean;
  negativePrompt?: string;
};

export type GenerateVideoResponse = {
  videoUrl: string;
  status: "completed" | "processing" | "failed";
  requestId?: string;
  error?: string;
};

export type VideoProvider = "replicate" | "higgsfield";

export function resolveVideoProvider(): VideoProvider {
  const provider = (
    process.env.VIDEO_PROVIDER ||
    process.env.FILM_VIDEO_PROVIDER ||
    "replicate"
  ).trim().toLowerCase();

  if (provider === "higgsfield") {
    return "higgsfield";
  }

  if (
    provider === "replicate" ||
    provider === "replicate-veo3" ||
    provider === "veo" ||
    provider === "veo3" ||
    provider === "veo-3" ||
    provider === "google" ||
    provider === "google-veo3" ||
    provider === "google-veo-3"
  ) {
    return "replicate";
  }

  throw new Error(
    `Unsupported VIDEO_PROVIDER "${provider}". Use "replicate", "veo3", or "higgsfield".`,
  );
}

export async function generateVideo(
  options: GenerateVideoOptions,
): Promise<GenerateVideoResponse> {
  const provider = resolveVideoProvider();

  if (provider === "higgsfield") {
    const { generateHiggsfieldVideo } = await import("../higgsfield");
    return generateHiggsfieldVideo(options);
  }

  return generateReplicateVeo3Video({
    prompt: options.prompt,
    duration: options.duration,
    aspectRatio: options.aspectRatio,
    seed: options.seed,
    persistToStorage: options.persistToStorage,
    sourceImageUrl: options.sourceImageUrl,
    generateAudio: options.generateAudio,
    negativePrompt: options.negativePrompt,
  });
}
