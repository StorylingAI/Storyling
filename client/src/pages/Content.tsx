import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import {
  Loader2,
  ArrowLeft,
  Heart,
  Share2,
  Download,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  Sparkles,
  BookOpen,
  RefreshCw,
  Edit2,
  Check,
  X,
  Settings,
  FileText,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";
import { APP_LOGO } from "@/const";
import { QuizTab } from "@/components/QuizTab";
import { StoryDisplay } from "@/components/StoryDisplay";
import { SentenceDisplay } from "@/components/SentenceDisplay";
import { VocabularyTable } from "@/components/VocabularyTable";
import Breadcrumb from "@/components/Breadcrumb";
import { SubtitleCustomizationModal, SubtitleSettings } from "@/components/SubtitleCustomizationModal";

export default function Content() {
  const [, params] = useRoute("/content/:id");
  const contentId = params?.id ? parseInt(params.id) : 0;
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  
  // Player state
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(() => {
    const saved = localStorage.getItem('playbackSpeed');
    return saved ? parseFloat(saved) : 1;
  });
  const [showCompletion, setShowCompletion] = useState(false);
  const [xpToastShown, setXpToastShown] = useState(false);
  const [currentSentence, setCurrentSentence] = useState(0);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [showSubtitleSettings, setShowSubtitleSettings] = useState(false);
  const [subtitleSettings, setSubtitleSettings] = useState<SubtitleSettings>(() => {
    const saved = localStorage.getItem('subtitleSettings');
    return saved ? JSON.parse(saved) : {
      fontSize: 24,
      position: "bottom" as const,
      color: "#FFFFFF",
      fontFamily: "Arial, sans-serif",
      outlineThickness: 2,
      backgroundOpacity: 0.7,
    };
  });
  const [videoQuality, setVideoQuality] = useState<'720p' | '1080p' | '4K'>(() => {
    const saved = localStorage.getItem('videoQuality');
    return (saved as '720p' | '1080p' | '4K') || '1080p';
  });
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qualityMenuRef = useRef<HTMLDivElement>(null);
  
  // Close quality menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (qualityMenuRef.current && !qualityMenuRef.current.contains(event.target as Node)) {
        setShowQualityMenu(false);
      }
    };
    
    if (showQualityMenu) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [showQualityMenu]);
  
  // Progress persistence
  const { data: savedProgress } = trpc.storyProgress.getProgress.useQuery(
    { contentId },
    { enabled: isAuthenticated && contentId > 0 }
  );
  
  const saveProgressMutation = trpc.storyProgress.saveProgress.useMutation();
  const markCompletedMutation = trpc.storyProgress.markCompleted.useMutation();
  const recordWatchMutation = trpc.watchHistory.recordWatch.useMutation();

  const { data: content, isLoading } = trpc.content.getById.useQuery(
    { id: contentId },
    { enabled: isAuthenticated && contentId > 0 }
  );

  const { data: favorites } = trpc.content.getFavorites.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const addFavoriteMutation = trpc.content.addFavorite.useMutation();
  const removeFavoriteMutation = trpc.content.removeFavorite.useMutation();
  const incrementPlayMutation = trpc.content.incrementPlayCount.useMutation();
  
  const retryMutation = trpc.retry.retryStory.useMutation({
    onSuccess: () => {
      toast.success("Story generation retried successfully! Redirecting to library...");
      setTimeout(() => setLocation("/library"), 2000);
    },
    onError: (error) => {
      toast.error(`Retry failed: ${error.message}`);
    },
  });
  
  const updateTitleMutation = trpc.content.updateTitle.useMutation({
    onSuccess: () => {
      toast.success("Title updated successfully!");
      setIsEditingTitle(false);
    },
    onError: (error: any) => {
      toast.error(`Failed to update title: ${error.message}`);
    },
  });
  
  const regenerateTitleMutation = trpc.content.regenerateTitle.useMutation({
    onSuccess: (data) => {
      toast.success(`New title generated: "${data.title}"`);
      utils.content.getById.invalidate({ id: contentId });
    },
    onError: (error: any) => {
      toast.error(`Failed to regenerate title: ${error.message}`);
    },
  });
  
  const regenerateStoryMutation = trpc.content.regenerateStory.useMutation({
    onSuccess: (data) => {
      toast.success(`Story regenerated with improved formatting!`);
      utils.content.getById.invalidate({ id: contentId });
      // Reload the page to show the new content
      window.location.reload();
    },
    onError: (error: any) => {
      toast.error(`Failed to regenerate story: ${error.message}`);
    },
  });
  
  const utils = trpc.useUtils();
  
  const exportSubtitleMutation = trpc.download.exportSubtitle.useMutation({
    onSuccess: (data) => {
      // Create blob and trigger download
      const blob = new Blob([data.content], { type: data.mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success('Subtitle file downloaded successfully!');
    },
    onError: (error) => {
      toast.error(`Failed to export subtitle: ${error.message}`);
    },
  });

  const isFavorite = favorites?.some((f) => f.contentId === contentId);
  
  // Track view for recently viewed
  const trackViewMutation = trpc.recentlyViewed.trackView.useMutation();
  
  useEffect(() => {
    if (content && content.status === "completed") {
      trackViewMutation.mutate({
        itemType: "story",
        itemId: content.id,
        itemTitle: content.title || content.storyText?.substring(0, 100),
        itemThumbnail: content.thumbnailUrl || undefined,
      });
    }
  }, [content?.id, content?.status]);

  useEffect(() => {
    if (content && content.status === "completed") {
      incrementPlayMutation.mutate({ contentId: content.id });
      
      // Show XP reward toast once when story generation completes
      if (!xpToastShown) {
        setXpToastShown(true);
        toast.success("🎉 Story Created!", {
          description: "You earned 25 XP for creating a new story! Keep learning to unlock achievements."
        });
      }
    }
  }, [content?.id, content?.status, xpToastShown]);

  const toggleFavorite = async () => {
    if (isFavorite) {
      await removeFavoriteMutation.mutateAsync({ contentId });
      toast.success("Removed from favorites");
    } else {
      await addFavoriteMutation.mutateAsync({ contentId });
      toast.success("Added to favorites");
    }
  };

  const togglePlayPause = () => {
    const media = content?.mode === "podcast" ? audioRef.current : videoRef.current;
    if (!media) return;

    if (isPlaying) {
      media.pause();
    } else {
      media.play();
    }
    // isPlaying state is now managed by onPlay/onPause event handlers
  };

  const skip = (seconds: number) => {
    const media = content?.mode === "podcast" ? audioRef.current : videoRef.current;
    if (!media) return;
    media.currentTime = Math.max(0, Math.min(media.duration, media.currentTime + seconds));
  };

  const toggleMute = () => {
    const media = content?.mode === "podcast" ? audioRef.current : videoRef.current;
    if (!media) return;
    media.muted = !isMuted;
    setIsMuted(!isMuted);
  };

  const handleVolumeChange = (value: number[]) => {
    const media = content?.mode === "podcast" ? audioRef.current : videoRef.current;
    if (!media) return;
    const newVolume = value[0] || 0;
    media.volume = newVolume;
    setVolume(newVolume);
    if (newVolume === 0) {
      setIsMuted(true);
    } else if (isMuted) {
      setIsMuted(false);
    }
  };

  const handleSpeedChange = (speed: number) => {
    const media = content?.mode === "podcast" ? audioRef.current : videoRef.current;
    if (!media) return;
    media.playbackRate = speed;
    setPlaybackSpeed(speed);
    localStorage.setItem('playbackSpeed', speed.toString());
  };

  const handleTimeUpdate = () => {
    const media = content?.mode === "podcast" ? audioRef.current : videoRef.current;
    if (!media) return;
    setCurrentTime(media.currentTime);
    
    // Check if completed (within 1 second of end)
    if (media.duration - media.currentTime < 1 && !showCompletion) {
      setShowCompletion(true);
      // Mark as completed
      markCompletedMutation.mutate({ contentId });
      // Record watch history
      recordWatchMutation.mutate({
        contentId,
        duration: media.currentTime,
        completed: true,
        progressPercentage: 100,
      });
    }
  };
  
  // Auto-save progress every 5 seconds during playback
  useEffect(() => {
    if (!isPlaying || !content) return;
    
    const interval = setInterval(() => {
      const media = content.mode === "podcast" ? audioRef.current : videoRef.current;
      if (!media) return;
      
      saveProgressMutation.mutate({
        contentId,
        currentSentence,
        currentTime: media.currentTime,
        totalDuration: media.duration,
        completed: false,
      });
    }, 5000); // Save every 5 seconds
    
    return () => clearInterval(interval);
  }, [isPlaying, contentId, currentSentence, content?.mode]);

  const handleLoadedMetadata = () => {
    const media = content?.mode === "podcast" ? audioRef.current : videoRef.current;
    if (!media) return;
    setDuration(media.duration);
    
    // Apply saved playback speed
    media.playbackRate = playbackSpeed;
    
    // Auto-resume from saved progress
    if (savedProgress && !progressLoaded && savedProgress.currentTime > 0) {
      media.currentTime = savedProgress.currentTime;
      setCurrentSentence(savedProgress.currentSentence);
      setProgressLoaded(true);
      
      // Show resume toast
      const minutes = Math.floor(savedProgress.currentTime / 60);
      const seconds = Math.floor(savedProgress.currentTime % 60);
      toast.info(`Resuming from ${minutes}:${seconds.toString().padStart(2, '0')}`);
    }
  };

  const handleSeek = (value: number[]) => {
    const media = content?.mode === "podcast" ? audioRef.current : videoRef.current;
    if (!media) return;
    const newTime = value[0] || 0;
    media.currentTime = newTime;
    setCurrentTime(newTime);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: "My Storyling.ai Story",
        text: `Check out my language learning story on Storyling.ai`,
        url: window.location.href,
      });
    } catch (err) {
      // Fallback: copy to clipboard
      navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    }
  };

  const handleDownload = async () => {
    if (!content) return;
    const url = content.mode === "podcast" ? content.audioUrl : content.videoUrl;
    if (!url) return;
    
    try {
      toast.loading("Preparing download...");
      
      // Fetch the file as a blob to ensure proper download
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `${content.title || 'story'}.${content.mode === "podcast" ? "mp3" : "mp4"}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      // Clean up the blob URL after a short delay
      setTimeout(() => window.URL.revokeObjectURL(blobUrl), 100);
      
      toast.dismiss();
      toast.success(`${content.mode === "podcast" ? "Audio" : "Video"} downloaded successfully!`);
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to download. Please try again.");
      console.error("Download error:", error);
    }
  };
  
  const handleQualityChange = (quality: '720p' | '1080p' | '4K') => {
    setVideoQuality(quality);
    localStorage.setItem('videoQuality', quality);
    setShowQualityMenu(false);
    toast.success(`Video quality set to ${quality}`);
    // Note: Actual quality switching would require different video URLs from backend
    // For now, this stores the user preference
  };

  const handleExportSubtitle = () => {
    if (!content) return;
    exportSubtitleMutation.mutate({ storyId: content.id });
  };

  // Get vocabulary words from content data
  console.log("Content page - content.vocabularyWords:", content?.vocabularyWords);
  console.log("Content page - content.vocabularyTranslations:", content?.vocabularyTranslations);
  
  const vocabularyWords = (content?.vocabularyWords || []).map((word, idx) => ({
    word,
    translation: "", // Translation can be added later via API or user input
    timestamp: idx * 10, // Placeholder timestamps - can be enhanced with actual transcript timing
  }));

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-card shadow-playful-lg border-2">
          <CardContent className="pt-6 text-center space-y-4">
            <img src="/flip-mascot.png" alt="Flip" className="w-24 h-24 mx-auto" />
            <h3 className="text-xl font-bold">Sign in to continue</h3>
            <p className="text-muted-foreground">Please sign in to view content</p>
            <Button
              onClick={() => setLocation("/")}
              className="rounded-button gradient-primary text-white hover-lift border-0"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50 flex flex-col items-center justify-center gap-4">
        <img src="/flip-mascot.png" alt="Loading" className="w-24 h-24 animate-flip" />
        <p className="text-muted-foreground">Loading your content...</p>
      </div>
    );
  }

  if (!content) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-card shadow-playful-lg border-2">
          <CardContent className="pt-6 text-center space-y-4">
            <img src="/flip-mascot.png" alt="Flip" className="w-24 h-24 mx-auto" />
            <h3 className="text-xl font-bold">Content not found</h3>
            <p className="text-muted-foreground">We couldn't find the content you're looking for</p>
            <Button
              onClick={() => setLocation("/library")}
              className="rounded-button gradient-primary text-white hover-lift active-scale border-0 transition-all"
            >
              Back to Library
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (content && content.status === "failed") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-card shadow-playful-lg border-2">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="w-24 h-24 mx-auto bg-destructive/10 rounded-full flex items-center justify-center">
              <span className="text-4xl">⚠️</span>
            </div>
            <h3 className="text-xl font-bold">Generation Failed</h3>
            <p className="text-muted-foreground">
              We encountered an issue while generating your story. You can try again without re-entering your preferences.
            </p>
            {content.failureReason && (
              <div className="text-sm text-destructive bg-destructive/5 p-3 rounded-lg">
                <strong>Error:</strong> {content.failureReason}
              </div>
            )}
            <div className="flex gap-3 pt-2">
              <Button
                variant="outline"
                onClick={() => setLocation("/library")}
                className="flex-1 rounded-button"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Library
              </Button>
              <Button
                onClick={() => retryMutation.mutate({ contentId: content.id })}
                disabled={retryMutation.isPending}
                className="flex-1 rounded-button gradient-primary text-white hover-lift border-0"
              >
                {retryMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Retrying...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Retry Generation
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (content.status === "pending" || content.status === "generating") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50 flex flex-col items-center justify-center gap-4 p-4">
        <img src="/flip-mascot.png" alt="Processing" className="w-32 h-32 animate-flip" />
        <h3 className="text-2xl font-bold">Creating your story...</h3>
        <p className="text-muted-foreground text-center max-w-md">
          Flip is working hard to generate your personalized {content.mode} story. This usually takes 2-5 minutes.
        </p>
        <div className="w-64 h-2 bg-border rounded-full overflow-hidden">
          <div className="h-full gradient-primary animate-pulse" style={{ width: "60%" }} />
        </div>
        <Button
          variant="outline"
          onClick={() => setLocation("/library")}
          className="rounded-button mt-4"
        >
          Back to Library
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-playful">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.history.back()}
              className="rounded-full hover-scale active-scale transition-all"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={APP_LOGO} alt="Storyling.ai" className="h-10 w-10" />
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              className="rounded-full hover-scale active-scale transition-all"
            >
              <Share2 className="h-5 w-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDownload}
              className="rounded-full hover-scale active-scale transition-all"
              title="Download Story"
            >
              <Download className="h-5 w-5" />
            </Button>
            {content.mode === "film" && (
              <Button
                variant="ghost"
                size="icon"
                onClick={handleExportSubtitle}
                className="rounded-full hover-scale active-scale transition-all"
                title="Download Subtitles (.srt)"
                disabled={exportSubtitleMutation.isPending}
              >
                {exportSubtitleMutation.isPending ? (
                  <Loader2 className="h-5 w-5 animate-spin" />
                ) : (
                  <FileText className="h-5 w-5" />
                )}
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFavorite}
              className="rounded-full hover-scale active-scale transition-all"
            >
              <Heart className={`h-5 w-5 ${isFavorite ? "fill-pink-500 text-pink-500" : ""}`} />
            </Button>
          </div>
        </div>
      </header>

      {/* Completion Celebration */}
      {showCompletion && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md rounded-card shadow-playful-lg border-2 animate-bounce-in">
            <CardContent className="pt-6 text-center space-y-6">
              <img src="/flip-mascot.png" alt="Flip Celebrating" className="w-32 h-32 mx-auto animate-bounce animate-glow" />
              <h3 className="text-3xl font-bold gradient-text-primary">Amazing! 🎉</h3>
              <p className="text-lg text-muted-foreground">
                You completed the story! Keep learning and growing.
              </p>
              <div className="flex flex-col gap-3">
                <Button
                  onClick={() => setLocation("/create")}
                  className="rounded-button gradient-primary text-white hover-lift hover-glow active-scale border-0 h-12 transition-all"
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Create Another Story
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setShowCompletion(false)}
                  className="rounded-button hover-scale active-scale transition-all"
                >
                  Continue Reviewing
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      <div className="container py-8 max-w-5xl">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Library", href: "/library" },
            { label: content?.title || "Story", href: undefined },
          ]}
        />
        {/* Hero Area */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              {isEditingTitle ? (
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="text-4xl font-bold border-2 border-primary rounded-lg px-3 py-1 focus:outline-none focus:ring-2 focus:ring-primary/50 flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        updateTitleMutation.mutate(
                          { contentId: content.id, title: editedTitle },
                          {
                            onSuccess: () => {
                              utils.content.getById.invalidate({ id: contentId });
                            },
                          }
                        );
                      } else if (e.key === "Escape") {
                        setIsEditingTitle(false);
                        setEditedTitle(content.title || "");
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      updateTitleMutation.mutate(
                        { contentId: content.id, title: editedTitle },
                        {
                          onSuccess: () => {
                            utils.content.getById.invalidate({ id: contentId });
                          },
                        }
                      );
                    }}
                    disabled={updateTitleMutation.isPending || !editedTitle.trim()}
                    className="rounded-full hover-scale active-scale transition-all text-green-600 hover:bg-green-50"
                  >
                    <Check className="h-5 w-5" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setIsEditingTitle(false);
                      setEditedTitle(content.title || "");
                    }}
                    className="rounded-full hover-scale active-scale transition-all text-destructive hover:bg-destructive/10"
                  >
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mb-2 group">
                  <h1 className="text-4xl font-bold">
                    {content.title && content.titleTranslation 
                      ? `${content.title} / ${content.titleTranslation}`
                      : content.title || "Language Learning Story"}
                  </h1>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => {
                      setIsEditingTitle(true);
                      setEditedTitle(content.title || "");
                    }}
                    className="rounded-full hover-scale active-scale transition-all opacity-0 group-hover:opacity-100"
                    title="Edit title"
                  >
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={() => regenerateTitleMutation.mutate({ contentId: content.id })}
                    disabled={regenerateTitleMutation.isPending}
                    className="rounded-full hover-scale active-scale transition-all opacity-0 group-hover:opacity-100"
                    title="Regenerate title with AI"
                  >
                    {regenerateTitleMutation.isPending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              )}
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className="rounded-full gradient-primary text-white border-0">
                  {content.theme}
                </Badge>
                <Badge variant="outline" className="rounded-full">
                  {content.mode === "podcast" ? "🎙️ Podcast" : "🎬 Film"}
                </Badge>
              </div>
            </div>
          </div>

          {/* Player */}
          <Card className="rounded-card shadow-playful-lg border-2 overflow-hidden">
            <CardContent className="p-0">
              {content.mode === "podcast" ? (
                <div className="bg-gradient-to-br from-purple-100 to-teal-100">
                  <SentenceDisplay
                    storyText={content.storyText}
                    vocabularyWords={content.vocabularyWords || []}
                    storyLanguage={content.targetLanguage}
                    lineTranslations={content.lineTranslations as any}
                    audioRef={audioRef}
                    isPlaying={isPlaying}
                    onSentenceChange={setCurrentSentence}
                  />
                  {content.audioUrl && (
                    <audio
                      ref={audioRef}
                      src={content.audioUrl}
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onEnded={() => setIsPlaying(false)}
                    />
                  )}
                </div>
              ) : (
                <div className="relative bg-black aspect-video">
                  {content.videoUrl && (
                    <video
                      ref={videoRef}
                      src={content.videoUrl}
                      className="w-full h-full"
                      onPlay={() => setIsPlaying(true)}
                      onPause={() => setIsPlaying(false)}
                      onTimeUpdate={handleTimeUpdate}
                      onLoadedMetadata={handleLoadedMetadata}
                      onEnded={() => setIsPlaying(false)}
                    />
                  )}
                  {/* Video Controls Overlay */}
                  <div className="absolute top-4 right-4 flex gap-2">
                    {/* Quality Settings */}
                    <div className="relative" ref={qualityMenuRef}>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setShowQualityMenu(!showQualityMenu)}
                        className="bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm"
                        title="Video Quality"
                      >
                        <span className="text-xs font-bold">{videoQuality}</span>
                      </Button>
                      {showQualityMenu && (
                        <div className="absolute top-12 right-0 bg-black/90 backdrop-blur-md rounded-lg p-2 space-y-1 min-w-[120px] z-50">
                          {(['720p', '1080p', '4K'] as const).map((quality) => (
                            <button
                              key={quality}
                              onClick={() => handleQualityChange(quality)}
                              className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${
                                videoQuality === quality
                                  ? 'bg-purple-600 text-white'
                                  : 'text-white hover:bg-white/10'
                              }`}
                            >
                              {quality}
                              {videoQuality === quality && (
                                <Check className="inline-block ml-2 h-4 w-4" />
                              )}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    
                    {/* Download Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleDownload}
                      className="bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm"
                      title="Download Video"
                    >
                      <Download className="h-5 w-5" />
                    </Button>
                    
                    {/* Export Subtitle Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleExportSubtitle}
                      className="bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm"
                      title="Download Subtitles (.srt)"
                      disabled={exportSubtitleMutation.isPending}
                    >
                      {exportSubtitleMutation.isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <FileText className="h-5 w-5" />
                      )}
                    </Button>
                    
                    {/* Subtitle Settings Button */}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setShowSubtitleSettings(true)}
                      className="bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm"
                      title="Subtitle Settings"
                    >
                      <Settings className="h-5 w-5" />
                    </Button>
                  </div>
                </div>
              )}

              {/* Controls */}
              <div className="p-6 space-y-4">
                {/* Timeline */}
                <div className="space-y-2">
                  <Slider
                    value={[currentTime]}
                    max={duration || 100}
                    step={0.1}
                    onValueChange={handleSeek}
                    className="cursor-pointer"
                  />
                  <div className="flex justify-between text-sm text-muted-foreground">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Playback Controls */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={toggleMute}
                      className="rounded-full"
                    >
                      {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
                    </Button>
                    <Slider
                      value={[volume]}
                      max={1}
                      step={0.01}
                      onValueChange={handleVolumeChange}
                      className="w-24"
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => skip(-15)}
                      className="rounded-full"
                    >
                      <SkipBack className="h-5 w-5" />
                    </Button>
                    <Button
                      size="icon"
                      onClick={togglePlayPause}
                      className="rounded-full h-14 w-14 gradient-primary text-white hover-lift border-0"
                    >
                      {isPlaying ? <Pause className="h-6 w-6" /> : <Play className="h-6 w-6 ml-1" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => skip(15)}
                      className="rounded-full"
                    >
                      <SkipForward className="h-5 w-5" />
                    </Button>
                  </div>

                  <div className="flex items-center gap-1">
                    {[0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                      <Button
                        key={speed}
                        variant={playbackSpeed === speed ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handleSpeedChange(speed)}
                        className={`rounded-button ${
                          playbackSpeed === speed ? "gradient-primary text-white border-0" : ""
                        }`}
                      >
                        {speed}x
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Vocabulary Highlights */}
        {vocabularyWords.length > 0 && (
          <div className="mb-8">
            <h3 className="text-lg font-bold mb-4">Vocabulary in this story</h3>
            <div className="flex gap-2 flex-wrap">
              {vocabularyWords.map((vocab, idx) => (
                <Badge
                  key={idx}
                  variant="outline"
                  className="px-4 py-2 rounded-full text-sm font-medium border-2 hover-lift cursor-default"
                >
                  {vocab.word}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs defaultValue="transcript" className="mb-8">
          <TabsList className="grid w-full grid-cols-3 rounded-card">
            <TabsTrigger value="transcript" className="rounded-button">
              Transcript
            </TabsTrigger>
            <TabsTrigger value="vocabulary" className="rounded-button">
              Vocabulary
            </TabsTrigger>
            <TabsTrigger value="quiz" className="rounded-button">
              Quiz
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transcript" className="mt-4">
            <Card className="rounded-card shadow-playful border-2 overflow-hidden">
              <CardContent className="pt-6 overflow-hidden">
                <StoryDisplay
                  storyText={content.storyText}
                  lineTranslations={content.lineTranslations as any}
                  vocabularyTranslations={content.vocabularyTranslations as any}
                  targetLanguage={content.targetLanguage}
                  audioRef={content.mode === "podcast" ? audioRef : undefined}
                  isPlaying={isPlaying}
                />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vocabulary" className="mt-4">
            <Card className="rounded-card shadow-playful border-2">
              <CardContent className="pt-6">
                {vocabularyWords.length > 0 ? (
                  <VocabularyTable
                    words={content?.vocabularyWords || []}
                    targetLanguage={content?.targetLanguage || "Unknown"}
                    vocabularyTranslations={content?.vocabularyTranslations as any}
                  />
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No vocabulary words found for this story</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quiz" className="mt-4">
            <QuizTab contentId={contentId} targetLanguage={content.targetLanguage || "Unknown"} />
          </TabsContent>
        </Tabs>

        {/* Bottom Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <Button
            onClick={() => regenerateStoryMutation.mutate({ contentId: content.id })}
            disabled={regenerateStoryMutation.isPending}
            variant="outline"
            className="flex-1 rounded-button hover-lift border-2 h-12"
          >
            {regenerateStoryMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                Regenerating...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-5 w-5" />
                Regenerate Story
              </>
            )}
          </Button>
          <Button
            onClick={() => setLocation("/create")}
            className="flex-1 rounded-button gradient-primary text-white hover-lift border-0 h-12"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Create Another Story
          </Button>
          <Button
            variant="outline"
            className="flex-1 rounded-button border-2 h-12"
          >
            <BookOpen className="mr-2 h-5 w-5" />
            Practice These Words
          </Button>
        </div>
      </div>

      {/* Subtitle Customization Modal */}
      <SubtitleCustomizationModal
        isOpen={showSubtitleSettings}
        onClose={() => setShowSubtitleSettings(false)}
        settings={subtitleSettings}
        onSettingsChange={(newSettings) => {
          setSubtitleSettings(newSettings);
          localStorage.setItem('subtitleSettings', JSON.stringify(newSettings));
          toast.success("Subtitle settings updated!");
        }}
      />
    </div>
  );
}
