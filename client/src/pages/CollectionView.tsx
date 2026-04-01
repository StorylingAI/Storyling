import { useAuth } from "@/_core/hooks/useAuth";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Loader2, ArrowLeft, Plus, X, Play, Clock, GripVertical } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { APP_LOGO } from "@/const";
import Breadcrumb from "@/components/Breadcrumb";
import { MobileNav } from "@/components/MobileNav";

export default function CollectionView() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();
  const collectionId = parseInt(params.id || "0");

  const [isAddStoryOpen, setIsAddStoryOpen] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<number | null>(null);

  const { data: collection, isLoading } = trpc.collections.getCollectionById.useQuery(
    { id: collectionId },
    { enabled: isAuthenticated && collectionId > 0 }
  );

  const { data: library } = trpc.content.getLibrary.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const addToCollectionMutation = trpc.collections.addToCollection.useMutation({
    onSuccess: () => {
      trpc.useUtils().collections.getCollectionById.invalidate({ id: collectionId });
      setIsAddStoryOpen(false);
    },
  });

  const removeFromCollectionMutation = trpc.collections.removeFromCollection.useMutation({
    onSuccess: () => {
      trpc.useUtils().collections.getCollectionById.invalidate({ id: collectionId });
    },
  });

  const reorderMutation = trpc.collections.reorderCollection.useMutation({
    onSuccess: () => {
      trpc.useUtils().collections.getCollectionById.invalidate({ id: collectionId });
    },
  });
  
  // Track view for recently viewed
  const trackViewMutation = trpc.recentlyViewed.trackView.useMutation();
  
  React.useEffect(() => {
    if (collection) {
      trackViewMutation.mutate({
        itemType: "collection",
        itemId: collection.id,
        itemTitle: collection.name,
        itemThumbnail: undefined,
      });
    }
  }, [collection?.id]);

  // Get stories not in this collection
  const availableStories = library?.filter(
    story => !collection?.items.some(item => item.contentId === story.id)
  ) || [];

  const handleDragStart = (itemId: number) => {
    setDraggedItemId(itemId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = (targetItemId: number) => {
    if (!draggedItemId || !collection) return;
    
    const items = [...collection.items];
    const draggedIndex = items.findIndex(item => item.id === draggedItemId);
    const targetIndex = items.findIndex(item => item.id === targetItemId);
    
    if (draggedIndex === -1 || targetIndex === -1) return;
    
    // Reorder array
    const [removed] = items.splice(draggedIndex, 1);
    items.splice(targetIndex, 0, removed);
    
    // Update positions
    const itemIds = items.map(item => item.id);
    reorderMutation.mutate({
      collectionId,
      itemIds,
    });
    
    setDraggedItemId(null);
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-card shadow-playful-lg border-2">
          <CardContent className="pt-6 text-center space-y-4">
            <img src="/flip-mascot.png" alt="Flip" className="w-24 h-24 mx-auto" />
            <h3 className="text-xl font-bold">Sign in to continue</h3>
            <p className="text-muted-foreground">Please sign in to view this collection</p>
            <Button 
              onClick={() => setLocation("/")}
              className="rounded-button gradient-primary text-white hover-lift active-scale border-0 transition-all"
            >
              Go to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50 flex flex-col items-center justify-center gap-4">
        <img src="/flip-mascot.png" alt="Loading" className="w-24 h-24 animate-flip" />
        <p className="text-muted-foreground">Loading collection...</p>
      </div>
    );
  }

  if (!collection) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-card shadow-playful-lg border-2">
          <CardContent className="pt-6 text-center space-y-4">
            <h3 className="text-xl font-bold">Collection not found</h3>
            <Button onClick={() => setLocation("/collections")} className="rounded-button">
              Back to Collections
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50">
      {/* Mobile hamburger nav */}
      <MobileNav title={collection.name} backPath="/collections" />



      <section className="container py-12">
        {collection.description && (
          <p className="text-muted-foreground mb-8 text-lg">{collection.description}</p>
        )}

        {collection.items.length === 0 ? (
          <Card className="rounded-card shadow-playful-lg border-2 animate-bounce-in">
            <CardContent className="py-16 text-center space-y-6">
              <img src="/flip-mascot.png" alt="Flip" className="w-32 h-32 mx-auto animate-float" />
              <div>
                <h3 className="text-2xl font-bold mb-2">No stories yet</h3>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                  Add stories from your library to start organizing this collection.
                </p>
              </div>
              <Button 
                onClick={() => setIsAddStoryOpen(true)}
                className="rounded-button gradient-warm text-white hover-lift hover-glow active-scale border-0 h-12 text-lg px-8 transition-all"
              >
                <Plus className="mr-2 h-5 w-5" />
                Add Your First Story
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              💡 Drag and drop to reorder stories
            </p>
            {collection.items.map(item => (
              <Card
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(item.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(item.id)}
                className={`rounded-card shadow-playful hover-lift transition-all border-2 cursor-move ${
                  draggedItemId === item.id ? "opacity-50" : ""
                }`}
              >
                <CardContent className="p-4 flex items-center gap-4">
                  <GripVertical className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                  <div className="w-20 h-20 rounded-lg bg-gradient-to-br from-purple-100 via-teal-100 to-pink-100 flex items-center justify-center flex-shrink-0 overflow-hidden">
                    {item.content?.thumbnailUrl ? (
                      <img src={item.content.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-3xl">{item.content?.mode === "podcast" ? "🎙️" : "🎬"}</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="font-bold line-clamp-1 mb-1">
                      {item.content?.title || `${item.content?.theme} Story`}
                    </h4>
                    <div className="flex flex-wrap gap-2 mb-2">
                      <Badge variant="outline" className="rounded-full text-xs">{item.content?.theme}</Badge>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Play className="h-3 w-3" />
                        {item.content?.playCount || 0} plays
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {item.content?.generatedAt ? new Date(item.content.generatedAt).toLocaleDateString() : ""}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2 flex-shrink-0">
                    <Button
                      onClick={() => setLocation(`/content/${item.contentId}`)}
                      className="rounded-button gradient-primary text-white hover-lift border-0"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      {item.content?.mode === "podcast" ? "Listen" : "Watch"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full text-destructive hover:bg-destructive/10"
                      onClick={() => {
                        if (confirm("Remove this story from the collection?")) {
                          removeFromCollectionMutation.mutate({
                            collectionId,
                            contentId: item.contentId,
                          });
                        }
                      }}
                      disabled={removeFromCollectionMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
