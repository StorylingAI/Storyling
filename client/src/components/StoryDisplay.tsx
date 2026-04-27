import { useState, useEffect, useRef, useMemo } from "react";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Volume2, BookmarkPlus, BookmarkCheck, Eye, EyeOff, GraduationCap } from "lucide-react";
import { VocabularyLimitSheet } from "@/components/upgrade/VocabularyLimitSheet";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { pairPinyinWithChinese } from "@/lib/pinyinUtils";
import {
  generateWordTimestamps,
  getCurrentWordIndex,
  type WordTimestamp,
} from "@/utils/wordTimestamps";
import {
  normalizeLineTranslations,
  normalizeVocabularyTranslations,
  safeString,
  type DisplayVocabularyData,
} from "@/lib/contentDisplay";

interface StoryDisplayProps {
  storyText?: unknown;
  lineTranslations?: unknown;
  vocabularyTranslations?: unknown;
  targetLanguage?: string;
  audioRef?: React.RefObject<HTMLAudioElement | null>;
  isPlaying?: boolean;
}

export function StoryDisplay({
  storyText,
  lineTranslations,
  vocabularyTranslations,
  targetLanguage,
  audioRef,
  isPlaying,
}: StoryDisplayProps) {
  const [hoveredWord, setHoveredWord] = useState<string | null>(null);
  const [playingWord, setPlayingWord] = useState<string | null>(null);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());
  const [showVocabLimitSheet, setShowVocabLimitSheet] = useState(false);
  const { user: authUser } = useAuth();
  const [currentWordIndex, setCurrentWordIndex] = useState(-1);
  const [wordTimestamps, setWordTimestamps] = useState<WordTimestamp[]>([]);
  const [audioCache, setAudioCache] = useState<Record<string, string>>({});
  const storyContainerRef = useRef<HTMLDivElement>(null);
  const audioElementRef = useRef<HTMLAudioElement | null>(null);
  const safeStoryText = useMemo(() => safeString(storyText), [storyText]);
  const safeLineTranslations = useMemo(
    () => normalizeLineTranslations(lineTranslations),
    [lineTranslations],
  );
  const safeVocabularyTranslations = useMemo(
    () => normalizeVocabularyTranslations(vocabularyTranslations),
    [vocabularyTranslations],
  );
  const hasVocabularyTranslations = Object.keys(safeVocabularyTranslations).length > 0;
  
  // Toggle states for pinyin and translation visibility
  const [showPinyin, setShowPinyin] = useState(() => {
    const saved = localStorage.getItem('showPinyin');
    return saved !== null ? JSON.parse(saved) : true;
  });
  const [showTranslation, setShowTranslation] = useState(() => {
    const saved = localStorage.getItem('showTranslation');
    return saved !== null ? JSON.parse(saved) : true;
  });
  
  // Practice mode state
  const [practiceMode, setPracticeMode] = useState(() => {
    const saved = localStorage.getItem('practiceMode');
    return saved !== null ? JSON.parse(saved) : false;
  });
  const [revealedSentences, setRevealedSentences] = useState<Set<number>>(new Set());
  
  // Persist toggle preferences
  useEffect(() => {
    localStorage.setItem('showPinyin', JSON.stringify(showPinyin));
  }, [showPinyin]);
  
  useEffect(() => {
    localStorage.setItem('showTranslation', JSON.stringify(showTranslation));
  }, [showTranslation]);
  
  useEffect(() => {
    localStorage.setItem('practiceMode', JSON.stringify(practiceMode));
    // Reset revealed sentences when toggling practice mode
    if (practiceMode) {
      setRevealedSentences(new Set());
    }
  }, [practiceMode]);
  
  const handleRevealSentence = (index: number) => {
    setRevealedSentences(prev => new Set(Array.from(prev).concat(index)));
  };

  const utils = trpc.useUtils();
  const saveWordMutation = trpc.wordbank.saveWord.useMutation({
    onSuccess: (_, variables) => {
      setSavedWords((prev) => new Set(Array.from(prev).concat(variables.word)));
      toast.success("Word saved to wordbank!");
      utils.wordbank.getMyWords.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Failed to save word");
    },
  });

  // Check if target language is Chinese
  const isChinese =
    targetLanguage?.toLowerCase().includes("chinese") ||
    targetLanguage?.toLowerCase().includes("mandarin");

  const generateAudioMutation = trpc.audio.generateWordAudio.useMutation();

  const handlePlayAudio = async (word: string) => {
    // Skip if already playing this word
    if (playingWord === word) {
      return;
    }
    
    setPlayingWord(word);
    
    try {
      // Check cache first
      let audioUrl = audioCache[word];
      
      if (!audioUrl) {
        // Generate audio if not cached
        const result = await generateAudioMutation.mutateAsync({
          word,
          targetLanguage: targetLanguage || "Unknown",
        });
        audioUrl = result.audioUrl;
        
        // Cache the audio URL
        if (audioUrl) {
          setAudioCache(prev => ({ ...prev, [word]: audioUrl }));
        }
      }

      // Play the audio using a single audio element
      if (audioUrl) {
        if (!audioElementRef.current) {
          audioElementRef.current = new Audio();
        }
        
        const audio = audioElementRef.current;
        audio.src = audioUrl;
        audio.onended = () => setPlayingWord(null);
        audio.onerror = () => {
          toast.error("Failed to play audio");
          setPlayingWord(null);
        };
        await audio.play();
      } else {
        setPlayingWord(null);
      }
    } catch (error) {
      console.error("Audio generation failed:", error);
      toast.error("Failed to generate audio");
      setPlayingWord(null);
    }
  };

  // Get today's wordbank count for free users (daily vocabulary limit trigger)
  const { data: todayVocabData } = trpc.wordbank.getTodayWordCount.useQuery(undefined, {
    enabled: !!authUser && authUser.subscriptionTier === "free",
  });
  const currentWordCount = todayVocabData?.count ?? 0;
  const FREE_VOCAB_LIMIT = todayVocabData?.limit ?? 3;

  const handleSaveWord = (word: string, vocabData: DisplayVocabularyData) => {
    // Upgrade Trigger #3: Check vocabulary limit for free users
    if (authUser?.subscriptionTier === "free" && currentWordCount >= FREE_VOCAB_LIMIT) {
      setShowVocabLimitSheet(true);
      return;
    }
    saveWordMutation.mutate({
      word,
      pinyin: vocabData.pinyin,
      translation: vocabData.translation,
      targetLanguage: targetLanguage || "Unknown",
      exampleSentences: vocabData.exampleSentences,
    });
  };

  // Generate word timestamps when audio is loaded
  useEffect(() => {
    if (audioRef?.current && safeStoryText) {
      const audio = audioRef.current;
      
      const handleLoadedMetadata = () => {
        const duration = audio.duration;
        if (duration && duration > 0) {
          const timestamps = generateWordTimestamps(safeStoryText, duration);
          setWordTimestamps(timestamps);
        }
      };
      
      if (audio.duration) {
        handleLoadedMetadata();
      } else {
        audio.addEventListener('loadedmetadata', handleLoadedMetadata);
        return () => audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      }
    }
  }, [audioRef, safeStoryText]);

  // Update current word index based on audio time
  useEffect(() => {
    if (!audioRef?.current || !isPlaying || wordTimestamps.length === 0) {
      return;
    }

    const audio = audioRef.current;
    
    const updateWordIndex = () => {
      const newIndex = getCurrentWordIndex(wordTimestamps, Math.max(0, audio.currentTime - 0.9));
      if (newIndex !== currentWordIndex) {
        setCurrentWordIndex(newIndex);
        
        // Auto-scroll to keep current word visible
        if (newIndex >= 0 && storyContainerRef.current) {
          const wordElement = storyContainerRef.current.querySelector(
            `[data-word-index="${newIndex}"]`
          );
          if (wordElement) {
            wordElement.scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
          }
        }
      }
    };

    const interval = setInterval(updateWordIndex, 100); // Update every 100ms
    return () => clearInterval(interval);
  }, [audioRef, isPlaying, wordTimestamps, currentWordIndex]);

  // Reset highlighting when audio stops
  useEffect(() => {
    if (!isPlaying) {
      setCurrentWordIndex(-1);
    }
  }, [isPlaying]);

  // Function to render word with hover tooltip
  const renderWordWithTooltip = (word: string, index: number) => {
    // Clean the word (remove punctuation for lookup)
    // Include accented characters for Romance languages
    const cleanWord = word.replace(/[^\w\s\u00C0-\u024F\u4e00-\u9fff]/g, "");
    const vocabData = safeVocabularyTranslations[cleanWord];

    // Check if word is bolded (vocabulary word)
    const isBold = word.startsWith("**") && word.endsWith("**");
    const displayWord = isBold ? word.slice(2, -2) : word;

    if (vocabData && isBold) {
      const isSaved = savedWords.has(cleanWord);

      return (
        <TooltipProvider key={index}>
          <Tooltip>
            <TooltipTrigger asChild>
              <span
                className={`font-bold text-primary cursor-pointer underline decoration-dotted decoration-primary/30 hover:decoration-primary transition-all inline-flex items-center gap-1 ${
                  playingWord === cleanWord ? "scale-105 bg-primary/10 rounded px-1" : ""
                }`}
                onMouseEnter={() => setHoveredWord(cleanWord)}
                onMouseLeave={() => setHoveredWord(null)}
                onClick={() => handlePlayAudio(cleanWord)}
              >
                {playingWord === cleanWord && (
                  <Volume2 className="h-3 w-3 text-primary inline animate-pulse" />
                )}
                {displayWord}
              </span>
            </TooltipTrigger>
            <TooltipContent className="max-w-sm p-4">
              <div className="space-y-3">
                {/* Word and actions */}
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <p className="font-bold text-lg">{cleanWord}</p>
                    {isChinese && vocabData.pinyin && (
                      <p className="text-sm text-muted-foreground italic">
                        {vocabData.pinyin}
                      </p>
                    )}
                    <p className="text-sm text-muted-foreground mt-1">
                      {vocabData.translation}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => handlePlayAudio(cleanWord)}
                    >
                      <Volume2
                        className={`h-4 w-4 ${
                          playingWord === cleanWord ? "animate-pulse text-primary" : ""
                        }`}
                      />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 rounded-full"
                      onClick={() => handleSaveWord(cleanWord, vocabData)}
                      disabled={isSaved || saveWordMutation.isPending}
                    >
                      {isSaved ? (
                        <BookmarkCheck className="h-4 w-4 text-primary" />
                      ) : (
                        <BookmarkPlus className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>

                {/* Example sentences */}
                {vocabData.exampleSentences && vocabData.exampleSentences.length > 0 && (
                  <div className="border-t pt-2">
                    <p className="text-xs font-semibold text-muted-foreground mb-1">
                      Examples:
                    </p>
                    {vocabData.exampleSentences.slice(0, 2).map((example, idx) => (
                      <p key={idx} className="text-xs text-muted-foreground italic">
                        • {example}
                      </p>
                    ))}
                  </div>
                )}
              </div>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      );
    }

    return (
      <span key={index} className={isBold ? "font-bold text-primary" : ""}>
        {displayWord}
      </span>
    );
  };

  // Function to render text with vocabulary tooltips (no highlighting in render)
  const renderTextWithTooltips = (text: string) => {
    // Parse bold markdown **word** and create tooltips
    const parts: React.ReactNode[] = [];
    let currentIndex = 0;
    
    // Regex to match **word** patterns
    const boldRegex = /\*\*([^*]+)\*\*/g;
    let match;
    
    while ((match = boldRegex.exec(text)) !== null) {
      // Add text before the bold word (with highlighting support)
      if (match.index > currentIndex) {
        const beforeText = text.substring(currentIndex, match.index);
        
        // Just render plain text before bold words
        parts.push(
          <span key={`text-${currentIndex}`}>
            {beforeText}
          </span>
        );
      }
      
      // Add the bold word with tooltip
      const word = match[1];
      // Include accented characters when cleaning
      const cleanWord = word.replace(/[^\w\s\u00C0-\u024F\u4e00-\u9fff]/g, "");
      const vocabData = safeVocabularyTranslations[cleanWord];
      
      if (vocabData) {
        const isSaved = savedWords.has(cleanWord);
        
        parts.push(
          <TooltipProvider key={`tooltip-${match.index}`}>
            <Tooltip>
              <TooltipTrigger asChild>
                <span
                  className={`font-bold text-primary cursor-pointer underline decoration-dotted decoration-primary/30 hover:decoration-primary transition-all inline-flex items-center gap-1 ${
                    playingWord === cleanWord ? "scale-105 bg-primary/10 rounded px-1" : ""
                  }`}
                  onMouseEnter={() => setHoveredWord(cleanWord)}
                  onMouseLeave={() => setHoveredWord(null)}
                  onClick={() => handlePlayAudio(cleanWord)}
                >
                  {playingWord === cleanWord && (
                    <Volume2 className="h-3 w-3 text-primary inline animate-pulse" />
                  )}
                  {word}
                </span>
              </TooltipTrigger>
              <TooltipContent className="max-w-sm p-4">
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex-1">
                      <p className="font-bold text-lg">{cleanWord}</p>
                      {isChinese && vocabData.pinyin && (
                        <p className="text-sm text-muted-foreground italic">
                          {vocabData.pinyin}
                        </p>
                      )}
                      <p className="text-sm text-muted-foreground mt-1">
                        {vocabData.translation}
                      </p>
                    </div>
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => handlePlayAudio(cleanWord)}
                      >
                        <Volume2
                          className={`h-4 w-4 ${
                            playingWord === cleanWord ? "animate-pulse text-primary" : ""
                          }`}
                        />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => handleSaveWord(cleanWord, vocabData)}
                        disabled={isSaved || saveWordMutation.isPending}
                      >
                        {isSaved ? (
                          <BookmarkCheck className="h-4 w-4 text-primary" />
                        ) : (
                          <BookmarkPlus className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>
                  {vocabData.exampleSentences && vocabData.exampleSentences.length > 0 && (
                    <div className="border-t pt-2">
                      <p className="text-xs font-semibold text-muted-foreground mb-1">
                        Examples:
                      </p>
                      {vocabData.exampleSentences.slice(0, 2).map((example, idx) => (
                        <p key={idx} className="text-xs text-muted-foreground italic">
                          • {example}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        );
      } else {
        // No vocab data, just render as bold
        parts.push(
          <span key={`bold-${match.index}`} className="font-bold text-primary">
            {word}
          </span>
        );
      }
      
      currentIndex = match.index + match[0].length;
    }
    
    // Add remaining text
    if (currentIndex < text.length) {
      parts.push(
        <span key={`text-${currentIndex}`}>
          {text.substring(currentIndex)}
        </span>
      );
    }
    
    return parts;
  };

  // Function to render clickable words for pronunciation
  const renderClickableWords = (text: string) => {
    // Split text into words and punctuation
    // Include accented characters (\u00C0-\u024F) for Romance languages
    const tokens = text.match(/[\w\u00C0-\u024F\u4e00-\u9fff]+|[^\w\u00C0-\u024F\u4e00-\u9fff]+/g) || [];
    
    return tokens.map((token, index) => {
      // Check if token is a word (not punctuation/whitespace)
      // Include accented characters for Romance languages
      const isWord = /[\w\u00C0-\u024F\u4e00-\u9fff]/.test(token);
      
      if (!isWord) {
        return <span key={index}>{token}</span>;
      }
      
      // Check if it's a vocabulary word (bold)
      // Include accented characters when cleaning
      const cleanToken = token.replace(/[^\w\s\u00C0-\u024F\u4e00-\u9fff]/g, "");
      const vocabData = safeVocabularyTranslations[cleanToken];
      const isBold = vocabData !== undefined;
      
      return (
        <span
          key={index}
          onClick={() => handlePlayAudio(cleanToken)}
          className={`cursor-pointer hover:bg-primary/10 rounded px-0.5 transition-colors ${
            isBold ? "font-bold text-primary" : ""
          } ${
            playingWord === cleanToken ? "bg-primary/20" : ""
          }`}
          title="Click to hear pronunciation"
        >
          {token}
        </span>
      );
    });
  };

  // If we have line translations, display with translations
  if (safeLineTranslations.length > 0) {
    return (
      <div className="space-y-4 text-gray-900 [&_blockquote]:border-lime-500 [&_blockquote]:bg-lime-50 [&_blockquote]:text-gray-900 [&_blockquote_*]:text-gray-900 [&_mark]:bg-lime-100 [&_mark]:text-gray-900 [&_mark_*]:text-gray-900">
        {/* Toggle Controls */}
        <div className="flex gap-2 mb-4 flex-wrap">
          <Button
            variant={practiceMode ? "default" : "outline"}
            size="sm"
            onClick={() => setPracticeMode(!practiceMode)}
            className="gap-2"
          >
            <GraduationCap className="h-4 w-4" />
            {practiceMode ? "Exit" : "Start"} Practice Mode
          </Button>
          
          {!practiceMode && (
            <>
              {isChinese && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPinyin(!showPinyin)}
                  className="gap-2"
                >
                  {showPinyin ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                  {showPinyin ? "Hide" : "Show"} Pinyin
                </Button>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowTranslation(!showTranslation)}
                className="gap-2"
              >
                {showTranslation ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                {showTranslation ? "Hide" : "Show"} Translation
              </Button>
            </>
          )}
        </div>
        
        <div ref={storyContainerRef} className="space-y-6">
          {safeLineTranslations.map((line, index) => {
            const isRevealed = revealedSentences.has(index);
            const shouldShowPinyin = practiceMode ? isRevealed : showPinyin;
            const shouldShowTranslation = practiceMode ? isRevealed : showTranslation;
            
            return (
              <div key={index} className="space-y-2 pb-4 border-b last:border-0">
                {/* Original text with pinyin above each word (for Chinese) */}
                {isChinese && line.pinyin && shouldShowPinyin ? (
                  <div className="flex flex-wrap items-start gap-x-2 gap-y-3">
                    {pairPinyinWithChinese(line.original, line.pinyin).map((pair, pairIdx) => (
                      <span key={pairIdx} className="inline-flex flex-col items-center">
                        <span className="text-xs text-amber-600 font-medium whitespace-nowrap mb-0.5">
                          {pair.pinyin}
                        </span>
                        <span className="text-lg font-medium text-foreground cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handlePlayAudio(pair.chinese)}
                          title="Click to hear pronunciation">
                          {pair.chinese}
                        </span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="text-lg leading-relaxed">
                    {renderClickableWords(line.original)}
                  </p>
                )}

                {/* English translation */}
                {shouldShowTranslation && (
                  <p className="text-sm text-muted-foreground">{line.english}</p>
                )}
                
                {/* Practice mode reveal button */}
                {practiceMode && !isRevealed && (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleRevealSentence(index)}
                    className="mt-2"
                  >
                    Reveal Translation {isChinese && "& Pinyin"}
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // Fallback: display plain text with tooltips if available
  return (
    <div
      ref={storyContainerRef}
      className="prose max-w-none text-gray-900 [&_blockquote]:border-lime-500 [&_blockquote]:bg-lime-50 [&_blockquote]:text-gray-900 [&_blockquote_*]:text-gray-900 [&_mark]:bg-lime-100 [&_mark]:text-gray-900 [&_mark_*]:text-gray-900 [&_p]:text-gray-900 [&_strong]:text-gray-900"
    >
      <p className="text-base leading-relaxed">
        {hasVocabularyTranslations && safeStoryText
          ? renderTextWithTooltips(safeStoryText)
          : safeStoryText || "Transcript will appear here once the story is generated..."}
      </p>
      {/* Upgrade Trigger #3: Vocabulary Limit Bottom Sheet */}
      <VocabularyLimitSheet
        open={showVocabLimitSheet}
        onOpenChange={setShowVocabLimitSheet}
        wordCount={currentWordCount}
        wordLimit={FREE_VOCAB_LIMIT}
      />
    </div>
  );
}
