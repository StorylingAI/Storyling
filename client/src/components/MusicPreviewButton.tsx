import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Volume2, VolumeX, Volume1, Loader2 } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface MusicPreviewButtonProps {
  mood: string;
  trackId: string;
  trackName: string;
  className?: string;
}

export function MusicPreviewButton({
  mood,
  trackId,
  trackName,
  className = "",
}: MusicPreviewButtonProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [volume, setVolume] = useState(() => {
    // Load volume from localStorage, default to 70%
    const savedVolume = localStorage.getItem("musicPreviewVolume");
    return savedVolume ? parseFloat(savedVolume) : 0.7;
  });
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const currentTrackIdRef = useRef(trackId);
  const pendingPreviewTrackIdRef = useRef<string | null>(null);
  const suppressAudioErrorRef = useRef(false);
  
  const generatePreviewMutation = trpc.music.generatePreview.useMutation({
    onSuccess: (data) => {
      if (pendingPreviewTrackIdRef.current !== currentTrackIdRef.current) {
        return;
      }
      setPreviewUrl(data.previewUrl);
      playAudio(data.previewUrl);
    },
    onError: (error) => {
      toast.error("Failed to load music preview");
      console.error("Music preview error:", error);
    },
  });

  const requestPreview = (previewTrackId = trackId) => {
    pendingPreviewTrackIdRef.current = previewTrackId;
    generatePreviewMutation.mutate({ trackId: previewTrackId });
  };

  // Initialize audio element
  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio();
      audioRef.current.preload = "none";
      audioRef.current.volume = volume;
      
      // Event listeners
      audioRef.current.addEventListener("ended", () => {
        setIsPlaying(false);
      });
      
      audioRef.current.addEventListener("error", () => {
        if (suppressAudioErrorRef.current) {
          suppressAudioErrorRef.current = false;
          return;
        }
        setIsPlaying(false);
        toast.error("Error playing audio preview");
      });
    }

    return () => {
      if (audioRef.current) {
        suppressAudioErrorRef.current = true;
        audioRef.current.pause();
        audioRef.current.src = "";
      }
    };
  }, []);

  // Update audio volume when volume state changes
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = isMuted ? 0 : volume;
    }
    // Save volume to localStorage
    localStorage.setItem("musicPreviewVolume", volume.toString());
  }, [volume, isMuted]);

  useEffect(() => {
    if (currentTrackIdRef.current === trackId) {
      return;
    }

    const wasPlaying = isPlaying;
    currentTrackIdRef.current = trackId;
    pendingPreviewTrackIdRef.current = null;
    setPreviewUrl(null);
    setIsPlaying(false);

    if (audioRef.current) {
      suppressAudioErrorRef.current = true;
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      audioRef.current.src = "";
    }

    if (wasPlaying) {
      requestPreview(trackId);
    }
  }, [trackId]);

  // Stop other playing audio when this one starts
  useEffect(() => {
    if (isPlaying && audioRef.current) {
      // Dispatch custom event to stop other audio players
      window.dispatchEvent(new CustomEvent("stopOtherAudio", { detail: { trackId } }));
    }
  }, [isPlaying, trackId]);

  // Listen for stop events from other players
  useEffect(() => {
    const handleStopOtherAudio = (event: Event) => {
      const customEvent = event as CustomEvent;
      if (customEvent.detail.trackId !== trackId && isPlaying) {
        handleStop();
      }
    };

    window.addEventListener("stopOtherAudio", handleStopOtherAudio);
    return () => {
      window.removeEventListener("stopOtherAudio", handleStopOtherAudio);
    };
  }, [trackId, isPlaying]);

  const playAudio = async (url: string) => {
    if (!audioRef.current) return;

    try {
      suppressAudioErrorRef.current = false;
      audioRef.current.src = url;
      audioRef.current.volume = isMuted ? 0 : volume;
      await audioRef.current.play();
      setIsPlaying(true);
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsPlaying(false);
      toast.error("Failed to play audio");
    }
  };

  const handlePlay = async () => {
    if (isPlaying) {
      // Pause if already playing
      handleStop();
    } else {
      // Generate and play preview
      if (previewUrl) {
        playAudio(previewUrl);
      } else {
        requestPreview(trackId);
      }
    }
  };

  const handleStop = () => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
      setIsPlaying(false);
    }
  };

  const handleVolumeChange = (value: number[]) => {
    const newVolume = value[0];
    setVolume(newVolume);
    if (newVolume > 0 && isMuted) {
      setIsMuted(false);
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
  };

  const getVolumeIcon = () => {
    if (isMuted || volume === 0) {
      return <VolumeX className="h-4 w-4" />;
    } else if (volume < 0.5) {
      return <Volume1 className="h-4 w-4" />;
    } else {
      return <Volume2 className="h-4 w-4" />;
    }
  };

  const isLoading = generatePreviewMutation.isPending;

  return (
    <div className="flex items-center gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={handlePlay}
        disabled={isLoading}
        className={`gap-2 ${className}`}
        title={isPlaying ? `Stop ${trackName}` : `Play ${trackName} preview`}
      >
        {isLoading ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : isPlaying ? (
          <VolumeX className="h-4 w-4" />
        ) : (
          <Volume2 className="h-4 w-4" />
        )}
        <span className="text-xs">
          {isPlaying ? "Stop Preview" : "Listen to Sample"}
        </span>
      </Button>

      {/* Volume Control Popover */}
      <Popover>
        <PopoverTrigger asChild>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0"
            title="Volume control"
          >
            {getVolumeIcon()}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-48 p-4" align="start">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Volume</span>
              <span className="text-xs text-muted-foreground">
                {Math.round((isMuted ? 0 : volume) * 100)}%
              </span>
            </div>
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-8 w-8 p-0"
                onClick={toggleMute}
                title={isMuted ? "Unmute" : "Mute"}
              >
                {getVolumeIcon()}
              </Button>
              <Slider
                value={[isMuted ? 0 : volume]}
                onValueChange={handleVolumeChange}
                max={1}
                step={0.01}
                className="flex-1"
              />
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
