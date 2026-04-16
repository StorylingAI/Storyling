import { useState, useMemo, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Loader2, Upload, ArrowRight, Sparkles, BookOpen, Headphones, Film, ArrowLeft, FileText, X, Volume2, Camera, Check } from "lucide-react";
import { APP_TITLE, APP_LOGO, getLoginUrl } from "@/const";
import { DEFAULT_FILM_NARRATOR_GENDER, DEFAULT_FILM_VOICE_TYPE } from "@shared/filmDefaults";
import { LATAM_SPANISH_LABEL, SPAIN_SPANISH_LABEL } from "@shared/languagePreferences";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { VoicePreviewButtonEnhanced } from "@/components/VoicePreviewButtonEnhanced";
import { MusicPreviewButton } from "@/components/MusicPreviewButton";
import { SubtitlePreview } from "@/components/SubtitlePreview";
import { PaywallModal } from "@/components/upgrade/PaywallModal";
import type { PaywallHeadline } from "@/components/upgrade/PaywallModal";
import { PersonalizedStoryOverlay } from "@/components/upgrade/PersonalizedStoryOverlay";
import { toast } from "sonner";
import { useLocation } from "wouter";
import { MobileNav } from "@/components/MobileNav";


const LANGUAGES = [
  "English",
  "Spanish",
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

const TRANSLATION_LANGUAGES = [
  { value: "en", label: "English" },
  { value: "zh", label: "中文 (Chinese)" },
  { value: "es", label: "Español (Spanish)" },
  { value: "fr", label: "Français (French)" },
  { value: "de", label: "Deutsch (German)" },
  { value: "ja", label: "日本語 (Japanese)" },
  { value: "ko", label: "한국어 (Korean)" },
  { value: "pt", label: "Português (Portuguese)" },
  { value: "ru", label: "Русский (Russian)" },
  { value: "ar", label: "العربية (Arabic)" },
  { value: "it", label: "Italiano (Italian)" },
  { value: "nl", label: "Nederlands (Dutch)" },
  { value: "he", label: "עברית (Hebrew)" },
  { value: "fa", label: "فارسی (Persian)" },
  { value: "tr", label: "Türkçe (Turkish)" },
  { value: "hi", label: "हिन्दी (Hindi)" },
];

const PROFICIENCY_LEVELS = ["A2", "B1", "B2", "C1", "C2"];

const THEMES = [
  "Comedy",
  "Romance",
  "Adventure",
  "Mystery",
  "Sci-Fi",
  "Fantasy",
  "Historical",
  "Thriller",
  "Slice-of-Life",
  "Travel",
];

const VOICE_TYPES = [
  "Warm & Friendly",
  "Professional Narrator",
  "Energetic & Upbeat",
  "Calm & Soothing",
  "Dramatic & Expressive",
];

const CINEMATIC_STYLES = [
  "Studio Ghibli Anime",
  "Photorealistic Drama",
  "Playful Animation",
  "Documentary Style",
  "Cinematic Film",
];

/* ─── Step Indicator ─── */
function StepIndicator({
  number,
  label,
  active,
  completed,
}: {
  number: number;
  label: string;
  active: boolean;
  completed: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className={`flex items-center justify-center rounded-full font-semibold transition-all duration-300 ${
          active
            ? "h-9 w-9 text-sm bg-gradient-to-br from-purple-600 to-teal-500 text-white shadow-lg shadow-purple-500/25"
            : completed
            ? "h-8 w-8 text-xs bg-purple-500 text-white"
            : "h-8 w-8 text-xs border border-gray-300/50 bg-white/60 text-gray-400"
        }`}
      >
        {completed ? <Check className="h-3.5 w-3.5" /> : number}
      </div>
      <span
        className={`text-[10px] font-medium ${
          active ? "text-gray-700" : completed ? "text-gray-500" : "text-gray-400"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

/* ─── Sparkle Particles for the aurora header ─── */
function SparkleParticles() {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: 25 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full bg-white animate-pulse"
          style={{
            width: `${Math.random() * 4 + 1}px`,
            height: `${Math.random() * 4 + 1}px`,
            top: `${Math.random() * 100}%`,
            left: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.7 + 0.2,
            animationDelay: `${Math.random() * 3}s`,
            animationDuration: `${Math.random() * 2 + 2}s`,
          }}
        />
      ))}
    </div>
  );
}

/* ─── Background Sparkle Particles for the lavender area ─── */
function BackgroundSparkles() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
      {Array.from({ length: 20 }).map((_, i) => (
        <div
          key={i}
          className="absolute rounded-full animate-pulse"
          style={{
            width: `${Math.random() * 2.5 + 1}px`,
            height: `${Math.random() * 2.5 + 1}px`,
            top: `${35 + Math.random() * 60}%`,
            left: `${Math.random() * 100}%`,
            opacity: Math.random() * 0.25 + 0.08,
            backgroundColor: ['#C4B5FD', '#A5B4FC', '#99F6E4', '#D8B4FE'][Math.floor(Math.random() * 4)],
            animationDelay: `${Math.random() * 5}s`,
            animationDuration: `${Math.random() * 3 + 3}s`,
          }}
        />
      ))}
    </div>
  );
}

export default function CreateStory() {
  const { user, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [generatingContentId, setGeneratingContentId] = useState<number | null>(null);
  const completionToastShownRef = useRef(false);

  // Read URL params for pre-filling from level test
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const languageParam = urlParams.get('language');
  const levelParam = urlParams.get('level');

  // Step 1 state
  const [targetLanguage, setTargetLanguage] = useState(languageParam || "");
  const [spanishDialect, setSpanishDialect] = useState<"spain" | "latam" | "">("")
  const [proficiencyLevel, setProficiencyLevel] = useState(levelParam || "");
  const [vocabularyText, setVocabularyText] = useState("");
  const [topicPrompt, setTopicPrompt] = useState("");
  const [translationLanguage, setTranslationLanguage] = useState("");
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isProcessingPhoto, setIsProcessingPhoto] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Get user's preferred translation language
  const { data: userData } = trpc.auth.me.useQuery();
  
  // Set translation language from user preference on mount
  useEffect(() => {
    if (userData?.preferredTranslationLanguage && !translationLanguage) {
      setTranslationLanguage(userData.preferredTranslationLanguage);
    }
  }, [userData, translationLanguage]);

  // Step 2 state
  const [mode, setMode] = useState<"podcast" | "film" | "">("");

  // Step 3 state
  const [theme, setTheme] = useState("");
  const [storyLength, setStoryLength] = useState<"short" | "medium" | "long">("medium");
  const [voiceType, setVoiceType] = useState("");
  const [narratorGender, setNarratorGender] = useState<"male" | "female">("female");
  const [playingPreview, setPlayingPreview] = useState<string | null>(null);
  const [previewAudio, setPreviewAudio] = useState<HTMLAudioElement | null>(null);
  const [cinematicStyle, setCinematicStyle] = useState("");
  const [videoDuration, setVideoDuration] = useState<number>(30);
  const [backgroundMusic, setBackgroundMusic] = useState<string>("none");
  const [musicVolume, setMusicVolume] = useState<number>(20);
  const [selectedMusicTrack, setSelectedMusicTrack] = useState<string>("");
  const [addSubtitles, setAddSubtitles] = useState<boolean>(true);
  const [showPaywallModal, setShowPaywallModal] = useState(false);
  const [paywallHeadline, setPaywallHeadline] = useState<PaywallHeadline>("keep_going");
  const [showPersonalizedOverlay, setShowPersonalizedOverlay] = useState(false);
  const [showFilmUpgradeModal, setShowFilmUpgradeModal] = useState(false);

  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;

  // Check usage stats for feature gating
  const { data: usageStats } = trpc.subscription.getUsageStats.useQuery({ timezone });
  const [subtitleFontSize, setSubtitleFontSize] = useState<"small" | "medium" | "large">("medium");
  const [subtitlePosition, setSubtitlePosition] = useState<"top" | "bottom">("bottom");
  const [subtitleColor, setSubtitleColor] = useState<"white" | "yellow" | "cyan">("white");
  const [subtitleFontFamily, setSubtitleFontFamily] = useState<"Arial" | "Times New Roman" | "Courier New" | "Georgia" | "Verdana">("Arial");
  const [subtitleOutlineThickness, setSubtitleOutlineThickness] = useState<number>(2);
  const [subtitleBackgroundOpacity, setSubtitleBackgroundOpacity] = useState<number>(0);
  const [playingMusicPreview, setPlayingMusicPreview] = useState<string | null>(null);
  const [musicPreviewAudio, setMusicPreviewAudio] = useState<HTMLAudioElement | null>(null);
  
  // Language learning tips
  const learningTips = useMemo(() => [
    "Immersion is key! Try to think in your target language throughout the day.",
    "Practice speaking out loud, even when alone. It builds confidence!",
    "Learn vocabulary in context through stories rather than isolated words.",
    "Consistency beats intensity - 15 minutes daily is better than 2 hours weekly.",
    "Make mistakes! They're proof you're trying and learning.",
    "Watch content in your target language with subtitles in that language.",
    "Connect with native speakers through language exchange apps.",
    "Use spaced repetition to review vocabulary at optimal intervals.",
    "Set realistic goals and celebrate small wins along the way.",
    "Focus on high-frequency words first - they appear in 80% of conversations.",
    "Listen to podcasts or music in your target language during commutes.",
    "Label objects around your home with their names in the target language.",
    "Read children's books first - they use simple, clear language.",
    "Don't translate word-for-word; learn to think in the new language.",
    "Join online communities of learners for motivation and support.",
  ], []);
  
  const [randomTip] = useState(() => 
    learningTips[Math.floor(Math.random() * learningTips.length)]
  );
  const filmNarrationVoiceType = voiceType || DEFAULT_FILM_VOICE_TYPE;
  const filmNarrationGender = narratorGender || DEFAULT_FILM_NARRATOR_GENDER;

  // Compute the effective language string with dialect for Spanish
  const effectiveLanguage = useMemo(() => {
    if (targetLanguage === "Spanish" && spanishDialect) {
      return spanishDialect === "spain" ? SPAIN_SPANISH_LABEL : LATAM_SPANISH_LABEL;
    }
    return targetLanguage;
  }, [targetLanguage, spanishDialect]);

  const canProceedStep1 = useMemo(() => {
    const hasDialect = targetLanguage === "Spanish" ? !!spanishDialect : true;
    return (
      targetLanguage &&
      hasDialect &&
      proficiencyLevel &&
      vocabularyText.trim().split(/[,，、\n]/).map(w => w.trim()).filter(Boolean).length >= 5
    );
  }, [targetLanguage, spanishDialect, proficiencyLevel, vocabularyText]);

  const canProceedStep2 = useMemo(() => {
    return mode !== "";
  }, [mode]);

  const canProceedStep3 = useMemo(() => {
    if (mode === "podcast") {
      return theme && voiceType;
    } else if (mode === "film") {
      return theme && cinematicStyle;
    }
    return false;
  }, [mode, theme, voiceType, cinematicStyle]);

  // State for vocabulary preview dialog
  const [showVocabPreview, setShowVocabPreview] = useState(false);
  const [extractedVocab, setExtractedVocab] = useState<Array<{
    word: string;
    translation?: string;
    level?: number;
    frequency?: string;
    selected: boolean;
  }>>([]);

  const generateMutation = trpc.content.generate.useMutation({
    onSuccess: (data) => {
      setGeneratingContentId(data.contentId);
      completionToastShownRef.current = false;
      toast.success("Content generation started! This may take a few minutes.");
    },
    onError: (error) => {
      toast.error("Failed to start content generation: " + error.message);
    },
  });

  // Poll for content status when generating
  const { data: generatingContent } = trpc.content.getById.useQuery(
    { id: generatingContentId! },
    {
      enabled: generatingContentId !== null,
      refetchInterval: (query) => {
        const content = query.state.data;
        if (content?.status === 'completed' || content?.status === 'failed') {
          return false;
        }
        return 3000;
      },
    }
  );

  // Document upload mutation
  const uploadDocumentMutation = trpc.document.uploadAndExtractVocabulary.useMutation({
    onSuccess: (data) => {
      setExtractedVocab(data.vocabularyWords.map(w => ({
        ...w,
        selected: true
      })));
      setShowVocabPreview(true);
      setUploadedFileName(null);
      setIsUploadingDocument(false);
    },
    onError: (error) => {
      toast.error("Failed to extract vocabulary: " + error.message);
      setIsUploadingDocument(false);
      setUploadedFileName(null);
    },
  });

  // Photo OCR mutation
  const ocrMutation = trpc.ocr.extractVocabularyFromImage.useMutation({
    onSuccess: (data) => {
      if (data.wordCount === 0) {
        toast.error("No vocabulary found in the image. Please try a clearer photo.");
        setIsProcessingPhoto(false);
        return;
      }
      const newWords = data.vocabulary.join(", ");
      setVocabularyText(prev => prev ? `${prev}, ${newWords}` : newWords);
      toast.success(`Extracted ${data.wordCount} words from photo!`);
      setIsProcessingPhoto(false);
    },
    onError: (error) => {
      toast.error("Failed to extract vocabulary from photo: " + error.message);
      setIsProcessingPhoto(false);
    },
  });

  // Navigate when content is ready
  useEffect(() => {
    if (generatingContent?.status === 'completed') {
      if (!completionToastShownRef.current) {
        completionToastShownRef.current = true;
        toast.success("Your content is ready!", {
          description: "You earned 25 XP for creating a new story."
        });
      }
      setLocation(`/content/${generatingContent.id}`);
    } else if (generatingContent?.status === 'failed') {
      toast.error("Content generation failed. Please try again.");
      setGeneratingContentId(null);
    }
  }, [generatingContent, setLocation]);

  /* ═══════════════════════════════════════════════════════
     GENERATING STATE — Magical full-screen experience
     ═══════════════════════════════════════════════════════ */
  if (generatingContentId && generatingContent) {
    const progress = generatingContent.progress || 0;
    const stage = generatingContent.progressStage || "Starting...";

    const getEstimatedTime = () => {
      if (mode === "film") return "2-3 minutes";
      if (mode === "podcast") return "1-2 minutes";
      return "1-2 minutes";
    };

    const tips = [
      "Learn vocabulary in context through stories rather than isolated words — it boosts retention by 3x!",
      "Listening to stories in your target language improves pronunciation naturally.",
      "Repetition is key — revisit your stories to reinforce new vocabulary.",
      "Try creating stories with words you find challenging to memorize.",
      "Mix different themes to keep your learning fresh and engaging.",
    ];
    const tipIndex = Math.abs(generatingContentId) % tips.length;

    return (
      <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center"
        style={{ background: "linear-gradient(160deg, #4a1a7a 0%, #6b3fa0 20%, #4a5eb0 40%, #3a8dc0 60%, #5a7ec0 80%, #7a5ab0 100%)" }}
      >
        <Button
          type="button"
          variant="ghost"
          onClick={() => setLocation("/dashboard")}
          className="fixed left-4 top-4 z-20 h-10 rounded-lg border border-white/15 bg-white/10 px-3 text-white backdrop-blur-md hover:bg-white/20 hover:text-white"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to dashboard
        </Button>

        {/* Animated stars / particles */}
        {Array.from({ length: 30 }).map((_, i) => (
          <div
            key={i}
            className="absolute rounded-full animate-pulse"
            style={{
              width: `${Math.random() * 6 + 2}px`,
              height: `${Math.random() * 6 + 2}px`,
              top: `${Math.random() * 100}%`,
              left: `${Math.random() * 100}%`,
              background: `rgba(255,255,255,${Math.random() * 0.5 + 0.2})`,
              animationDelay: `${Math.random() * 3}s`,
              animationDuration: `${Math.random() * 2 + 1.5}s`,
            }}
          />
        ))}

        {/* Floating glow orbs */}
        <div className="absolute w-64 h-64 rounded-full opacity-20 animate-pulse" style={{
          top: "10%", left: "60%",
          background: "radial-gradient(circle, rgba(180,140,255,0.6) 0%, transparent 70%)",
          animationDuration: "4s",
        }} />
        <div className="absolute w-48 h-48 rounded-full opacity-20 animate-pulse" style={{
          top: "60%", left: "20%",
          background: "radial-gradient(circle, rgba(100,200,220,0.5) 0%, transparent 70%)",
          animationDuration: "3s", animationDelay: "1s",
        }} />
        <div className="absolute w-32 h-32 rounded-full opacity-15 animate-pulse" style={{
          top: "30%", left: "10%",
          background: "radial-gradient(circle, rgba(200,160,255,0.4) 0%, transparent 70%)",
          animationDuration: "5s", animationDelay: "2s",
        }} />

        {/* Main content */}
        <div className="relative z-10 flex flex-col items-center px-6 max-w-lg w-full">

          {/* Booki mascot with glow */}
          <div className="relative mb-8">
            {/* Outer glow ring */}
            <div className="absolute -inset-8 rounded-full animate-spin" style={{
              background: "conic-gradient(from 0deg, transparent, rgba(120,200,255,0.3), transparent, rgba(200,140,255,0.3), transparent)",
              animationDuration: "6s",
              filter: "blur(8px)",
            }} />
            {/* Inner glow */}
            <div className="absolute -inset-4 rounded-full" style={{
              background: "radial-gradient(circle, rgba(255,255,255,0.2) 0%, transparent 70%)",
            }} />
            {/* Sparkle ring */}
            <div className="absolute -inset-6 rounded-full animate-spin" style={{
              animationDuration: "8s",
              animationDirection: "reverse",
            }}>
              <svg className="absolute top-0 left-1/2 w-3 h-3 text-yellow-300 -translate-x-1/2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z" />
              </svg>
              <svg className="absolute bottom-0 right-0 w-2 h-2 text-cyan-300" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z" />
              </svg>
              <svg className="absolute top-1/2 left-0 w-2.5 h-2.5 text-purple-300 -translate-y-1/2" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z" />
              </svg>
            </div>
            {/* Mascot */}
            <div className="relative" style={{
              filter: "drop-shadow(0 0 20px rgba(180,140,255,0.5)) drop-shadow(0 0 40px rgba(100,180,255,0.3))",
            }}>
              <img
                src="/storyling-logo.png"
                alt="Storyling"
                className="h-20 w-20 rounded-lg object-contain sm:h-24 sm:w-24"
              />
            </div>
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-4xl font-bold text-white mb-2 tracking-tight animate-pulse" style={{
            textShadow: "0 0 30px rgba(180,140,255,0.5), 0 2px 10px rgba(0,0,0,0.3)",
            animationDuration: "3s",
          }}>
            Crafting your story...
          </h1>

          {/* Stage info */}
          <p className="text-white/70 text-sm mb-8">{stage} • Est. {getEstimatedTime()}</p>

          {/* Progress bar */}
          <div className="w-full max-w-sm mb-8">
            <div className="h-3 rounded-full bg-white/10 backdrop-blur-sm overflow-hidden shadow-inner">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out relative"
                style={{
                  width: `${Math.max(progress, 5)}%`,
                  background: "linear-gradient(90deg, #a855f7, #6366f1, #06b6d4, #a855f7)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 2s linear infinite",
                }}
              >
                {/* Glow on leading edge */}
                <div className="absolute right-0 top-0 bottom-0 w-8 rounded-full" style={{
                  background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.4))",
                }} />
              </div>
            </div>
            <p className="text-white/50 text-xs text-center mt-2">{Math.round(progress)}%</p>
          </div>

          {/* Tip */}
          <div className="w-full max-w-sm bg-white/10 backdrop-blur-md rounded-2xl px-5 py-4 border border-white/10">
            <p className="text-white/90 text-sm">
              <span className="text-purple-300 font-semibold">💡 Tip: </span>
              {tips[tipIndex]}
            </p>
          </div>
        </div>

        {/* Shimmer keyframes */}
        <style>{`
          @keyframes shimmer {
            0% { background-position: 200% 0; }
            100% { background-position: -200% 0; }
          }
        `}</style>
      </div>
    );
  }

  const handleConfirmVocabSelection = () => {
    const selectedWords = extractedVocab
      .filter(w => w.selected)
      .map(w => w.word)
      .join(", ");
    
    if (selectedWords) {
      setVocabularyText(prev => {
        const existing = prev.trim();
        return existing ? `${existing}, ${selectedWords}` : selectedWords;
      });
      toast.success(`Added ${extractedVocab.filter(w => w.selected).length} words to your story!`);
    }
    
    setShowVocabPreview(false);
    setExtractedVocab([]);
  };

  const toggleWordSelection = (index: number) => {
    setExtractedVocab(prev => prev.map((w, i) => 
      i === index ? { ...w, selected: !w.selected } : w
    ));
  };

  const toggleAllWords = () => {
    const allSelected = extractedVocab.every(w => w.selected);
    setExtractedVocab(prev => prev.map(w => ({ ...w, selected: !allSelected })));
  };

  const mergeVocabularyWords = (incomingWords: string[]) => {
    const cleanedWords = incomingWords
      .map(word => word.trim())
      .filter(Boolean);

    if (cleanedWords.length === 0) {
      return 0;
    }

    setVocabularyText(prev => {
      const existingWords = prev
        .split(/[,ï¼Œã€\n]/)
        .map(word => word.trim())
        .filter(Boolean);

      return Array.from(new Set([...existingWords, ...cleanedWords])).join(", ");
    });

    return cleanedWords.length;
  };

  const getResolvedMimeType = (file: File) => {
    if (file.type) {
      return file.type;
    }

    const extension = file.name.split(".").pop()?.toLowerCase();
    switch (extension) {
      case "pdf":
        return "application/pdf";
      case "docx":
        return "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
      case "doc":
        return "application/msword";
      case "txt":
        return "text/plain";
      case "csv":
        return "text/csv";
      case "xlsx":
        return "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet";
      default:
        return file.type;
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const mimeType = getResolvedMimeType(file);
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
      "text/csv",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ];

    if (!validTypes.includes(mimeType)) {
      toast.error("Please upload a PDF, Word, Excel (.xlsx), TXT, or CSV file");
      e.target.value = "";
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File size must be less than 10MB");
      e.target.value = "";
      return;
    }

    if (mimeType === "text/csv") {
      try {
        const text = await file.text();
        const words = text
          .split(/[,\n]/)
          .map(word => word.trim())
          .filter(Boolean);

        if (words.length === 0) {
          toast.error("No words found in the CSV file");
          e.target.value = "";
          return;
        }

        const importedWords = mergeVocabularyWords(words);
        setUploadedFileName(file.name);
        toast.success(`Imported ${importedWords} words from ${file.name}`);
      } catch (error) {
        toast.error("Failed to read CSV file");
      } finally {
        e.target.value = "";
      }
      return;
    }

    if (!targetLanguage) {
      toast.error("Please select a target language first");
      e.target.value = "";
      return;
    }

    setIsUploadingDocument(true);
    setUploadedFileName(file.name);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result?.toString().split(",")[1];
        if (!base64Data) {
          toast.error("Failed to read file");
          setIsUploadingDocument(false);
          return;
        }

        uploadDocumentMutation.mutate({
          fileData: base64Data,
          fileName: file.name,
          mimeType,
          targetLanguage: effectiveLanguage,
          maxWords: 50,
        });
      };
      reader.onerror = () => {
        toast.error("Failed to read file");
        setIsUploadingDocument(false);
        setUploadedFileName(null);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to process file");
      setIsUploadingDocument(false);
      setUploadedFileName(null);
    }

    e.target.value = "";
  };

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast.error("Please upload an image file (JPG, PNG, etc.)");
      e.target.value = "";
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("Image size must be less than 10MB");
      e.target.value = "";
      return;
    }

    setIsProcessingPhoto(true);

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64Data = reader.result?.toString().split(",")[1];
        if (!base64Data) {
          toast.error("Failed to read image");
          setIsProcessingPhoto(false);
          return;
        }

        ocrMutation.mutate({
          imageBase64: base64Data,
          mimeType: file.type || "image/jpeg",
          targetLanguage: effectiveLanguage || undefined,
        });
      };
      reader.onerror = () => {
        toast.error("Failed to read image");
        setIsProcessingPhoto(false);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      toast.error("Failed to process image");
      setIsProcessingPhoto(false);
    }

    e.target.value = "";
  };

  const handleGenerate = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to generate content");
      return;
    }

    if (usageStats && !usageStats.canCreateStory) {
      setPaywallHeadline("go_unlimited");
      setShowPaywallModal(true);
      return;
    }

    generateMutation.mutate({
      targetLanguage: effectiveLanguage,
      proficiencyLevel: proficiencyLevel as "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
      vocabularyText,
      theme,
      topicPrompt,
      translationLanguage: translationLanguage || "en",
      timezone,
      mode: mode as "podcast" | "film",
      storyLength,
      voiceType:
        mode === "podcast"
          ? voiceType
          : mode === "film"
          ? filmNarrationVoiceType
          : undefined,
      narratorGender:
        mode === "podcast"
          ? narratorGender
          : mode === "film"
          ? filmNarrationGender
          : undefined,
      cinematicStyle: mode === "film" ? cinematicStyle : undefined,
      videoDuration: mode === "film" ? videoDuration : undefined,
      backgroundMusic: mode === "film" ? (backgroundMusic as any) : undefined,
      musicVolume: mode === "film" && backgroundMusic !== "none" ? musicVolume : undefined,
      selectedMusicTrack: mode === "film" && backgroundMusic !== "none" ? selectedMusicTrack : undefined,
      addSubtitles: mode === "film" ? addSubtitles : undefined,
      subtitleFontSize: mode === "film" && addSubtitles ? subtitleFontSize : undefined,
      subtitlePosition: mode === "film" && addSubtitles ? subtitlePosition : undefined,
      subtitleColor: mode === "film" && addSubtitles ? subtitleColor : undefined,
    });
  };

  /* ═══════════════════════════════════════════════════════
     MAIN RENDER — Branded Create Flow
     ═══════════════════════════════════════════════════════ */
  return (
    <div className="min-h-screen relative" style={{ background: step === 1 
      ? "linear-gradient(180deg, #DDD5EA 0%, #DCD4E9 15%, #DDD6E8 30%, #DED8E7 50%, #DDD8E6 70%, #DED9E5 85%, #E0DBE4 100%)" 
      : "linear-gradient(180deg, #D8D2E8 0%, #D5D8EA 15%, #D2DDEB 30%, #D0E0EC 50%, #CEE3EB 70%, #CDE5EA 85%, #CCE7E9 100%)" }}>

      {/* Mobile nav — hamburger (right) over banner */}
      <MobileNav title="" darkBg />
      {/* Override: move back button to top-left */}
      <Button
        variant="ghost"
        size="icon"
        onClick={() => window.history.back()}
        className="fixed top-4 left-4 z-50 h-11 w-11 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/40 transition-all"
      >
        <ArrowLeft className="h-5 w-5 text-white drop-shadow-md" />
      </Button>

      {/* ─── Banner Header (HTML/CSS aurora) ─── */}
      <div
        className="relative overflow-hidden flex flex-col items-center justify-center text-center transition-all duration-500"
        style={{
          minHeight: step === 1 ? "200px" : "60px",
          background: "linear-gradient(135deg, #2d1b4e 0%, #3b2667 15%, #4a3580 25%, #3d4a8a 40%, #2e6b7a 55%, #3a8b7c 70%, #4aab7e 85%, #6bc68d 100%)",
        }}
      >
        {/* Aurora glow overlays */}
        <div className="absolute inset-0 opacity-40" style={{
          background: "radial-gradient(ellipse 80% 50% at 20% 50%, rgba(120,200,150,0.5) 0%, transparent 70%), radial-gradient(ellipse 60% 40% at 80% 30%, rgba(150,120,220,0.4) 0%, transparent 70%), radial-gradient(ellipse 70% 50% at 50% 80%, rgba(100,180,200,0.3) 0%, transparent 70%)"
        }} />
        {/* Sparkle dots */}
        <div className="absolute top-6 right-1/4 w-1.5 h-1.5 bg-white rounded-full animate-pulse opacity-80" />
        <div className="absolute top-10 right-1/3 w-1 h-1 bg-white/70 rounded-full animate-pulse" style={{ animationDelay: "0.5s" }} />
        <div className="absolute top-4 left-1/3 w-1 h-1 bg-white/60 rounded-full animate-pulse" style={{ animationDelay: "1s" }} />
        <div className="absolute bottom-8 right-1/4 w-1.5 h-1.5 bg-white/50 rounded-full animate-pulse" style={{ animationDelay: "0.3s" }} />
        {/* 4-point star sparkles */}
        <svg className="absolute top-5 right-[30%] w-4 h-4 text-white/80 animate-pulse" viewBox="0 0 24 24" fill="currentColor" style={{ animationDelay: "0.7s" }}>
          <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z" />
        </svg>
        <svg className="absolute top-8 right-[22%] w-3 h-3 text-white/60 animate-pulse" viewBox="0 0 24 24" fill="currentColor" style={{ animationDelay: "1.2s" }}>
          <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z" />
        </svg>

        {step === 1 && (
          <div className="relative z-10 flex flex-col items-center px-4 py-6">
            {/* Booki mascot */}
            <div className="mb-3 text-5xl">📖</div>
            {/* Title */}
            <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight drop-shadow-lg">
              Your words become worlds.
            </h1>
            {/* Subtitle */}
            <p className="mt-2 text-sm sm:text-base text-white/80 max-w-md drop-shadow">
              Turn your vocabulary into immersive stories with AI-generated podcasts and films.
            </p>
          </div>
        )}
      </div>

      {/* ─── Step Progress Indicator — sits between aurora and content ─── */}
      <div className="relative z-20 -mt-4 mb-6">
        <div className="flex items-center justify-center gap-2 sm:gap-4 px-4">
          <StepIndicator number={1} label="Vocab & Language" active={step === 1} completed={step > 1} />
          <div className={`h-px w-8 sm:w-14 transition-colors duration-300 ${step > 1 ? "bg-purple-400" : "bg-gray-300/40"}`} />
          <StepIndicator number={2} label="Mode" active={step === 2} completed={step > 2} />
          <div className={`h-px w-8 sm:w-14 transition-colors duration-300 ${step > 2 ? "bg-purple-400" : "bg-gray-300/40"}`} />
          <StepIndicator number={3} label="Creative Controls" active={step === 3} completed={false} />
        </div>
      </div>

      {/* ─── Form Content ─── */}
      <section className="px-4 pb-20 relative z-10">
        <div className="mx-auto max-w-2xl">

          {/* ═══ Step 1: Vocab & Language ═══ */}
          {step === 1 && (
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 sm:p-8 animate-bounce-in">
              <div className="text-center mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Step 1: Vocab & Language</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Choose your target language and add at least 5 vocabulary words
                </p>
              </div>

              <div className="space-y-5">
                {/* Target Language */}
                <div className="space-y-2">
                  <Label htmlFor="language" className="text-sm font-semibold text-gray-700">Target Language <span className="text-red-500">*</span></Label>
                  <Select value={targetLanguage} onValueChange={(val) => {
                    setTargetLanguage(val);
                    if (val !== "Spanish") setSpanishDialect("");
                  }}>
                    <SelectTrigger id="language" className="rounded-xl border-gray-200 h-11">
                      <SelectValue placeholder="Select a language" />
                    </SelectTrigger>
                    <SelectContent>
                      {LANGUAGES.map((lang) => (
                        <SelectItem key={lang} value={lang}>
                          {lang}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {targetLanguage === "Spanish" && (
                    <div className="mt-3 space-y-2">
                      <Label className="text-sm text-gray-500">Which Spanish?</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button
                          type="button"
                          variant={spanishDialect === "spain" ? "default" : "outline"}
                          onClick={() => setSpanishDialect("spain")}
                          className={`rounded-xl text-sm h-auto py-3 ${
                            spanishDialect === "spain" ? "bg-gradient-to-r from-purple-600 to-teal-500 text-white border-0" : ""
                          }`}
                        >
                          <span className="flex flex-col items-center gap-1">
                            <span className="text-lg">🇪🇸</span>
                            <span className="font-medium">Spain</span>
                            <span className="text-xs opacity-75">Castellano</span>
                          </span>
                        </Button>
                        <Button
                          type="button"
                          variant={spanishDialect === "latam" ? "default" : "outline"}
                          onClick={() => setSpanishDialect("latam")}
                          className={`rounded-xl text-sm h-auto py-3 ${
                            spanishDialect === "latam" ? "bg-gradient-to-r from-purple-600 to-teal-500 text-white border-0" : ""
                          }`}
                        >
                          <span className="flex flex-col items-center gap-1">
                            <span className="text-lg">🌎</span>
                            <span className="font-medium">Latin America</span>
                            <span className="text-xs opacity-75">Latinoamericano</span>
                          </span>
                        </Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Proficiency Level */}
                <div className="space-y-2">
                  <Label className="text-sm font-semibold text-gray-700">Proficiency Level (CEFR) <span className="text-red-500">*</span></Label>
                  <div className="grid grid-cols-5 gap-2">
                    {PROFICIENCY_LEVELS.map((level) => (
                      <Button
                        key={level}
                        variant={proficiencyLevel === level ? "default" : "outline"}
                        onClick={() => setProficiencyLevel(level)}
                        className={`rounded-full w-full h-10 text-sm font-semibold transition-all ${
                          proficiencyLevel === level 
                            ? "bg-gradient-to-r from-purple-600 to-teal-500 text-white border-0 shadow-md" 
                            : "border-gray-200 text-gray-600 hover:border-purple-300"
                        }`}
                      >
                        {level}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs text-gray-400 text-center mt-2">
                    Don't know your level yet? That's okay!{" "}
                    <a href="/level-test" className="text-purple-600 hover:underline font-medium">
                      Test it here
                    </a>
                  </p>
                </div>

                {/* Translation Language */}
                <div className="space-y-2">
                  <Label htmlFor="translation-language" className="text-sm font-semibold text-gray-700">Translation Language (Optional)</Label>
                  <Select value={translationLanguage} onValueChange={setTranslationLanguage}>
                    <SelectTrigger id="translation-language" className="rounded-xl border-gray-200 h-11">
                      <SelectValue placeholder="Select your native language for translations" />
                    </SelectTrigger>
                    <SelectContent>
                      {TRANSLATION_LANGUAGES.map((lang) => (
                        <SelectItem key={lang.value} value={lang.value}>
                          {lang.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-gray-400">
                    Choose your native language for vocabulary and sentence translations in the story.
                    {userData?.preferredTranslationLanguage && !translationLanguage && " Using your saved preference."}
                  </p>
                </div>

                {/* Vocabulary List */}
                <div className="space-y-2">
                  <Label htmlFor="vocabulary" className="text-sm font-semibold text-gray-700">Vocabulary List <span className="text-red-500">*</span> (at least 5 words)</Label>
                  <Textarea
                    id="vocabulary"
                    placeholder="Paste words (comma or newline separated)"
                    value={vocabularyText}
                    onChange={(e) => setVocabularyText(e.target.value)}
                    rows={5}
                    className="rounded-xl border-gray-200 resize-none"
                  />
                  <div className="flex items-center justify-between text-xs text-gray-400">
                    <span>
                      {vocabularyText.trim().split(/[,，、\n]/).map(w => w.trim()).filter(Boolean).length} words
                    </span>
                    <div className="grid w-full gap-2 sm:grid-cols-2">
                      <button
                        type="button"
                        onClick={() => photoInputRef.current?.click()}
                        disabled={isProcessingPhoto}
                        className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left transition-all hover:border-purple-300 hover:bg-purple-50/60 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-purple-100 text-purple-600">
                          {isProcessingPhoto ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Camera className="h-4 w-4" />
                          )}
                        </div>
                        <p className="text-sm font-semibold text-gray-800">Upload Photo</p>
                        <p className="mt-1 text-xs text-gray-500">
                          Choose from your camera roll or take a new photo of notes, a worksheet, or a textbook page.
                        </p>
                      </button>

                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploadingDocument}
                        className="rounded-2xl border border-gray-200 bg-white px-4 py-3 text-left transition-all hover:border-purple-300 hover:bg-purple-50/60 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-full bg-teal-100 text-teal-600">
                          {isUploadingDocument ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Upload className="h-4 w-4" />
                          )}
                        </div>
                        <p className="text-sm font-semibold text-gray-800">Upload File</p>
                        <p className="mt-1 text-xs text-gray-500">
                          Import vocabulary from PDF, Word, Excel (.xlsx), TXT, or CSV files.
                        </p>
                      </button>
                    </div>
                  </div>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.docx,.doc,.txt,.csv,.xlsx"
                    className="hidden"
                    onChange={handleFileUpload}
                  />
                  <input
                    ref={photoInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                  {uploadedFileName && (
                    <div className="flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg text-sm">
                      <FileText className="h-4 w-4 text-green-600" />
                      <span className="text-green-700 flex-1">{uploadedFileName}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => setUploadedFileName(null)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>

                {/* Topic Prompt */}
                <div className="space-y-2">
                  <Label htmlFor="topic" className="text-sm font-semibold text-gray-700">Topic Prompt (optional)</Label>
                  <Input
                    id="topic"
                    placeholder="e.g., A story about friends traveling"
                    value={topicPrompt}
                    onChange={(e) => setTopicPrompt(e.target.value)}
                    className="rounded-xl border-gray-200 h-11"
                  />
                </div>
              </div>

              {/* Next Button */}
              <Button
                className="w-full mt-6 rounded-xl h-12 text-base font-semibold text-white border-0 shadow-lg transition-all hover:shadow-xl hover:scale-[1.01]"
                style={{ background: "linear-gradient(135deg, #7C3AED 0%, #0D9488 100%)" }}
                disabled={!canProceedStep1}
                onClick={() => setStep(2)}
              >
                Next <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </div>
          )}

          {/* ═══ Step 2: Choose Your Mode ═══ */}
          {step === 2 && (
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 sm:p-8 animate-bounce-in">
              <div className="text-center mb-6">
                <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Step 2: Choose Your Mode</h3>
                <p className="mt-1 text-sm text-gray-500">
                  Select how you want to experience your story
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {/* Podcast Mode */}
                <button
                  onClick={() => setMode("podcast")}
                  className={`rounded-2xl border-2 p-6 text-left transition-all duration-200 ${
                    mode === "podcast"
                      ? "border-purple-500 ring-4 ring-purple-100 bg-gradient-to-br from-purple-50 to-teal-50/30 shadow-lg"
                      : "border-gray-200 bg-white hover:border-purple-200 hover:shadow-md"
                  }`}
                >
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-teal-500 shadow-lg shadow-purple-300/30">
                    <Headphones className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-lg font-bold mb-1 text-gray-900">🎙️ Podcast Mode</h4>
                  <p className="text-sm text-gray-500 mb-3">
                    Listen to your vocabulary in AI-generated stories
                  </p>
                  <ul className="space-y-1.5 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                      Professional AI voices
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                      Custom themes & genres
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-purple-500" />
                      Learn on the go
                    </li>
                  </ul>
                </button>

                {/* Film Mode */}
                <button
                  onClick={() => {
                    if (usageStats && !usageStats.canUseFilmFormat) {
                      setShowFilmUpgradeModal(true);
                    } else {
                      setMode("film");
                    }
                  }}
                  className={`rounded-2xl border-2 p-6 text-left transition-all duration-200 relative ${
                    mode === "film"
                      ? "border-purple-500 ring-4 ring-purple-100 bg-gradient-to-br from-purple-50 to-teal-50/30 shadow-lg"
                      : "border-gray-200 bg-white hover:border-purple-200 hover:shadow-md"
                  }`}
                >
                  {usageStats && !usageStats.canUseFilmFormat && (
                    <div className="absolute top-3 right-3">
                      <Badge className="bg-amber-500 text-white text-xs font-semibold px-3 py-0.5 rounded-full">Premium</Badge>
                    </div>
                  )}
                  <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-purple-500 to-teal-500 shadow-lg shadow-teal-300/30">
                    <Film className="h-8 w-8 text-white" />
                  </div>
                  <h4 className="text-lg font-bold mb-1 text-gray-900">🎬 Film Mode</h4>
                  <p className="text-sm text-gray-500 mb-3">
                    Watch your words come alive in AI-generated short films with built-in narration
                  </p>
                  <ul className="space-y-1.5 text-sm text-gray-600">
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                      Cinematic AI visuals
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                      Visual storytelling
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                      Embedded story audio
                    </li>
                    <li className="flex items-center gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-teal-500" />
                      Immersive learning
                    </li>
                  </ul>
                </button>
              </div>

              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setStep(1)}
                  className="rounded-xl border-gray-200 h-12 px-6 font-semibold"
                >
                  Back
                </Button>
                <Button
                  className="flex-1 rounded-xl h-12 text-base font-semibold text-white border-0 shadow-lg transition-all hover:shadow-xl hover:scale-[1.01]"
                  style={{ background: "linear-gradient(135deg, #7C3AED 0%, #0D9488 100%)" }}
                  disabled={!canProceedStep2}
                  onClick={() => setStep(3)}
                >
                  Next <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </div>
            </div>
          )}

          {/* ═══ Step 3: Creative Controls ═══ */}
          {step === 3 && (
            <div className="bg-white rounded-2xl shadow-xl shadow-gray-200/50 p-6 sm:p-8 animate-bounce-in">
              <div className="flex items-start justify-between mb-6">
                <div>
                  <h3 className="text-xl sm:text-2xl font-bold text-gray-900">Step 3: Creative Controls</h3>
                  <p className="mt-1 text-sm text-gray-500">
                    Customize your {mode === "podcast" ? "podcast" : "film"} experience
                  </p>
                </div>
                {mode === "film" && (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 text-xs font-semibold shrink-0">
                    <Film className="h-3.5 w-3.5" /> Film Mode
                  </div>
                )}
              </div>

              <div className="space-y-5">
                {/* Story Theme — horizontal layout */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                  <Label htmlFor="theme" className="text-sm font-semibold text-gray-700 sm:w-36 shrink-0 mb-1.5 sm:mb-0">Story Theme <span className="text-red-500">*</span></Label>
                  <Select value={theme} onValueChange={setTheme}>
                    <SelectTrigger id="theme" className="rounded-xl border-gray-200 h-11 flex-1">
                      <SelectValue placeholder="Select a theme" />
                    </SelectTrigger>
                    <SelectContent>
                      {THEMES.map((t) => (
                        <SelectItem key={t} value={t}>
                          {t}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Story Length — horizontal layout */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                  <Label htmlFor="length" className="text-sm font-semibold text-gray-700 sm:w-36 shrink-0 mb-1.5 sm:mb-0">Story Length <span className="text-red-500">*</span></Label>
                  {mode === "film" ? (
                    <div className="space-y-2">
                      <div className="grid grid-cols-3 gap-2">
                        {[
                          { val: 30, label: "30s" },
                          { val: 60, label: "60s" },
                          { val: 90, label: "90s" },
                        ].map(({ val, label }) => (
                          <Button
                            key={val}
                            variant={videoDuration === val ? "default" : "outline"}
                            onClick={() => {
                              setVideoDuration(val);
                              if (val === 30) setStoryLength("short");
                              else if (val === 60) setStoryLength("medium");
                              else setStoryLength("long");
                            }}
                            className={`rounded-full h-10 text-sm font-semibold transition-all ${
                              videoDuration === val 
                                ? "bg-gradient-to-r from-purple-600 to-teal-500 text-white border-0 shadow-md" 
                                : "border-gray-200 text-gray-600 hover:border-purple-300"
                            }`}
                          >
                            {label}
                          </Button>
                        ))}
                      </div>
                      <p className="text-xs text-gray-400">
                        Longer videos take more time to generate (~{Math.ceil(videoDuration / 10)} clips)
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2">
                      {[
                        { val: "short" as const, label: "Short", sub: "~1-2 min" },
                        { val: "medium" as const, label: "Medium", sub: "~3-5 min" },
                        { val: "long" as const, label: "Long", sub: "~6-10 min" },
                      ].map(({ val, label, sub }) => (
                        <Button
                          key={val}
                          variant={storyLength === val ? "default" : "outline"}
                          onClick={() => setStoryLength(val)}
                          className={`rounded-full h-10 text-sm font-semibold transition-all ${
                            storyLength === val 
                              ? "bg-gradient-to-r from-purple-600 to-teal-500 text-white border-0 shadow-md" 
                              : "border-gray-200 text-gray-600 hover:border-purple-300"
                          }`}
                        >
                          {label} <span className="hidden sm:inline ml-1 opacity-75 text-xs">({sub})</span>
                        </Button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Podcast-specific controls */}
                {mode === "podcast" && (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                      <Label htmlFor="voice" className="text-sm font-semibold text-gray-700 sm:w-36 shrink-0 mb-1.5 sm:mb-0">Voice Type <span className="text-red-500">*</span></Label>
                      <Select value={voiceType} onValueChange={setVoiceType}>
                        <SelectTrigger id="voice" className="rounded-xl border-gray-200 h-11 flex-1">
                          <SelectValue placeholder="Select a voice" />
                        </SelectTrigger>
                        <SelectContent>
                          {VOICE_TYPES.map((v) => (
                            <SelectItem key={v} value={v}>
                              {v}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                      <Label htmlFor="gender" className="text-sm font-semibold text-gray-700 sm:w-36 shrink-0 mb-1.5 sm:mb-0">Narrator Gender <span className="text-red-500">*</span></Label>
                      <div className="grid grid-cols-2 gap-2 flex-1">
                        {(["female", "male"] as const).map((g) => (
                          <Button
                            key={g}
                            variant={narratorGender === g ? "default" : "outline"}
                            onClick={() => setNarratorGender(g)}
                            className={`rounded-full h-10 text-sm font-semibold capitalize transition-all ${
                              narratorGender === g 
                                ? "bg-gradient-to-r from-purple-600 to-teal-500 text-white border-0 shadow-md" 
                                : "border-gray-200 text-gray-600 hover:border-purple-300"
                            }`}
                          >
                            {g}
                          </Button>
                        ))}
                      </div>
                    </div>
                    {voiceType && targetLanguage && (
                      <VoicePreviewButtonEnhanced
                        targetLanguage={effectiveLanguage}
                        voiceType={voiceType}
                        narratorGender={narratorGender}
                        playingPreview={playingPreview}
                        setPlayingPreview={setPlayingPreview}
                        previewAudio={previewAudio}
                        setPreviewAudio={setPreviewAudio}
                      />
                    )}
                  </>
                )}

                {/* Film-specific controls */}
                {mode === "film" && (
                  <>
                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                      <Label htmlFor="style" className="text-sm font-semibold text-gray-700 sm:w-36 shrink-0 mb-1.5 sm:mb-0">Cinematic Style <span className="text-red-500">*</span></Label>
                      <Select value={cinematicStyle} onValueChange={setCinematicStyle}>
                        <SelectTrigger id="style" className="rounded-xl border-gray-200 h-11 flex-1">
                          <SelectValue placeholder="Select a style" />
                        </SelectTrigger>
                        <SelectContent>
                          {CINEMATIC_STYLES.map((s) => (
                            <SelectItem key={s} value={s}>
                              {s}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                      <Label htmlFor="film-voice" className="text-sm font-semibold text-gray-700 sm:w-36 shrink-0 mb-1.5 sm:mb-0">Story Narration</Label>
                      <div className="flex-1 space-y-2">
                        <Select value={filmNarrationVoiceType} onValueChange={setVoiceType}>
                          <SelectTrigger id="film-voice" className="rounded-xl border-gray-200 h-11">
                            <SelectValue placeholder="Select a narrator voice" />
                          </SelectTrigger>
                          <SelectContent>
                            {VOICE_TYPES.map((v) => (
                              <SelectItem key={v} value={v}>
                                {v}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <p className="text-xs text-gray-400">
                          The story audio is mixed directly into the final video during playback.
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center sm:gap-4">
                      <Label htmlFor="film-gender" className="text-sm font-semibold text-gray-700 sm:w-36 shrink-0 mb-1.5 sm:mb-0">Narrator Gender</Label>
                      <div className="grid grid-cols-2 gap-2 flex-1">
                        {(["female", "male"] as const).map((g) => (
                          <Button
                            key={g}
                            variant={filmNarrationGender === g ? "default" : "outline"}
                            onClick={() => setNarratorGender(g)}
                            className={`rounded-full h-10 text-sm font-semibold capitalize transition-all ${
                              filmNarrationGender === g
                                ? "bg-gradient-to-r from-purple-600 to-teal-500 text-white border-0 shadow-md"
                                : "border-gray-200 text-gray-600 hover:border-purple-300"
                            }`}
                          >
                            {g}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {targetLanguage && (
                      <VoicePreviewButtonEnhanced
                        targetLanguage={effectiveLanguage}
                        voiceType={filmNarrationVoiceType}
                        narratorGender={filmNarrationGender}
                        playingPreview={playingPreview}
                        setPlayingPreview={setPlayingPreview}
                        previewAudio={previewAudio}
                        setPreviewAudio={setPreviewAudio}
                      />
                    )}

                    <div className="flex flex-col sm:flex-row sm:items-start sm:gap-4">
                      <Label htmlFor="background-music" className="text-sm font-semibold text-gray-700 sm:w-36 shrink-0 mb-1.5 sm:mb-0 sm:pt-2.5">Background Music</Label>
                      <div className="flex-1 space-y-2">
                      <Select
                        value={backgroundMusic}
                        onValueChange={(val) => {
                          setBackgroundMusic(val as any);
                          setSelectedMusicTrack(val === "none" ? "" : `${val}-1`);
                        }}
                      >
                        <SelectTrigger id="background-music" className="rounded-xl border-gray-200 h-11">
                          <SelectValue placeholder="Select music mood" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">No Music</SelectItem>
                          <SelectItem value="calm">Calm & Peaceful</SelectItem>
                          <SelectItem value="upbeat">Upbeat & Cheerful</SelectItem>
                          <SelectItem value="romantic">Romantic & Tender</SelectItem>
                          <SelectItem value="comedic">Comedic & Playful</SelectItem>
                        </SelectContent>
                      </Select>
                      
                      {backgroundMusic && backgroundMusic !== "none" && (
                        <div className="pt-2 space-y-3">
                          <MusicPreviewButton
                            mood={backgroundMusic}
                            trackId={`${backgroundMusic}-1`}
                            trackName={backgroundMusic.charAt(0).toUpperCase() + backgroundMusic.slice(1)}
                            className="w-full"
                          />
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label htmlFor="music-volume" className="text-xs flex items-center gap-1 text-gray-600">
                                <Volume2 className="h-3.5 w-3.5" />
                                Music Volume
                              </Label>
                              <span className="text-xs font-semibold text-gray-500">{musicVolume}%</span>
                            </div>
                            <input
                              id="music-volume"
                              type="range"
                              min="0"
                              max="100"
                              step="5"
                              value={musicVolume}
                              onChange={(e) => setMusicVolume(Number(e.target.value))}
                              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-purple-600"
                            />
                            <p className="text-xs text-gray-400">
                              Adjust how loud the background music plays relative to narration
                            </p>
                          </div>
                        </div>
                      )}
                      
                      {backgroundMusic === "none" && (
                        <p className="text-xs text-gray-400">
                          Add ambient background music to enhance immersion
                        </p>
                      )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center space-x-2">
                        <Checkbox 
                          id="subtitles" 
                          checked={addSubtitles}
                          onCheckedChange={(checked) => setAddSubtitles(checked as boolean)}
                        />
                        <Label htmlFor="subtitles" className="text-sm font-normal cursor-pointer text-gray-700">
                          Add subtitles to video for better comprehension
                        </Label>
                      </div>
                      {addSubtitles && (
                        <p className="text-xs text-gray-400 ml-6">
                          Subtitle settings can be customized after video generation
                        </p>
                      )}
                    </div>
                  </>
                )}
              </div>

              {/* Generate Button */}
              <div className="flex gap-3 mt-6">
                <Button
                  variant="outline"
                  onClick={() => setStep(2)}
                  className="rounded-xl border-gray-200 h-12 px-6 font-semibold"
                >
                  Back
                </Button>
                <Button
                  className="flex-1 rounded-xl h-14 text-base font-semibold text-white border-0 shadow-lg transition-all hover:shadow-xl hover:scale-[1.01]"
                  style={{ background: "linear-gradient(135deg, #7C3AED 0%, #0D9488 100%)" }}
                  disabled={!canProceedStep3 || generateMutation.isPending}
                  onClick={handleGenerate}
                >
                  {generateMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Sparkles className="mr-2 h-5 w-5" />
                      Generate Story
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Vocabulary Preview Dialog */}
      <Dialog open={showVocabPreview} onOpenChange={setShowVocabPreview}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold">Select Vocabulary Words</DialogTitle>
            <p className="text-sm text-muted-foreground mt-2">
              Review and select the words you want to include in your story. All words are selected by default.
            </p>
          </DialogHeader>
          
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-2">
              <Checkbox 
                id="select-all"
                checked={extractedVocab.length > 0 && extractedVocab.every(w => w.selected)}
                onCheckedChange={toggleAllWords}
              />
              <label htmlFor="select-all" className="text-sm font-medium cursor-pointer">
                Select All ({extractedVocab.filter(w => w.selected).length}/{extractedVocab.length})
              </label>
            </div>
            <Badge variant="secondary">
              {extractedVocab.filter(w => w.selected).length} selected
            </Badge>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            <div className="grid gap-2">
              {extractedVocab.map((vocab, index) => (
                <div
                  key={index}
                  className={`flex items-start gap-3 p-3 rounded-lg border transition-colors ${
                    vocab.selected ? 'bg-primary/5 border-primary/20' : 'bg-muted/30 border-transparent'
                  }`}
                >
                  <Checkbox
                    id={`word-${index}`}
                    checked={vocab.selected}
                    onCheckedChange={() => toggleWordSelection(index)}
                    className="mt-1"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <label
                        htmlFor={`word-${index}`}
                        className="font-medium text-lg cursor-pointer"
                      >
                        {vocab.word}
                      </label>
                      {vocab.level && (
                        <Badge variant="outline" className="text-xs">
                          Level {vocab.level}
                        </Badge>
                      )}
                      {vocab.frequency && (
                        <Badge 
                          variant={vocab.frequency === 'Very Common' ? 'default' : 'secondary'}
                          className="text-xs"
                        >
                          {vocab.frequency}
                        </Badge>
                      )}
                    </div>
                    {vocab.translation && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {vocab.translation}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t">
            <Button
              variant="outline"
              onClick={() => {
                setShowVocabPreview(false);
                setExtractedVocab([]);
              }}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmVocabSelection}
              disabled={extractedVocab.filter(w => w.selected).length === 0}
              className="flex-1 bg-gradient-to-r from-purple-600 to-teal-500 text-white"
            >
              Add {extractedVocab.filter(w => w.selected).length} Words
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Paywall modals */}
      <PaywallModal
        open={showPaywallModal}
        onOpenChange={setShowPaywallModal}
        trigger="daily_limit"
        headline={paywallHeadline}
      />

      <PersonalizedStoryOverlay
        open={showPersonalizedOverlay}
        onOpenChange={setShowPersonalizedOverlay}
      />

      <PaywallModal
        open={showFilmUpgradeModal}
        onOpenChange={setShowFilmUpgradeModal}
        trigger="locked_content"
        headline="keep_going"
        skipToStep2
      />
    </div>
  );
}
