import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Share2, Twitter, Facebook, Linkedin, Copy, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { APP_TITLE } from "@/const";

interface AchievementShareProps {
  achievementType: string;
  achievementTitle: string;
  achievementDescription: string;
  streakDays?: number;
}

export function AchievementShare({
  achievementType,
  achievementTitle,
  achievementDescription,
  streakDays,
}: AchievementShareProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  
  const trackShare = trpc.achievements.trackShare.useMutation();

  const shareUrl = typeof window !== "undefined" ? window.location.origin : "";
  const shareText = `🎉 I just achieved "${achievementTitle}" on ${APP_TITLE}! ${achievementDescription}`;

  const handleShare = async (platform: "twitter" | "facebook" | "linkedin") => {
    // Track the share event
    await trackShare.mutateAsync({
      achievementType,
      platform,
    });

    let url = "";
    switch (platform) {
      case "twitter":
        url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`;
        break;
      case "facebook":
        url = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}&quote=${encodeURIComponent(shareText)}`;
        break;
      case "linkedin":
        url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`;
        break;
    }

    window.open(url, "_blank", "width=600,height=400");
    toast.success(`Shared on ${platform}!`);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(`${shareText}\n\n${shareUrl}`);
    setCopied(true);
    toast.success("Copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="gap-2"
      >
        <Share2 className="h-4 w-4" />
        Share Achievement
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Share Your Achievement</DialogTitle>
            <DialogDescription>
              Let others know about your learning milestone!
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Achievement Card Preview */}
            <div className="bg-gradient-to-br from-purple-500 to-teal-500 rounded-lg p-6 text-white text-center">
              <div className="text-4xl mb-2">🏆</div>
              <h3 className="text-xl font-bold mb-1">{achievementTitle}</h3>
              <p className="text-sm opacity-90">{achievementDescription}</p>
              {streakDays && (
                <div className="mt-4 text-2xl font-bold">
                  {streakDays} Day{streakDays !== 1 ? "s" : ""} Streak! 🔥
                </div>
              )}
            </div>

            {/* Share Buttons */}
            <div className="grid grid-cols-3 gap-2">
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => handleShare("twitter")}
              >
                <Twitter className="h-4 w-4" />
                Twitter
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => handleShare("facebook")}
              >
                <Facebook className="h-4 w-4" />
                Facebook
              </Button>
              <Button
                variant="outline"
                className="gap-2"
                onClick={() => handleShare("linkedin")}
              >
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </Button>
            </div>

            {/* Copy Link */}
            <Button
              variant="secondary"
              className="w-full gap-2"
              onClick={copyToClipboard}
            >
              {copied ? (
                <>
                  <CheckCircle2 className="h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-4 w-4" />
                  Copy Link
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
