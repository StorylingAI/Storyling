import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface VoicePreviewButtonProps {
  targetLanguage: string;
  voiceType: string;
  narratorGender: "male" | "female";
  playingPreview: string | null;
  setPlayingPreview: (value: string | null) => void;
  previewAudio: HTMLAudioElement | null;
  setPreviewAudio: (audio: HTMLAudioElement | null) => void;
}

export function VoicePreviewButton({
  targetLanguage,
  voiceType,
  narratorGender,
  playingPreview,
  setPlayingPreview,
  previewAudio,
  setPreviewAudio,
}: VoicePreviewButtonProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  
  const previewKey = `${targetLanguage}-${voiceType}-${narratorGender}`;
  const isPlaying = playingPreview === previewKey;

  const generatePreviewMutation = trpc.content.generateVoicePreview.useMutation({
    onSuccess: (data) => {
      setIsGenerating(false);
      playPreview(data.audioUrl);
    },
    onError: (error) => {
      setIsGenerating(false);
      toast.error("Failed to generate voice preview: " + error.message);
    },
  });

  const playPreview = (audioUrl: string) => {
    // Stop any currently playing audio
    if (previewAudio) {
      previewAudio.pause();
      previewAudio.currentTime = 0;
    }

    // Create and play new audio
    const audio = new Audio(audioUrl);
    audio.addEventListener("ended", () => {
      setPlayingPreview(null);
      setPreviewAudio(null);
    });
    audio.addEventListener("error", () => {
      toast.error("Failed to play voice preview");
      setPlayingPreview(null);
      setPreviewAudio(null);
    });

    setPreviewAudio(audio);
    setPlayingPreview(previewKey);
    audio.play().catch((err) => {
      console.error("Audio playback error:", err);
      toast.error("Failed to play audio");
      setPlayingPreview(null);
      setPreviewAudio(null);
    });
  };

  const handlePreviewClick = () => {
    if (isPlaying) {
      // Stop playing
      if (previewAudio) {
        previewAudio.pause();
        previewAudio.currentTime = 0;
      }
      setPlayingPreview(null);
      setPreviewAudio(null);
    } else {
      // Generate and play preview
      setIsGenerating(true);
      generatePreviewMutation.mutate({
        targetLanguage,
        voiceType,
        narratorGender,
      });
    }
  };

  return (
    <Button
      type="button"
      variant="outline"
      onClick={handlePreviewClick}
      disabled={isGenerating}
      className="rounded-xl w-full border-2 border-primary/20 hover:border-primary/40 hover:bg-primary/5"
    >
      {isGenerating ? (
        <>
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          Generating Preview...
        </>
      ) : isPlaying ? (
        <>
          <Volume2 className="mr-2 h-4 w-4 animate-pulse" />
          Playing Sample...
        </>
      ) : (
        <>
          <Volume2 className="mr-2 h-4 w-4" />
          Listen to Sample
        </>
      )}
    </Button>
  );
}
