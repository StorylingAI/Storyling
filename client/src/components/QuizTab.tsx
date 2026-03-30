import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, XCircle, Sparkles, RotateCcw } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { APP_LOGO } from "@/const";
import { LevelUpModal } from "@/components/LevelUpModal";

interface QuizQuestion {
  word: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
}

interface QuizTabProps {
  contentId: number;
  targetLanguage: string;
}

export function QuizTab({ contentId, targetLanguage }: QuizTabProps) {
  const [quizStarted, setQuizStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<Array<{ questionIndex: number; selectedIndex: number; correct: boolean; word: string }>>([]);
  const [quizCompleted, setQuizCompleted] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [showLevelUpModal, setShowLevelUpModal] = useState(false);
  const [levelUpData, setLevelUpData] = useState<{ newLevel: number; totalXp: number; previousLevel?: number } | null>(null);

  const generateQuizMutation = trpc.quiz.generate.useMutation();
  const saveAttemptMutation = trpc.quiz.saveAttempt.useMutation({
    onSuccess: (data) => {
      // Check if user leveled up
      if (data.leveledUp && data.newLevel && data.previousLevel) {
        // Show level-up modal instead of toast
        setLevelUpData({
          newLevel: data.newLevel,
          totalXp: data.totalXp || 0,
          previousLevel: data.previousLevel,
        });
        setShowLevelUpModal(true);
      } else {
        // Show XP reward toast
        toast.success("🎉 Quiz Completed!", {
          description: `You earned ${data.xpEarned} XP! ${data.newStreak > 1 ? `🔥 ${data.newStreak} day streak!` : ""} ${data.newLevel ? `⭐ Level ${data.newLevel}!` : ""}`
        });
      }

      // Show achievement unlocks
      if (data.achievementsUnlocked && data.achievementsUnlocked.length > 0) {
        data.achievementsUnlocked.forEach((achievement: any) => {
          setTimeout(() => {
            toast.success(`🏆 Achievement Unlocked!`, {
              description: `${achievement.icon} ${achievement.name} - +${achievement.xpReward} XP`,
              duration: 5000,
            });
          }, 1000);
        });
      }
    },
  });
  const { data: attempts } = trpc.quiz.getAttempts.useQuery({ contentId });

  const startQuiz = async () => {
    try {
      const result = await generateQuizMutation.mutateAsync({ contentId });
      if (result.questions && result.questions.length > 0) {
        setQuestions(result.questions);
        setQuizStarted(true);
        setCurrentQuestionIndex(0);
        setScore(0);
        setAnswers([]);
        setQuizCompleted(false);
      } else {
        toast.error("Failed to generate quiz questions");
      }
    } catch (error) {
      toast.error("Failed to start quiz");
      console.error(error);
    }
  };

  const handleAnswerSelect = (optionIndex: number) => {
    if (showFeedback) return; // Prevent changing answer after submission
    setSelectedAnswer(optionIndex);
  };

  const handleSubmitAnswer = () => {
    if (selectedAnswer === null) return;

    const currentQuestion = questions[currentQuestionIndex];
    const isCorrect = selectedAnswer === currentQuestion.correctIndex;

    setShowFeedback(true);

    if (isCorrect) {
      setScore(score + 1);
      toast.success("Correct! 🎉");
    } else {
      toast.error("Not quite right");
    }

    setAnswers([
      ...answers,
      {
        questionIndex: currentQuestionIndex,
        selectedIndex: selectedAnswer,
        correct: isCorrect,
        word: currentQuestion.word,
      },
    ]);
  };

  const handleNextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
      setSelectedAnswer(null);
      setShowFeedback(false);
    } else {
      // Quiz completed
      setQuizCompleted(true);
      const finalAnswer = {
        questionIndex: currentQuestionIndex,
        selectedIndex: selectedAnswer!,
        correct: selectedAnswer === questions[currentQuestionIndex].correctIndex,
        word: questions[currentQuestionIndex].word,
      };
      
      saveAttemptMutation.mutate({
        contentId,
        score: score + (selectedAnswer === questions[currentQuestionIndex].correctIndex ? 1 : 0),
        totalQuestions: questions.length,
        answers: [...answers, finalAnswer],
        targetLanguage,
      });
    }
  };

  const resetQuiz = () => {
    setQuizStarted(false);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowFeedback(false);
    setScore(0);
    setAnswers([]);
    setQuizCompleted(false);
    setQuestions([]);
  };

  if (!quizStarted) {
    return (
      <>
      <Card className="rounded-card shadow-playful border-2 animate-scale-in">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <img src={APP_LOGO} alt="Flip" className="w-32 h-32 mx-auto animate-float" />
          <div>
            <h3 className="text-2xl font-bold mb-2">Test Your Knowledge!</h3>
            <p className="text-muted-foreground text-lg max-w-md mx-auto">
              Ready to practice the vocabulary from this story? Take a quick quiz to reinforce your learning.
            </p>
          </div>

          {attempts && attempts.length > 0 && (
            <div className="bg-muted/50 rounded-card p-4 max-w-md mx-auto">
              <h4 className="font-semibold mb-2">Previous Attempts</h4>
              <div className="space-y-2">
                {attempts.slice(-3).reverse().map((attempt, idx) => (
                  <div key={attempt.id} className="flex items-center justify-between text-sm">
                    <span>Attempt {attempts.length - idx}</span>
                    <Badge variant="outline" className="rounded-full">
                      {attempt.score}/{attempt.totalQuestions} correct
                    </Badge>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            size="lg"
            onClick={startQuiz}
            disabled={generateQuizMutation.isPending}
            className="rounded-button gradient-primary text-white hover-lift hover-glow active-scale border-0 h-14 text-lg px-8 transition-all"
          >
            {generateQuizMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Generating Quiz...
              </>
            ) : (
              <>
                <Sparkles className="mr-2 h-5 w-5" />
                Start Quiz
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Level-up modal */}
      {levelUpData && (
        <LevelUpModal
          isOpen={showLevelUpModal}
          onClose={() => setShowLevelUpModal(false)}
          newLevel={levelUpData.newLevel}
          totalXp={levelUpData.totalXp}
          previousLevel={levelUpData.previousLevel}
        />
      )}
      </>
    );
  }

  if (quizCompleted) {
    const percentage = Math.round((score / questions.length) * 100);
    const isPerfect = score === questions.length;
    const isGood = percentage >= 70;

    return (
      <>
      <Card className="rounded-card shadow-playful border-2 animate-bounce-in">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <img
            src={APP_LOGO}
            alt="Flip"
            className={`w-32 h-32 mx-auto ${isPerfect ? "animate-bounce animate-glow" : "animate-float"}`}
          />
          <div>
            <h3 className="text-3xl font-bold mb-2 gradient-text-primary">
              {isPerfect ? "Perfect Score! 🎉" : isGood ? "Great Job! 👏" : "Keep Practicing! 💪"}
            </h3>
            <p className="text-muted-foreground text-lg">
              You got {score} out of {questions.length} questions correct
            </p>
          </div>

          <div className="max-w-md mx-auto">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Score</span>
              <span className="text-sm text-muted-foreground">{percentage}%</span>
            </div>
            <Progress value={percentage} className="h-3" />
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button
              onClick={resetQuiz}
              className="rounded-button gradient-primary text-white hover-lift active-scale border-0 transition-all"
            >
              <RotateCcw className="mr-2 h-4 w-4" />
              Try Again
            </Button>
            <Button
              variant="outline"
              onClick={() => setQuizStarted(false)}
              className="rounded-button hover-scale active-scale transition-all"
            >
              Back to Start
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Level-up modal */}
      {levelUpData && (
        <LevelUpModal
          isOpen={showLevelUpModal}
          onClose={() => setShowLevelUpModal(false)}
          newLevel={levelUpData.newLevel}
          totalXp={levelUpData.totalXp}
          previousLevel={levelUpData.previousLevel}
        />
      )}
      </>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <>
    <Card className="rounded-card shadow-playful border-2 animate-slide-up">
      <CardContent className="pt-6 pb-6 space-y-6">
        {/* Progress */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium">
              Question {currentQuestionIndex + 1} of {questions.length}
            </span>
            <Badge variant="outline" className="rounded-full">
              Score: {score}/{questions.length}
            </Badge>
          </div>
          <Progress value={progress} className="h-2" />
        </div>

        {/* Question */}
        <div className="space-y-4">
          <div className="bg-muted/50 rounded-card p-6">
            <Badge className="rounded-full mb-3 gradient-primary text-white border-0">
              {currentQuestion.word}
            </Badge>
            <h3 className="text-xl font-bold">{currentQuestion.question}</h3>
          </div>

          {/* Options */}
          <div className="grid gap-3">
            {currentQuestion.options.map((option, idx) => {
              const isSelected = selectedAnswer === idx;
              const isCorrect = idx === currentQuestion.correctIndex;
              const showCorrect = showFeedback && isCorrect;
              const showIncorrect = showFeedback && isSelected && !isCorrect;

              return (
                <button
                  key={idx}
                  onClick={() => handleAnswerSelect(idx)}
                  disabled={showFeedback}
                  className={`
                    relative p-4 rounded-card border-2 text-left transition-all
                    ${isSelected && !showFeedback ? "border-primary bg-primary/10 scale-105" : "border-border"}
                    ${showCorrect ? "border-green-500 bg-green-50 animate-scale-in" : ""}
                    ${showIncorrect ? "border-red-500 bg-red-50 animate-shake" : ""}
                    ${!showFeedback ? "hover-lift hover-scale cursor-pointer" : "cursor-default"}
                    ${showFeedback ? "opacity-60" : ""}
                    ${showCorrect || showIncorrect ? "opacity-100" : ""}
                  `}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{option}</span>
                    {showCorrect && (
                      <CheckCircle2 className="h-6 w-6 text-green-600 animate-scale-in" />
                    )}
                    {showIncorrect && (
                      <XCircle className="h-6 w-6 text-red-600 animate-scale-in" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Explanation */}
          {showFeedback && (
            <div className="bg-muted/50 rounded-card p-4 animate-slide-down">
              <h4 className="font-semibold mb-2">Explanation</h4>
              <p className="text-sm text-muted-foreground">{currentQuestion.explanation}</p>
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex justify-end gap-3">
          {!showFeedback ? (
            <Button
              onClick={handleSubmitAnswer}
              disabled={selectedAnswer === null}
              className="rounded-button gradient-primary text-white hover-lift active-scale border-0 transition-all"
            >
              Submit Answer
            </Button>
          ) : (
            <Button
              onClick={handleNextQuestion}
              className="rounded-button gradient-primary text-white hover-lift active-scale border-0 transition-all"
            >
              {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Finish Quiz"}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>

    {/* Level-up modal */}
    {levelUpData && (
      <LevelUpModal
        isOpen={showLevelUpModal}
        onClose={() => setShowLevelUpModal(false)}
        newLevel={levelUpData.newLevel}
        totalXp={levelUpData.totalXp}
        previousLevel={levelUpData.previousLevel}
      />
    )}
    </>
  );
}
