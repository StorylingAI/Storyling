import { createReadStream } from "fs";
import fs from "fs/promises";
import http from "http";
import os from "os";
import path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import { describe, expect, it } from "vitest";
import { stitchVideos } from "./videoStitching";

const execAsync = promisify(exec);

async function createColorClip(filePath: string, color: string, duration: number) {
  await execAsync(
    `ffmpeg -loglevel error -y -f lavfi -i color=c=${color}:s=320x240:d=${duration} -f lavfi -i anullsrc=r=44100:cl=stereo -shortest -c:v libx264 -pix_fmt yuv420p -c:a aac "${filePath}"`,
  );
}

async function createToneAudio(filePath: string, frequency: number, duration: number) {
  await execAsync(
    `ffmpeg -loglevel error -y -f lavfi -i sine=frequency=${frequency}:duration=${duration} -c:a libmp3lame "${filePath}"`,
  );
}

async function getDuration(filePath: string): Promise<number> {
  const { stdout } = await execAsync(
    `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${filePath}"`,
  );
  return parseFloat(stdout.trim());
}

async function hasAudioStream(filePath: string): Promise<boolean> {
  const { stdout } = await execAsync(
    `ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "${filePath}"`,
  );
  return stdout.trim().length > 0;
}

function toUploadedFilePath(videoUrl: string): string {
  const match = videoUrl.match(/\/uploads\/(.+)$/);
  expect(match).toBeTruthy();
  return path.resolve("uploads", match![1]);
}

describe("Video pipeline integration", () => {
  it("should stitch multiple clips with narration, music and subtitles locally", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "video-pipeline-"));
    const clip1 = path.join(tempDir, "clip1.mp4");
    const clip2 = path.join(tempDir, "clip2.mp4");
    const narration = path.join(tempDir, "narration.mp3");
    const music = path.join(tempDir, "music.mp3");

    await createColorClip(clip1, "red", 2);
    await createColorClip(clip2, "blue", 2);
    await createToneAudio(narration, 880, 3.2);
    await createToneAudio(music, 440, 4);

    const server = http.createServer((req, res) => {
      const fileMap: Record<string, string> = {
        "/clip1.mp4": clip1,
        "/clip2.mp4": clip2,
        "/narration.mp3": narration,
        "/music.mp3": music,
      };

      const filePath = fileMap[req.url || ""];
      if (!filePath) {
        res.statusCode = 404;
        res.end("not found");
        return;
      }

      createReadStream(filePath).pipe(res);
    });

    await new Promise<void>((resolve) => server.listen(32125, "127.0.0.1", () => resolve()));

    let uploadedPath: string | undefined;

    try {
      const result = await stitchVideos(
        [
          { url: "http://127.0.0.1:32125/clip1.mp4", order: 0, duration: 2 },
          { url: "http://127.0.0.1:32125/clip2.mp4", order: 1, duration: 2 },
        ],
        {
          outputFormat: "mp4",
          resolution: "720p",
          fps: 30,
          backgroundMusic: "calm",
          selectedMusicTrack: "http://127.0.0.1:32125/music.mp3",
          addSubtitles: true,
          sceneTexts: [
            "Short opening scene.",
            "This second scene carries more words and should stay visible longer than the first one.",
          ],
          clipDuration: 2,
          targetDuration: 6,
          narrationAudioUrl: "http://127.0.0.1:32125/narration.mp3",
        },
      );

      uploadedPath = toUploadedFilePath(result.videoUrl);
      const stats = await fs.stat(uploadedPath);
      const duration = await getDuration(uploadedPath);

      expect(stats.size).toBeGreaterThan(0);
      expect(duration).toBeGreaterThan(5.7);
      expect(duration).toBeLessThan(6.4);
      expect(await hasAudioStream(uploadedPath)).toBe(true);
      expect(result.clipCount).toBe(2);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      if (uploadedPath) {
        await fs.unlink(uploadedPath).catch(() => {});
      }
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }, 60000);

  it("should post-process a single clip when narration/subtitles are requested", async () => {
    const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), "video-single-pipeline-"));
    const clip = path.join(tempDir, "clip.mp4");
    const narration = path.join(tempDir, "narration.mp3");

    await createColorClip(clip, "green", 2);
    await createToneAudio(narration, 720, 1.4);

    const server = http.createServer((req, res) => {
      const fileMap: Record<string, string> = {
        "/clip.mp4": clip,
        "/narration.mp3": narration,
      };

      const filePath = fileMap[req.url || ""];
      if (!filePath) {
        res.statusCode = 404;
        res.end("not found");
        return;
      }

      createReadStream(filePath).pipe(res);
    });

    await new Promise<void>((resolve) => server.listen(32126, "127.0.0.1", () => resolve()));

    let uploadedPath: string | undefined;

    try {
      const result = await stitchVideos(
        [{ url: "http://127.0.0.1:32126/clip.mp4", order: 0, duration: 2 }],
        {
          outputFormat: "mp4",
          addSubtitles: true,
          sceneTexts: ["Single processed scene."],
          clipDuration: 2,
          narrationAudioUrl: "http://127.0.0.1:32126/narration.mp3",
        },
      );

      expect(result.videoUrl).not.toBe("http://127.0.0.1:32126/clip.mp4");
      uploadedPath = toUploadedFilePath(result.videoUrl);
      expect(await hasAudioStream(uploadedPath)).toBe(true);

      const duration = await getDuration(uploadedPath);
      expect(duration).toBeGreaterThan(1.8);
      expect(duration).toBeLessThan(2.2);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      if (uploadedPath) {
        await fs.unlink(uploadedPath).catch(() => {});
      }
      await fs.rm(tempDir, { recursive: true, force: true }).catch(() => {});
    }
  }, 60000);
});
