import { useState, useMemo } from "react";
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
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, Upload, ArrowRight, Sparkles, BookOpen, Headphones, Film } from "lucide-react";
import { APP_TITLE, APP_LOGO, getLoginUrl, getSignUpUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

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

const PROFICIENCY_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

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

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [step, setStep] = useState(1);

  // Step 1 state
  const [targetLanguage, setTargetLanguage] = useState("");
  const [proficiencyLevel, setProficiencyLevel] = useState("");
  const [vocabularyText, setVocabularyText] = useState("");
  const [topicPrompt, setTopicPrompt] = useState("");

  // Step 2 state
  const [mode, setMode] = useState<"podcast" | "film" | "">("");

  // Step 3 state
  const [theme, setTheme] = useState("");
  const [voiceType, setVoiceType] = useState("");
  const [narratorGender, setNarratorGender] = useState<"male" | "female">("female");
  const [cinematicStyle, setCinematicStyle] = useState("");

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

  const generateMutation = trpc.content.generate.useMutation({
    onSuccess: (data) => {
      toast.success("Content generation started! Check your library in a few minutes.");
      // Reset form
      setStep(1);
      setTargetLanguage("");
      setProficiencyLevel("");
      setVocabularyText("");
      setTopicPrompt("");
      setMode("");
      setTheme("");
      setVoiceType("");
      setCinematicStyle("");
    },
    onError: (error) => {
      toast.error("Failed to start content generation: " + error.message);
    },
  });

  const handleGenerate = () => {
    if (!isAuthenticated) {
      // Redirect to sign-up page instead of showing error
      window.location.href = getSignUpUrl();
      return;
    }

    generateMutation.mutate({
      targetLanguage,
      proficiencyLevel: proficiencyLevel as "A1" | "A2" | "B1" | "B2" | "C1" | "C2",
      vocabularyText,
      theme,
      topicPrompt,
      mode: mode as "podcast" | "film",
      voiceType: mode === "podcast" ? voiceType : undefined,
      narratorGender: mode === "podcast" ? narratorGender : undefined,
      cinematicStyle: mode === "film" ? cinematicStyle : undefined,
    });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-playful">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
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
                  onClick={() => window.location.href = "/library"}
                  className="rounded-button hover-lift"
                >
                  <BookOpen className="w-4 h-4 mr-2" />
                  My Library
                </Button>
              </>
            ) : (
              <Button
                onClick={() => window.location.href = getLoginUrl()}
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
                      <Button variant="ghost" size="sm" className="rounded-button">
                        <Upload className="mr-2 h-4 w-4" />
                        Upload CSV
                      </Button>
                    </div>
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
                  <h3 className="text-2xl font-bold">Step 2: Mode</h3>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Choose how you want to experience your story
                  </p>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <button
                    onClick={() => setMode("podcast")}
                    className={`p-6 rounded-card border-2 transition-all hover-lift ${
                      mode === "podcast"
                        ? "border-primary bg-primary/5 shadow-playful-lg"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center">
                        <Headphones className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-center">
                        <h4 className="font-bold text-lg mb-1">Podcast Mode</h4>
                        <p className="text-sm text-muted-foreground">
                          Listen to your story with professional narration
                        </p>
                        <div className="text-xs text-muted-foreground mt-2">
                          ⏱️ ~5 min generation time
                        </div>
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => setMode("film")}
                    className={`p-6 rounded-card border-2 transition-all hover-lift ${
                      mode === "film"
                        ? "border-secondary bg-secondary/5 shadow-playful-lg"
                        : "border-border hover:border-secondary/50"
                    }`}
                  >
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 rounded-full gradient-warm flex items-center justify-center">
                        <Film className="w-8 h-8 text-white" />
                      </div>
                      <div className="text-center">
                        <h4 className="font-bold text-lg mb-1">Film Mode</h4>
                        <p className="text-sm text-muted-foreground">
                          Watch your story come to life with AI video
                        </p>
                        <div className="text-xs text-muted-foreground mt-2">
                          ⏱️ ~15 min generation time
                        </div>
                      </div>
                    </div>
                  </button>
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 rounded-button hover-lift h-12" onClick={() => setStep(1)}>
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
                    Customize the style and tone of your content
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="theme">Theme *</Label>
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

                  {mode === "podcast" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="voice">Voice Type *</Label>
                        <Select value={voiceType} onValueChange={setVoiceType}>
                          <SelectTrigger id="voice" className="rounded-xl">
                            <SelectValue placeholder="Select a voice type" />
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
                    </>
                  )}

                  {mode === "film" && (
                    <div className="space-y-2">
                      <Label htmlFor="cinematic">Cinematic Style *</Label>
                      <Select value={cinematicStyle} onValueChange={setCinematicStyle}>
                        <SelectTrigger id="cinematic" className="rounded-xl">
                          <SelectValue placeholder="Select a cinematic style" />
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
                  )}
                </div>

                <div className="flex gap-3">
                  <Button variant="outline" className="flex-1 rounded-button hover-lift h-12" onClick={() => setStep(2)}>
                    Back
                  </Button>
                  <Button
                    className="flex-1 rounded-button gradient-warm text-white hover-lift border-0 h-12 text-lg"
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
    </div>
  );
}

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
        className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg transition-all ${
          active
            ? "gradient-primary text-white shadow-playful-lg scale-110"
            : completed
              ? "bg-primary text-white"
              : "bg-muted text-muted-foreground"
        }`}
      >
        {number}
      </div>
      <span className={`text-sm font-medium ${active ? "text-foreground" : "text-muted-foreground"}`}>{label}</span>
    </div>
  );
}


