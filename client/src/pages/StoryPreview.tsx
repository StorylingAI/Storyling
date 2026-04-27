import { useRoute, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { useState } from "react";
import { APP_LOGO } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  Sparkles,
  Globe,
  User,
  ArrowRight,
  Play,
  Lock,
} from "lucide-react";

// Language display names
const LANGUAGE_NAMES: Record<string, string> = {
  zh: "Chinese", "zh-CN": "Chinese", "zh-TW": "Chinese",
  es: "Spanish", fr: "French", de: "German", it: "Italian",
  pt: "Portuguese", ja: "Japanese", ko: "Korean", ar: "Arabic",
  ru: "Russian", hi: "Hindi", tr: "Turkish", nl: "Dutch",
  sv: "Swedish", pl: "Polish", vi: "Vietnamese", th: "Thai",
  id: "Indonesian",
};

function getLanguageName(code: string): string {
  return LANGUAGE_NAMES[code] || code;
}

export default function StoryPreview() {
  const [, params] = useRoute("/story/:id");
  const storyId = params?.id ? parseInt(params.id) : 0;
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [coverFailed, setCoverFailed] = useState(false);

  const { data: story, isLoading, error } = trpc.content.getPublicPreview.useQuery(
    { id: storyId },
    { enabled: storyId > 0, retry: false }
  );

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-purple-300 border-t-purple-600 rounded-full animate-spin mx-auto" />
          <p className="text-gray-500" style={{ fontFamily: "Outfit, sans-serif" }}>Loading story preview...</p>
        </div>
      </div>
    );
  }

  if (error || !story) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-6">
        <div className="text-center space-y-6 max-w-md">
          <BookOpen className="h-16 w-16 text-purple-300 mx-auto" />
          <h1 className="text-2xl font-bold text-gray-900" style={{ fontFamily: "Fredoka, sans-serif" }}>
            Story Not Found
          </h1>
          <p className="text-gray-500" style={{ fontFamily: "Outfit, sans-serif" }}>
            This story may have been removed or is no longer available.
          </p>
          <Button
            onClick={() => setLocation("/")}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 rounded-full px-8 h-12"
          >
            <Sparkles className="mr-2 h-5 w-5" />
            Explore Storyling.ai
          </Button>
        </div>
      </div>
    );
  }

  const langName = getLanguageName(story.targetLanguage);
  const coverSrc = story.thumbnailUrl && !coverFailed ? story.thumbnailUrl : APP_LOGO;
  const hasStoryCover = Boolean(story.thumbnailUrl && !coverFailed);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        {/* Background */}
        <div className="absolute inset-0">
          {story.thumbnailUrl && !coverFailed ? (
            <>
              <img
                src={story.thumbnailUrl}
                alt=""
                className="w-full h-full object-cover"
                onError={() => setCoverFailed(true)}
              />
              <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-purple-900/90" />
            </>
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-900 via-purple-700 to-blue-800">
              <img src={APP_LOGO} alt="" className="h-28 w-28 opacity-25" />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="relative z-10 max-w-5xl mx-auto px-6 pt-16 pb-20">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-10">
            <Sparkles className="h-5 w-5 text-yellow-300" />
            <span
              className="text-sm font-bold text-white/80 tracking-wider uppercase"
              style={{ fontFamily: "Fredoka, sans-serif" }}
            >
              Storyling.ai
            </span>
          </div>

          <div className="grid gap-8 md:grid-cols-[1fr_280px] md:items-end">
            <div>
              {/* Metadata badges */}
              <div className="flex flex-wrap items-center gap-2 mb-4">
                {story.difficultyLevel && (
                  <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm text-xs">
                    {story.difficultyLevel}
                  </Badge>
                )}
                {story.theme && (
                  <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm text-xs">
                    {story.theme}
                  </Badge>
                )}
                <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm text-xs">
                  <Globe className="h-3 w-3 mr-1" />
                  {langName}
                </Badge>
                <Badge className="bg-white/20 text-white border-0 backdrop-blur-sm text-xs">
                  {story.mode === "film" ? (
                    <><Play className="h-3 w-3 mr-1" /> Film</>
                  ) : (
                    <><BookOpen className="h-3 w-3 mr-1" /> Podcast</>
                  )}
                </Badge>
              </div>

              {/* Title */}
              <h1
                className="text-3xl sm:text-4xl font-bold text-white mb-2 leading-tight"
                style={{ fontFamily: "Fredoka, sans-serif" }}
              >
                {story.title}
              </h1>
              {story.titleTranslation && (
                <p className="text-lg text-white/60 mb-6" style={{ fontFamily: "Outfit, sans-serif" }}>
                  {story.titleTranslation}
                </p>
              )}

              {/* Author */}
              <div className="flex items-center gap-2 text-white/50 text-sm">
                <User className="h-4 w-4" />
                <span style={{ fontFamily: "Outfit, sans-serif" }}>Created by {story.authorName}</span>
              </div>
            </div>

            <div className="hidden md:block">
              <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-sm">
                <img
                  src={coverSrc}
                  alt={hasStoryCover ? `${story.title} cover` : ""}
                  className={hasStoryCover ? "h-full w-full object-cover" : "h-full w-full object-contain p-10 opacity-70"}
                  onError={() => setCoverFailed(true)}
                />
              </div>
            </div>
          </div>

          <div className="mt-8 md:hidden">
            <div className="aspect-[4/3] overflow-hidden rounded-2xl border border-white/20 bg-white/10 shadow-2xl backdrop-blur-sm">
              <img
                src={coverSrc}
                alt={hasStoryCover ? `${story.title} cover` : ""}
                className={hasStoryCover ? "h-full w-full object-cover" : "h-full w-full object-contain p-10 opacity-70"}
                onError={() => setCoverFailed(true)}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Story Preview Section */}
      <div className="max-w-3xl mx-auto px-6 -mt-8 relative z-20">
        <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
          {/* Preview text */}
          <div className="p-6 sm:p-8">
            <p className="text-xs text-purple-600 font-bold uppercase tracking-wider mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>
              Story Preview
            </p>

            {/* Original text */}
            <div className="space-y-4 mb-6">
              {story.previewTranslations && story.previewTranslations.length > 0 ? (
                story.previewTranslations.map((line: any, idx: number) => (
                  <div key={idx} className="space-y-1">
                    <p className="text-lg text-gray-900 leading-relaxed" style={{ fontFamily: "Outfit, sans-serif" }}>
                      {line.original}
                    </p>
                    {line.pinyin && (
                      <p className="text-sm text-purple-400 italic">{line.pinyin}</p>
                    )}
                    <p className="text-sm text-gray-400 italic" style={{ fontFamily: "Outfit, sans-serif" }}>
                      {line.english}
                    </p>
                  </div>
                ))
              ) : (
                <p className="text-lg text-gray-900 leading-relaxed" style={{ fontFamily: "Outfit, sans-serif" }}>
                  {story.previewText}
                </p>
              )}
            </div>

            {/* Fade out + locked indicator */}
            <div className="relative">
              <div className="h-20 bg-gradient-to-b from-transparent to-white" />
              <div className="text-center pb-2">
                <div className="inline-flex items-center gap-2 text-gray-400 text-sm">
                  <Lock className="h-4 w-4" />
                  <span style={{ fontFamily: "Outfit, sans-serif" }}>
                    {story.totalSentences - 3} more sentences in the full story
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 p-6 sm:p-8 border-t border-gray-100">
            <div className="text-center space-y-4">
              <h2
                className="text-xl font-bold text-gray-900"
                style={{ fontFamily: "Fredoka, sans-serif" }}
              >
                {isAuthenticated
                  ? "Continue reading this story"
                  : "Join Storyling to read the full story"}
              </h2>
              <p className="text-sm text-gray-500 max-w-md mx-auto" style={{ fontFamily: "Outfit, sans-serif" }}>
                Learn {langName} through immersive stories with interactive vocabulary, audio playback, and AI-powered comprehension tools.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
                {isAuthenticated ? (
                  <Button
                    onClick={() => setLocation(`/content/${story.id}`)}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 rounded-full px-8 h-12 text-base font-semibold hover:shadow-lg transition-all"
                  >
                    Read Full Story
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                ) : (
                  <>
                    <Button
                      onClick={() => setLocation("/signup")}
                      className="bg-gradient-to-r from-purple-600 to-blue-600 text-white border-0 rounded-full px-8 h-12 text-base font-semibold hover:shadow-lg transition-all"
                    >
                      Join Free
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </Button>
                    <Button
                      onClick={() => setLocation("/login")}
                      variant="outline"
                      className="rounded-full px-6 h-12 text-sm"
                    >
                      Already have an account? Log in
                    </Button>
                  </>
                )}
              </div>

              <p className="text-xs text-gray-400" style={{ fontFamily: "Outfit, sans-serif" }}>
                No credit card required. Free forever plan available.
              </p>
            </div>
          </div>
        </div>

        {/* Social proof */}
        <div className="text-center py-8">
          <p className="text-sm text-gray-400" style={{ fontFamily: "Outfit, sans-serif" }}>
            Join 35,000+ learners reading stories in 19 languages
          </p>
        </div>
      </div>
    </div>
  );
}
