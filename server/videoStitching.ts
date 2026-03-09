/**
 * Video Stitching Module
 * 
 * This module handles stitching multiple short video clips into a single longer video
 * using FFmpeg. This allows us to create longer educational films by combining
 * multiple 5-10 second Higgsfield clips.
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import * as fs from 'fs/promises';
import * as path from 'path';
import axios from 'axios';
import { storagePut } from './storage';
import { addBackgroundMusic, MusicMood } from './backgroundMusic';
import { generateAndAddSubtitles, SubtitleStyle, DEFAULT_SUBTITLE_STYLE } from './subtitleGeneration';

const execAsync = promisify(exec);

interface VideoClip {
  url: string;
  order: number;
  duration?: number;
}

interface StitchingOptions {
  outputFormat?: 'mp4' | 'webm';
  resolution?: '720p' | '1080p';
  fps?: number;
  addTransitions?: boolean;
  transitionDuration?: number; // in seconds
  backgroundMusic?: MusicMood; // Background music mood
  musicVolume?: number; // Background music volume (0-100, default: 20)
  selectedMusicTrack?: string; // Selected music track filename
  addSubtitles?: boolean; // Whether to add subtitles
  subtitleStyle?: SubtitleStyle; // Subtitle styling (deprecated, use individual params)
  subtitleFontSize?: 'small' | 'medium' | 'large'; // Subtitle font size
  subtitlePosition?: 'top' | 'bottom'; // Subtitle position
  subtitleColor?: 'white' | 'yellow' | 'cyan'; // Subtitle color theme
  sceneTexts?: string[]; // Scene texts for subtitle generation
  clipDuration?: number; // Duration of each clip for subtitle timing
}

interface StitchingResult {
  videoUrl: string;
  duration: number;
  clipCount: number;
  fileSize: number;
}

/**
 * Download a video clip from URL to temporary directory
 */
async function downloadClip(url: string, outputPath: string): Promise<void> {
  console.log(`[VideoStitching] Downloading clip from: ${url}`);
  
  const response = await axios.get(url, {
    responseType: 'arraybuffer',
    timeout: 120000, // 2 minute timeout
  });

  await fs.writeFile(outputPath, response.data);
  console.log(`[VideoStitching] Downloaded to: ${outputPath}`);
}

/**
 * Get video duration using FFprobe
 */
async function getVideoDuration(videoPath: string): Promise<number> {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "${videoPath}"`
    );
    return parseFloat(stdout.trim());
  } catch (error) {
    console.error(`[VideoStitching] Error getting duration for ${videoPath}:`, error);
    return 0;
  }
}

/**
 * Create a concat file for FFmpeg
 */
async function createConcatFile(clipPaths: string[], concatFilePath: string): Promise<void> {
  const content = clipPaths.map(p => `file '${p}'`).join('\n');
  await fs.writeFile(concatFilePath, content);
  console.log(`[VideoStitching] Created concat file: ${concatFilePath}`);
}

/**
 * Build SubtitleStyle from user-friendly customization parameters
 */
function buildSubtitleStyle(
  fontSize: 'small' | 'medium' | 'large',
  position: 'top' | 'bottom',
  color: 'white' | 'yellow' | 'cyan'
): SubtitleStyle {
  const fontSizeMap = { small: 18, medium: 24, large: 32 };
  const colorMap = { white: '&H00FFFFFF', yellow: '&H0000FFFF', cyan: '&H00FFFF00' };
  const alignmentMap = { top: 8, bottom: 2 };
  const marginMap = { top: 20, bottom: 20 };

  return {
    fontName: 'Arial',
    fontSize: fontSizeMap[fontSize],
    primaryColor: colorMap[color],
    outlineColor: '&H00000000',
    backColor: '&H80000000',
    bold: true,
    italic: false,
    borderStyle: 1,
    outline: 2,
    shadow: 0,
    alignment: alignmentMap[position],
    marginV: marginMap[position],
    backgroundOpacity: 0,
  };
}

/**
 * Stitch multiple video clips into a single video using FFmpeg
 * 
 * @param clips - Array of video clips with URLs and order
 * @param options - Stitching options (format, resolution, transitions)
 * @returns Stitched video URL and metadata
 */
export async function stitchVideos(
  clips: VideoClip[],
  options: StitchingOptions = {}
): Promise<StitchingResult> {
  const {
    outputFormat = 'mp4',
    resolution = '720p',
    fps = 30,
    addTransitions = false,
    transitionDuration = 0.5,
  } = options;

  if (clips.length === 0) {
    throw new Error('No video clips provided for stitching');
  }

  if (clips.length === 1) {
    // If only one clip, just return it without stitching
    console.log('[VideoStitching] Only one clip provided, no stitching needed');
    const clipStats = await axios.head(clips[0].url);
    return {
      videoUrl: clips[0].url,
      duration: clips[0].duration || 5,
      clipCount: 1,
      fileSize: parseInt(clipStats.headers['content-length'] || '0'),
    };
  }

  // Sort clips by order
  const sortedClips = [...clips].sort((a, b) => a.order - b.order);

  // Create temporary directory for processing
  const tempDir = path.join('/tmp', `video-stitch-${Date.now()}`);
  await fs.mkdir(tempDir, { recursive: true });

  try {
    console.log(`[VideoStitching] Starting stitching process for ${sortedClips.length} clips`);

    // Download all clips
    const clipPaths: string[] = [];
    for (let i = 0; i < sortedClips.length; i++) {
      const clipPath = path.join(tempDir, `clip-${i}.mp4`);
      await downloadClip(sortedClips[i].url, clipPath);
      clipPaths.push(clipPath);
    }

    // Create concat file for FFmpeg
    const concatFilePath = path.join(tempDir, 'concat.txt');
    await createConcatFile(clipPaths, concatFilePath);

    // Output file path
    const outputPath = path.join(tempDir, `stitched.${outputFormat}`);

    // Determine resolution dimensions
    const resolutionMap: Record<string, string> = {
      '720p': '1280:720',
      '1080p': '1920:1080',
    };
    const dimensions = resolutionMap[resolution] || resolutionMap['720p'];

    // Build FFmpeg command
    let ffmpegCommand: string;

    if (addTransitions) {
      // Complex filter with crossfade transitions
      // Note: This is more complex and may take longer to process
      const filterComplex = buildTransitionFilter(sortedClips.length, transitionDuration);
      
      ffmpegCommand = `ffmpeg -y -f concat -safe 0 -i "${concatFilePath}" \
        -filter_complex "${filterComplex}" \
        -s ${dimensions} -r ${fps} \
        -c:v libx264 -preset medium -crf 23 \
        -c:a aac -b:a 128k \
        -movflags +faststart \
        "${outputPath}"`;
    } else {
      // Simple concatenation without transitions (faster)
      ffmpegCommand = `ffmpeg -y -f concat -safe 0 -i "${concatFilePath}" \
        -vf "scale=${dimensions}:force_original_aspect_ratio=decrease,pad=${dimensions}:(ow-iw)/2:(oh-ih)/2,setsar=1,fps=${fps}" \
        -c:v libx264 -preset medium -crf 23 \
        -c:a aac -b:a 128k \
        -movflags +faststart \
        "${outputPath}"`;
    }

    console.log('[VideoStitching] Running FFmpeg command...');
    console.log('[VideoStitching] Command:', ffmpegCommand.replace(/\s+/g, ' '));

    // Execute FFmpeg
    const { stderr } = await execAsync(ffmpegCommand, {
      maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large videos
    });

    if (stderr) {
      console.log('[VideoStitching] FFmpeg output:', stderr.substring(0, 500));
    }

    // Get output file stats
    const stats = await fs.stat(outputPath);
    const duration = await getVideoDuration(outputPath);

    console.log(`[VideoStitching] Stitching complete. Duration: ${duration}s, Size: ${stats.size} bytes`);

    // Post-processing: Add background music and subtitles
    let finalVideoPath = outputPath;

    // Add background music if requested
    if (options.backgroundMusic && options.backgroundMusic !== 'none') {
      console.log(`[VideoStitching] Adding background music: ${options.backgroundMusic}`);
      const videoWithMusic = await addBackgroundMusic(
        finalVideoPath,
        options.backgroundMusic,
        duration,
        options.musicVolume,
        options.selectedMusicTrack
      );
      finalVideoPath = videoWithMusic;
    }

    // Add subtitles if requested
    // Add subtitles if requested
    if (options.addSubtitles && options.sceneTexts && options.sceneTexts.length > 0) {
      console.log('[VideoStitching] Adding subtitles');
      
      // Build subtitle style from customization parameters
      const subtitleStyle = buildSubtitleStyle(
        options.subtitleFontSize || 'medium',
        options.subtitlePosition || 'bottom',
        options.subtitleColor || 'white'
      );
      
      const videoWithSubs = await generateAndAddSubtitles(
        finalVideoPath,
        options.sceneTexts,
        options.clipDuration || 5,
        options.subtitleStyle || subtitleStyle
      );
      finalVideoPath = videoWithSubs;
    }

    // Get final video stats
    const finalStats = await fs.stat(finalVideoPath);
    const finalDuration = await getVideoDuration(finalVideoPath);

    // Upload to S3
    const videoData = await fs.readFile(finalVideoPath);
    const timestamp = Date.now();
    const s3Key = `stitched-videos/video-${timestamp}.${outputFormat}`;
    
    console.log('[VideoStitching] Uploading stitched video to S3:', s3Key);
    const { url } = await storagePut(s3Key, videoData, `video/${outputFormat}`);

    // Cleanup temporary files
    await cleanupTempDir(tempDir);

    return {
      videoUrl: url,
      duration: finalDuration,
      clipCount: sortedClips.length,
      fileSize: finalStats.size,
    };

  } catch (error: any) {
    console.error('[VideoStitching] Stitching failed:', error.message);
    
    // Cleanup on error
    try {
      await cleanupTempDir(tempDir);
    } catch (cleanupError) {
      console.error('[VideoStitching] Cleanup error:', cleanupError);
    }

    throw new Error(`Video stitching failed: ${error.message}`);
  }
}

/**
 * Build FFmpeg filter complex for crossfade transitions
 */
function buildTransitionFilter(clipCount: number, transitionDuration: number): string {
  if (clipCount < 2) {
    return '';
  }

  // Build crossfade filter chain
  // Example for 3 clips: [0][1]xfade=transition=fade:duration=0.5:offset=4.5[v01];[v01][2]xfade=transition=fade:duration=0.5:offset=9[out]
  
  let filter = '';
  let currentLabel = '0';
  
  for (let i = 1; i < clipCount; i++) {
    const outputLabel = i === clipCount - 1 ? 'out' : `v${i}`;
    const offset = (i * 5) - transitionDuration; // Assuming 5s clips
    
    if (i === 1) {
      filter += `[${currentLabel}][${i}]xfade=transition=fade:duration=${transitionDuration}:offset=${offset}[${outputLabel}]`;
    } else {
      filter += `;[${currentLabel}][${i}]xfade=transition=fade:duration=${transitionDuration}:offset=${offset}[${outputLabel}]`;
    }
    
    currentLabel = outputLabel;
  }
  
  return filter;
}

/**
 * Cleanup temporary directory
 */
async function cleanupTempDir(tempDir: string): Promise<void> {
  try {
    console.log('[VideoStitching] Cleaning up temporary files:', tempDir);
    await fs.rm(tempDir, { recursive: true, force: true });
  } catch (error) {
    console.error('[VideoStitching] Cleanup failed:', error);
  }
}

/**
 * Split a story into multiple scenes for video generation
 * 
 * @param storyText - The full story text
 * @param targetDuration - Target total duration in seconds
 * @param clipDuration - Duration of each individual clip (default: 5 seconds)
 * @returns Array of scene descriptions for video generation
 */
export function splitStoryIntoScenes(
  storyText: string,
  targetDuration: number = 30,
  clipDuration: number = 5
): string[] {
  const clipCount = Math.ceil(targetDuration / clipDuration);
  
  // Split story into sentences
  const sentences = storyText
    .split(/[.!?]+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  if (sentences.length === 0) {
    throw new Error('Story text is empty or invalid');
  }

  // Distribute sentences across clips
  const sentencesPerClip = Math.ceil(sentences.length / clipCount);
  const scenes: string[] = [];

  for (let i = 0; i < clipCount; i++) {
    const start = i * sentencesPerClip;
    const end = Math.min(start + sentencesPerClip, sentences.length);
    const sceneText = sentences.slice(start, end).join('. ') + '.';
    
    if (sceneText.trim().length > 0) {
      scenes.push(sceneText);
    }
  }

  console.log(`[VideoStitching] Split story into ${scenes.length} scenes for ${targetDuration}s video`);
  
  return scenes;
}

/**
 * Generate a visual prompt for each scene based on story content
 * 
 * @param sceneText - The text content of the scene
 * @param cinematicStyle - The overall cinematic style
 * @param sceneIndex - The index of this scene (for continuity)
 * @returns A visual prompt for video generation
 */
export function generateScenePrompt(
  sceneText: string,
  cinematicStyle: string,
  sceneIndex: number
): string {
  // Extract key visual elements from the scene text
  // This is a simple implementation - could be enhanced with LLM
  
  const prompt = `${cinematicStyle} style scene: ${sceneText.substring(0, 200)}`;
  
  return prompt;
}
