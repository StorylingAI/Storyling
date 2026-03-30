import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Volume2, RotateCcw } from "lucide-react";

interface FlashcardProps {
  word: string;
  translation: string;
  targetLanguage: string;
  audioUrl?: string | null;
  exampleSentences?: string[];
  onCorrect: () => void;
  onIncorrect: () => void;
}

export function Flashcard({
  word,
  translation,
  targetLanguage,
  audioUrl,
  exampleSentences,
  onCorrect,
  onIncorrect,
}: FlashcardProps) {
  const [isFlipped, setIsFlipped] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handlePlayAudio = async () => {
    if (!audioUrl || isPlaying) return;

    setIsPlaying(true);
    const audio = new Audio(audioUrl);
    audio.onended = () => setIsPlaying(false);
    audio.onerror = () => setIsPlaying(false);
    
    try {
      await audio.play();
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsPlaying(false);
    }
  };

  const handleAnswer = (correct: boolean) => {
    if (correct) {
      onCorrect();
    } else {
      onIncorrect();
    }
    // Reset flip state for next card
    setIsFlipped(false);
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Flashcard */}
      <div
        className="relative h-96 cursor-pointer perspective-1000"
        onClick={handleFlip}
      >
        <div
          className={`relative w-full h-full transition-transform duration-500 transform-style-3d ${
            isFlipped ? "rotate-y-180" : ""
          }`}
        >
          {/* Front of card - Word */}
          <Card
            className={`absolute w-full h-full flex flex-col items-center justify-center p-8 backface-hidden ${
              isFlipped ? "invisible" : ""
            }`}
          >
            <div className="text-center space-y-6">
              <div className="flex items-center justify-center gap-4">
                <h2 className="text-5xl font-bold">{word}</h2>
                {audioUrl && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePlayAudio();
                    }}
                    disabled={isPlaying}
                  >
                    <Volume2 className={`h-8 w-8 ${isPlaying ? "animate-pulse" : ""}`} />
                  </Button>
                )}
              </div>
              <p className="text-muted-foreground text-lg">
                Click to reveal translation
              </p>
              <div className="text-sm text-muted-foreground">
                Language: {targetLanguage}
              </div>
            </div>
          </Card>

          {/* Back of card - Translation */}
          <Card
            className={`absolute w-full h-full flex flex-col items-center justify-center p-8 backface-hidden rotate-y-180 ${
              !isFlipped ? "invisible" : ""
            }`}
          >
            <div className="text-center space-y-6">
              <div className="space-y-2">
                <h3 className="text-3xl font-bold text-primary">{word}</h3>
                <p className="text-2xl">{translation}</p>
              </div>

              {exampleSentences && exampleSentences.length > 0 && (
                <div className="mt-6 space-y-2 text-left max-w-md">
                  <p className="text-sm font-semibold text-muted-foreground">
                    Example sentences:
                  </p>
                  {exampleSentences.slice(0, 2).map((sentence, idx) => (
                    <p key={idx} className="text-sm italic">
                      {sentence}
                    </p>
                  ))}
                </div>
              )}

              <p className="text-muted-foreground text-sm mt-4">
                Click to flip back
              </p>
            </div>
          </Card>
        </div>
      </div>

      {/* Answer buttons - only show when flipped */}
      {isFlipped && (
        <div className="mt-8 flex gap-4 justify-center">
          <Button
            variant="destructive"
            size="lg"
            onClick={() => handleAnswer(false)}
            className="min-w-32"
          >
            Incorrect
          </Button>
          <Button
            variant="default"
            size="lg"
            onClick={() => handleAnswer(true)}
            className="min-w-32 bg-green-600 hover:bg-green-700"
          >
            Correct
          </Button>
        </div>
      )}

      {/* Hint */}
      <div className="mt-4 text-center text-sm text-muted-foreground">
        <p>
          <RotateCcw className="inline h-4 w-4 mr-1" />
          Click the card to flip between word and translation
        </p>
      </div>

      {/* Custom CSS for 3D flip effect */}
      <style>{`
        .perspective-1000 {
          perspective: 1000px;
        }
        .transform-style-3d {
          transform-style: preserve-3d;
        }
        .backface-hidden {
          backface-visibility: hidden;
        }
        .rotate-y-180 {
          transform: rotateY(180deg);
        }
      `}</style>
    </div>
  );
}
