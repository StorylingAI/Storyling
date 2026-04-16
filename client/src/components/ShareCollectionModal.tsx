import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Copy, Check, Globe, Lock, Loader2 } from "lucide-react";
import { trpc } from "@/lib/trpc";

interface ShareCollectionModalProps {
  collectionId: number;
  collectionName: string;
  isPublic: boolean;
  shareToken: string | null;
  onClose: () => void;
}

export function ShareCollectionModal({
  collectionId,
  collectionName,
  isPublic: initialIsPublic,
  shareToken: initialShareToken,
  onClose,
}: ShareCollectionModalProps) {
  const [isPublic, setIsPublic] = useState(initialIsPublic);
  const [shareToken, setShareToken] = useState(initialShareToken);
  const [copied, setCopied] = useState(false);
  const utils = trpc.useUtils();

  const toggleSharingMutation = trpc.collections.togglePublicSharing.useMutation({
    onSuccess: (data) => {
      setShareToken(data.shareToken || null);
      // Invalidate collections to update UI
      utils.collections.getMyCollections.invalidate();
    },
  });

  const generateTokenMutation = trpc.collections.generateShareToken.useMutation({
    onSuccess: (data) => {
      setShareToken(data.shareToken);
      // Invalidate collections to update UI
      utils.collections.getMyCollections.invalidate();
    },
  });

  const handleToggleSharing = (checked: boolean) => {
    setIsPublic(checked);
    toggleSharingMutation.mutate({
      collectionId,
      isPublic: checked,
    });
  };

  const handleRegenerateToken = () => {
    if (confirm("Are you sure you want to regenerate the share link? The old link will stop working.")) {
      generateTokenMutation.mutate({ collectionId });
    }
  };

  const shareUrl = shareToken
    ? `${window.location.origin}/shared/${shareToken}`
    : "";

  const handleCopyLink = async () => {
    if (!shareUrl) return;
    
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error("Failed to copy:", err);
    }
  };

  const isLoading = toggleSharingMutation.isPending || generateTokenMutation.isPending;

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <Card
        className="w-full max-w-lg animate-scale-in"
        onClick={(e) => e.stopPropagation()}
      >
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Share Collection
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Collection Name */}
          <div>
            <p className="text-sm text-muted-foreground mb-1">Collection</p>
            <p className="font-semibold">{collectionName}</p>
          </div>

          {/* Public Sharing Toggle */}
          <div className="flex items-center justify-between p-4 rounded-lg border bg-muted/50">
            <div className="flex-1">
              <Label htmlFor="public-toggle" className="text-base font-medium cursor-pointer">
                Public Sharing
              </Label>
              <p className="text-sm text-muted-foreground mt-1">
                Anyone with the link can view this collection
              </p>
            </div>
            <Switch
              id="public-toggle"
              checked={isPublic}
              onCheckedChange={handleToggleSharing}
              disabled={isLoading}
            />
          </div>

          {/* Share Link Section */}
          {isPublic && shareToken && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-sm font-medium">Share Link</Label>
                <Badge variant="secondary" className="gap-1">
                  <Globe className="h-3 w-3" />
                  Public
                </Badge>
              </div>

              {/* URL Display and Copy */}
              <div className="flex gap-2">
                <div className="flex-1 px-3 py-2 rounded-lg border bg-muted/50 text-sm truncate">
                  {shareUrl}
                </div>
                <Button
                  onClick={handleCopyLink}
                  variant="outline"
                  size="icon"
                  className="rounded-button flex-shrink-0"
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-600" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              {copied && (
                <p className="text-sm text-green-600 animate-slide-up">
                  Link copied to clipboard!
                </p>
              )}

              {/* Regenerate Link */}
              <Button
                onClick={handleRegenerateToken}
                variant="outline"
                size="sm"
                className="w-full rounded-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : null}
                Regenerate Link
              </Button>
              <p className="text-xs text-muted-foreground">
                Regenerating will invalidate the current link
              </p>
            </div>
          )}

          {/* Private State */}
          {!isPublic && (
            <div className="flex items-center gap-3 p-4 rounded-lg border bg-muted/50">
              <Lock className="h-5 w-5 text-muted-foreground" />
              <div>
                <p className="text-sm font-medium">Collection is private</p>
                <p className="text-xs text-muted-foreground">
                  Enable public sharing to generate a shareable link
                </p>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2 pt-4">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 rounded-button"
            >
              Close
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
