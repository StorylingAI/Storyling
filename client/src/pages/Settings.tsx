import { useState, useEffect, useRef } from "react";
import { trpc } from "../lib/trpc";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Loader2, CheckCircle2, XCircle, RefreshCw, Languages, Upload, Volume2, Eye, EyeOff, ArrowLeft, Settings as SettingsIcon } from "lucide-react";
import { Switch } from "../components/ui/switch";
import { Separator } from "../components/ui/separator";
import { Link } from "wouter";
import Breadcrumb from "../components/Breadcrumb";
import BreadcrumbPreferences from "../components/BreadcrumbPreferences";
import { WeeklyGoalSettings } from "../components/WeeklyGoalSettings";
import { WeeklyGoalBadges } from "../components/WeeklyGoalBadges";
import { MobileNav } from "../components/MobileNav";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import { Input } from "../components/ui/input";

function BulkImport() {
  const { data: user } = trpc.auth.me.useQuery();
  const utils = trpc.useUtils();
  const [wordList, setWordList] = useState("");
  const [targetLanguage, setTargetLanguage] = useState("");
  const [importStatus, setImportStatus] = useState<"idle" | "importing" | "success" | "error">("idle");
  const [importResults, setImportResults] = useState<{
    total: number;
    success: number;
    failed: number;
    skipped: number;
    errors: string[];
  } | null>(null);

  const bulkImport = trpc.wordbank.bulkImportWords.useMutation({
    onMutate: () => {
      setImportStatus("importing");
      setImportResults(null);
    },
    onSuccess: (data) => {
      setImportStatus("success");
      setImportResults(data);
      setWordList("");
      utils.wordbank.getMyWords.invalidate();
    },
    onError: (error) => {
      setImportStatus("error");
      console.error("Bulk import error:", error);
    },
  });

  const handleImport = () => {
    if (!wordList.trim() || !targetLanguage) {
      alert("Please enter words and select a target language");
      return;
    }

    // Parse words from textarea (comma or newline separated)
    const words = wordList
      .split(/[,\n]/)
      .map((w) => w.trim())
      .filter(Boolean);

    if (words.length === 0) {
      alert("Please enter at least one word");
      return;
    }

    if (words.length > 100) {
      alert("Maximum 100 words per import. Please reduce the list.");
      return;
    }

    bulkImport.mutate({ words, targetLanguage });
  };

  const languages = [
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
  ];

  return (
    <div>
      <h3 className="font-semibold mb-2">Bulk Import Words</h3>
      <p className="text-sm text-muted-foreground mb-4">
        Import multiple words at once. Enter words separated by commas or new lines (max 100 words).
        Words will be automatically translated to your preferred language.
      </p>

      <div className="space-y-4">
        <div>
          <Label htmlFor="word-list">Word List</Label>
          <Textarea
            id="word-list"
            placeholder="Enter words separated by commas or new lines...\ne.g., hello, world, language\nor one word per line"
            value={wordList}
            onChange={(e) => setWordList(e.target.value)}
            rows={6}
            disabled={importStatus === "importing"}
            className="mt-1"
          />
        </div>

        <div>
          <Label htmlFor="target-language">Target Language (language of the words)</Label>
          <Select value={targetLanguage} onValueChange={setTargetLanguage}>
            <SelectTrigger id="target-language" className="mt-1">
              <SelectValue placeholder="Select language" />
            </SelectTrigger>
            <SelectContent>
              {languages.map((lang) => (
                <SelectItem key={lang.value} value={lang.value}>
                  {lang.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          onClick={handleImport}
          disabled={importStatus === "importing" || !wordList.trim() || !targetLanguage}
          className="w-full sm:w-auto"
        >
          {importStatus === "importing" ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Importing...
            </>
          ) : (
            <>
              <Upload className="mr-2 h-4 w-4" />
              Import Words
            </>
          )}
        </Button>
      </div>

      {/* Results Display */}
      {importStatus === "success" && importResults && (
        <Alert className="border-green-200 bg-green-50 mt-4">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <div className="space-y-2">
              <p className="font-semibold text-green-900">Import completed!</p>
              <div className="text-sm text-green-800">
                <p>Total words: {importResults.total}</p>
                <p>Successfully imported: {importResults.success}</p>
                {importResults.skipped > 0 && (
                  <p className="text-yellow-700">Skipped (already in wordbank): {importResults.skipped}</p>
                )}
                {importResults.failed > 0 && (
                  <p className="text-red-600">Failed: {importResults.failed}</p>
                )}
              </div>
              {importResults.errors.length > 0 && (
                <details className="mt-2">
                  <summary className="cursor-pointer text-sm font-medium">
                    View details ({importResults.errors.length})
                  </summary>
                  <ul className="mt-2 space-y-1 text-xs max-h-40 overflow-y-auto">
                    {importResults.errors.map((error, idx) => (
                      <li key={idx} className="text-yellow-700">
                        {error}
                      </li>
                    ))}
                  </ul>
                </details>
              )}
            </div>
          </AlertDescription>
        </Alert>
      )}

      {importStatus === "error" && (
        <Alert className="border-red-200 bg-red-50 mt-4">
          <XCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-900">
            Failed to import words. Please try again or contact support.
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

function VoicePreview() {
  const [playingVoice, setPlayingVoice] = useState<string | null>(null);
  const [selectedLanguage, setSelectedLanguage] = useState("en");
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const voiceTypes = [
    { value: "warm_friendly", label: "Warm & Friendly" },
    { value: "professional", label: "Professional Narrator" },
    { value: "energetic", label: "Energetic & Upbeat" },
    { value: "calm", label: "Calm & Soothing" },
    { value: "dramatic", label: "Dramatic & Expressive" },
  ];

  const languages = [
    { value: "en", label: "English" },
    { value: "zh", label: "中文 (Chinese)" },
    { value: "es", label: "Español (Spanish)" },
    { value: "fr", label: "Français (French)" },
    { value: "de", label: "Deutsch (German)" },
  ];

  const sampleTexts: Record<string, string> = {
    en: "Welcome to Storyling AI. Learn languages through immersive stories.",
    zh: "欢迎来到Storyling AI。通过沉浸式故事学习语言。",
    es: "Bienvenido a Storyling AI. Aprende idiomas a través de historias inmersivas.",
    fr: "Bienvenue sur Storyling AI. Apprenez les langues grâce à des histoires immersives.",
    de: "Willkommen bei Storyling AI. Lernen Sie Sprachen durch immersive Geschichten.",
  };

  const generateVoicePreview = trpc.content.generateVoicePreview.useMutation({
    onSuccess: (data) => {
      if (audioRef.current && data.audioUrl) {
        audioRef.current.src = data.audioUrl;
        audioRef.current.play();
      }
    },
    onError: (error) => {
      console.error("Voice preview error:", error);
      setPlayingVoice(null);
    },
  });

  const handlePlayVoice = (voiceType: string, gender: "male" | "female") => {
    const voiceKey = `${voiceType}-${gender}`;
    setPlayingVoice(voiceKey);
    
    // Map language codes to full language names
    const languageMap: Record<string, string> = {
      en: "English",
      zh: "Chinese (Mandarin)",
      es: "Spanish",
      fr: "French",
      de: "German",
    };
    
    // Generate audio for sample text with proper voice type and gender
    generateVoicePreview.mutate({
      targetLanguage: languageMap[selectedLanguage] || "English",
      voiceType: voiceType,
      narratorGender: gender,
    });
  };

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    const handleEnded = () => setPlayingVoice(null);
    const handleError = () => setPlayingVoice(null);

    audio.addEventListener("ended", handleEnded);
    audio.addEventListener("error", handleError);

    return () => {
      audio.removeEventListener("ended", handleEnded);
      audio.removeEventListener("error", handleError);
    };
  }, []);

  return (
    <div className="space-y-6">
      {/* Language Selector */}
      <div>
        <Label htmlFor="preview-language" className="text-base font-semibold mb-2 block">
          Preview Language
        </Label>
        <Select value={selectedLanguage} onValueChange={setSelectedLanguage}>
          <SelectTrigger id="preview-language" className="w-64">
            <SelectValue placeholder="Select language" />
          </SelectTrigger>
          <SelectContent>
            {languages.map((lang) => (
              <SelectItem key={lang.value} value={lang.value}>
                {lang.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Voice Type Grid */}
      <div className="space-y-4">
        {voiceTypes.map((voice) => (
          <div key={voice.value} className="flex items-center justify-between p-4 border rounded-lg">
            <div>
              <p className="font-medium">{voice.label}</p>
              <p className="text-sm text-muted-foreground">Sample: "{sampleTexts[selectedLanguage]}"</p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePlayVoice(voice.value, "male")}
                disabled={playingVoice === `${voice.value}-male` || generateVoicePreview.isPending}
                className="gap-2"
              >
                {playingVoice === `${voice.value}-male` ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
                Male
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handlePlayVoice(voice.value, "female")}
                disabled={playingVoice === `${voice.value}-female` || generateVoicePreview.isPending}
                className="gap-2"
              >
                {playingVoice === `${voice.value}-female` ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
                Female
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Hidden audio element */}
      <audio ref={audioRef} className="hidden" />
    </div>
  );
}

function LanguagePreference() {
  const { data: user } = trpc.auth.me.useQuery();
  const utils = trpc.useUtils();
  const [selectedLanguage, setSelectedLanguage] = useState<string>("");
  const [selectedTranslationLanguage, setSelectedTranslationLanguage] = useState<string>("");
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "success">("idle");
  const [translationSaveStatus, setTranslationSaveStatus] = useState<"idle" | "saving" | "success">("idle");

  const updateLanguage = trpc.auth.updatePreferredLanguage.useMutation({
    onMutate: () => setSaveStatus("saving"),
    onSuccess: () => {
      setSaveStatus("success");
      utils.auth.me.invalidate();
      setTimeout(() => setSaveStatus("idle"), 2000);
    },
  });

  const updateTranslationLanguage = trpc.auth.updatePreferredTranslationLanguage.useMutation({
    onMutate: () => setTranslationSaveStatus("saving"),
    onSuccess: () => {
      setTranslationSaveStatus("success");
      utils.auth.me.invalidate();
      setTimeout(() => setTranslationSaveStatus("idle"), 2000);
    },
  });

  useEffect(() => {
    if (user?.preferredLanguage) {
      setSelectedLanguage(user.preferredLanguage);
    }
    if (user?.preferredTranslationLanguage) {
      setSelectedTranslationLanguage(user.preferredTranslationLanguage);
    }
  }, [user]);

  const handleLanguageChange = (language: string) => {
    setSelectedLanguage(language);
    updateLanguage.mutate({ language });
  };

  const handleTranslationLanguageChange = (language: string) => {
    setSelectedTranslationLanguage(language);
    updateTranslationLanguage.mutate({ language });
  };

  const languages = [
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
  ];

  return (
    <div className="space-y-6">
      {/* Learning Language Preference */}
      <div className="flex items-start gap-4">
        <Languages className="h-5 w-5 mt-1 text-muted-foreground" />
        <div className="flex-1 space-y-2">
          <div>
            <Label htmlFor="preferred-language" className="text-base font-semibold">
              Learning Language Preference
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              Choose your preferred language for the app interface and navigation.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedLanguage} onValueChange={handleLanguageChange}>
              <SelectTrigger id="preferred-language" className="w-64">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {saveStatus === "saving" && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </span>
            )}
            {saveStatus === "success" && (
              <span className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Saved!
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Translation Language Preference */}
      <div className="flex items-start gap-4">
        <Languages className="h-5 w-5 mt-1 text-muted-foreground" />
        <div className="flex-1 space-y-2">
          <div>
            <Label htmlFor="translation-language" className="text-base font-semibold">
              Translation Language
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              Choose your native language for vocabulary translations, sentence translations, and example sentences in stories.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Select value={selectedTranslationLanguage} onValueChange={handleTranslationLanguageChange}>
              <SelectTrigger id="translation-language" className="w-64">
                <SelectValue placeholder="Select language" />
              </SelectTrigger>
              <SelectContent>
                {languages.map((lang) => (
                  <SelectItem key={lang.value} value={lang.value}>
                    {lang.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {translationSaveStatus === "saving" && (
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <Loader2 className="h-3 w-3 animate-spin" />
                Saving...
              </span>
            )}
            {translationSaveStatus === "success" && (
              <span className="text-sm text-green-600 flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                Saved!
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function AccountProfileSettings() {
  const { data: user } = trpc.auth.me.useQuery();
  const utils = trpc.useUtils();
  const [displayName, setDisplayName] = useState("");

  const updateProfile = trpc.auth.updateProfile.useMutation({
    onSuccess: () => {
      utils.auth.me.invalidate();
    },
  });

  useEffect(() => {
    setDisplayName(user?.name || "");
  }, [user?.name]);

  const trimmedName = displayName.trim();
  const savedName = (user?.name || "").trim();
  const hasChanges = trimmedName.length > 0 && trimmedName !== savedName;

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <Label htmlFor="display-name" className="text-base font-semibold">
          Display Name
        </Label>
        <p className="text-sm text-muted-foreground">
          This is the name shown in your account and public profile.
        </p>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Input
            id="display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="Enter your display name"
            maxLength={120}
            className="sm:max-w-md"
          />
          <Button
            onClick={() => updateProfile.mutate({ name: trimmedName })}
            disabled={!hasChanges || updateProfile.isPending}
          >
            {updateProfile.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              "Save Name"
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-base font-semibold">Email Address</Label>
        <p className="rounded-md border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
          {user?.email || "No email available"}
        </p>
      </div>
    </div>
  );
}

export function Settings() {
  // Display settings from localStorage
  const [showPinyin, setShowPinyin] = useState(() => {
    const saved = localStorage.getItem('storylingai-show-pinyin');
    return saved !== null ? saved === 'true' : true;
  });
  const [showTranslations, setShowTranslations] = useState(() => {
    const saved = localStorage.getItem('storylingai-show-translations');
    return saved !== null ? saved === 'true' : true;
  });

  // Handle pinyin toggle
  const handlePinyinToggle = (checked: boolean) => {
    setShowPinyin(checked);
    localStorage.setItem('storylingai-show-pinyin', String(checked));
  };

  // Handle translations toggle
  const handleTranslationsToggle = (checked: boolean) => {
    setShowTranslations(checked);
    localStorage.setItem('storylingai-show-translations', String(checked));
  };

  const [backfillStatus, setBackfillStatus] = useState<"idle" | "running" | "success" | "error">("idle");
  const [backfillResults, setBackfillResults] = useState<{
    total: number;
    success: number;
    failed: number;
    errors: string[];
  } | null>(null);

  const backfillMutation = trpc.wordbank.backfillTranslations.useMutation({
    onMutate: () => {
      setBackfillStatus("running");
      setBackfillResults(null);
    },
    onSuccess: (data) => {
      setBackfillStatus("success");
      setBackfillResults(data);
    },
    onError: (error) => {
      setBackfillStatus("error");
      console.error("Backfill error:", error);
    },
  });

  const handleBackfill = () => {
    if (confirm("This will regenerate translations for all words without translation data. Continue?")) {
      backfillMutation.mutate();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50">
      {/* Mobile hamburger nav */}
      <MobileNav title="Settings" backPath="/app" />


      <div className="container max-w-4xl py-8">
        {/* Breadcrumb */}
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/app" },
            { label: "Settings", href: undefined },
          ]}
        />

      <div className="space-y-6">
        {/* Vocabulary Management */}
        <Card>
          <CardHeader>
            <CardTitle>Vocabulary Management</CardTitle>
            <CardDescription>
              Manage your saved vocabulary and translation data
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <BulkImport />
            <div className="border-t border-border pt-6">
            <div>
              <h3 className="font-semibold mb-2">Backfill Translations</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Regenerate translations for words that are missing translation data.
                This uses AI to generate English translations, pinyin (for Chinese), and example sentences.
              </p>

              <Button
                onClick={handleBackfill}
                disabled={backfillStatus === "running"}
                className="w-full sm:w-auto"
              >
                {backfillStatus === "running" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <RefreshCw className="mr-2 h-4 w-4" />
                    Regenerate Translations
                  </>
                )}
              </Button>
            </div>
            </div>

            {/* Results Display */}
            {backfillStatus === "success" && backfillResults && (
              <Alert className="border-green-200 bg-green-50">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <AlertDescription>
                  <div className="space-y-2">
                    <p className="font-semibold text-green-900">Backfill completed successfully!</p>
                    <div className="text-sm text-green-800">
                      <p>Total words processed: {backfillResults.total}</p>
                      <p>Successfully updated: {backfillResults.success}</p>
                      {backfillResults.failed > 0 && (
                        <p className="text-red-600">Failed: {backfillResults.failed}</p>
                      )}
                    </div>
                    {backfillResults.errors.length > 0 && (
                      <details className="mt-2">
                        <summary className="cursor-pointer text-sm font-medium">
                          View errors ({backfillResults.errors.length})
                        </summary>
                        <ul className="mt-2 space-y-1 text-xs">
                          {backfillResults.errors.map((error, idx) => (
                            <li key={idx} className="text-red-700">
                              {error}
                            </li>
                          ))}
                        </ul>
                      </details>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            )}

            {backfillStatus === "error" && (
              <Alert className="border-red-200 bg-red-50">
                <XCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-900">
                  Failed to backfill translations. Please try again or contact support.
                </AlertDescription>
              </Alert>
            )}
          </CardContent>
        </Card>

        {/* Voice Preview */}
        <Card>
          <CardHeader>
            <CardTitle>Voice Preview</CardTitle>
            <CardDescription>
              Preview different voice types before creating stories
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VoicePreview />
          </CardContent>
        </Card>

        {/* Weekly Goal Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Weekly Goal</CardTitle>
            <CardDescription>
              Set your weekly story creation goal to stay motivated
            </CardDescription>
          </CardHeader>
          <CardContent>
            <WeeklyGoalSettings />
          </CardContent>
        </Card>

        {/* Weekly Goal Achievements */}
        <WeeklyGoalBadges />

        {/* Account Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Account Settings</CardTitle>
            <CardDescription>
              Manage your account preferences
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              <AccountProfileSettings />
              <Separator />
              <LanguagePreference />
            </div>
          </CardContent>
        </Card>

        {/* Breadcrumb Navigation Settings */}
        <Card>
          <CardHeader>
            <CardTitle>Breadcrumb Navigation</CardTitle>
            <CardDescription>
              Customize how breadcrumb navigation appears throughout the app
            </CardDescription>
          </CardHeader>
          <CardContent>
            <BreadcrumbPreferences />
          </CardContent>
        </Card>

        {/* Email Digest Settings - Moved to /digests page */}

        {/* Display Settings */}
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-primary" />
              <CardTitle>Display Settings</CardTitle>
            </div>
            <CardDescription>
              Customize how content is displayed during playback
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Show Pinyin */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-pinyin" className="text-sm font-medium">
                  Show Pinyin
                </Label>
                <p className="text-xs text-muted-foreground">
                  Display pinyin pronunciation above Chinese characters
                </p>
              </div>
              <Switch
                id="show-pinyin"
                checked={showPinyin}
                onCheckedChange={handlePinyinToggle}
              />
            </div>

            <Separator />

            {/* Show Translations */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label htmlFor="show-translations" className="text-sm font-medium">
                  Show Translations
                </Label>
                <p className="text-xs text-muted-foreground">
                  Display translations below sentences during playback
                </p>
              </div>
              <Switch
                id="show-translations"
                checked={showTranslations}
                onCheckedChange={handleTranslationsToggle}
              />
            </div>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
