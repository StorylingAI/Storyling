import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "./_core/trpc";
import { getDb } from "./db";
import { generatedContent } from "../drizzle/schema";
import { inArray, eq, and } from "drizzle-orm";
import archiver from "archiver";
import { Readable } from "stream";

/**
 * Generate .srt subtitle file content from story data
 */
function generateSrtContent(story: any): string {
  // Parse transcript which contains timing and text information
  let segments: any[] = [];
  
  if (story.transcript) {
    try {
      // Transcript is stored as text, parse it to extract segments
      const transcriptData = typeof story.transcript === 'string' ? JSON.parse(story.transcript) : story.transcript;
      segments = transcriptData.segments || transcriptData || [];
    } catch (e) {
      throw new Error("Story transcript not available or invalid format");
    }
  }
  
  if (!Array.isArray(segments) || segments.length === 0) {
    throw new Error("Story transcript not available");
  }

  let srtContent = "";
  let index = 1;

  for (const segment of segments) {
    if (!segment.startTime || !segment.endTime || !segment.text) {
      continue;
    }

    // Format time as HH:MM:SS,mmm
    const formatTime = (seconds: number): string => {
      const hours = Math.floor(seconds / 3600);
      const minutes = Math.floor((seconds % 3600) / 60);
      const secs = Math.floor(seconds % 60);
      const milliseconds = Math.floor((seconds % 1) * 1000);
      
      return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
    };

    srtContent += `${index}\n`;
    srtContent += `${formatTime(segment.startTime)} --> ${formatTime(segment.endTime)}\n`;
    srtContent += `${segment.text}\n`;
    
    // Add translation if available
    if (segment.translation) {
      srtContent += `${segment.translation}\n`;
    }
    
    srtContent += `\n`;
    index++;
  }

  return srtContent;
}

/**
 * Generate metadata text file for a story
 */
function generateMetadataContent(story: any): string {
  let metadata = `Story: ${story.title}\n`;
  metadata += `Mode: ${story.mode}\n`;
  metadata += `Level: ${story.difficultyLevel || 'N/A'}\n`;

  metadata += `Created: ${new Date(story.createdAt).toLocaleString()}\n\n`;
  
  if (story.description) {
    metadata += `Description:\n${story.description}\n\n`;
  }
  
  if (story.vocabularyTranslations) {
    try {
      const vocabData = typeof story.vocabularyTranslations === 'string' 
        ? JSON.parse(story.vocabularyTranslations) 
        : story.vocabularyTranslations;
      
      if (Array.isArray(vocabData) && vocabData.length > 0) {
        metadata += `Vocabulary (${vocabData.length} words):\n`;
        for (const vocab of vocabData) {
          metadata += `- ${vocab.word || vocab.text}`;
          if (vocab.translation) {
            metadata += ` (${vocab.translation})`;
          }
          if (vocab.pinyin) {
            metadata += ` [${vocab.pinyin}]`;
          }
          metadata += `\n`;
        }
      }
    } catch (e) {
      // Ignore parsing errors
    }
  }
  
  return metadata;
}

export const downloadRouter = router({
  /**
   * Export subtitle file (.srt) for a single story
   */
  exportSubtitle: protectedProcedure
    .input(
      z.object({
        storyId: z.number(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      // Get story data
      const [story] = await db
        .select()
        .from(generatedContent)
        .where(
          and(
            eq(generatedContent.id, input.storyId),
            eq(generatedContent.userId, ctx.user.id)
          )
        )
        .limit(1);

      if (!story) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Story not found" });
      }

      // Generate SRT content
      const srtContent = generateSrtContent(story);
      
      // Create filename
      const sanitizedTitle = (story.title || 'story').replace(/[^a-z0-9]/gi, '_').toLowerCase();
      const filename = `${sanitizedTitle}_${story.id}.srt`;

      return {
        content: srtContent,
        filename,
        mimeType: "text/plain",
      };
    }),

  /**
   * Batch download multiple stories as a zip file
   */
  batchDownload: protectedProcedure
    .input(
      z.object({
        storyIds: z.array(z.number()).min(1).max(50), // Limit to 50 stories at once
        includeMetadata: z.boolean().default(true),
        includeSubtitles: z.boolean().default(true),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      // Get all requested stories
      const stories = await db
        .select()
        .from(generatedContent)
        .where(
          and(
            inArray(generatedContent.id, input.storyIds),
            eq(generatedContent.userId, ctx.user.id)
          )
        );

      if (stories.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "No stories found" });
      }

      // Create archive
      const archive = archiver("zip", {
        zlib: { level: 9 }, // Maximum compression
      });

      // Track files added
      const filesAdded: string[] = [];

      // Add each story's files to the archive
      for (const story of stories) {
        const sanitizedTitle = (story.title || 'story').replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const storyFolder = `${sanitizedTitle}_${story.id}`;

        // Add audio file if available
        if (story.audioUrl) {
          try {
            const audioResponse = await fetch(story.audioUrl);
            if (audioResponse.ok) {
              const audioBuffer = await audioResponse.arrayBuffer();
              const audioExtension = story.mode === "film" ? "mp4" : "mp3";
              archive.append(Buffer.from(audioBuffer), {
                name: `${storyFolder}/audio.${audioExtension}`,
              });
              filesAdded.push(`${storyFolder}/audio.${audioExtension}`);
            }
          } catch (error) {
            console.error(`Failed to fetch audio for story ${story.id}:`, error);
          }
        }

        // Add video file if available (for film mode)
        if (story.mode === "film" && story.videoUrl) {
          try {
            const videoResponse = await fetch(story.videoUrl);
            if (videoResponse.ok) {
              const videoBuffer = await videoResponse.arrayBuffer();
              archive.append(Buffer.from(videoBuffer), {
                name: `${storyFolder}/video.mp4`,
              });
              filesAdded.push(`${storyFolder}/video.mp4`);
            }
          } catch (error) {
            console.error(`Failed to fetch video for story ${story.id}:`, error);
          }
        }

        // Add subtitle file if requested and available
        if (input.includeSubtitles && story.transcript) {
          try {
            const srtContent = generateSrtContent(story);
            archive.append(srtContent, {
              name: `${storyFolder}/subtitles.srt`,
            });
            filesAdded.push(`${storyFolder}/subtitles.srt`);
          } catch (error) {
            console.error(`Failed to generate subtitles for story ${story.id}:`, error);
          }
        }

        // Add metadata file if requested
        if (input.includeMetadata) {
          try {
            const metadataContent = generateMetadataContent(story);
            archive.append(metadataContent, {
              name: `${storyFolder}/metadata.txt`,
            });
            filesAdded.push(`${storyFolder}/metadata.txt`);
          } catch (error) {
            console.error(`Failed to generate metadata for story ${story.id}:`, error);
          }
        }
      }

      // Finalize the archive
      await archive.finalize();

      // Convert archive stream to base64
      const chunks: Buffer[] = [];
      archive.on("data", (chunk) => chunks.push(chunk));
      
      await new Promise((resolve, reject) => {
        archive.on("end", resolve);
        archive.on("error", reject);
      });

      const zipBuffer = Buffer.concat(chunks);
      const base64Content = zipBuffer.toString("base64");

      return {
        content: base64Content,
        filename: `storyling_batch_download_${Date.now()}.zip`,
        mimeType: "application/zip",
        filesCount: filesAdded.length,
        storiesCount: stories.length,
      };
    }),

  /**
   * Get download status for stories (check which have downloadable content)
   */
  getDownloadStatus: protectedProcedure
    .input(
      z.object({
        storyIds: z.array(z.number()),
      })
    )
    .query(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) {
        throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      }

      const stories = await db
        .select({
          id: generatedContent.id,
          title: generatedContent.title,
          mode: generatedContent.mode,
          audioUrl: generatedContent.audioUrl,
          videoUrl: generatedContent.videoUrl,
          transcript: generatedContent.transcript,
        })
        .from(generatedContent)
        .where(
          and(
            inArray(generatedContent.id, input.storyIds),
            eq(generatedContent.userId, ctx.user.id)
          )
        );

      return stories.map((story) => ({
        id: story.id,
        title: story.title,
        hasAudio: !!story.audioUrl,
        hasVideo: story.mode === "film" && !!story.videoUrl,
        hasSubtitles: !!story.transcript,
        mode: story.mode,
      }));
    }),
});
