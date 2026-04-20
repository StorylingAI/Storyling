import { useState, useRef, useCallback, useMemo } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Share2,
  Copy,
  Check,
  Download,
  MessageCircle,
  Twitter,
  Facebook,
  Mail,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  normalizeLineTranslations,
  safeString,
  type DisplayLineTranslation,
} from "@/lib/contentDisplay";

// Client-side share rate limiting (10 shares/day)
const SHARE_LIMIT_PER_DAY = 10;
const SHARE_LIMIT_KEY = "storyling_share_count";

function getShareCount(): { count: number; date: string } {
  try {
    const data = JSON.parse(localStorage.getItem(SHARE_LIMIT_KEY) || "{}");
    const today = new Date().toISOString().split("T")[0];
    if (data.date === today) return { count: data.count || 0, date: today };
    return { count: 0, date: today };
  } catch {
    return { count: 0, date: new Date().toISOString().split("T")[0] };
  }
}

function incrementShareCount(): boolean {
  const { count, date } = getShareCount();
  if (count >= SHARE_LIMIT_PER_DAY) return false;
  localStorage.setItem(SHARE_LIMIT_KEY, JSON.stringify({ count: count + 1, date }));
  return true;
}

interface ShareStoryModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  storyId: number;
  storyTitle: string;
  storyText?: unknown;
  titleTranslation?: string;
  lineTranslations?: unknown;
  language: string;
  wordsLearned?: number;
  thumbnailUrl?: string;
  genre?: string;
  cefrLevel?: string;
}

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

// Extract 1-2 sentences from story text
function extractSnippet(text: string, maxSentences = 2): string {
  const cleaned = text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/_(.+?)_/g, "$1");
  const sentences = cleaned.split(/(?<=[.!?。！？])\s*/);
  return sentences.slice(0, maxSentences).join(" ").trim();
}

// Get translation for the snippet
function getSnippetTranslation(
  snippet: string,
  lineTranslations?: DisplayLineTranslation[],
): string {
  if (!lineTranslations?.length) return "";
  // Try to match the first 1-2 lines
  const translations: string[] = [];
  for (const lt of lineTranslations) {
    if (translations.length >= 2) break;
    const cleanOriginal = lt.original
      .replace(/\*\*(.+?)\*\*/g, "$1")
      .replace(/\*(.+?)\*/g, "$1")
      .trim();
    if (!cleanOriginal || !lt.english.trim()) {
      continue;
    }
    if (snippet.includes(cleanOriginal.substring(0, 20))) {
      translations.push(lt.english.trim());
    }
  }
  if (translations.length === 0 && lineTranslations.length > 0) {
    return lineTranslations
      .slice(0, 2)
      .map((lt) => lt.english.trim())
      .filter(Boolean)
      .join(" ");
  }
  return translations.join(" ");
}

export function ShareStoryModal({
  open,
  onOpenChange,
  storyId,
  storyTitle,
  storyText,
  titleTranslation,
  lineTranslations,
  language,
  wordsLearned = 0,
  thumbnailUrl,
  genre,
  cefrLevel,
}: ShareStoryModalProps) {
  const [copied, setCopied] = useState(false);
  const [shareMode, setShareMode] = useState<"sentence" | "paragraph">("sentence");
  const cardRef = useRef<HTMLDivElement>(null);
  const safeStoryText = useMemo(() => safeString(storyText), [storyText]);
  const safeLineTranslations = useMemo(
    () => normalizeLineTranslations(lineTranslations),
    [lineTranslations],
  );

  const snippet = extractSnippet(safeStoryText, shareMode === "sentence" ? 2 : 4);
  const translationSnippet = getSnippetTranslation(snippet, safeLineTranslations);
  const langName = getLanguageName(language);
  const shareUrl = `${window.location.origin}/story/${storyId}`;

  const shareText = wordsLearned > 0
    ? `I just read a short ${genre ? genre.toLowerCase() + " " : ""}story in ${langName} and learned ${wordsLearned} new words. Try it on Storyling.`
    : `I just read a short ${genre ? genre.toLowerCase() + " " : ""}story in ${langName}. Try it on Storyling.`;

  const checkRateLimit = useCallback((): boolean => {
    if (!incrementShareCount()) {
      toast.error("You've reached the daily share limit. Try again tomorrow!");
      return false;
    }
    return true;
  }, []);

  const handleNativeShare = useCallback(async () => {
    if (!checkRateLimit()) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: storyTitle,
          text: shareText,
          url: shareUrl,
        });
        toast.success("Story shared!");
      } catch (err: any) {
        if (err.name !== "AbortError") {
          handleCopyLink();
        }
      }
    } else {
      handleCopyLink();
    }
  }, [storyTitle, shareText, shareUrl, checkRateLimit]);

  const handleCopyLink = useCallback(() => {
    if (!incrementShareCount()) {
      toast.error("You've reached the daily share limit. Try again tomorrow!");
      return;
    }
    navigator.clipboard.writeText(`${shareText}\n${shareUrl}`);
    setCopied(true);
    toast.success("Link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  }, [shareText, shareUrl]);

  const handleShareTo = (platform: string) => {
    if (!checkRateLimit()) return;
    const encodedText = encodeURIComponent(shareText);
    const encodedUrl = encodeURIComponent(shareUrl);
    let url = "";

    switch (platform) {
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}&quote=${encodedText}`;
        break;
      case "whatsapp":
        url = `https://wa.me/?text=${encodedText}%20${encodedUrl}`;
        break;
      case "telegram":
        url = `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`;
        break;
      case "email":
        url = `mailto:?subject=${encodeURIComponent(storyTitle)}&body=${encodedText}%0A%0A${encodedUrl}`;
        break;
    }

    if (url) window.open(url, "_blank");
  };

  const handleDownloadCard = useCallback(async () => {
    if (!cardRef.current) return;
    try {
      // Use html2canvas-like approach with canvas
      const card = cardRef.current;
      const canvas = document.createElement("canvas");
      const scale = 2;
      canvas.width = card.offsetWidth * scale;
      canvas.height = card.offsetHeight * scale;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.scale(scale, scale);

      // Draw gradient background
      const gradient = ctx.createLinearGradient(0, 0, card.offsetWidth, card.offsetHeight);
      gradient.addColorStop(0, "#7C3AED");
      gradient.addColorStop(0.5, "#4F46E5");
      gradient.addColorStop(1, "#2563EB");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, card.offsetWidth, card.offsetHeight);

      // Draw text
      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "bold 14px system-ui";
      ctx.fillText("STORYLING.AI", 24, 36);

      ctx.fillStyle = "#FFFFFF";
      ctx.font = "bold 22px system-ui";
      // Word wrap title
      const titleLines = wrapText(ctx, storyTitle, card.offsetWidth - 48, 22);
      let y = 70;
      for (const line of titleLines) {
        ctx.fillText(line, 24, y);
        y += 28;
      }

      // Story snippet
      y += 12;
      ctx.font = "italic 15px system-ui";
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      const snippetLines = wrapText(ctx, `"${snippet}"`, card.offsetWidth - 48, 15);
      for (const line of snippetLines) {
        ctx.fillText(line, 24, y);
        y += 20;
      }

      // Translation
      if (translationSnippet) {
        y += 8;
        ctx.font = "italic 13px system-ui";
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        const transLines = wrapText(ctx, `"${translationSnippet}"`, card.offsetWidth - 48, 13);
        for (const line of transLines) {
          ctx.fillText(line, 24, y);
          y += 18;
        }
      }

      // Footer
      y = card.offsetHeight - 30;
      ctx.font = "13px system-ui";
      ctx.fillStyle = "rgba(255,255,255,0.6)";
      ctx.fillText("Learn languages through stories \u2022 storyling.ai", 24, y);

      // Download
      const link = document.createElement("a");
      link.download = `storyling-${storyTitle.replace(/\s+/g, "-").toLowerCase()}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Share card downloaded!");
    } catch {
      toast.error("Failed to generate share card");
    }
  }, [storyTitle, snippet, translationSnippet]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md p-0 overflow-hidden rounded-2xl border-0 bg-white">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle
            className="text-xl font-bold text-gray-900"
            style={{ fontFamily: "Fredoka, sans-serif" }}
          >
            Share This Story
          </DialogTitle>
          <p className="text-sm text-gray-500" style={{ fontFamily: "Outfit, sans-serif" }}>
            Share a scene from your story with friends
          </p>
        </DialogHeader>

        {/* Share Card Preview */}
        <div className="px-6">
          <div
            ref={cardRef}
            className="rounded-xl overflow-hidden shadow-lg"
            style={{
              background: "linear-gradient(135deg, #7C3AED 0%, #4F46E5 50%, #2563EB 100%)",
              minHeight: 220,
            }}
          >
            <div className="p-5">
              {/* Logo */}
              <div className="flex items-center gap-2 mb-4">
                <Sparkles className="h-4 w-4 text-yellow-300" />
                <span
                  className="text-xs font-bold text-white/70 tracking-wider uppercase"
                  style={{ fontFamily: "Fredoka, sans-serif" }}
                >
                  Storyling.ai
                </span>
              </div>

              {/* Title */}
              <h3
                className="text-lg font-bold text-white mb-3 leading-tight"
                style={{ fontFamily: "Fredoka, sans-serif" }}
              >
                {storyTitle}
              </h3>

              {/* Story snippet */}
              <p className="text-sm text-white/90 italic leading-relaxed mb-2">
                &ldquo;{snippet}&rdquo;
              </p>

              {/* Translation */}
              {translationSnippet && (
                <p className="text-xs text-white/50 italic leading-relaxed mb-4">
                  &ldquo;{translationSnippet}&rdquo;
                </p>
              )}

              {/* Stats row */}
              <div className="flex items-center gap-3 mb-3">
                {cefrLevel && (
                  <span className="text-[10px] font-bold text-white/80 bg-white/15 px-2 py-0.5 rounded-full">
                    {cefrLevel}
                  </span>
                )}
                {genre && (
                  <span className="text-[10px] font-bold text-white/80 bg-white/15 px-2 py-0.5 rounded-full">
                    {genre}
                  </span>
                )}
                {wordsLearned > 0 && (
                  <span className="text-[10px] text-white/60">
                    {wordsLearned} words learned
                  </span>
                )}
              </div>

              {/* CTA */}
              <div className="flex items-center justify-between pt-2 border-t border-white/10">
                <span className="text-xs text-white/50">
                  Learn languages through stories
                </span>
                <span className="text-xs font-bold text-yellow-300">
                  Read full story &rarr;
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Snippet length toggle */}
        <div className="px-6 pt-3 flex items-center gap-2">
          <span className="text-xs text-gray-400">Share:</span>
          <button
            onClick={() => setShareMode("sentence")}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${
              shareMode === "sentence"
                ? "bg-purple-100 text-purple-700 font-medium"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            1-2 sentences
          </button>
          <button
            onClick={() => setShareMode("paragraph")}
            className={`text-xs px-3 py-1 rounded-full transition-colors ${
              shareMode === "paragraph"
                ? "bg-purple-100 text-purple-700 font-medium"
                : "text-gray-400 hover:text-gray-600"
            }`}
          >
            Paragraph
          </button>
        </div>

        {/* Share destinations */}
        <div className="px-6 pt-4 pb-2">
          <p className="text-xs text-gray-400 mb-3 font-medium uppercase tracking-wider">
            Share to
          </p>
          <div className="grid grid-cols-5 gap-2">
            {[
              { icon: <Share2 className="h-5 w-5" />, label: "Share", action: handleNativeShare, color: "bg-purple-100 text-purple-600" },
              { icon: <Twitter className="h-5 w-5" />, label: "X", action: () => handleShareTo("twitter"), color: "bg-gray-100 text-gray-700" },
              { icon: <MessageCircle className="h-5 w-5" />, label: "WhatsApp", action: () => handleShareTo("whatsapp"), color: "bg-green-100 text-green-600" },
              { icon: <Facebook className="h-5 w-5" />, label: "Facebook", action: () => handleShareTo("facebook"), color: "bg-blue-100 text-blue-600" },
              { icon: <Mail className="h-5 w-5" />, label: "Email", action: () => handleShareTo("email"), color: "bg-orange-100 text-orange-600" },
            ].map((dest) => (
              <button
                key={dest.label}
                onClick={dest.action}
                className={`flex flex-col items-center gap-1.5 p-3 rounded-xl ${dest.color} hover:scale-105 transition-transform`}
              >
                {dest.icon}
                <span className="text-[10px] font-medium">{dest.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Copy link + Download card */}
        <div className="px-6 pb-6 pt-2 flex gap-2">
          <Button
            onClick={handleCopyLink}
            variant="outline"
            className="flex-1 rounded-xl h-11 text-sm font-medium"
          >
            {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
            {copied ? "Copied!" : "Copy Link"}
          </Button>
          <Button
            onClick={handleDownloadCard}
            variant="outline"
            className="rounded-xl h-11 text-sm font-medium px-4"
          >
            <Download className="h-4 w-4" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// Helper: wrap text for canvas drawing
function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number, fontSize: number): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && currentLine) {
      lines.push(currentLine);
      currentLine = word;
    } else {
      currentLine = testLine;
    }
  }
  if (currentLine) lines.push(currentLine);
  return lines;
}
