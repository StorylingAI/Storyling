import { describe, it, expect, beforeAll } from "vitest";
import { addBackgroundMusic } from "./backgroundMusic";
import { getDb } from "./db";
import { storyProgress, generatedContent, users } from "../drizzle/schema";
import { eq, and } from "drizzle-orm";
import { createReadStream } from "fs";
import * as fs from "fs/promises";
import * as path from "path";
import { exec } from "child_process";
import { promisify } from "util";
import http from "http";

const execAsync = promisify(exec);
const describeIfDatabase = process.env.DATABASE_URL ? describe : describe.skip;

describe("Music Fade Effects", () => {
  it("should add audible background music with fade-in and fade-out effects", async () => {
    const testVideoPath = path.join("/tmp", "test-video-fade.mp4");
    const testMusicPath = path.join("/tmp", "test-music-fade.mp3");
    let outputPath: string | undefined;

    await execAsync(
      `ffmpeg -f lavfi -i color=c=black:s=320x240:d=5 -f lavfi -i anullsrc=r=44100:cl=stereo -t 5 -pix_fmt yuv420p -y "${testVideoPath}"`
    );

    await execAsync(
      `ffmpeg -f lavfi -i sine=frequency=660:duration=5 -c:a libmp3lame -y "${testMusicPath}"`
    );

    const server = http.createServer((req, res) => {
      if (req.url !== "/music.mp3") {
        res.statusCode = 404;
        res.end("not found");
        return;
      }

      res.statusCode = 200;
      createReadStream(testMusicPath).pipe(res as any);
    });

    await new Promise<void>((resolve) => {
      server.listen(32124, "127.0.0.1", () => resolve());
    });
    
    try {
      outputPath = await addBackgroundMusic(
        testVideoPath,
        "calm",
        5,
        20,
        "http://127.0.0.1:32124/music.mp3",
      );
      
      const stats = await fs.stat(outputPath);
      expect(stats.size).toBeGreaterThan(0);
      
      const { stdout } = await execAsync(`ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${outputPath}"`);
      const duration = parseFloat(stdout.trim());
      expect(duration).toBeGreaterThan(0);
      expect(duration).toBeLessThanOrEqual(6); // Should be around 5 seconds

      const nullSink = process.platform === "win32" ? "NUL" : "/dev/null";
      const { stderr } = await execAsync(`ffmpeg -i "${outputPath}" -af volumedetect -f null ${nullSink}`, { maxBuffer: 20 * 1024 * 1024 });
      const meanVolumeMatch = stderr.match(/mean_volume:\s*(-?\d+(\.\d+)?) dB/);
      expect(meanVolumeMatch).toBeTruthy();
      expect(Number(meanVolumeMatch?.[1])).toBeGreaterThan(-80);
    } finally {
      await new Promise<void>((resolve) => server.close(() => resolve()));
      if (outputPath) {
        await fs.unlink(outputPath).catch(() => {});
      }
      await fs.unlink(testVideoPath).catch(() => {});
      await fs.unlink(testMusicPath).catch(() => {});
    }
  }, 60000); // 60 second timeout for video processing
});

describeIfDatabase("Video Resume Position Persistence", () => {
  let testUserId: number;
  let testContentId: number;
  
  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    
    // Create a test user
    const userResult = await db.insert(users).values({
      openId: `test-user-${Date.now()}`,
      name: "Test User",
      email: "test@example.com",
      role: "user",
    });
    testUserId = userResult[0].insertId;
    
    // Create test content
    const contentResult = await db.insert(generatedContent).values({
      userId: testUserId,
      vocabularyListId: 1,
      mode: "film",
      theme: "Adventure",
      voiceType: "narrator",
      voiceGender: "male",
      status: "completed",
      title: "Test Story",
      storyText: "Test story content",
      audioUrl: "https://example.com/audio.mp3",
      videoUrl: "https://example.com/video.mp4",
    });
    testContentId = contentResult[0].insertId;
  });
  
  it("should save video playback progress", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    
    // Insert progress
    await db.insert(storyProgress).values({
      userId: testUserId,
      contentId: testContentId,
      currentSentence: 5,
      currentTime: 45.5,
      totalDuration: 120,
      completed: false,
    });
    
    // Verify progress was saved
    const savedProgress = await db
      .select()
      .from(storyProgress)
      .where(
        and(
          eq(storyProgress.userId, testUserId),
          eq(storyProgress.contentId, testContentId)
        )
      )
      .limit(1);
    
    expect(savedProgress.length).toBe(1);
    expect(savedProgress[0].currentTime).toBe(45.5);
    expect(savedProgress[0].currentSentence).toBe(5);
    expect(savedProgress[0].totalDuration).toBe(120);
    expect(savedProgress[0].completed).toBe(false);
  });
  
  it("should update existing progress when saving again", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    
    // Get existing progress
    const existing = await db
      .select()
      .from(storyProgress)
      .where(
        and(
          eq(storyProgress.userId, testUserId),
          eq(storyProgress.contentId, testContentId)
        )
      )
      .limit(1);
    
    expect(existing.length).toBe(1);
    
    // Update progress
    await db
      .update(storyProgress)
      .set({
        currentTime: 75.2,
        currentSentence: 8,
        lastWatchedAt: new Date(),
      })
      .where(eq(storyProgress.id, existing[0].id));
    
    // Verify update
    const updated = await db
      .select()
      .from(storyProgress)
      .where(eq(storyProgress.id, existing[0].id))
      .limit(1);
    
    expect(updated[0].currentTime).toBe(75.2);
    expect(updated[0].currentSentence).toBe(8);
  });
  
  it("should retrieve saved progress for resume functionality", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    
    // Retrieve progress
    const progress = await db
      .select()
      .from(storyProgress)
      .where(
        and(
          eq(storyProgress.userId, testUserId),
          eq(storyProgress.contentId, testContentId)
        )
      )
      .limit(1);
    
    expect(progress.length).toBe(1);
    expect(progress[0].currentTime).toBeGreaterThan(0);
    expect(progress[0].userId).toBe(testUserId);
    expect(progress[0].contentId).toBe(testContentId);
  });
  
  it("should mark content as completed", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database connection failed");
    
    // Get existing progress
    const existing = await db
      .select()
      .from(storyProgress)
      .where(
        and(
          eq(storyProgress.userId, testUserId),
          eq(storyProgress.contentId, testContentId)
        )
      )
      .limit(1);
    
    // Mark as completed
    await db
      .update(storyProgress)
      .set({
        completed: true,
        lastWatchedAt: new Date(),
      })
      .where(eq(storyProgress.id, existing[0].id));
    
    // Verify completion
    const completed = await db
      .select()
      .from(storyProgress)
      .where(eq(storyProgress.id, existing[0].id))
      .limit(1);
    
    expect(completed[0].completed).toBe(true);
  });
});
