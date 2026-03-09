import { useState, useMemo, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BookOpen, Search, Trophy, TrendingUp, Trash2, Volume2, Play, X, BarChart3, ArrowLeft, Download, FileDown, Upload, Dumbbell, CheckSquare, Square, CheckCircle2 } from "lucide-react";
import Breadcrumb from "@/components/Breadcrumb";
import { toast } from "sonner";
import PracticeQuiz from "@/components/PracticeQuiz";
import { useLocation } from "wouter";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

export default function Wordbank() {
  useScrollToTop();
  const [searchQuery, setSearchQuery] = useState("");
  const [languageFilter, setLanguageFilter] = useState<string>("all");
  const [masteryFilter, setMasteryFilter] = useState<string>("all");
  const [showMastered, setShowMastered] = useState<boolean>(true);
  const [showDueOnly, setShowDueOnly] = useState(false);
  const [selectedQuizMode, setSelectedQuizMode] = useState<"flashcard" | "multiple_choice" | "fill_in_blank">("flashcard");
  const [showPractice, setShowPractice] = useState(false);
  const [showModeSelect, setShowModeSelect] = useState(false);
  const [isExportingCSV, setIsExportingCSV] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [importText, setImportText] = useState("");
  const [selectMode, setSelectMode] = useState(false);
  const [selectedWords, setSelectedWords] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();

  // Fetch wordbank words
  const { data: words = [], refetch } = trpc.wordbank.getMyWords.useQuery();
  const { data: dueWords = [] } = trpc.wordbank.getDueWords.useQuery();
  const { data: stats } = trpc.practice.getStats.useQuery();
  const { data: suggestions = [] } = trpc.wordbank.getMasterySuggestions.useQuery();
  const { data: reviewStats } = trpc.wordbank.getReviewStats.useQuery();

  // Use due words if filter is active, otherwise all words
  const wordsToDisplay = showDueOnly ? dueWords : words;

  // Mutations
  const removeWord = trpc.wordbank.removeWord.useMutation({
    onSuccess: () => {
      toast.success("Word removed from wordbank");
      refetch();
    },
  });

  const updateMastery = trpc.wordbank.updateMastery.useMutation({
    onSuccess: (_, variables) => {
      const action = variables.action === "need_practice" ? "marked for practice" : "marked as mastered";
      toast.success(`Word ${action}!`);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to update word: ${error.message}`);
    },
  });

  const dismissSuggestion = trpc.wordbank.dismissSuggestion.useMutation({
    onSuccess: () => {
      toast.success("Suggestion dismissed");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to dismiss: ${error.message}`);
    },
  });

  const bulkImportWords = trpc.wordbank.bulkImportWords.useMutation({
    onSuccess: (data) => {
      toast.success(`Imported ${data.success} words successfully!`);
      if (data.skipped > 0) {
        toast.info(`Skipped ${data.skipped} duplicate words`);
      }
      if (data.failed > 0) {
        toast.warning(`Failed to import ${data.failed} words`);
      }
      refetch();
      setShowImportDialog(false);
      setImportText("");
    },
    onError: (error) => {
      toast.error(`Import failed: ${error.message}`);
    },
  });

  const snoozeSuggestions = trpc.wordbank.snoozeSuggestions.useMutation({
    onSuccess: (data) => {
      const days = Math.ceil((data.snoozeUntil.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
      toast.success(`Suggestions snoozed for ${days} day${days !== 1 ? 's' : ''}`);
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to snooze: ${error.message}`);
    },
  });

  const generateAudio = trpc.audio.generateWordAudio.useMutation();

  // Export mutations
  const exportCSVMutation = trpc.wordbank.exportToCSV.useQuery(
    {
      targetLanguage: languageFilter !== "all" ? languageFilter : undefined,
      masteryLevel: masteryFilter !== "all" ? (masteryFilter as "learning" | "familiar" | "mastered") : undefined,
    },
    {
      enabled: false,
    }
  );

  const exportPDFMutation = trpc.wordbank.exportToPDF.useMutation({
    onSuccess: (data) => {
      // Create download link
      const blob = new Blob(
        [Uint8Array.from(atob(data.pdf), (c) => c.charCodeAt(0))],
        { type: "application/pdf" }
      );
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = data.filename;
      link.click();
      URL.revokeObjectURL(link.href);
      toast.success("PDF exported successfully!");
    },
    onError: (error) => {
      toast.error("Failed to export PDF");
      console.error(error);
    },
  });

  // Export handlers
  const handleExportCSV = async () => {
    setIsExportingCSV(true);
    try {
      const response = await exportCSVMutation.refetch();
      if (response.data) {
        // Create download link
        const blob = new Blob([response.data.csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = response.data.filename;
        link.click();
        URL.revokeObjectURL(link.href);
        toast.success("CSV exported successfully!");
      }
    } catch (error) {
      toast.error("Failed to export CSV");
      console.error(error);
    } finally {
      setIsExportingCSV(false);
    }
  };

  const handleExportPDF = () => {
    exportPDFMutation.mutate({
      targetLanguage: languageFilter !== "all" ? languageFilter : undefined,
      masteryLevel: masteryFilter !== "all" ? (masteryFilter as "learning" | "familiar" | "mastered") : undefined,
    });
  };

  // Filter words based on search and filters
  const filteredWords = useMemo(() => {
    return wordsToDisplay.filter((word) => {
      const matchesSearch =
        searchQuery === "" ||
        word.word.toLowerCase().includes(searchQuery.toLowerCase()) ||
        word.translation.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (word.pinyin && word.pinyin.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesLanguage =
        languageFilter === "all" || word.targetLanguage === languageFilter;

      const isMastered = (word.easinessFactor ?? 0) >= 2500 && (word.interval ?? 0) >= 30;
      const matchesMasteryFilter = showMastered ? true : !isMastered;

      return matchesSearch && matchesLanguage && matchesMasteryFilter;
    });
  }, [wordsToDisplay, searchQuery, languageFilter, masteryFilter, showMastered]);

  // Get unique languages
  const languages = useMemo(() => {
    const uniqueLangs = new Set(wordsToDisplay.map((w) => w.targetLanguage));
    return Array.from(uniqueLangs);
  }, [wordsToDisplay]);

  const dueCount = dueWords.length;

  const handlePlayAudio = async (word: string, targetLanguage: string) => {
    try {
      const result = await generateAudio.mutateAsync({ word, targetLanguage });
      const audio = new Audio(result.audioUrl);
      audio.play();
    } catch (error) {
      toast.error("Failed to play audio");
    }
  };

  const handleRemoveWord = (wordId: number) => {
    if (confirm("Are you sure you want to remove this word from your wordbank?")) {
      removeWord.mutate({ wordId });
    }
  };

  const handleUpdateMastery = (wordbankId: number, action: "need_practice" | "mastered") => {
    updateMastery.mutate({ wordbankId, action });
  };

  const handleBulkMarkAsMastered = async () => {
    if (suggestions.length === 0) return;
    
    if (!confirm(`Mark ${suggestions.length} word${suggestions.length !== 1 ? 's' : ''} as mastered?`)) {
      return;
    }

    // Mark all suggested words as mastered
    for (const suggestion of suggestions) {
      await updateMastery.mutateAsync({ wordbankId: suggestion.id, action: "mastered" });
    }
    
    toast.success(`${suggestions.length} word${suggestions.length !== 1 ? 's' : ''} marked as mastered!`);
    refetch();
  };

  const handleDismissSuggestion = (wordbankId: number) => {
    dismissSuggestion.mutate({ wordbankId });
  };

  const handleSnoozeSuggestions = () => {
    snoozeSuggestions.mutate({ days: 7 });
  };

  const getMasteryColor = (level: string) => {
    switch (level) {
      case "mastered":
        return "bg-green-100 text-green-800 border-green-300";
      case "familiar":
        return "bg-blue-100 text-blue-800 border-blue-300";
      case "learning":
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-300";
    }
  };

  const getMasteryIcon = (level: string) => {
    switch (level) {
      case "mastered":
        return "🏆";
      case "familiar":
        return "📚";
      case "learning":
      default:
        return "🌱";
    }
  };

  // Import handlers
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      setImportText(text);
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!importText.trim()) {
      toast.error("Please provide words to import");
      return;
    }

    // Parse line-by-line text - just words to import
    const lines = importText.split("\n").filter(line => line.trim());
    const words: string[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed) {
        words.push(trimmed);
      }
    }

    if (words.length === 0) {
      toast.error("No valid words found. Enter one word per line.");
      return;
    }

    // Use current language filter or default to Spanish
    const targetLanguage = languageFilter !== "all" ? languageFilter : "Spanish";
    bulkImportWords.mutate({ words, targetLanguage });
  };

  // Multi-select handlers
  const toggleSelectMode = () => {
    setSelectMode(!selectMode);
    setSelectedWords(new Set());
  };

  const toggleWordSelection = (wordId: number) => {
    const newSelected = new Set(selectedWords);
    if (newSelected.has(wordId)) {
      newSelected.delete(wordId);
    } else {
      newSelected.add(wordId);
    }
    setSelectedWords(newSelected);
  };

  const selectAll = () => {
    setSelectedWords(new Set(filteredWords.map(w => w.id)));
  };

  const clearSelection = () => {
    setSelectedWords(new Set());
  };

  const handleBulkAction = async (action: "mastered" | "learning" | "delete") => {
    if (selectedWords.size === 0) {
      toast.error("No words selected");
      return;
    }

    const wordIds = Array.from(selectedWords);

    if (action === "delete") {
      if (!confirm(`Delete ${wordIds.length} selected words?`)) return;
      for (const wordId of wordIds) {
        await removeWord.mutateAsync({ wordId });
      }
      toast.success(`Deleted ${wordIds.length} words`);
    } else {
      for (const wordId of wordIds) {
        await updateMastery.mutateAsync({ wordbankId: wordId, action: action === "mastered" ? "mastered" : "need_practice" });
      }
      toast.success(`Updated ${wordIds.length} words`);
    }

    setSelectedWords(new Set());
    setSelectMode(false);
    refetch();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-cyan-50 p-6">
      <div className="container max-w-7xl mx-auto">
        {/* Breadcrumb Navigation */}
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/app" },
            { label: "Wordbank", icon: <BookOpen className="h-4 w-4" /> },
          ]}
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowImportDialog(true)}
                className="gap-2"
              >
                <Upload className="h-4 w-4" />
                Import Words
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportPDF}
                disabled={exportPDFMutation.isPending}
                className="gap-2"
              >
                <FileDown className="h-4 w-4" />
                Export Report
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportCSV}
                disabled={isExportingCSV}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export Data
              </Button>
              <Button
                size="sm"
                onClick={() => {
                  setShowModeSelect(true);
                }}
                className="gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
              >
                <Dumbbell className="h-4 w-4" />
                Practice Now
              </Button>
            </>
          }
        />

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                My Wordbank
              </h1>
              <p className="text-gray-600 mt-2">Practice and master your saved vocabulary</p>
            </div>
            <div className="flex items-center gap-3">
              {dueCount > 0 && (
                <Badge className="bg-blue-500 text-white text-lg px-4 py-2">
                  {dueCount} Due for Review
                </Badge>
              )}
              <Button
                variant={selectMode ? "default" : "outline"}
                onClick={toggleSelectMode}
                className="gap-2"
              >
                {selectMode ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
                {selectMode ? "Cancel" : "Select"}
              </Button>
            </div>
          </div>
        </div>

        {/* Review Section */}
        {reviewStats && reviewStats.dueToday > 0 && (
          <Card className="mb-6 border-2 border-blue-500 bg-gradient-to-r from-blue-50 to-purple-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-blue-600" />
                Ready to Review
              </CardTitle>
              <CardDescription>
                You have {reviewStats.dueToday} word{reviewStats.dueToday !== 1 ? 's' : ''} due for review today
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4 items-center">
                <div className="flex-1 space-y-2">
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold">{reviewStats.learning}</span> learning
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold">{reviewStats.familiar}</span> familiar
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-semibold">{reviewStats.mastered}</span> mastered
                  </div>
                </div>
                <Button
                  size="lg"
                  onClick={() => setLocation('/review')}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                >
                  Start Review
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Total Words</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-purple-600">{words.length}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Accuracy</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-600">{stats.accuracy}%</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">XP Earned</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">{stats.totalXpEarned}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-600">Mastered</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-600">
                  {stats.masteryDistribution.find((m) => m.level === "mastered")?.count || 0}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search words, translations, or pinyin..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>

              <Select value={languageFilter} onValueChange={setLanguageFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Languages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  {languages.map((lang) => (
                    <SelectItem key={lang} value={lang}>
                      {lang}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={masteryFilter} onValueChange={setMasteryFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="learning">🌱 Learning</SelectItem>
                  <SelectItem value="familiar">📚 Familiar</SelectItem>
                  <SelectItem value="mastered">🏆 Mastered</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant={showDueOnly ? "default" : "outline"}
                onClick={() => setShowDueOnly(!showDueOnly)}
                className="relative"
              >
                📅 Due for Review
                {dueCount > 0 && (
                  <Badge className="ml-2 bg-red-500 text-white">
                    {dueCount}
                  </Badge>
                )}
              </Button>

              <Button
                variant={showMastered ? "default" : "outline"}
                onClick={() => setShowMastered(!showMastered)}
                className="flex items-center gap-2"
              >
                {showMastered ? "✓" : "✗"} Show Mastered
              </Button>

              <Button
                variant="outline"
                onClick={() => setLocation("/srs-stats")}
                className="flex items-center gap-2"
              >
                <BarChart3 className="w-4 h-4" />
                Statistics
              </Button>
            </div>

            {/* Export Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                variant="outline"
                onClick={handleExportCSV}
                disabled={filteredWords.length === 0 || isExportingCSV}
                className="flex items-center gap-2 flex-1"
              >
                {isExportingCSV ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
                    Generating...
                  </>
                ) : (
                  <>
                    <FileDown className="w-4 h-4" />
                    Export CSV
                  </>
                )}
              </Button>
              <Button
                variant="outline"
                onClick={handleExportPDF}
                disabled={filteredWords.length === 0 || exportPDFMutation.isPending}
                className="flex items-center gap-2 flex-1"
              >
                {exportPDFMutation.isPending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Download className="w-4 h-4" />
                    Export PDF
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Priority-Based Action Banner */}
        {dueWords.length > 0 ? (
          /* Priority 1: Words due for review */
          <Card className="mb-6 bg-gradient-to-r from-purple-500 to-blue-500 text-white">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold mb-1">Ready to Practice?</h3>
                  <p className="text-purple-100">
                    {dueWords.length} word{dueWords.length !== 1 ? "s" : ""} due for review
                  </p>
                </div>
                <div className="flex gap-3">
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={() => setShowModeSelect(true)}
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start Practice
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : filteredWords.filter(w => (w.easinessFactor ?? 0) < 2500 || (w.interval ?? 0) < 30).length > 0 ? (
          /* Priority 2: Practice available words (not mastered) */
          <Card className="mb-6 bg-gradient-to-r from-purple-500 to-blue-500 text-white">
            <CardContent className="pt-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                <div>
                  <h3 className="text-xl font-bold mb-1">Ready to Practice?</h3>
                  <p className="text-purple-100">
                    {filteredWords.filter(w => (w.easinessFactor ?? 0) < 2500 || (w.interval ?? 0) < 30).length} word{filteredWords.filter(w => (w.easinessFactor ?? 0) < 2500 || (w.interval ?? 0) < 30).length !== 1 ? "s" : ""} available to practice
                  </p>
                  {suggestions.length > 0 && (
                    <p className="text-purple-200 text-sm mt-1">
                      {suggestions.length} word{suggestions.length !== 1 ? "s" : ""} with 90%+ accuracy - almost mastered!
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={() => setShowModeSelect(true)}
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Start Practice
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : suggestions.length > 0 ? (
          /* Priority 2: Practice suggestions (only when no words due) */
          <Card className="mb-6 bg-gradient-to-r from-purple-500 to-blue-500 text-white">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between gap-4">
                <Button
                  size="sm"
                  variant="ghost"
                  className="absolute top-4 right-4 text-white hover:bg-white/20"
                  onClick={handleSnoozeSuggestions}
                  title="Snooze for 7 days"
                >
                  <X className="w-4 h-4" />
                </Button>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
                    <Play className="w-6 h-6" />
                    Ready to Practice!
                  </h3>
                  <p className="text-purple-100 mb-3">
                    {suggestions.length} word{suggestions.length !== 1 ? "s" : ""} with 90%+ accuracy - practice to master them!
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {suggestions.slice(0, 5).map((suggestion) => (
                      <div
                        key={suggestion.id}
                        className="bg-white/20 backdrop-blur-sm rounded-lg px-3 py-2 flex items-center gap-2"
                      >
                        <span className="font-semibold">{suggestion.word}</span>
                        <span className="text-green-100 text-sm">({suggestion.accuracy}%)</span>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 px-2 text-white hover:bg-white/30"
                          onClick={() => handleUpdateMastery(suggestion.id, "mastered")}
                          title="Mark as mastered"
                        >
                          ✓
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-6 w-6 p-0 text-white hover:bg-white/30"
                          onClick={() => handleDismissSuggestion(suggestion.id)}
                          title="Dismiss this suggestion"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    {suggestions.length > 5 && (
                      <span className="text-green-100 text-sm self-center">
                        +{suggestions.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button
                    size="lg"
                    variant="secondary"
                    onClick={() => setShowModeSelect(true)}
                    className="whitespace-nowrap"
                  >
                    <Play className="w-5 h-5 mr-2" />
                    Practice Now
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleBulkMarkAsMastered}
                    disabled={updateMastery.isPending}
                    className="whitespace-nowrap text-white hover:bg-white/20"
                  >
                    <Trophy className="w-4 h-4 mr-2" />
                    Mark All as Mastered
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {/* Word List */}
        <div className="grid grid-cols-1 gap-4">
          {filteredWords.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
                <h3 className="text-xl font-semibold text-gray-600 mb-2">No words found</h3>
                <p className="text-gray-500">
                  {searchQuery || languageFilter !== "all" || masteryFilter !== "all"
                    ? "Try adjusting your search or filters"
                    : "Start saving words from stories to build your vocabulary!"}
                </p>
              </CardContent>
            </Card>
          ) : (
            filteredWords.map((word) => (
              <Card key={word.id} className={`hover:shadow-md transition-shadow ${
                selectMode && selectedWords.has(word.id) ? "ring-2 ring-purple-500" : ""
              }`}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4">
                    {selectMode && (
                      <div className="pt-1">
                        <Checkbox
                          checked={selectedWords.has(word.id)}
                          onCheckedChange={() => toggleWordSelection(word.id)}
                        />
                      </div>
                    )}
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-2xl font-bold text-gray-800">{word.word}</h3>
                        {/* Status Badge */}
                        {((word.easinessFactor ?? 0) >= 2500 && (word.interval ?? 0) >= 30) ? (
                          <Badge className="bg-green-100 text-green-700 border-green-300 text-sm px-3 py-1">
                            ✓ Mastered
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-gray-600 border-gray-300 text-sm px-3 py-1">
                            🌱 Learning
                          </Badge>
                        )}
                        {(word.correctCount ?? 0) + (word.incorrectCount ?? 0) > 0 && (
                          <Badge variant="outline">
                            {word.repetitions ?? 0} reviews
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePlayAudio(word.word, word.targetLanguage)}
                          disabled={generateAudio.isPending}
                        >
                          <Volume2 className="w-4 h-4" />
                        </Button>
                      </div>

                      {word.pinyin && (
                        <p className="text-lg text-gray-600 mb-1">{word.pinyin}</p>
                      )}

                      <p className="text-lg text-gray-700 mb-3">{word.translation}</p>

                      {word.exampleSentences && word.exampleSentences.length > 0 && (
                        <div className="mt-3 space-y-2">
                          {word.exampleSentences.slice(0, 2).map((sentence, idx) => (
                            <p key={idx} className="text-sm text-gray-600 italic pl-4 border-l-2 border-purple-300">
                              {sentence}
                            </p>
                          ))}
                        </div>
                      )}

                      <div className="flex items-center gap-4 mt-4 text-sm text-gray-500">
                        <span>{word.targetLanguage}</span>
                        <span>•</span>
                        <span>
                          {(word.correctCount ?? 0) + (word.incorrectCount ?? 0) > 0
                            ? `${Math.round(
                                ((word.correctCount ?? 0) / ((word.correctCount ?? 0) + (word.incorrectCount ?? 0))) * 100
                              )}% accuracy`
                            : "Not practiced yet"}
                        </span>
                        <span>•</span>
                        <span>Saved {new Date(word.createdAt).toLocaleDateString()}</span>
                        {word.nextReviewDate && (
                          <>
                            <span>•</span>
                            <span className="text-blue-600">
                              Next review: {new Date(word.nextReviewDate).toLocaleDateString()}
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      {/* Action Button */}
                      {((word.easinessFactor ?? 0) >= 2500 && (word.interval ?? 0) >= 30) ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateMastery(word.id, "need_practice")}
                          className="text-orange-600 hover:text-orange-700 hover:bg-orange-50 border-orange-300"
                          title="Reset this word to practice mode"
                        >
                          🔄 Reset to Practice
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateMastery(word.id, "mastered")}
                          className="text-green-600 hover:text-green-700 hover:bg-green-50 border-green-300"
                          title="Mark this word as mastered"
                        >
                          ✓ Mark Mastered
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveWord(word.id)}
                        className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        title="Remove from wordbank"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Quiz Mode Selection Dialog */}
        <Dialog open={showModeSelect} onOpenChange={setShowModeSelect}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Choose Practice Mode</DialogTitle>
              <DialogDescription>
                Select how you'd like to practice your vocabulary
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3 mt-4">
              <Button
                size="lg"
                variant="outline"
                className="w-full justify-start h-auto py-4"
                onClick={() => {
                  setSelectedQuizMode("flashcard");
                  setShowModeSelect(false);
                  setShowPractice(true);
                }}
              >
                <div className="text-left">
                  <div className="font-bold mb-1">🃏 Flashcard Mode</div>
                  <div className="text-sm text-gray-600">Flip cards to test your memory</div>
                </div>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full justify-start h-auto py-4"
                onClick={() => {
                  setSelectedQuizMode("multiple_choice");
                  setShowModeSelect(false);
                  setShowPractice(true);
                }}
              >
                <div className="text-left">
                  <div className="font-bold mb-1">✅ Multiple Choice</div>
                  <div className="text-sm text-gray-600">Pick the correct translation</div>
                </div>
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="w-full justify-start h-auto py-4"
                onClick={() => {
                  setSelectedQuizMode("fill_in_blank");
                  setShowModeSelect(false);
                  setShowPractice(true);
                }}
              >
                <div className="text-left">
                  <div className="font-bold mb-1">✏️ Fill in the Blank</div>
                  <div className="text-sm text-gray-600">Type the correct answer</div>
                </div>
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        {/* Practice Quiz Dialog */}
        <Dialog open={showPractice} onOpenChange={setShowPractice}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Practice Session</DialogTitle>
              <Button
                size="sm"
                variant="ghost"
                className="absolute right-4 top-4"
                onClick={() => setShowPractice(false)}
              >
                <X className="w-4 h-4" />
              </Button>
            </DialogHeader>
            <div className="mt-4">
              <PracticeQuiz
                quizMode={selectedQuizMode}
                count={Math.min(filteredWords.length, 10)}
                targetLanguage={languageFilter !== "all" ? languageFilter : undefined}
                masteryLevel={masteryFilter !== "all" ? (masteryFilter as any) : undefined}
                onComplete={(stats) => {
                  setShowPractice(false);
                  toast.success(
                    `🎉 Practice complete! ${stats.correct}/${stats.total} correct. +${stats.xpEarned} XP earned!`
                  );
                  refetch();
                }}
              />
            </div>
          </DialogContent>
        </Dialog>

        {/* Import Words Dialog */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Bulk Import Words</DialogTitle>
              <DialogDescription>
                Import multiple words at once. Enter one word per line, or upload a text file.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Target Language: {languageFilter !== "all" ? languageFilter : "Spanish (default)"}
                </label>
                <p className="text-xs text-gray-500 mb-3">
                  Change the language filter above to import words for a different language.
                </p>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Paste Words (one per line)</label>
                <Textarea
                  placeholder="hello\nworld\nfriend\n..."
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  rows={10}
                  className="font-mono"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t" />
                <span className="text-sm text-gray-500">OR</span>
                <div className="flex-1 border-t" />
              </div>
              <div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".txt,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full"
                >
                  <Upload className="h-4 w-4 mr-2" />
                  Upload Text File
                </Button>
              </div>
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowImportDialog(false);
                    setImportText("");
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={bulkImportWords.isPending || !importText.trim()}
                  className="bg-gradient-to-r from-purple-600 to-blue-600"
                >
                  {bulkImportWords.isPending ? "Importing..." : "Import Words"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Bulk Action Bar */}
        {selectMode && selectedWords.size > 0 && (
          <div className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-white shadow-2xl rounded-full px-6 py-4 flex items-center gap-4 border-2 border-purple-200 z-50">
            <span className="font-semibold text-gray-700">
              {selectedWords.size} word{selectedWords.size !== 1 ? "s" : ""} selected
            </span>
            <div className="h-6 w-px bg-gray-300" />
            <Button
              size="sm"
              variant="ghost"
              onClick={selectAll}
              className="text-purple-600 hover:text-purple-700"
            >
              Select All
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={clearSelection}
              className="text-gray-600 hover:text-gray-700"
            >
              Clear
            </Button>
            <div className="h-6 w-px bg-gray-300" />
            <Button
              size="sm"
              onClick={() => handleBulkAction("mastered")}
              disabled={updateMastery.isPending}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark Mastered
            </Button>
            <Button
              size="sm"
              onClick={() => handleBulkAction("learning")}
              disabled={updateMastery.isPending}
              className="bg-orange-500 hover:bg-orange-600 text-white"
            >
              Reset to Learning
            </Button>
            <Button
              size="sm"
              variant="destructive"
              onClick={() => handleBulkAction("delete")}
              disabled={removeWord.isPending}
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}