import crypto from "crypto";

const KLING_API_BASE = "https://api-singapore.klingai.com";
const ACCESS_KEY = process.env.KLING_ACCESS_KEY || "";
const SECRET_KEY = process.env.KLING_SECRET_KEY || "";

/**
 * Generate JWT token for Kling AI API authentication
 * Following RFC 7519 standard
 */
function generateKlingToken(): string {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };

  const payload = {
    iss: ACCESS_KEY,
    exp: Math.floor(Date.now() / 1000) + 1800, // 30 minutes expiry
    nbf: Math.floor(Date.now() / 1000) - 5, // Valid from 5 seconds ago
  };

  const base64Header = Buffer.from(JSON.stringify(header)).toString("base64url");
  const base64Payload = Buffer.from(JSON.stringify(payload)).toString("base64url");

  const signature = crypto
    .createHmac("sha256", SECRET_KEY)
    .update(`${base64Header}.${base64Payload}`)
    .digest("base64url");

  return `${base64Header}.${base64Payload}.${signature}`;
}

/**
 * Create a text-to-video generation task
 */
export async function createVideoTask(prompt: string): Promise<{ taskId: string }> {
  const token = generateKlingToken();

  const response = await fetch(`${KLING_API_BASE}/v1/videos/text2video`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({
      model_name: "kling-v1", // Using v1 for stability
      prompt: prompt.substring(0, 2500), // Max 2500 characters
      mode: "std", // Standard mode for cost-effectiveness
      aspect_ratio: "16:9",
      duration: "5", // 5 seconds
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Kling API error: ${response.status} ${errorText}`);
  }

  const result = await response.json();

  if (result.code !== 0) {
    throw new Error(`Kling API error: ${result.message}`);
  }

  return {
    taskId: result.data.task_id,
  };
}

/**
 * Query video task status
 */
export async function queryVideoTask(taskId: string): Promise<{
  status: "submitted" | "processing" | "succeed" | "failed";
  videoUrl?: string;
  errorMessage?: string;
}> {
  const token = generateKlingToken();

  const response = await fetch(`${KLING_API_BASE}/v1/videos/text2video/${taskId}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Kling API error: ${response.status} ${errorText}`);
  }

  const result = await response.json();

  if (result.code !== 0) {
    throw new Error(`Kling API error: ${result.message}`);
  }

  const data = result.data;
  const status = data.task_status;

  if (status === "succeed" && data.task_result?.videos?.[0]?.url) {
    return {
      status: "succeed",
      videoUrl: data.task_result.videos[0].url,
    };
  }

  if (status === "failed") {
    return {
      status: "failed",
      errorMessage: data.task_result?.error || "Video generation failed",
    };
  }

  return {
    status: status as "submitted" | "processing",
  };
}

/**
 * Poll video task until completion (with timeout)
 */
export async function waitForVideoCompletion(
  taskId: string,
  maxWaitMs: number = 300000 // 5 minutes default
): Promise<string> {
  const startTime = Date.now();
  const pollInterval = 5000; // 5 seconds

  while (Date.now() - startTime < maxWaitMs) {
    const result = await queryVideoTask(taskId);

    if (result.status === "succeed" && result.videoUrl) {
      return result.videoUrl;
    }

    if (result.status === "failed") {
      throw new Error(result.errorMessage || "Video generation failed");
    }

    // Wait before next poll
    await new Promise((resolve) => setTimeout(resolve, pollInterval));
  }

  throw new Error("Video generation timeout");
}
