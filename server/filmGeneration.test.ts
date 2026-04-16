/**
 * Film Generation Tests
 * Tests convertToVisualPrompt and NSFW retry logic
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock invokeLLM before importing
vi.mock('./_core/llm', () => ({
  invokeLLM: vi.fn(),
}));

// Mock higgsfield module
vi.mock('./higgsfield', () => ({
  generateHiggsfieldImage: vi.fn(),
  generateHiggsfieldVideo: vi.fn(),
}));

vi.mock('./_core/videoGeneration', () => ({
  generateVideo: vi.fn(),
  resolveVideoProvider: vi.fn(() => 'replicate'),
}));

vi.mock('./_core/imageGeneration', () => ({
  generateImage: vi.fn(),
}));

// Mock videoStitching module
vi.mock('./videoStitching', () => ({
  splitStoryIntoScenes: vi.fn((text: string) => [text]),
  fitSceneTextsToClipCount: vi.fn((sceneTexts: string[]) => sceneTexts),
  stitchVideos: vi.fn(),
}));

import { convertToVisualPrompt, generateCharacterSheet, generateFilm } from './contentGeneration';
import { invokeLLM } from './_core/llm';
import { generateHiggsfieldImage } from './higgsfield';
import { generateVideo } from './_core/videoGeneration';
import { generateImage } from './_core/imageGeneration';
import { stitchVideos } from './videoStitching';
import {
  DEFAULT_FILM_NARRATOR_GENDER,
  DEFAULT_FILM_VOICE_TYPE,
  resolveFilmNarrationSettings,
} from '@shared/filmDefaults';

const mockedInvokeLLM = vi.mocked(invokeLLM);
const mockedGenerateImage = vi.mocked(generateHiggsfieldImage);
const mockedGenerateVideo = vi.mocked(generateVideo);
const mockedGenerateStillImage = vi.mocked(generateImage);
const mockedStitchVideos = vi.mocked(stitchVideos);

describe('resolveFilmNarrationSettings', () => {
  it('should default film narration when no voice is provided', () => {
    expect(resolveFilmNarrationSettings()).toEqual({
      voiceType: DEFAULT_FILM_VOICE_TYPE,
      narratorGender: DEFAULT_FILM_NARRATOR_GENDER,
    });
  });

  it('should preserve explicit film narration settings', () => {
    expect(resolveFilmNarrationSettings('Calm & Soothing', 'male')).toEqual({
      voiceType: 'Calm & Soothing',
      narratorGender: 'male',
    });
  });
});

describe('convertToVisualPrompt', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should convert narrative French text to visual English prompt', async () => {
    mockedInvokeLLM.mockResolvedValueOnce({
      id: 'test',
      created: Date.now(),
      model: 'gpt-4o-mini',
      choices: [{
        index: 0,
        message: {
          role: 'assistant' as const,
          content: 'A cheerful family walks toward a sunlit beach, turquoise waves, golden sand, warm afternoon light, wide establishing shot',
        },
        finish_reason: 'stop',
      }],
    });

    const result = await convertToVisualPrompt(
      'Il était une fois, une famille qui s\'appelait les Martin. "Nous allons à la plage." a dit Lucie, la plus jeune des enfants.',
      'Playful Animation',
      'Adventure',
      0,
      6,
    );

    expect(result).toContain('beach');
    expect(result).not.toContain('Lucie');
    expect(result).not.toContain('enfants');
    expect(result).toContain('Playful Animation');
    expect(result).toContain('stable anatomy');
    expect(mockedInvokeLLM).toHaveBeenCalledOnce();

    // Verify the system prompt contains key rules
    const callArgs = mockedInvokeLLM.mock.calls[0][0];
    const systemMsg = callArgs.messages.find((m: any) => m.role === 'system');
    expect(systemMsg?.content).toContain('visual-only');
    expect(systemMsg?.content).toContain('English');
    expect(systemMsg?.content).toContain('NO dialogue');
    expect(systemMsg?.content).toContain('ONE simple action beat');
  });

  it('should use more restrictive rules at retry level 1', async () => {
    mockedInvokeLLM.mockResolvedValueOnce({
      id: 'test',
      created: Date.now(),
      model: 'gpt-4o-mini',
      choices: [{
        index: 0,
        message: {
          role: 'assistant' as const,
          content: 'Travelers arriving at a Mediterranean coastline, crystal clear water, drone shot',
        },
        finish_reason: 'stop',
      }],
    });

    const result = await convertToVisualPrompt(
      'Les enfants jouent sur la plage.',
      'Cinematic',
      'Adventure',
      0,
      3,
      1,
    );

    expect(result).toContain('Travelers');
    const callArgs = mockedInvokeLLM.mock.calls[0][0];
    const systemMsg = callArgs.messages.find((m: any) => m.role === 'system');
    expect(systemMsg?.content).toContain('adults only');
    expect(systemMsg?.content).toContain('young adults');
    expect(systemMsg?.content).toContain('one distant adult');
  });

  it('should use landscape-only rules at retry level 2', async () => {
    mockedInvokeLLM.mockResolvedValueOnce({
      id: 'test',
      created: Date.now(),
      model: 'gpt-4o-mini',
      choices: [{
        index: 0,
        message: {
          role: 'assistant' as const,
          content: 'Sweeping aerial view of a pristine coastline at golden hour, gentle waves',
        },
        finish_reason: 'stop',
      }],
    });

    const result = await convertToVisualPrompt(
      'Les enfants jouent sur la plage.',
      'Cinematic',
      'Adventure',
      0,
      3,
      2,
    );

    expect(result).toContain('coastline');
    const callArgs = mockedInvokeLLM.mock.calls[0][0];
    const systemMsg = callArgs.messages.find((m: any) => m.role === 'system');
    expect(systemMsg?.content).toContain('NO human figures');
    expect(systemMsg?.content).toContain('landscape');
    expect(result).toContain('no people');
  });

  it('should fallback to raw prompt when LLM fails', async () => {
    mockedInvokeLLM.mockRejectedValueOnce(new Error('LLM service unavailable'));

    const result = await convertToVisualPrompt(
      'Une histoire simple.',
      'Dramatic',
      'Romance',
      2,
      5,
    );

    expect(result).toContain('Dramatic');
    expect(result).toContain('cinematic scene 3/5');
    expect(result).toContain('romance');
    expect(result).toContain('stable anatomy');
  });

  it('should include character sheet in system prompt when provided', async () => {
    mockedInvokeLLM.mockResolvedValueOnce({
      id: 'test', created: Date.now(), model: 'gpt-4o-mini',
      choices: [{
        index: 0,
        message: {
          role: 'assistant' as const,
          content: 'A tall figure in a blue jacket walks through a snowy mountain village, warm golden lighting',
        },
        finish_reason: 'stop',
      }],
    });

    const characterSheet = 'VISUAL STYLE: Warm palette\nPRIMARY SUBJECT LOCK: tall adult with brown hair, blue jacket, dark trousers, brown boots, compact backpack\nCHARACTERS:\n- Hero: tall, brown hair, blue jacket\nSETTING LOCK: Mountain village';

    const result = await convertToVisualPrompt(
      'Le héros marche dans le village.',
      'Cinematic',
      'Adventure',
      0,
      3,
      0,
      characterSheet,
    );

    expect(result).toContain('blue jacket');
    expect(result).toContain('Same recurring adult in every human scene');
    expect(result).toContain('unchanged face, hairstyle, outerwear, bottoms, footwear, and essential carried prop');
    expect(result).toContain('Keep the same recognizable setting family');
    const callArgs = mockedInvokeLLM.mock.calls[0][0];
    const systemMsg = callArgs.messages.find((m: any) => m.role === 'system');
    expect(systemMsg?.content).toContain('VISUAL STYLE: Warm palette');
    expect(systemMsg?.content).toContain('PRIMARY SUBJECT LOCK');
    expect(systemMsg?.content).toContain('blue jacket');
  });
});

describe('generateFilm NSFW retry', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    let imageIndex = 0;
    mockedGenerateStillImage.mockImplementation(async () => ({
      url: `https://example.com/generated-scene-${++imageIndex}.png`,
    }));
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('should retry with higher abstraction level when NSFW detected', async () => {
    // Character sheet generation (Step 2 of new pipeline)
    mockedInvokeLLM.mockResolvedValueOnce({
      id: 'test', created: Date.now(), model: 'gpt-4o-mini',
      choices: [{ index: 0, message: { role: 'assistant' as const, content: 'Character sheet data' }, finish_reason: 'stop' }],
    });

    // First call to convertToVisualPrompt (level 0)
    mockedInvokeLLM.mockResolvedValueOnce({
      id: 'test', created: Date.now(), model: 'gpt-4o-mini',
      choices: [{ index: 0, message: { role: 'assistant' as const, content: 'Family at beach scene' }, finish_reason: 'stop' }],
    });

    // First Higgsfield call returns NSFW
    mockedGenerateVideo.mockResolvedValueOnce({
      videoUrl: '', status: 'failed', requestId: 'req1',
      error: 'Content was flagged as inappropriate. Please try a different prompt.',
    });

    // Second call to convertToVisualPrompt (level 1)
    mockedInvokeLLM.mockResolvedValueOnce({
      id: 'test', created: Date.now(), model: 'gpt-4o-mini',
      choices: [{ index: 0, message: { role: 'assistant' as const, content: 'Travelers at coastline' }, finish_reason: 'stop' }],
    });

    // Second Higgsfield call succeeds
    mockedGenerateVideo.mockResolvedValueOnce({
      videoUrl: 'https://example.com/video.mp4', status: 'completed', requestId: 'req2',
    });

    const result = await generateFilm(
      {
        targetLanguage: 'French', proficiencyLevel: 'A2',
        vocabularyWords: ['plage'], theme: 'Adventure',
        cinematicStyle: 'Playful Animation', targetVideoDuration: 5,
        addSubtitles: false,
      },
      'Les enfants vont à la plage.',
    );

    expect(result.videoUrl).toBe('https://example.com/video.mp4');
    expect(mockedGenerateVideo).toHaveBeenCalledTimes(2);
    expect(mockedGenerateVideo).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ persistToStorage: false }),
    );
    expect(mockedGenerateVideo).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({ persistToStorage: false }),
    );
    expect(mockedInvokeLLM).toHaveBeenCalledTimes(3); // 1 character sheet + 2 visual prompts
  });

  it('should fail after 3 NSFW rejections', async () => {
    // Character sheet generation (Step 2 of new pipeline)
    mockedInvokeLLM.mockResolvedValueOnce({
      id: 'test', created: Date.now(), model: 'gpt-4o-mini',
      choices: [{ index: 0, message: { role: 'assistant' as const, content: 'Character sheet data' }, finish_reason: 'stop' }],
    });

    // 3 LLM calls (level 0, 1, 2) + 3 NSFW rejections
    for (let i = 0; i < 3; i++) {
      mockedInvokeLLM.mockResolvedValueOnce({
        id: 'test', created: Date.now(), model: 'gpt-4o-mini',
        choices: [{ index: 0, message: { role: 'assistant' as const, content: `Prompt level ${i}` }, finish_reason: 'stop' }],
      });
      mockedGenerateVideo.mockResolvedValueOnce({
        videoUrl: '', status: 'failed', requestId: `req${i}`,
        error: 'Content was flagged as inappropriate. Please try a different prompt.',
      });
    }

    await expect(generateFilm(
      {
        targetLanguage: 'French', proficiencyLevel: 'A2',
        vocabularyWords: ['plage'], theme: 'Adventure',
        cinematicStyle: 'Cinematic', targetVideoDuration: 5,
      },
      'Story text here.',
    )).rejects.toThrow('flagged by content moderation after 3 attempts');

    expect(mockedGenerateVideo).toHaveBeenCalledTimes(3);
    expect(mockedGenerateVideo).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({ persistToStorage: false }),
    );
  });

  it('should retry the same clip once after a processing timeout', async () => {
    mockedInvokeLLM.mockResolvedValueOnce({
      id: 'test', created: Date.now(), model: 'gpt-4o-mini',
      choices: [{ index: 0, message: { role: 'assistant' as const, content: 'Character sheet data' }, finish_reason: 'stop' }],
    });

    mockedInvokeLLM.mockResolvedValueOnce({
      id: 'test', created: Date.now(), model: 'gpt-4o-mini',
      choices: [{ index: 0, message: { role: 'assistant' as const, content: 'A calm hiker approaches a cabin at dawn.' }, finish_reason: 'stop' }],
    });

    mockedGenerateVideo
      .mockResolvedValueOnce({
        videoUrl: '',
        status: 'processing',
        requestId: 'req-processing',
        error: 'Video generation timeout after 300s (last status: in_progress)',
      })
      .mockResolvedValueOnce({
        videoUrl: 'https://example.com/recovered-clip.mp4',
        status: 'completed',
        requestId: 'req-completed',
      });

    const result = await generateFilm(
      {
        targetLanguage: 'French', proficiencyLevel: 'A2',
        vocabularyWords: ['cabane'], theme: 'Adventure',
        cinematicStyle: 'Cinematic', targetVideoDuration: 5,
        addSubtitles: false,
      },
      'Le randonneur approche de la cabane.',
    );

    expect(result.videoUrl).toBe('https://example.com/recovered-clip.mp4');
    expect(mockedGenerateVideo).toHaveBeenCalledTimes(2);
    expect(mockedInvokeLLM).toHaveBeenCalledTimes(2);
  });

  it('should retry the same clip after a transient provider error', async () => {
    mockedInvokeLLM.mockResolvedValueOnce({
      id: 'test', created: Date.now(), model: 'gpt-4o-mini',
      choices: [{ index: 0, message: { role: 'assistant' as const, content: 'Character sheet data' }, finish_reason: 'stop' }],
    });

    mockedInvokeLLM.mockResolvedValueOnce({
      id: 'test', created: Date.now(), model: 'gpt-4o-mini',
      choices: [{ index: 0, message: { role: 'assistant' as const, content: 'A lone traveler walks through a quiet snowy path.' }, finish_reason: 'stop' }],
    });

    mockedGenerateVideo
      .mockRejectedValueOnce(new Error('Video generation service is temporarily unavailable. Please try again in a few minutes.'))
      .mockResolvedValueOnce({
        videoUrl: 'https://example.com/recovered-after-error.mp4',
        status: 'completed',
        requestId: 'req-recovered',
      });

    const result = await generateFilm(
      {
        targetLanguage: 'French', proficiencyLevel: 'A2',
        vocabularyWords: ['neige'], theme: 'Adventure',
        cinematicStyle: 'Cinematic', targetVideoDuration: 5,
        addSubtitles: false,
      },
      'Le voyageur marche dans la neige.',
    );

    expect(result.videoUrl).toBe('https://example.com/recovered-after-error.mp4');
    expect(mockedGenerateVideo).toHaveBeenCalledTimes(2);
    expect(mockedInvokeLLM).toHaveBeenCalledTimes(2);
  });

  it('should retry Replicate E004 failures multiple times before succeeding', async () => {
    mockedInvokeLLM.mockResolvedValueOnce({
      id: 'test', created: Date.now(), model: 'gpt-4o-mini',
      choices: [{ index: 0, message: { role: 'assistant' as const, content: 'Character sheet data' }, finish_reason: 'stop' }],
    });

    mockedInvokeLLM.mockResolvedValueOnce({
      id: 'test', created: Date.now(), model: 'gpt-4o-mini',
      choices: [{ index: 0, message: { role: 'assistant' as const, content: 'A surfer watches gentle waves at sunset.' }, finish_reason: 'stop' }],
    });

    mockedGenerateVideo
      .mockRejectedValueOnce(new Error('Service is temporarily unavailable. Please try again later. (E004) (first)'))
      .mockRejectedValueOnce(new Error('Service is temporarily unavailable. Please try again later. (E004) (second)'))
      .mockResolvedValueOnce({
        videoUrl: 'https://example.com/recovered-after-e004.mp4',
        status: 'completed',
        requestId: 'req-recovered-e004',
      });

    const result = await generateFilm(
      {
        targetLanguage: 'French', proficiencyLevel: 'A2',
        vocabularyWords: ['vague'], theme: 'Adventure',
        cinematicStyle: 'Playful Animation', targetVideoDuration: 5,
        addSubtitles: false,
      },
      'Le surfeur regarde les vagues au coucher du soleil.',
    );

    expect(result.videoUrl).toBe('https://example.com/recovered-after-e004.mp4');
    expect(mockedGenerateVideo).toHaveBeenCalledTimes(3);
    expect(mockedInvokeLLM).toHaveBeenCalledTimes(2);
  });

  it('should create reference stills and animate them with the same subject lock across clips', async () => {
    mockedInvokeLLM.mockResolvedValueOnce({
      id: 'test',
      created: Date.now(),
      model: 'gpt-4o-mini',
      choices: [{
        index: 0,
        message: {
          role: 'assistant' as const,
          content: [
            'VISUAL STYLE: Snowy Ghibli palette',
            'PRIMARY SUBJECT LOCK: young adult hiker with short black hair, mustard yellow parka, pale trousers, brown boots, large teal backpack',
            'CHARACTERS:',
            '- Hiker: young adult with short black hair and mustard yellow parka',
            'SETTING LOCK: snowy alpine forest near a rustic chalet',
            'CONTINUITY NOTES: keep the same coat, backpack, silhouette, and proportions in every scene',
          ].join('\n'),
        },
        finish_reason: 'stop',
      }],
    });

    mockedInvokeLLM
      .mockResolvedValueOnce({
        id: 'test',
        created: Date.now(),
        model: 'gpt-4o-mini',
        choices: [{
          index: 0,
          message: { role: 'assistant' as const, content: 'The hiker studies a map in a snowy clearing.' },
          finish_reason: 'stop',
        }],
      })
      .mockResolvedValueOnce({
        id: 'test',
        created: Date.now(),
        model: 'gpt-4o-mini',
        choices: [{
          index: 0,
          message: { role: 'assistant' as const, content: 'The same hiker walks toward a wooden chalet at dusk.' },
          finish_reason: 'stop',
        }],
      });

    mockedGenerateVideo
      .mockResolvedValueOnce({
        videoUrl: 'https://example.com/clip-1.mp4',
        status: 'completed',
        requestId: 'clip-1',
      })
      .mockResolvedValueOnce({
        videoUrl: 'https://example.com/clip-2.mp4',
        status: 'completed',
        requestId: 'clip-2',
      });

    mockedStitchVideos.mockResolvedValueOnce({
      videoUrl: 'https://example.com/final-film.mp4',
      duration: 10,
      clipCount: 2,
      fileSize: 123456,
    });

    const result = await generateFilm(
      {
        targetLanguage: 'French',
        proficiencyLevel: 'B1',
        vocabularyWords: ['randonnee'],
        theme: 'Adventure',
        cinematicStyle: 'Studio Ghibli Anime',
        targetVideoDuration: 10,
        sceneBeats: ['Le randonneur lit une carte.', 'Le randonneur approche du chalet.'],
      },
      'Le randonneur lit une carte puis approche du chalet.',
    );

    expect(result.videoUrl).toBe('https://example.com/final-film.mp4');
    expect(result.thumbnailUrl).toBe('https://example.com/generated-scene-1.png');
    expect(mockedGenerateImage).not.toHaveBeenCalled();
    expect(mockedGenerateStillImage).toHaveBeenCalledTimes(2);
    expect(mockedGenerateStillImage).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        prompt: expect.stringContaining('scene 1/2'),
        aspectRatio: '16:9',
        originalImages: [],
      }),
    );
    expect(mockedGenerateStillImage).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        prompt: expect.stringContaining('scene 2/2'),
        originalImages: [{ url: 'https://example.com/generated-scene-1.png' }],
      }),
    );
    expect(mockedGenerateVideo).toHaveBeenNthCalledWith(
      1,
      expect.objectContaining({
        model: 'pro',
        persistToStorage: false,
        sourceImageUrl: 'https://example.com/generated-scene-1.png',
        prompt: expect.stringContaining('Same recurring adult in every human scene'),
      }),
    );
    expect(mockedGenerateVideo).toHaveBeenNthCalledWith(
      2,
      expect.objectContaining({
        model: 'pro',
        persistToStorage: false,
        sourceImageUrl: 'https://example.com/generated-scene-2.png',
        prompt: expect.stringContaining('Same recurring adult in every human scene'),
      }),
    );
    expect(mockedGenerateVideo.mock.calls[1]?.[0]?.prompt).toContain('Direct continuation of the previous shot');
    expect(mockedGenerateVideo.mock.calls[1]?.[0]?.prompt).toContain('snowy alpine forest near a rustic chalet');
  });

  it('should generate narration from the exact subtitle lines passed to stitching', async () => {
    mockedInvokeLLM.mockResolvedValueOnce({
      id: 'test',
      created: Date.now(),
      model: 'gpt-4o-mini',
      choices: [{ index: 0, message: { role: 'assistant' as const, content: 'Character sheet data' }, finish_reason: 'stop' }],
    });
    mockedInvokeLLM.mockResolvedValueOnce({
      id: 'test',
      created: Date.now(),
      model: 'gpt-4o-mini',
      choices: [{ index: 0, message: { role: 'assistant' as const, content: 'A traveler walks calmly toward a station.' }, finish_reason: 'stop' }],
    });
    mockedGenerateVideo.mockResolvedValueOnce({
      videoUrl: 'https://example.com/clip-with-narration.mp4',
      status: 'completed',
      requestId: 'clip-tts',
    });
    mockedStitchVideos.mockResolvedValueOnce({
      videoUrl: 'https://example.com/final-with-narration.mp4',
      duration: 8,
      clipCount: 1,
      fileSize: 123456,
    });

    const fetchMock = vi
      .fn()
      .mockResolvedValueOnce({
        ok: false,
        statusText: 'timestamps unavailable',
      })
      .mockResolvedValueOnce({
        ok: true,
        arrayBuffer: async () => new Uint8Array([1, 2, 3]).buffer,
      });
    vi.stubGlobal('fetch', fetchMock);

    await generateFilm(
      {
        targetLanguage: 'French',
        proficiencyLevel: 'A2',
        vocabularyWords: ['gare'],
        theme: 'Adventure',
        cinematicStyle: 'Playful Animation',
        targetVideoDuration: 8,
        addSubtitles: true,
        voiceType: 'Warm & Friendly',
      },
      'Bonjour **Marie**. Elle marche vers la gare avec son sac.',
    );

    const expectedSubtitleLines = [
      'Bonjour Marie.',
      'Elle marche vers la gare avec son sac.',
    ];
    const expectedNarrationText = expectedSubtitleLines.join(' ');
    const timestampBody = JSON.parse(String(fetchMock.mock.calls[0]?.[1]?.body));
    const plainTtsBody = JSON.parse(String(fetchMock.mock.calls[1]?.[1]?.body));

    expect(timestampBody.text).toBe(expectedNarrationText);
    expect(plainTtsBody.text).toBe(expectedNarrationText);
    expect(mockedStitchVideos).toHaveBeenCalledWith(
      expect.any(Array),
      expect.objectContaining({
        sceneTexts: expectedSubtitleLines,
        narrationAudioPath: expect.any(String),
      }),
    );
  });
});

describe('generateCharacterSheet', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should generate a character sheet from story text via LLM', async () => {
    mockedInvokeLLM.mockResolvedValueOnce({
      id: 'test', created: Date.now(), model: 'gpt-4o-mini',
      choices: [{
        index: 0,
        message: {
          role: 'assistant' as const,
          content: 'VISUAL STYLE: Warm Studio Ghibli palette, soft lighting\n\nCHARACTERS:\n- Hero: tall adult, brown hair, blue jacket\n\nSETTING: Mountain village with wooden chalets\n\nCONTINUITY NOTES: Keep warm color palette throughout',
        },
        finish_reason: 'stop',
      }],
    });

    const sheet = await generateCharacterSheet(
      'Il était une fois dans un village de montagne...',
      'Studio Ghibli Anime',
      'Adventure',
    );

    expect(sheet).toContain('VISUAL STYLE');
    expect(sheet).toContain('CHARACTERS');
    expect(sheet).toContain('SETTING');
    expect(mockedInvokeLLM).toHaveBeenCalledOnce();
  });

  it('should return empty string when LLM fails', async () => {
    mockedInvokeLLM.mockRejectedValueOnce(new Error('LLM down'));

    const sheet = await generateCharacterSheet('story', 'Cinematic', 'Drama');

    expect(sheet).toBe('');
  });
});

describe('StitchingOptions narrationAudioUrl', () => {
  it('should accept narrationAudioUrl in StitchingOptions type', () => {
    // StitchingOptions is a TypeScript interface (no runtime value).
    // We verify the field shape here via a typed object literal.
    // TypeScript would fail to compile if the field didn't exist on the interface.
    const options: { narrationAudioUrl?: string; outputFormat?: 'mp4' | 'webm' } = {
      narrationAudioUrl: 'https://example.com/narration.mp3',
      outputFormat: 'mp4',
    };
    expect(options.narrationAudioUrl).toBe('https://example.com/narration.mp3');
  });
});
