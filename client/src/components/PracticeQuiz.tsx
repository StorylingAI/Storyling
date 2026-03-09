import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  XCircle,
  Volume2,
  Trophy,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";

type QuizMode = "flashcard" | "multiple_choice" | "fill_in_blank";

interface Word {
  id: number;
  word: string;
  pinyin: string | null;
  translation: string;
  targetLanguage: string;
  exampleSentences: string[] | null;
  audioUrl: string | null;
}

interface PracticeQuizProps {
  quizMode: QuizMode;
  count?: number;
  targetLanguage?: string;
  masteryLevel?: "learning" | "familiar" | "mastered";
  onComplete: (stats: { correct: number; total: number; xpEarned: number }) => void;
}

export default function PracticeQuiz({
  quizMode,
  count = 10,
  targetLanguage,
  masteryLevel,
  onComplete,
}: PracticeQuizProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [userAnswer, setUserAnswer] = useState("");
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [totalXp, setTotalXp] = useState(0);
  const [multipleChoiceOptions, setMultipleChoiceOptions] = useState<string[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());

  const startSession = trpc.practice.startSession.useMutation();
  const [session, setSession] = useState<typeof startSession.data | null>(null);
  
  useEffect(() => {
    startSession.mutate(
      {
        quizMode,
        count,
        targetLanguage,
        masteryLevel,
      },
      {
        onSuccess: (data) => setSession(data),
      }
    );
  }, [quizMode, count, targetLanguage, masteryLevel]);

  const isLoading = startSession.isPending;

  const submitAnswer = trpc.practice.submitAnswer.useMutation();
  const generateAudio = trpc.audio.generateWordAudio.useMutation();

  const words = session?.words || [];
  const currentWord = words[currentIndex];
  const progressPercent = words.length > 0 ? ((currentIndex + 1) / words.length) * 100 : 0;

  // Generate multiple choice options when mode changes or word changes
  useEffect(() => {
    if (quizMode === "multiple_choice" && currentWord && words.length > 0) {
      const correctAnswer = currentWord.translation || currentWord.word;
      const otherWords = words.filter((w: Word) => w.id !== currentWord.id);
      
      // Shuffle and pick 3 random wrong answers
      const shuffled = [...otherWords].sort(() => Math.random() - 0.5);
      const wrongAnswers = shuffled.slice(0, 3).map((w: Word) => w.translation || w.word);
      
      // Filter out empty/duplicate answers
      const uniqueWrongAnswers = wrongAnswers.filter((ans, idx, arr) => 
        ans && ans.trim() && arr.indexOf(ans) === idx && ans !== correctAnswer
      );
      
      // If we don't have enough unique options, add placeholders
      while (uniqueWrongAnswers.length < 3) {
        uniqueWrongAnswers.push(`Option ${uniqueWrongAnswers.length + 1}`);
      }
      
      // Combine and shuffle all options
      const allOptions = [correctAnswer, ...uniqueWrongAnswers.slice(0, 3)].sort(() => Math.random() - 0.5);
      setMultipleChoiceOptions(allOptions);
    }
  }, [currentWord, quizMode, words]);

  // Reset timer when word changes
  useEffect(() => {
    setQuestionStartTime(Date.now());
  }, [currentIndex]);

  const handlePlayAudio = async () => {
    if (!currentWord) return;
    try {
      const result = await generateAudio.mutateAsync({
        word: currentWord.word,
        targetLanguage: currentWord.targetLanguage,
      });
      const audio = new Audio(result.audioUrl);
      audio.play();
    } catch (error) {
      toast.error("Failed to play audio");
    }
  };

  const checkAnswer = () => {
    if (!currentWord) return;

    let correct = false;

    if (quizMode === "multiple_choice") {
      correct = selectedOption !== null && multipleChoiceOptions[selectedOption] === currentWord.translation;
    } else if (quizMode === "fill_in_blank") {
      const normalized = userAnswer.trim().toLowerCase();
      const correctAnswer = currentWord.translation.toLowerCase();
      const correctWord = currentWord.word.toLowerCase();
      correct = normalized === correctAnswer || normalized === correctWord;
    }

    setIsCorrect(correct);
    setShowResult(true);

    if (correct) {
      setCorrectCount((prev) => prev + 1);
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.7 },
      });
    }

    // Calculate response time
    const responseTime = Date.now() - questionStartTime;

    // Submit answer to backend
    submitAnswer.mutate(
      {
        wordbankId: currentWord.id,
        quizMode,
        isCorrect: correct,
        responseTime,
      },
      {
        onSuccess: (data) => {
          setTotalXp((prev) => prev + data.xpEarned);
          if (data.leveledUp) {
            toast.success(`🎉 Mastery level upgraded to ${data.newMasteryLevel}!`);
          }
        },
      }
    );
  };

  const handleNext = () => {
    if (currentIndex + 1 >= words.length) {
      // Quiz complete
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });
      onComplete({
        correct: correctCount,
        total: words.length,
        xpEarned: totalXp,
      });
    } else {
      setCurrentIndex((prev) => prev + 1);
      setIsFlipped(false);
      setUserAnswer("");
      setSelectedOption(null);
      setShowResult(false);
      setIsCorrect(false);
    }
  };

  const handleFlashcardFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleFlashcardKnow = (know: boolean) => {
    if (!currentWord) return;

    setIsCorrect(know);
    setShowResult(true);

    if (know) {
      setCorrectCount((prev) => prev + 1);
    }

    // Calculate response time
    const responseTime = Date.now() - questionStartTime;

    submitAnswer.mutate(
      {
        wordbankId: currentWord.id,
        quizMode,
        isCorrect: know,
        responseTime,
      },
      {
        onSuccess: (data) => {
          setTotalXp((prev) => prev + data.xpEarned);
        },
      }
    );
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading practice session...</p>
        </div>
      </div>
    );
  }

  if (!currentWord) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-gray-600">No words available for practice.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      {/* Progress Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-600">
            Question {currentIndex + 1} of {words.length}
          </span>
          <div className="flex items-center gap-2">
            <Trophy className="w-4 h-4 text-yellow-500" />
            <span className="text-sm font-bold text-purple-600">{totalXp} XP</span>
          </div>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>

      {/* Flashcard Mode */}
      {quizMode === "flashcard" && (
        <div className="space-y-4">
          <Card
            className={`cursor-pointer transition-all duration-500 transform hover:scale-105 ${
              isFlipped ? "bg-gradient-to-br from-purple-500 to-blue-500 text-white" : ""
            }`}
            onClick={handleFlashcardFlip}
          >
            <CardContent className="py-16 text-center">
              {!isFlipped ? (
                <div>
                  <div className="flex items-center justify-center gap-3 mb-4">
                    <h2 className="text-4xl font-bold">{currentWord.word}</h2>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handlePlayAudio();
                      }}
                    >
                      <Volume2 className="w-5 h-5" />
                    </Button>
                  </div>
                  {currentWord.pinyin && (
                    <p className="text-2xl text-gray-600 mb-4">{currentWord.pinyin}</p>
                  )}
                  <p className="text-gray-500 mt-8">Click to reveal translation</p>
                </div>
              ) : (
                <div>
                  <h2 className="text-3xl font-bold mb-6">
                    {currentWord.translation || "(Translation not available)"}
                  </h2>
                  {currentWord.exampleSentences && currentWord.exampleSentences.length > 0 && (
                    <div className="mt-6 space-y-2">
                      {currentWord.exampleSentences.slice(0, 2).map((sentence: string, idx: number) => (
                        <p key={idx} className="text-sm italic opacity-90">
                          {sentence}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </CardContent>
          </Card>

          {isFlipped && !showResult && (
            <div className="flex gap-4">
              <Button
                size="lg"
                variant="outline"
                className="flex-1"
                onClick={() => handleFlashcardKnow(false)}
              >
                <XCircle className="w-5 h-5 mr-2" />
                Don't Know
              </Button>
              <Button
                size="lg"
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => handleFlashcardKnow(true)}
              >
                <CheckCircle2 className="w-5 h-5 mr-2" />
                I Know This!
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Multiple Choice Mode */}
      {quizMode === "multiple_choice" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="py-12 text-center">
              <div className="flex items-center justify-center gap-3 mb-4">
                <h2 className="text-4xl font-bold">{currentWord.word}</h2>
                <Button size="sm" variant="ghost" onClick={handlePlayAudio}>
                  <Volume2 className="w-5 h-5" />
                </Button>
              </div>
              {currentWord.pinyin && (
                <p className="text-2xl text-gray-600">{currentWord.pinyin}</p>
              )}
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-3">
            {multipleChoiceOptions.map((option, index) => (
              <Button
                key={index}
                size="lg"
                variant={selectedOption === index ? "default" : "outline"}
                className={`text-left justify-start h-auto py-4 ${
                  showResult
                    ? option === currentWord.translation
                      ? "bg-green-100 border-green-500 text-green-800"
                      : selectedOption === index
                      ? "bg-red-100 border-red-500 text-red-800"
                      : ""
                    : ""
                }`}
                onClick={() => !showResult && setSelectedOption(index)}
                disabled={showResult}
              >
                <span className="font-semibold mr-3">{String.fromCharCode(65 + index)}.</span>
                {option}
              </Button>
            ))}
          </div>

          {!showResult && selectedOption !== null && (
            <Button size="lg" className="w-full" onClick={checkAnswer}>
              Submit Answer
            </Button>
          )}
        </div>
      )}

      {/* Fill-in-the-Blank Mode */}
      {quizMode === "fill_in_blank" && (
        <div className="space-y-4">
          <Card>
            <CardContent className="py-12 text-center">
              <p className="text-gray-600 mb-2">Translate this word:</p>
              <div className="flex items-center justify-center gap-3 mb-4">
                <h2 className="text-4xl font-bold">{currentWord.word}</h2>
                <Button size="sm" variant="ghost" onClick={handlePlayAudio}>
                  <Volume2 className="w-5 h-5" />
                </Button>
              </div>
              {currentWord.pinyin && (
                <p className="text-2xl text-gray-600">{currentWord.pinyin}</p>
              )}
            </CardContent>
          </Card>

          <Input
            placeholder="Type your answer..."
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && userAnswer.trim() && !showResult) {
                checkAnswer();
              }
            }}
            disabled={showResult}
            className="text-lg py-6"
          />

          {!showResult && userAnswer.trim() && (
            <Button size="lg" className="w-full" onClick={checkAnswer}>
              Submit Answer
            </Button>
          )}

          {showResult && (
            <Card className={isCorrect ? "bg-green-50 border-green-300" : "bg-red-50 border-red-300"}>
              <CardContent className="py-4">
                <p className="font-semibold mb-2">
                  {isCorrect ? "✓ Correct!" : "✗ Incorrect"}
                </p>
                <p className="text-sm text-gray-700">
                  Correct answer: <span className="font-bold">{currentWord.translation}</span>
                </p>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* Result and Next Button */}
      {showResult && (
        <div className="mt-6 space-y-4">
          <Card className={isCorrect ? "bg-green-50 border-green-300" : "bg-amber-50 border-amber-300"}>
            <CardContent className="py-4 text-center">
              {isCorrect ? (
                <div>
                  <CheckCircle2 className="w-12 h-12 text-green-600 mx-auto mb-2" />
                  <p className="text-lg font-bold text-green-800">Excellent! +5 XP</p>
                </div>
              ) : (
                <div>
                  <p className="text-lg font-semibold text-amber-800 mb-2">Keep practicing!</p>
                  <p className="text-sm text-gray-700">
                    The correct answer is: <span className="font-bold">{currentWord.translation}</span>
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Button size="lg" className="w-full" onClick={handleNext}>
            {currentIndex + 1 >= words.length ? (
              <>
                <Trophy className="w-5 h-5 mr-2" />
                Finish Practice
              </>
            ) : (
              <>
                Next Question
                <ArrowRight className="w-5 h-5 ml-2" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
