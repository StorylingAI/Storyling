import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect, useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Loader2, Play, Heart, Clock, BookOpen, Sparkles, RefreshCw, Search, X, Filter, Folder, CheckSquare, Square, Plus, Palette, GraduationCap, ArrowLeft, Mic, Film, Download, Globe, Settings2, ChevronDown, FolderPlus, FolderHeart, ArrowUpDown, Check, HelpCircle } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { APP_TITLE, APP_LOGO } from "@/const";
import { toast } from "sonner";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import Breadcrumb from "@/components/Breadcrumb";
import { LibraryOnboardingTutorial } from "@/components/LibraryOnboardingTutorial";
import { ProgressMilestoneCard } from "@/components/upgrade/ProgressMilestoneCard";
import { MobileNav } from "@/components/MobileNav";
import { PullToRefresh } from "@/components/PullToRefresh";

export default function Library() {
  useScrollToTop();
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [showLibraryTutorial, setShowLibraryTutorial] = useState(false);
  const [hasSeenLibraryTutorial, setHasSeenLibraryTutorial] = useState(() => {
    return localStorage.getItem('libraryTutorialSeen') === 'true';
  });

  // Show library tutorial for first-time users
  useEffect(() => {
    if (user && isAuthenticated && !hasSeenLibraryTutorial) {
      const timer = setTimeout(() => {
        setShowLibraryTutorial(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, isAuthenticated, hasSeenLibraryTutorial]);

  const handleLibraryTutorialComplete = () => {
    setShowLibraryTutorial(false);
    localStorage.setItem('libraryTutorialSeen', 'true');
    setHasSeenLibraryTutorial(true);
  };

  const { data: library, isLoading } = trpc.content.getLibrary.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Debug logging
  useEffect(() => {
    if (library && library.length > 0) {
      console.log('[Library] First story:', library[0]);
      console.log('[Library] First story title:', library[0].title);
      console.log('[Library] First story storyText length:', library[0].storyText?.length || 0);
    }
  }, [library]);

  const { data: favorites } = trpc.content.getFavorites.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: allProgress } = trpc.storyProgress.getAllProgress.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  // Upgrade Trigger #5: Progress milestone tracking
  const completedStoriesCount = allProgress?.filter(p => p.completed).length ?? 0;
  const MILESTONE_THRESHOLD = 3;
  const [milestoneCardDismissed, setMilestoneCardDismissed] = useState(() => {
    return localStorage.getItem('storyling_milestone_card_dismissed') === 'true';
  });
  const showMilestoneCard = 
    user?.subscriptionTier === 'free' && 
    completedStoriesCount >= MILESTONE_THRESHOLD && 
    !milestoneCardDismissed;
  const handleDismissMilestone = () => {
    setMilestoneCardDismissed(true);
    localStorage.setItem('storyling_milestone_card_dismissed', 'true');
  };

  const favoriteIds = new Set(favorites?.map((f) => f.contentId) || []);
  
  // Create a map of contentId -> progress data for quick lookup
  const progressMap = useMemo(() => {
    const map = new Map();
    if (allProgress) {
      allProgress.forEach((progress) => {
        map.set(progress.contentId, progress);
      });
    }
    return map;
  }, [allProgress]);

  const regenerateThumbnailMutation = trpc.content.regenerateThumbnail.useMutation({
    onSuccess: () => {
      // Invalidate library query to refetch with new thumbnail
      utils.content.getLibrary.invalidate();
    },
  });

  const retryMutation = trpc.retry.retryStory.useMutation({
    onSuccess: () => {
      toast.success("Story generation retried successfully!");
      utils.content.getLibrary.invalidate();
    },
    onError: (error) => {
      toast.error(`Retry failed: ${error.message}`);
    },
  });

  const retryAllFailedMutation = trpc.retry.autoRetryFailed.useMutation({
    onSuccess: (data) => {
      const message = data.failed > 0
        ? `Retried ${data.retried} ${data.retried === 1 ? 'story' : 'stories'}. ${data.failed} failed.`
        : `Successfully retried ${data.retried} ${data.retried === 1 ? 'story' : 'stories'}!`;
      toast.success(message);
      utils.content.getLibrary.invalidate();
    },
    onError: (error) => {
      toast.error(`Bulk retry failed: ${error.message}`);
    },
  });

  const { data: retryableStories } = trpc.retry.getRetryableStories.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const bulkAddMutation = trpc.collections.bulkAddToCollection.useMutation({
    onSuccess: (data) => {
      // Invalidate collections query to update counts
      utils.collections.getMyCollections.invalidate();
      
      // Show success toast
      const message = data.skipped > 0 
        ? `Added ${data.added} ${data.added === 1 ? 'story' : 'stories'}. ${data.skipped} already in collection.`
        : `Added ${data.added} ${data.added === 1 ? 'story' : 'stories'} to collection!`;
      
      // Simple toast notification (you can replace with a proper toast library)
      alert(message);
      
      // Exit multi-select mode and close modal
      exitMultiSelectMode();
      setIsCollectionPickerOpen(false);
    },
    onError: (error) => {
      alert(`Error: ${error.message}`);
    },
  });

  // Quick-add to collection mutation
  const quickAddMutation = trpc.collections.addToCollection.useMutation({
    onSuccess: () => {
      utils.collections.getMyCollections.invalidate();
      toast.success('Added to collection!');
    },
    onError: (error) => {
      toast.error(`Error: ${error.message}`);
    },
  });

  // State for quick-add collection picker
  const [quickAddStoryId, setQuickAddStoryId] = useState<number | null>(null);

  const bulkRegenerateThumbnailsMutation = trpc.content.bulkRegenerateThumbnails.useMutation({
    onSuccess: (data) => {
      // Invalidate library query to refetch with new thumbnails
      utils.content.getLibrary.invalidate();
      
      // Show success toast
      const message = data.failureCount > 0
        ? `Updated ${data.successCount} ${data.successCount === 1 ? 'thumbnail' : 'thumbnails'}. ${data.failureCount} failed.`
        : `Successfully updated ${data.successCount} ${data.successCount === 1 ? 'thumbnail' : 'thumbnails'}!`;
      
      toast.success(message);
      
      // Exit multi-select mode
      exitMultiSelectMode();
    },
    onError: (error) => {
      toast.error(`Bulk update failed: ${error.message}`);
    },
  });

  const regenerateAllToPixarMutation = trpc.content.regenerateAllToPixar.useMutation({
    onSuccess: (data) => {
      toast.success(data.message || `Regenerating ${data.total} story covers in Pixar style!`);
      // Invalidate after a delay to pick up the first few regenerated covers
      setTimeout(() => {
        utils.content.getLibrary.invalidate();
      }, 15000);
    },
    onError: (error) => {
      toast.error(`Failed to start cover regeneration: ${error.message}`);
    },
  });

  const bulkDeleteMutation = trpc.content.bulkDelete.useMutation({
    onSuccess: (data) => {
      utils.content.getLibrary.invalidate();
      toast.success(`Deleted ${data.deletedCount} ${data.deletedCount === 1 ? 'story' : 'stories'}!`);
      exitMultiSelectMode();
    },
    onError: (error) => {
      toast.error(`Bulk delete failed: ${error.message}`);
    },
  });

  const bulkMarkCompleteMutation = trpc.content.bulkMarkComplete.useMutation({
    onSuccess: (data) => {
      utils.storyProgress.getAllProgress.invalidate();
      toast.success(`Marked ${data.markedCount} ${data.markedCount === 1 ? 'story' : 'stories'} as complete!`);
      exitMultiSelectMode();
    },
    onError: (error) => {
      toast.error(`Bulk mark complete failed: ${error.message}`);
    },
  });

  const batchDownloadMutation = trpc.download.batchDownload.useMutation({
    onSuccess: (data) => {
      // Decode base64 and trigger download
      const binaryString = atob(data.content);
      const bytes = new Uint8Array(binaryString.length);
      for (let i = 0; i < binaryString.length; i++) {
        bytes[i] = binaryString.charCodeAt(i);
      }
      const blob = new Blob([bytes], { type: data.mimeType });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = data.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      toast.success(`Downloaded ${data.storiesCount} ${data.storiesCount === 1 ? 'story' : 'stories'} (${data.filesCount} files)!`);
      exitMultiSelectMode();
    },
    onError: (error) => {
      toast.error(`Batch download failed: ${error.message}`);
    },
  });

  const handleBulkExport = () => {
    if (!filteredLibrary) return;
    
    const selectedStories = filteredLibrary.filter(story => selectedStoryIds.has(story.id));
    
    // Create CSV content
    const headers = ['Title', 'Language', 'Theme', 'Difficulty', 'Mode', 'Created At', 'Status'];
    const rows = selectedStories.map(story => [
      story.title || 'Untitled',
      story.targetLanguage || '',
      story.theme || '',
      story.difficultyLevel || '',
      story.mode || '',
      new Date(story.generatedAt).toLocaleDateString(),
      story.status || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `storylingai_export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success(`Exported ${selectedStories.length} ${selectedStories.length === 1 ? 'story' : 'stories'}!`);
  };

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTheme, setSelectedTheme] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [sortBy, setSortBy] = useState<"newest" | "oldest" | "title" | "progress" | "playCount">("newest");
  const [progressFilter, setProgressFilter] = useState<"all" | "continue" | "completed" | "not_started">("all");
  const [modeFilter, setModeFilter] = useState<"all" | "podcast" | "film">("all");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Multi-select state
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedStoryIds, setSelectedStoryIds] = useState<Set<number>>(new Set());
  const [isCollectionPickerOpen, setIsCollectionPickerOpen] = useState(false);

  const handlePullRefresh = async () => {
    await Promise.all([
      utils.content.getLibrary.invalidate(),
      utils.content.getFavorites.invalidate(),
      utils.storyProgress.getAllProgress.invalidate(),
      utils.retry.getRetryableStories.invalidate(),
      utils.collections.getMyCollections.invalidate(),
    ]);
  };

  const { data: collections } = trpc.collections.getMyCollections.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const toggleStorySelection = (storyId: number) => {
    setSelectedStoryIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(storyId)) {
        newSet.delete(storyId);
      } else {
        newSet.add(storyId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    if (!filteredLibrary) return;
    setSelectedStoryIds(new Set(filteredLibrary.map(story => story.id)));
  };

  const clearSelection = () => {
    setSelectedStoryIds(new Set());
  };

  const exitMultiSelectMode = () => {
    setIsMultiSelectMode(false);
    clearSelection();
  };

  // Get unique themes and languages from library
  const themes = useMemo(() => {
    if (!library) return [];
    return Array.from(new Set(library.map(c => c.theme)));
  }, [library]);

  const languages = useMemo(() => {
    if (!library) return [];
    return Array.from(new Set(library.map(c => c.targetLanguage).filter(Boolean)));
  }, [library]);

  const difficulties = useMemo(() => {
    const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
    if (!library) return levelOrder;
    const unique = Array.from(new Set(library.map(c => c.difficultyLevel).filter((d): d is string => Boolean(d))));
    const allLevels = Array.from(new Set([...unique, ...levelOrder]));
    return allLevels.sort((a, b) => {
      const idxA = levelOrder.indexOf(a);
      const idxB = levelOrder.indexOf(b);
      if (idxA === -1 && idxB === -1) return a.localeCompare(b);
      if (idxA === -1) return 1;
      if (idxB === -1) return 1;
      return idxA - idxB;
    });
  }, [library]);

  // Filter and sort library
  const filteredLibrary = useMemo(() => {
    if (!library) return [];
    
    let filtered = library;

    // Search by title
    if (searchQuery) {
      filtered = filtered.filter(content => {
        const title = content.title || content.storyText?.substring(0, 60) || `${content.theme} Story`;
        return title.toLowerCase().includes(searchQuery.toLowerCase());
      });
    }

    // Filter by theme
    if (selectedTheme) {
      filtered = filtered.filter(content => content.theme === selectedTheme);
    }

    // Filter by language
    if (selectedLanguage) {
      filtered = filtered.filter(content => content.targetLanguage === selectedLanguage);
    }

    // Filter by difficulty
    if (selectedDifficulty) {
      filtered = filtered.filter(content => content.difficultyLevel === selectedDifficulty);
    }

    // Filter by mode (podcast/film)
    if (modeFilter !== "all") {
      filtered = filtered.filter(content => content.mode === modeFilter);
    }

    // Filter by progress
    if (progressFilter !== "all") {
      filtered = filtered.filter(content => {
        const progress = progressMap.get(content.id);
        
        if (progressFilter === "continue") {
          // Has progress but not completed (currentTime > 0 and < totalDuration)
          return progress && progress.currentTime > 0 && progress.currentTime < progress.totalDuration;
        } else if (progressFilter === "completed") {
          // Completed (currentTime >= totalDuration)
          return progress && progress.currentTime >= progress.totalDuration;
        } else if (progressFilter === "not_started") {
          // No progress or currentTime = 0
          return !progress || progress.currentTime === 0;
        }
        return true;
      });
    }

    // Sort
    filtered = [...filtered].sort((a, b) => {
      if (sortBy === "newest" || sortBy === "oldest") {
        const dateA = new Date(a.generatedAt).getTime();
        const dateB = new Date(b.generatedAt).getTime();
        return sortBy === "newest" ? dateB - dateA : dateA - dateB;
      } else if (sortBy === "title") {
        const titleA = (a.title || a.storyText?.substring(0, 60) || `${a.theme} Story`).toLowerCase();
        const titleB = (b.title || b.storyText?.substring(0, 60) || `${b.theme} Story`).toLowerCase();
        return titleA.localeCompare(titleB);
      } else if (sortBy === "progress") {
        const progressA = progressMap.get(a.id);
        const progressB = progressMap.get(b.id);
        const percentA = progressA ? (progressA.currentTime / progressA.totalDuration) * 100 : 0;
        const percentB = progressB ? (progressB.currentTime / progressB.totalDuration) * 100 : 0;
        return percentB - percentA; // Higher progress first
      } else if (sortBy === "playCount") {
        const progressA = progressMap.get(a.id);
        const progressB = progressMap.get(b.id);
        const playCountA = progressA?.playCount || 0;
        const playCountB = progressB?.playCount || 0;
        return playCountB - playCountA; // Higher play count first
      }
      return 0;
    });

    return filtered;
  }, [library, searchQuery, selectedTheme, selectedLanguage, selectedDifficulty, sortBy, progressFilter, modeFilter, progressMap]);

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("");
    setSelectedTheme(null);
    setSelectedLanguage(null);
    setSelectedDifficulty(null);
    setSortBy("newest");
    setProgressFilter("all");
    setModeFilter("all");
  };

  const hasActiveFilters = searchQuery || selectedTheme || selectedLanguage || selectedDifficulty || sortBy !== "newest" || progressFilter !== "all" || modeFilter !== "all";

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-magical flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-2xl shadow-magical border-0 overflow-hidden">
          <div className="h-2 gradient-primary" />
          <CardContent className="pt-8 pb-8 text-center space-y-4">
            <img src="/flip-mascot.png" alt="Flip" className="w-24 h-24 mx-auto animate-float" />
            <h3 className="text-xl font-bold text-gray-900">Sign in to continue</h3>
            <p className="text-gray-500">Please sign in to view your library</p>
            <Button 
              onClick={() => setLocation("/create")}
              className="rounded-full gradient-primary text-white hover-lift active-scale border-0 transition-all shadow-playful"
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
      <div className="min-h-screen bg-magical flex flex-col items-center justify-center gap-4">
        <img src="/flip-mascot.png" alt="Loading" className="w-24 h-24 animate-float" />
        <div className="loading-fun" />
        <p className="text-gray-500">Loading your library...</p>
      </div>
    );
  }

    return (
    <>
    <PullToRefresh onRefresh={handlePullRefresh} className="min-h-screen bg-magical">
      {/* Mobile hamburger nav */}
      <MobileNav title="My Library" backPath="/app" gradient darkBg={false} />

      <section className="container py-12">
        <Breadcrumb items={[
          { label: "Dashboard", href: "/app" },
          { label: "Library" }
        ]} showHome={false} />
        
        <div className="mb-6 sm:mb-8 animate-bounce-in">
          <div className="flex items-start sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl sm:text-4xl font-bold mb-1 sm:mb-2 text-gray-900" style={{ fontFamily: 'Fredoka, sans-serif' }}>My Library</h2>
              <p className="text-sm sm:text-lg text-gray-500">
                Your personalized language learning content
              </p>
            </div>

          </div>
        </div>

        {/* Search and Filters */}
        {library && library.length > 0 && (
          <div className="mb-6 sm:mb-8 space-y-3 animate-slide-up">
            {/* Search bar */}
            <div className="flex gap-2 items-center" data-tutorial="search-filter">
              <div className="relative flex-1">
                <Search className="absolute left-3 sm:left-4 top-1/2 -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder="Search stories..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9 sm:pl-12 pr-9 sm:pr-12 rounded-full h-10 sm:h-12 text-sm sm:text-base shadow-sm border-2 border-gray-200 focus:border-purple-300 transition-all bg-white"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 sm:right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-gray-100"
                  >
                    <X className="h-4 w-4 sm:h-5 sm:w-5" />
                  </button>
                )}
              </div>
            </div>

            {/* Content tabs + Filter/Sort/Select row */}
            <div className="flex gap-1.5 sm:gap-2 items-center flex-wrap" data-tutorial="content-tabs">
              {/* Content type tabs */}
              <Button
                variant={modeFilter === "all" ? "default" : "outline"}
                size="sm"
                onClick={() => setModeFilter("all")}
                className="rounded-full h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm font-medium hover-lift active-scale transition-all shrink-0"
              >
                All
              </Button>
              <Button
                variant={modeFilter === "podcast" ? "default" : "outline"}
                size="sm"
                onClick={() => setModeFilter("podcast")}
                className="rounded-full h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm font-medium hover-lift active-scale transition-all shrink-0"
              >
                <Mic className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                Podcasts
              </Button>
              <Button
                variant={modeFilter === "film" ? "default" : "outline"}
                size="sm"
                onClick={() => setModeFilter("film")}
                className="rounded-full h-8 sm:h-9 px-3 sm:px-4 text-xs sm:text-sm font-medium hover-lift active-scale transition-all shrink-0"
              >
                <Film className="h-3.5 w-3.5 sm:h-4 sm:w-4 mr-1 sm:mr-1.5" />
                Films
              </Button>

              {/* Spacer */}
              <div className="flex-1" />

              {/* Filters dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`rounded-full h-8 sm:h-9 px-2.5 sm:px-3.5 text-xs sm:text-sm transition-all shrink-0 gap-1.5 ${
                      (selectedTheme || selectedLanguage || selectedDifficulty || progressFilter !== "all")
                        ? 'border-purple-400 bg-purple-50 text-purple-700 font-medium'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <Filter className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">Filters</span>
                    {(selectedTheme || selectedLanguage || selectedDifficulty || progressFilter !== "all") && (
                      <span className="inline-flex items-center justify-center w-4 h-4 sm:w-5 sm:h-5 text-[10px] sm:text-xs font-bold bg-purple-600 text-white rounded-full">
                        {[selectedTheme, selectedLanguage, selectedDifficulty, progressFilter !== "all" ? progressFilter : null].filter(Boolean).length}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  {/* Theme sub-menu */}
                  {themes.length > 0 && (
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="gap-2">
                        <Palette className="h-4 w-4 text-purple-500" />
                        <span>Theme</span>
                        {selectedTheme && (
                          <span className="ml-auto text-xs text-purple-600 font-medium truncate max-w-[80px]">{selectedTheme}</span>
                        )}
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent className="max-h-[300px] overflow-y-auto">
                        <DropdownMenuItem onClick={() => setSelectedTheme(null)} className="gap-2">
                          {!selectedTheme && <Check className="h-3.5 w-3.5 text-purple-600" />}
                          <span className={!selectedTheme ? 'font-medium' : ''}>All Themes</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {themes.map(theme => (
                          <DropdownMenuItem
                            key={theme}
                            onClick={() => setSelectedTheme(theme)}
                            className="gap-2"
                          >
                            {selectedTheme === theme && <Check className="h-3.5 w-3.5 text-purple-600" />}
                            <span className={selectedTheme === theme ? 'font-medium' : ''}>{theme}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  )}

                  {/* Language sub-menu */}
                  {languages.length > 0 && (
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="gap-2">
                        <Globe className="h-4 w-4 text-teal-500" />
                        <span>Language</span>
                        {selectedLanguage && (
                          <span className="ml-auto text-xs text-teal-600 font-medium truncate max-w-[80px]">{selectedLanguage}</span>
                        )}
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => setSelectedLanguage(null)} className="gap-2">
                          {!selectedLanguage && <Check className="h-3.5 w-3.5 text-teal-600" />}
                          <span className={!selectedLanguage ? 'font-medium' : ''}>All Languages</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {languages.map(lang => (
                          <DropdownMenuItem
                            key={lang}
                            onClick={() => setSelectedLanguage(lang)}
                            className="gap-2"
                          >
                            {selectedLanguage === lang && <Check className="h-3.5 w-3.5 text-teal-600" />}
                            <span className={selectedLanguage === lang ? 'font-medium' : ''}>{lang}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  )}

                  {/* Difficulty sub-menu */}
                  {difficulties.length > 0 && (
                    <DropdownMenuSub>
                      <DropdownMenuSubTrigger className="gap-2">
                        <GraduationCap className="h-4 w-4 text-pink-500" />
                        <span>Difficulty</span>
                        {selectedDifficulty && (
                          <span className="ml-auto text-xs text-pink-600 font-medium truncate max-w-[80px]">{selectedDifficulty}</span>
                        )}
                      </DropdownMenuSubTrigger>
                      <DropdownMenuSubContent>
                        <DropdownMenuItem onClick={() => setSelectedDifficulty(null)} className="gap-2">
                          {!selectedDifficulty && <Check className="h-3.5 w-3.5 text-pink-600" />}
                          <span className={!selectedDifficulty ? 'font-medium' : ''}>All Levels</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        {difficulties.map(difficulty => (
                          <DropdownMenuItem
                            key={difficulty}
                            onClick={() => setSelectedDifficulty(difficulty)}
                            className="gap-2"
                          >
                            {selectedDifficulty === difficulty && <Check className="h-3.5 w-3.5 text-pink-600" />}
                            <span className={selectedDifficulty === difficulty ? 'font-medium' : ''}>{difficulty}</span>
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuSubContent>
                    </DropdownMenuSub>
                  )}

                  {/* Progress sub-menu */}
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger className="gap-2">
                      <BookOpen className="h-4 w-4 text-blue-500" />
                      <span>Progress</span>
                      {progressFilter !== "all" && (
                        <span className="ml-auto text-xs text-blue-600 font-medium">
                          {progressFilter === "continue" ? "In Progress" : progressFilter === "completed" ? "Done" : "New"}
                        </span>
                      )}
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      <DropdownMenuItem onClick={() => setProgressFilter("all")} className="gap-2">
                        {progressFilter === "all" && <Check className="h-3.5 w-3.5 text-blue-600" />}
                        <span className={progressFilter === "all" ? 'font-medium' : ''}>All</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setProgressFilter("not_started")} className="gap-2">
                        {progressFilter === "not_started" && <Check className="h-3.5 w-3.5 text-blue-600" />}
                        <span className={progressFilter === "not_started" ? 'font-medium' : ''}>Not Started</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setProgressFilter("continue")} className="gap-2">
                        {progressFilter === "continue" && <Check className="h-3.5 w-3.5 text-blue-600" />}
                        <span className={progressFilter === "continue" ? 'font-medium' : ''}>In Progress</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => setProgressFilter("completed")} className="gap-2">
                        {progressFilter === "completed" && <Check className="h-3.5 w-3.5 text-blue-600" />}
                        <span className={progressFilter === "completed" ? 'font-medium' : ''}>Completed</span>
                      </DropdownMenuItem>
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>

                  {/* Clear all filters */}
                  {(selectedTheme || selectedLanguage || selectedDifficulty || progressFilter !== "all") && (
                    <>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={clearFilters} className="gap-2 text-red-600 focus:text-red-600">
                        <X className="h-4 w-4" />
                        Clear All Filters
                      </DropdownMenuItem>
                    </>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Sort by dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    className={`rounded-full h-8 sm:h-9 px-2.5 sm:px-3.5 text-xs sm:text-sm transition-all shrink-0 gap-1.5 ${
                      sortBy !== "newest"
                        ? 'border-blue-400 bg-blue-50 text-blue-700 font-medium'
                        : 'border-gray-300 hover:border-gray-400'
                    }`}
                  >
                    <ArrowUpDown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                    <span className="hidden sm:inline">
                      {sortBy === "newest" ? "Sort" : 
                       sortBy === "oldest" ? "Oldest" :
                       sortBy === "title" ? "A-Z" :
                       sortBy === "progress" ? "Progress" : "Plays"}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Sort By</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => setSortBy("newest")} className="gap-2">
                    {sortBy === "newest" && <Check className="h-3.5 w-3.5 text-blue-600" />}
                    <span className={sortBy === "newest" ? 'font-medium' : ''}>Newest First</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("oldest")} className="gap-2">
                    {sortBy === "oldest" && <Check className="h-3.5 w-3.5 text-blue-600" />}
                    <span className={sortBy === "oldest" ? 'font-medium' : ''}>Oldest First</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("title")} className="gap-2">
                    {sortBy === "title" && <Check className="h-3.5 w-3.5 text-blue-600" />}
                    <span className={sortBy === "title" ? 'font-medium' : ''}>Title (A-Z)</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("progress")} className="gap-2">
                    {sortBy === "progress" && <Check className="h-3.5 w-3.5 text-blue-600" />}
                    <span className={sortBy === "progress" ? 'font-medium' : ''}>Progress</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => setSortBy("playCount")} className="gap-2">
                    {sortBy === "playCount" && <Check className="h-3.5 w-3.5 text-blue-600" />}
                    <span className={sortBy === "playCount" ? 'font-medium' : ''}>Play Count</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Select / Cancel button */}
              {!isMultiSelectMode ? (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => setIsMultiSelectMode(true)}
                  className="rounded-full h-8 sm:h-9 px-2.5 sm:px-3.5 text-xs sm:text-sm border-gray-300 hover:border-gray-400 transition-all shrink-0 gap-1.5"
                >
                  <CheckSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Select</span>
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={exitMultiSelectMode}
                  className="rounded-full h-8 sm:h-9 px-2.5 sm:px-3.5 text-xs sm:text-sm border-2 border-red-300 text-red-600 hover:bg-red-50 transition-all shrink-0 gap-1.5"
                >
                  <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline">Cancel</span>
                </Button>
              )}
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="flex items-center gap-2 flex-wrap">
                <div className="text-xs sm:text-sm font-medium text-muted-foreground bg-purple-50 rounded-full px-3 sm:px-4 py-1 sm:py-1.5 inline-flex items-center gap-1.5">
                  Showing <span className="text-purple-700 font-bold">{filteredLibrary.length}</span> of <span className="font-semibold">{library.length}</span> stories
                  <button
                    onClick={clearFilters}
                    className="ml-1 p-0.5 rounded-full hover:bg-purple-200 transition-colors"
                  >
                    <X className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-purple-500" />
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {!library || library.length === 0 ? (
          <Card className="rounded-card shadow-playful-lg border-2 animate-bounce-in">
            <CardContent className="py-16 text-center space-y-6">
              <img src="/storyling-logo.png" alt="Storyling" className="w-32 h-32 mx-auto animate-float" />
              <div>
                <h3 className="text-2xl font-bold mb-2">No content yet</h3>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                  Start creating your first story to begin your learning journey! Flip is excited to help you learn.
                </p>
              </div>
              <Button
                onClick={() => setLocation("/create")}
                className="rounded-button text-white hover-lift hover-glow active-scale border-0 h-12 text-lg px-8 transition-all"
                style={{
                  background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
                  boxShadow: '0 6px 20px -4px rgba(124, 58, 237, 0.5)',
                }}
              >
                <Sparkles className="mr-2 h-5 w-5" />
                Create Your First Story
              </Button>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Empty State - When no stories match filters */}
            {filteredLibrary.length === 0 ? (
              <div className="mb-8 animate-bounce-in">
                <Card className="rounded-card shadow-playful-lg border-2">
                  <CardContent className="py-12 text-center space-y-4">
                    <BookOpen className="w-12 h-12 mx-auto text-muted-foreground" />
                    <div>
                      <h3 className="text-xl font-bold mb-2">
                        {selectedTheme ? `No ${selectedTheme} stories yet` : 
                         selectedLanguage ? `No ${selectedLanguage} stories found` :
                         selectedDifficulty ? `No ${selectedDifficulty} stories yet` :
                         modeFilter === "podcast" ? "No podcasts found" :
                         modeFilter === "film" ? "No films found" :
                         searchQuery ? "No matching stories found" :
                         "No stories found"}
                      </h3>
                      <p className="text-muted-foreground max-w-md mx-auto">
                        {selectedTheme ? `Try creating your first ${selectedTheme} story to get started!` :
                         selectedLanguage ? `Create your first ${selectedLanguage} story or adjust your filters.` :
                         selectedDifficulty ? `Generate a ${selectedDifficulty} story to begin learning at this level.` :
                         modeFilter === "podcast" ? "Create your first podcast or try a different filter." :
                         modeFilter === "film" ? "Create your first film or try a different filter." :
                         searchQuery ? "Try a different search term or clear your filters." :
                         "Try adjusting your search or filters to find what you're looking for."}
                      </p>
                    </div>
                    <div className="flex gap-3 justify-center flex-wrap">
                      {(selectedTheme || selectedLanguage || selectedDifficulty || searchQuery || modeFilter !== "all") && (
                        <Button 
                          onClick={clearFilters}
                          variant="outline"
                          className="rounded-button hover-lift active-scale transition-all"
                        >
                          <X className="mr-2 h-4 w-4" />
                          Clear All Filters
                        </Button>
                      )}
                      <Button 
                        onClick={() => setLocation("/create")}
                        className="rounded-button gradient-primary text-white hover-lift active-scale border-0 transition-all"
                      >
                        <Sparkles className="mr-2 h-4 w-4" />
                        {selectedTheme ? `Create ${selectedTheme} Story` :
                         selectedLanguage ? `Create ${selectedLanguage} Story` :
                         selectedDifficulty ? `Create ${selectedDifficulty} Story` :
                         modeFilter === "podcast" ? "Create Podcast" :
                         modeFilter === "film" ? "Create Film" :
                         "Create New Story"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            {/* Upgrade Trigger #5: Progress Milestone Card */}
            {showMilestoneCard && (
              <div className="mb-6">
                <ProgressMilestoneCard
                  completedCount={completedStoriesCount}
                  onDismiss={handleDismissMilestone}
                />
              </div>
            )}

            {/* Story Grid */}
            {filteredLibrary.length > 0 && (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:gap-6 lg:grid-cols-3" data-tutorial="story-grid">
            {filteredLibrary.map((content) => (
              <Card 
                key={content.id} 
                className={`overflow-hidden rounded-2xl shadow-playful hover-lift transition-all border-0 animate-slide-up flex flex-row sm:flex-col md:flex-col ${
                  isMultiSelectMode ? 'cursor-pointer' : ''
                } ${
                  selectedStoryIds.has(content.id) ? 'ring-4 ring-blue-400 shadow-magical' : ''
                }`}
                style={{ backgroundColor: '#FAF6F0' }}
                onClick={() => isMultiSelectMode && toggleStorySelection(content.id)}
              >
                {/* Thumbnail Image */}
                <div className="relative w-28 h-auto shrink-0 sm:w-full sm:h-48 md:w-full md:h-48 bg-gradient-to-br from-blue-100 via-purple-100 to-teal-100 overflow-hidden group">
                  {/* Checkbox for multi-select mode */}
                  {isMultiSelectMode && (
                    <div className="absolute top-3 left-3 z-10">
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                        selectedStoryIds.has(content.id) 
                          ? 'bg-primary text-white shadow-lg scale-110' 
                          : 'bg-white/90 text-muted-foreground hover:bg-white'
                      }`}>
                        {selectedStoryIds.has(content.id) ? (
                          <CheckSquare className="h-5 w-5" />
                        ) : (
                          <Square className="h-5 w-5" />
                        )}
                      </div>
                    </div>
                  )}
                  {content.thumbnailUrl ? (
                    <>
                      <img 
                        src={content.thumbnailUrl} 
                        alt={content.title || content.theme}
                        className={`w-full h-full object-cover transition-opacity duration-300 ${
                          content.mode === "film" && content.videoUrl ? "group-hover:opacity-0" : ""
                        }`}
                        onError={(e) => {
                          // Fallback to gradient background if image fails to load
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                      {/* Animated preview on hover for film mode */}
                      {content.mode === "film" && content.videoUrl && (
                        <video
                          src={content.videoUrl}
                          className="absolute inset-0 w-full h-full object-cover opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                          muted
                          loop
                          playsInline
                          onMouseEnter={(e) => {
                            e.currentTarget.currentTime = 0;
                            e.currentTarget.play().catch(() => {
                              // Ignore autoplay errors
                            });
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.pause();
                            e.currentTarget.currentTime = 0;
                          }}
                        />
                      )}
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <div className="text-6xl opacity-30">
                        {content.mode === "podcast" ? "🎙️" : "🎬"}
                      </div>
                    </div>
                  )}
                  {/* Progress bar for in-progress videos */}
                  {content.mode === "film" && progressMap.has(content.id) && (() => {
                    const progress = progressMap.get(content.id);
                    const progressPercent = progress.totalDuration > 0 
                      ? Math.round((progress.currentTime / progress.totalDuration) * 100)
                      : 0;
                    
                    return progressPercent > 0 && progressPercent < 100 ? (
                      <div className="absolute bottom-0 left-0 right-0">
                        <div className="h-1.5 bg-black/30">
                          <div 
                            className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                            style={{ width: `${progressPercent}%` }}
                          />
                        </div>
                        <div className="absolute bottom-2 right-2 px-2 py-0.5 bg-black/70 text-white text-xs font-medium rounded">
                          {progressPercent}% complete
                        </div>
                      </div>
                    ) : null;
                  })()}
                  
                  {/* "Continue Watching" badge for in-progress videos */}
                  {content.mode === "film" && progressMap.has(content.id) && (() => {
                    const progress = progressMap.get(content.id);
                    const progressPercent = progress.totalDuration > 0 
                      ? Math.round((progress.currentTime / progress.totalDuration) * 100)
                      : 0;
                    
                    return progressPercent > 0 && progressPercent < 100 ? (
                      <div className="absolute top-3 right-3 z-10">
                        <Badge className="bg-purple-600 text-white shadow-lg">
                          <Play className="h-3 w-3 mr-1" />
                          Continue
                        </Badge>
                      </div>
                    ) : null;
                  })()}
                  
                  {/* Completed checkmark for finished videos */}
                  {content.mode === "film" && progressMap.has(content.id) && progressMap.get(content.id).completed && (
                    <div className="absolute top-3 right-3 z-10">
                      <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                    </div>
                  )}
                  
                  {/* Status badge overlay */}
                  {content.status === "generating" && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-white text-center space-y-2">
                        <Loader2 className="h-8 w-8 animate-spin mx-auto" />
                        <p className="text-sm font-medium">Generating...</p>
                      </div>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0 sm:w-full md:w-full">
                <CardHeader className="p-3 sm:p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <Badge 
                        variant={content.mode === "podcast" ? "default" : "secondary"}
                        className="rounded-full text-[10px] sm:text-xs"
                      >
                        {content.mode === "podcast" ? "🎙️ Podcast" : "🎬 Film"}
                      </Badge>
                      {content.title && content.titleTranslation ? (
                        <div className="mt-2 space-y-1">
                          <CardTitle className="line-clamp-1 sm:line-clamp-2 text-sm sm:text-lg" style={{ color: '#3D2E1F' }}>
                            {content.title}
                          </CardTitle>
                          <p className="text-xs sm:text-sm line-clamp-1" style={{ color: '#8B7355' }}>
                            {content.titleTranslation}
                          </p>
                        </div>
                      ) : (
                        <CardTitle className="mt-2 line-clamp-1 sm:line-clamp-2 text-sm sm:text-lg" style={{ color: '#3D2E1F' }}>
                          {content.title || content.storyText?.substring(0, 60) || `${content.theme} Story`}
                        </CardTitle>
                      )}
                    </div>
                    <div className="hidden sm:flex items-center gap-1">
                      {/* Quick-add to collection button */}
                      {!isMultiSelectMode && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="rounded-full hover-scale active-scale transition-all text-purple-500 hover:text-purple-600"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <Plus className="h-5 w-5" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="w-56">
                            <div className="px-2 py-1.5 text-sm font-semibold">Add to Collection</div>
                            {collections && collections.length > 0 ? (
                              collections.map(collection => (
                                <DropdownMenuItem
                                  key={collection.id}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    quickAddMutation.mutate({
                                      collectionId: collection.id,
                                      contentId: content.id,
                                    });
                                  }}
                                  className="cursor-pointer"
                                >
                                  <Folder className="mr-2 h-4 w-4" style={{ color: collection.color || '#8B5CF6' }} />
                                  {collection.name}
                                </DropdownMenuItem>
                              ))
                            ) : (
                              <div className="px-2 py-4 text-sm text-muted-foreground text-center">
                                No collections yet
                              </div>
                            )}
                            <DropdownMenuItem
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation('/collections');
                              }}
                              className="cursor-pointer border-t mt-1 pt-2"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Create New Collection
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      <Button
                        variant="ghost"
                        size="icon"
                        className={`rounded-full hover-scale active-scale transition-all ${favoriteIds.has(content.id) ? "text-pink-500" : ""}`}
                      >
                        <Heart
                          className="h-5 w-5"
                          fill={favoriteIds.has(content.id) ? "currentColor" : "none"}
                        />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-2 sm:space-y-4 p-3 sm:p-6">
                  <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm" style={{ color: '#9C8B75' }}>
                    <div className="flex items-center gap-1">
                      <Play className="h-4 w-4" />
                      {content.playCount || 0} plays
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {new Date(content.generatedAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1 sm:gap-2">
                    <DifficultyBadge difficultyLevel={content.difficultyLevel} />
                    <Badge variant="outline" className="rounded-full text-[10px] sm:text-xs">{content.theme}</Badge>
                    {content.voiceType && <Badge variant="outline" className="rounded-full text-[10px] sm:text-xs hidden sm:inline-flex">{content.voiceType}</Badge>}
                    {content.cinematicStyle && (
                      <Badge variant="outline" className="rounded-full text-[10px] sm:text-xs hidden sm:inline-flex">{content.cinematicStyle}</Badge>
                    )}
                  </div>

                  {content.status === "generating" && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground p-3 bg-primary/5 rounded-xl">
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Generating content...
                    </div>
                  )}

                  {content.status === "failed" && (
                    <div className="space-y-2">
                      <div className="text-sm text-destructive p-3 bg-destructive/5 rounded-xl">
                        Generation failed - please try again
                      </div>
                      <Button
                        variant="outline"
                        className="w-full rounded-button hover-lift"
                        onClick={() => retryMutation.mutate({ contentId: content.id })}
                        disabled={retryMutation.isPending}
                      >
                        <RefreshCw className="mr-2 h-4 w-4" />
                        Retry Generation
                      </Button>
                    </div>
                  )}

                  {content.status === "completed" && (
                    <div className="space-y-2">
                      <Button
                        className="w-full rounded-full gradient-primary text-white hover-lift border-0 h-9 sm:h-11 shadow-playful text-xs sm:text-sm"
                        onClick={() => setLocation(`/content/${content.id}`)}
                      >
                        <Play className="mr-1 sm:mr-2 h-3 w-3 sm:h-4 sm:w-4" />
                        {content.mode === "podcast" ? "Listen Now" : "Watch Now"}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex w-full rounded-button hover-lift active-scale transition-all"
                            onClick={(e) => e.stopPropagation()}
                            disabled={regenerateThumbnailMutation.isPending}
                          >
                            {regenerateThumbnailMutation.isPending ? (
                              <>
                                <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                                Generating...
                              </>
                            ) : (
                              <>
                                <Palette className="mr-2 h-3 w-3" />
                                Change Thumbnail Style
                              </>
                            )}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-72">
                          <div className="px-2 py-1.5 text-sm font-semibold">Choose Thumbnail Style</div>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              regenerateThumbnailMutation.mutate({ contentId: content.id, style: "realistic" });
                            }}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-3 w-full">
                              <img 
                                src="/style-preview-realistic.png" 
                                alt="Realistic style preview" 
                                className="w-16 h-16 rounded object-cover border border-border"
                              />
                              <div className="flex flex-col flex-1">
                                <span className="font-medium">📸 Realistic</span>
                                <span className="text-xs text-muted-foreground">Photorealistic, cinematic</span>
                              </div>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              regenerateThumbnailMutation.mutate({ contentId: content.id, style: "illustrated" });
                            }}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-3 w-full">
                              <img 
                                src="/style-preview-illustrated.png" 
                                alt="Illustrated style preview" 
                                className="w-16 h-16 rounded object-cover border border-border"
                              />
                              <div className="flex flex-col flex-1">
                                <span className="font-medium">🎨 Illustrated</span>
                                <span className="text-xs text-muted-foreground">Colorful, playful artwork</span>
                              </div>
                            </div>
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={(e) => {
                              e.stopPropagation();
                              regenerateThumbnailMutation.mutate({ contentId: content.id, style: "minimalist" });
                            }}
                            className="cursor-pointer"
                          >
                            <div className="flex items-center gap-3 w-full">
                              <img 
                                src="/style-preview-minimalist.png" 
                                alt="Minimalist style preview" 
                                className="w-16 h-16 rounded object-cover border border-border"
                              />
                              <div className="flex flex-col flex-1">
                                <span className="font-medium">✨ Minimalist</span>
                                <span className="text-xs text-muted-foreground">Clean, simple design</span>
                              </div>
                            </div>
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  )}
                </CardContent>
                </div>
              </Card>
            ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* Bulk Action Bar */}
      {isMultiSelectMode && selectedStoryIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-blue-100/50 shadow-magical z-50 animate-slide-up">
          <div className="container py-3 px-4">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-6">
              <div className="flex items-center gap-3 sm:gap-4 flex-shrink-0">
                <span className="text-sm font-semibold text-gray-700 whitespace-nowrap">
                  {selectedStoryIds.size} {selectedStoryIds.size === 1 ? 'story' : 'stories'} selected
                </span>
                <div className="h-6 w-px bg-gray-200 hidden sm:block" />
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAll}
                  className="text-xs sm:text-sm font-medium text-blue-600 hover:text-blue-700 px-2 sm:px-3 h-8"
                >
                  Select All
                </Button>
              </div>
              <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto justify-end">
                <Button
                  onClick={() => {
                    const contentIds = Array.from(selectedStoryIds);
                    batchDownloadMutation.mutate({ 
                      storyIds: contentIds,
                      includeMetadata: true,
                      includeSubtitles: true,
                    });
                  }}
                  variant="outline"
                  size="sm"
                  className="rounded-lg hover-lift text-xs sm:text-sm font-medium h-9 sm:h-10 px-3 sm:px-4 gap-1.5 sm:gap-2 flex-shrink-0"
                  disabled={batchDownloadMutation.isPending}
                >
                  {batchDownloadMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                  ) : (
                    <Download className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  )}
                  <span className="hidden sm:inline">Download</span>
                </Button>
                <Button
                  onClick={() => {
                    if (confirm(`Are you sure you want to mark ${selectedStoryIds.size} ${selectedStoryIds.size === 1 ? 'story' : 'stories'} as complete?`)) {
                      bulkMarkCompleteMutation.mutate({ contentIds: Array.from(selectedStoryIds) });
                    }
                  }}
                  variant="outline"
                  size="sm"
                  className="rounded-lg hover-lift text-xs sm:text-sm font-medium h-9 sm:h-10 px-3 sm:px-4 gap-1.5 sm:gap-2 flex-shrink-0"
                  disabled={bulkMarkCompleteMutation.isPending}
                >
                  {bulkMarkCompleteMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                  ) : (
                    <CheckSquare className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  )}
                  <span className="hidden sm:inline">Completed</span>
                </Button>
                <Button
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete ${selectedStoryIds.size} ${selectedStoryIds.size === 1 ? 'story' : 'stories'}? This action cannot be undone.`)) {
                      bulkDeleteMutation.mutate({ contentIds: Array.from(selectedStoryIds) });
                    }
                  }}
                  variant="destructive"
                  size="sm"
                  className="rounded-lg hover-lift text-xs sm:text-sm font-medium h-9 sm:h-10 px-3 sm:px-4 gap-1.5 sm:gap-2 flex-shrink-0"
                  disabled={bulkDeleteMutation.isPending}
                >
                  {bulkDeleteMutation.isPending ? (
                    <Loader2 className="h-3.5 w-3.5 sm:h-4 sm:w-4 animate-spin" />
                  ) : (
                    <X className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                  )}
                  <span className="hidden sm:inline">Delete</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Collection Picker Modal */}
      {isCollectionPickerOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setIsCollectionPickerOpen(false)}>
          <Card className="w-full max-w-md animate-scale-in" onClick={(e) => e.stopPropagation()}>
            <CardHeader>
              <CardTitle>Add to Collection</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {collections && collections.length > 0 ? (
                collections.map((collection) => (
                  <Button
                    key={collection.id}
                    variant="outline"
                    className="w-full justify-start rounded-button hover-lift active-scale transition-all"
                    onClick={() => {
                      bulkAddMutation.mutate({
                        collectionId: collection.id,
                        contentIds: Array.from(selectedStoryIds),
                      });
                    }}
                    disabled={bulkAddMutation.isPending}
                  >
                    <div className="flex items-center gap-3 w-full">
                      {bulkAddMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <div 
                          className="w-4 h-4 rounded-full" 
                          style={{ backgroundColor: collection.color || '#8B5CF6' }}
                        />
                      )}
                      <span>{collection.name}</span>
                      <Badge variant="secondary" className="ml-auto">
                        {collection.itemCount}
                      </Badge>
                    </div>
                  </Button>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <p className="mb-4">No collections yet</p>
                  <Button
                    onClick={() => {
                      setIsCollectionPickerOpen(false);
                      setLocation('/collections');
                    }}
                    className="rounded-button gradient-primary text-white hover-lift border-0"
                  >
                    Create Collection
                  </Button>
                </div>
              )}
              <Button
                variant="outline"
                className="w-full rounded-button"
                onClick={() => setIsCollectionPickerOpen(false)}
              >
                Cancel
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </PullToRefresh>
    {showLibraryTutorial && (
      <LibraryOnboardingTutorial onComplete={handleLibraryTutorialComplete} />
    )}
    {hasSeenLibraryTutorial && !showLibraryTutorial && (
      <Button
        type="button"
        variant="outline"
        onClick={() => setShowLibraryTutorial(true)}
        className="fixed bottom-5 right-5 z-50 rounded-full bg-white text-purple-700 shadow-lg border border-purple-200 hover:bg-purple-50"
      >
        <HelpCircle className="mr-2 h-4 w-4" />
        Tutorial
      </Button>
    )}
    </>
  );
}
