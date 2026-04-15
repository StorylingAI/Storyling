import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, BookOpen, ArrowLeft, Globe, Copy, Share2 } from "lucide-react";
import { APP_TITLE } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { CollectionBadges } from "@/components/CollectionBadges";
import { SimilarCollections } from "@/components/SimilarCollections";
import { CollectionShareButton } from "@/components/CollectionShareButton";

// Format clone count for display (e.g., 1.2K, 5.3M)
function formatCloneCount(count: number): string {
  if (count >= 1000000) {
    return `${(count / 1000000).toFixed(1)}M`;
  }
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}K`;
  }
  return count.toString();
}

export default function PublicCollectionView() {
  const params = useParams<{ token: string }>();
  const [, setLocation] = useLocation();
  const shareToken = params.token || "";
  const { isAuthenticated } = useAuth();
  const backPath = isAuthenticated ? "/app" : "/";
  const backLabel = isAuthenticated ? "Back to Dashboard" : "Go to Homepage";

  const { data: collection, isLoading, error } = trpc.collections.getPublicCollection.useQuery(
    { shareToken },
    { enabled: !!shareToken }
  );

  const cloneMutation = trpc.collections.cloneCollection.useMutation({
    onSuccess: (data) => {
      toast.success(`Collection cloned! ${data.itemCount} stories copied.`);
      
      // Show achievement notifications if any were unlocked
      if (data.newAchievements && data.newAchievements.length > 0) {
        data.newAchievements.forEach((achievement) => {
          setTimeout(() => {
            toast.success(
              `${achievement.icon} Achievement Unlocked: ${achievement.name}!`,
              { description: `+${achievement.xpReward} XP`, duration: 5000 }
            );
          }, 500);
        });
      }
      
      setLocation(`/collection/${data.collectionId}`);
    },
    onError: (error) => {
      toast.error(error.message || "Failed to clone collection");
    },
  });

  const handleClone = () => {
    if (!isAuthenticated) {
      toast.error("Please log in to clone this collection");
      return;
    }
    cloneMutation.mutate({ shareToken });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading shared collection...</p>
        </div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
              <Globe className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Collection Not Found</h2>
            <p className="text-muted-foreground mb-6">
              {error?.message || "This collection doesn't exist or is no longer shared publicly."}
            </p>
            <Button
              onClick={() => setLocation(backPath)}
              className="rounded-button gradient-primary text-white hover-lift border-0"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              {backLabel}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-10">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation(backPath)}
                className="rounded-button"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
              <div className="h-6 w-px bg-border" />
              <span className="text-sm text-muted-foreground">{APP_TITLE}</span>
            </div>
            <div className="flex items-center gap-3">
              {isAuthenticated && (
                <Button
                  onClick={handleClone}
                  disabled={cloneMutation.isPending}
                  className="rounded-button gradient-primary text-white border-0"
                >
                  {cloneMutation.isPending ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Cloning...
                    </>
                  ) : (
                    <>
                      <Copy className="mr-2 h-4 w-4" />
                      Clone to My Collections
                    </>
                  )}
                </Button>
              )}
              <Badge variant="secondary" className="gap-2">
                <Globe className="h-3 w-3" />
                Public Collection
              </Badge>
            </div>
          </div>
        </div>
      </header>

      {/* Collection Header */}
      <div className="container py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-start gap-4 mb-8">
            <div
              className="w-16 h-16 rounded-2xl flex-shrink-0 shadow-playful"
              style={{ backgroundColor: collection.color || "#8B5CF6" }}
            />
            <div className="flex-1">
              <h1 className="text-4xl font-bold mb-2">{collection.name}</h1>
              {collection.description && (
                <p className="text-lg text-muted-foreground mb-4">{collection.description}</p>
              )}
              <div className="space-y-3">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1">
                    <BookOpen className="h-4 w-4" />
                    {collection.items.length} {collection.items.length === 1 ? "story" : "stories"}
                  </span>
                  {collection.cloneCount > 0 && (
                    <span className="flex items-center gap-1">
                      <Copy className="h-4 w-4" />
                      {formatCloneCount(collection.cloneCount)} {collection.cloneCount === 1 ? "clone" : "clones"}
                    </span>
                  )}
                </div>
                <CollectionBadges cloneCount={collection.cloneCount} />
                
                {/* Social Sharing Button */}
                <div className="pt-2">
                  <CollectionShareButton
                    collectionId={collection.id}
                    collectionName={collection.name}
                    collectionDescription={collection.description || undefined}
                    itemCount={collection.items.length}
                    viewCount={collection.viewCount}
                    cloneCount={collection.cloneCount}
                    shareToken={shareToken}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Stories Grid */}
          {collection.items.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">This collection is empty</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {collection.items.map((item) => {
                const content = item.content;
                if (!content) return null;

                return (
                  <Card
                    key={item.id}
                    className="overflow-hidden rounded-card shadow-playful hover-lift hover-glow active-scale transition-all border-2 animate-slide-up"
                  >
                    {/* Thumbnail */}
                    <div className="relative w-full h-48 bg-gradient-to-br from-purple-100 via-teal-100 to-pink-100 overflow-hidden">
                      {content.thumbnailUrl ? (
                        <img
                          src={content.thumbnailUrl}
                          alt={content.title || content.theme}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="h-16 w-16 text-purple-300" />
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <h3 className="font-semibold text-lg line-clamp-2">
                          {content.title || `${content.theme} Story`}
                        </h3>
                      </div>

                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="secondary" className="text-xs">
                          {content.theme}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {content.mode}
                        </Badge>
                      </div>

                      {content.storyText && (
                        <p className="text-sm text-muted-foreground line-clamp-3 mb-4">
                          {content.storyText.slice(0, 150)}...
                        </p>
                      )}

                      <div className="text-xs text-muted-foreground">
                        Added {new Date(item.addedAt).toLocaleDateString()}
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}

          {/* Similar Collections */}
          <div className="mt-12">
            <SimilarCollections collectionId={collection.id} limit={6} />
          </div>

          {/* CTA Section */}
          <Card className="mt-12 bg-gradient-to-br from-purple-100 via-teal-100 to-pink-100 border-2">
            <CardContent className="py-8 text-center">
              <h3 className="text-2xl font-bold mb-2">Want to create your own stories?</h3>
              <p className="text-muted-foreground mb-6">
                Join {APP_TITLE} to transform your vocabulary into immersive AI-generated content
              </p>
              <Button
                onClick={() => setLocation("/")}
                size="lg"
                className="rounded-button gradient-primary text-white hover-lift border-0"
              >
                Start Learning Free
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
