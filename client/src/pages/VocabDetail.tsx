import { useState } from "react";
import { useParams, useLocation, Link } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import {
  ArrowLeft,
  Heart,
  Copy,
  Eye,
  BookOpen,
  Share2,
  Edit,
  Trash2,
  Globe,
  Lock,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

export default function VocabDetail() {
  const { slug } = useParams<{ slug: string }>();
  const [, navigate] = useLocation();

  const { user } = useAuth();
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);

  const { data: collection, isLoading } = trpc.vocabCollections.getBySlug.useQuery(
    { slug: slug! },
    { enabled: !!slug }
  );

  const utils = trpc.useUtils();

  const toggleLikeMutation = trpc.vocabCollections.toggleLike.useMutation({
    onSuccess: (data) => {
      utils.vocabCollections.getBySlug.invalidate({ slug: slug! });
      toast.success(data.liked ? "Added to favorites" : "Removed from favorites");
    },
  });

  const cloneMutation = trpc.vocabCollections.clone.useMutation({
    onSuccess: (data) => {
      toast.success("Collection cloned! You can now edit your copy");
      navigate(`/vocab/${data.slug}`);
    },
  });

  const deleteMutation = trpc.vocabCollections.delete.useMutation({
    onSuccess: () => {
      toast.success("Collection deleted");
      navigate("/vocab/browse");
    },
  });

  const handleShare = async () => {
    const url = `${window.location.origin}/vocab/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      toast.success("Link copied! Share this collection with others");
    } catch {
      toast.error("Failed to copy link");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container py-8 max-w-4xl">
          <Skeleton className="h-10 w-32 mb-6" />
          <Card>
            <CardHeader>
              <Skeleton className="h-8 w-3/4 mb-2" />
              <Skeleton className="h-4 w-1/2" />
            </CardHeader>
            <CardContent>
              <Skeleton className="h-40 w-full" />
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
        <div className="container py-8 max-w-4xl">
          <Card>
            <CardContent className="py-12 text-center">
              <h2 className="text-2xl font-bold mb-2">Collection not found</h2>
              <p className="text-gray-600 mb-4">This collection may be private or doesn't exist</p>
              <Button onClick={() => navigate("/vocab/browse")}>Browse Collections</Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const words = collection.words as Array<{ word: string; translation: string; example?: string }>;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="container py-8 max-w-4xl">
        {/* Back Button */}
        <Button variant="ghost" onClick={() => navigate("/vocab/browse")} className="mb-6">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Browse
        </Button>

        {/* Header Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <CardTitle className="text-3xl">{collection.title}</CardTitle>
                  {collection.isPublic ? (
                    <Globe className="h-5 w-5 text-green-600" />
                  ) : (
                    <Lock className="h-5 w-5 text-gray-400" />
                  )}
                  {collection.isFeatured && (
                    <Badge variant="default" className="ml-2">
                      Featured
                    </Badge>
                  )}
                </div>
                <CardDescription>by {collection.creatorName || "Anonymous"}</CardDescription>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <Badge variant="secondary">{collection.targetLanguage}</Badge>
              <Badge variant="secondary">{collection.proficiencyLevel}</Badge>
              {collection.category && <Badge variant="outline">{collection.category}</Badge>}
              {collection.tags?.split(",").map((tag) => (
                <Badge key={tag.trim()} variant="outline">
                  {tag.trim()}
                </Badge>
              ))}
            </div>

            {collection.description && (
              <p className="text-gray-700 mt-4">{collection.description}</p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-6 mt-4 text-sm text-gray-600">
              <span className="flex items-center gap-1">
                <BookOpen className="h-4 w-4" />
                {collection.wordCount} words
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {collection.viewCount} views
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                {collection.likeCount} likes
              </span>
              <span className="flex items-center gap-1">
                <Copy className="h-4 w-4" />
                {collection.cloneCount} clones
              </span>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap gap-2 mt-6">
              {user && !collection.isOwner && (
                <>
                  <Button
                    variant={collection.isLiked ? "default" : "outline"}
                    onClick={() => toggleLikeMutation.mutate({ collectionId: collection.id })}
                    disabled={toggleLikeMutation.isPending}
                  >
                    <Heart className={`h-4 w-4 mr-2 ${collection.isLiked ? "fill-current" : ""}`} />
                    {collection.isLiked ? "Liked" : "Like"}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => cloneMutation.mutate({ collectionId: collection.id })}
                    disabled={cloneMutation.isPending}
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Clone to My Collections
                  </Button>
                </>
              )}

              {collection.isPublic && (
                <Button variant="outline" onClick={handleShare}>
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              )}

              {collection.isOwner && (
                <>
                  <Button variant="outline" onClick={() => navigate(`/vocab/${slug}/edit`)}>
                    <Edit className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setShowDeleteDialog(true)}
                    className="text-red-600 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </CardHeader>
        </Card>

        {/* Vocabulary Words */}
        <Card>
          <CardHeader>
            <CardTitle>Vocabulary ({words.length} words)</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {words.map((item, index) => (
                <div
                  key={index}
                  className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-baseline gap-3 mb-1">
                        <span className="text-lg font-semibold text-gray-900">{item.word}</span>
                        <span className="text-gray-600">{item.translation}</span>
                      </div>
                      {item.example && (
                        <p className="text-sm text-gray-500 italic mt-2">{item.example}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Delete Confirmation Dialog */}
        <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Collection?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete your vocabulary collection.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => {
                  deleteMutation.mutate({ id: collection.id });
                  setShowDeleteDialog(false);
                }}
                className="bg-red-600 hover:bg-red-700"
              >
                Delete
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}
