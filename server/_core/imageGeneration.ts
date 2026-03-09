/**
 * Image generation helper using OpenAI DALL-E API
 *
 * Example usage:
 *   const { url: imageUrl } = await generateImage({
 *     prompt: "A serene landscape with mountains"
 *   });
 */
import { storagePut } from "server/storage";

export type GenerateImageOptions = {
  prompt: string;
  originalImages?: Array<{
    url?: string;
    b64Json?: string;
    mimeType?: string;
  }>;
};

export type GenerateImageResponse = {
  url?: string;
};

const resolveApiKey = () => {
  const key = process.env.OPENAI_API_KEY;
  if (!key || key.includes("your_")) {
    throw new Error("OPENAI_API_KEY is not configured. Image generation requires an OpenAI API key.");
  }
  return key;
};

export async function generateImage(
  options: GenerateImageOptions
): Promise<GenerateImageResponse> {
  const apiKey = resolveApiKey();

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
