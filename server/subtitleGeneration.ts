/**
 * Subtitle Generation Module
 * Generates and overlays subtitles on video films
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';

const execAsync = promisify(exec);

/**
 * Subtitle style configuration
 */
export interface SubtitleStyle {
  fontName: string;
  fontSize: number;
  primaryColor: string; // &HAABBGGRR format
  outlineColor: string; // &HAABBGGRR format
  backColor: string; // &HAABBGGRR format
  bold: boolean;
  italic: boolean;
  borderStyle: number; // 1 = outline + drop shadow, 3 = opaque box
  outline: number; // outline thickness (0-5px)
  shadow: number; // shadow depth
  alignment: number; // 2 = bottom center, 8 = top center
  marginV: number; // vertical margin in pixels
  backgroundOpacity: number; // 0-100%
}

/**
 * Default subtitle style (white text with black outline)
 */
export const DEFAULT_SUBTITLE_STYLE: SubtitleStyle = {
  fontName: 'Arial',
  fontSize: 24,
  primaryColor: '&H00FFFFFF', // white
  outlineColor: '&H00000000', // black
  backColor: '&H80000000', // semi-transparent black
  bold: true,
  italic: false,
  borderStyle: 1,
  outline: 2,
  shadow: 0,
  alignment: 2, // bottom center
  marginV: 20,
  backgroundOpacity: 0, // 0% = transparent
};

/**
 * Subtitle entry
 */
export interface SubtitleEntry {
  index: number;
  startTime: number; // in seconds
  endTime: number; // in seconds
  text: string;
}

export interface SubtitleTimingOptions {
  totalDuration?: number;
}

function estimateSubtitleWeight(text: string): number {
  const words = text.match(/\S+/g) || [];
  const sentenceBreaks = (text.match(/[.!?]/g) || []).length;
  const commas = (text.match(/[,;:]/g) || []).length;
  const characters = text.replace(/\s+/g, '').length;

  return Math.max(1, words.length + sentenceBreaks * 2 + commas * 0.5 + characters / 20);
}

function buildSubtitleEntries(
  scenes: string[],
  clipDuration: number,
  timingOptions?: SubtitleTimingOptions,
): SubtitleEntry[] {
  if (scenes.length === 0) {
    return [];
  }

  const totalDuration = timingOptions?.totalDuration;

  if (!totalDuration || totalDuration <= 0) {
    return scenes.map((scene, index) => ({
      index: index + 1,
      startTime: index * clipDuration,
      endTime: (index + 1) * clipDuration,
      text: scene.trim(),
    }));
  }

  const weights = scenes.map(scene => estimateSubtitleWeight(scene.trim()));
  const totalWeight = weights.reduce((sum, weight) => sum + weight, 0);
  const entries: SubtitleEntry[] = [];
  let currentTime = 0;

  scenes.forEach((scene, index) => {
    const duration = index === scenes.length - 1
      ? Math.max(0, totalDuration - currentTime)
      : (weights[index] / totalWeight) * totalDuration;
    const endTime = index === scenes.length - 1 ? totalDuration : currentTime + duration;

    entries.push({
      index: index + 1,
      startTime: currentTime,
      endTime,
      text: scene.trim(),
    });

    currentTime = endTime;
  });

  return entries;
}

/**
 * Generate SRT subtitle file from scene text and timestamps
 * 
 * @param scenes - Array of scene texts
 * @param clipDuration - Duration of each clip in seconds
 * @param outputPath - Path for the output .srt file
 * @returns Path to the generated subtitle file
 */
export async function generateSubtitleFile(
  scenes: string[],
  clipDuration: number,
  outputPath?: string,
  timingOptions?: SubtitleTimingOptions,
): Promise<string> {
  console.log(`[Subtitles] Generating subtitle file for ${scenes.length} scenes`);

  const output = outputPath || path.join(os.tmpdir(), `subtitles-${Date.now()}.srt`);

  const entries = buildSubtitleEntries(scenes, clipDuration, timingOptions);

  // Generate SRT content
  const srtContent = entries.map(entry => {
    const startTime = formatSRTTime(entry.startTime);
    const endTime = formatSRTTime(entry.endTime);
    
    return `${entry.index}\n${startTime} --> ${endTime}\n${entry.text}\n`;
  }).join('\n');

  // Write to file
  await fs.writeFile(output, srtContent, 'utf-8');
  console.log('[Subtitles] Subtitle file generated:', output);

  return output;
}

/**
 * Format time in SRT format (HH:MM:SS,mmm)
 */
function formatSRTTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const milliseconds = Math.floor((seconds % 1) * 1000);

  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')},${String(milliseconds).padStart(3, '0')}`;
}

/**
 * Overlay subtitles on video using FFmpeg
 * 
 * @param videoPath - Path to the input video file
 * @param subtitlePath - Path to the .srt subtitle file
 * @param style - Subtitle style configuration
 * @param outputPath - Path for the output video with subtitles
 * @returns Path to the video with subtitles
 */
export async function addSubtitlesToVideo(
  videoPath: string,
  subtitlePath: string,
  style: SubtitleStyle = DEFAULT_SUBTITLE_STYLE,
  outputPath?: string
): Promise<string> {
  console.log('[Subtitles] Adding subtitles to video');

  const output = outputPath || path.join(os.tmpdir(), `video-with-subs-${Date.now()}.mp4`);

  try {
    const styleString = buildSubtitleStyle(style);
    const escapedSubtitlePath = path
      .resolve(subtitlePath)
      .replace(/\\/g, '/')
      .replace(/:/g, '\\:')
      .replace(/'/g, "\\'");

    const command = `ffmpeg -i "${videoPath}" -vf "subtitles='${escapedSubtitlePath}':force_style='${styleString}'" -c:a copy -y "${output}"`;

    console.log('[Subtitles] Executing FFmpeg command');
    const { stdout, stderr } = await execAsync(command, { maxBuffer: 10 * 1024 * 1024 });
    
    if (stderr && !stderr.includes('frame=')) {
      console.warn('[Subtitles] FFmpeg stderr:', stderr);
    }

    console.log('[Subtitles] Subtitles successfully added to video');
    return output;
  } catch (error) {
    console.error('[Subtitles] Error adding subtitles:', error);
    throw new Error(`Failed to add subtitles: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Build subtitle style string for FFmpeg
 */
function buildSubtitleStyle(style: SubtitleStyle): string {
  // Convert background opacity (0-100%) to ASS alpha value (0-255, inverted)
  const alphaValue = Math.round((100 - style.backgroundOpacity) * 2.55);
  const backColorWithAlpha = `&H${alphaValue.toString(16).padStart(2, '0').toUpperCase()}000000`;

  const parts: string[] = [
    `FontName=${style.fontName}`,
    `FontSize=${style.fontSize}`,
    `PrimaryColour=${style.primaryColor}`,
    `OutlineColour=${style.outlineColor}`,
    `BackColour=${backColorWithAlpha}`,
    `Bold=${style.bold ? -1 : 0}`,
    `Italic=${style.italic ? -1 : 0}`,
    `BorderStyle=${style.borderStyle}`,
    `Outline=${style.outline}`,
    `Shadow=${style.shadow}`,
    `Alignment=${style.alignment}`,
    `MarginV=${style.marginV}`,
  ];

  return parts.join(',');
}

/**
 * Generate subtitles and overlay them on video (combined operation)
 * 
 * @param videoPath - Path to the input video file
 * @param scenes - Array of scene texts
 * @param clipDuration - Duration of each clip in seconds
 * @param style - Subtitle style configuration
 * @param outputPath - Path for the output video with subtitles
 * @returns Path to the video with subtitles
 */
export async function generateAndAddSubtitles(
  videoPath: string,
  scenes: string[],
  clipDuration: number,
  style: SubtitleStyle = DEFAULT_SUBTITLE_STYLE,
  outputPath?: string,
  timingOptions?: SubtitleTimingOptions,
): Promise<string> {
  console.log('[Subtitles] Generating and adding subtitles to video');

  const subtitlePath = await generateSubtitleFile(scenes, clipDuration, undefined, timingOptions);

  try {
    // Add subtitles to video
    const videoWithSubs = await addSubtitlesToVideo(videoPath, subtitlePath, style, outputPath);

    // Cleanup temporary subtitle file
    await fs.unlink(subtitlePath).catch(err => 
      console.warn('[Subtitles] Failed to cleanup subtitle file:', err)
    );

    return videoWithSubs;
  } catch (error) {
    // Cleanup subtitle file on error
    await fs.unlink(subtitlePath).catch(() => {});
    throw error;
  }
}

/**
 * Parse SRT subtitle file
 */
export async function parseSRTFile(filePath: string): Promise<SubtitleEntry[]> {
  const content = await fs.readFile(filePath, 'utf-8');
  const entries: SubtitleEntry[] = [];

  const blocks = content.trim().split('\n\n');

  for (const block of blocks) {
    const lines = block.split('\n');
    if (lines.length < 3) continue;

    const index = parseInt(lines[0], 10);
    const [startTime, endTime] = lines[1].split(' --> ').map(parseSRTTime);
    const text = lines.slice(2).join('\n');

    entries.push({ index, startTime, endTime, text });
  }

  return entries;
}

/**
 * Parse SRT time format to seconds
 */
function parseSRTTime(timeString: string): number {
  const [time, ms] = timeString.split(',');
  const [hours, minutes, seconds] = time.split(':').map(Number);
  
  return hours * 3600 + minutes * 60 + seconds + Number(ms) / 1000;
}
