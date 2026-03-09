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
import { Loader2, Play, Heart, Clock, BookOpen, Sparkles, RefreshCw, Search, X, Filter, Folder, CheckSquare, Square, Plus, Palette, GraduationCap, ArrowLeft, Mic, Film, Download, Globe, Settings2, ChevronDown, FolderPlus, FolderHeart } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { APP_TITLE, APP_LOGO } from "@/const";
import { toast } from "sonner";
import { DifficultyBadge } from "@/components/DifficultyBadge";
import Breadcrumb from "@/components/Breadcrumb";
import { LibraryOnboardingTutorial } from "@/components/LibraryOnboardingTutorial";

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
      trpc.useUtils().collections.getMyCollections.invalidate();
      
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
      trpc.useUtils().collections.getMyCollections.invalidate();
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

  // Multi-select state
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);
  const [selectedStoryIds, setSelectedStoryIds] = useState<Set<number>>(new Set());
  const [isCollectionPickerOpen, setIsCollectionPickerOpen] = useState(false);

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
    if (!library) return [];
    return Array.from(new Set(library.map(c => c.difficultyLevel).filter(Boolean)));
  }, [library]);

  // Filter and sort library
  const filteredLibrary = useMemo(() => {
    if (!library) return [];
    
    let filtered = library;

    // Always hide failed stories - users can regenerate them instead
    filtered = filtered.filter(content => content.status !== "failed");

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
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-card shadow-playful-lg border-2">
          <CardContent className="pt-6 text-center space-y-4">
            <img src="/flip-mascot.png" alt="Flip" className="w-24 h-24 mx-auto" />
            <h3 className="text-xl font-bold">Sign in to continue</h3>
            <p className="text-muted-foreground">Please sign in to view your library</p>
            <Button 
              onClick={() => setLocation("/")}
              className="rounded-button gradient-primary text-white hover-lift active-scale border-0 transition-all"
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
        <p className="text-muted-foreground">Loading your library...</p>
      </div>
    );
  }

    return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-playful">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation("/app")}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={APP_LOGO} alt="Storyling.ai" className="h-10 w-10" />
            <h1 className="text-2xl font-bold gradient-text-primary">{APP_TITLE}</h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:inline">
              {user?.name || "friend"} 👋
            </span>
            <Button 
              variant="outline" 
              onClick={() => setLocation("/")}
              className="rounded-button hover-lift active-scale transition-all"
            >
              Create New Story
            </Button>
            <Button 
              variant="outline"
              onClick={() => setLocation("/collections")}
              className="rounded-button hover-lift active-scale transition-all flex items-center gap-2"
              data-tutorial="collections-button"
            >
              <FolderHeart className="h-4 w-4" />
              Collections
            </Button>
          </div>
        </div>
      </header>

      <section className="container py-12">
        <Breadcrumb items={[
          { label: "Dashboard", href: "/app" },
          { label: "Library" }
        ]} showHome={false} />
        
        <div className="mb-8 animate-bounce-in">
          <h2 className="text-4xl font-bold mb-2">My Library</h2>
          <p className="text-lg text-muted-foreground">
            Your personalized language learning content
          </p>
        </div>

        {/* Search and Filters */}
        {library && library.length > 0 && (
          <div className="mb-8 space-y-6 animate-slide-up">
            {/* Search Bar - Prominent Position */}
            <div className="relative" data-tutorial="search-filter">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Search stories by title..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-12 pr-12 rounded-2xl h-14 text-base shadow-sm border-2 focus:border-purple-300 transition-all"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-gray-100"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>

            {/* Filter Sections with Clear Visual Hierarchy */}
            <div className="space-y-5">
              {/* Primary Section: Content Type Tabs */}
              <div className="flex gap-3 items-center flex-wrap" data-tutorial="content-tabs">
                <span className="text-sm font-semibold text-muted-foreground mr-1">Content:</span>
                <Button
                  variant={modeFilter === "all" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setModeFilter("all")}
                  className="rounded-full h-9 px-4 font-medium hover-lift active-scale transition-all"
                >
                  All
                </Button>
                <Button
                  variant={modeFilter === "podcast" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setModeFilter("podcast")}
                  className="rounded-full h-9 px-4 font-medium hover-lift active-scale transition-all"
                >
                  <Mic className="h-4 w-4 mr-2" />
                  Podcasts
                </Button>
                <Button
                  variant={modeFilter === "film" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setModeFilter("film")}
                  className="rounded-full h-9 px-4 font-medium hover-lift active-scale transition-all"
                >
                  <Film className="h-4 w-4 mr-2" />
                  Films
                </Button>
              </div>

              {/* Secondary Section: Filter Dropdowns - Grouped with Background */}
              <div className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-gray-200/50 shadow-sm">
                <div className="flex gap-4 items-center flex-wrap">
                  <span className="text-sm font-semibold text-muted-foreground">Filters:</span>
                  
                  {/* Filter Dropdowns Group */}
                  <div className="flex gap-3 items-center flex-wrap">
                    {/* Theme Select Dropdown */}
                    {themes.length > 0 && (
                      <div className="flex items-center gap-2">
                        <Palette className="h-4 w-4 text-muted-foreground" />
                        <Select
                          value={selectedTheme || "all"}
                          onValueChange={(value) => setSelectedTheme(value === "all" ? null : value)}
                        >
                          <SelectTrigger
                            className={`rounded-full h-9 px-4 border-2 transition-all min-w-[140px] ${
                              selectedTheme 
                                ? 'border-purple-400 bg-purple-50 text-purple-700 font-medium' 
                                : 'border-gray-300 hover:border-purple-300'
                            }`}
                          >
                            <SelectValue placeholder="Theme" />
                          </SelectTrigger>
                          <SelectContent className="max-h-[300px]">
                            <SelectItem value="all">
                              <span className="font-medium">All Themes</span>
                            </SelectItem>
                            {themes.map(theme => (
                              <SelectItem key={theme} value={theme}>
                                {theme}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}

                    {/* Language Dropdown */}
                    {languages.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`rounded-full h-9 px-4 border-2 transition-all ${
                              selectedLanguage 
                                ? 'border-teal-400 bg-teal-50 text-teal-700 font-medium' 
                                : 'border-gray-300 hover:border-teal-300'
                            }`}
                          >
                            <Globe className="mr-2 h-4 w-4" />
                            {selectedLanguage || "Language"}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => setSelectedLanguage(null)}>
                            <span className="font-medium">All Languages</span>
                          </DropdownMenuItem>
                          {languages.map(lang => (
                            <DropdownMenuItem 
                              key={lang} 
                              onClick={() => setSelectedLanguage(lang)}
                              className={selectedLanguage === lang ? "bg-accent" : ""}
                            >
                              {lang}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}

                    {/* Difficulty Dropdown */}
                    {difficulties.length > 0 && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={`rounded-full h-9 px-4 border-2 transition-all ${
                              selectedDifficulty 
                                ? 'border-pink-400 bg-pink-50 text-pink-700 font-medium' 
                                : 'border-gray-300 hover:border-pink-300'
                            }`}
                          >
                            <GraduationCap className="mr-2 h-4 w-4" />
                            {selectedDifficulty || "Difficulty"}
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="start">
                          <DropdownMenuItem onClick={() => setSelectedDifficulty(null)}>
                            <span className="font-medium">All Levels</span>
                          </DropdownMenuItem>
                          {difficulties.map(difficulty => (
                            <DropdownMenuItem 
                              key={difficulty} 
                              onClick={() => setSelectedDifficulty(difficulty)}
                              className={selectedDifficulty === difficulty ? "bg-accent" : ""}
                            >
                              {difficulty}
                            </DropdownMenuItem>
                          ))}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </div>

                  {/* Divider */}
                  <div className="h-6 w-px bg-border" />

                  {/* Sort & Options Group */}
                  <div className="flex gap-3 items-center flex-wrap ml-auto">
                    {/* Options Dropdown (Sort + Show Failed) */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="rounded-full h-9 px-4 border-2 border-gray-300 hover:border-gray-400 transition-all"
                        >
                          <Settings2 className="mr-2 h-4 w-4" />
                          Options
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        <div className="px-2 py-1.5 text-xs font-semibold text-muted-foreground">Sort By</div>
                        <DropdownMenuItem onClick={() => setSortBy("newest")} className={sortBy === "newest" ? "bg-accent" : ""}>
                          Newest First
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy("oldest")} className={sortBy === "oldest" ? "bg-accent" : ""}>
                          Oldest First
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy("title")} className={sortBy === "title" ? "bg-accent" : ""}>
                          Title (A-Z)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy("progress")} className={sortBy === "progress" ? "bg-accent" : ""}>
                          Progress (High to Low)
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => setSortBy("playCount")} className={sortBy === "playCount" ? "bg-accent" : ""}>
                          Play Count (High to Low)
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Clear Filters Button */}
                    {hasActiveFilters && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearFilters}
                        className="rounded-full h-9 px-4 text-red-600 hover:bg-red-50 hover:text-red-700 transition-all"
                      >
                        <X className="mr-2 h-4 w-4" />
                        Clear All
                      </Button>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Action Buttons - Below Filters */}
            <div className="flex gap-3 items-center justify-end">
              {!isMultiSelectMode ? (
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => setIsMultiSelectMode(true)}
                  className="rounded-full h-9 px-4 border border-input hover:bg-accent hover:text-accent-foreground hover-lift active-scale transition-all"
                >
                  <CheckSquare className="mr-2 h-4 w-4" />
                  Select
                </Button>
              ) : (
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={exitMultiSelectMode}
                  className="rounded-full h-9 px-4 border-2 border-red-300 text-red-600 hover:bg-red-50 hover-lift active-scale transition-all"
                >
                  <X className="mr-2 h-4 w-4" />
                  Cancel
                </Button>
              )}
            </div>

            {/* Active Filters Summary */}
            {hasActiveFilters && (
              <div className="text-sm font-medium text-muted-foreground bg-purple-50 rounded-xl px-4 py-2 inline-block">
                Showing <span className="text-purple-700 font-bold">{filteredLibrary.length}</span> of <span className="font-semibold">{library.length}</span> stories
              </div>
            )}
          </div>
        )}

        {!library || library.length === 0 ? (
          <Card className="rounded-card shadow-playful-lg border-2 animate-bounce-in">
            <CardContent className="py-16 text-center space-y-6">
              <img src="/flip-mascot.png" alt="Flip" className="w-32 h-32 mx-auto animate-float" />
              <div>
                <h3 className="text-2xl font-bold mb-2">No content yet</h3>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                  Start creating your first story to begin your learning journey! Flip is excited to help you learn.
                </p>
              </div>
              <Button 
                onClick={() => setLocation("/")}
                className="rounded-button gradient-warm text-white hover-lift hover-glow active-scale border-0 h-12 text-lg px-8 transition-all"
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
                        onClick={() => setLocation("/")}
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

            {/* Story Grid */}
            {filteredLibrary.length > 0 && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3" data-tutorial="story-grid">
            {filteredLibrary.map((content) => (
              <Card 
                key={content.id} 
                className={`overflow-hidden rounded-card shadow-playful hover-lift hover-glow active-scale transition-all border-2 animate-slide-up ${
                  isMultiSelectMode ? 'cursor-pointer' : ''
                } ${
                  selectedStoryIds.has(content.id) ? 'ring-4 ring-primary border-primary' : ''
                }`}
                onClick={() => isMultiSelectMode && toggleStorySelection(content.id)}
              >
                {/* Thumbnail Image */}
                <div className="relative w-full h-48 bg-gradient-to-br from-purple-100 via-teal-100 to-pink-100 overflow-hidden group">
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
                        className="w-full h-full object-cover transition-opacity duration-300 group-hover:opacity-0"
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
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <Badge 
                        variant={content.mode === "podcast" ? "default" : "secondary"}
                        className="rounded-full"
                      >
                        {content.mode === "podcast" ? "🎙️ Podcast" : "🎬 Film"}
                      </Badge>
                      {content.title && content.titleTranslation ? (
                        <div className="mt-2 space-y-1">
                          <CardTitle className="line-clamp-2 text-lg">
                            {content.title}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {content.titleTranslation}
                          </p>
                        </div>
                      ) : (
                        <CardTitle className="mt-2 line-clamp-2 text-lg">
                          {content.title || content.storyText?.substring(0, 60) || `${content.theme} Story`}
                        </CardTitle>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
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
                              <FolderPlus className="h-5 w-5" />
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
                <CardContent className="space-y-4">
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Play className="h-4 w-4" />
                      {content.playCount || 0} plays
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="h-4 w-4" />
                      {new Date(content.generatedAt).toLocaleDateString()}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <DifficultyBadge difficultyLevel={content.difficultyLevel} />
                    <Badge variant="outline" className="rounded-full">{content.theme}</Badge>
                    {content.voiceType && <Badge variant="outline" className="rounded-full">{content.voiceType}</Badge>}
                    {content.cinematicStyle && (
                      <Badge variant="outline" className="rounded-full">{content.cinematicStyle}</Badge>
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
                        className="w-full rounded-button gradient-primary text-white hover-lift border-0 h-11"
                        onClick={() => setLocation(`/content/${content.id}`)}
                      >
                        <Play className="mr-2 h-4 w-4" />
                        {content.mode === "podcast" ? "Listen Now" : "Watch Now"}
                      </Button>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full rounded-button hover-lift active-scale transition-all"
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
              </Card>
            ))}
              </div>
            )}
          </>
        )}
      </section>

      {/* Bulk Action Bar */}
      {isMultiSelectMode && selectedStoryIds.size > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-2xl z-50 animate-slide-up">
          <div className="container py-4">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium">
                  {selectedStoryIds.size} {selectedStoryIds.size === 1 ? 'story' : 'stories'} selected
                </span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAll}
                  className="text-sm"
                >
                  Select All
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={clearSelection}
                  className="text-sm"
                >
                  Clear
                </Button>
              </div>
              <div className="flex items-center gap-3">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button
                      variant="outline"
                      className="rounded-button hover-lift"
                    >
                      <Palette className="mr-2 h-4 w-4" />
                      Change Style
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-72">
                    <div className="px-2 py-1.5 text-sm font-semibold">Apply Style to All Selected</div>
                    <DropdownMenuItem
                      onClick={() => {
                        const contentIds = Array.from(selectedStoryIds);
                        bulkRegenerateThumbnailsMutation.mutate({ contentIds, style: "realistic" });
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
                      onClick={() => {
                        const contentIds = Array.from(selectedStoryIds);
                        bulkRegenerateThumbnailsMutation.mutate({ contentIds, style: "illustrated" });
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
                      onClick={() => {
                        const contentIds = Array.from(selectedStoryIds);
                        bulkRegenerateThumbnailsMutation.mutate({ contentIds, style: "minimalist" });
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
                <Button
                  onClick={handleBulkExport}
                  variant="outline"
                  className="rounded-button hover-lift"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Export CSV
                </Button>
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
                  className="rounded-button hover-lift"
                  disabled={batchDownloadMutation.isPending}
                >
                  {batchDownloadMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Download className="mr-2 h-4 w-4" />
                  )}
                  Download Stories
                </Button>
                <Button
                  onClick={() => {
                    if (confirm(`Are you sure you want to mark ${selectedStoryIds.size} ${selectedStoryIds.size === 1 ? 'story' : 'stories'} as complete?`)) {
                      bulkMarkCompleteMutation.mutate({ contentIds: Array.from(selectedStoryIds) });
                    }
                  }}
                  variant="outline"
                  className="rounded-button hover-lift"
                  disabled={bulkMarkCompleteMutation.isPending}
                >
                  {bulkMarkCompleteMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <CheckSquare className="mr-2 h-4 w-4" />
                  )}
                  Mark Complete
                </Button>
                <Button
                  onClick={() => {
                    if (confirm(`Are you sure you want to delete ${selectedStoryIds.size} ${selectedStoryIds.size === 1 ? 'story' : 'stories'}? This action cannot be undone.`)) {
                      bulkDeleteMutation.mutate({ contentIds: Array.from(selectedStoryIds) });
                    }
                  }}
                  variant="destructive"
                  className="rounded-button hover-lift"
                  disabled={bulkDeleteMutation.isPending}
                >
                  {bulkDeleteMutation.isPending ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <X className="mr-2 h-4 w-4" />
                  )}
                  Delete
                </Button>
                <Button
                  onClick={() => setIsCollectionPickerOpen(true)}
                  className="rounded-button gradient-primary text-white hover-lift border-0"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add to Collection
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
    </div>
    {showLibraryTutorial && (
      <LibraryOnboardingTutorial onComplete={handleLibraryTutorialComplete} />
    )}
    </>
  );
}
