// Storage abstraction: local filesystem (default) or Manus proxy (if configured)

import fs from "fs";
import path from "path";
import { ENV } from "./_core/env";

const UPLOADS_DIR = process.env.UPLOADS_DIR || path.resolve("uploads");
const BASE_URL = process.env.BASE_URL || "";

// Ensure uploads directory exists
function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function normalizeKey(relKey: string): string {
  return relKey.replace(/^\/+/, "");
}

// ── Manus proxy backend (used inside Manus sandbox) ──

function hasManusCreds(): boolean {
  const url = ENV.forgeApiUrl;
  const key = ENV.forgeApiKey;
  return Boolean(url && key && url.startsWith("http"));
}

async function manusPut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType: string
): Promise<{ key: string; url: string }> {
  const baseUrl = ENV.forgeApiUrl!.replace(/\/+$/, "") + "/";
  const apiKey = ENV.forgeApiKey!;
  const key = normalizeKey(relKey);

  const uploadUrl = new URL("v1/storage/upload", baseUrl);
  uploadUrl.searchParams.set("path", key);

  const blob =
    typeof data === "string"
      ? new Blob([data], { type: contentType })
      : new Blob([data as any], { type: contentType });
  const form = new FormData();
  form.append("file", blob, key.split("/").pop() ?? key);

  const response = await fetch(uploadUrl, {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}` },
    body: form,
  });

  if (!response.ok) {
    const message = await response.text().catch(() => response.statusText);
    throw new Error(`Manus storage upload failed (${response.status}): ${message}`);
  }

  const url = (await response.json()).url;
  return { key, url };
}

async function manusGet(relKey: string): Promise<{ key: string; url: string }> {
  const baseUrl = ENV.forgeApiUrl!.replace(/\/+$/, "") + "/";
  const apiKey = ENV.forgeApiKey!;
  const key = normalizeKey(relKey);

  const downloadUrl = new URL("v1/storage/downloadUrl", baseUrl);
  downloadUrl.searchParams.set("path", key);

  const response = await fetch(downloadUrl, {
    method: "GET",
    headers: { Authorization: `Bearer ${apiKey}` },
  });

  return { key, url: (await response.json()).url };
}

// ── Local filesystem backend ──

async function localPut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  _contentType: string
): Promise<{ key: string; url: string }> {
  ensureUploadsDir();
  const key = normalizeKey(relKey);
  const filePath = path.join(UPLOADS_DIR, key);

  // Ensure subdirectories exist
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }

  const buffer =
    typeof data === "string"
      ? Buffer.from(data)
      : Buffer.isBuffer(data)
        ? data
        : Buffer.from(data);

  fs.writeFileSync(filePath, buffer);

  const url = `${BASE_URL}/uploads/${key}`;
  return { key, url };
}

async function localGet(relKey: string): Promise<{ key: string; url: string }> {
  const key = normalizeKey(relKey);
  return { key, url: `${BASE_URL}/uploads/${key}` };
}

// ── Public API (same interface, auto-selects backend) ──

export async function storagePut(
  relKey: string,
  data: Buffer | Uint8Array | string,
  contentType = "application/octet-stream"
): Promise<{ key: string; url: string }> {
  if (hasManusCreds()) {
    return manusPut(relKey, data, contentType);
  }
  return localPut(relKey, data, contentType);
}

export async function storageGet(
  relKey: string
): Promise<{ key: string; url: string }> {
  if (hasManusCreds()) {
    return manusGet(relKey);
  }
  return localGet(relKey);
}
