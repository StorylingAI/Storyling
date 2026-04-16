import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const axiosPost = vi.fn();
const axiosGet = vi.fn();
const storagePutMock = vi.fn();

vi.mock("axios", () => ({
  default: {
    post: axiosPost,
    get: axiosGet,
  },
}));

vi.mock("./storage", () => ({
  storagePut: storagePutMock,
}));

describe("generateHiggsfieldVideo storage behavior", () => {
  beforeEach(() => {
    vi.resetModules();
    vi.clearAllMocks();
    vi.useFakeTimers();
    process.env.HIGGSFIELD_API_KEY_ID = "123e4567-e89b-12d3-a456-426614174000";
    process.env.HIGGSFIELD_API_KEY_SECRET = "a".repeat(64);
    delete process.env.HIGGSFIELD_IMAGE_REFERENCE_FIELD;
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("should keep the provider video URL when persistToStorage is false", async () => {
    axiosPost
      .mockResolvedValueOnce({ data: { request_id: "image-req" } })
      .mockResolvedValueOnce({ data: { request_id: "video-req" } });

    axiosGet
      .mockResolvedValueOnce({
        data: {
          status: "completed",
          images: [{ url: "https://cloud.example.com/generated-image.png" }],
        },
      })
      .mockResolvedValueOnce({
        data: {
          status: "completed",
          video: { url: "https://cloud.example.com/generated-video.mp4" },
        },
      });

    const { generateHiggsfieldVideo } = await import("./higgsfield");

    const resultPromise = generateHiggsfieldVideo({
      prompt: "A calm mountain sunrise",
      persistToStorage: false,
    });

    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result).toEqual({
      videoUrl: "https://cloud.example.com/generated-video.mp4",
      status: "completed",
      requestId: "video-req",
    });
    expect(storagePutMock).not.toHaveBeenCalled();
    expect(axiosGet).toHaveBeenCalledTimes(2);
    expect(axiosPost).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("/bytedance/seedream/v4/text-to-image"),
      expect.objectContaining({
        resolution: "2K",
        camera_fixed: false,
      }),
      expect.any(Object),
    );
  });

  it("should ignore extra character reference images because DoP accepts a single input image", async () => {
    axiosPost
      .mockResolvedValueOnce({ data: { request_id: "image-req" } })
      .mockResolvedValueOnce({ data: { request_id: "video-req" } });

    axiosGet
      .mockResolvedValueOnce({
        data: {
          status: "completed",
          images: [{ url: "https://cloud.example.com/generated-image.png" }],
        },
      })
      .mockResolvedValueOnce({
        data: {
          status: "completed",
          video: { url: "https://cloud.example.com/generated-video.mp4" },
        },
      });

    const { generateHiggsfieldVideo } = await import("./higgsfield");

    const resultPromise = generateHiggsfieldVideo({
      prompt: "A hiker reading a map in the snow",
      persistToStorage: false,
      referenceImageUrls: [
        "https://cloud.example.com/character-ref.png",
        "https://cloud.example.com/character-ref.png",
        "https://cloud.example.com/secondary-ref.png",
      ],
    });

    await vi.runAllTimersAsync();
    await resultPromise;

    expect(axiosPost).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/v1/image2video/dop"),
      expect.objectContaining({
        params: expect.objectContaining({
          input_images: [
            { type: "image_url", image_url: "https://cloud.example.com/generated-image.png" },
          ],
        }),
      }),
      expect.any(Object),
    );
  });

  it("should fall back when a configured image model is not exposed by the Higgsfield API", async () => {
    process.env.HIGGSFIELD_IMAGE_REFERENCE_FIELD = "image_urls";

    axiosPost
      .mockRejectedValueOnce({
        response: {
          status: 404,
          data: { detail: "Model not found" },
        },
      })
      .mockResolvedValueOnce({ data: { request_id: "image-req" } });
    axiosGet.mockResolvedValueOnce({
      data: {
        status: "completed",
        images: [{ url: "https://cloud.example.com/fallback-image.png" }],
      },
    });

    const { generateHiggsfieldImage } = await import("./higgsfield");

    const resultPromise = generateHiggsfieldImage({
      prompt: "Pixar-like young fox character in a meadow",
      modelId: "/nano-banana-2",
      fallbackModelIds: ["bytedance/seedream/v4/edit"],
      resolution: "2K",
      aspectRatio: "16:9",
      referenceImageUrls: [
        "https://cloud.example.com/character-ref.png",
        "https://cloud.example.com/previous-scene.png",
      ],
    });

    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result).toEqual({
      imageUrl: "https://cloud.example.com/fallback-image.png",
      requestId: "image-req",
    });
    expect(axiosPost).toHaveBeenNthCalledWith(
      1,
      "https://platform.higgsfield.ai/nano-banana-2",
      expect.any(Object),
      expect.any(Object),
    );
    expect(axiosPost).toHaveBeenNthCalledWith(
      2,
      "https://platform.higgsfield.ai/bytedance/seedream/v4/edit",
      expect.objectContaining({
        prompt: "Pixar-like young fox character in a meadow",
        aspect_ratio: "16:9",
        resolution: "2K",
        camera_fixed: false,
        image_urls: [
          "https://cloud.example.com/character-ref.png",
          "https://cloud.example.com/previous-scene.png",
        ],
      }),
      expect.any(Object),
    );
  });

  it("should try the next image model when a model rejects its payload", async () => {
    axiosPost
      .mockRejectedValueOnce({
        response: {
          status: 422,
          statusText: "Unprocessable Entity",
          data: { detail: "Invalid request parameters" },
        },
      })
      .mockResolvedValueOnce({ data: { request_id: "fallback-image-req" } });
    axiosGet.mockResolvedValueOnce({
      data: {
        status: "completed",
        images: [{ url: "https://cloud.example.com/reve-image.png" }],
      },
    });

    const { generateHiggsfieldImage } = await import("./higgsfield");

    const resultPromise = generateHiggsfieldImage({
      prompt: "A warm animated forest path",
      modelId: "bytedance/seedream/v4/text-to-image",
      fallbackModelIds: ["reve/text-to-image"],
      resolution: "2K",
      aspectRatio: "16:9",
    });

    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.imageUrl).toBe("https://cloud.example.com/reve-image.png");
    expect(axiosPost).toHaveBeenNthCalledWith(
      1,
      "https://platform.higgsfield.ai/bytedance/seedream/v4/text-to-image",
      expect.objectContaining({
        prompt: "A warm animated forest path",
        camera_fixed: false,
      }),
      expect.any(Object),
    );
    expect(axiosPost).toHaveBeenNthCalledWith(
      2,
      "https://platform.higgsfield.ai/reve/text-to-image",
      expect.objectContaining({
        prompt: "A warm animated forest path",
      }),
      expect.any(Object),
    );
  });

  it("should try the next accepted image model when a submitted image job fails", async () => {
    axiosPost
      .mockResolvedValueOnce({ data: { request_id: "reve-image-req" } })
      .mockResolvedValueOnce({ data: { request_id: "soul-image-req" } });

    axiosGet.mockImplementation(async (url: string) => {
      if (url.includes("/requests/reve-image-req/status")) {
        return {
          data: {
            status: "failed",
            error: "Generation failed",
          },
        };
      }

      if (url.includes("/requests/soul-image-req/status")) {
        return {
          data: {
            status: "completed",
            images: [{ url: "https://cloud.example.com/soul-image.png" }],
          },
        };
      }

      throw new Error(`Unexpected GET ${url}`);
    });

    const { generateHiggsfieldImage } = await import("./higgsfield");

    const resultPromise = generateHiggsfieldImage({
      prompt: "A cheerful animated woodland picnic",
      modelId: "reve/text-to-image",
      fallbackModelIds: ["higgsfield-ai/soul/standard"],
      resolution: "2K",
      aspectRatio: "16:9",
    });

    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result).toEqual({
      imageUrl: "https://cloud.example.com/soul-image.png",
      requestId: "soul-image-req",
    });
    expect(axiosPost).toHaveBeenNthCalledWith(
      1,
      "https://platform.higgsfield.ai/reve/text-to-image",
      expect.objectContaining({
        resolution: "2K",
      }),
      expect.any(Object),
    );
    expect(axiosPost).toHaveBeenNthCalledWith(
      2,
      "https://platform.higgsfield.ai/higgsfield-ai/soul/standard",
      expect.objectContaining({
        resolution: "1080p",
      }),
      expect.any(Object),
    );
  });

  it("should not retry request-rejected image models after an accepted model fails", async () => {
    axiosPost
      .mockRejectedValueOnce({
        response: {
          status: 400,
          statusText: "Bad Request",
          data: { detail: "resolution: '1K' is not one of ['2K', '4K']" },
        },
      })
      .mockRejectedValueOnce({
        response: {
          status: 400,
          statusText: "Bad Request",
          data: { detail: "resolution: '1K' is not one of ['2K', '4K']" },
        },
      })
      .mockResolvedValueOnce({ data: { request_id: "reve-image-req" } })
      .mockResolvedValueOnce({ data: { request_id: "soul-image-req" } });

    axiosGet.mockImplementation(async (url: string) => {
      if (url.includes("/requests/reve-image-req/status")) {
        return {
          data: {
            status: "failed",
            error: "Generation failed",
          },
        };
      }

      if (url.includes("/requests/soul-image-req/status")) {
        return {
          data: {
            status: "completed",
            images: [{ url: "https://cloud.example.com/soul-image.png" }],
          },
        };
      }

      throw new Error(`Unexpected GET ${url}`);
    });

    const { generateHiggsfieldImage } = await import("./higgsfield");

    const resultPromise = generateHiggsfieldImage({
      prompt: "A finished animation keyframe in a tranquil forest",
      modelId: "bytedance/seedream/v4/edit",
      fallbackModelIds: [
        "bytedance/seedream/v4/text-to-image",
        "reve/text-to-image",
        "higgsfield-ai/soul/standard",
      ],
      resolution: "1K",
      aspectRatio: "16:9",
      referenceImageUrls: [
        "https://cloud.example.com/character-ref.png",
        "https://cloud.example.com/previous-scene.png",
      ],
    });

    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result.imageUrl).toBe("https://cloud.example.com/soul-image.png");
    expect(axiosPost).toHaveBeenCalledTimes(4);
    expect(axiosPost).toHaveBeenNthCalledWith(
      1,
      "https://platform.higgsfield.ai/bytedance/seedream/v4/edit",
      expect.objectContaining({
        resolution: "2K",
      }),
      expect.any(Object),
    );
    expect(axiosPost).toHaveBeenNthCalledWith(
      2,
      "https://platform.higgsfield.ai/bytedance/seedream/v4/text-to-image",
      expect.objectContaining({
        resolution: "2K",
      }),
      expect.any(Object),
    );
    expect(axiosPost).toHaveBeenNthCalledWith(
      3,
      "https://platform.higgsfield.ai/reve/text-to-image",
      expect.objectContaining({
        resolution: "2K",
      }),
      expect.any(Object),
    );
    expect(axiosPost).toHaveBeenNthCalledWith(
      4,
      "https://platform.higgsfield.ai/higgsfield-ai/soul/standard",
      expect.objectContaining({
        resolution: "1080p",
      }),
      expect.any(Object),
    );
  });

  it("should resubmit the image request once when the provider queue stays stuck", async () => {
    axiosPost
      .mockResolvedValueOnce({ data: { request_id: "image-req-1" } })
      .mockResolvedValueOnce({ data: { request_id: "image-req-2" } })
      .mockResolvedValueOnce({ data: { request_id: "video-req" } });

    let firstImagePollCount = 0;

    axiosGet.mockImplementation(async (url: string) => {
      if (url.includes("/requests/image-req-1/status")) {
        firstImagePollCount++;
        return { data: { status: "queued" } };
      }

      if (url.includes("/requests/image-req-2/status")) {
        return {
          data: {
            status: "completed",
            images: [{ url: "https://cloud.example.com/generated-image-2.png" }],
          },
        };
      }

      if (url.includes("/requests/video-req/status")) {
        return {
          data: {
            status: "completed",
            video: { url: "https://cloud.example.com/generated-video.mp4" },
          },
        };
      }

      throw new Error(`Unexpected GET ${url}`);
    });

    const { generateHiggsfieldVideo } = await import("./higgsfield");

    const resultPromise = generateHiggsfieldVideo({
      prompt: "A hiker arriving near a mountain hut",
      persistToStorage: false,
    });

    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result).toEqual({
      videoUrl: "https://cloud.example.com/generated-video.mp4",
      status: "completed",
      requestId: "video-req",
    });
    expect(firstImagePollCount).toBeGreaterThanOrEqual(75);
    expect(axiosPost).toHaveBeenNthCalledWith(
      1,
      expect.stringContaining("/bytedance/seedream/v4/text-to-image"),
      expect.any(Object),
      expect.any(Object),
    );
    expect(axiosPost).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/bytedance/seedream/v4/text-to-image"),
      expect.any(Object),
      expect.any(Object),
    );
    expect(axiosPost).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("/v1/image2video/dop"),
      expect.any(Object),
      expect.any(Object),
    );
  });

  it("should resubmit the video request once when the DoP job stays stuck", async () => {
    axiosPost
      .mockResolvedValueOnce({ data: { request_id: "image-req" } })
      .mockResolvedValueOnce({ data: { request_id: "video-req-1" } })
      .mockResolvedValueOnce({ data: { request_id: "video-req-2" } });

    let firstVideoPollCount = 0;

    axiosGet.mockImplementation(async (url: string) => {
      if (url.includes("/requests/image-req/status")) {
        return {
          data: {
            status: "completed",
            images: [{ url: "https://cloud.example.com/generated-image.png" }],
          },
        };
      }

      if (url.includes("/requests/video-req-1/status")) {
        firstVideoPollCount++;
        return { data: { status: "in_progress" } };
      }

      if (url.includes("/requests/video-req-2/status")) {
        return {
          data: {
            status: "completed",
            video: { url: "https://cloud.example.com/generated-video.mp4" },
          },
        };
      }

      throw new Error(`Unexpected GET ${url}`);
    });

    const { generateHiggsfieldVideo } = await import("./higgsfield");

    const resultPromise = generateHiggsfieldVideo({
      prompt: "A slow dolly shot inside a cozy mountain chalet",
      persistToStorage: false,
    });

    await vi.runAllTimersAsync();
    const result = await resultPromise;

    expect(result).toEqual({
      videoUrl: "https://cloud.example.com/generated-video.mp4",
      status: "completed",
      requestId: "video-req-2",
    });
    expect(firstVideoPollCount).toBeGreaterThanOrEqual(60);
    expect(axiosPost).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/v1/image2video/dop"),
      expect.any(Object),
      expect.any(Object),
    );
    expect(axiosPost).toHaveBeenNthCalledWith(
      3,
      expect.stringContaining("/v1/image2video/dop"),
      expect.any(Object),
      expect.any(Object),
    );
  });
});
