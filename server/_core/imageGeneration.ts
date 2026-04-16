/**
 * Image generation helper.
 * Defaults to Higgsfield when Higgsfield credentials are configured, so story
 * images can use the same paid Higgsfield account as video generation.
 * Use IMAGE_PROVIDER=gemini or IMAGE_PROVIDER=openai to force another backend.
 */
import { storagePut } from "server/storage";
import { generateHiggsfieldImage } from "../higgsfield";

export type GenerateImageOptions = {
  prompt: string;
  aspectRatio?: string;
  imageSize?: "1K" | "2K" | "4K";
  seed?: number;
  originalImages?: Array<{
    url?: string;
    b64Json?: string;
    mimeType?: string;
  }>;
};

export type GenerateImageResponse = {
  url?: string;
};

const GEMINI_NANO_BANANA_2_MODEL = "gemini-3.1-flash-image-preview";
const HIGGSFIELD_TEXT_IMAGE_MODEL = "bytedance/seedream/v4/text-to-image";
const HIGGSFIELD_REFERENCE_IMAGE_MODEL = "bytedance/seedream/v4/edit";
const HIGGSFIELD_IMAGE_FALLBACK_MODELS = [
  "reve/text-to-image",
  "higgsfield-ai/soul/standard",
];

const resolveOpenAiApiKey = () => {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key.includes("your_")) {
    throw new Error("OPENAI_API_KEY is not configured. Image generation requires an OpenAI API key.");
  }
  return key;
};

const resolveGeminiApiKey = () => {
  const key =
    process.env.GEMINI_API_KEY ||
    process.env.GOOGLE_CLOUD_API_KEY ||
    process.env.GOOGLE_VEO_API_KEY;
  if (!key || key.includes("your_")) {
    throw new Error("GEMINI_API_KEY is not configured. Nano Banana 2 image generation requires a Google API key.");
  }
  return key;
};

function hasConfiguredValue(value?: string): boolean {
  return Boolean(value && !value.includes("your_"));
}

function hasConfiguredHiggsfieldCredentials(): boolean {
  return (
    hasConfiguredValue(process.env.HIGGSFIELD_API_KEY_ID) &&
    hasConfiguredValue(process.env.HIGGSFIELD_API_KEY_SECRET)
  );
}

function extensionForMimeType(mimeType?: string): string {
  if (mimeType?.includes("jpeg") || mimeType?.includes("jpg")) return "jpg";
  if (mimeType?.includes("webp")) return "webp";
  return "png";
}

async function persistRemoteImage(
  imageUrl: string,
  storageNamePrefix: string
): Promise<GenerateImageResponse> {
  try {
    const response = await fetch(imageUrl);
    if (!response.ok) {
      console.warn(
        `[ImageGeneration] Failed to persist provider image (${response.status} ${response.statusText}), using provider URL`
      );
      return { url: imageUrl };
    }

    const contentType = response.headers.get("content-type")?.split(";")[0] || "image/png";
    const mimeType = contentType.startsWith("image/") ? contentType : "image/png";
    const buffer = Buffer.from(await response.arrayBuffer());
    const extension = extensionForMimeType(mimeType);
    const { url } = await storagePut(
      `generated/${storageNamePrefix}-${Date.now()}.${extension}`,
      buffer,
      mimeType
    );
    return { url };
  } catch (error) {
    console.warn("[ImageGeneration] Failed to persist provider image, using provider URL", error);
    return { url: imageUrl };
  }
}

function resolveOriginalImageUrls(
  originalImages: GenerateImageOptions["originalImages"] = []
): string[] {
  return originalImages
    .map(image => image.url?.trim())
    .filter((url): url is string => Boolean(url))
    .slice(0, 14);
}

function resolveCsvValues(value?: string): string[] {
  return (value || "")
    .split(",")
    .map(item => item.trim())
    .filter(Boolean);
}

function resolveHiggsfieldImageResolution(imageSize?: GenerateImageOptions["imageSize"]): string {
  const configured = process.env.HIGGSFIELD_IMAGE_RESOLUTION?.trim();
  if (configured && configured !== "1K" && configured !== "720p" && configured !== "1080p") {
    return configured;
  }
  return imageSize === "4K" ? "4K" : "2K";
}

async function resolveOriginalImageParts(
  originalImages: GenerateImageOptions["originalImages"] = []
) {
  const imageParts = [];

  for (const image of originalImages.slice(0, 14)) {
    let data = image.b64Json;
    let mimeType = image.mimeType || "image/png";

    if (!data && image.url) {
      const response = await fetch(image.url);
      if (!response.ok) {
        throw new Error(
          `Failed to fetch image reference (${response.status} ${response.statusText})`
        );
      }

      const contentType = response.headers.get("content-type");
      if (contentType?.startsWith("image/")) {
        mimeType = contentType.split(";")[0];
      }

      const buffer = Buffer.from(await response.arrayBuffer());
      data = buffer.toString("base64");
    }

    if (!data) continue;

    imageParts.push({
      inline_data: {
        mime_type: mimeType,
        data,
      },
    });
  }

  return imageParts;
}

async function generateImageWithGemini(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  const apiKey = resolveGeminiApiKey();
  const model = process.env.GEMINI_IMAGE_MODEL || GEMINI_NANO_BANANA_2_MODEL;
  const imageParts = await resolveOriginalImageParts(options.originalImages);

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-goog-api-key": apiKey,
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [{ text: options.prompt }, ...imageParts],
          },
        ],
        generationConfig: {
          responseModalities: ["TEXT", "IMAGE"],
          imageConfig: {
            aspectRatio: options.aspectRatio || "16:9",
            imageSize: options.imageSize || "1K",
          },
        },
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    throw new Error(
      `Nano Banana 2 image generation failed (${response.status} ${response.statusText}): ${errorText}`
    );
  }

  const result = (await response.json()) as {
    candidates?: Array<{
      content?: {
        parts?: Array<{
          inlineData?: { data?: string; mimeType?: string };
          inline_data?: { data?: string; mime_type?: string };
        }>;
      };
    }>;
  };

  const parts = result.candidates?.flatMap(candidate => candidate.content?.parts ?? []) ?? [];
  const imagePart = parts.find(part => part.inlineData?.data || part.inline_data?.data);
  const inlineData = imagePart?.inlineData;
  const inlineDataSnake = imagePart?.inline_data;
  const imageBase64 = inlineData?.data || inlineDataSnake?.data;
  const mimeType = inlineData?.mimeType || inlineDataSnake?.mime_type || "image/png";

  if (!imageBase64) {
    throw new Error("Nano Banana 2 did not return image data");
  }

  const buffer = Buffer.from(imageBase64, "base64");
  const extension = extensionForMimeType(mimeType);
  const { url } = await storagePut(
    `generated/nano-banana-2-${Date.now()}.${extension}`,
    buffer,
    mimeType
  );
  return { url };
}

async function generateImageWithHiggsfield(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  if (!hasConfiguredHiggsfieldCredentials()) {
    throw new Error(
      "HIGGSFIELD_API_KEY_ID and HIGGSFIELD_API_KEY_SECRET are not configured. Higgsfield image generation requires both credentials."
    );
  }

  const referenceImageUrls = resolveOriginalImageUrls(options.originalImages);
  const modelId =
    referenceImageUrls.length > 0
      ? process.env.HIGGSFIELD_IMAGE_REFERENCE_MODEL_ID ||
        process.env.HIGGSFIELD_IMAGE_MODEL_ID ||
        HIGGSFIELD_REFERENCE_IMAGE_MODEL
      : process.env.HIGGSFIELD_IMAGE_MODEL_ID || HIGGSFIELD_TEXT_IMAGE_MODEL;
  const fallbackModelIds = [
    ...resolveCsvValues(process.env.HIGGSFIELD_IMAGE_FALLBACK_MODEL_IDS),
    ...(referenceImageUrls.length > 0 ? [HIGGSFIELD_TEXT_IMAGE_MODEL] : []),
    ...HIGGSFIELD_IMAGE_FALLBACK_MODELS,
  ];
  const resolution = resolveHiggsfieldImageResolution(options.imageSize);

  const result = await generateHiggsfieldImage({
    prompt: options.prompt,
    aspectRatio: options.aspectRatio || "16:9",
    resolution,
    seed: options.seed,
    modelId,
    fallbackModelIds,
    referenceImageUrls,
  });

  return persistRemoteImage(result.imageUrl, "higgsfield-nano-banana-2");
}

async function generateImageWithOpenAI(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  const apiKey = resolveOpenAiApiKey();

  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: process.env.IMAGE_MODEL || "dall-e-3",
      prompt: options.prompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text().catch(() => "");
    const status = response.status;

    // User-friendly error messages
    if (status === 401) {
      throw new Error("OpenAI API key is invalid. Please check your OPENAI_API_KEY.");
    }
    if (status === 429) {
      throw new Error("OpenAI rate limit reached or insufficient credits. Please try again later or add credits to your OpenAI account.");
    }
    if (status === 400 && errorText.includes("safety")) {
      throw new Error("Image generation was blocked by content safety filters. Please try a different prompt.");
    }

    throw new Error(
      `Image generation failed (${status} ${response.statusText}): ${errorText}`
    );
  }

  const result = (await response.json()) as {
    data: Array<{
      b64_json?: string;
      url?: string;
    }>;
  };

  const imageData = result.data?.[0];
  if (!imageData) {
    throw new Error("No image was generated");
  }

  // If we got base64 data, save to storage
  if (imageData.b64_json) {
    const buffer = Buffer.from(imageData.b64_json, "base64");
    const { url } = await storagePut(
      `generated/${Date.now()}.png`,
      buffer,
      "image/png"
    );
    return { url };
  }

  // If we got a URL directly
  return { url: imageData.url };
}

export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  const provider = process.env.IMAGE_PROVIDER?.trim().toLowerCase();

  if (provider === "openai") {
    return generateImageWithOpenAI(options);
  }

  if (provider === "gemini") {
    return generateImageWithGemini(options);
  }

  if (provider === "higgsfield") {
    return generateImageWithHiggsfield(options);
  }

  if (provider && provider !== "auto") {
    throw new Error(
      `Unsupported IMAGE_PROVIDER "${process.env.IMAGE_PROVIDER}". Use "higgsfield", "gemini", "openai", or "auto".`
    );
  }

  if (hasConfiguredHiggsfieldCredentials()) {
    return generateImageWithHiggsfield(options);
  }

  return generateImageWithGemini(options);
}
