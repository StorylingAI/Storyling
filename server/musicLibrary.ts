/**
 * Music Library Module
 * Curated royalty-free music tracks from Incompetech (Kevin MacLeod)
 * All tracks licensed under Creative Commons: By Attribution 4.0 License
 * http://creativecommons.org/licenses/by/4.0/
 */

export type MusicMood = 
  | 'calm' 
  | 'upbeat' 
  | 'dramatic' 
  | 'adventure' 
  | 'suspenseful'
  | 'romantic'
  | 'mysterious'
  | 'comedic'
  | 'energetic'
  | 'melancholic'
  | 'triumphant'
  | 'peaceful'
  | 'none';

export interface MusicTrack {
  id: string;
  mood: MusicMood;
  name: string;
  artist: string;
  duration: number; // in seconds
  description: string;
  previewUrl: string; // Direct URL to MP3
  fullUrl: string; // Full track URL
  bpm?: number;
  tags: string[];
  attribution: string;
}

/**
 * Curated music library with real royalty-free tracks from Incompetech
 * All tracks by Kevin MacLeod (incompetech.com)
 */
export const MUSIC_LIBRARY: Record<MusicMood, MusicTrack[]> = {
  calm: [
    {
      id: 'calm-1',
      mood: 'calm',
      name: 'Calmant',
      artist: 'Kevin MacLeod',
      duration: 200,
      description: 'Slow moving, semi-arpeggio piano theme',
      previewUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Calmant.mp3',
      fullUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Calmant.mp3',
      bpm: 58,
      tags: ['piano', 'relaxed', 'somber', 'peaceful'],
      attribution: 'Music by Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License',
    },
    {
      id: 'calm-2',
      mood: 'calm',
      name: 'Floating Cities',
      artist: 'Kevin MacLeod',
      duration: 249,
      description: 'Gentle ambient soundscape with soft textures',
      previewUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Floating%20Cities.mp3',
      fullUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Floating%20Cities.mp3',
      bpm: 0,
      tags: ['ambient', 'calm', 'peaceful', 'ethereal'],
      attribution: 'Music by Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License',
    },
    {
      id: 'calm-3',
      mood: 'calm',
      name: 'Meditation Impromptu 02',
      artist: 'Kevin MacLeod',
      duration: 180,
      description: 'Meditative piano with serene atmosphere',
      previewUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Meditation%20Impromptu%2002.mp3',
      fullUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Meditation%20Impromptu%2002.mp3',
      bpm: 0,
      tags: ['piano', 'meditation', 'calm', 'serene'],
      attribution: 'Music by Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License',
    },
  ],
  
  upbeat: [
    {
      id: 'upbeat-1',
      mood: 'upbeat',
      name: 'Funky Boxstep',
      artist: 'Kevin MacLeod',
      duration: 316,
      description: 'Grooving funk with uplifting energy',
      previewUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Funky%20Boxstep.mp3',
      fullUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Funky%20Boxstep.mp3',
      bpm: 95,
      tags: ['funk', 'grooving', 'uplifting', 'happy'],
      attribution: 'Music by Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License',
    },
    {
      id: 'upbeat-2',
      mood: 'upbeat',
      name: 'Wallpaper',
      artist: 'Kevin MacLeod',
      duration: 144,
      description: 'Cheerful and bright acoustic guitar',
      previewUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Wallpaper.mp3',
      fullUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Wallpaper.mp3',
      bpm: 120,
      tags: ['acoustic', 'cheerful', 'bright', 'happy'],
      attribution: 'Music by Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License',
    },
    {
      id: 'upbeat-3',
      mood: 'upbeat',
      name: 'Bossa Antigua',
      artist: 'Kevin MacLeod',
      duration: 246,
      description: 'Light bossa nova with positive vibes',
      previewUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Bossa%20Antigua.mp3',
      fullUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Bossa%20Antigua.mp3',
      bpm: 120,
      tags: ['bossa nova', 'positive', 'light', 'uplifting'],
      attribution: 'Music by Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License',
    },
  ],
  
  dramatic: [
    {
      id: 'dramatic-1',
      mood: 'dramatic',
      name: 'Impending Boom',
      artist: 'Kevin MacLeod',
      duration: 156,
      description: 'Driving, epic, intense and suspenseful',
      previewUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Impending%20Boom.mp3',
      fullUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Impending%20Boom.mp3',
      bpm: 60,
      tags: ['driving', 'epic', 'intense', 'mysterious', 'suspenseful'],
      attribution: 'Music by Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License',
    },
    {
      id: 'dramatic-2',
      mood: 'dramatic',
      name: 'Heroic Age',
      artist: 'Kevin MacLeod',
      duration: 202,
      description: 'Epic orchestral with powerful crescendos',
      previewUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Heroic%20Age.mp3',
      fullUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Heroic%20Age.mp3',
      bpm: 80,
      tags: ['orchestral', 'epic', 'powerful', 'dramatic'],
      attribution: 'Music by Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License',
    },
    {
      id: 'dramatic-3',
      mood: 'dramatic',
      name: 'Volatile Reaction',
      artist: 'Kevin MacLeod',
      duration: 223,
      description: 'Intense electronic with building tension',
      previewUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Volatile%20Reaction.mp3',
      fullUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Volatile%20Reaction.mp3',
      bpm: 140,
      tags: ['electronic', 'intense', 'tension', 'dramatic'],
      attribution: 'Music by Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License',
    },
  ],
  
  adventure: [
    {
      id: 'adventure-1',
      mood: 'adventure',
      name: 'Adventures in Adventureland',
      artist: 'Kevin MacLeod',
      duration: 261,
      description: 'Epic adventure theme with action',
      previewUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Adventures%20in%20Adventureland.mp3',
      fullUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Adventures%20in%20Adventureland.mp3',
      bpm: 135,
      tags: ['action', 'epic', 'adventure', 'exciting'],
      attribution: 'Music by Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License',
    },
    {
      id: 'adventure-2',
      mood: 'adventure',
      name: 'Dances and Dames',
      artist: 'Kevin MacLeod',
      duration: 138,
      description: 'Swashbuckling adventure with orchestral flair',
      previewUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Dances%20and%20Dames.mp3',
      fullUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Dances%20and%20Dames.mp3',
      bpm: 120,
      tags: ['orchestral', 'swashbuckling', 'adventure', 'exciting'],
      attribution: 'Music by Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License',
    },
    {
      id: 'adventure-3',
      mood: 'adventure',
      name: 'Intrepid',
      artist: 'Kevin MacLeod',
      duration: 196,
      description: 'Bold and courageous exploration theme',
      previewUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Intrepid.mp3',
      fullUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Intrepid.mp3',
      bpm: 120,
      tags: ['bold', 'courageous', 'exploration', 'adventure'],
      attribution: 'Music by Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License',
    },
  ],
  
  suspenseful: [
    {
      id: 'suspenseful-1',
      mood: 'suspenseful',
      name: 'Long Note Three',
      artist: 'Kevin MacLeod',
      duration: 192,
      description: 'Dark, mysterious, somber and suspenseful',
      previewUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Long%20Note%20Three.mp3',
      fullUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Long%20Note%20Three.mp3',
      bpm: 0,
      tags: ['dark', 'mysterious', 'somber', 'suspenseful'],
      attribution: 'Music by Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License',
    },
    {
      id: 'suspenseful-2',
      mood: 'suspenseful',
      name: 'Tenebrous Brothers Carnival',
      artist: 'Kevin MacLeod',
      duration: 207,
      description: 'Eerie carnival atmosphere with tension',
      previewUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Tenebrous%20Brothers%20Carnival%20-%20Act%20One.mp3',
      fullUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Tenebrous%20Brothers%20Carnival%20-%20Act%20One.mp3',
      bpm: 120,
      tags: ['eerie', 'carnival', 'tension', 'suspenseful'],
      attribution: 'Music by Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License',
    },
    {
      id: 'suspenseful-3',
      mood: 'suspenseful',
      name: 'Darkest Child',
      artist: 'Kevin MacLeod',
      duration: 159,
      description: 'Ominous and foreboding atmosphere',
      previewUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Darkest%20Child.mp3',
      fullUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Darkest%20Child.mp3',
      bpm: 120,
      tags: ['ominous', 'foreboding', 'dark', 'suspenseful'],
      attribution: 'Music by Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License',
    },
  ],
  
  romantic: [
    {
      id: 'romantic-1',
      mood: 'romantic',
      name: 'Valse Gymnopedie',
      artist: 'Kevin MacLeod',
      duration: 192,
      description: 'Calm, relaxed romantic waltz',
      previewUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Valse%20Gymnopedie.mp3',
      fullUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Valse%20Gymnopedie.mp3',
      bpm: 77,
      tags: ['classical', 'romantic', 'calm', 'relaxed'],
      attribution: 'Music by Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License',
    },
    {
      id: 'romantic-2',
      mood: 'romantic',
      name: 'Heartwarming',
      artist: 'Kevin MacLeod',
      duration: 138,
      description: 'Tender piano with emotional depth',
      previewUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Heartwarming.mp3',
      fullUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Heartwarming.mp3',
      bpm: 80,
      tags: ['piano', 'tender', 'emotional', 'romantic'],
      attribution: 'Music by Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License',
    },
    {
      id: 'romantic-3',
      mood: 'romantic',
      name: 'Dreamy Flashback',
      artist: 'Kevin MacLeod',
      duration: 180,
      description: 'Nostalgic and sentimental melody',
      previewUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Dreamy%20Flashback.mp3',
      fullUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Dreamy%20Flashback.mp3',
      bpm: 90,
      tags: ['nostalgic', 'sentimental', 'dreamy', 'romantic'],
      attribution: 'Music by Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License',
    },
  ],
  
  mysterious: [
    {
      id: 'mysterious-1',
      mood: 'mysterious',
      name: 'Ancient Mystery Waltz (Allegro)',
      artist: 'Kevin MacLeod',
      duration: 319,
      description: 'Mysterious and mystical world music',
      previewUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Ancient%20Mystery%20Waltz%20-%20Allegro.mp3',
      fullUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Ancient%20Mystery%20Waltz%20-%20Allegro.mp3',
      bpm: 113,
      tags: ['mysterious', 'mystical', 'world', 'enigmatic'],
      attribution: 'Music by Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License',
    },
    {
      id: 'mysterious-2',
      mood: 'mysterious',
      name: 'Echoes of Time',
      artist: 'Kevin MacLeod',
      duration: 240,
      description: 'Cryptic ambient with ethereal textures',
      previewUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Echoes%20of%20Time%20v2.mp3',
      fullUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Echoes%20of%20Time%20v2.mp3',
      bpm: 0,
      tags: ['cryptic', 'ambient', 'ethereal', 'mysterious'],
      attribution: 'Music by Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License',
    },
    {
      id: 'mysterious-3',
      mood: 'mysterious',
      name: 'Sneaky Snitch',
      artist: 'Kevin MacLeod',
      duration: 118,
      description: 'Playful mystery with quirky charm',
      previewUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Sneaky%20Snitch.mp3',
      fullUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Sneaky%20Snitch.mp3',
      bpm: 120,
      tags: ['playful', 'quirky', 'charming', 'mysterious'],
      attribution: 'Music by Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License',
    },
  ],
  
  comedic: [
    {
      id: 'comedic-1',
      mood: 'comedic',
      name: 'Boogie Party',
      artist: 'Kevin MacLeod',
      duration: 272,
      description: 'Humorous, bouncy and grooving',
      previewUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Boogie%20Party.mp3',
      fullUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Boogie%20Party.mp3',
      bpm: 178,
      tags: ['humorous', 'bouncy', 'grooving', 'playful'],
      attribution: 'Music by Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License',
    },
    {
      id: 'comedic-2',
      mood: 'comedic',
      name: 'Monkeys Spinning Monkeys',
      artist: 'Kevin MacLeod',
      duration: 54,
      description: 'Silly and lighthearted fun',
      previewUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Monkeys%20Spinning%20Monkeys.mp3',
      fullUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Monkeys%20Spinning%20Monkeys.mp3',
      bpm: 120,
      tags: ['silly', 'lighthearted', 'fun', 'comedic'],
      attribution: 'Music by Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License',
    },
    {
      id: 'comedic-3',
      mood: 'comedic',
      name: 'Fluffing a Duck',
      artist: 'Kevin MacLeod',
      duration: 124,
      description: 'Whimsical and amusing melody',
      previewUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Fluffing%20a%20Duck.mp3',
      fullUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Fluffing%20a%20Duck.mp3',
      bpm: 120,
      tags: ['whimsical', 'amusing', 'playful', 'comedic'],
      attribution: 'Music by Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License',
    },
  ],
  
  energetic: [
    {
      id: 'energetic-1',
      mood: 'energetic',
      name: 'Brain Dance',
      artist: 'Kevin MacLeod',
      duration: 215,
      description: 'Driving and energetic electronic',
      previewUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Brain%20Dance.mp3',
      fullUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Brain%20Dance.mp3',
      bpm: 124,
      tags: ['electronic', 'driving', 'energetic', 'dynamic'],
      attribution: 'Music by Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License',
    },
    {
      id: 'energetic-2',
      mood: 'energetic',
      name: 'Breaktime',
      artist: 'Kevin MacLeod',
      duration: 169,
      description: 'Fast-paced and lively rhythm',
      previewUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Breaktime%20-%20Silent%20Film%20Light.mp3',
      fullUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Breaktime%20-%20Silent%20Film%20Light.mp3',
      bpm: 180,
      tags: ['fast-paced', 'lively', 'energetic', 'upbeat'],
      attribution: 'Music by Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License',
    },
    {
      id: 'energetic-3',
      mood: 'energetic',
      name: 'Pixel Peeker Polka',
      artist: 'Kevin MacLeod',
      duration: 120,
      description: 'Bouncy and high-energy chiptune',
      previewUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Pixel%20Peeker%20Polka%20-%20Faster.mp3',
      fullUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Pixel%20Peeker%20Polka%20-%20Faster.mp3',
      bpm: 160,
      tags: ['bouncy', 'chiptune', 'energetic', 'playful'],
      attribution: 'Music by Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License',
    },
  ],
  
  melancholic: [
    {
      id: 'melancholic-1',
      mood: 'melancholic',
      name: 'Morning',
      artist: 'Kevin MacLeod',
      duration: 153,
      description: 'Somber, relaxed and melancholic',
      previewUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Morning.mp3',
      fullUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Morning.mp3',
      bpm: 60,
      tags: ['somber', 'relaxed', 'melancholic', 'reflective'],
      attribution: 'Music by Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License',
    },
    {
      id: 'melancholic-2',
      mood: 'melancholic',
      name: 'Gymnopedie No 1',
      artist: 'Kevin MacLeod',
      duration: 180,
      description: 'Deeply emotional and contemplative',
      previewUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Gymnopedie%20No%201.mp3',
      fullUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Gymnopedie%20No%201.mp3',
      bpm: 60,
      tags: ['emotional', 'contemplative', 'melancholic', 'classical'],
      attribution: 'Music by Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License',
    },
    {
      id: 'melancholic-3',
      mood: 'melancholic',
      name: 'Meditation',
      artist: 'Kevin MacLeod',
      duration: 240,
      description: 'Sad and introspective piano',
      previewUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Meditation.mp3',
      fullUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Meditation.mp3',
      bpm: 0,
      tags: ['sad', 'introspective', 'piano', 'melancholic'],
      attribution: 'Music by Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License',
    },
  ],
  
  triumphant: [
    {
      id: 'triumphant-1',
      mood: 'triumphant',
      name: 'Journey To Ascend',
      artist: 'Kevin MacLeod',
      duration: 219,
      description: 'Epic, uplifting and triumphant',
      previewUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Journey%20To%20Ascend.mp3',
      fullUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Journey%20To%20Ascend.mp3',
      bpm: 116,
      tags: ['epic', 'uplifting', 'triumphant', 'victorious'],
      attribution: 'Music by Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License',
    },
    {
      id: 'triumphant-2',
      mood: 'triumphant',
      name: 'Fanfare for Space',
      artist: 'Kevin MacLeod',
      duration: 37,
      description: 'Bold and celebratory brass fanfare',
      previewUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Fanfare%20for%20Space.mp3',
      fullUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Fanfare%20for%20Space.mp3',
      bpm: 120,
      tags: ['bold', 'celebratory', 'brass', 'triumphant'],
      attribution: 'Music by Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License',
    },
    {
      id: 'triumphant-3',
      mood: 'triumphant',
      name: 'Ascending',
      artist: 'Kevin MacLeod',
      duration: 180,
      description: 'Inspiring orchestral with rising energy',
      previewUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Ascending.mp3',
      fullUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Ascending.mp3',
      bpm: 100,
      tags: ['inspiring', 'orchestral', 'rising', 'triumphant'],
      attribution: 'Music by Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License',
    },
  ],
  
  peaceful: [
    {
      id: 'peaceful-1',
      mood: 'peaceful',
      name: 'Ethereal Relaxation',
      artist: 'Kevin MacLeod',
      duration: 1686,
      description: 'Calming, mystical and deeply relaxed',
      previewUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Ethereal%20Relaxation.mp3',
      fullUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Ethereal%20Relaxation.mp3',
      bpm: 0,
      tags: ['calming', 'mystical', 'relaxed', 'meditation'],
      attribution: 'Music by Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License',
    },
    {
      id: 'peaceful-2',
      mood: 'peaceful',
      name: 'Ambient Ambulance',
      artist: 'Kevin MacLeod',
      duration: 180,
      description: 'Tranquil ambient soundscape',
      previewUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Ambient%20Ambulance.mp3',
      fullUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Ambient%20Ambulance.mp3',
      bpm: 0,
      tags: ['tranquil', 'ambient', 'peaceful', 'serene'],
      attribution: 'Music by Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License',
    },
    {
      id: 'peaceful-3',
      mood: 'peaceful',
      name: 'Feather Waltz',
      artist: 'Kevin MacLeod',
      duration: 180,
      description: 'Gentle and soothing waltz',
      previewUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Feather%20Waltz.mp3',
      fullUrl: 'https://incompetech.com/music/royalty-free/mp3-royaltyfree/Feather%20Waltz.mp3',
      bpm: 90,
      tags: ['gentle', 'soothing', 'waltz', 'peaceful'],
      attribution: 'Music by Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0 License',
    },
  ],
  
  none: [],
};

/**
 * Get tracks by mood
 */
export function getTracksByMood(mood: MusicMood): MusicTrack[] {
  return MUSIC_LIBRARY[mood] || [];
}

/**
 * Get a random track for a given mood
 */
export function getRandomTrack(mood: MusicMood): MusicTrack | null {
  const tracks = getTracksByMood(mood);
  if (tracks.length === 0) return null;
  return tracks[Math.floor(Math.random() * tracks.length)];
}

/**
 * Get track by ID
 */
export function getTrackById(trackId: string): MusicTrack | null {
  for (const mood of Object.keys(MUSIC_LIBRARY) as MusicMood[]) {
    const track = MUSIC_LIBRARY[mood].find(t => t.id === trackId);
    if (track) return track;
  }
  return null;
}

/**
 * Get all available moods
 */
export function getAllMoods(): MusicMood[] {
  return Object.keys(MUSIC_LIBRARY).filter(mood => mood !== 'none') as MusicMood[];
}

/**
 * Get all available music moods (alias for compatibility)
 */
export function getAvailableMoods(): MusicMood[] {
  return getAllMoods();
}

/**
 * Get mood display name for UI
 */
export function getMoodDisplayName(mood: MusicMood): string {
  const displayNames: Record<MusicMood, string> = {
    calm: 'Calm & Peaceful',
    upbeat: 'Upbeat & Happy',
    dramatic: 'Dramatic & Intense',
    adventure: 'Adventure & Exciting',
    suspenseful: 'Suspenseful & Mysterious',
    romantic: 'Romantic & Tender',
    mysterious: 'Mysterious & Enigmatic',
    comedic: 'Comedic & Playful',
    energetic: 'Energetic & Dynamic',
    melancholic: 'Melancholic & Sad',
    triumphant: 'Triumphant & Victorious',
    peaceful: 'Peaceful & Meditative',
    none: 'No Music',
  };
  return displayNames[mood] || mood;
}
