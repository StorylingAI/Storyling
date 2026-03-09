import { describe, it, expect, beforeAll, afterAll } from "vitest";
import { getDb } from "./db";
import { generatedContent, users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

describe("Download Router", () => {
  let testUserId: number;
  let testStoryId: number;

  beforeAll(async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Create a test user
    const [user] = await db
      .insert(users)
      .values({
        email: `test-download-${Date.now()}@example.com`,
        name: "Test Download User",
        role: "user",
      })
      .$returningId();
    testUserId = user.id;

    // Create a test story with transcript data
    const [story] = await db
      .insert(generatedContent)
      .values({
        userId: testUserId,
        vocabularyListId: 1,
        mode: "film",
        theme: "Adventure",
        title: "Test Story for Download",
        storyText: "This is a test story.",
        transcript: JSON.stringify({
          segments: [
            {
              startTime: 0,
              endTime: 2.5,
              text: "Hello world",
              translation: "你好世界",
            },
            {
              startTime: 2.5,
              endTime: 5.0,
              text: "This is a test",
              translation: "这是一个测试",
            },
          ],
        }),
        audioUrl: "https://example.com/audio.mp3",
        videoUrl: "https://example.com/video.mp4",
        status: "completed",
        vocabularyTranslations: JSON.stringify([
          {
            word: "hello",
            translation: "你好",
            pinyin: "nǐ hǎo",
          },
          {
            word: "world",
            translation: "世界",
            pinyin: "shì jiè",
          },
        ]),
      })
      .$returningId();
    testStoryId = story.id;
  });

  afterAll(async () => {
    const db = await getDb();
    if (!db) return;

    // Clean up test data
    await db.delete(generatedContent).where(eq(generatedContent.userId, testUserId));
    await db.delete(users).where(eq(users.id, testUserId));
  });

  it("should generate SRT subtitle content correctly", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [story] = await db
      .select()
      .from(generatedContent)
      .where(eq(generatedContent.id, testStoryId))
      .limit(1);

    expect(story).toBeDefined();
    expect(story.transcript).toBeDefined();

    // Parse transcript
    const transcriptData = JSON.parse(story.transcript as string);
    expect(transcriptData.segments).toHaveLength(2);

    // Verify SRT format structure
    const segments = transcriptData.segments;
    expect(segments[0].startTime).toBe(0);
    expect(segments[0].endTime).toBe(2.5);
    expect(segments[0].text).toBe("Hello world");
    expect(segments[0].translation).toBe("你好世界");
  });

  it("should have correct story data for batch download", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [story] = await db
      .select()
      .from(generatedContent)
      .where(eq(generatedContent.id, testStoryId))
      .limit(1);

    expect(story).toBeDefined();
    expect(story.title).toBe("Test Story for Download");
    expect(story.audioUrl).toBe("https://example.com/audio.mp3");
    expect(story.videoUrl).toBe("https://example.com/video.mp4");
    expect(story.mode).toBe("film");
    expect(story.status).toBe("completed");
  });

  it("should have vocabulary translations for metadata", async () => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    const [story] = await db
      .select()
      .from(generatedContent)
      .where(eq(generatedContent.id, testStoryId))
      .limit(1);

    expect(story.vocabularyTranslations).toBeDefined();
    
    const vocabData = JSON.parse(story.vocabularyTranslations as string);
    expect(Array.isArray(vocabData)).toBe(true);
    expect(vocabData).toHaveLength(2);
    expect(vocabData[0].word).toBe("hello");
    expect(vocabData[0].translation).toBe("你好");
    expect(vocabData[0].pinyin).toBe("nǐ hǎo");
  });

  it("should format time correctly for SRT", () => {
    const formatTime = (seconds: number): string => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      const milliseconds = Math.floor((seconds % 1) * 1000);
      
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
    };

    expect(formatTime(0)).toBe("00:00:00,000");
    expect(formatTime(2.5)).toBe("00:00:02,500");
    expect(formatTime(65.123)).toBe("00:01:05,123");
    expect(formatTime(3661.5)).toBe("01:01:01,500");
  });

  it("should sanitize filenames correctly", () => {
    const sanitizeFilename = (title: string): string => {
      return (title || 'story').replace(/[^a-z0-9]/gi, '_').toLowerCase();
    };

    expect(sanitizeFilename("Test Story")).toBe("test_story");
    expect(sanitizeFilename("Hello World!")).toBe("hello_world_");
    expect(sanitizeFilename("测试故事")).toBe("____");
    expect(sanitizeFilename("")).toBe("story");
  });
});
