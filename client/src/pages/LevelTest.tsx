import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Loader2, CheckCircle2, XCircle, ArrowLeft, Trophy, Target, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface Question {
  id: number;
  question: string;
  options: string[];
  correctAnswer: number;
  difficulty: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  skillArea: "vocabulary" | "grammar" | "reading";
  explanation: string;
}

interface TestResult {
  proficiencyLevel: "A1" | "A2" | "B1" | "B2" | "C1" | "C2";
  score: number;
  correctAnswers: number;
  totalQuestions: number;
  breakdown: {
    A1: { correct: number; total: number };
    A2: { correct: number; total: number };
    B1: { correct: number; total: number };
    B2: { correct: number; total: number };
    C1: { correct: number; total: number };
    C2: { correct: number; total: number };
  };
}

export default function LevelTest() {
  const [, setLocation] = useLocation();
  const [targetLanguage, setTargetLanguage] = useState<string>("");
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [testResult, setTestResult] = useState<TestResult | null>(null);
  const [isStarted, setIsStarted] = useState(false);
  const [showReview, setShowReview] = useState(false);

  const generateTestMutation = trpc.levelTest.generateTest.useMutation();
  const submitTestMutation = trpc.levelTest.submitTest.useMutation();

  const handleStartTest = async (language: string) => {
    setTargetLanguage(language);
    try {
      const generatedQuestions = await generateTestMutation.mutateAsync({
        targetLanguage: language,
      });
      setQuestions(generatedQuestions);
      setIsStarted(true);
      setCurrentQuestionIndex(0);
      setAnswers([]);
      setSelectedAnswer(null);
    } catch (error) {
      toast.error("Failed to generate test questions. Please try again.");
      console.error(error);
    }
  };

  const handleAnswerSelect = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
  };

  const handleNextQuestion = () => {
    if (selectedAnswer === null) {
      toast.error("Please select an answer");
      return;
    }

    const newAnswers = [...answers, selectedAnswer];
    setAnswers(newAnswers);
    setSelectedAnswer(null);

    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    } else {
      // Submit test
      handleSubmitTest(newAnswers);
    }
  };

  const handleSubmitTest = async (finalAnswers: number[]) => {
    try {
      const result = await submitTestMutation.mutateAsync({
        targetLanguage,
        questions,
        answers: finalAnswers,
      });
      setTestResult(result);
      toast.success("Test completed!");
    } catch (error) {
      toast.error("Failed to submit test. Please try again.");
      console.error(error);
    }
  };

  const handleRetakeTest = () => {
    setIsStarted(false);
    setTestResult(null);
    setQuestions([]);
    setAnswers([]);
    setCurrentQuestionIndex(0);
    setSelectedAnswer(null);
    setShowReview(false);
  };

  const handleUseResult = () => {
    // Navigate to create story page with language and level pre-filled
    setLocation(`/app?language=${encodeURIComponent(targetLanguage)}&level=${testResult?.proficiencyLevel}`);
  };

  const currentQuestion = questions[currentQuestionIndex];
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  // Language selection screen
  if (!isStarted && !testResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50 p-6">
        <div className="max-w-2xl mx-auto">
          <Button
            variant="ghost"
            onClick={() => window.history.back()}
            className="mb-6"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to App
          </Button>

          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-purple-500 to-teal-500 flex items-center justify-center">
                  <Target className="h-8 w-8 text-white" />
                </div>
              </div>
              <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-teal-600 bg-clip-text text-transparent">
                Language Level Test
              </CardTitle>
              <CardDescription className="text-lg mt-2">
                Take a comprehensive 12-question test to accurately determine your CEFR proficiency level
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">What to expect:</h3>
                <ul className="space-y-2 text-sm text-blue-800">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>12 multiple-choice questions covering vocabulary, grammar, and reading comprehension</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Questions range from A1 (Beginner) to C2 (Proficient) following CEFR standards</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Takes approximately 5-7 minutes to complete</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 flex-shrink-0" />
                    <span>Get instant results with your CEFR level (A1-C2)</span>
                  </li>
                </ul>
              </div>

              <div className="space-y-3">
                <Label className="text-lg font-semibold">Select a language to test:</Label>
                <div className="grid grid-cols-1 gap-3">
                  {["Chinese", "Spanish", "French", "German", "Hebrew", "Persian (Farsi)", "Turkish", "Hindi", "English"].map((lang) => (
                    <Button
                      key={lang}
                      onClick={() => handleStartTest(lang)}
                      disabled={generateTestMutation.isPending}
                      className="h-14 text-lg justify-start"
                      variant="outline"
                    >
                      {generateTestMutation.isPending ? (
                        <>
                          <Loader2 className="h-5 w-5 mr-3 animate-spin" />
                          Generating test...
                        </>
                      ) : (
                        <>
                          <Sparkles className="h-5 w-5 mr-3" />
                          Test my {lang} level
                        </>
                      )}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Test in progress
  if (isStarted && !testResult && currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50 p-6">
        <div className="max-w-3xl mx-auto">
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-600">
                Question {currentQuestionIndex + 1} of {questions.length}
              </span>
              <Badge variant="outline" className="text-sm">
                {currentQuestion.difficulty}
              </Badge>
            </div>
            <Progress value={progress} className="h-2" />
          </div>

          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle className="text-2xl">{currentQuestion.question}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <RadioGroup value={selectedAnswer !== null ? selectedAnswer.toString() : undefined} onValueChange={(val) => handleAnswerSelect(parseInt(val))}>
                {currentQuestion.options.map((option, index) => (
                  <div key={index} className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors">
                    <RadioGroupItem value={index.toString()} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-base">
                      {option}
                    </Label>
                  </div>
                ))}
                {/* I'm not sure option */}
                <div className="flex items-center space-x-3 p-4 rounded-lg border hover:bg-gray-50 transition-colors border-dashed">
                  <RadioGroupItem value="-1" id="option-unsure" />
                  <Label htmlFor="option-unsure" className="flex-1 cursor-pointer text-base text-gray-500 italic">
                    I'm not sure
                  </Label>
                </div>
              </RadioGroup>

              <div className="flex justify-end pt-4">
                <Button
                  onClick={handleNextQuestion}
                  disabled={selectedAnswer === null}
                  size="lg"
                >
                  {currentQuestionIndex < questions.length - 1 ? "Next Question" : "Submit Test"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Review screen
  if (showReview && testResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="mb-6">
            <Button onClick={() => setShowReview(false)} variant="ghost">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Results
            </Button>
          </div>

          <Card className="shadow-lg mb-6">
            <CardHeader>
              <CardTitle className="text-2xl">Answer Review</CardTitle>
              <CardDescription>
                Review your answers and learn from explanations
              </CardDescription>
            </CardHeader>
          </Card>

          <div className="space-y-4">
            {questions.map((question, index) => {
              const userAnswer = answers[index];
              const isCorrect = userAnswer === question.correctAnswer;
              
              return (
                <Card key={question.id} className={`shadow-md ${
                  isCorrect ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'
                }`}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <Badge variant="outline">{question.difficulty}</Badge>
                          <Badge variant="secondary">{question.skillArea}</Badge>
                          {isCorrect ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-600" />
                          )}
                        </div>
                        <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                        <p className="text-base mt-2">{question.question}</p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {question.options.map((option, optionIndex) => {
                      const isUserAnswer = userAnswer === optionIndex;
                      const isCorrectAnswer = question.correctAnswer === optionIndex;
                      
                      let bgColor = '';
                      if (isCorrectAnswer) {
                        bgColor = 'bg-green-50 border-green-300';
                      } else if (isUserAnswer && !isCorrect) {
                        bgColor = 'bg-red-50 border-red-300';
                      }
                      
                      return (
                        <div
                          key={optionIndex}
                          className={`p-3 rounded-lg border-2 ${
                            bgColor || 'border-gray-200'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <span>{option}</span>
                            {isCorrectAnswer && (
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                            )}
                            {isUserAnswer && !isCorrect && (
                              <XCircle className="h-4 w-4 text-red-600" />
                            )}
                          </div>
                        </div>
                      );
                    })}
                    
                    {!isCorrect && (
                      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                        <h4 className="font-semibold text-blue-900 mb-2 flex items-center gap-2">
                          <Sparkles className="h-4 w-4" />
                          Explanation
                        </h4>
                        <p className="text-sm text-blue-800">{question.explanation}</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>

          <div className="mt-6 flex justify-center">
            <Button onClick={() => setShowReview(false)} size="lg">
              Back to Results
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Results screen
  if (testResult) {
    const levelColors: Record<string, string> = {
      A1: "from-green-400 to-emerald-500",
      A2: "from-green-500 to-teal-500",
      B1: "from-blue-400 to-cyan-500",
      B2: "from-blue-500 to-indigo-500",
      C1: "from-purple-500 to-pink-500",
      C2: "from-pink-500 to-rose-500",
    };

    const levelIcons: Record<string, string> = {
      A1: "🌱",
      A2: "🌿",
      B1: "🚀",
      B2: "⭐",
      C1: "🏆",
      C2: "👑",
    };

    const levelDescriptions: Record<string, { title: string; description: string }> = {
      A1: {
        title: "Beginner",
        description: "You can understand and use familiar everyday expressions and very basic phrases. Focus on building your vocabulary and mastering basic grammar."
      },
      A2: {
        title: "Elementary",
        description: "You can communicate in simple routine tasks requiring simple and direct exchange of information. Continue practicing with elementary-level content."
      },
      B1: {
        title: "Intermediate",
        description: "You can deal with most situations likely to arise while traveling. You have a solid grasp of the basics - keep expanding your vocabulary!"
      },
      B2: {
        title: "Upper-Intermediate",
        description: "You can interact with a degree of fluency and spontaneity. You're developing strong command - challenge yourself with more complex content."
      },
      C1: {
        title: "Advanced",
        description: "You can express yourself fluently and spontaneously without much obvious searching for expressions. Excellent work - refine your skills with advanced content!"
      },
      C2: {
        title: "Proficient",
        description: "You can understand with ease virtually everything heard or read. Outstanding! You have near-native proficiency - explore nuanced and specialized content."
      }
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50 p-6">
        <div className="max-w-3xl mx-auto">
          <Card className="shadow-lg">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <div className={`h-24 w-24 rounded-full bg-gradient-to-br ${levelColors[testResult.proficiencyLevel]} flex items-center justify-center text-5xl`}>
                  {levelIcons[testResult.proficiencyLevel]}
                </div>
              </div>
              <CardTitle className="text-4xl font-bold">
                {testResult.proficiencyLevel} - {levelDescriptions[testResult.proficiencyLevel].title}
              </CardTitle>
              <CardDescription className="text-xl mt-2">
                You scored {testResult.score}% ({testResult.correctAnswers}/{testResult.totalQuestions} correct)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="bg-gradient-to-r from-purple-50 to-teal-50 rounded-lg p-6">
                <h3 className="font-semibold text-lg mb-4">Performance Breakdown by CEFR Level</h3>
                <div className="space-y-4">
                  {Object.entries(testResult.breakdown).map(([level, stats]) => (
                    <div key={level}>
                      <div className="flex justify-between mb-2">
                        <span className="text-sm font-medium">{level} Questions</span>
                        <span className="text-sm text-gray-600">
                          {stats.correct}/{stats.total}
                        </span>
                      </div>
                      <Progress
                        value={(stats.correct / stats.total) * 100}
                        className="h-2"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">What this means:</h3>
                <p className="text-sm text-blue-800">
                  {levelDescriptions[testResult.proficiencyLevel].description}
                </p>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleRetakeTest} variant="outline" className="flex-1">
                  Retake Test
                </Button>
                <Button onClick={() => setShowReview(true)} variant="outline" className="flex-1">
                  <Target className="h-4 w-4 mr-2" />
                  Review Answers
                </Button>
                <Button onClick={handleUseResult} className="flex-1">
                  <Trophy className="h-4 w-4 mr-2" />
                  Create Story at My Level
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return null;
}
