import { useState, useEffect, useMemo, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Volume2, Loader2, Languages, CheckCircle2, Eye, EyeOff, PlusCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { pairPinyinWithChinese } from "@/lib/pinyinUtils";

interface SentenceDisplayProps {
  storyText: string;
  vocabularyWords?: string[];
  storyLanguage?: string;
  lineTranslations?: Array<{ original: string; english: string; pinyin?: string }>;
  audioRef?: React.RefObject<HTMLAudioElement | null>;
  isPlaying?: boolean;
  onSentenceChange?: (sentenceIndex: number) => void;
}

export function SentenceDisplay({
  storyText,
  vocabularyWords = [],
  storyLanguage = "unknown",
  lineTranslations = [],
  audioRef,
  isPlaying,
  onSentenceChange,
}: SentenceDisplayProps) {
  
  const { data: user } = trpc.auth.me.useQuery();
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
    // Split by sentence boundaries (English: . ! ? and Chinese: 。！？)
    const sentenceArray = storyText
      .split(/([.!?。！？]+)/)
      .reduce((acc: string[], curr, idx, arr) => {
        if (idx % 2 === 0 && curr.trim()) {
          const punctuation = arr[idx + 1] || "";
          acc.push((curr + punctuation).trim());
        }
        return acc;
      }, [])
      .filter((s) => s.length > 0);
    
    return sentenceArray.length > 0 ? sentenceArray : [storyText];
  }, [storyText]);

  // Calculate sentence timestamps based on audio duration
  const sentenceTimestamps = useMemo(() => {
    if (!audioDuration || !sentences.length) {
      // Cannot calculate timestamps yet
      return [];
    }
    
    const totalChars = storyText.length;
    
    const timestamps = sentences.map((sentence, idx) => {
      const charsBefore = sentences
        .slice(0, idx)
        .reduce((sum, s) => sum + s.length, 0);
      const startTime = (charsBefore / totalChars) * audioDuration;
      const endTime = ((charsBefore + sentence.length) / totalChars) * audioDuration;
      
      return { sentence, startTime, endTime };
    });
    
    // Calculated timestamps
    return timestamps;
  }, [sentences, storyText, audioDuration]);

  // Update current sentence based on audio time
  useEffect(() => {
    
    if (!audioRef?.current || !isPlaying || sentenceTimestamps.length === 0) {
      // Conditions not met for sentence tracking
      return;
    }

    // Starting sentence tracking
    const audio = audioRef.current;
    
    const updateSentenceIndex = () => {
      const currentTime = audio.currentTime;
      
      
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
    if (!lineTranslations || lineTranslations.length === 0) return null;
    
    // Clean the current sentence for matching (remove asterisks and normalize whitespace)
    const cleanSentence = currentSentence.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
    
    // Find translation where the original text matches (also cleaned)
    const match = lineTranslations.find(t => {
      const cleanOriginal = t.original.replace(/\*\*/g, '').replace(/\s+/g, ' ').trim();
      return cleanOriginal === cleanSentence || cleanOriginal.includes(cleanSentence) || cleanSentence.includes(cleanOriginal);
    });
    
    return match || null;
  }, [currentSentence, lineTranslations]);

  // Helper function to check if a word is in vocabulary list
  const isVocabularyWord = (word: string): boolean => {
    const cleanWord = word.replace(/[.,!?;:"'\u00BF\u00A1*]/g, '').toLowerCase();
    return vocabularyWords.some(vw => vw.toLowerCase() === cleanWord);
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
    if (!audioRef?.current?.duration || !sentenceTimestamps[currentSentenceIndex]) {
      return [];
    }

    const sentenceStart = sentenceTimestamps[currentSentenceIndex].startTime;
    const sentenceEnd = sentenceTimestamps[currentSentenceIndex].endTime;
    const sentenceDuration = sentenceEnd - sentenceStart;
    const totalChars = currentSentence.length;

    let charCount = 0;
    // Reduce offset to 100ms for better synchronization
    const timingOffset = 0.1;
    return words.map((word) => {
      const wordStart = Math.max(sentenceStart, sentenceStart + (charCount / totalChars) * sentenceDuration - timingOffset);
      const wordEnd = sentenceStart + ((charCount + word.length) / totalChars) * sentenceDuration - timingOffset;
      charCount += word.length + 1; // +1 for space
      return { word, startTime: wordStart, endTime: wordEnd };
    });
  }, [words, currentSentence, sentenceTimestamps, currentSentenceIndex, audioRef]);

  // Update current word based on audio time
  useEffect(() => {
    if (!audioRef?.current || !isPlaying || wordTimestamps.length === 0) {
      return;
    }

    const audio = audioRef.current;

    const updateWordIndex = () => {
      const currentTime = audio.currentTime;
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
  const { data: wordData, isLoading: isLoadingWord, error: wordError } = trpc.wordbank.translateWord.useQuery(
    { word: selectedWord || "", targetLanguage: userLanguage },
    { 
      enabled: !!selectedWord && showVocabPopup,
      retry: 1
    }
  );
  
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

  // Handle add to wordbank
  const handleAddToWordbank = async () => {
    if (!selectedWord || !wordData) return;
    
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
  const isChinese = storyLanguage?.toLowerCase().includes('chinese');
  const hasPinyin = currentTranslation?.pinyin;

  return (
    <div className="flex flex-col items-center justify-center min-h-[300px] px-8 py-12 relative">
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
      <div className="text-center max-w-3xl flex-1 flex flex-col items-center justify-center">
        {/* Show pinyin above Chinese text using proper ruby annotation */}
        {showPinyin && hasPinyin && isChinese ? (
          <div className="text-left mb-2 w-full max-w-4xl">
            {/* Use CSS ruby annotation for proper character-by-character alignment */}
            <p 
              className="text-2xl md:text-3xl font-medium text-foreground"
              style={{ 
                lineHeight: '3',
                rubyPosition: 'over',
              }}
            >
              {pairPinyinWithChinese(currentSentence, currentTranslation.pinyin || '').map((pair, idx) => {
                // Skip rendering empty pairs
                if (!pair.chinese) return null;
                
                // Handle punctuation and spaces without ruby
                if (!pair.pinyin) {
                  return (
                    <span key={idx}>{pair.chinese}</span>
                  );
                }
                
                const isPlayingThis = playingCharacter === pair.chinese;
                
                return (
                  <ruby 
                    key={idx} 
                    style={{ 
                      rubyAlign: 'center',
                    }}
                  >
                    <span 
                      className={`cursor-pointer transition-all duration-200 ${
                        isPlayingThis 
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
                    <rp>(</rp>
                    <rt className={`text-sm font-medium transition-colors ${
                      isPlayingThis ? 'text-primary' : 'text-amber-600'
                    }`} style={{ textAlign: 'center' }}>{pair.pinyin.replace(/\*\*/g, '')}</rt>
                    <rp>)</rp>
                  </ruby>
                );
              })}
            </p>
          </div>
        ) : (
          <p className="text-2xl md:text-3xl leading-relaxed font-medium text-foreground">
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
                    if (isVocab) {
                      handleVocabPronunciation(word);
                    }
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
    </div>
  );
}
