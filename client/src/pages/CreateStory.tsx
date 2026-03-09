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
import { Loader2, Upload, ArrowRight, Sparkles, BookOpen, Headphones, Film, ArrowLeft, FileText, X, Volume2, Info } from "lucide-react";
import { APP_TITLE, APP_LOGO, getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { VoicePreviewButtonEnhanced } from "@/components/VoicePreviewButtonEnhanced";
import { MusicPreviewButton } from "@/components/MusicPreviewButton";
import { SubtitlePreview } from "@/components/SubtitlePreview";
import { UpgradePromptModal } from "@/components/UpgradePromptModal";
import { toast } from "sonner";
import { useLocation } from "wouter";


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

const PROFICIENCY_LEVELS = ["A2", "B1", "B2", "C1", "C2"]; // Ordered from easiest to hardest

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
    <div className="flex flex-col items-center gap-2">
      <div
        className={`flex h-12 w-12 items-center justify-center rounded-full border-2 font-bold transition-all hover-bounce ${
          active
            ? "gradient-primary text-white border-0 scale-110 shadow-playful animate-scale-in"
            : completed
            ? "bg-primary/10 border-primary text-primary"
            : "border-border bg-background text-muted-foreground"
        }`}
      >
        {number}
      </div>
      <span
        className={`text-xs font-medium hidden sm:block ${
          active ? "text-primary" : "text-muted-foreground"
        }`}
      >
        {label}
      </span>
    </div>
  );
}

export default function CreateStory() {
  const { user, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();
  const [step, setStep] = useState(1);
  const [generatingContentId, setGeneratingContentId] = useState<number | null>(null);

  // Read URL params for pre-filling from level test
  const urlParams = new URLSearchParams(location.split('?')[1] || '');
  const languageParam = urlParams.get('language');
  const levelParam = urlParams.get('level');

  // Step 1 state
  const [targetLanguage, setTargetLanguage] = useState(languageParam || "");
  const [proficiencyLevel, setProficiencyLevel] = useState(levelParam || "");
  const [vocabularyText, setVocabularyText] = useState("");
  const [topicPrompt, setTopicPrompt] = useState("");
  const [translationLanguage, setTranslationLanguage] = useState("");
  const [isUploadingDocument, setIsUploadingDocument] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

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
  const [videoDuration, setVideoDuration] = useState<number>(30); // Default 30 seconds for film mode
  const [backgroundMusic, setBackgroundMusic] = useState<string>("none");
  const [musicVolume, setMusicVolume] = useState<number>(20); // Default 20% volume
  const [selectedMusicTrack, setSelectedMusicTrack] = useState<string>(""); // Selected track filename
  const [addSubtitles, setAddSubtitles] = useState<boolean>(false);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [upgradeReason, setUpgradeReason] = useState<"story_limit" | "film_format" | "analytics">("story_limit");

  // Check usage stats for feature gating
  const { data: usageStats } = trpc.subscription.getUsageStats.useQuery();
  const [subtitleFontSize, setSubtitleFontSize] = useState<"small" | "medium" | "large">("medium");
  const [subtitlePosition, setSubtitlePosition] = useState<"top" | "bottom">("bottom");
  const [subtitleColor, setSubtitleColor] = useState<"white" | "yellow" | "cyan">("white");
  const [subtitleFontFamily, setSubtitleFontFamily] = useState<"Arial" | "Times New Roman" | "Courier New" | "Georgia" | "Verdana">("Arial");
  const [subtitleOutlineThickness, setSubtitleOutlineThickness] = useState<number>(2); // 0-5px
  const [subtitleBackgroundOpacity, setSubtitleBackgroundOpacity] = useState<number>(0); // 0-100%
  const [playingMusicPreview, setPlayingMusicPreview] = useState<string | null>(null);
  const [musicPreviewAudio, setMusicPreviewAudio] = useState<HTMLAudioElement | null>(null);
  
  // Language learning tips (defined at top level)
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
  
  // Random tip (stable during this generation session) - MUST be at top level
  const [randomTip] = useState(() => 
    learningTips[Math.floor(Math.random() * learningTips.length)]
  );

  const canProceedStep1 = useMemo(() => {
    return (
      targetLanguage &&
      proficiencyLevel &&
      vocabularyText.trim().split(/[,，、\n]/).map(w => w.trim()).filter(Boolean).length >= 5
    );
  }, [targetLanguage, proficiencyLevel, vocabularyText]);

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

  // State for vocabulary preview dialog (MUST be before early returns)
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
      // Set generating state and start polling
      setGeneratingContentId(data.contentId);
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
        // Stop polling if content is ready or failed
        const content = query.state.data;
        if (content?.status === 'completed' || content?.status === 'failed') {
          return false;
        }
        return 3000; // Poll every 3 seconds
      },
    }
  );

  // Document upload mutation (MUST be before early returns)
  const uploadDocumentMutation = trpc.document.uploadAndExtractVocabulary.useMutation({
    onSuccess: (data) => {
      // Show preview dialog with extracted words
      setExtractedVocab(data.vocabularyWords.map(w => ({
        ...w,
        selected: true // All words selected by default
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

  // Navigate when content is ready
  useEffect(() => {
    if (generatingContent?.status === 'completed') {
      toast.success("Your content is ready!");
      setLocation(`/content/${generatingContent.id}`);
    } else if (generatingContent?.status === 'failed') {
      toast.error(generatingContent.failureReason || "Content generation failed. Please try again.");
      setGeneratingContentId(null);
    }
  }, [generatingContent, setLocation]);

  // Show generating screen if content is being generated
  if (generatingContentId && generatingContent) {
    const progress = generatingContent.progress || 0;
    const stage = generatingContent.progressStage || "Starting...";

    // Dynamic Flip expression based on progress
    const getFlipExpression = () => {
      if (progress < 25) return "/flip-mascot.png"; // Excited/Starting
      if (progress < 75) return "/flip-mascot.png"; // Thinking/Working
      return "/flip-mascot.png"; // Celebrating/Almost done
    };

    // Use the random tip from state (already initialized at top level)

    // Estimated time based on mode
    const getEstimatedTime = () => {
      if (mode === "film") return "2-3 minutes";
      if (mode === "podcast") return "1-2 minutes";
      return "1-2 minutes";
    };

    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50 flex items-center justify-center p-6">
        <Card className="max-w-md w-full shadow-lg">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <img 
                src={getFlipExpression()} 
                alt="Flip" 
                className="w-24 h-24 animate-bounce" 
              />
            </div>
            <CardTitle className="text-2xl">Generating Your Story</CardTitle>
            <CardDescription className="text-base mt-2">
              {stage}
            </CardDescription>
            
            {/* Estimated Time */}
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Estimated time: <span className="font-medium text-purple-600">{getEstimatedTime()}</span>
              </p>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-6">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progress</span>
                <span className="font-medium">{progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                <div 
                  className="h-full bg-gradient-to-r from-purple-500 to-teal-500 transition-all duration-500 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-gray-600">
                <span>Language:</span>
                <span className="font-medium">{targetLanguage}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Level:</span>
                <span className="font-medium">{proficiencyLevel}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600">
                <span>Mode:</span>
                <span className="font-medium capitalize">{mode}</span>
              </div>
            </div>
            
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-blue-800">
                <strong>Tip:</strong> You can leave this page and continue using the app. We'll notify you when your story is ready!
              </p>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                onClick={() => setLocation("/app")}
                className="flex-1"
              >
                Continue Exploring
              </Button>
              <Button
                variant="outline"
                onClick={() => setLocation("/library")}
                className="flex-1"
              >
                Go to Library
              </Button>
            </div>
            
            {/* Learning Tip */}
            <div className="bg-gradient-to-r from-purple-50 to-teal-50 border border-purple-200 rounded-lg p-4 mt-4">
              <p className="text-sm text-purple-800">
                <strong className="text-purple-900">💡 Learning Tip:</strong> {randomTip}
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Hooks already moved before early return

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

  const handleDocumentUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ];

    if (!validTypes.includes(file.type)) {
      toast.error("Please upload a PDF, Word document, or text file");
      return;
    }

    // Validate file size (10MB max)
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      toast.error("File size must be less than 10MB");
      return;
    }

    if (!targetLanguage) {
      toast.error("Please select a target language first");
      return;
    }

    setIsUploadingDocument(true);
    setUploadedFileName(file.name);

    try {
      // Convert file to base64
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
          mimeType: file.type,
          targetLanguage,
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

    // Reset file input
    e.target.value = "";
  };

  const handleGenerate = () => {
    if (!isAuthenticated) {
      toast.error("Please sign in to generate content");
      return;
    }

    // Check if user has reached free tier limit
    if (usageStats && !usageStats.canCreateStory) {
      setUpgradeReason("story_limit");
      setShowUpgradeModal(true);
      return;
    }

    generateMutation.mutate({
      targetLanguage,
      proficiencyLevel: proficiencyLevel as "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
      vocabularyText,
      theme,
      topicPrompt,
      translationLanguage: translationLanguage || "en",
      mode: mode as "podcast" | "film",
      storyLength,
      voiceType: mode === "podcast" ? voiceType : undefined,
      narratorGender: mode === "podcast" ? narratorGender : undefined,
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
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={APP_LOGO} alt="Storyling.ai" className="h-10 w-10" />
            <h1 className="text-2xl font-bold gradient-text-primary">{APP_TITLE}</h1>
          </div>
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span className="text-sm text-muted-foreground hidden sm:inline">
                  Hey, {user?.name || "friend"}! 👋
                </span>
                <Button
                  variant="outline"
                  onClick={() => setLocation("/library")}
                  className="rounded-button hover-lift"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  My Library
                </Button>
              </>
            ) : (
              <Button
                onClick={() => (window.location.href = getLoginUrl())}
                className="rounded-button gradient-primary text-white hover-lift border-0"
              >
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="container py-12 text-center">
        <div className="flex justify-center mb-6 animate-bounce-in">
          <img src="/flip-mascot.png" alt="Flip" className="w-32 h-32 animate-float" />
        </div>
        <h2 className="text-5xl font-bold mb-4 animate-bounce-in">
          Learn beautifully.
        </h2>
        <p className="text-xl text-muted-foreground mb-2 animate-bounce-in">
          Your words → your world.
        </p>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto animate-bounce-in">
          Turn your vocabulary into immersive stories. Learn languages through AI-generated podcasts and films tailored just for you.
        </p>

        {/* Progress Indicator */}
        <div className="mt-12 flex items-center justify-center gap-4">
          <StepIndicator number={1} label="Vocab & Language" active={step === 1} completed={step > 1} />
          <div className="h-0.5 w-12 bg-border" />
          <StepIndicator number={2} label="Mode" active={step === 2} completed={step > 2} />
          <div className="h-0.5 w-12 bg-border" />
          <StepIndicator number={3} label="Creative Controls" active={step === 3} completed={false} />
        </div>
      </section>

      {/* Main Content */}
      <section className="container pb-20">
        <div className="mx-auto max-w-3xl">
          {/* Step 1: Vocab & Language */}
          {step === 1 && (
            <Card className="rounded-card shadow-playful-lg border-2 animate-bounce-in">
              <CardContent className="space-y-6 pt-6">
                <div>
                  <h3 className="text-2xl font-bold">Step 1: Vocab & Language</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Choose your target language and add at least 5 vocabulary words
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="language">Target Language *</Label>
                    <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                      <SelectTrigger id="language" className="rounded-xl">
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
                  </div>

                  <div className="space-y-2">
                    <Label>Proficiency Level (CEFR) *</Label>
                    <div className="grid grid-cols-3 gap-2 sm:grid-cols-6">
                      {PROFICIENCY_LEVELS.map((level) => (
                        <Button
                          key={level}
                          variant={proficiencyLevel === level ? "default" : "outline"}
                          onClick={() => setProficiencyLevel(level)}
                          className={`rounded-button w-full ${
                            proficiencyLevel === level ? "gradient-primary text-white border-0 hover-lift" : "hover-lift"
                          }`}
                        >
                          {level}
                        </Button>
                      ))}
                    </div>
                    <p className="text-sm text-muted-foreground text-center mt-2">
                      Don't know your level yet? That's okay!{" "}
                      <a
                        href="/level-test"
                        className="text-primary hover:underline font-medium"
                      >
                        Test it here
                      </a>
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="translation-language">Translation Language (Optional)</Label>
                    <Select value={translationLanguage} onValueChange={setTranslationLanguage}>
                      <SelectTrigger id="translation-language" className="rounded-xl">
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
                    <p className="text-sm text-muted-foreground">
                      Choose your native language for vocabulary and sentence translations in the story.
                      {userData?.preferredTranslationLanguage && !translationLanguage && " Using your saved preference."}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="vocabulary">Vocabulary List * (at least 5 words)</Label>
                    <Textarea
                      id="vocabulary"
                      placeholder="Paste words (comma or newline separated)"
                      value={vocabularyText}
                      onChange={(e) => setVocabularyText(e.target.value)}
                      rows={6}
                      className="rounded-xl"
                    />
                    <div className="flex items-center justify-between text-sm text-muted-foreground">
                      <span>
                        {vocabularyText.trim().split(/[,，、\n]/).map(w => w.trim()).filter(Boolean).length} words
                      </span>
                      <div className="flex gap-2 items-center">
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="rounded-button"
                            onClick={() => document.getElementById('document-upload')?.click()}
                            disabled={isUploadingDocument}
                          >
                            {isUploadingDocument ? (
                              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                              <FileText className="mr-2 h-4 w-4" />
                            )}
                            Import Document
                          </Button>
                          <div className="group relative">
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            <div className="absolute left-0 bottom-full mb-2 hidden group-hover:block w-64 p-3 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg border z-50">
                              <p className="font-semibold mb-1">Import Document Feature</p>
                              <p>Upload a PDF, DOCX, or TXT file to automatically extract vocabulary words. Our AI will identify key words and phrases for your language learning story.</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="rounded-button"
                            onClick={() => csvInputRef.current?.click()}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Upload CSV
                          </Button>
                          <div className="group relative">
                            <Info className="h-4 w-4 text-muted-foreground cursor-help" />
                            <div className="absolute right-0 bottom-full mb-2 hidden group-hover:block w-80 p-4 bg-popover text-popover-foreground text-xs rounded-lg shadow-lg border z-50">
                              <p className="font-semibold mb-2">CSV Format Guide</p>
                              <p className="mb-2">Upload a CSV file with one word per line:</p>
                              <div className="bg-muted p-2 rounded font-mono text-xs mb-2">
                                hello<br/>
                                world<br/>
                                friend<br/>
                                learn<br/>
                                speak
                              </div>
                              <p className="text-muted-foreground">Or comma-separated: <span className="font-mono">hello,world,friend,learn,speak</span></p>
                            </div>
                          </div>
                        </div>
                        <input
                          ref={csvInputRef}
                          type="file"
                          accept=".csv"
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                const text = await file.text();
                                // Parse CSV - handle both comma-separated and newline-separated
                                const words = text
                                  .split(/[,\n]/)  
                                  .map(w => w.trim())
                                  .filter(Boolean);
                                
                                if (words.length === 0) {
                                  toast.error("No words found in CSV file");
                                  return;
                                }
                                
                                setVocabularyText(words.join(", "));
                                toast.success(`Imported ${words.length} words from CSV`);
                                
                                // Reset file input
                                if (csvInputRef.current) {
                                  csvInputRef.current.value = "";
                                }
                              } catch (error) {
                                toast.error("Failed to read CSV file");
                              }
                            }
                          }}
                        />
                      </div>
                    </div>
                    <input
                      id="document-upload"
                      type="file"
                      accept=".pdf,.docx,.doc,.txt"
                      className="hidden"
                      onChange={handleDocumentUpload}
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

                  <div className="space-y-2">
                    <Label htmlFor="topic">Topic Prompt (optional)</Label>
                    <Input
                      id="topic"
                      placeholder="e.g., A story about friends traveling"
                      value={topicPrompt}
                      onChange={(e) => setTopicPrompt(e.target.value)}
                      className="rounded-xl"
                    />
                  </div>
                </div>



                <Button
                  className="w-full rounded-button gradient-primary text-white hover-lift border-0 h-12 text-lg"
                  disabled={!canProceedStep1}
                  onClick={() => setStep(2)}
                >
                  Next <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Mode Selection */}
          {step === 2 && (
            <Card className="rounded-card shadow-playful-lg border-2 animate-bounce-in">
              <CardContent className="space-y-6 pt-6">
                <div>
                  <h3 className="text-2xl font-bold">Step 2: Choose Your Mode</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Select how you want to experience your story
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  {/* Podcast Mode */}
                  <button
                    onClick={() => setMode("podcast")}
                    className={`rounded-card border-2 p-6 text-left transition-all hover-lift ${
                      mode === "podcast"
                        ? "border-primary ring-4 ring-primary/20 bg-primary/5"
                        : "border-border bg-background"
                    }`}
                  >
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full gradient-primary">
                      <Headphones className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="text-xl font-bold mb-2">🎙️ Podcast Mode</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Listen to your vocabulary in AI-generated stories
                    </p>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Professional AI voices
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Custom themes & genres
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-primary" />
                        Learn on the go
                      </li>
                    </ul>
                  </button>

                  {/* Film Mode */}
                  <button
                    onClick={() => {
                      if (usageStats && !usageStats.canUseFilmFormat) {
                        setUpgradeReason("film_format");
                        setShowUpgradeModal(true);
                      } else {
                        setMode("film");
                      }
                    }}
                    className={`rounded-card border-2 p-6 text-left transition-all hover-lift relative ${
                      mode === "film"
                        ? "border-pink-500 ring-4 ring-pink-500/20 bg-pink-50"
                        : "border-border bg-background"
                    }`}
                  >
                    <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full gradient-warm">
                      <Film className="h-8 w-8 text-white" />
                    </div>
                    <h4 className="text-xl font-bold mb-2">🎬 Film Mode</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      Watch your words come alive in stunning AI-generated short films
                    </p>
                    <ul className="space-y-1 text-sm">
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-pink-500" />
                        Cinematic AI visuals
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-pink-500" />
                        Visual storytelling
                      </li>
                      <li className="flex items-center gap-2">
                        <div className="h-1.5 w-1.5 rounded-full bg-pink-500" />
                        Immersive learning
                      </li>
                    </ul>
                    {usageStats && !usageStats.canUseFilmFormat && (
                      <div className="absolute top-2 right-2">
                        <Badge className="bg-amber-500 text-white">Premium</Badge>
                      </div>
                    )}
                  </button>
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(1)}
                    className="rounded-button border-2"
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1 rounded-button gradient-primary text-white hover-lift border-0 h-12 text-lg"
                    disabled={!canProceedStep2}
                    onClick={() => setStep(3)}
                  >
                    Next <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Creative Controls */}
          {step === 3 && (
            <Card className="rounded-card shadow-playful-lg border-2 animate-bounce-in">
              <CardContent className="space-y-6 pt-6">
                <div>
                  <h3 className="text-2xl font-bold">Step 3: Creative Controls</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Customize your {mode === "podcast" ? "podcast" : "film"} experience
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Story Theme *</Label>
                    <Select value={theme} onValueChange={setTheme}>
                      <SelectTrigger id="theme" className="rounded-xl">
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

                  <div className="space-y-2">
                    <Label htmlFor="length">Story Length *</Label>
                    {mode === "film" ? (
                      <Select 
                        value={videoDuration.toString()} 
                        onValueChange={(val) => {
                          setVideoDuration(parseInt(val));
                          // Map video duration to story length for backend compatibility
                          if (parseInt(val) === 30) setStoryLength("short");
                          else if (parseInt(val) === 60) setStoryLength("medium");
                          else setStoryLength("long");
                        }}
                      >
                        <SelectTrigger id="length" className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="30">30 seconds</SelectItem>
                          <SelectItem value="60">60 seconds</SelectItem>
                          <SelectItem value="90">90 seconds</SelectItem>
                        </SelectContent>
                      </Select>
                    ) : (
                      <Select value={storyLength} onValueChange={(v) => setStoryLength(v as "short" | "medium" | "long")}>
                        <SelectTrigger id="length" className="rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="short">
                            <div className="flex flex-col">
                              <span className="font-medium">Short</span>
                              <span className="text-xs text-muted-foreground">~1-2 minutes</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="medium">
                            <div className="flex flex-col">
                              <span className="font-medium">Medium</span>
                              <span className="text-xs text-muted-foreground">~3-5 minutes</span>
                            </div>
                          </SelectItem>
                          <SelectItem value="long">
                            <div className="flex flex-col">
                              <span className="font-medium">Long</span>
                              <span className="text-xs text-muted-foreground">~6-10 minutes</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    )}
                    {mode === "film" && (
                      <p className="text-xs text-muted-foreground">
                        Longer videos take more time to generate (~{Math.ceil(videoDuration / 5)} clips)
                      </p>
                    )}
                  </div>

                  {mode === "podcast" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="voice">Voice Type *</Label>
                        <Select value={voiceType} onValueChange={setVoiceType}>
                          <SelectTrigger id="voice" className="rounded-xl">
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
                      <div className="space-y-2">
                        <Label htmlFor="gender">Narrator Gender *</Label>
                        <Select value={narratorGender} onValueChange={(v) => setNarratorGender(v as "male" | "female")}>
                          <SelectTrigger id="gender" className="rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="female">Female</SelectItem>
                            <SelectItem value="male">Male</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {voiceType && targetLanguage && (
                        <VoicePreviewButtonEnhanced
                          targetLanguage={targetLanguage}
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

                  {mode === "film" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="style">Cinematic Style *</Label>
                        <Select value={cinematicStyle} onValueChange={setCinematicStyle}>
                          <SelectTrigger id="style" className="rounded-xl">
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

                      <div className="space-y-2">
                        <Label htmlFor="background-music">Background Music</Label>
                        <Select value={backgroundMusic} onValueChange={(val) => setBackgroundMusic(val as any)}>
                          <SelectTrigger id="background-music" className="rounded-xl">
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
                        
                        {/* Music Preview Button */}
                        {backgroundMusic && backgroundMusic !== "none" && (
                          <div className="pt-2 space-y-3">
                            <MusicPreviewButton
                              mood={backgroundMusic}
                              trackId={`${backgroundMusic}-1`}
                              trackName={backgroundMusic.charAt(0).toUpperCase() + backgroundMusic.slice(1)}
                              className="w-full"
                            />
                            
                            {/* Music Volume Slider */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <Label htmlFor="music-volume" className="text-sm flex items-center gap-1">
                                  <Volume2 className="h-4 w-4" />
                                  Music Volume
                                </Label>
                                <span className="text-sm font-medium text-muted-foreground">{musicVolume}%</span>
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
                              <p className="text-xs text-muted-foreground">
                                Adjust how loud the background music plays relative to narration
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {backgroundMusic === "none" && (
                          <p className="text-xs text-muted-foreground">
                            Add ambient background music to enhance immersion
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="subtitles" 
                            checked={addSubtitles}
                            onCheckedChange={(checked) => setAddSubtitles(checked as boolean)}
                          />
                          <Label htmlFor="subtitles" className="text-sm font-normal cursor-pointer">
                            Add subtitles to video for better comprehension
                          </Label>
                        </div>
                        {addSubtitles && (
                          <p className="text-xs text-muted-foreground ml-6">
                            Subtitle settings can be customized after video generation
                          </p>
                        )}
                      </div>
                    </>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={() => setStep(2)}
                    className="rounded-button border-2"
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1 rounded-button gradient-primary text-white hover-lift border-0 h-14 text-lg"
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
              </CardContent>
            </Card>
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
              className="flex-1 gradient-primary text-white"
            >
              Add {extractedVocab.filter(w => w.selected).length} Words
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Upgrade Prompt Modal */}
      <UpgradePromptModal
        open={showUpgradeModal}
        onOpenChange={setShowUpgradeModal}
        reason={upgradeReason}
      />
    </div>
  );
}
