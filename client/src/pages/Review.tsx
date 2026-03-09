import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Flashcard } from "@/components/Flashcard";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, ArrowLeft } from "lucide-react";
import { Link } from "wouter";


export function Review() {

  const [currentIndex, setCurrentIndex] = useState(0);
  const [reviewedCount, setReviewedCount] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [startTime, setStartTime] = useState<number>(Date.now());

  const { data: dueWords, isLoading, refetch } = trpc.wordbank.getDueWordsForReview.useQuery();
  const submitReview = trpc.wordbank.submitReview.useMutation();

  useEffect(() => {
    setStartTime(Date.now());
  }, [currentIndex]);

  if (isLoading) {
    return (
      <div className="container py-8">
        <div className="text-center">Loading words for review...</div>
      </div>
    );
  }

  if (!dueWords || dueWords.length === 0) {
    return (
      <div className="container py-8">
        <Card className="p-8 text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 mx-auto text-green-600" />
          <h2 className="text-2xl font-bold">All caught up!</h2>
          <p className="text-muted-foreground">
            No words due for review right now. Come back later!
          </p>
          <Link href="/wordbank">
            <Button>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Wordbank
            </Button>
          </Link>
        </Card>
      </div>
    );
  }

  const currentWord = dueWords[currentIndex];
  const totalWords = dueWords.length;
  const progressPercent = (reviewedCount / totalWords) * 100;

  const handleAnswer = async (correct: boolean) => {
    const timeToAnswer = (Date.now() - startTime) / 1000; // seconds

    try {
      await submitReview.mutateAsync({
        wordId: currentWord.id,
        correct,
        timeToAnswer,
      });

      setReviewedCount(reviewedCount + 1);
      if (correct) {
        setCorrectCount(correctCount + 1);
      }

      // Move to next word or finish
      if (currentIndex < totalWords - 1) {
        setCurrentIndex(currentIndex + 1);
      } else {
        // Review session complete
        // Review complete - will show completion screen
        
        // Refetch to update due words list
        await refetch();
        
        // Reset for next session
        setCurrentIndex(0);
        setReviewedCount(0);
        setCorrectCount(0);
      }
    } catch (error) {
      console.error("Error submitting review:", error);
      alert("Failed to submit review. Please try again.");
    }
  };

  if (reviewedCount >= totalWords) {
    return (
      <div className="container py-8">
        <Card className="p-8 text-center space-y-4">
          <CheckCircle2 className="h-16 w-16 mx-auto text-green-600" />
          <h2 className="text-2xl font-bold">Review Complete!</h2>
          <div className="space-y-2">
            <p className="text-lg">
              You reviewed <span className="font-bold">{totalWords}</span> words
            </p>
            <p className="text-lg">
              Accuracy: <span className="font-bold text-green-600">
                {Math.round((correctCount / totalWords) * 100)}%
              </span>
            </p>
          </div>
          <div className="flex gap-4 justify-center mt-6">
            <Link href="/wordbank">
              <Button variant="outline">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Wordbank
              </Button>
            </Link>
            <Button onClick={() => refetch()}>
              Review More Words
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Link href="/wordbank">
          <Button variant="ghost" size="sm">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </Link>
        <h1 className="text-2xl font-bold">Vocabulary Review</h1>
        <div className="text-sm text-muted-foreground">
          {reviewedCount} / {totalWords} reviewed
        </div>
      </div>

      {/* Progress bar */}
      <div className="space-y-2">
        <Progress value={progressPercent} className="h-2" />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>Progress: {Math.round(progressPercent)}%</span>
          <span>Accuracy: {reviewedCount > 0 ? Math.round((correctCount / reviewedCount) * 100) : 0}%</span>
        </div>
      </div>

      {/* Flashcard */}
      <Flashcard
        word={currentWord.word}
        translation={currentWord.translation || ""}
        targetLanguage={currentWord.targetLanguage}
        audioUrl={currentWord.audioUrl || undefined}
        exampleSentences={currentWord.exampleSentences as string[] | undefined}
        onCorrect={() => handleAnswer(true)}
        onIncorrect={() => handleAnswer(false)}
      />

      {/* Stats footer */}
      <Card className="p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{totalWords - reviewedCount}</div>
            <div className="text-sm text-muted-foreground">Remaining</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-green-600">{correctCount}</div>
            <div className="text-sm text-muted-foreground">Correct</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-red-600">{reviewedCount - correctCount}</div>
            <div className="text-sm text-muted-foreground">Incorrect</div>
          </div>
        </div>
      </Card>
    </div>
  );
}
