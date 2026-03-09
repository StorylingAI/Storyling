import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Volume2, Loader2, Heart, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface VoiceComparisonModeProps {
  targetLanguage: string;
  voiceType: string;
  onClose: () => void;
}

export function VoiceComparisonMode({
  targetLanguage,
  voiceType,
  onClose,
}: VoiceComparisonModeProps) {
  const [playingGender, setPlayingGender] = useState<"male" | "female" | null>(null);
  const [maleAudio, setMaleAudio] = useState<HTMLAudioElement | null>(null);
  const [femaleAudio, setFemaleAudio] = useState<HTMLAudioElement | null>(null);
  const [isGeneratingMale, setIsGeneratingMale] = useState(false);
  const [isGeneratingFemale, setIsGeneratingFemale] = useState(false);

  const utils = trpc.useUtils();
  const { data: favorites = [] } = trpc.content.getVoiceFavorites.useQuery();

  const generatePreviewMutation = trpc.content.generateVoicePreview.useMutation({
    onSuccess: (data, variables) => {
      if (variables.narratorGender === "male") {
        setIsGeneratingMale(false);
        playAudio(data.audioUrl, "male");
      } else {
        setIsGeneratingFemale(false);
        playAudio(data.audioUrl, "female");
      }
    },
    onError: (error, variables) => {
      if (variables.narratorGender === "male") {
        setIsGeneratingMale(false);
      } else {
        setIsGeneratingFemale(false);
      }
      toast.error("Failed to generate voice preview: " + error.message);
    },
  });

  const addFavoriteMutation = trpc.content.addVoiceFavorite.useMutation({
    onSuccess: () => {
      utils.content.getVoiceFavorites.invalidate();
      toast.success("Added to favorites!");
    },
    onError: (error) => {
      toast.error("Failed to add favorite: " + error.message);
    },
  });

  const removeFavoriteMutation = trpc.content.removeVoiceFavorite.useMutation({
    onSuccess: () => {
      utils.content.getVoiceFavorites.invalidate();
      toast.success("Removed from favorites");
    },
    onError: (error) => {
      toast.error("Failed to remove favorite: " + error.message);
    },
  });

  const isFavorite = (gender: "male" | "female") => {
    return favorites.some(
      (fav) =>
        fav.targetLanguage === targetLanguage &&
        fav.voiceType === voiceType &&
        fav.narratorGender === gender
    );
  };

  const playAudio = (audioUrl: string, gender: "male" | "female") => {
    // Stop any currently playing audio
    if (maleAudio) {
      maleAudio.pause();
      maleAudio.currentTime = 0;
    }
    if (femaleAudio) {
      femaleAudio.pause();
      femaleAudio.currentTime = 0;
    }

    // Create and play new audio
    const audio = new Audio(audioUrl);
    audio.addEventListener("ended", () => {
      setPlayingGender(null);
      if (gender === "male") {
        setMaleAudio(null);
      } else {
        setFemaleAudio(null);
      }
    });
    audio.addEventListener("error", () => {
      toast.error("Failed to play voice preview");
      setPlayingGender(null);
      if (gender === "male") {
        setMaleAudio(null);
      } else {
        setFemaleAudio(null);
      }
    });

    if (gender === "male") {
      setMaleAudio(audio);
    } else {
      setFemaleAudio(audio);
    }
    setPlayingGender(gender);
    audio.play().catch((err) => {
      console.error("Audio playback error:", err);
      toast.error("Failed to play audio");
      setPlayingGender(null);
    });
  };

  const handlePreviewClick = (gender: "male" | "female") => {
    if (playingGender === gender) {
      // Stop playing
      if (gender === "male" && maleAudio) {
        maleAudio.pause();
        maleAudio.currentTime = 0;
        setMaleAudio(null);
      } else if (gender === "female" && femaleAudio) {
        femaleAudio.pause();
        femaleAudio.currentTime = 0;
        setFemaleAudio(null);
      }
      setPlayingGender(null);
    } else {
      // Generate and play preview
      if (gender === "male") {
        setIsGeneratingMale(true);
      } else {
        setIsGeneratingFemale(true);
      }
      generatePreviewMutation.mutate({
        targetLanguage,
        voiceType,
        narratorGender: gender,
      });
    }
  };

  const handleToggleFavorite = (gender: "male" | "female") => {
    if (isFavorite(gender)) {
      removeFavoriteMutation.mutate({
        targetLanguage,
        voiceType,
        narratorGender: gender,
      });
    } else {
      addFavoriteMutation.mutate({
        targetLanguage,
        voiceType,
        narratorGender: gender,
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm animate-fade-in">
      <Card className="w-full max-w-2xl mx-4 rounded-card shadow-playful-lg border-2 animate-bounce-in">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-2xl font-bold">Compare Voices</CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-full hover:bg-muted"
          >
            <X className="h-5 w-5" />
          </Button>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center space-y-2">
            <p className="text-sm text-muted-foreground">
              Listen to both male and female voices for <span className="font-semibold text-foreground">{voiceType}</span> in{" "}
              <span className="font-semibold text-foreground">{targetLanguage}</span>
            </p>
            <p className="text-xs text-muted-foreground">
              Click the play button to hear a sample, and add your favorite to quick access
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Male Voice Card */}
            <Card className="rounded-xl border-2 hover:border-primary/40 transition-all">
              <CardContent className="pt-6 space-y-4">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 dark:bg-blue-900/20 mb-3">
                    <span className="text-3xl">👨</span>
                  </div>
                  <h3 className="text-lg font-bold">Male Voice</h3>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handlePreviewClick("male")}
                  disabled={isGeneratingMale}
                  className="w-full rounded-xl border-2 border-blue-500/20 hover:border-blue-500/40 hover:bg-blue-500/5"
                >
                  {isGeneratingMale ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : playingGender === "male" ? (
                    <>
                      <Volume2 className="mr-2 h-4 w-4 animate-pulse" />
                      Playing...
                    </>
                  ) : (
                    <>
                      <Volume2 className="mr-2 h-4 w-4" />
                      Listen to Sample
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant={isFavorite("male") ? "default" : "outline"}
                  onClick={() => handleToggleFavorite("male")}
                  disabled={addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
                  className={`w-full rounded-xl ${
                    isFavorite("male")
                      ? "gradient-primary text-white border-0"
                      : "border-2"
                  }`}
                >
                  <Heart
                    className={`mr-2 h-4 w-4 ${isFavorite("male") ? "fill-current" : ""}`}
                  />
                  {isFavorite("male") ? "Favorited" : "Add to Favorites"}
                </Button>
              </CardContent>
            </Card>

            {/* Female Voice Card */}
            <Card className="rounded-xl border-2 hover:border-primary/40 transition-all">
              <CardContent className="pt-6 space-y-4">
                <div className="text-center">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pink-100 dark:bg-pink-900/20 mb-3">
                    <span className="text-3xl">👩</span>
                  </div>
                  <h3 className="text-lg font-bold">Female Voice</h3>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handlePreviewClick("female")}
                  disabled={isGeneratingFemale}
                  className="w-full rounded-xl border-2 border-pink-500/20 hover:border-pink-500/40 hover:bg-pink-500/5"
                >
                  {isGeneratingFemale ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Generating...
                    </>
                  ) : playingGender === "female" ? (
                    <>
                      <Volume2 className="mr-2 h-4 w-4 animate-pulse" />
                      Playing...
                    </>
                  ) : (
                    <>
                      <Volume2 className="mr-2 h-4 w-4" />
                      Listen to Sample
                    </>
                  )}
                </Button>

                <Button
                  type="button"
                  variant={isFavorite("female") ? "default" : "outline"}
                  onClick={() => handleToggleFavorite("female")}
                  disabled={addFavoriteMutation.isPending || removeFavoriteMutation.isPending}
                  className={`w-full rounded-xl ${
                    isFavorite("female")
                      ? "gradient-primary text-white border-0"
                      : "border-2"
                  }`}
                >
                  <Heart
                    className={`mr-2 h-4 w-4 ${isFavorite("female") ? "fill-current" : ""}`}
                  />
                  {isFavorite("female") ? "Favorited" : "Add to Favorites"}
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center pt-4">
            <Button
              onClick={onClose}
              className="rounded-button gradient-primary text-white hover-lift border-0"
            >
              Done Comparing
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
