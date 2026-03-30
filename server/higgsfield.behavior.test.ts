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
      expect.stringContaining("/higgsfield-ai/soul/standard"),
      expect.any(Object),
      expect.any(Object),
    );
    expect(axiosPost).toHaveBeenNthCalledWith(
      2,
      expect.stringContaining("/higgsfield-ai/soul/standard"),
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
