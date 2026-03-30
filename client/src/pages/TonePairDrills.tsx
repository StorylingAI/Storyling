import { useState, useRef } from "react";
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
  Target,
  Flame,
  Zap
} from "lucide-react";
import { MobileNav } from "@/components/MobileNav";
import { Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { APP_LOGO } from "@/const";

// Tone pair configurations for focused practice
const TONE_PAIRS = [
  {
    id: "1-4",
    name: "First vs Fourth",
    description: "High level vs Falling",
    tones: [1, 4],
    color: "from-blue-500 to-red-500",
  },
  {
    id: "2-3",
    name: "Second vs Third",
    description: "Rising vs Falling-rising",
    tones: [2, 3],
    color: "from-green-500 to-amber-500",
  },
  {
    id: "1-2",
    name: "First vs Second",
    description: "High level vs Rising",
    tones: [1, 2],
    color: "from-blue-500 to-green-500",
  },
  {
    id: "3-4",
    name: "Third vs Fourth",
    description: "Falling-rising vs Falling",
    tones: [3, 4],
    color: "from-amber-500 to-red-500",
  },
];

// Expanded character pool for each tone
const TONE_CHARACTERS = {
  1: [
    { character: "妈", pinyin: "mā", meaning: "mother" },
    { character: "他", pinyin: "tā", meaning: "he" },
    { character: "八", pinyin: "bā", meaning: "eight" },
    { character: "天", pinyin: "tiān", meaning: "sky/day" },
    { character: "高", pinyin: "gāo", meaning: "tall/high" },
    { character: "多", pinyin: "duō", meaning: "many" },
    { character: "家", pinyin: "jiā", meaning: "home/family" },
    { character: "开", pinyin: "kāi", meaning: "open" },
    { character: "三", pinyin: "sān", meaning: "three" },
    { character: "花", pinyin: "huā", meaning: "flower" },
  ],
  2: [
    { character: "麻", pinyin: "má", meaning: "hemp/numb" },
    { character: "人", pinyin: "rén", meaning: "person" },
    { character: "十", pinyin: "shí", meaning: "ten" },
    { character: "来", pinyin: "lái", meaning: "come" },
    { character: "国", pinyin: "guó", meaning: "country" },
    { character: "白", pinyin: "bái", meaning: "white" },
    { character: "提", pinyin: "tí", meaning: "lift/raise" },
    { character: "茶", pinyin: "chá", meaning: "tea" },
    { character: "华", pinyin: "huá", meaning: "China/splendid" },
  ],
  3: [
    { character: "马", pinyin: "mǎ", meaning: "horse" },
    { character: "你", pinyin: "nǐ", meaning: "you" },
    { character: "我", pinyin: "wǒ", meaning: "I/me" },
    { character: "好", pinyin: "hǎo", meaning: "good" },
    { character: "小", pinyin: "xiǎo", meaning: "small" },
    { character: "把", pinyin: "bǎ", meaning: "grasp" },
    { character: "打", pinyin: "dǎ", meaning: "hit/strike" },
    { character: "法", pinyin: "fǎ", meaning: "law/method" },
  ],
  4: [
    { character: "骂", pinyin: "mà", meaning: "scold" },
    { character: "是", pinyin: "shì", meaning: "is/yes" },
    { character: "大", pinyin: "dà", meaning: "big" },
    { character: "去", pinyin: "qù", meaning: "go" },
    { character: "四", pinyin: "sì", meaning: "four" },
    { character: "爸", pinyin: "bà", meaning: "father" },
    { character: "太", pinyin: "tài", meaning: "too/very" },
    { character: "那", pinyin: "nà", meaning: "that" },
    { character: "下", pinyin: "xià", meaning: "down/below" },
    { character: "话", pinyin: "huà", meaning: "speech/words" },
  ],
};

type ToneNumber = 1 | 2 | 3 | 4;

interface Question {
  character: string;
  pinyin: string;
  meaning: string;
  correctTone: ToneNumber;
  options: ToneNumber[];
}

// Generate question for a specific tone pair
function generatePairQuestion(tones: ToneNumber[]): Question {
  const randomTone = tones[Math.floor(Math.random() * tones.length)];
  const characters = TONE_CHARACTERS[randomTone];
  const randomChar = characters[Math.floor(Math.random() * characters.length)];
  
  return {
    character: randomChar.character,
    pinyin: randomChar.pinyin,
    meaning: randomChar.meaning,
    correctTone: randomTone,
    options: tones,
  };
}

// Helper function to apply tone marks to pinyin
function applyToneMark(syllable: string, tone: ToneNumber): string {
  const toneMaps: Record<ToneNumber, Record<string, string>> = {
    1: { 'a': 'ā', 'e': 'ē', 'i': 'ī', 'o': 'ō', 'u': 'ū', 'ü': 'ǖ' },
    2: { 'a': 'á', 'e': 'é', 'i': 'í', 'o': 'ó', 'u': 'ú', 'ü': 'ǘ' },
    3: { 'a': 'ǎ', 'e': 'ě', 'i': 'ǐ', 'o': 'ǒ', 'u': 'ǔ', 'ü': 'ǚ' },
    4: { 'a': 'à', 'e': 'è', 'i': 'ì', 'o': 'ò', 'u': 'ù', 'ü': 'ǜ' },
  };
  
  const toneMap = toneMaps[tone];
  const vowelPriority = ['a', 'o', 'e'];
  let result = syllable.toLowerCase();
  
  for (const vowel of vowelPriority) {
    if (result.includes(vowel)) {
      return result.replace(vowel, toneMap[vowel] || vowel);
    }
  }
  
  const lastVowelMatch = result.match(/[iuü](?!.*[iuü])/);
  if (lastVowelMatch) {
    const vowel = lastVowelMatch[0];
    const index = result.lastIndexOf(vowel);
    return result.substring(0, index) + (toneMap[vowel] || vowel) + result.substring(index + 1);
  }
  
  return syllable;
}

const TONE_NAMES: Record<ToneNumber, string> = {
  1: "First Tone",
  2: "Second Tone",
  3: "Third Tone",
  4: "Fourth Tone",
};

const TONE_COLORS: Record<ToneNumber, string> = {
  1: "bg-blue-500",
  2: "bg-green-500",
  3: "bg-amber-500",
  4: "bg-red-500",
};

export default function TonePairDrills() {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const [selectedPair, setSelectedPair] = useState<typeof TONE_PAIRS[0] | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<ToneNumber | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [score, setScore] = useState({ correct: 0, total: 0 });
  const [streak, setStreak] = useState(0);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [audioCache, setAudioCache] = useState<Record<string, string>>({});
  const audioRef = useRef<HTMLAudioElement | null>(null);
  
  const generateAudio = trpc.wordbank.generateChineseToneAudio.useMutation();
  const recordAttempt = trpc.tonePractice.recordAttempt.useMutation();
  
  // Start drill for a specific tone pair
  const startDrill = (pair: typeof TONE_PAIRS[0]) => {
    setSelectedPair(pair);
    setCurrentQuestion(generatePairQuestion(pair.tones as ToneNumber[]));
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
    if (!selectedPair) return;
    setCurrentQuestion(generatePairQuestion(selectedPair.tones as ToneNumber[]));
    setSelectedAnswer(null);
    setShowResult(false);
  };
  
  // Play audio for a character
  const playAudio = async (character: string, tone: ToneNumber, pinyin: string) => {
    if (isPlayingAudio) return;
    
    setIsPlayingAudio(true);
    
    try {
      const cacheKey = `${character}-tone${tone}`;
      let audioUrl = audioCache[cacheKey];
      
      if (!audioUrl) {
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
        audioRef.current.onended = () => setIsPlayingAudio(false);
        audioRef.current.onerror = () => setIsPlayingAudio(false);
        await audioRef.current.play();
      } else {
        setIsPlayingAudio(false);
      }
    } catch (error) {
      console.error("Failed to play audio:", error);
      setIsPlayingAudio(false);
    }
  };
  
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
            <CardDescription>Please sign in to practice tone pairs</CardDescription>
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
      <MobileNav
        title="Tone Pair Drills"
        backPath="/wordbank"
        rightActions={
          selectedPair ? (
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1 text-orange-500 text-sm">
                <Flame className="h-4 w-4" />
                <span className="font-medium">{streak}</span>
              </div>
              <Badge variant="secondary" className="text-xs">
                {score.correct}/{score.total}
              </Badge>
            </div>
          ) : undefined
        }
      />
      
      {/* Hidden audio element */}
      <audio ref={audioRef} className="hidden" />
      
      <main className="container max-w-4xl py-8 px-4">
        {!selectedPair ? (
          // Pair Selection
          <div className="space-y-8">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-2">Choose a Tone Pair</h2>
              <p className="text-muted-foreground">
                Focus on commonly confused tone pairs to improve your accuracy
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-4">
              {TONE_PAIRS.map((pair) => (
                <Card 
                  key={pair.id}
                  className="cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => startDrill(pair)}
                >
                  <CardHeader className={`bg-gradient-to-r ${pair.color} text-white`}>
                    <CardTitle>{pair.name}</CardTitle>
                    <CardDescription className="text-white/90">
                      {pair.description}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="pt-6">
                    <Button className="w-full gap-2">
                      <Target className="h-4 w-4" />
                      Start Drill
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        ) : (
          // Practice Mode
          <div className="max-w-2xl mx-auto space-y-8">
            {/* Progress */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>{selectedPair.name} Practice</span>
                <span>{score.total} questions</span>
              </div>
              <Progress value={Math.min(score.total * 10, 100)} />
            </div>
            
            {currentQuestion && (
              <Card className="overflow-hidden">
                <CardHeader className={`text-center bg-gradient-to-r ${selectedPair.color} text-white`}>
                  <CardTitle className="text-lg">Which tone is this?</CardTitle>
                  <CardDescription className="text-white/90">
                    Listen carefully and choose between the two tones
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
                        <p className="text-lg font-medium text-primary">
                          {currentQuestion.pinyin}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {currentQuestion.meaning}
                        </p>
                      </div>
                    )}
                  </div>
                  
                  {/* Answer Options - Only 2 options for tone pair */}
                  <div className="grid grid-cols-2 gap-3">
                    {currentQuestion.options.map((tone) => {
                      const isSelected = selectedAnswer === tone;
                      const isCorrect = currentQuestion.correctTone === tone;
                      const baseSyllable = currentQuestion.pinyin.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
                      const optionPinyin = applyToneMark(baseSyllable, tone);
                      
                      let buttonClass = "h-auto py-6 flex flex-col items-center gap-2 transition-all";
                      
                      if (showResult) {
                        if (isCorrect) {
                          buttonClass += " bg-green-100 border-green-500 text-green-700";
                        } else if (isSelected && !isCorrect) {
                          buttonClass += " bg-red-100 border-red-500 text-red-700";
                        }
                      } else if (isSelected) {
                        buttonClass += " border-primary bg-primary/10";
                      }
                      
                      return (
                        <Button
                          key={tone}
                          variant="outline"
                          className={buttonClass}
                          onClick={() => handleAnswer(tone)}
                          disabled={showResult}
                        >
                          <span className="text-3xl mb-1">{optionPinyin}</span>
                          <span className="text-lg font-bold">{TONE_NAMES[tone]}</span>
                          {showResult && isCorrect && (
                            <CheckCircle2 className="h-6 w-6 text-green-600 mt-1" />
                          )}
                          {showResult && isSelected && !isCorrect && (
                            <XCircle className="h-6 w-6 text-red-600 mt-1" />
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
                            Incorrect - It was {TONE_NAMES[currentQuestion.correctTone]}
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
          </div>
        )}
      </main>
    </div>
  );
}
