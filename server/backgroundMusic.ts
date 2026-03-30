/**
 * Background Music Module
 * Downloads curated music tracks and mixes them under narration/video audio.
 */

import axios from 'axios';
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import os from 'os';
import path from 'path';
import {
  getAllMoods,
  getTrackById,
  getTracksByMood,
  type MusicMood,
  type MusicTrack as LibraryMusicTrack,
} from './musicLibrary';
export type { MusicMood } from './musicLibrary';

const execAsync = promisify(exec);

interface MusicTrack {
  mood: MusicMood;
  name: string;
  duration: number;
  description: string;
}

interface ResolvedMusicTrack {
  mood: MusicMood;
  name: string;
  duration: number;
  description: string;
  sourceUrl: string;
}

function toSimpleTrack(track: LibraryMusicTrack): MusicTrack {
  return {
    mood: track.mood,
    name: track.name,
    duration: track.duration,
    description: track.description,
  };
}

function buildMusicLibrary(): Record<MusicMood, MusicTrack | null> {
  const library = { none: null } as Record<MusicMood, MusicTrack | null>;

  for (const mood of getAllMoods()) {
    const track = getTracksByMood(mood)[0];
    library[mood] = track ? toSimpleTrack(track) : null;
  }

  return library;
}

/**
 * Lightweight metadata kept for compatibility with existing callers/tests.
 */
export const MUSIC_LIBRARY: Record<MusicMood, MusicTrack | null> = buildMusicLibrary();

function resolveMusicTrack(
  musicMood: MusicMood,
  selectedMusicTrack?: string,
): ResolvedMusicTrack | null {
  if (musicMood === 'none') {
    return null;
  }

  if (selectedMusicTrack && /^https?:\/\//i.test(selectedMusicTrack)) {
    return {
      mood: musicMood,
      name: 'Custom Track',
      duration: 0,
      description: 'Direct track URL',
      sourceUrl: selectedMusicTrack,
    };
  }

  const selectedTrack = selectedMusicTrack ? getTrackById(selectedMusicTrack) : null;
  if (selectedTrack) {
    return {
      mood: selectedTrack.mood,
      name: selectedTrack.name,
      duration: selectedTrack.duration,
      description: selectedTrack.description,
      sourceUrl: selectedTrack.fullUrl || selectedTrack.previewUrl,
    };
  }

  const defaultTrack = getTracksByMood(musicMood)[0];
  if (!defaultTrack) {
    return null;
  }

  return {
    mood: defaultTrack.mood,
    name: defaultTrack.name,
    duration: defaultTrack.duration,
    description: defaultTrack.description,
    sourceUrl: defaultTrack.fullUrl || defaultTrack.previewUrl,
  };
}

async function hasAudioStream(mediaPath: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync(
      `ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "${mediaPath}"`,
    );
    return stdout.trim().length > 0;
  } catch (error) {
    console.warn('[BackgroundMusic] Could not inspect audio streams:', error);
    return false;
  }
}

async function downloadMusicTrack(track: ResolvedMusicTrack, outputPath: string): Promise<void> {
  console.log(`[BackgroundMusic] Downloading track "${track.name}" from ${track.sourceUrl}`);

  const response = await axios.get(track.sourceUrl, {
    responseType: 'arraybuffer',
    timeout: 120000,
  });

  await fs.writeFile(outputPath, response.data);
}

async function prepareMusicTrack(inputPath: string, duration: number): Promise<string> {
  const preparedPath = path.join(os.tmpdir(), `prepared-music-${Date.now()}.mp3`);
  const command = `ffmpeg -y -stream_loop -1 -i "${inputPath}" -t ${duration} -vn -ac 2 -ar 44100 -c:a libmp3lame "${preparedPath}"`;

  await execAsync(command, { maxBuffer: 20 * 1024 * 1024 });
  return preparedPath;
}

/**
 * Mix background music with video audio using FFmpeg.
 *
 * When the source video is silent, the music becomes the only audio stream.
 * When the source video already has audio, the music is mixed underneath it.
 */
export async function addBackgroundMusic(
  videoPath: string,
  musicMood: MusicMood,
  videoDuration: number,
  musicVolume: number = 20,
  selectedMusicTrack?: string,
  outputPath?: string,
): Promise<string> {
  console.log(`[BackgroundMusic] Adding ${musicMood} music to video (${videoDuration}s)`);

  if (musicMood === 'none') {
    console.log('[BackgroundMusic] No music requested, returning original video');
    return videoPath;
  }

  const track = resolveMusicTrack(musicMood, selectedMusicTrack);
  if (!track) {
    throw new Error(`Music track not found for mood: ${musicMood}`);
  }

  const downloadedTrackPath = path.join(os.tmpdir(), `music-track-${Date.now()}.mp3`);
  let preparedMusicPath: string | undefined;
  const output = outputPath || path.join(os.tmpdir(), `video-with-music-${Date.now()}.mp4`);

  try {
    await downloadMusicTrack(track, downloadedTrackPath);
    preparedMusicPath = await prepareMusicTrack(downloadedTrackPath, videoDuration);

    const sourceHasAudio = await hasAudioStream(videoPath);
    const fadeInDuration = Math.min(2, Math.max(0.5, videoDuration / 4));
    const fadeOutStart = Math.max(0, videoDuration - fadeInDuration);
    const volumeLevel = Math.min(1, Math.max(0, musicVolume / 100));

    const musicFilter = `[1:a]afade=t=in:st=0:d=${fadeInDuration},afade=t=out:st=${fadeOutStart}:d=${fadeInDuration},volume=${volumeLevel}[music]`;

    const command = sourceHasAudio
      ? `ffmpeg -y -i "${videoPath}" -i "${preparedMusicPath}" -filter_complex "${musicFilter};[0:a][music]amix=inputs=2:duration=first:dropout_transition=2[aout]" -map 0:v -map "[aout]" -c:v copy -c:a aac -b:a 192k "${output}"`
      : `ffmpeg -y -i "${videoPath}" -i "${preparedMusicPath}" -filter_complex "${musicFilter}" -map 0:v -map "[music]" -c:v copy -c:a aac -b:a 192k -shortest "${output}"`;

    console.log('[BackgroundMusic] Executing FFmpeg command:', command);
    const { stderr } = await execAsync(command, { maxBuffer: 20 * 1024 * 1024 });

    if (stderr && !stderr.includes('frame=')) {
      console.warn('[BackgroundMusic] FFmpeg stderr:', stderr);
    }

    console.log(`[BackgroundMusic] Music successfully added using "${track.name}"`);
    return output;
  } catch (error) {
    console.error('[BackgroundMusic] Error adding music:', error);
    throw new Error(`Failed to add background music: ${error instanceof Error ? error.message : 'Unknown error'}`);
  } finally {
    await fs.unlink(downloadedTrackPath).catch(() => {});
    if (preparedMusicPath) {
      await fs.unlink(preparedMusicPath).catch(() => {});
    }
  }
}

export function getMusicTrack(mood: MusicMood): MusicTrack | null {
  return MUSIC_LIBRARY[mood];
}

export function getAvailableMoods(): MusicMood[] {
  return getAllMoods();
}
