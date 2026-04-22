import { useState, useEffect, useMemo, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Volume2, Loader2, Languages, CheckCircle2, Eye, EyeOff, PlusCircle, Crown, Lock } from "lucide-react";
import { VocabularyLimitSheet } from "@/components/upgrade/VocabularyLimitSheet";
import { PaywallModal } from "@/components/upgrade/PaywallModal";
import { trpc } from "@/lib/trpc";
import { pairPinyinWithChinese } from "@/lib/pinyinUtils";
import {
  normalizeLineTranslations,
  normalizeStringArray,
  safeString,
} from "@/lib/contentDisplay";

// Audio alignment data from ElevenLabs with-timestamps endpoint
interface AudioAlignment {
  characters: string[];
  character_start_times_seconds: number[];
  character_end_times_seconds: number[];
}

type StoryMediaRef =
  | React.RefObject<HTMLAudioElement | null>
  | React.RefObject<HTMLVideoElement | null>
  | React.RefObject<HTMLMediaElement | null>;

interface TimedSubtitleSegment {
  startTime: number;
  endTime: number;
  text: string;
}

interface SentenceDisplayProps {
  storyText?: unknown;
  vocabularyWords?: unknown;
  storyLanguage?: string;
  lineTranslations?: unknown;
  audioRef?: StoryMediaRef;
  isPlaying?: boolean;
  onSentenceChange?: (sentenceIndex: number) => void;
  audioAlignment?: AudioAlignment | null;
  subtitleSegments?: TimedSubtitleSegment[];
}

const HIGHLIGHT_AUDIO_DELAY_SECONDS = 0.6;

export function SentenceDisplay({
  storyText,
  vocabularyWords,
  storyLanguage = "unknown",
  lineTranslations,
  audioRef,
  isPlaying,
  onSentenceChange,
  audioAlignment,
  subtitleSegments,
}: SentenceDisplayProps) {
  const safeStoryText = useMemo(() => safeString(storyText), [storyText]);
  const safeVocabularyWords = useMemo(
    () => normalizeStringArray(vocabularyWords),
    [vocabularyWords],
  );
  const safeLineTranslations = useMemo(
    () => normalizeLineTranslations(lineTranslations),
    [lineTranslations],
  );
  
  const { data: user } = trpc.auth.me.useQuery();
  const [showVocabLimitSheet, setShowVocabLimitSheet] = useState(false);
  const [showLookupLimitPaywall, setShowLookupLimitPaywall] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [currentWordIndex, setCurrentWordIndex] = useState(0);
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [showVocabPopup, setShowVocabPopup] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showTranslations, setShowTranslations] = useState(() => {
    // Load translation preference from localStorage, default to true
    const saved = localStorage.getItem('storylingai-show-translations');
    return saved !== null ? saved === 'true' : true;
  });
  const [showPinyin, setShowPinyin] = useState(() => {
    // Load pinyin preference from localStorage, default to true
    const saved = localStorage.getItem('storylingai-show-pinyin');
    return saved !== null ? saved === 'true' : true;
  });
  const [showTranslationToggle, setShowTranslationToggle] = useState(true); // For example sentences in popup
  const [audioDuration, setAudioDuration] = useState<number>(0);
  const [playingCharacter, setPlayingCharacter] = useState<string | null>(null);
  const [characterAudioCache, setCharacterAudioCache] = useState<Record<string, string>>({});
  const [vocabAudioCache, setVocabAudioCache] = useState<Record<string, string>>({});
  const [playingVocabWord, setPlayingVocabWord] = useState<string | null>(null);
  const vocabAudioRef = useRef<HTMLAudioElement | null>(null);
  const longPressTimerRef = useRef<NodeJS.Timeout | null>(null);
  const wordAudioRef = useRef<HTMLAudioElement | null>(null);
  const characterAudioRef = useRef<HTMLAudioElement | null>(null);

  const timedSubtitleSegments = useMemo(() => {
    return (subtitleSegments || [])
      .map((segment) => ({
        startTime: Number(segment.startTime),
        endTime: Number(segment.endTime),
        text: safeString(segment.text).replace(/\s+/g, ' ').trim(),
      }))
      .filter(
        (segment) =>
          Number.isFinite(segment.startTime) &&
          Number.isFinite(segment.endTime) &&
          segment.endTime > segment.startTime &&
          segment.text.length > 0,
      )
      .sort((a, b) => a.startTime - b.startTime);
  }, [subtitleSegments]);
  
  // Track audio duration changes
  useEffect(() => {
    const audio = audioRef?.current;
    if (!audio) return;
    
    const handleLoadedMetadata = () => {
      // Audio metadata loaded
      setAudioDuration(audio.duration);
    };
    
    if (audio.duration) {
      setAudioDuration(audio.duration);
    }
    
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    return () => audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
  }, [audioRef]);

  // Split story into sentences
  const sentences = useMemo(() => {
    if (timedSubtitleSegments.length > 0) {
      return timedSubtitleSegments.map((segment) => segment.text);
    }

    // Split by sentence boundaries (English: . ! ? and Chinese: 。！？)
    const sentenceArray = safeStoryText
      .split(/([.!?。！？]+)/)
      .reduce((acc: string[], curr, idx, arr) => {
        if (idx % 2 === 0 && curr.trim()) {
          const punctuation = arr[idx + 1] || "";
          acc.push((curr + punctuation).trim());
        }
        return acc;
      }, [])
      .filter((s) => s.length > 0);
    
    return sentenceArray.length > 0 ? sentenceArray : [safeStoryText];
  }, [safeStoryText, timedSubtitleSegments]);

  // Build a clean text version that matches what ElevenLabs received
  const cleanStoryText = useMemo(() => {
    const timingText = timedSubtitleSegments.length > 0
      ? timedSubtitleSegments.map((segment) => segment.text).join(' ')
      : safeStoryText;

    return timingText
      .replace(/\*\*(.+?)\*\*/g, '$1')
      .replace(/\*(.+?)\*/g, '$1')
      .replace(/_(.+?)_/g, '$1')
      .replace(/~~(.+?)~~/g, '$1');
  }, [safeStoryText, timedSubtitleSegments]);

  const safeAudioAlignment = useMemo(() => {
    if (
      !audioAlignment ||
      !Array.isArray(audioAlignment.characters) ||
      !Array.isArray(audioAlignment.character_start_times_seconds) ||
      !Array.isArray(audioAlignment.character_end_times_seconds)
    ) {
      return null;
    }

    const minLength = Math.min(
      audioAlignment.characters.length,
      audioAlignment.character_start_times_seconds.length,
      audioAlignment.character_end_times_seconds.length
    );

    if (minLength === 0) {
      return null;
    }

    return {
      characters: audioAlignment.characters.slice(0, minLength),
      character_start_times_seconds: audioAlignment.character_start_times_seconds
        .slice(0, minLength)
        .map((value) => Number(value)),
      character_end_times_seconds: audioAlignment.character_end_times_seconds
        .slice(0, minLength)
        .map((value) => Number(value)),
    };
  }, [audioAlignment]);

  // Calculate sentence timestamps using real alignment data or improved weighted fallback
  const sentenceTimestamps = useMemo(() => {
    if (!sentences.length) {
      return [];
    }

    if (timedSubtitleSegments.length > 0) {
      return timedSubtitleSegments.map((segment) => ({
        sentence: segment.text,
        startTime: segment.startTime,
        endTime: segment.endTime,
      }));
    }

    if (!audioDuration) {
      return [];
    }

    // === STRATEGY 1: Use real ElevenLabs alignment data ===
    if (safeAudioAlignment) {
      const alignChars = safeAudioAlignment.characters;
      const startTimes = safeAudioAlignment.character_start_times_seconds;
      const endTimes = safeAudioAlignment.character_end_times_seconds;
      
      // Build the aligned text from the alignment characters
      const alignedText = alignChars.join('');
      
      // For each sentence, find its position in the aligned text
      const timestamps: Array<{ sentence: string; startTime: number; endTime: number }> = [];
      let searchPos = 0;
      
      for (const sentence of sentences) {
        // Clean the sentence of markdown for matching against aligned text
        const cleanSentence = sentence
          .replace(/\*\*(.+?)\*\*/g, '$1')
          .replace(/\*(.+?)\*/g, '$1')
          .replace(/_(.+?)_/g, '$1')
          .replace(/~~(.+?)~~/g, '$1');
        
        // Find this sentence in the aligned text
        const matchIdx = alignedText.indexOf(cleanSentence, searchPos);
        
        if (matchIdx !== -1) {
          const sentenceEndIdx = matchIdx + cleanSentence.length - 1;
          const startTime = startTimes[matchIdx] ?? 0;
          const endTime = sentenceEndIdx < endTimes.length 
            ? endTimes[sentenceEndIdx] 
            : endTimes[endTimes.length - 1] ?? audioDuration;
          
          timestamps.push({ sentence, startTime, endTime });
          searchPos = matchIdx + cleanSentence.length;
        } else {
          // Fuzzy fallback: try to find approximate position
          let bestMatch = -1;
          let bestScore = 0;
          const searchEnd = Math.min(searchPos + cleanSentence.length * 3, alignedText.length);
          
          for (let i = searchPos; i < searchEnd; i++) {
            let score = 0;
            for (let j = 0; j < Math.min(cleanSentence.length, alignedText.length - i); j++) {
              if (alignedText[i + j] === cleanSentence[j]) score++;
            }
            if (score > bestScore) {
              bestScore = score;
              bestMatch = i;
            }
          }
          
          if (bestMatch !== -1 && bestScore > cleanSentence.length * 0.5) {
            const sentenceEndIdx = Math.min(bestMatch + cleanSentence.length - 1, endTimes.length - 1);
            const startTime = startTimes[bestMatch] ?? 0;
            const endTime = endTimes[sentenceEndIdx] ?? audioDuration;
            timestamps.push({ sentence, startTime, endTime });
            searchPos = bestMatch + cleanSentence.length;
          } else {
            // Last resort: estimate from previous timestamp
            const prevEnd = timestamps.length > 0 ? timestamps[timestamps.length - 1].endTime : 0;
            const estimatedDuration = (cleanSentence.length / cleanStoryText.length) * audioDuration;
            timestamps.push({ sentence, startTime: prevEnd, endTime: prevEnd + estimatedDuration });
            searchPos += cleanSentence.length;
          }
        }
      }
      
      return timestamps;
    }

    // === STRATEGY 2: Improved weighted estimation (for existing stories without alignment) ===
    // Instead of equal character weighting, account for:
    // - Punctuation pauses (periods, commas, question marks add time)
    // - Sentence boundaries (natural pauses between sentences)
    // - Whitespace (spaces are faster than characters)
    
    const calculateSpeechWeight = (text: string): number => {
      let weight = 0;
      for (const char of text) {
        if (/[.!?\u3002\uff01\uff1f]/.test(char)) {
          weight += 4.0; // Long pause for sentence-ending punctuation
        } else if (/[,;:\uff0c\uff1b\uff1a]/.test(char)) {
          weight += 2.5; // Medium pause for mid-sentence punctuation
        } else if (/["'()\uff08\uff09\u201c\u201d]/.test(char)) {
          weight += 0.3; // Minimal time for quotes/brackets
        } else if (/\s/.test(char)) {
          weight += 0.5; // Short pause for spaces
        } else if (/[\u4e00-\u9fa5]/.test(char)) {
          weight += 1.8; // Chinese characters take longer to speak
        } else {
          weight += 1.0; // Normal character
        }
      }
      return weight;
    };
    
    // Add inter-sentence pause weight
    const SENTENCE_PAUSE_WEIGHT = 3.0;
    
    const sentenceWeights = sentences.map(s => calculateSpeechWeight(s) + SENTENCE_PAUSE_WEIGHT);
    const totalWeight = sentenceWeights.reduce((sum, w) => sum + w, 0);
    
    let currentTime = 0;
    const timestamps = sentences.map((sentence, idx) => {
      const startTime = currentTime;
      const duration = (sentenceWeights[idx] / totalWeight) * audioDuration;
      const endTime = startTime + duration;
      currentTime = endTime;
      return { sentence, startTime, endTime };
    });
    
    return timestamps;
  }, [sentences, cleanStoryText, audioDuration, safeAudioAlignment, timedSubtitleSegments]);


  // Update current sentence based on audio time
  useEffect(() => {
    
    if (!audioRef?.current || !isPlaying || sentenceTimestamps.length === 0) {
      // Conditions not met for sentence tracking
      return;
    }

    // Starting sentence tracking
    const audio = audioRef.current;
    
    const updateSentenceIndex = () => {
      const currentTime = Math.max(0, audio.currentTime - HIGHLIGHT_AUDIO_DELAY_SECONDS);
      
      
      // Find the sentence that contains the current time
      // For the last sentence, include times >= endTime
      let newIndex = -1;
      for (let i = 0; i < sentenceTimestamps.length; i++) {
        const st = sentenceTimestamps[i];
        const isLastSentence = i === sentenceTimestamps.length - 1;
        
        if (isLastSentence) {
          // For last sentence, include all times from startTime onwards
          if (currentTime >= st.startTime) {
            newIndex = i;
            break;
          }
        } else {
          // For other sentences, use the standard range check
          if (currentTime >= st.startTime && currentTime < st.endTime) {
            newIndex = i;
            break;
          }
        }
      }
      
      if (newIndex !== -1 && newIndex !== currentSentenceIndex) {
        // Advancing sentence
        setCurrentSentenceIndex(newIndex);
        onSentenceChange?.(newIndex);
      }
    };

    const interval = setInterval(updateSentenceIndex, 100);
    return () => clearInterval(interval);
  }, [audioRef, isPlaying, sentenceTimestamps, currentSentenceIndex]);

  // Note: We don't reset sentence index when paused to maintain position
  // Only reset when audio actually ends (handled by onEnded event in parent)

  const currentSentence = sentences[currentSentenceIndex] || sentences[0] || "";

  // Find the matching translation for the current sentence
  // Match by content (ignoring asterisks and extra whitespace)
  const currentTranslation = useMemo(() => {
    if (safeLineTranslations.length === 0) return null;
    
    // Clean the current sentence for matching (remove asterisks and normalize whitespace)
    const cleanSentence = currentSentence.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
    
    // Find translation where the original text matches (also cleaned)
    const match = safeLineTranslations.find(t => {
      const cleanOriginal = t.original.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
      return cleanOriginal === cleanSentence || cleanOriginal.includes(cleanSentence) || cleanSentence.includes(cleanOriginal);
    });
    
    return match || safeLineTranslations[currentSentenceIndex] || null;
  }, [currentSentence, currentSentenceIndex, safeLineTranslations]);

  // Helper function to check if a word is in vocabulary list
  const isVocabularyWord = (word: string): boolean => {
    const cleanWord = word.replace(/[.,!?;:"'\u00BF\u00A1*]/g, '').toLowerCase();
    return safeVocabularyWords.some(vw => vw.toLowerCase() === cleanWord);
  };

  // Split current sentence into words
  const words = useMemo(() => {
    // For Spanish/English: split by spaces, keeping punctuation with words
    // For Chinese: each character is a word
    if (/[\u4e00-\u9fa5]/.test(currentSentence)) {
      // Chinese: split into individual characters
      return currentSentence.split('').filter(c => c.trim().length > 0);
    } else {
      // Spanish/English: split by spaces
      return currentSentence.split(/\s+/).filter(w => w.length > 0);
    }
  }, [currentSentence]);

  // Calculate word timestamps within current sentence
  const wordTimestamps = useMemo(() => {
    if (!sentenceTimestamps[currentSentenceIndex]) {
      return [];
    }

    const sentenceStart = sentenceTimestamps[currentSentenceIndex].startTime;
    const sentenceEnd = sentenceTimestamps[currentSentenceIndex].endTime;
    const sentenceDuration = sentenceEnd - sentenceStart;

    // === Use alignment data for precise word timing ===
    if (safeAudioAlignment) {
      const alignChars = safeAudioAlignment.characters;
      const startTimes = safeAudioAlignment.character_start_times_seconds;
      const endTimes = safeAudioAlignment.character_end_times_seconds;
      const alignedText = alignChars.join('');
      
      // Find where the current sentence starts in the aligned text
      const cleanSentence = currentSentence
        .replace(/\*\*(.+?)\*\*/g, '$1')
        .replace(/\*(.+?)\*/g, '$1')
        .replace(/_(.+?)_/g, '$1')
        .replace(/~~(.+?)~~/g, '$1');
      
      // Use the sentence start time to find approximate position
      let sentenceCharIdx = -1;
      for (let i = 0; i < startTimes.length; i++) {
        if (Math.abs(startTimes[i] - sentenceStart) < 0.05) {
          sentenceCharIdx = i;
          break;
        }
      }

      if (sentenceCharIdx === -1) {
        const directMatchIdx = alignedText.indexOf(cleanSentence);
        if (directMatchIdx !== -1) {
          sentenceCharIdx = directMatchIdx;
        }
      }

      if (sentenceCharIdx === -1) {
        const compactSentence = cleanSentence.replace(/\s+/g, '');
        const compactAligned = alignedText.replace(/\s+/g, '');
        const compactIdx = compactAligned.indexOf(compactSentence);

        if (compactIdx !== -1) {
          let compactPosition = 0;
          for (let i = 0; i < alignChars.length; i++) {
            if (/\s/.test(alignChars[i])) continue;
            if (compactPosition === compactIdx) {
              sentenceCharIdx = i;
              break;
            }
            compactPosition += 1;
          }
        }
      }
      
      // If we found the sentence position, map words to alignment timestamps
      if (sentenceCharIdx !== -1) {
        let charOffset = sentenceCharIdx;
        const isCharacterBased = /[\u4e00-\u9fa5]/.test(cleanSentence);

        return words.map((word) => {
          const cleanWord = word.replace(/\*\*/g, '');

          while (charOffset < alignChars.length && /\s/.test(alignChars[charOffset])) {
            charOffset += 1;
          }

          const wordStartIdx = charOffset;
          const wordEndIdx = Math.min(charOffset + cleanWord.length - 1, endTimes.length - 1);
          
          const wordStart = wordStartIdx < startTimes.length ? startTimes[wordStartIdx] : sentenceStart;
          const wordEnd = wordEndIdx < endTimes.length ? endTimes[wordEndIdx] : sentenceEnd;
          
          charOffset = wordEndIdx + 1;
          if (!isCharacterBased) {
            while (charOffset < alignChars.length && /\s/.test(alignChars[charOffset])) {
              charOffset += 1;
            }
          }
          
          return { word, startTime: wordStart, endTime: wordEnd };
        });
      }
    }

    // === Improved weighted fallback for word timing ===
    const calculateWordWeight = (w: string): number => {
      let weight = 0;
      for (const char of w) {
        if (/[.!?,;:\u3002\uff01\uff1f\uff0c\uff1b\uff1a]/.test(char)) {
          weight += 2.0;
        } else if (/[\u4e00-\u9fa5]/.test(char)) {
          weight += 1.8;
        } else {
          weight += 1.0;
        }
      }
      return weight + 0.3; // Add small weight for inter-word pause
    };

    const wordWeights = words.map(w => calculateWordWeight(w));
    const totalWeight = wordWeights.reduce((sum, w) => sum + w, 0);
    
    let currentTime = sentenceStart;
    return words.map((word, idx) => {
      const wordStart = currentTime;
      const wordDuration = (wordWeights[idx] / totalWeight) * sentenceDuration;
      const wordEnd = wordStart + wordDuration;
      currentTime = wordEnd;
      return { word, startTime: wordStart, endTime: wordEnd };
    });
  }, [words, currentSentence, sentenceTimestamps, currentSentenceIndex, audioRef, safeAudioAlignment]);


  // Update current word based on audio time
  useEffect(() => {
    if (!audioRef?.current || !isPlaying || wordTimestamps.length === 0) {
      return;
    }

    const audio = audioRef.current;

    const updateWordIndex = () => {
      const currentTime = Math.max(0, audio.currentTime - HIGHLIGHT_AUDIO_DELAY_SECONDS);
      const newIndex = wordTimestamps.findIndex(
        (wt) => currentTime >= wt.startTime && currentTime < wt.endTime
      );

      if (newIndex !== -1 && newIndex !== currentWordIndex) {
        setCurrentWordIndex(newIndex);
      }
    };

    const interval = setInterval(updateWordIndex, 50);
    return () => clearInterval(interval);
  }, [audioRef, isPlaying, wordTimestamps, currentWordIndex]);

  // Reset word index when sentence changes
  useEffect(() => {
    setCurrentWordIndex(0);
  }, [currentSentenceIndex]);

  // Fetch word translation when selected
  // targetLanguage should be the user's preferred language (the language to translate TO)
  const userLanguage = user?.preferredLanguage || "en";
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const { data: wordData, isLoading: isLoadingWord, error: wordError } = trpc.wordbank.translateWord.useQuery(
    { word: selectedWord || "", targetLanguage: userLanguage, timezone },
    { 
      enabled: !!selectedWord && showVocabPopup,
      retry: 1
    }
  );
  const isLookupLimitHit = wordError?.message?.includes("lookups") && wordError?.data?.code === "FORBIDDEN";
  
  // Log query state for debugging
  useEffect(() => {
    if (showVocabPopup && selectedWord) {
      console.log("[translateWord] Query state:", {
        selectedWord,
        userLanguage,
        enabled: !!selectedWord && showVocabPopup,
        isLoading: isLoadingWord,
        hasData: !!wordData,
        error: wordError?.message
      });
      if (wordData) {
        console.log("[translateWord] Word data:", wordData);
      }
      if (wordError) {
        console.error("[translateWord] Error details:", wordError);
      }
    }
  }, [showVocabPopup, selectedWord, userLanguage, isLoadingWord, wordData, wordError]);

  // Check if word already exists in wordbank
  const { data: wordExistsData } = trpc.wordbank.checkWordExists.useQuery(
    { word: selectedWord || "", targetLanguage: wordData?.sourceLanguage || "" },
    { enabled: !!selectedWord && !!wordData?.sourceLanguage && showVocabPopup }
  );
  const isWordInWordbank = wordExistsData?.exists || false;

  // Generate word audio mutation
  const generateAudio = trpc.wordbank.generateWordAudio.useMutation();

  // Save word to wordbank mutation
  const utils = trpc.useUtils();
  const [justSaved, setJustSaved] = useState(false);
  
  const addToWordbank = trpc.wordbank.saveWord.useMutation({
    onSuccess: () => {
      // Show success state briefly before closing
      setJustSaved(true);
      // Invalidate wordbank queries to refresh data
      utils.wordbank.checkWordExists.invalidate();
      // Close popup after showing success
      setTimeout(() => {
        setShowVocabPopup(false);
        setJustSaved(false);
      }, 1000);
    },
  });

  // Handle vocabulary word pronunciation on click
  const handleVocabPronunciation = async (word: string) => {
    const cleanWord = word.replace(/[.,!?；:""¿¡*，。！？；：""''（）、《》【】]/g, '');
    
    // Skip if already playing this word
    if (playingVocabWord === cleanWord) {
      return;
    }
    
    setPlayingVocabWord(cleanWord);
    
    try {
      // Check cache first
      let audioUrl = vocabAudioCache[cleanWord];
      
      if (!audioUrl) {
        // Generate audio for the vocabulary word
        const result = await generateAudio.mutateAsync({
          word: cleanWord,
          targetLanguage: storyLanguage || 'unknown',
        });
        audioUrl = result.audioUrl;
        
        // Cache the audio URL
        if (audioUrl) {
          setVocabAudioCache(prev => ({ ...prev, [cleanWord]: audioUrl }));
        }
      }
      
      if (audioUrl && vocabAudioRef.current) {
        vocabAudioRef.current.src = audioUrl;
        vocabAudioRef.current.onended = () => setPlayingVocabWord(null);
        vocabAudioRef.current.onerror = () => setPlayingVocabWord(null);
        await vocabAudioRef.current.play();
      } else {
        setPlayingVocabWord(null);
      }
    } catch (error) {
      console.error("Failed to generate vocabulary audio:", error);
      setPlayingVocabWord(null);
    }
  };

  // Handle word click (show translation popup)
  const handleWordClick = (word: string) => {
    // Clean the word of punctuation before setting
    const cleanWord = word.replace(/[.,!?；:""¿¡*，。！？；：""''（）、《》【】]/g, '');
    console.log("[handleWordClick] Word clicked:", word, "-> cleaned:", cleanWord);
    
    if (cleanWord) {
      setSelectedWord(cleanWord);
      setShowVocabPopup(true);
    }
  };

  // Handle play audio
  const handlePlayAudio = async () => {
    if (!selectedWord || !wordData) return;
    
    try {
      const result = await generateAudio.mutateAsync({
        word: selectedWord,
        targetLanguage: wordData.sourceLanguage || storyLanguage,
      });
      
      if (result.audioUrl && wordAudioRef.current) {
        wordAudioRef.current.src = result.audioUrl;
        setIsPlayingAudio(true);
        
        wordAudioRef.current.onended = () => setIsPlayingAudio(false);
        wordAudioRef.current.onerror = () => setIsPlayingAudio(false);
        
        await wordAudioRef.current.play();
      }
    } catch (error) {
      console.error("Failed to generate audio:", error);
      setIsPlayingAudio(false);
    }
  };

  // Get today's wordbank count for free users (daily vocabulary limit trigger)
  const { data: todayVocabData } = trpc.wordbank.getTodayWordCount.useQuery(undefined, {
    enabled: !!user && user.subscriptionTier === "free",
  });
  const currentWordCount = todayVocabData?.count ?? 0;
  const FREE_VOCAB_LIMIT = todayVocabData?.limit ?? 3;

  // Handle add to wordbank
  const handleAddToWordbank = async () => {
    if (!selectedWord || !wordData) return;

    // Upgrade Trigger #3: Check vocabulary limit for free users
    if (user?.subscriptionTier === "free" && currentWordCount >= FREE_VOCAB_LIMIT) {
      setShowVocabLimitSheet(true);
      return;
    }
    
    try {
      await addToWordbank.mutateAsync({
        word: selectedWord,
        translation: wordData.translation,
        targetLanguage: wordData.sourceLanguage || storyLanguage,
        exampleSentences: wordData.exampleSentences || [],
      });
    } catch (error) {
      console.error("Failed to add to wordbank:", error);
    }
  };

  // Handle click-to-hear for individual characters
  const handleCharacterClick = async (character: string) => {
    // Skip punctuation and spaces
    if (/[\u3000-\u303F\uFF00-\uFFEF,.!?;:'"()\[\]{}\s]/.test(character)) {
      return;
    }
    
    // Check if already playing
    if (playingCharacter === character) {
      return;
    }
    
    setPlayingCharacter(character);
    
    try {
      // Check cache first
      let audioUrl = characterAudioCache[character];
      
      if (!audioUrl) {
        // Generate audio for the character
        const result = await generateAudio.mutateAsync({
          word: character,
          targetLanguage: storyLanguage || 'chinese',
        });
        audioUrl = result.audioUrl;
        
        // Cache the audio URL
        if (audioUrl) {
          setCharacterAudioCache(prev => ({ ...prev, [character]: audioUrl }));
        }
      }
      
      if (audioUrl && characterAudioRef.current) {
        characterAudioRef.current.src = audioUrl;
        characterAudioRef.current.onended = () => setPlayingCharacter(null);
        characterAudioRef.current.onerror = () => setPlayingCharacter(null);
        await characterAudioRef.current.play();
      } else {
        setPlayingCharacter(null);
      }
    } catch (error) {
      console.error("Failed to generate character audio:", error);
      setPlayingCharacter(null);
    }
  };

  // Cleanup long press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
      }
    };
  }, []);

  // Check if Chinese content
  const storyLanguageLower = storyLanguage?.toLowerCase() || "";
  const isChinese =
    storyLanguageLower.includes('chinese') ||
    storyLanguageLower.includes('mandarin') ||
    /[\u4e00-\u9fa5]/.test(currentSentence);
  const hasPinyin = currentTranslation?.pinyin;

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] px-3 sm:px-8 py-8 sm:py-12 relative overflow-hidden">
      {/* Header with sentence counter and pinyin toggle */}
      <div className="flex items-center justify-between w-full max-w-3xl mb-4">
        <div className="text-sm text-muted-foreground">
          {currentSentenceIndex + 1} / {sentences.length}
        </div>
        <div className="flex gap-2">
          {isChinese && hasPinyin && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                const newValue = !showPinyin;
                setShowPinyin(newValue);
                localStorage.setItem('storylingai-show-pinyin', String(newValue));
              }}
              className="gap-2"
            >
              {showPinyin ? (
                <>
                  <EyeOff className="h-4 w-4" />
                  Hide Pinyin
                </>
              ) : (
                <>
                  <Eye className="h-4 w-4" />
                  Show Pinyin
                </>
              )}
            </Button>
          )}
        </div>
      </div>

      {/* Current sentence display with word-level highlighting */}
      <div className="text-center max-w-3xl w-full flex-1 flex flex-col items-center justify-center overflow-hidden">
        {/* Show pinyin above Chinese text with one explicit column per character. */}
        {showPinyin && hasPinyin && isChinese ? (
          <div className="mb-2 w-full max-w-full sm:max-w-4xl overflow-hidden">
            <div className="flex flex-wrap items-end justify-center gap-x-1 gap-y-3 text-lg sm:text-2xl md:text-3xl font-medium text-foreground leading-none">
              {(() => {
                let spokenIndex = -1;
                return pairPinyinWithChinese(currentSentence, currentTranslation.pinyin || '').map((pair, idx) => {
                  if (!pair.chinese) return null;

                  const hasSpokenCharacter = pair.chinese.trim().length > 0;
                  if (hasSpokenCharacter) {
                    spokenIndex += 1;
                  }

                  if (!pair.pinyin) {
                    return (
                      <span key={idx} className="inline-flex min-h-[2.4em] items-end">
                        {pair.chinese}
                      </span>
                    );
                  }

                  const isPlayingThis = playingCharacter === pair.chinese;
                  const isHighlighted = spokenIndex === currentWordIndex && isPlaying;

                  return (
                    <span key={idx} className="inline-flex min-w-[1.3em] flex-col items-center">
                      <span
                        className={`mb-1 text-[0.45em] leading-none font-medium whitespace-nowrap transition-colors ${
                          isHighlighted ? 'text-blue-500' : isPlayingThis ? 'text-primary' : 'text-amber-600'
                        }`}
                      >
                        {pair.pinyin.replace(/\*\*/g, '')}
                      </span>
                      <span
                        className={`cursor-pointer transition-all duration-200 ${
                          isHighlighted
                            ? 'text-blue-500 font-bold underline decoration-2 underline-offset-4 bg-blue-50 rounded px-0.5'
                            : isPlayingThis
                            ? 'text-primary scale-110 bg-primary/10 rounded px-0.5'
                            : 'hover:text-primary hover:scale-105'
                        }`}
                        onClick={() => {
                          handleWordClick(pair.chinese);
                        }}
                        onContextMenu={(e) => e.preventDefault()}
                      >
                        {pair.chinese}
                      </span>
                    </span>
                  );
                });
              })()}
            </div>
          </div>
        ) : (
          <p className="text-base sm:text-2xl md:text-3xl leading-relaxed font-medium text-foreground" style={{ overflowWrap: 'anywhere', wordBreak: 'normal', hyphens: 'auto' } as React.CSSProperties}>
            {words.map((word, idx) => {
              const isVocab = isVocabularyWord(word);
              const isHighlighted = idx === currentWordIndex && isPlaying;
              
              const cleanWord = word.replace(/[.,!?；:""¿¡*，。！？；：""''（）、《》【】]/g, '');
              const isPlayingThis = playingVocabWord === cleanWord;
              
              return (
              <span
                key={idx}
                  className={`transition-all duration-200 cursor-pointer hover:opacity-70 relative inline items-center gap-1 ${
                    isHighlighted
                      ? "text-blue-500 font-bold underline decoration-2 underline-offset-4"
                      : isVocab
                      ? "font-bold text-primary border-b-2 border-dotted border-primary"
                      : ""
                  } ${
                    isPlayingThis ? "scale-105 bg-primary/10 rounded px-1" : ""
                  }`}
                  onClick={() => {
                    handleWordClick(word);
                  }}
                  onContextMenu={(e) => e.preventDefault()}
                >
                  {isVocab && isPlayingThis && (
                    <Volume2 className="h-3 w-3 text-primary inline animate-pulse" />
                  )}
                  {word.replace(/\*/g, '')}{idx < words.length - 1 && !/[\u4e00-\u9fa5]/.test(word) ? '\u00A0' : ''}
                </span>
              );
            })}
          </p>
        )}
        
        {/* English translation below the sentence */}
        {showTranslations && currentTranslation && (
          <p className="text-lg md:text-xl mt-4 text-muted-foreground italic">
            {currentTranslation.english.replace(/\*\*/g, '')}
          </p>
        )}
      </div>

      {/* Hide Translation button - positioned at bottom right */}
      <div className="absolute bottom-4 right-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            const newValue = !showTranslations;
            setShowTranslations(newValue);
            localStorage.setItem('storylingai-show-translations', String(newValue));
          }}
          className="gap-2"
        >
          {showTranslations ? (
            <>
              <EyeOff className="h-4 w-4" />
              Hide Translation
            </>
          ) : (
            <>
              <Eye className="h-4 w-4" />
              Show Translation
            </>
          )}
        </Button>
      </div>

      {/* Hidden audio element for word pronunciation */}
      <audio ref={wordAudioRef} className="hidden" />
      
      {/* Hidden audio element for character click-to-hear */}
      <audio ref={characterAudioRef} className="hidden" />
      
      {/* Hidden audio element for vocabulary word pronunciation */}
      <audio ref={vocabAudioRef} className="hidden" />

      {/* Vocabulary popup */}
      <Dialog open={showVocabPopup} onOpenChange={setShowVocabPopup}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Word Definition</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {isLoadingWord ? (
              <div className="text-center py-4">Loading...</div>
            ) : wordData ? (
              <>
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <p className="text-2xl font-bold text-foreground">
                      {wordData.word}
                    </p>
                    {isWordInWordbank && (
                      <div className="flex items-center gap-1 px-2 py-1 rounded-full bg-green-100 text-green-700 text-xs font-medium">
                        <CheckCircle2 className="h-3 w-3" />
                        <span>In Wordbank</span>
                      </div>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handlePlayAudio}
                      disabled={generateAudio.isPending || isPlayingAudio}
                      className="h-8 w-8"
                    >
                      {generateAudio.isPending || isPlayingAudio ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                  {wordData.pinyin && (
                    <p className="text-base text-amber-600 mb-1 font-medium">
                      {wordData.pinyin}
                    </p>
                  )}
                  <p className="text-lg text-muted-foreground mb-1">
                    {wordData.translation}
                  </p>
                  <p className="text-sm text-muted-foreground mb-3">
                    {wordData.definition}
                  </p>
                  
                  {/* HSK Level and Frequency Badges */}
                  {(wordData.hskLabel || wordData.frequencyLabel) && (
                    <div className="flex gap-2 mb-3">
                      {wordData.hskLabel && (
                        <div className={`px-2 py-1 rounded-md text-xs font-medium ${
                          wordData.hskLevel === null ? 'bg-gray-100 text-gray-700' :
                          wordData.hskLevel <= 2 ? 'bg-green-100 text-green-700' :
                          wordData.hskLevel <= 4 ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {wordData.hskLabel}
                        </div>
                      )}
                      {wordData.frequencyLabel && (
                        <div className={`px-2 py-1 rounded-md text-xs font-medium ${
                          wordData.frequency === 'very_common' ? 'bg-green-100 text-green-700' :
                          wordData.frequency === 'common' ? 'bg-blue-100 text-blue-700' :
                          wordData.frequency === 'uncommon' ? 'bg-yellow-100 text-yellow-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {wordData.frequencyLabel}
                        </div>
                      )}
                    </div>
                  )}
                  {wordData.exampleSentences && wordData.exampleSentences.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-xs font-semibold text-muted-foreground">
                          EXAMPLE SENTENCES
                        </p>
                        {wordData.translatedSentences && wordData.translatedSentences.length > 0 && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setShowTranslationToggle(!showTranslationToggle)}
                            className="h-6 px-2 text-xs"
                          >
                            <Languages className="h-3 w-3 mr-1" />
                            {showTranslationToggle ? "Hide" : "Show"} Translation
                          </Button>
                        )}
                      </div>
                      <div className="space-y-3">
                        {wordData.exampleSentences.map((sentence: string, idx: number) => (
                          <div key={idx} className="flex gap-2">
                            <span className="text-xs text-muted-foreground mt-0.5 flex-shrink-0">
                              {idx + 1}.
                            </span>
                            <div className="flex-1 space-y-1">
                              <p className="text-sm text-foreground">
                                {sentence}
                              </p>
                              {showTranslationToggle && wordData.translatedSentences && wordData.translatedSentences[idx] && (
                                <p className="text-xs text-muted-foreground italic">
                                  {wordData.translatedSentences[idx]}
                                </p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddToWordbank}
                    disabled={addToWordbank.isPending || isWordInWordbank || justSaved}
                    className={`flex-1 transition-all ${justSaved ? 'bg-green-500 hover:bg-green-500' : ''}`}
                    variant={isWordInWordbank ? "secondary" : "default"}
                  >
                    {addToWordbank.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : justSaved ? (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Saved!
                      </>
                    ) : isWordInWordbank ? (
                      <>
                        <CheckCircle2 className="mr-2 h-4 w-4" />
                        Already in Wordbank
                      </>
                    ) : (
                      <>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add to Wordbank
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowVocabPopup(false)}
                  >
                    Close
                  </Button>
                </div>
              </>
            ) : isLookupLimitHit ? (
              /* Trigger 3: Dictionary lookup limit hit — blur definition + upgrade prompt */
              <div className="space-y-4">
                <div>
                  <p className="text-2xl font-bold text-foreground mb-2">
                    {selectedWord}
                  </p>
                  <div className="relative">
                    <div className="blur-sm select-none pointer-events-none">
                      <p className="text-lg text-muted-foreground mb-1">Translation loading...</p>
                      <p className="text-sm text-muted-foreground mb-3">Definition preview is blurred because you've reached your daily lookup limit.</p>
                    </div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <Lock className="h-8 w-8 text-purple-400" />
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 rounded-xl p-4 text-center">
                  <p className="text-sm font-semibold text-purple-800 mb-1">Unlock unlimited dictionary lookups</p>
                  <p className="text-xs text-purple-500 mb-3">You've used all 10 lookups for today.</p>
                  <Button
                    onClick={() => { setShowVocabPopup(false); setShowLookupLimitPaywall(true); }}
                    className="w-full rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 h-10 text-sm font-semibold"
                  >
                    <Crown className="mr-2 h-4 w-4" />
                    Upgrade to Premium
                  </Button>
                </div>
              </div>
            ) : (
              <div className="text-center py-4">Failed to load word data</div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Navigation hint */}
      {!isPlaying && (
        <div className="mt-8 text-sm text-muted-foreground">
          Press play to start
        </div>
      )}

      {/* Upgrade Trigger #3: Vocabulary Limit Bottom Sheet */}
      <VocabularyLimitSheet
        open={showVocabLimitSheet}
        onOpenChange={setShowVocabLimitSheet}
        wordCount={currentWordCount}
        wordLimit={FREE_VOCAB_LIMIT}
      />

      {/* Upgrade Trigger #3b: Dictionary Lookup Limit Paywall */}
      <PaywallModal
        open={showLookupLimitPaywall}
        onOpenChange={setShowLookupLimitPaywall}
        trigger="lookup_limit"
        headline="unlock_lookups"
        skipToStep2
      />
    </div>
  );
}
