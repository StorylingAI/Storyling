import { useState, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import Breadcrumb from "@/components/Breadcrumb";
import { CheckCircle2, XCircle, ArrowLeft, Calendar, Trophy, Flame, Mic, MicOff, Star, RotateCcw } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import {
  calculatePronunciationScore,
  getScoreColor,
  getScoreBgColor,
  type PronunciationScore,
} from "@/utils/pronunciationScoring";
import { MobileNav } from "@/components/MobileNav";

interface Question {
  word: string;
  wordbankId: number;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

export default function ReviewMode() {
  const [, setLocation] = useLocation();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [completed, setCompleted] = useState(false);
  const [isVoiceMode, setIsVoiceMode] = useState(false);
  const [pronunciationScore, setPronunciationScore] = useState<PronunciationScore | null>(null);
  const [showPronunciationFeedback, setShowPronunciationFeedback] = useState(false);

  const { data: quizData, isLoading } = trpc.wordbank.generateReviewQuiz.useQuery();
  const submitAnswer = trpc.practice.submitAnswer.useMutation();
  const utils = trpc.useUtils();

  const questions: Question[] = quizData?.questions || [];
  const totalDue = quizData?.totalDue || 0;
  const targetLanguage = quizData?.targetLanguage || "";

  // Speech recognition with language support
  const getLanguageCode = (targetLang: string) => {
    const langMap: Record<string, string> = {
      Chinese: "zh-CN",
      Spanish: "es-ES",
      French: "fr-FR",
      German: "de-DE",
      Japanese: "ja-JP",
      Korean: "ko-KR",
      Italian: "it-IT",
      Portuguese: "pt-PT",
      Russian: "ru-RU",
      Arabic: "ar-SA",
    };
    return langMap[targetLang] || "en-US";
  };

  const {
    isListening,
    transcript,
    confidence,
    error: speechError,
    isSupported: isSpeechSupported,
    startListening,
    stopListening,
    resetTranscript,
  } = useSpeechRecognition({
    language: getLanguageCode(targetLanguage),
    continuous: false,
    interimResults: true,
  });
  const nextReviewDate = quizData?.nextReviewDate;

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  useEffect(() => {
    // Reset timer when question changes
    setStartTime(Date.now());
  }, [currentQuestionIndex]);

  // Fuzzy match transcript to answer options
  const fuzzyMatch = useCallback((text: string, options: string[]): number | null => {
    if (!text) return null;

    const normalizedText = text.toLowerCase().trim();
    
    // First try exact match
    for (let i = 0; i < options.length; i++) {
      if (options[i].toLowerCase().trim() === normalizedText) {
        return i;
      }
    }

    // Then try partial match (transcript contains option or vice versa)
    for (let i = 0; i < options.length; i++) {
      const normalizedOption = options[i].toLowerCase().trim();
      if (
        normalizedText.includes(normalizedOption) ||
        normalizedOption.includes(normalizedText)
      ) {
        return i;
      }
    }

    // Try matching just the letter (A, B, C, D)
    const letterMatch = normalizedText.match(/^([a-d])$/i);
    if (letterMatch) {
      const letterIndex = letterMatch[1].toLowerCase().charCodeAt(0) - 97; // 'a' = 0
      if (letterIndex >= 0 && letterIndex < options.length) {
        return letterIndex;
      }
    }

    return null;
  }, []);

  // Handle voice input transcript changes
  useEffect(() => {
    if (!isListening && transcript && currentQuestion && !selectedAnswer) {
      const matchedIndex = fuzzyMatch(transcript, currentQuestion.options);
      if (matchedIndex !== null) {
        // Calculate pronunciation score
        const score = calculatePronunciationScore(confidence);
        setPronunciationScore(score);
        setShowPronunciationFeedback(true);
        
        handleAnswerSelect(matchedIndex);
        // Don't reset transcript yet - show it with pronunciation feedback
      } else {
        toast.error(`Couldn't match "${transcript}" to an answer. Try again!`);
        resetTranscript();
        setPronunciationScore(null);
        setShowPronunciationFeedback(false);
      }
    }
  }, [isListening, transcript, confidence, currentQuestion, selectedAnswer, fuzzyMatch, resetTranscript]);

  const handleAnswerSelect = async (answerIndex: number) => {
    if (selectedAnswer !== null) return; // Already answered

    setSelectedAnswer(answerIndex);
    setShowExplanation(true);

    const isCorrect = answerIndex === currentQuestion.correctIndex;
    const responseTime = (Date.now() - startTime) / 1000; // Convert to seconds

    if (isCorrect) {
      setCorrectCount(correctCount + 1);
    }

    // Submit answer to update SRS
    try {
      await submitAnswer.mutateAsync({
        wordbankId: currentQuestion.wordbankId,
        quizMode: "multiple_choice",
        isCorrect,
        responseTime,
      });

      // Invalidate due words count to update UI
      utils.wordbank.getDueCount.invalidate();
      utils.wordbank.getDueWords.invalidate();
    } catch (error) {
      console.error("Failed to submit answer:", error);
    }
  };

  const toggleVoiceMode = () => {
    if (!isSpeechSupported) {
      toast.error("Voice input not supported in your browser");
      return;
    }
    setIsVoiceMode(!isVoiceMode);
    if (isListening) {
      stopListening();
    }
  };

  const handleVoiceInput = () => {
    if (selectedAnswer !== null) return; // Already answered
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  // Keyboard shortcut: Space bar for voice input
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (e.code === "Space" && isVoiceMode && !showExplanation && currentQuestion) {
        e.preventDefault();
        handleVoiceInput();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isVoiceMode, showExplanation, currentQuestion, isListening]);

  const handleRetryPronunciation = () => {
    resetTranscript();
    setPronunciationScore(null);
    setShowPronunciationFeedback(false);
    setSelectedAnswer(null);
    // Start listening again
    setTimeout(() => {
      startListening();
    }, 100);
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowExplanation(false);
      setPronunciationScore(null);
      setShowPronunciationFeedback(false);
      resetTranscript();
    } else {
      // Quiz completed
      setCompleted(true);
      
      // Celebration confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
      });

      toast.success(`Review complete! ${correctCount + (selectedAnswer === currentQuestion.correctIndex ? 1 : 0)}/${questions.length} correct`);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-primary mx-auto mb-4"></div>
          <p className="text-lg text-muted-foreground">Loading review session...</p>
        </div>
      </div>
    );
  }

  // No words due for review
  if (questions.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50">
        <MobileNav title="Review Mode" backPath="/wordbank" />

        <div className="container py-16">
          <Card className="max-w-2xl mx-auto rounded-card shadow-playful-lg border-2 text-center">
            <CardContent className="pt-12 pb-12">
              <div className="w-24 h-24 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
                <Trophy className="h-12 w-12 text-green-600" />
              </div>
              <h2 className="text-3xl font-bold mb-4">All Caught Up! 🎉</h2>
              <p className="text-lg text-muted-foreground mb-6">
                You have no words due for review right now. Great job staying on top of your vocabulary!
              </p>
              
              {nextReviewDate && (
                <div className="bg-blue-50 border-2 border-blue-200 rounded-card p-4 mb-6">
                  <div className="flex items-center justify-center gap-2 text-blue-700">
                    <Calendar className="h-5 w-5" />
                    <p className="font-medium">
                      Next review: {new Date(nextReviewDate).toLocaleDateString(undefined, {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </p>
                  </div>
                </div>
              )}

              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => setLocation("/wordbank")}
                  variant="outline"
                  size="lg"
                  className="rounded-button hover-lift"
                >
                  Back to Wordbank
                </Button>
                <Button
                  onClick={() => setLocation("/create")}
                  size="lg"
                  className="rounded-button gradient-primary text-white hover-lift active-scale"
                >
                  Create New Story
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Quiz completed
  if (completed) {
    const finalCorrectCount = correctCount + (selectedAnswer === currentQuestion.correctIndex ? 1 : 0);
    const accuracy = Math.round((finalCorrectCount / questions.length) * 100);

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50">
        <MobileNav title="Review Complete!" backPath="/wordbank" />

        <div className="container py-16">
          <Card className="max-w-2xl mx-auto rounded-card shadow-playful-lg border-2 text-center">
            <CardContent className="pt-12 pb-12">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-500 to-teal-500 flex items-center justify-center mx-auto mb-6">
                <Trophy className="h-12 w-12 text-white" />
              </div>
              
              <h2 className="text-4xl font-bold mb-4">Excellent Work! 🎉</h2>
              <p className="text-lg text-muted-foreground mb-8">
                You've completed your review session
              </p>

              <div className="grid grid-cols-3 gap-6 mb-8">
                <div className="bg-purple-50 rounded-card p-6 border-2 border-purple-200">
                  <p className="text-4xl font-bold text-purple-600 mb-2">{finalCorrectCount}</p>
                  <p className="text-sm text-muted-foreground">Correct</p>
                </div>
                <div className="bg-teal-50 rounded-card p-6 border-2 border-teal-200">
                  <p className="text-4xl font-bold text-teal-600 mb-2">{accuracy}%</p>
                  <p className="text-sm text-muted-foreground">Accuracy</p>
                </div>
                <div className="bg-orange-50 rounded-card p-6 border-2 border-orange-200">
                  <p className="text-4xl font-bold text-orange-600 mb-2">{questions.length}</p>
                  <p className="text-sm text-muted-foreground">Reviewed</p>
                </div>
              </div>

              <div className="flex gap-4 justify-center">
                <Button
                  onClick={() => {
                    setCompleted(false);
                    setCurrentQuestionIndex(0);
                    setSelectedAnswer(null);
                    setShowExplanation(false);
                    setCorrectCount(0);
                    window.location.reload(); // Reload to get new due words
                  }}
                  variant="outline"
                  size="lg"
                  className="rounded-button hover-lift"
                >
                  Review More
                </Button>
                <Button
                  onClick={() => setLocation("/srs-stats")}
                  size="lg"
                  className="rounded-button gradient-primary text-white hover-lift active-scale"
                >
                  View Statistics
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Quiz in progress
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50">
      <MobileNav
        title={`Review (${currentQuestionIndex + 1}/${questions.length})`}
        backPath="/wordbank"
        rightActions={
          <div className="flex items-center gap-2">
            {isSpeechSupported && (
              <Button
                variant={isVoiceMode ? "default" : "outline"}
                size="sm"
                onClick={toggleVoiceMode}
                className="rounded-full h-8 px-2"
              >
                {isVoiceMode ? <Mic className="h-4 w-4" /> : <MicOff className="h-4 w-4" />}
              </Button>
            )}
            <div className="flex items-center gap-1 text-orange-600 text-sm">
              <Flame className="h-4 w-4" />
              <span className="font-bold">{totalDue}</span>
            </div>
          </div>
        }
      />

      <div className="container py-8">
        {/* Breadcrumb */}
        <div className="max-w-3xl mx-auto mb-6">
          <Breadcrumb
            items={[
              { label: "Wordbank", href: "/wordbank" },
              { label: "Review Mode", href: undefined },
            ]}
          />
        </div>
        {/* Progress Bar */}
        <div className="max-w-3xl mx-auto mb-6">
          <Progress value={progress} className="h-3" />
        </div>

        {/* Pronunciation Feedback */}
        {showPronunciationFeedback && pronunciationScore && (
          <Card className={`max-w-3xl mx-auto rounded-card shadow-playful-lg border-2 mb-4 animate-slide-up ${getScoreBgColor(pronunciationScore.level)}`}>
            <CardContent className="py-6">
              <div className="space-y-4">
                {/* Star Rating */}
                <div className="flex items-center justify-center gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <Star
                      key={star}
                      className={`h-8 w-8 ${
                        star <= pronunciationScore.stars
                          ? "fill-yellow-400 text-yellow-400"
                          : "text-gray-300"
                      }`}
                    />
                  ))}
                </div>

                {/* Score and Feedback */}
                <div className="text-center space-y-2">
                  <h3 className={`text-2xl font-bold ${getScoreColor(pronunciationScore.level)}`}>
                    {pronunciationScore.percentage}% - {pronunciationScore.level.replace("-", " ").toUpperCase()}
                  </h3>
                  <p className="text-lg">{pronunciationScore.feedback}</p>
                  <p className="text-sm text-muted-foreground">
                    You said: <strong>"{transcript}"</strong>
                  </p>
                </div>

                {/* Tips */}
                {pronunciationScore.tips.length > 0 && (
                  <div className="bg-white/50 rounded-lg p-4">
                    <h4 className="font-semibold mb-2">💡 Tips to improve:</h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      {pronunciationScore.tips.map((tip, index) => (
                        <li key={index}>{tip}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Retry Button */}
                {!showExplanation && (
                  <div className="flex justify-center pt-2">
                    <Button
                      variant="outline"
                      onClick={handleRetryPronunciation}
                      className="rounded-button hover-lift"
                    >
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Try Again
                    </Button>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Voice Input Transcript */}
        {isVoiceMode && isListening && !showPronunciationFeedback && (
          <Card className="max-w-3xl mx-auto rounded-card shadow-playful-lg border-2 border-blue-500 bg-blue-50 mb-4 animate-pulse">
            <CardContent className="py-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center animate-bounce">
                  <Mic className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">Listening...</p>
                  <p className="text-lg text-blue-700">{transcript || "Speak your answer"}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Question Card */}
        <Card className="max-w-3xl mx-auto rounded-card shadow-playful-lg border-2 animate-slide-up">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <CardTitle className="text-2xl flex-1">
                {currentQuestion.question}
              </CardTitle>
              {isVoiceMode && !showExplanation && (
                <Button
                  variant={isListening ? "destructive" : "default"}
                  size="lg"
                  onClick={handleVoiceInput}
                  className="rounded-full w-14 h-14 p-0 hover-lift active-scale"
                >
                  <Mic className={`h-6 w-6 ${isListening ? 'animate-pulse' : ''}`} />
                </Button>
              )}
            </div>
            {isVoiceMode && !showExplanation && (
              <p className="text-sm text-muted-foreground mt-2">
                💡 Click the microphone or press <kbd className="px-2 py-1 bg-gray-100 rounded border">Space</kbd> to speak your answer
              </p>
            )}
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Answer Options */}
            <div className="grid gap-3">
              {currentQuestion.options.map((option, index) => {
                const isSelected = selectedAnswer === index;
                const isCorrect = index === currentQuestion.correctIndex;
                const showResult = showExplanation;

                let buttonClass = "w-full justify-start text-left h-auto py-4 px-6 rounded-button border-2 transition-all";
                
                if (showResult) {
                  if (isCorrect) {
                    buttonClass += " bg-green-50 border-green-500 text-green-900";
                  } else if (isSelected && !isCorrect) {
                    buttonClass += " bg-red-50 border-red-500 text-red-900";
                  } else {
                    buttonClass += " opacity-50";
                  }
                } else {
                  buttonClass += " hover-lift active-scale";
                }

                return (
                  <Button
                    key={index}
                    variant="outline"
                    className={buttonClass}
                    onClick={() => handleAnswerSelect(index)}
                    disabled={showExplanation}
                  >
                    <div className="flex items-center gap-3 w-full">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center font-bold shrink-0">
                        {String.fromCharCode(65 + index)}
                      </div>
                      <span className="flex-1">{option}</span>
                      {showResult && isCorrect && (
                        <CheckCircle2 className="h-6 w-6 text-green-600 shrink-0" />
                      )}
                      {showResult && isSelected && !isCorrect && (
                        <XCircle className="h-6 w-6 text-red-600 shrink-0" />
                      )}
                    </div>
                  </Button>
                );
              })}
            </div>

            {/* Explanation */}
            {showExplanation && (
              <div className="mt-6 p-6 bg-blue-50 border-2 border-blue-200 rounded-card animate-slide-up">
                <p className="font-medium text-blue-900 mb-2">Explanation:</p>
                <p className="text-blue-800">{currentQuestion.explanation}</p>
              </div>
            )}

            {/* Next Button */}
            {showExplanation && (
              <Button
                onClick={handleNext}
                size="lg"
                className="w-full rounded-button gradient-primary text-white hover-lift active-scale mt-6"
              >
                {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Review"}
              </Button>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
