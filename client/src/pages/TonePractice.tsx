import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowLeft, 
  Volume2, 
  Loader2, 
  CheckCircle2, 
  XCircle, 
  RotateCcw,
  Trophy,
  Target,
  Flame,
  HelpCircle,
  BarChart3
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { trpc } from "@/lib/trpc";
import Breadcrumb from "@/components/Breadcrumb";
import { useAuth } from "@/_core/hooks/useAuth";
import { APP_LOGO } from "@/const";

// Chinese tone data with example characters - expanded syllables
const TONE_DATA = {
  1: {
    name: "First Tone",
    description: "High and level (ˉ)",
    pinyin: "mā",
    examples: [
      { character: "妈", pinyin: "mā", meaning: "mother" },
      { character: "他", pinyin: "tā", meaning: "he" },
      { character: "八", pinyin: "bā", meaning: "eight" },
      { character: "天", pinyin: "tiān", meaning: "sky/day" },
      { character: "高", pinyin: "gāo", meaning: "tall/high" },
      { character: "多", pinyin: "duō", meaning: "many" },
      { character: "家", pinyin: "jiā", meaning: "home/family" },
      { character: "开", pinyin: "kāi", meaning: "open" },
      { character: "拉", pinyin: "lā", meaning: "pull" },
      { character: "扎", pinyin: "zā", meaning: "tie/bind" },
      { character: "擦", pinyin: "cā", meaning: "wipe" },
      { character: "三", pinyin: "sān", meaning: "three" },
      { character: "花", pinyin: "huā", meaning: "flower" },
      { character: "发", pinyin: "fā", meaning: "send/emit" },
    ],
    color: "bg-blue-500",
    textColor: "text-blue-600",
  },
  2: {
    name: "Second Tone",
    description: "Rising (ˊ)",
    pinyin: "má",
    examples: [
      { character: "麻", pinyin: "má", meaning: "hemp/numb" },
      { character: "人", pinyin: "rén", meaning: "person" },
      { character: "十", pinyin: "shí", meaning: "ten" },
      { character: "来", pinyin: "lái", meaning: "come" },
      { character: "国", pinyin: "guó", meaning: "country" },
      { character: "白", pinyin: "bái", meaning: "white" },
      { character: "达", pinyin: "dá", meaning: "reach" },
      { character: "提", pinyin: "tí", meaning: "lift/raise" },
      { character: "爬", pinyin: "pá", meaning: "climb" },
      { character: "拿", pinyin: "ná", meaning: "take/hold" },
      { character: "茶", pinyin: "chá", meaning: "tea" },
      { character: "杂", pinyin: "zá", meaning: "mixed" },
      { character: "萨", pinyin: "sà", meaning: "Bodhisattva" },
      { character: "华", pinyin: "huá", meaning: "China/splendid" },
      { character: "罚", pinyin: "fá", meaning: "punish" },
    ],
    color: "bg-green-500",
    textColor: "text-green-600",
  },
  3: {
    name: "Third Tone",
    description: "Falling-rising (ˇ)",
    pinyin: "mǎ",
    examples: [
      { character: "马", pinyin: "mǎ", meaning: "horse" },
      { character: "你", pinyin: "nǐ", meaning: "you" },
      { character: "我", pinyin: "wǒ", meaning: "I/me" },
      { character: "好", pinyin: "hǎo", meaning: "good" },
      { character: "小", pinyin: "xiǎo", meaning: "small" },
      { character: "把", pinyin: "bǎ", meaning: "grasp" },
      { character: "打", pinyin: "dǎ", meaning: "hit/strike" },
      { character: "塔", pinyin: "tǎ", meaning: "tower/pagoda" },
      { character: "卡", pinyin: "kǎ", meaning: "card" },
      { character: "喇", pinyin: "lǎ", meaning: "lama" },
      { character: "哪", pinyin: "nǎ", meaning: "which" },
      { character: "洒", pinyin: "sǎ", meaning: "sprinkle" },
      { character: "法", pinyin: "fǎ", meaning: "law/method" },
    ],
    color: "bg-amber-500",
    textColor: "text-amber-600",
  },
  4: {
    name: "Fourth Tone",
    description: "Falling (ˋ)",
    pinyin: "mà",
    examples: [
      { character: "骂", pinyin: "mà", meaning: "scold" },
      { character: "是", pinyin: "shì", meaning: "is/yes" },
      { character: "大", pinyin: "dà", meaning: "big" },
      { character: "去", pinyin: "qù", meaning: "go" },
      { character: "四", pinyin: "sì", meaning: "four" },
      { character: "爸", pinyin: "bà", meaning: "father" },
      { character: "但", pinyin: "dàn", meaning: "but" },
      { character: "太", pinyin: "tài", meaning: "too/very" },
      { character: "怕", pinyin: "pà", meaning: "fear" },
      { character: "拉", pinyin: "là", meaning: "spicy" },
      { character: "那", pinyin: "nà", meaning: "that" },
      { character: "下", pinyin: "xià", meaning: "down/below" },
      { character: "话", pinyin: "huà", meaning: "speech/words" },
      { character: "发", pinyin: "fà", meaning: "hair" },
    ],
    color: "bg-red-500",
    textColor: "text-red-600",
  },
};

type ToneNumber = 1 | 2 | 3 | 4;

interface Question {
  character: string;
  pinyin: string;
  meaning: string;
  correctTone: ToneNumber;
}

// Helper function to apply tone marks to pinyin
function applyToneMark(syllable: string, tone: ToneNumber): string {
  // Tone mark mappings for vowels
  const toneMaps: Record<ToneNumber, Record<string, string>> = {
    1: { 'a': 'ā', 'e': 'ē', 'i': 'ī', 'o': 'ō', 'u': 'ū', 'ü': 'ǖ' },
    2: { 'a': 'á', 'e': 'é', 'i': 'í', 'o': 'ó', 'u': 'ú', 'ü': 'ǘ' },
    3: { 'a': 'ǎ', 'e': 'ě', 'i': 'ǐ', 'o': 'ǒ', 'u': 'ǔ', 'ü': 'ǚ' },
    4: { 'a': 'à', 'e': 'è', 'i': 'ì', 'o': 'ò', 'u': 'ù', 'ü': 'ǜ' },
  };
  
  const toneMap = toneMaps[tone];
  
  // Priority order for tone mark placement: a, o, e, then last vowel
  const vowelPriority = ['a', 'o', 'e'];
  
  // Find the vowel to mark
  let result = syllable.toLowerCase();
  
  for (const vowel of vowelPriority) {
    if (result.includes(vowel)) {
      return result.replace(vowel, toneMap[vowel] || vowel);
    }
  }
  
  // If no priority vowel found, mark the last vowel (i or u)
  const lastVowelMatch = result.match(/[iuü](?!.*[iuü])/);
  if (lastVowelMatch) {
    const vowel = lastVowelMatch[0];
    const index = result.lastIndexOf(vowel);
    return result.substring(0, index) + (toneMap[vowel] || vowel) + result.substring(index + 1);
  }
  
  return syllable; // Return original if no vowel found
}

// Generate a random question from the tone data
function generateQuestion(): Question {
  const tones = [1, 2, 3, 4] as ToneNumber[];
  const randomTone = tones[Math.floor(Math.random() * tones.length)];
  const toneData = TONE_DATA[randomTone];
  const randomExample = toneData.examples[Math.floor(Math.random() * toneData.examples.length)];
  
  return {
    character: randomExample.character,
    pinyin: randomExample.pinyin,
    meaning: randomExample.meaning,
    correctTone: randomTone,
  };
}

export default function TonePractice() {
  useScrollToTop();
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [mode, setMode] = useState<"learn" | "practice">("learn");
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<ToneNumber | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [streak, setStreak] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [playingCharacter, setPlayingCharacter] = useState<string | null>(null);
  const [audioCache, setAudioCache] = useState<Record<string, string>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const generateAudio = trpc.wordbank.generateChineseToneAudio.useMutation();
  const recordAttempt = trpc.tonePractice.recordAttempt.useMutation();
  const { data: masteryStats } = trpc.tonePractice.getMasteryStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: weakTones } = trpc.tonePractice.getWeakTones.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  
  // Start practice mode
  const startPractice = () => {
    setMode("practice");
    setCurrentQuestion(generateQuestion());
    setSelectedAnswer(null);
    setShowResult(false);
    setScore({ correct: 0, total: 0 });
    setStreak(0);
  };
  
  // Handle answer selection
  const handleAnswer = async (tone: ToneNumber) => {
    if (showResult || !currentQuestion) return;
    
    setSelectedAnswer(tone);
    setShowResult(true);
    
    const isCorrect = tone === currentQuestion.correctTone;
    setScore(prev => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
    
    if (isCorrect) {
      setStreak(prev => prev + 1);
    } else {
      setStreak(0);
    }
    
    // Record attempt to backend
    try {
      await recordAttempt.mutateAsync({
        character: currentQuestion.character,
        pinyin: currentQuestion.pinyin,
        correctTone: currentQuestion.correctTone,
        selectedTone: tone,
      });
    } catch (error) {
      console.error("Failed to record attempt:", error);
    }
  };
  
  // Next question
  const nextQuestion = () => {
    setCurrentQuestion(generateQuestion());
    setSelectedAnswer(null);
    setShowResult(false);
  };
  
  // Play audio for a character
  const playAudio = async (character: string, tone: ToneNumber, pinyin: string) => {
    if (isPlayingAudio) return;
    
    setIsPlayingAudio(true);
    setPlayingCharacter(character);
    
    try {
      // Use character+tone as cache key to differentiate tones
      const cacheKey = `${character}-tone${tone}`;
      let audioUrl = audioCache[cacheKey];
      
      if (!audioUrl) {
        // Use OpenAI TTS with explicit tone instructions for accurate Chinese pronunciation
        const result = await generateAudio.mutateAsync({
          character: character,
          tone: tone,
          pinyin: pinyin,
        });
        audioUrl = result.audioUrl;
        
        if (audioUrl) {
          setAudioCache(prev => ({ ...prev, [cacheKey]: audioUrl }));
        }
      }
      
      if (audioUrl && audioRef.current) {
        audioRef.current.src = audioUrl;
        audioRef.current.onended = () => {
          setIsPlayingAudio(false);
          setPlayingCharacter(null);
        };
        audioRef.current.onerror = () => {
          setIsPlayingAudio(false);
          setPlayingCharacter(null);
        };
        await audioRef.current.play();
      } else {
        setIsPlayingAudio(false);
        setPlayingCharacter(null);
      }
    } catch (error) {
      console.error("Failed to play audio:", error);
      setIsPlayingAudio(false);
      setPlayingCharacter(null);
    }
  };
  
  // Calculate accuracy
  const accuracy = score.total > 0 ? Math.round((score.correct / score.total) * 100) : 0;
  
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }
  
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50 flex items-center justify-center">
        <Card className="max-w-md w-full mx-4">
          <CardHeader className="text-center">
            <img src={APP_LOGO} alt="Flip" className="h-16 w-16 mx-auto mb-2" />
            <CardTitle>Sign in Required</CardTitle>
            <CardDescription>Please sign in to practice tones</CardDescription>
          </CardHeader>
          <CardContent className="flex justify-center">
            <Link href="/">
              <Button>Go to Home</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-border/40">
        <div className="container flex items-center justify-between h-16 px-4">
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              size="icon"
              onClick={() => setLocation('/app')}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              <h1 className="text-xl font-bold">Tone Practice</h1>
            </div>
          </div>
          {mode === "practice" && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Flame className="h-4 w-4 text-orange-500" />
                <span className="text-sm font-medium">{streak} streak</span>
              </div>
              <Badge variant="secondary">
                {score.correct}/{score.total} ({accuracy}%)
              </Badge>
            </div>
          )}
          {mode === "learn" && (
            <Link href="/tone-mastery">
              <Button variant="outline" size="sm" className="gap-2">
                <BarChart3 className="h-4 w-4" />
                View Progress
              </Button>
            </Link>
          )}
        </div>
      </header>
      
      {/* Hidden audio element */}
      <audio ref={audioRef} className="hidden" />
      
      <main className="container max-w-4xl py-8 px-4">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/app" },
            { label: "Tone Practice", href: undefined },
          ]}
        />
        {mode === "learn" ? (
          // Learn Mode - Introduction to tones
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Master Chinese Tones</h2>
              <p className="text-muted-foreground">
                Mandarin Chinese has four main tones. Each tone changes the meaning of a word.
              </p>
            </div>
            
            {/* Tone Cards */}
            <div className="grid md:grid-cols-2 gap-4">
              {([1, 2, 3, 4] as ToneNumber[]).map((tone) => {
                const toneData = TONE_DATA[tone];
                return (
                  <Card key={tone} className="overflow-hidden">
                    <CardHeader className={`${toneData.color} text-white`}>
                      <CardTitle className="flex items-center gap-3">
                        {toneData.name}
                        <span className="text-5xl font-normal">
                          {tone === 1 ? 'ˉ' : tone === 2 ? 'ˊ' : tone === 3 ? 'ˇ' : 'ˋ'}
                        </span>
                      </CardTitle>
                      <CardDescription className="text-white/90">
                        {tone === 1 ? 'High and level' : tone === 2 ? 'Rising' : tone === 3 ? 'Falling-rising' : 'Falling'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pt-4">
                      <div className="space-y-2">
                        {toneData.examples.slice(0, 3).map((example, idx) => (
                          <div 
                            key={idx}
                            className="flex items-center justify-between p-2 rounded-lg hover:bg-muted/50 cursor-pointer transition-colors"
                            onClick={() => playAudio(example.character, tone, example.pinyin)}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-2xl">{example.character}</span>
                              <div>
                                <span className={`text-sm font-medium ${toneData.textColor}`}>
                                  {example.pinyin}
                                </span>
                                <span className="text-sm text-muted-foreground ml-2">
                                  {example.meaning}
                                </span>
                              </div>
                            </div>
                            <Button 
                              variant="ghost" 
                              size="icon"
                              disabled={playingCharacter === example.character && isPlayingAudio}
                            >
                              {playingCharacter === example.character && isPlayingAudio ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Volume2 className="h-4 w-4" />
                              )}
                            </Button>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
            
            {/* Start Practice Button */}
            <div className="text-center pt-8">
              <Button 
                size="lg" 
                onClick={startPractice}
                className="gap-2"
              >
                <Target className="h-5 w-5" />
                Start Practice
              </Button>
            </div>
          </div>
        ) : (
          // Practice Mode - Quiz
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>Progress</span>
                <span>{score.total} questions</span>
              </div>
              <Progress value={Math.min(score.total * 10, 100)} />
            </div>
            
            {currentQuestion && (
              <Card className="overflow-hidden">
                <CardHeader className="text-center bg-gradient-to-r from-purple-500 to-teal-500 text-white">
                  <CardTitle className="text-lg">Which tone is this?</CardTitle>
                  <CardDescription className="text-white/90">
                    Listen to the character and identify the tone
                  </CardDescription>
                </CardHeader>
                <CardContent className="pt-8 pb-8">
                  {/* Character Display */}
                  <div className="text-center mb-8">
                    <div 
                      className="inline-flex flex-col items-center cursor-pointer group"
                      onClick={() => playAudio(currentQuestion.character, currentQuestion.correctTone, currentQuestion.pinyin)}
                    >
                      <span className="text-7xl mb-2 group-hover:scale-110 transition-transform">
                        {currentQuestion.character}
                      </span>
                      <Button 
                        variant="outline" 
                        size="sm"
                        className="gap-2"
                        disabled={isPlayingAudio}
                      >
                        {isPlayingAudio ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Volume2 className="h-4 w-4" />
                        )}
                        Play Sound
                      </Button>
                    </div>
                    {showResult && (
                      <div className="mt-4">
                        <p className={`text-lg font-medium ${TONE_DATA[currentQuestion.correctTone].textColor}`}>
                          {currentQuestion.pinyin}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {currentQuestion.meaning}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Answer Options */}
                  <div className="grid grid-cols-2 gap-3">
                    {([1, 2, 3, 4] as ToneNumber[]).map((tone) => {
                      const toneData = TONE_DATA[tone];
                      const isSelected = selectedAnswer === tone;
                      const isCorrect = currentQuestion.correctTone === tone;
                      
                      let buttonClass = "h-auto py-4 flex flex-col items-center gap-1 transition-all";
                      
                      if (showResult) {
                        if (isCorrect) {
                          buttonClass += " bg-green-100 border-green-500 text-green-700";
                        } else if (isSelected && !isCorrect) {
                          buttonClass += " bg-red-100 border-red-500 text-red-700";
                        }
                      } else if (isSelected) {
                        buttonClass += " border-primary bg-primary/10";
                      }
                      
                      // Get the base syllable from current question's pinyin (remove tone marks)
                      const baseSyllable = currentQuestion.pinyin.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                      // Apply the tone mark for this option
                      const optionPinyin = applyToneMark(baseSyllable, tone);
                      
                      return (
                        <Button
                          key={tone}
                          variant="outline"
                          className={buttonClass}
                          onClick={() => handleAnswer(tone)}
                          disabled={showResult}
                        >
                          <span className="text-2xl mb-1">{optionPinyin}</span>
                          <span className="text-lg font-bold">{toneData.name}</span>
                          <span className="text-sm opacity-70">{toneData.description}</span>
                          {showResult && isCorrect && (
                            <CheckCircle2 className="h-5 w-5 text-green-600 mt-1" />
                          )}
                          {showResult && isSelected && !isCorrect && (
                            <XCircle className="h-5 w-5 text-red-600 mt-1" />
                          )}
                        </Button>
                      );
                    })}
                  </div>
                  
                  {/* Result Feedback */}
                  {showResult && (
                    <div className="mt-6 text-center">
                      {selectedAnswer === currentQuestion.correctTone ? (
                        <div className="flex items-center justify-center gap-2 text-green-600">
                          <CheckCircle2 className="h-6 w-6" />
                          <span className="text-lg font-medium">Correct!</span>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2 text-red-600">
                          <XCircle className="h-6 w-6" />
                          <span className="text-lg font-medium">
                            Incorrect - It was {TONE_DATA[currentQuestion.correctTone].name}
                          </span>
                        </div>
                      )}
                      <Button 
                        className="mt-4 gap-2" 
                        onClick={nextQuestion}
                      >
                        Next Question
                        <ArrowLeft className="h-4 w-4 rotate-180" />
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
            
            {/* Stats Card */}
            {score.total >= 10 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Session Complete!
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center">
                    <div>
                      <p className="text-3xl font-bold text-primary">{score.correct}</p>
                      <p className="text-sm text-muted-foreground">Correct</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold">{score.total}</p>
                      <p className="text-sm text-muted-foreground">Total</p>
                    </div>
                    <div>
                      <p className="text-3xl font-bold text-green-600">{accuracy}%</p>
                      <p className="text-sm text-muted-foreground">Accuracy</p>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-6 justify-center">
                    <Button variant="outline" onClick={() => setMode("learn")} className="gap-2">
                      <HelpCircle className="h-4 w-4" />
                      Review Tones
                    </Button>
                    <Button onClick={startPractice} className="gap-2">
                      <RotateCcw className="h-4 w-4" />
                      Practice Again
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
            
            {/* Back to Learn Button */}
            <div className="text-center">
              <Button 
                variant="ghost" 
                onClick={() => setMode("learn")}
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Learning
              </Button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
