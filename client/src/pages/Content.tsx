import { useState, useEffect, useMemo, useRef } from "react";
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
  FileText,
  Film,
  Video,
  Clapperboard,
  Headphones,
  ExternalLink,
  Twitter,
  Facebook,
  Linkedin,
  Mail,
  Copy,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { trpc } from "@/lib/trpc";
import { useLocation, useRoute } from "wouter";
import { toast } from "sonner";
import { APP_LOGO } from "@/const";
import { QuizTab } from "@/components/QuizTab";
import { StoryDisplay } from "@/components/StoryDisplay";
import { SentenceDisplay } from "@/components/SentenceDisplay";
import { VocabularyTable } from "@/components/VocabularyTable";
import Breadcrumb from "@/components/Breadcrumb";
import { PaywallModal } from "@/components/upgrade/PaywallModal";
import { useUpgradeFlow } from "@/hooks/useUpgradeFlow";
import { MobileNav } from "@/components/MobileNav";
import { ShareStoryModal } from "@/components/ShareStoryModal";
import { useEntitlements } from "@/hooks/useEntitlements";
import { Crown, Lock } from "lucide-react";
import { normalizeStringArray, safeString } from "@/lib/contentDisplay";

type FilmSubtitleSegment = {
  startTime: number;
  endTime: number;
  text: string;
};

function parseFilmSubtitleSegments(transcript?: string | null): FilmSubtitleSegment[] {
  if (!transcript) return [];

  try {
    const parsed = JSON.parse(transcript) as {
      segments?: Array<{
        startTime?: unknown;
        endTime?: unknown;
        text?: unknown;
      }>;
    };

    if (!Array.isArray(parsed.segments)) {
      return [];
    }

    return parsed.segments
      .map((segment) => ({
        startTime: Number(segment.startTime),
        endTime: Number(segment.endTime),
        text: typeof segment.text === "string" ? segment.text.trim() : "",
      }))
      .filter(
        (segment) =>
          Number.isFinite(segment.startTime) &&
          Number.isFinite(segment.endTime) &&
          segment.endTime > segment.startTime &&
          segment.text.length > 0,
      );
  } catch {
    return [];
  }
}

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
  const [showFirstStoryUpgrade, setShowFirstStoryUpgrade] = useState(false);
  const { isPremium } = useUpgradeFlow();
  const entitlements = useEntitlements();
  const [showSpeedGatePaywall, setShowSpeedGatePaywall] = useState(false);
  const [showDownloadGatePaywall, setShowDownloadGatePaywall] = useState(false);
  const [thumbnailFailed, setThumbnailFailed] = useState(false);
  const [currentSentence, setCurrentSentence] = useState(0);
  const [progressLoaded, setProgressLoaded] = useState(false);
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState("");
  const [videoQuality, setVideoQuality] = useState<'720p' | '1080p' | '4K'>(() => {
    const saved = localStorage.getItem('videoQuality');
    return (saved as '720p' | '1080p' | '4K') || '1080p';
  });
  const [showQualityMenu, setShowQualityMenu] = useState(false);
  const [showConvertToFilm, setShowConvertToFilm] = useState(false);
  const [showShareModal, setShowShareModal] = useState(false);
  const [isBottomBarMinimized, setIsBottomBarMinimized] = useState(false);
  const [activeTab, setActiveTab] = useState("transcript");
  const [convertCinematicStyle, setConvertCinematicStyle] = useState("cinematic");
  const [convertVideoDuration, setConvertVideoDuration] = useState<number>(30);
  const [convertBackgroundMusic, setConvertBackgroundMusic] = useState<string>("none");
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const qualityMenuRef = useRef<HTMLDivElement>(null);
  const autoThumbnailRequestedRef = useRef<number | null>(null);
  const hasPlayedThisSessionRef = useRef(false);
  const completionHandledForContentRef = useRef<number | null>(null);

  useEffect(() => {
    setShowCompletion(false);
    setCurrentTime(0);
    setDuration(0);
    setCurrentSentence(0);
    setProgressLoaded(false);
    setIsPlaying(false);
    hasPlayedThisSessionRef.current = false;
    completionHandledForContentRef.current = null;
  }, [contentId]);
  
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
  const recordWatchMutation = trpc.watchHistory.recordWatch.useMutation();

  const { data: content, isLoading } = trpc.content.getById.useQuery(
    { id: contentId },
    { enabled: isAuthenticated && contentId > 0 }
  );
  const { data: wordbankWords = [] } = trpc.wordbank.getMyWords.useQuery(undefined, {
    enabled: isAuthenticated && contentId > 0,
    refetchInterval: 5000,
  });

  const filmSubtitleSegments = useMemo(
    () => (content?.mode === "film" ? parseFilmSubtitleSegments(content.transcript) : []),
    [content?.mode, content?.transcript],
  );

  const { data: favorites } = trpc.content.getFavorites.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Linked versions query (shows other formats of the same story)
  const { data: linkedVersions } = trpc.content.getLinkedVersions.useQuery(
    { contentId },
    { enabled: isAuthenticated && contentId > 0 }
  );

  // Conversion progress polling (only for podcasts that have an active film conversion)
  const { data: conversionProgress } = trpc.content.getConversionProgress.useQuery(
    { contentId },
    {
      enabled: isAuthenticated && contentId > 0 && content?.mode === "podcast",
      refetchInterval: (query) => {
        const data = query.state.data;
        // Poll every 3 seconds while generating, stop when done
        if (data && data.status === "generating") return 3000;
        return false;
      },
    }
  );

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
  
  const utils = trpc.useUtils();

  const updateVisibilityMutation = trpc.content.updateVisibility.useMutation({
    onSuccess: (_, variables) => {
      utils.content.getById.invalidate({ id: variables.contentId });
    },
    onError: (error) => {
      toast.error(error.message || "Failed to update story visibility");
    },
  });

  const regenerateMissingThumbnailMutation = trpc.content.regenerateThumbnail.useMutation({
    onSuccess: () => {
      setThumbnailFailed(false);
      utils.content.getById.invalidate({ id: contentId });
    },
    onError: (error) => {
      console.error("[Content] Failed to auto-generate thumbnail:", error);
    },
  });

  useEffect(() => {
    setThumbnailFailed(false);
  }, [content?.id, content?.thumbnailUrl]);

  useEffect(() => {
    if (!content || content.id !== contentId || content.status !== "completed") return;

    const needsThumbnail = !content.thumbnailUrl || thumbnailFailed;
    if (!needsThumbnail) return;
    if (autoThumbnailRequestedRef.current === content.id) return;
    if (regenerateMissingThumbnailMutation.isPending) return;

    autoThumbnailRequestedRef.current = content.id;
    regenerateMissingThumbnailMutation.mutate({ contentId: content.id, style: "pixar" });
  }, [
    content?.id,
    content?.status,
    content?.thumbnailUrl,
    contentId,
    thumbnailFailed,
    regenerateMissingThumbnailMutation.isPending,
  ]);
  
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
  
  const convertToFilmMutation = trpc.content.convertToFilm.useMutation({
    onSuccess: (data) => {
      setShowConvertToFilm(false);
      toast.success(
        "Film conversion started! Your podcast is unchanged. Check your Library for the new film when it's ready.",
        { duration: 6000 }
      );
      // Invalidate library queries so the new film appears
      utils.content.getLibrary.invalidate();
    },
    onError: (error: any) => {
      toast.error(`Failed to convert to film: ${error.message}`);
    },
  });
  
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
  
  const backfillVocabularyMutation = trpc.content.backfillVocabularyTranslations.useMutation({
    onSuccess: (data) => {
      if (data.updated) {
        toast.success(`Vocabulary translations generated for ${data.wordCount} words!`);
        utils.content.getById.invalidate({ id: contentId });
      }
    },
    onError: (error) => {
      console.error('Failed to backfill vocabulary:', error);
      toast.error(`Failed to generate vocabulary translations: ${error.message}`);
    },
  });
  
  // Auto-backfill vocabulary translations if missing
  useEffect(() => {
    if (content && content.status === "completed") {
      const hasVocabTranslations = content.vocabularyTranslations && 
        Object.keys(content.vocabularyTranslations).length > 0;
      
      if (!hasVocabTranslations && !backfillVocabularyMutation.isPending) {
        console.log('[Content] Vocabulary translations missing, triggering backfill...');
        backfillVocabularyMutation.mutate({ contentId: content.id });
      }
    }
  }, [content?.id, content?.status, content?.vocabularyTranslations]);

  const isFavorite = favorites?.some((f) => f.contentId === contentId);
  
  // Track view for recently viewed
  const trackViewMutation = trpc.recentlyViewed.trackView.useMutation();
  
  useEffect(() => {
    if (content && content.status === "completed") {
      trackViewMutation.mutate({
        itemType: "story",
        itemId: content.id,
        itemTitle: content.title || safeString(content.storyText).substring(0, 100),
        itemThumbnail: content.thumbnailUrl || undefined,
      });
    }
  }, [content?.id, content?.status]);

  useEffect(() => {
    if (content && content.status === "completed") {
      incrementPlayMutation.mutate({ contentId: content.id });
    }
  }, [content?.id, content?.status]);

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

  const handleMediaPlay = () => {
    hasPlayedThisSessionRef.current = true;
    setIsPlaying(true);
  };

  const handlePlaybackCompleted = (media: HTMLAudioElement | HTMLVideoElement) => {
    if (completionHandledForContentRef.current === contentId) {
      return;
    }

    completionHandledForContentRef.current = contentId;
    setShowCompletion(true);

    saveProgressMutation.mutate({
      contentId,
      currentSentence,
      currentTime: Number.isFinite(media.duration) ? media.duration : media.currentTime,
      totalDuration: Number.isFinite(media.duration) ? media.duration : media.currentTime,
      completed: true,
    });

    // Check if this is the first completed story for free users (upgrade trigger #1)
    if (!isPremium) {
      const shownKey = "storyling_upgrade_triggers";
      try {
        const shown = JSON.parse(localStorage.getItem(shownKey) || "{}");
        if (!shown["first_story_completed"]) {
          // Delay the upgrade modal to show after the completion celebration
          setTimeout(() => {
            setShowFirstStoryUpgrade(true);
            shown["first_story_completed"] = true;
            localStorage.setItem(shownKey, JSON.stringify(shown));
          }, 3000);
        }
      } catch {}
    }

    recordWatchMutation.mutate({
      contentId,
      duration: media.currentTime,
      completed: true,
      progressPercentage: 100,
    });
  };

  const handleTimeUpdate = () => {
    const media = content?.mode === "podcast" ? audioRef.current : videoRef.current;
    if (!media) return;
    setCurrentTime(media.currentTime);

    const hasValidDuration = Number.isFinite(media.duration) && media.duration > 0;
    const isNearEnd = hasValidDuration && media.duration - media.currentTime < 0.75;

    if (isNearEnd && hasPlayedThisSessionRef.current) {
      handlePlaybackCompleted(media);
    }
  };

  const handleMediaEnded = () => {
    const media = content?.mode === "podcast" ? audioRef.current : videoRef.current;
    setIsPlaying(false);
    if (media && hasPlayedThisSessionRef.current) {
      handlePlaybackCompleted(media);
    }
  };

  const replayCurrentStory = () => {
    const media = content?.mode === "podcast" ? audioRef.current : videoRef.current;
    if (!media) return;

    completionHandledForContentRef.current = null;
    hasPlayedThisSessionRef.current = true;
    setShowCompletion(false);
    media.currentTime = 0;
    setCurrentTime(0);
    media.play().catch(() => {
      setIsPlaying(false);
    });
  };
  
  // Auto-save progress every 5 seconds during playback
  useEffect(() => {
    if (!isPlaying || !content) return;
    
    const interval = setInterval(() => {
      const media = content.mode === "podcast" ? audioRef.current : videoRef.current;
      if (!media) return;
      if (completionHandledForContentRef.current === contentId) return;
      
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
    
    // Auto-resume from saved progress, except completed stories: those should reopen ready to replay.
    if (savedProgress && !progressLoaded && savedProgress.currentTime > 0) {
      const savedTime = Number(savedProgress.currentTime) || 0;
      const isSavedAtEnd =
        Number.isFinite(media.duration) &&
        media.duration > 0 &&
        media.duration - savedTime < 1;

      if (savedProgress.completed || isSavedAtEnd) {
        media.currentTime = 0;
        setCurrentTime(0);
        setCurrentSentence(0);
        setProgressLoaded(true);
        return;
      }

      const resumeTime =
        Number.isFinite(media.duration) && media.duration > 0
          ? Math.min(savedTime, Math.max(0, media.duration - 1))
          : savedTime;
      media.currentTime = resumeTime;
      setCurrentSentence(savedProgress.currentSentence);
      setProgressLoaded(true);

      // Show resume toast
      const minutes = Math.floor(savedTime / 60);
      const seconds = Math.floor(savedTime % 60);
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

  const handleShare = () => {
    if (!content) return;

    if (!content.isPublic) {
      updateVisibilityMutation.mutate(
        { contentId: content.id, isPublic: true },
        {
          onSuccess: () => {
            toast.success("Story is public now. You can share the link.");
            setShowShareModal(true);
          },
        }
      );
      return;
    }

    setShowShareModal(true);
  };

  const handlePracticeWords = () => {
    setActiveTab("quiz");
    setTimeout(() => {
      document.getElementById("content-practice-tabs")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 0);
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
  
  const vocabularyWordList = normalizeStringArray(content?.vocabularyWords);
  const wordMasteryByKey = useMemo(() => {
    const map = new Map<string, (typeof wordbankWords)[number]>();
    for (const word of wordbankWords) {
      map.set(`${word.word.toLowerCase()}::${(word.targetLanguage || "").toLowerCase()}`, word);
    }
    return map;
  }, [wordbankWords]);
  const getVocabularyMastery = (word: string) => {
    const targetLanguage = (content?.targetLanguage || "").toLowerCase();
    const savedWord = wordMasteryByKey.get(`${word.toLowerCase()}::${targetLanguage}`);
    if (!savedWord) return { percent: 0, label: "New" };

    const correct = savedWord.correctCount ?? 0;
    const incorrect = savedWord.incorrectCount ?? 0;
    const totalReviews = correct + incorrect;
    const interval = savedWord.interval ?? 0;
    const repetitions = savedWord.repetitions ?? 0;
    const isMastered = (savedWord.easinessFactor ?? 0) >= 2500 && interval >= 30;

    if (isMastered) return { percent: 100, label: "Mastered" };
    if (totalReviews === 0) return { percent: 10, label: "Saved" };

    const accuracy = correct / Math.max(1, totalReviews);
    const reviewProgress = Math.min(1, repetitions / 5);
    const intervalProgress = Math.min(1, interval / 30);
    const percent = Math.round((accuracy * 0.55 + reviewProgress * 0.30 + intervalProgress * 0.15) * 100);

    return {
      percent: Math.max(10, Math.min(99, percent)),
      label: `${Math.max(10, Math.min(99, percent))}%`,
    };
  };
  const vocabularyWords = vocabularyWordList.map((word, idx) => ({
    word,
    translation: "", // Translation can be added later via API or user input
    timestamp: idx * 10, // Placeholder timestamps - can be enhanced with actual transcript timing
    mastery: getVocabularyMastery(word),
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
      {/* Hamburger nav (right) */}
      <MobileNav
        title=""
        darkBg={true}
        rightActions={
          <>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleShare}
              disabled={updateVisibilityMutation.isPending}
              className="h-9 w-9 rounded-full text-white hover:bg-white/20"
            >
              {updateVisibilityMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Share2 className="h-4 w-4" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleFavorite}
              className="h-9 w-9 rounded-full text-white hover:bg-white/20"
            >
              <Heart className={`h-4 w-4 ${isFavorite ? "fill-pink-500 text-pink-500" : ""}`} />
            </Button>
          </>
        }
      />
      {/* Back button top-left — same style as Create page */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setLocation("/library")}
        className="fixed top-4 left-4 z-50 h-11 w-11 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-all"
      >
        <ArrowLeft className="h-5 w-5 text-white drop-shadow-md" />
      </Button>

      {/* Completion Celebration */}
      {showCompletion && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-md rounded-card shadow-playful-lg border-2 animate-bounce-in overflow-hidden">
            <CardContent className="pt-6 text-center space-y-5 pb-2">
              <img src={APP_LOGO} alt="Storyling" className="w-28 h-28 mx-auto object-contain animate-bounce animate-glow" />
              <h3 className="text-3xl font-bold gradient-text-primary">Nice! You finished your story. 🎉</h3>
              <p className="text-lg text-muted-foreground">
                {entitlements.isFree
                  ? "Keep learning with unlimited stories, unlimited lookups, and more."
                  : "Great job! Keep learning and growing."}
              </p>
              {/* Stats */}
              {vocabularyWordList.length > 0 && (
                <p className="text-sm text-purple-600 font-medium">
                  You learned {vocabularyWordList.length} new words.
                </p>
              )}
            </CardContent>

            {/* Upgrade prompt for free users (Trigger 1) */}
            {entitlements.isFree && (
              <div className="mx-4 mb-3 rounded-2xl bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 border border-purple-200/60 p-4">
                <Button
                  onClick={() => { setShowCompletion(false); setShowFirstStoryUpgrade(true); }}
                  className="w-full rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 h-11 text-sm font-semibold hover:shadow-lg hover:shadow-purple-200 transition-all"
                >
                  <Crown className="mr-2 h-4 w-4" />
                  Start free trial
                </Button>
              </div>
            )}

            {/* Share Nudge */}
            <div className="mx-4 mb-4 rounded-2xl bg-gradient-to-r from-purple-50 via-blue-50 to-purple-50 border border-purple-200/60 p-5">
              <p className="text-sm font-semibold text-purple-800 mb-1" style={{ fontFamily: "Fredoka, sans-serif" }}>
                Share your masterpiece with friends
              </p>
              <p className="text-xs text-purple-500 mb-3">
                Show off what you've been learning — inspire others to start their language journey.
              </p>
              <Button
                onClick={() => { setShowCompletion(false); setShowShareModal(true); }}
                className="w-full rounded-full bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 h-11 text-sm font-semibold hover:shadow-lg hover:shadow-purple-200 transition-all"
              >
                <Share2 className="mr-2 h-4 w-4" />
                Share Story
              </Button>
            </div>

            <CardContent className="pt-0 pb-6 space-y-2">
              <Button
                onClick={replayCurrentStory}
                className="w-full rounded-button gradient-primary text-white border-0 h-10 text-sm font-semibold"
              >
                <Play className="mr-2 h-4 w-4" />
                Replay Story
              </Button>
              <Button
                onClick={() => { setShowCompletion(false); setLocation("/create"); }}
                className="w-full rounded-button text-muted-foreground hover:text-foreground transition-all h-10 text-sm"
                variant="ghost"
              >
                Continue
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* First Story Completed Upgrade Trigger */}
      <PaywallModal
        open={showFirstStoryUpgrade}
        onOpenChange={setShowFirstStoryUpgrade}
        trigger="first_story"
        headline="keep_going"
      />

      {/* ===== V3 CINEMATIC HERO ===== */}
      <div className="relative w-full">
        {/* Full-bleed cover art background */}
        <div className="relative w-full h-[420px] sm:h-[480px] overflow-hidden">
          {content.thumbnailUrl && !thumbnailFailed ? (
            <img
              src={content.thumbnailUrl}
              alt={content.title || "Story cover"}
              className="w-full h-full object-cover"
              onError={() => setThumbnailFailed(true)}
              onLoad={(e) => {
                const img = e.currentTarget;
                if (img.naturalWidth === 0) setThumbnailFailed(true);
              }}
            />
          ) : (
            <div className="w-full h-full" style={{
              background: "linear-gradient(135deg, #2d1b4e 0%, #3b2667 15%, #4a3580 25%, #3d4a8a 40%, #2e6b7a 55%, #3a8b7c 70%, #4aab7e 85%, #6bc68d 100%)",
            }}>
              {/* Aurora glow overlays */}
              <div className="absolute inset-0 opacity-40" style={{
                background: "radial-gradient(ellipse 80% 50% at 20% 50%, rgba(120,200,150,0.5) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 30%, rgba(150,120,220,0.4) 0%, transparent 70%), radial-gradient(ellipse 70% 50% at 50% 80%, rgba(100,180,200,0.3) 0%, transparent 70%)"
              }} />
              {/* Sparkles */}
              {[...Array(12)].map((_, i) => (
                <div key={i} className="absolute rounded-full animate-pulse" style={{
                  width: 2 + Math.random() * 3, height: 2 + Math.random() * 3,
                  top: `${Math.random() * 100}%`, left: `${Math.random() * 100}%`,
                  background: `rgba(255,255,255,${0.3 + Math.random() * 0.4})`,
                  animationDelay: `${Math.random() * 3}s`, animationDuration: `${1.5 + Math.random() * 2}s`,
                }} />
              ))}
            </div>
          )}
          {/* Dark gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#1a1a3e] via-[#1a1a3e]/70 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent" />

          {/* Overlaid content */}
          <div className="absolute inset-0 flex flex-col justify-end p-6 sm:p-8 max-w-5xl mx-auto">
            {/* Breadcrumb */}
            <div className="mb-auto pt-2">
              <div className="flex items-center gap-1.5 text-white/60 text-sm">
                <span className="cursor-pointer hover:text-white/90" onClick={() => setLocation("/app")}>Home</span>
                <span>&rsaquo;</span>
                <span className="cursor-pointer hover:text-white/90" onClick={() => setLocation("/library")}>Library</span>
              </div>
            </div>

            {/* Title area */}
            <div className="mb-4">
              {isEditingTitle ? (
                <div className="flex items-center gap-2 mb-2">
                  <input
                    type="text"
                    value={editedTitle}
                    onChange={(e) => setEditedTitle(e.target.value)}
                    className="text-2xl sm:text-3xl font-bold bg-white/10 backdrop-blur-md border border-white/30 rounded-lg px-3 py-1 text-white focus:outline-none focus:ring-2 focus:ring-purple-400/50 flex-1"
                    autoFocus
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        updateTitleMutation.mutate(
                          { contentId: content.id, title: editedTitle },
                          { onSuccess: () => utils.content.getById.invalidate({ id: contentId }) }
                        );
                      } else if (e.key === "Escape") {
                        setIsEditingTitle(false);
                        setEditedTitle(content.title || "");
                      }
                    }}
                  />
                  <Button size="icon" variant="ghost" onClick={() => updateTitleMutation.mutate({ contentId: content.id, title: editedTitle }, { onSuccess: () => utils.content.getById.invalidate({ id: contentId }) })} disabled={updateTitleMutation.isPending || !editedTitle.trim()} className="rounded-full text-green-400 hover:bg-white/10">
                    <Check className="h-5 w-5" />
                  </Button>
                  <Button size="icon" variant="ghost" onClick={() => { setIsEditingTitle(false); setEditedTitle(content.title || ""); }} className="rounded-full text-red-400 hover:bg-white/10">
                    <X className="h-5 w-5" />
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-2 group">
                  <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white drop-shadow-lg">
                    {content.title || "Language Learning Story"}
                  </h1>
                  <Button size="icon" variant="ghost" onClick={() => { setIsEditingTitle(true); setEditedTitle(content.title || ""); }} className="rounded-full opacity-0 group-hover:opacity-100 text-white/70 hover:text-white hover:bg-white/10" title="Edit title">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
              {content.titleTranslation && (
                <p className="text-white/60 text-sm sm:text-base mt-1">{content.titleTranslation}</p>
              )}
            </div>

            {/* Badges row */}
            <div className="flex items-center gap-2 flex-wrap mb-2">
              {content.difficultyLevel && (
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-500/90 text-white">
                  {content.difficultyLevel}
                </span>
              )}
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-purple-500/80 text-white">
                {content.theme}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-teal-500/80 text-white">
                {content.targetLanguage}
              </span>
              <span className="px-3 py-1 rounded-full text-xs font-semibold bg-white/20 text-white backdrop-blur-sm">
                {content.mode === "podcast" ? "🎙️ Podcast" : "🎬 Film"}
              </span>
            </div>

            {/* Stats row */}
            <div className="flex items-center gap-4 text-white/50 text-xs">
              {content.playCount !== undefined && content.playCount > 0 && (
                <span className="flex items-center gap-1"><Play className="h-3 w-3" /> {content.playCount} plays</span>
              )}
              {duration > 0 && (
                <span className="flex items-center gap-1">⏱ {formatTime(duration)}</span>
              )}
            </div>
          </div>
        </div>

        {/* Audio/Video player area */}
        <div
          className="relative px-4 sm:px-8 max-w-5xl mx-auto z-10"
          style={{ marginTop: content.mode === "podcast" ? "-2.5rem" : "1.5rem" }}
        >
          {content.mode === "podcast" ? (
            <>
              {content.audioUrl && (
                <audio
                  ref={audioRef}
                  src={content.audioUrl}
                  onPlay={handleMediaPlay}
                  onPause={() => setIsPlaying(false)}
                  onTimeUpdate={handleTimeUpdate}
                  onLoadedMetadata={handleLoadedMetadata}
                  onEnded={handleMediaEnded}
                />
              )}
            </>
          ) : (
            <div className="rounded-2xl shadow-xl overflow-hidden">
              <div className="relative bg-black aspect-video">
                {content.videoUrl && (
                  <video
                    ref={videoRef}
                    src={content.videoUrl}
                    className="w-full h-full"
                    onPlay={handleMediaPlay}
                    onPause={() => setIsPlaying(false)}
                    onTimeUpdate={handleTimeUpdate}
                    onLoadedMetadata={handleLoadedMetadata}
                    onEnded={handleMediaEnded}
                  />
                )}
                {/* Video Controls Overlay */}
                <div className="absolute top-4 right-4 flex gap-2">
                  <div className="relative" ref={qualityMenuRef}>
                    <Button variant="ghost" size="icon" onClick={() => setShowQualityMenu(!showQualityMenu)} className="bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm" title="Video Quality">
                      <span className="text-xs font-bold">{videoQuality}</span>
                    </Button>
                    {showQualityMenu && (
                      <div className="absolute top-12 right-0 bg-black/90 backdrop-blur-md rounded-lg p-2 space-y-1 min-w-[120px] z-50">
                        {(['720p', '1080p', '4K'] as const).map((quality) => (
                          <button key={quality} onClick={() => handleQualityChange(quality)} className={`w-full text-left px-3 py-2 rounded text-sm transition-colors ${videoQuality === quality ? 'bg-purple-600 text-white' : 'text-white hover:bg-white/10'}`}>
                            {quality}{videoQuality === quality && <Check className="inline-block ml-2 h-4 w-4" />}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  {entitlements.canDownloadOffline ? (
                    <Button variant="ghost" size="icon" onClick={handleDownload} className="bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm" title="Download Video">
                      <Download className="h-5 w-5" />
                    </Button>
                  ) : (
                    <Button variant="ghost" size="icon" onClick={() => setShowDownloadGatePaywall(true)} className="bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm relative" title="Download (Premium)">
                      <Download className="h-5 w-5" />
                      <Crown className="h-3 w-3 text-yellow-400 absolute -top-0.5 -right-0.5" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" onClick={handleExportSubtitle} className="bg-black/50 hover:bg-black/70 text-white rounded-full backdrop-blur-sm" title="Download Subtitles (.srt)" disabled={exportSubtitleMutation.isPending}>
                    {exportSubtitleMutation.isPending ? <Loader2 className="h-5 w-5 animate-spin" /> : <FileText className="h-5 w-5" />}
                  </Button>
                </div>
              </div>
              {/* Video Controls */}
              <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-3 sm:p-4 space-y-3">
                <div className="space-y-1">
                  <Slider value={[currentTime]} max={duration || 100} step={0.1} onValueChange={handleSeek} className="cursor-pointer" />
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row items-center gap-2 sm:justify-between">
                  <div className="hidden sm:flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={toggleMute} className="rounded-full h-8 w-8">
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                    <Slider value={[volume]} max={1} step={0.01} onValueChange={handleVolumeChange} className="w-20" />
                  </div>
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" onClick={toggleMute} className="rounded-full h-8 w-8 sm:hidden">
                      {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => skip(-15)} className="rounded-full h-9 w-9"><SkipBack className="h-4 w-4" /></Button>
                    <Button size="icon" onClick={togglePlayPause} className="rounded-full h-12 w-12 bg-gradient-to-r from-purple-600 to-teal-500 text-white hover:opacity-90 border-0 shadow-lg">
                      {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => skip(15)} className="rounded-full h-9 w-9"><SkipForward className="h-4 w-4" /></Button>
                  </div>
                  <div className="flex items-center gap-0.5 overflow-x-auto max-w-full scrollbar-hide">
                    {entitlements.canUseAudioSpeedControl ? (
                      [0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                        <Button key={speed} variant={playbackSpeed === speed ? "default" : "ghost"} size="sm" onClick={() => handleSpeedChange(speed)} className={`rounded-full h-7 px-2 text-xs shrink-0 ${playbackSpeed === speed ? "bg-purple-600 text-white border-0" : ""}`}>
                          {speed}x
                        </Button>
                      ))
                    ) : (
                      <button
                        onClick={() => setShowSpeedGatePaywall(true)}
                        className="flex items-center gap-1 px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-medium hover:bg-purple-100 transition-colors shrink-0"
                      >
                        <Crown className="h-3 w-3" />
                        Speed
                        <Lock className="h-3 w-3 opacity-60" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== V2 BODY SECTION ===== */}
      <div className="max-w-5xl mx-auto px-4 sm:px-8 pt-8 pb-32">
        {/* Sentence Display Card */}
        {(content.mode === "podcast" || content.mode === "film") && (
          <div className="mb-4">
            <Card className="rounded-2xl shadow-lg border-0 bg-gradient-to-br from-purple-50/80 to-pink-50/80 overflow-hidden">
              <CardContent className="p-0">
                <SentenceDisplay
                  key={`${content.id}-${content.mode}`}
                  storyText={content.storyText}
                  vocabularyWords={vocabularyWordList}
                  storyLanguage={content.targetLanguage}
                  lineTranslations={content.lineTranslations as any}
                  audioRef={content.mode === "podcast" ? audioRef : videoRef}
                  isPlaying={isPlaying}
                  onSentenceChange={setCurrentSentence}
                  audioAlignment={content.audioAlignment as any}
                  subtitleSegments={content.mode === "film" ? filmSubtitleSegments : undefined}
                />
              </CardContent>
            </Card>
          </div>
        )}

        {/* Audio Player - below sentence display */}
        {content.mode === "podcast" && (
          <div className="mb-8">
            <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl rounded-2xl shadow-xl border border-white/30 p-3 sm:p-5">
              {/* Timeline */}
              <div className="space-y-1 mb-3">
                <Slider
                  value={[currentTime]}
                  max={duration || 100}
                  step={0.1}
                  onValueChange={handleSeek}
                  className="cursor-pointer"
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>{formatTime(currentTime)}</span>
                  <span>{formatTime(duration)}</span>
                </div>
              </div>
              {/* Playback Controls - responsive layout */}
              <div className="flex flex-col sm:flex-row items-center gap-2 sm:justify-between">
                {/* Volume - hidden on mobile to save space */}
                <div className="hidden sm:flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={toggleMute} className="rounded-full h-8 w-8">
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  <Slider value={[volume]} max={1} step={0.01} onValueChange={handleVolumeChange} className="w-20" />
                </div>
                {/* Play controls */}
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" onClick={toggleMute} className="rounded-full h-8 w-8 sm:hidden">
                    {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => skip(-15)} className="rounded-full h-9 w-9">
                    <SkipBack className="h-4 w-4" />
                  </Button>
                  <Button size="icon" onClick={togglePlayPause} className="rounded-full h-12 w-12 bg-gradient-to-r from-purple-600 to-teal-500 text-white hover:opacity-90 border-0 shadow-lg">
                    {isPlaying ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
                  </Button>
                  <Button variant="ghost" size="icon" onClick={() => skip(15)} className="rounded-full h-9 w-9">
                    <SkipForward className="h-4 w-4" />
                  </Button>
                </div>
                {/* Speed controls - scrollable on mobile */}
                <div className="flex items-center gap-0.5 overflow-x-auto max-w-full scrollbar-hide">
                  {entitlements.canUseAudioSpeedControl ? (
                    [0.5, 0.75, 1, 1.25, 1.5, 2].map((speed) => (
                      <Button
                        key={speed}
                        variant={playbackSpeed === speed ? "default" : "ghost"}
                        size="sm"
                        onClick={() => handleSpeedChange(speed)}
                        className={`rounded-full h-7 px-2 text-xs shrink-0 ${playbackSpeed === speed ? "bg-purple-600 text-white border-0" : ""}`}
                      >
                        {speed}x
                      </Button>
                    ))
                  ) : (
                    <button
                      onClick={() => setShowSpeedGatePaywall(true)}
                      className="flex items-center gap-1 px-3 py-1 rounded-full bg-purple-50 text-purple-600 text-xs font-medium hover:bg-purple-100 transition-colors shrink-0"
                    >
                      <Crown className="h-3 w-3" />
                      Speed
                      <Lock className="h-3 w-3 opacity-60" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Vocabulary Chips with Mastery Tracking */}
        {vocabularyWords.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <BookOpen className="h-4 w-4 text-purple-600" />
              <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Key Vocabulary</h3>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
              {vocabularyWords.map((vocab, idx) => (
                <div
                  key={idx}
                  className="flex-shrink-0 min-w-[120px] px-4 py-3 rounded-xl border border-purple-200/60 bg-white shadow-sm hover:shadow-md transition-shadow cursor-default"
                >
                  <p className="font-semibold text-sm text-gray-800">{vocab.word}</p>
                  <div className="mt-2 h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-purple-500 to-teal-400"
                      style={{ width: `${vocab.mastery.percent}%` }}
                    />
                  </div>
                  <p className="text-[10px] text-muted-foreground mt-1 text-right">
                    {vocab.mastery.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Film Conversion Progress Banner */}
        {content.mode === "podcast" && conversionProgress && conversionProgress.status === "generating" && (
          <div className="mb-6 rounded-card border-2 border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950/30 dark:to-pink-950/30 dark:border-purple-800 p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="relative">
                <Clapperboard className="h-5 w-5 text-purple-600 animate-pulse" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-semibold text-purple-900 dark:text-purple-100">
                    Film version generating...
                  </span>
                  <span className="text-sm font-bold text-purple-600">
                    {conversionProgress.progress}%
                  </span>
                </div>
                <div className="w-full bg-purple-200 dark:bg-purple-800 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500"
                    style={{ width: `${conversionProgress.progress}%` }}
                  />
                </div>
                <p className="text-xs text-purple-600 dark:text-purple-400 mt-1">
                  {conversionProgress.progressStage || "Processing..."}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Conversion Complete Banner */}
        {content.mode === "podcast" && conversionProgress && conversionProgress.status === "completed" && (
          <div
            onClick={() => setLocation(`/content/${conversionProgress.id}`)}
            className="mb-6 rounded-card border-2 border-green-200 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-950/30 dark:to-emerald-950/30 dark:border-green-800 p-4 cursor-pointer hover:shadow-md transition-shadow"
          >
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center">
                <Check className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <span className="text-sm font-semibold text-green-900 dark:text-green-100">
                  Film version ready!
                </span>
                <p className="text-xs text-green-600 dark:text-green-400">
                  Click to view your film
                </p>
              </div>
              <ExternalLink className="h-4 w-4 text-green-600" />
            </div>
          </div>
        )}

        {/* Linked Versions */}
        {linkedVersions && linkedVersions.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-semibold text-muted-foreground mb-3 uppercase tracking-wide">Other Versions</h3>
            <div className="flex gap-3 flex-wrap">
              {linkedVersions.map((version) => (
                <div
                  key={version.id}
                  onClick={() => setLocation(`/content/${version.id}`)}
                  className="flex items-center gap-3 px-4 py-3 rounded-card border-2 bg-card hover:shadow-md hover:border-primary/30 transition-all cursor-pointer min-w-[200px]"
                >
                  <div className={`h-10 w-10 rounded-full flex items-center justify-center ${
                    version.mode === "podcast"
                      ? "bg-blue-100 dark:bg-blue-900"
                      : "bg-purple-100 dark:bg-purple-900"
                  }`}>
                    {version.mode === "podcast" ? (
                      <Headphones className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                    ) : (
                      <Film className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {version.mode === "podcast" ? "Podcast" : "Film"} Version
                    </p>
                    <div className="flex items-center gap-1.5">
                      {version.status === "completed" ? (
                        <Badge variant="outline" className="text-xs bg-green-50 text-green-700 dark:bg-green-950 dark:text-green-400 border-green-200">
                          Ready
                        </Badge>
                      ) : version.status === "generating" ? (
                        <Badge variant="outline" className="text-xs bg-yellow-50 text-yellow-700 dark:bg-yellow-950 dark:text-yellow-400 border-yellow-200">
                          <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                          {version.progress}%
                        </Badge>
                      ) : version.status === "failed" ? (
                        <Badge variant="outline" className="text-xs bg-red-50 text-red-700 dark:bg-red-950 dark:text-red-400 border-red-200">
                          Failed
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs">
                          {version.status}
                        </Badge>
                      )}
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-muted-foreground" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tabs */}
        <Tabs id="content-practice-tabs" value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="w-full bg-transparent border-b border-gray-200 rounded-none p-0 h-auto">
            <TabsTrigger value="transcript" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:text-purple-600 data-[state=active]:shadow-none bg-transparent px-6 py-3 font-semibold">
              Transcript
            </TabsTrigger>
            <TabsTrigger value="vocabulary" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:text-purple-600 data-[state=active]:shadow-none bg-transparent px-6 py-3 font-semibold">
              Vocabulary
            </TabsTrigger>
            <TabsTrigger value="quiz" className="rounded-none border-b-2 border-transparent data-[state=active]:border-purple-600 data-[state=active]:text-purple-600 data-[state=active]:shadow-none bg-transparent px-6 py-3 font-semibold">
              Quiz
            </TabsTrigger>
          </TabsList>

          <TabsContent value="transcript" className="mt-4">
            <Card className="rounded-2xl shadow-sm border border-gray-100 bg-white text-gray-900 dark:bg-white dark:text-gray-900">
              <CardContent className="pt-6">
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
            <Card className="rounded-2xl shadow-sm border border-gray-100 bg-white text-gray-900 dark:bg-white dark:text-gray-900">
              <CardContent className="pt-6">
                {vocabularyWords.length > 0 ? (
                  <VocabularyTable
                    words={vocabularyWordList}
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
      </div>

      {/* Fixed Bottom Action Bar */}
      <div className={`fixed bottom-0 left-0 right-0 z-40 transition-transform duration-300 ease-in-out ${isBottomBarMinimized ? 'translate-y-full' : 'translate-y-0'}`}>
        {/* Minimize toggle button - sits above the bar */}
        <div className="flex justify-center">
          <button
            onClick={() => setIsBottomBarMinimized(true)}
            aria-label="Minimize action bar"
            className="relative -mb-px bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border border-b-0 border-gray-200/50 dark:border-gray-700/50 rounded-t-xl px-4 py-1.5 text-gray-400 hover:text-purple-600 transition-colors duration-200 shadow-sm"
          >
            <ChevronDown className="h-4 w-4" />
          </button>
        </div>
        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-t border-gray-200/50 dark:border-gray-700/50 shadow-2xl">
          <div className="w-full px-4 sm:px-8 py-4 flex items-center justify-evenly gap-3">

            {/* Convert to Film */}
            {content.mode === "podcast" && content.status === "completed" && (
              <div className="group relative">
                <Button
                  onClick={() => setShowConvertToFilm(true)}
                  disabled={convertToFilmMutation.isPending}
                  aria-label="Convert this story to a film"
                  className="flex items-center gap-2 rounded-full border-2 border-purple-300/60 bg-gradient-to-br from-purple-50 to-white text-purple-700 hover:bg-purple-100 hover:border-purple-400 hover:shadow-lg active:shadow-inner disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 h-12 px-5 text-sm font-semibold"
                >
                  {convertToFilmMutation.isPending ? (
                    <><Loader2 className="h-4 w-4 animate-spin" /></>
                  ) : (
                    <><Clapperboard className="h-4 w-4" /></>
                  )}
                  <span className="hidden sm:inline">Convert to Film</span>
                </Button>
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-50">
                  Convert this story to a video
                </div>
              </div>
            )}

            {/* Regenerate */}
            <div className="group relative">
              <Button
                onClick={() => regenerateStoryMutation.mutate({ contentId: content.id })}
                disabled={regenerateStoryMutation.isPending}
                aria-label="Regenerate this story"
                className="flex items-center gap-2 rounded-full border-2 border-purple-300/60 bg-gradient-to-br from-purple-50 to-white text-purple-700 hover:bg-purple-100 hover:border-purple-400 hover:shadow-lg active:shadow-inner disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 h-12 px-5 text-sm font-semibold"
              >
                {regenerateStoryMutation.isPending ? (
                  <><Loader2 className="h-4 w-4 animate-spin" /></>
                ) : (
                  <><RefreshCw className="h-4 w-4" /></>
                )}
                <span className="hidden sm:inline">Regenerate</span>
              </Button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-50">
                Generate a new version of this story
              </div>
            </div>

            {/* Create New - Primary */}
            <div className="group relative">
              <Button
                onClick={() => setLocation("/create")}
                aria-label="Create a new story"
                className="flex items-center gap-2 rounded-full bg-gradient-to-r from-teal-500 via-cyan-500 to-blue-500 text-white hover:shadow-2xl hover:shadow-teal-500/40 hover:scale-110 active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 border-0 h-12 px-7 text-sm font-bold relative overflow-hidden"
              >
                <span className="absolute inset-0 bg-white/20 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"></span>
                <Sparkles className="h-5 w-5 relative z-10" />
                <span className="hidden sm:inline relative z-10">Create New</span>
              </Button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-50">
                Start creating a new story
              </div>
            </div>

            {/* Practice Words */}
            <div className="group relative">
              <Button
                onClick={handlePracticeWords}
                aria-label="Practice vocabulary from this story"
                className="flex items-center gap-2 rounded-full border-2 border-purple-300/60 bg-gradient-to-br from-purple-50 to-white text-purple-700 hover:bg-purple-100 hover:border-purple-400 hover:shadow-lg active:shadow-inner disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 h-12 px-5 text-sm font-semibold"
              >
                <BookOpen className="h-4 w-4" />
                <span className="hidden sm:inline">Practice Words</span>
              </Button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-50">
                Practice vocabulary from this story
              </div>
            </div>

            {/* Share Button */}
            <div className="group relative">
              <Button
                onClick={handleShare}
                disabled={updateVisibilityMutation.isPending}
                aria-label="Share this story"
                className="flex items-center gap-2 rounded-full border-2 border-purple-300/60 bg-gradient-to-br from-purple-50 to-white text-purple-700 hover:bg-purple-100 hover:border-purple-400 hover:shadow-lg active:shadow-inner disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 h-12 px-5 text-sm font-semibold"
              >
                {updateVisibilityMutation.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Share2 className="h-4 w-4" />
                )}
                <span className="hidden sm:inline">Share</span>
              </Button>
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block bg-gray-900 text-white text-xs rounded-lg px-3 py-2 whitespace-nowrap z-50">
                Share this story
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Subtle restore arrow when bar is minimized */}
      {isBottomBarMinimized && (
        <button
          onClick={() => setIsBottomBarMinimized(false)}
          aria-label="Show action bar"
          className="fixed bottom-0 left-1/2 -translate-x-1/2 z-40 px-6 py-1 rounded-t-xl bg-gray-200/40 dark:bg-gray-700/40 backdrop-blur-sm text-gray-400/70 hover:text-purple-500 hover:bg-gray-200/60 dark:hover:bg-gray-700/60 transition-all duration-200"
        >
          <ChevronUp className="h-4 w-4" />
        </button>
      )}

      {/* Convert to Film Modal */}
      <Dialog open={showConvertToFilm} onOpenChange={setShowConvertToFilm}>
        <DialogContent className="sm:max-w-[480px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Clapperboard className="h-5 w-5 text-purple-600" />
              Convert to Film
            </DialogTitle>
            <DialogDescription>
              Create a film version of this podcast using the same story. The AI will generate video clips to bring your story to life.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Cinematic Style</Label>
              <Select value={convertCinematicStyle} onValueChange={setConvertCinematicStyle}>
                <SelectTrigger>
                  <SelectValue placeholder="Select style" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cinematic">Cinematic</SelectItem>
                  <SelectItem value="anime">Anime</SelectItem>
                  <SelectItem value="cartoon">Cartoon</SelectItem>
                  <SelectItem value="realistic">Realistic</SelectItem>
                  <SelectItem value="watercolor">Watercolor</SelectItem>
                  <SelectItem value="noir">Film Noir</SelectItem>
                  <SelectItem value="retro">Retro</SelectItem>
                  <SelectItem value="fantasy">Fantasy</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Film Duration</Label>
              <div className="grid grid-cols-3 gap-2">
                {[30, 60, 90].map((seconds) => (
                  <Button
                    key={seconds}
                    type="button"
                    variant={convertVideoDuration === seconds ? "default" : "outline"}
                    onClick={() => setConvertVideoDuration(seconds)}
                    className="rounded-full"
                  >
                    {seconds}s
                  </Button>
                ))}
              </div>
              <p className="text-xs text-muted-foreground">
                The film will condense your podcast into a shorter visual version so generation stays manageable.
              </p>
            </div>
            <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-muted-foreground">
              Story narration will reuse the podcast voice when available, or fall back to the default film narrator.
            </div>
            <div className="space-y-2">
              <Label>Background Music</Label>
              <Select value={convertBackgroundMusic} onValueChange={setConvertBackgroundMusic}>
                <SelectTrigger>
                  <SelectValue placeholder="Select music" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Music</SelectItem>
                  <SelectItem value="calm">Calm</SelectItem>
                  <SelectItem value="upbeat">Upbeat</SelectItem>
                  <SelectItem value="dramatic">Dramatic</SelectItem>
                  <SelectItem value="adventure">Adventure</SelectItem>
                  <SelectItem value="romantic">Romantic</SelectItem>
                  <SelectItem value="mysterious">Mysterious</SelectItem>
                  <SelectItem value="comedic">Comedic</SelectItem>
                  <SelectItem value="peaceful">Peaceful</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConvertToFilm(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (!content) return;
                convertToFilmMutation.mutate({
                  contentId: content.id,
                  cinematicStyle: convertCinematicStyle,
                  targetVideoDuration: convertVideoDuration,
                  backgroundMusic: convertBackgroundMusic as any,
                });
              }}
              disabled={convertToFilmMutation.isPending}
              className="gradient-primary text-white border-0"
            >
              {convertToFilmMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Starting...
                </>
              ) : (
                <>
                  <Film className="mr-2 h-4 w-4" />
                  Start Conversion
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Share Story Modal */}
      {content && (
        <ShareStoryModal
          open={showShareModal}
          onOpenChange={setShowShareModal}
          storyId={content.id}
          storyTitle={content.title || "My Story"}
          storyText={safeString(content.storyText)}
          titleTranslation={content.titleTranslation || undefined}
          lineTranslations={content.lineTranslations as any}
          language={content.targetLanguage}
          wordsLearned={vocabularyWordList.length}
          thumbnailUrl={content.thumbnailUrl || undefined}
          genre={content.theme || undefined}
          cefrLevel={content.difficultyLevel || undefined}
        />
      )}

      {/* Feature Gate Paywalls */}
      <PaywallModal
        open={showSpeedGatePaywall}
        onOpenChange={setShowSpeedGatePaywall}
        trigger="audio_speed"
        headline="unlock_speed_control"
        skipToStep2
      />
      <PaywallModal
        open={showDownloadGatePaywall}
        onOpenChange={setShowDownloadGatePaywall}
        trigger="offline_download"
        headline="unlock_offline"
        skipToStep2
      />
    </div>
  );
}
