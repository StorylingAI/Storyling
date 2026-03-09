/**
 * Background Music Module
 * Provides ambient music tracks for video films
 */

import { storagePut } from './storage';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execAsync = promisify(exec);

/**
 * Music mood types available for films
 */
export type MusicMood = 'calm' | 'upbeat' | 'dramatic' | 'adventure' | 'suspenseful' | 'romantic' | 'mysterious' | 'comedic' | 'energetic' | 'melancholic' | 'triumphant' | 'peaceful' | 'none';

/**
 * Music track metadata
 */
interface MusicTrack {
  mood: MusicMood;
  name: string;
  duration: number; // in seconds
  description: string;
}

/**
 * Available music tracks
 * In production, these would be actual audio files in S3
 */
export const MUSIC_LIBRARY: Record<MusicMood, MusicTrack | null> = {
  calm: { mood: 'calm', name: 'Peaceful Journey', duration: 120, description: 'Soft piano and ambient sounds for relaxation' },
  upbeat: { mood: 'upbeat', name: 'Happy Learning', duration: 120, description: 'Cheerful acoustic guitar and light percussion' },
  dramatic: { mood: 'dramatic', name: 'Epic Discovery', duration: 120, description: 'Orchestral strings and powerful crescendos' },
  adventure: { mood: 'adventure', name: 'Exploration Theme', duration: 120, description: 'Adventurous melodies with world music influences' },
  suspenseful: { mood: 'suspenseful', name: 'Mystery Unfolds', duration: 120, description: 'Tense atmosphere with subtle percussion' },
  romantic: { mood: 'romantic', name: 'Love Story', duration: 120, description: 'Tender piano with soft strings' },
  mysterious: { mood: 'mysterious', name: 'Enigma', duration: 120, description: 'Cryptic soundscape with ethereal pads' },
  comedic: { mood: 'comedic', name: 'Playful Antics', duration: 120, description: 'Bouncy xylophone with silly sound effects' },
  energetic: { mood: 'energetic', name: 'Power Up', duration: 120, description: 'High-energy electronic beats' },
  melancholic: { mood: 'melancholic', name: 'Reflections', duration: 120, description: 'Somber piano with gentle rain sounds' },
  triumphant: { mood: 'triumphant', name: 'Victory March', duration: 120, description: 'Celebratory brass with marching drums' },
  peaceful: { mood: 'peaceful', name: 'Zen Garden', duration: 120, description: 'Tranquil Asian instruments with nature sounds' },
  none: null,
};

/**
 * Mix background music with video audio using FFmpeg
 * 
 * @param videoPath - Path to the input video file
 * @param musicMood - Type of music to add
 * @param videoDuration - Duration of the video in seconds
 * @param outputPath - Path for the output video with music
 * @returns Path to the video with background music
 */
export async function addBackgroundMusic(
  videoPath: string,
  musicMood: MusicMood,
  videoDuration: number,
  musicVolume: number = 20,
  selectedMusicTrack?: string,
  outputPath?: string
): Promise<string> {
  console.log(`[BackgroundMusic] Adding ${musicMood} music to video (${videoDuration}s)`);

  if (musicMood === 'none') {
    console.log('[BackgroundMusic] No music requested, returning original video');
    return videoPath;
  }

  const track = MUSIC_LIBRARY[musicMood];
  if (!track) {
    throw new Error(`Music track not found for mood: ${musicMood}`);
  }

  // Generate music audio file (placeholder - in production, fetch from S3)
  const musicPath = await generateMusicAudio(musicMood, videoDuration);

  // Set output path
  const output = outputPath || path.join('/tmp', `video-with-music-${Date.now()}.mp4`);

  try {
    // FFmpeg command to mix audio with fade effects:
    // - [0:a] = original video audio (narration)
    // - [1:a] = background music
    // - afade=t=in:st=0:d=2 = fade in music over first 2 seconds
    // - afade=t=out:st={duration-2}:d=2 = fade out music over last 2 seconds
    // - volume={musicVolume/100} = adjust music volume (0-100% converted to 0.0-1.0)
    // - amix = mix both audio streams
    // - shortest = stop when shortest input ends
    const fadeInDuration = Math.min(2, videoDuration / 4); // 2s or 25% of video, whichever is shorter
    const fadeOutStart = Math.max(0, videoDuration - fadeInDuration);
    const volumeLevel = musicVolume / 100; // Convert 0-100 to 0.0-1.0
    
    const command = `ffmpeg -i "${videoPath}" -i "${musicPath}" \
      -filter_complex "[1:a]afade=t=in:st=0:d=${fadeInDuration},afade=t=out:st=${fadeOutStart}:d=${fadeInDuration},volume=${volumeLevel}[music];[0:a][music]amix=inputs=2:duration=shortest[aout]" \
      -map 0:v -map "[aout]" -c:v copy -c:a aac -b:a 192k -y "${output}"`;

    console.log('[BackgroundMusic] Executing FFmpeg command:', command);
    const { stdout, stderr } = await execAsync(command);
    
    if (stderr && !stderr.includes('frame=')) {
      console.warn('[BackgroundMusic] FFmpeg stderr:', stderr);
    }

    console.log('[BackgroundMusic] Music successfully added to video');

    // Cleanup temporary music file
    await fs.unlink(musicPath).catch(err => 
      console.warn('[BackgroundMusic] Failed to cleanup music file:', err)
    );

    return output;
  } catch (error) {
    console.error('[BackgroundMusic] Error adding music:', error);
    throw new Error(`Failed to add background music: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Generate or fetch music audio file for the specified mood
 * 
 * @param mood - Music mood type
 * @param duration - Required duration in seconds
 * @returns Path to the music audio file
 */
async function generateMusicAudio(mood: MusicMood, duration: number): Promise<string> {
  console.log(`[BackgroundMusic] Generating ${mood} music for ${duration}s`);

  // For MVP, generate a silent audio file as placeholder
  // In production, this would fetch actual music from S3 or generate with AI
  const outputPath = path.join('/tmp', `music-${mood}-${Date.now()}.mp3`);

  try {
    // Generate silent audio file with FFmpeg (placeholder)
    // In production, replace with actual music file or AI-generated music
    const command = `ffmpeg -f lavfi -i anullsrc=r=44100:cl=stereo -t ${duration} -q:a 9 -acodec libmp3lame -y "${outputPath}"`;
    
    await execAsync(command);
    console.log('[BackgroundMusic] Music audio generated:', outputPath);
    
    return outputPath;
  } catch (error) {
    console.error('[BackgroundMusic] Error generating music:', error);
    throw new Error(`Failed to generate music audio: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

/**
 * Get music track information
 */
export function getMusicTrack(mood: MusicMood): MusicTrack | null {
  return MUSIC_LIBRARY[mood];
}

/**
 * Get all available music moods
 */
export function getAvailableMoods(): MusicMood[] {
  return Object.keys(MUSIC_LIBRARY).filter(mood => mood !== 'none') as MusicMood[];
}
