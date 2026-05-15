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
import { BookOpen, Search, Trophy, TrendingUp, Trash2, Volume2, Play, X, BarChart3, ArrowLeft, Download, FileDown, Upload, Dumbbell, CheckSquare, Square, CheckCircle2, Sparkles, Wand2, Pencil, Camera, FileText, Loader2 } from "lucide-react";
import { PersonalizedStoryOverlay } from "@/components/upgrade/PersonalizedStoryOverlay";
import { useAuth } from "@/_core/hooks/useAuth";
import Breadcrumb from "@/components/Breadcrumb";
import { toast } from "sonner";
import { MobileNav } from "@/components/MobileNav";
import PracticeQuiz from "@/components/PracticeQuiz";
import { useLocation } from "wouter";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { PageOnboardingTutorial } from "@/components/PageOnboardingTutorial";
import { LATAM_SPANISH_LABEL, SPAIN_SPANISH_LABEL } from "@shared/languagePreferences";
import { normalizeWordbankTargetLanguage, parseWordImportText } from "@shared/wordbankImport";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const SUPPORTED_WORD_LANGUAGES = [
  SPAIN_SPANISH_LABEL,
  LATAM_SPANISH_LABEL,
  "French",
  "German",
  "Italian",
  "Portuguese",
  "Chinese (Mandarin)",
  "Japanese",
  "Korean",
  "Arabic",
  "Hebrew",
  "Russian",
  "Hindi",
  "Persian (Farsi)",
  "Turkish",
  "Dutch",
  "Swedish",
  "Norwegian",
  "Danish",
];

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
  const [isProcessingImportFile, setIsProcessingImportFile] = useState(false);
  const [isProcessingImportPhoto, setIsProcessingImportPhoto] = useState(false);
  const [uploadedImportFileName, setUploadedImportFileName] = useState<string | null>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedWords, setSelectedWords] = useState<Set<number>>(new Set());
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);
  const [, setLocation] = useLocation();
  const { user: authUser } = useAuth();
  const [showPersonalizedOverlay, setShowPersonalizedOverlay] = useState(false);
  const utils = trpc.useUtils();
  const getImportTargetLanguage = () =>
    normalizeWordbankTargetLanguage(
      languageFilter !== "all" ? languageFilter : SPAIN_SPANISH_LABEL,
    );

  // Handle "Create Story from My Words" CTA
  const handleCreateStoryFromWords = () => {
    if (authUser?.subscriptionTier !== "premium") {
      // Upgrade Trigger #4: Show personalized story overlay for free users
      setShowPersonalizedOverlay(true);
    } else {
      // Premium users go directly to create page with words pre-filled
      const wordsList = words.map((w: any) => w.word).slice(0, 15).join(", ");
      setLocation(`/create?vocab=${encodeURIComponent(wordsList)}`);
    }
  };

  // Fetch wordbank words
  const { data: words = [], refetch } = trpc.wordbank.getMyWords.useQuery();
  const { data: dueWords = [] } = trpc.wordbank.getDueWords.useQuery();
  const { data: stats } = trpc.practice.getStats.useQuery();
  const { data: suggestions = [] } = trpc.wordbank.getMasterySuggestions.useQuery();
  const { data: reviewStats } = trpc.wordbank.getReviewStats.useQuery();
  const { data: todayWordCount } = trpc.wordbank.getTodayWordCount.useQuery();

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
      const limitSkipped = data.limitSkipped ?? 0;
      const duplicateSkipped = data.duplicateSkipped ?? 0;
      const emptySkipped = data.emptySkipped ?? 0;
      const otherSkipped = Math.max(data.skipped - limitSkipped - duplicateSkipped - emptySkipped, 0);
      const unsavedWords = data.unsavedWords ?? [];

      if (data.success > 0) {
        toast.success(`Imported ${data.success} of ${data.total} words successfully.`);
      }
      if (duplicateSkipped > 0) {
        toast.info(`Skipped ${duplicateSkipped} duplicate word${duplicateSkipped !== 1 ? "s" : ""}.`);
      }
      if (limitSkipped > 0) {
        toast.warning(
          `Saved ${data.success} word${data.success !== 1 ? "s" : ""}. ${limitSkipped} more hit today's free vocabulary limit.`,
        );
      }
      if (otherSkipped > 0) {
        toast.info(`Skipped ${otherSkipped} empty or invalid entr${otherSkipped === 1 ? "y" : "ies"}.`);
      }
      if (data.failed > 0) {
        toast.warning(`Failed to import ${data.failed} words`);
      }
      void utils.wordbank.getTodayWordCount.invalidate();
      refetch();
      if (limitSkipped > 0 || data.failed > 0) {
        setImportText(unsavedWords.join("\n"));
        setShowImportDialog(true);
      } else {
        setShowImportDialog(false);
        setImportText("");
      }
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
  const uploadDocumentMutation = trpc.document.uploadAndExtractVocabulary.useMutation();
  const ocrMutation = trpc.ocr.extractVocabularyFromImage.useMutation();

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
      const masteryLevel =
        (word as { masteryLevel?: "learning" | "familiar" | "mastered" }).masteryLevel ||
        (isMastered ? "mastered" : "learning");
      const matchesMasteryFilter =
        masteryFilter !== "all"
          ? masteryLevel === masteryFilter
          : showMastered || masteryLevel !== "mastered";

      return matchesSearch && matchesLanguage && matchesMasteryFilter;
    });
  }, [wordsToDisplay, searchQuery, languageFilter, masteryFilter, showMastered]);

  // Get supported languages plus languages already used by saved words.
  const languages = useMemo(() => {
    const uniqueLangs = new Set(SUPPORTED_WORD_LANGUAGES);
    words.forEach((w) => {
      if (w.targetLanguage) uniqueLangs.add(w.targetLanguage);
    });
    return Array.from(uniqueLangs);
  }, [words]);

  const dueCount = dueWords.length;
  const practiceWordCount = filteredWords.length;

  const handleOpenPracticeModeSelect = () => {
    if (practiceWordCount === 0) {
      toast.info("Import or save at least one word before starting practice.");
      return;
    }

    setShowModeSelect(true);
  };

  const handlePlayAudio = async (word: string, targetLanguage: string) => {
    try {
      const result = await generateAudio.mutateAsync({ word, targetLanguage });
      const audio = new Audio(result.audioUrl);
      await audio.play();
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

  const importWordsNow = (rawWords: string[], emptyMessage: string) => {
    const words = parseWordImportText(rawWords.join("\n"));
    if (words.length === 0) {
      toast.error(emptyMessage);
      return 0;
    }

    if (bulkImportWords.isPending) {
      toast.info("An import is already running. Please wait for it to finish.");
      return 0;
    }

    setImportText(words.join("\n"));
    bulkImportWords.mutate({
      words,
      targetLanguage: getImportTargetLanguage(),
    });
    return words.length;
  };

  const readFileAsBase64 = (file: File) =>
    new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const base64Data = reader.result?.toString().split(",")[1];
        if (!base64Data) {
          reject(new Error("Failed to read file"));
          return;
        }
        resolve(base64Data);
      };
      reader.onerror = () => reject(new Error("Failed to read file"));
      reader.readAsDataURL(file);
    });

  const getResolvedMimeType = (file: File) => {
    if (file.type) return file.type;
    const extension = file.name.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return "application/pdf";
      case "docx":
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      case "xlsx":
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      case "txt":
        return "text/plain";
      case "csv":
        return "text/csv";
      default:
        return "";
    }
  };

  // Import handlers
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const mimeType = getResolvedMimeType(file);
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "text/plain",
      "text/csv",
    ];

    if (!validTypes.includes(mimeType)) {
      toast.error("Please upload a PDF, Word (.docx), Excel (.xlsx), TXT, or CSV file");
      event.target.value = "";
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      event.target.value = "";
      return;
    }

    setIsProcessingImportFile(true);
    setUploadedImportFileName(file.name);

    try {
      if (mimeType === "text/plain" || mimeType === "text/csv") {
        const importedCount = importWordsNow(
          [await file.text()],
          `No words found in ${file.name}`,
        );
        if (importedCount > 0) {
          toast.success(`Importing ${importedCount} words from ${file.name}`);
        }
      } else {
        const base64Data = await readFileAsBase64(file);
        const data = await uploadDocumentMutation.mutateAsync({
          fileData: base64Data,
          fileName: file.name,
          mimeType,
          targetLanguage: getImportTargetLanguage(),
          maxWords: 100,
        });
        const importedCount = importWordsNow(
          data.vocabularyWords.map((item) => item.word),
          `No vocabulary found in ${file.name}`,
        );
        if (importedCount > 0) {
          toast.success(`Extracted and importing ${importedCount} words from ${file.name}`);
        }
      }
    } catch (error) {
      toast.error("Failed to extract vocabulary: " + (error instanceof Error ? error.message : String(error)));
      setUploadedImportFileName(null);
    } finally {
      setIsProcessingImportFile(false);
      event.target.value = "";
    }
  };

  const handlePhotoUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const invalidFile = files.find(file => !file.type.startsWith("image/") || file.size > 10 * 1024 * 1024);
    if (invalidFile) {
      toast.error("Please upload image files under 10MB each");
      event.target.value = "";
      return;
    }

    setIsProcessingImportPhoto(true);

    try {
      const extractedWords: string[] = [];

      for (const file of files) {
        const base64Data = await readFileAsBase64(file);
        const data = await ocrMutation.mutateAsync({
          imageBase64: base64Data,
          mimeType: file.type || "image/jpeg",
          targetLanguage: getImportTargetLanguage(),
        });
        extractedWords.push(...data.vocabulary);
      }

      const importedCount = importWordsNow(
        extractedWords,
        "No vocabulary found in the selected photo.",
      );
      if (importedCount > 0) {
        toast.success(`Extracted and importing ${importedCount} words from ${files.length} photo${files.length > 1 ? "s" : ""}`);
      }
    } catch (error) {
      toast.error("Failed to extract vocabulary from photo: " + (error instanceof Error ? error.message : String(error)));
    } finally {
      setIsProcessingImportPhoto(false);
      event.target.value = "";
    }
  };

  const handleImportPaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const pastedText = e.clipboardData.getData("text");
    if (!pastedText) return;

    e.preventDefault();
    const target = e.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;

    setImportText((current) => {
      const nextText = `${current.slice(0, start)}${pastedText}${current.slice(end)}`;
      window.requestAnimationFrame(() => {
        const cursor = start + pastedText.length;
        target.setSelectionRange(cursor, cursor);
      });
      return nextText;
    });
  };

  const handleImport = () => {
    if (!importText.trim()) {
      toast.error("Please provide words to import");
      return;
    }

    const words = parseWordImportText(importText);

    if (words.length === 0) {
      toast.error("No valid words found. Enter one word per line.");
      return;
    }

    // Use current language filter or default to Spanish
    const targetLanguage = getImportTargetLanguage();
    if (todayWordCount?.limit !== null && todayWordCount?.limit !== undefined) {
      const remaining = Math.max(todayWordCount.limit - todayWordCount.count, 0);
      if (remaining === 0) {
        toast.warning("You've reached today's free vocabulary save limit. The words will stay here so you can import them after the reset or upgrade.");
        return;
      }
      if (words.length > remaining) {
        toast.info(
          `Your free plan can save ${remaining} more word${remaining !== 1 ? "s" : ""} today. The rest will stay in this import box.`,
        );
      }
    }
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
    <div className="min-h-screen" style={{ background: 'linear-gradient(180deg, #E8DEF8 0%, #E0E7F8 30%, #D5F0EC 60%, #EDE5F5 100%)' }}>
      {/* Mobile nav — hamburger (right) over banner */}
      <MobileNav title="" darkBg />
      {/* Back button top-left */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => window.history.back()}
        className="fixed top-4 left-4 z-50 h-11 w-11 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-all"
      >
        <ArrowLeft className="h-5 w-5 text-white drop-shadow-md" />
      </Button>

      {/* Aurora Header (HTML/CSS) */}
      <div
        className="relative w-full overflow-hidden flex flex-col items-center justify-center text-center"
        style={{
          height: "200px",
          background: "linear-gradient(135deg, #2d1b4e 0%, #3b2667 15%, #4a3580 25%, #3d4a8a 40%, #2e6b7a 55%, #3a8b7c 70%, #4aab7e 85%, #6bc68d 100%)",
        }}
      >
        {/* Aurora glow overlays */}
        <div className="absolute inset-0 opacity-40" style={{
          background: "radial-gradient(ellipse 80% 50% at 20% 50%, rgba(120,200,150,0.5) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 30%, rgba(150,120,220,0.4) 0%, transparent 70%), radial-gradient(ellipse 70% 50% at 50% 80%, rgba(100,180,200,0.3) 0%, transparent 70%)"
        }} />
        {/* Sparkles */}
        <div className="absolute top-6 right-1/4 w-1.5 h-1.5 bg-white rounded-full animate-pulse opacity-80" />
        <div className="absolute top-10 right-1/3 w-1 h-1 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: "0.5s" }} />
        <div className="absolute top-4 left-1/3 w-1 h-1 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-8 right-1/4 w-1.5 h-1.5 bg-white/50 rounded-full animate-pulse" style={{ animationDelay: "0.3s" }} />
        <svg className="absolute top-5 right-[30%] w-4 h-4 text-white/80 animate-pulse" viewBox="0 0 24 24" fill="currentColor" style={{ animationDelay: "0.7s" }}>
          <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z" />
        </svg>
        <svg className="absolute top-8 right-[22%] w-3 h-3 text-white/60 animate-pulse" viewBox="0 0 24 24" fill="currentColor" style={{ animationDelay: "1.2s" }}>
          <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z" />
        </svg>

        <div className="relative z-10 flex flex-col items-center px-4">
          <div className="mb-3 text-5xl">📖</div>
          <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight drop-shadow-lg">
            My Wordbank
          </h1>
          <p className="mt-2 text-sm text-white/80 drop-shadow">
            Practice and master your saved vocabulary
          </p>
        </div>
      </div>

      <div className="container max-w-5xl mx-auto px-4 pb-8 -mt-4 relative z-10">

        {/* Stats Cards - matching mockup */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 text-center shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Total Words</p>
              <p className="text-3xl font-bold text-purple-600">{words.length}</p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 text-center shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Accuracy</p>
              <p className="text-3xl font-bold text-blue-600">{stats.accuracy}%</p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 text-center shadow-sm">
              <p className="text-xs text-gray-500 mb-1">XP Earned</p>
              <p className="text-3xl font-bold text-emerald-500">{stats.totalXpEarned.toLocaleString()}</p>
            </div>
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-4 text-center shadow-sm">
              <p className="text-xs text-gray-500 mb-1">Mastered</p>
              <p className="text-3xl font-bold text-amber-500">
                {stats.masteryDistribution.find((m) => m.level === "mastered")?.count || 0}
              </p>
            </div>
          </div>
        )}

        {/* Create Story from Words CTA - matching mockup */}
        {words.length >= 5 && (
          <div
            className="mb-6 rounded-2xl p-5 cursor-pointer transition-all hover:shadow-lg hover:scale-[1.005] flex items-center justify-between"
            onClick={handleCreateStoryFromWords}
            style={{ background: 'linear-gradient(135deg, #E9D5FF 0%, #DBEAFE 50%, #D1FAE5 100%)' }}
          >
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #8B5CF6, #6366F1)' }}>
                <Wand2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-purple-800" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                  Create a Story with My Words ✨
                </h3>
                <p className="text-sm text-purple-600/70">
                  Turn your {words.length} saved words into a personalized learning story
                </p>
              </div>
            </div>
            <Sparkles className="h-6 w-6 text-purple-400" />
          </div>
        )}

        {/* Search and Filters - matching mockup */}
        <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-5 mb-6 shadow-sm">
          {/* Due for Review badge */}
          {dueCount > 0 && (
            <div className="flex justify-end mb-3">
              <span className="bg-red-500 text-white text-sm font-semibold px-3 py-1 rounded-lg">
                {dueCount} Due for Review
              </span>
            </div>
          )}

          {/* Search bar */}
          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <Input
              placeholder="Search words, translations, or pinyin..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-12 h-12 text-base rounded-xl border-purple-200 focus:border-purple-400 focus:ring-purple-300"
            />
          </div>

          {/* Filter pills */}
          <div className="flex flex-wrap gap-2 mb-4" data-tutorial="wordbank-filters">
            <Select value={languageFilter} onValueChange={setLanguageFilter}>
              <SelectTrigger className="w-auto min-w-[140px] rounded-full border-gray-300 h-9 text-sm">
                <SelectValue placeholder="All Languages" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Languages</SelectItem>
                {languages.map((lang) => (
                  <SelectItem key={lang} value={lang}>{lang}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={masteryFilter} onValueChange={setMasteryFilter}>
              <SelectTrigger className="w-auto min-w-[120px] rounded-full border-gray-300 h-9 text-sm">
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
              className={`rounded-full h-9 text-sm gap-2 ${showDueOnly ? 'bg-purple-600 hover:bg-purple-700' : 'border-gray-300'}`}
            >
              📅 Due for Review
              {dueCount > 0 && (
                <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">{dueCount}</span>
              )}
            </Button>

            <Button
              variant={showMastered ? "default" : "outline"}
              onClick={() => setShowMastered(!showMastered)}
              className={`rounded-full h-9 text-sm gap-1 ${showMastered ? 'bg-purple-800 hover:bg-purple-900 text-white' : 'border-gray-300'}`}
            >
              ✓ Show Mastered
            </Button>

            <Button
              variant="outline"
              onClick={() => setLocation("/srs-stats")}
              className="rounded-full h-9 text-sm gap-2 border-gray-300"
            >
              <BarChart3 className="w-4 h-4" />
              Statistics
            </Button>
          </div>

          {/* Export Buttons */}
          <div className="flex gap-2 justify-end">
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportCSV}
              disabled={filteredWords.length === 0 || isExportingCSV}
              className="rounded-full text-sm gap-2 border-gray-300"
            >
              <FileDown className="w-4 h-4" />
              Export CSV
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportPDF}
              disabled={filteredWords.length === 0 || exportPDFMutation.isPending}
              className="rounded-full text-sm gap-2 border-gray-300"
            >
              <Download className="w-4 h-4" />
              Export PDF
            </Button>
          </div>
        </div>

        {/* Ready to Practice Banner - matching mockup gradient */}
        {(dueWords.length > 0 || filteredWords.filter(w => (w.easinessFactor ?? 0) < 2500 || (w.interval ?? 0) < 30).length > 0 || suggestions.length > 0) && (
          <div className="mb-6 rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #6366F1 30%, #0EA5E9 60%, #10B981 100%)' }}>
            {/* Sparkle overlay */}
            <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'radial-gradient(circle at 20% 50%, white 1px, transparent 1px), radial-gradient(circle at 80% 30%, white 1px, transparent 1px), radial-gradient(circle at 60% 80%, white 1px, transparent 1px)', backgroundSize: '100px 100px, 80px 80px, 120px 120px' }} />
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 relative z-10">
              <div>
                <h3 className="text-2xl font-bold mb-1" style={{ fontFamily: 'Fredoka, sans-serif' }}>Ready to Practice?</h3>
                <p className="text-white/80">
                  {dueWords.length > 0
                    ? `${dueWords.length} word${dueWords.length !== 1 ? 's' : ''} due for review`
                    : `${filteredWords.filter(w => (w.easinessFactor ?? 0) < 2500 || (w.interval ?? 0) < 30).length} words available to practice`
                  }
                </p>
                {suggestions.length > 0 && (
                  <p className="text-white/60 text-sm mt-1">
                    {suggestions.length} word{suggestions.length !== 1 ? 's' : ''} with 90%+ accuracy — almost mastered!
                  </p>
                )}
              </div>
              <div className="flex items-center gap-3">
                {/* Word chips */}
                {suggestions.slice(0, 3).map((s) => (
                  <span key={s.id} className="bg-white/20 backdrop-blur-sm rounded-full px-3 py-1 text-sm">
                    {s.word} ({s.accuracy}%)
                  </span>
                ))}
                <Button
                  size="lg"
                  onClick={handleOpenPracticeModeSelect}
                  disabled={practiceWordCount === 0}
                  className="bg-white text-purple-700 hover:bg-white/90 rounded-full font-bold px-6 shadow-lg"
                >
                  <Play className="w-5 h-5 mr-2" />
                  Start Practice
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Import + Action Buttons */}
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2" data-tutorial="wordbank-import">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowImportDialog(true)}
              className="rounded-full gap-2 bg-white/80 border-gray-300"
            >
              <Upload className="h-4 w-4" />
              Import Words
            </Button>
            <Button
              variant={selectMode ? "default" : "outline"}
              size="sm"
              onClick={toggleSelectMode}
              className={`rounded-full gap-2 ${selectMode ? 'bg-purple-600 hover:bg-purple-700 text-white' : 'bg-white/80 border-gray-300'}`}
            >
              {selectMode ? <CheckSquare className="h-4 w-4" /> : <Square className="h-4 w-4" />}
              {selectMode ? "Exit Select" : "Select"}
            </Button>
            {selectMode && (
              <Button
                variant="outline"
                size="sm"
                onClick={selectedWords.size === filteredWords.length ? clearSelection : selectAll}
                className="rounded-full gap-2 text-purple-600 border-purple-300 hover:bg-purple-50"
              >
                {selectedWords.size === filteredWords.length ? "Deselect All" : "Select All"}
              </Button>
            )}
          </div>
          <Button
            size="sm"
            onClick={handleOpenPracticeModeSelect}
            disabled={practiceWordCount === 0}
            className="rounded-full gap-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 text-white"
          >
            <Dumbbell className="h-4 w-4" />
            Practice Now
          </Button>
        </div>

        {/* Word List - matching mockup card style */}
        <div className="space-y-3">
          {filteredWords.length === 0 ? (
            <div className="bg-white/90 backdrop-blur-sm rounded-2xl p-12 text-center shadow-sm">
              <BookOpen className="w-16 h-16 mx-auto text-gray-300 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">No words found</h3>
              <p className="text-gray-500">
                {searchQuery || languageFilter !== "all" || masteryFilter !== "all"
                  ? "Try adjusting your search or filters"
                  : "Start saving words from stories to build your vocabulary!"}
              </p>
            </div>
          ) : (
            filteredWords.map((word) => {
              const isMastered = (word.easinessFactor ?? 0) >= 2500 && (word.interval ?? 0) >= 30;
              const accuracy = (word.correctCount ?? 0) + (word.incorrectCount ?? 0) > 0
                ? Math.round(((word.correctCount ?? 0) / ((word.correctCount ?? 0) + (word.incorrectCount ?? 0))) * 100)
                : null;
              const isSelected = selectMode && selectedWords.has(word.id);

              return (
                <div
                  key={word.id}
                  className={`bg-white/90 backdrop-blur-sm rounded-2xl p-5 shadow-sm transition-all hover:shadow-md ${
                    isSelected ? 'ring-2 ring-purple-500' : ''
                  } ${isMastered ? 'border-l-4 border-l-green-400' : 'border-l-4 border-l-purple-400'}`}
                >
                  <div className="flex items-start gap-4">
                    {selectMode && (
                      <div className="pt-2">
                        <Checkbox
                          checked={selectedWords.has(word.id)}
                          onCheckedChange={() => toggleWordSelection(word.id)}
                          className="h-6 w-6"
                        />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      {/* Word header row */}
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-2xl font-bold text-gray-900">{word.word}</h3>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handlePlayAudio(word.word, word.targetLanguage)}
                          disabled={generateAudio.isPending}
                          className="h-8 w-8 p-0 text-gray-500 hover:text-purple-600"
                        >
                          <Volume2 className="w-5 h-5" />
                        </Button>
                        {isMastered ? (
                          <Badge className="bg-green-100 text-green-700 border-green-300 text-xs px-2 py-0.5">
                            ✓ Mastered
                          </Badge>
                        ) : (
                          <Badge className="bg-blue-50 text-blue-700 border-blue-200 text-xs px-2 py-0.5">
                            🌱 Learning
                          </Badge>
                        )}
                        {(word.correctCount ?? 0) + (word.incorrectCount ?? 0) > 0 && (
                          <span className="text-xs text-gray-400">{word.repetitions ?? 0} reviews</span>
                        )}
                      </div>

                      {/* Translation + pinyin */}
                      <p className="text-gray-500 text-base mb-2">
                        {word.pinyin && <span className="mr-2">{word.pinyin}</span>}
                        {word.translation}
                      </p>

                      {/* Example sentence */}
                      {word.exampleSentences && word.exampleSentences.length > 0 && (
                        <p className="text-sm text-gray-500 italic mb-2">
                          {word.exampleSentences[0]}
                        </p>
                      )}

                      {/* Meta row */}
                      <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                        <span>{word.targetLanguage}</span>
                        <span>•</span>
                        <span>{accuracy !== null ? `${accuracy}% accuracy` : 'Not practiced yet'}</span>
                        <span>•</span>
                        <span>Saved {new Date(word.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</span>
                        {word.nextReviewDate && (
                          <>
                            <span>•</span>
                            <span className="text-blue-500">Next review: {new Date(word.nextReviewDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      {isMastered ? (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateMastery(word.id, "need_practice")}
                          className="rounded-full text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 border-blue-300"
                        >
                          🔄 Reset to Learning
                        </Button>
                      ) : (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleUpdateMastery(word.id, "mastered")}
                          className="rounded-full text-xs text-teal-600 hover:text-teal-700 hover:bg-teal-50 border-teal-300"
                        >
                          ✓ Mark Mastered
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleRemoveWord(word.id)}
                        className="text-purple-400 hover:text-purple-600 hover:bg-purple-50 h-8 w-8 p-0"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Quiz Mode Selection Dialog - matching wb4.png mockup */}
        <Dialog open={showModeSelect} onOpenChange={setShowModeSelect}>
          <DialogContent className="max-w-xl p-10">
            <DialogHeader>
              <DialogTitle className="text-center text-3xl font-extrabold text-gray-900">Choose Practice Mode</DialogTitle>
              <DialogDescription className="text-center text-lg text-gray-500 mt-2">
                Select how you'd like to practice your vocabulary
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-5 mt-8">
              <button
                className="w-full flex items-center gap-6 p-6 rounded-2xl border-[3px] border-purple-300 bg-purple-50/60 hover:bg-purple-100/80 transition-all text-left"
                onClick={() => {
                  setSelectedQuizMode("flashcard");
                  setShowModeSelect(false);
                  setShowPractice(true);
                }}
              >
                <div className="w-[72px] h-[72px] rounded-full bg-purple-500 flex items-center justify-center shrink-0 shadow-lg shadow-purple-200">
                  <BookOpen className="w-9 h-9 text-white" />
                </div>
                <div>
                  <div className="font-extrabold text-xl text-gray-900">Flashcard Mode</div>
                  <div className="text-base text-gray-500 mt-1">Flip cards to test your memory</div>
                </div>
              </button>
              <button
                className="w-full flex items-center gap-6 p-6 rounded-2xl border-[3px] border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100/80 transition-all text-left"
                onClick={() => {
                  setSelectedQuizMode("multiple_choice");
                  setShowModeSelect(false);
                  setShowPractice(true);
                }}
              >
                <div className="w-[72px] h-[72px] rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-lg shadow-emerald-200">
                  <CheckCircle2 className="w-9 h-9 text-white" />
                </div>
                <div>
                  <div className="font-extrabold text-xl text-gray-900">Multiple Choice</div>
                  <div className="text-base text-gray-500 mt-1">Pick the correct translation</div>
                </div>
              </button>
              <button
                className="w-full flex items-center gap-6 p-6 rounded-2xl border-[3px] border-blue-300 bg-blue-50/60 hover:bg-blue-100/80 transition-all text-left"
                onClick={() => {
                  setSelectedQuizMode("fill_in_blank");
                  setShowModeSelect(false);
                  setShowPractice(true);
                }}
              >
                <div className="w-[72px] h-[72px] rounded-full bg-blue-500 flex items-center justify-center shrink-0 shadow-lg shadow-blue-200">
                  <Pencil className="w-9 h-9 text-white" />
                </div>
                <div>
                  <div className="font-extrabold text-xl text-gray-900">Fill in the Blank</div>
                  <div className="text-base text-gray-500 mt-1">Type the correct answer</div>
                </div>
              </button>
              <button
                className="w-full text-center text-gray-500 hover:text-gray-700 py-3 text-lg font-medium underline-offset-2 hover:underline"
                onClick={() => setShowModeSelect(false)}
              >
                Cancel
              </button>
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
                count={Math.min(practiceWordCount, 10)}
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

        {/* Import Words Dialog - matching mockup */}
        <Dialog open={showImportDialog} onOpenChange={setShowImportDialog}>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle className="text-xl font-bold">Bulk Import Words</DialogTitle>
              <DialogDescription>
                Import multiple words at once. Paste words, upload a file, or extract vocabulary from photos.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 mt-4">
              <div>
                <label className="text-sm font-bold mb-1 block">
                  Target Language: {getImportTargetLanguage()}
                </label>
                <p className="text-xs text-gray-400">
                  Change the language filter above to import words for a different language.
                </p>
                {todayWordCount?.limit !== null && todayWordCount?.limit !== undefined && (
                  <p className="mt-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700">
                    Free plan: {todayWordCount.count}/{todayWordCount.limit} vocabulary saves used today. Extra extracted words stay here for later.
                  </p>
                )}
              </div>
              <div>
                <label className="text-sm font-bold mb-2 block">Paste Words</label>
                <Textarea
                  placeholder={"hola\nmundo\namigo\ncasa\nlibro\n\nor: hola, mundo, amigo"}
                  value={importText}
                  onChange={(e) => setImportText(e.target.value)}
                  onPaste={handleImportPaste}
                  rows={8}
                  className="font-mono border-purple-200 focus:border-purple-400 focus:ring-purple-300 rounded-xl"
                />
              </div>
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-gray-200" />
                <span className="text-sm text-gray-400">OR</span>
                <div className="flex-1 border-t border-gray-200" />
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.docx,.xlsx,.txt,.csv"
                  onChange={handleFileUpload}
                  className="hidden"
                />
                <input
                  ref={photoInputRef}
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handlePhotoUpload}
                  className="hidden"
                />
                <Button
                  variant="outline"
                  type="button"
                  disabled={isProcessingImportFile || bulkImportWords.isPending}
                  onClick={() => fileInputRef.current?.click()}
                  className="h-auto w-full justify-start rounded-xl border-gray-300 px-4 py-3 text-left"
                >
                  {isProcessingImportFile ? (
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  ) : (
                    <FileText className="mr-3 h-5 w-5" />
                  )}
                  <span>
                    <span className="block font-semibold">Upload File</span>
                    <span className="block text-xs text-muted-foreground">PDF, Word, Excel, TXT, CSV</span>
                  </span>
                </Button>
                <Button
                  variant="outline"
                  type="button"
                  disabled={isProcessingImportPhoto || bulkImportWords.isPending}
                  onClick={() => photoInputRef.current?.click()}
                  className="h-auto w-full justify-start rounded-xl border-gray-300 px-4 py-3 text-left"
                >
                  {isProcessingImportPhoto ? (
                    <Loader2 className="mr-3 h-5 w-5 animate-spin" />
                  ) : (
                    <Camera className="mr-3 h-5 w-5" />
                  )}
                  <span>
                    <span className="block font-semibold">Upload Photo</span>
                    <span className="block text-xs text-muted-foreground">Notes, worksheets, textbook pages</span>
                  </span>
                </Button>
              </div>
              {uploadedImportFileName && (
                <div className="flex items-center gap-2 rounded-lg border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-700">
                  <FileText className="h-4 w-4" />
                  <span className="min-w-0 flex-1 truncate">{uploadedImportFileName}</span>
                </div>
              )}
              <div className="flex gap-3 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowImportDialog(false);
                    setImportText("");
                    setUploadedImportFileName(null);
                  }}
                  className="rounded-xl"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleImport}
                  disabled={bulkImportWords.isPending || isProcessingImportFile || isProcessingImportPhoto || !importText.trim()}
                  className="rounded-xl bg-purple-600 hover:bg-purple-700 text-white"
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
              onClick={() => handleBulkAction("mastered")}
              disabled={updateMastery.isPending}
              className="bg-teal-500 hover:bg-teal-600 text-white"
            >
              <CheckCircle2 className="h-4 w-4 mr-2" />
              Mark Mastered
            </Button>
            <Button
              size="sm"
              onClick={() => handleBulkAction("learning")}
              disabled={updateMastery.isPending}
              className="bg-blue-500 hover:bg-blue-600 text-white"
            >
              Reset to Learning
            </Button>
            <Button
              size="sm"
              onClick={() => handleBulkAction("delete")}
              disabled={removeWord.isPending}
              className="bg-purple-500 hover:bg-purple-600 text-white"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Upgrade Trigger #4: Personalized Story Overlay */}
      <PersonalizedStoryOverlay
        open={showPersonalizedOverlay}
        onOpenChange={setShowPersonalizedOverlay}
      />

      <PageOnboardingTutorial
        storageKey="wordbankTutorialSeen"
        title="Wordbank"
        steps={[
          {
            title: "Find words by language",
            description: "Use the language filter to switch between supported languages, even before a language has saved words.",
          },
          {
            title: "Import and select words",
            description: "Paste words separated by new lines or commas, upload a text file, and use Select next to Import Words for bulk actions.",
          },
          {
            title: "Practice anytime",
            description: "Start a practice session from this page when words are due, or return here from a story. After this tour, use the Tutorial button at the bottom whenever you need it again.",
          },
        ]}
      />
    </div>
  );
}
