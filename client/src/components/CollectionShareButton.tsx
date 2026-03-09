import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Share2, Twitter, Linkedin, Facebook, Link2, Check } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

interface CollectionShareButtonProps {
  collectionId: number;
  collectionName: string;
  collectionDescription?: string;
  itemCount: number;
  viewCount: number;
  cloneCount: number;
  shareToken?: string;
}

export function CollectionShareButton({
  collectionId,
  collectionName,
  collectionDescription,
  itemCount,
  viewCount,
  cloneCount,
  shareToken,
}: CollectionShareButtonProps) {
  const [copied, setCopied] = useState(false);
  const trackShare = trpc.collectionAnalytics.trackShare.useMutation();

  // Generate share URL
  const shareUrl = shareToken
    ? `${window.location.origin}/shared/${shareToken}`
    : `${window.location.origin}/collection/${collectionId}`;

  // Generate share text
  const shareText = `Check out "${collectionName}" - a collection of ${itemCount} language learning ${
    itemCount === 1 ? "story" : "stories"
  } on Storyling AI! 🎓✨`;

  const handleShare = async (platform: "twitter" | "linkedin" | "facebook" | "copy_link") => {
    // Track share event
    try {
      await trackShare.mutateAsync({ collectionId, platform });
    } catch (error) {
      console.error("Failed to track share:", error);
    }

    switch (platform) {
      case "twitter":
        window.open(
          `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(shareUrl)}`,
          "_blank",
          "width=550,height=420"
        );
        break;

      case "linkedin":
        window.open(
          `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`,
          "_blank",
          "width=550,height=420"
        );
        break;

      case "facebook":
        window.open(
          `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`,
          "_blank",
          "width=550,height=420"
        );
        break;

      case "copy_link":
        try {
          await navigator.clipboard.writeText(shareUrl);
          setCopied(true);
          toast.success("Link copied to clipboard!");
          setTimeout(() => setCopied(false), 2000);
        } catch (error) {
          toast.error("Failed to copy link");
        }
        break;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm">
          <Share2 className="h-4 w-4 mr-2" />
          Share
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        <DropdownMenuItem onClick={() => handleShare("twitter")}>
          <Twitter className="h-4 w-4 mr-2" />
          Share on Twitter
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare("linkedin")}>
          <Linkedin className="h-4 w-4 mr-2" />
          Share on LinkedIn
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare("facebook")}>
          <Facebook className="h-4 w-4 mr-2" />
          Share on Facebook
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => handleShare("copy_link")}>
          {copied ? (
            <>
              <Check className="h-4 w-4 mr-2 text-green-600" />
              <span className="text-green-600">Copied!</span>
            </>
          ) : (
            <>
              <Link2 className="h-4 w-4 mr-2" />
              Copy Link
            </>
          )}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
