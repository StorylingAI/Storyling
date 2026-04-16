import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { storagePut } from "server/storage";
import { generateVeo3Video } from "./googleVeo3";

vi.mock("server/storage", () => ({
  storagePut: vi.fn(),
}));

describe("Google Veo 3 via Replicate", () => {
  const originalEnv = { ...process.env };
  const mockedStoragePut = vi.mocked(storagePut);

  beforeEach(() => {
    process.env = { ...originalEnv };
    process.env.REPLICATE_API_TOKEN = "r8-test-token";
    delete process.env.REPLICATE_VEO3_RESOLUTION;
    mockedStoragePut.mockResolvedValue({
      key: "generated-videos/test.mp4",
      url: "/uploads/generated-videos/test.mp4",
    });
  });

  afterEach(() => {
    process.env = originalEnv;
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("throws when the Replicate token is missing", async () => {
    delete process.env.REPLICATE_API_TOKEN;

    await expect(
      generateVeo3Video({ prompt: "Test video" }),
    ).rejects.toThrow("REPLICATE_API_TOKEN is not configured");
  });

  it("creates a Veo 3 prediction with optimized Replicate inputs", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        text: async () =>
          JSON.stringify({
            id: "prediction-1",
            status: "succeeded",
            output: "https://replicate.delivery/video.mp4",
          }),
      })
      .mockResolvedValueOnce({
        ok: true,
        headers: { get: () => "video/mp4" },
        arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
      });
    vi.stubGlobal("fetch", fetchMock);

    const result = await generateVeo3Video({
      prompt: "A calm mountain sunrise",
      duration: 10,
      aspectRatio: "16:9",
      sourceImageUrl: "https://example.com/source.png",
      seed: 1234,
    });

    expect(result).toEqual({
      videoUrl: "/uploads/generated-videos/test.mp4",
      status: "completed",
      taskId: "prediction-1",
      error: undefined,
    });

    expect(fetchMock).toHaveBeenCalledWith(
      "https://api.replicate.com/v1/models/google/veo-3-fast/predictions",
      expect.objectContaining({
        method: "POST",
        headers: expect.objectContaining({
          Authorization: "Bearer r8-test-token",
          Prefer: "wait=10",
        }),
      }),
    );

    const createBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    expect(createBody.input).toMatchObject({
      prompt: "A calm mountain sunrise",
      aspect_ratio: "16:9",
      duration: 8,
      resolution: "720p",
      generate_audio: false,
      image: "https://example.com/source.png",
      seed: 1234,
    });
    expect(createBody.input.negative_prompt).toContain("watermarks");
  });
});
