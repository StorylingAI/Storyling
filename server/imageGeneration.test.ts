import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { storagePut } from "server/storage";
import { generateImage } from "./_core/imageGeneration";

vi.mock("server/storage", () => ({
  storagePut: vi.fn(),
}));

describe("generateImage OpenAI aspect ratio handling", () => {
  const originalEnv = { ...process.env };
  const mockedStoragePut = vi.mocked(storagePut);

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.IMAGE_PROVIDER = "openai";
    process.env.OPENAI_API_KEY = "sk-test";
    process.env.IMAGE_MODEL = "dall-e-3";
    mockedStoragePut.mockResolvedValue({
      key: "generated/test.png",
      url: "/uploads/generated/test.png",
    });
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          data: [{ b64_json: Buffer.from("image-bytes").toString("base64") }],
        }),
      })
    );
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("uses a landscape OpenAI image size for 16:9 requests", async () => {
    await generateImage({
      prompt: "A finished animation keyframe for a story video",
      aspectRatio: "16:9",
    });

    const fetchMock = vi.mocked(fetch);
    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(requestInit.body));

    expect(body.size).toBe("1792x1024");
  });

  it("keeps square OpenAI image size for explicit 1:1 requests", async () => {
    await generateImage({
      prompt: "A square avatar",
      aspectRatio: "1:1",
    });

    const fetchMock = vi.mocked(fetch);
    const requestInit = fetchMock.mock.calls[0]?.[1] as RequestInit;
    const body = JSON.parse(String(requestInit.body));

    expect(body.size).toBe("1024x1024");
  });

  it("uses Replicate Nano Banana 2 when IMAGE_PROVIDER is replicate", async () => {
    process.env.IMAGE_PROVIDER = "replicate";
    process.env.REPLICATE_API_TOKEN = "r8-test-token";
    process.env.REPLICATE_NANO_BANANA_RESOLUTION = "2K";

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            id: "image-prediction-1",
            status: "succeeded",
            output: "https://replicate.delivery/image.png",
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "image/png" },
        arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
      });
    vi.stubGlobal("fetch", fetchMock);

    await generateImage({
      prompt: "A finished animation keyframe for a story video",
      aspectRatio: "16:9",
      originalImages: [{ url: "https://example.com/reference.png" }],
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.replicate.com/v1/models/google/nano-banana-2/predictions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer r8-test-token",
        }),
      }),
    );

    const body = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(body.input).toMatchObject({
      prompt: "A finished animation keyframe for a story video",
      image_input: ["https://example.com/reference.png"],
      aspect_ratio: "16:9",
      resolution: "2K",
      output_format: "png",
      google_search: false,
      image_search: false,
    });
    expect(mockedStoragePut).toHaveBeenCalledWith(
      expect.stringContaining("generated/nano-banana-2-"),
      expect.any(Buffer),
      "image/png",
    );
  });
});
