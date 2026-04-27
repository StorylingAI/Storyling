import { useAuth } from "@/_core/hooks/useAuth";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, Plus, X, Play, Clock, GripVertical, BookOpen, Edit, Globe2, Lock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation, useParams } from "wouter";
import { APP_LOGO } from "@/const";
import Breadcrumb from "@/components/Breadcrumb";
import { MobileNav } from "@/components/MobileNav";

export default function CollectionView() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const params = useParams();
  const collectionId = parseInt(params.id || "0");
  const utils = trpc.useUtils();

  const [isAddStoryOpen, setIsAddStoryOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [draggedItemId, setDraggedItemId] = useState<number | null>(null);
  const dragJustEndedRef = React.useRef(false);

  const { data: collection, isLoading } = trpc.collections.getCollectionById.useQuery(
    { id: collectionId },
    { enabled: isAuthenticated && collectionId > 0 }
  );

  const { data: library } = trpc.content.getLibrary.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const addToCollectionMutation = trpc.collections.addToCollection.useMutation({
    onSuccess: () => {
      utils.collections.getCollectionById.invalidate({ id: collectionId });
      setIsAddStoryOpen(false);
    },
  });

  const removeFromCollectionMutation = trpc.collections.removeFromCollection.useMutation({
    onSuccess: () => {
      utils.collections.getCollectionById.invalidate({ id: collectionId });
    },
  });

  const reorderMutation = trpc.collections.reorderCollection.useMutation({
    onSuccess: () => {
      utils.collections.getCollectionById.invalidate({ id: collectionId });
    },
  });
  const updateCollectionMutation = trpc.collections.updateCollection.useMutation({
    onSuccess: () => {
      utils.collections.getCollectionById.invalidate({ id: collectionId });
      utils.collections.getMyCollections.invalidate();
      setIsEditOpen(false);
    },
  });
  const togglePublicMutation = trpc.collections.togglePublicSharing.useMutation({
    onSuccess: () => {
      utils.collections.getCollectionById.invalidate({ id: collectionId });
      utils.collections.getMyCollections.invalidate();
    },
  });
  
  // Track view for recently viewed
  const trackViewMutation = trpc.recentlyViewed.trackView.useMutation();
  
  React.useEffect(() => {
    if (collection) {
      setEditName(collection.name || "");
      setEditDescription(collection.description || "");
      setEditIsPublic(Boolean(collection.isPublic));
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
    story =>
      story.status === "completed" &&
      !collection?.items.some(item => item.contentId === story.id)
  ) || [];

  const handleDragStart = (itemId: number) => {
    dragJustEndedRef.current = true;
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

  const handleDragEnd = () => {
    setDraggedItemId(null);
    window.setTimeout(() => {
      dragJustEndedRef.current = false;
    }, 0);
  };

  const openStory = (contentId: number) => {
    setLocation(`/content/${contentId}`);
  };

  const handleStoryClick = (contentId: number) => {
    if (dragJustEndedRef.current) return;
    openStory(contentId);
  };

  const handleStoryKeyDown = (event: React.KeyboardEvent<HTMLDivElement>, contentId: number) => {
    if (event.target !== event.currentTarget) return;
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openStory(contentId);
    }
  };

  const handleSaveCollection = async () => {
    if (!collection || !editName.trim()) return;

    await updateCollectionMutation.mutateAsync({
      id: collection.id,
      name: editName.trim(),
      description: editDescription.trim(),
    });

    if (editIsPublic !== Boolean(collection.isPublic)) {
      await togglePublicMutation.mutateAsync({
        collectionId: collection.id,
        isPublic: editIsPublic,
      });
    }
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
        <Breadcrumb items={[
          { label: "Library", href: "/library" },
          { label: "Collections", href: "/collections" },
          { label: collection.name },
        ]} showHome={false} />

        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-foreground">{collection.name}</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {collection.items.length} {collection.items.length === 1 ? "story" : "stories"}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsEditOpen(true)}
              className="rounded-button"
            >
              <Edit className="mr-2 h-4 w-4" />
              Edit
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                togglePublicMutation.mutate({
                  collectionId,
                  isPublic: !collection.isPublic,
                });
              }}
              disabled={togglePublicMutation.isPending}
              className="rounded-button"
            >
              {collection.isPublic ? (
                <Lock className="mr-2 h-4 w-4" />
              ) : (
                <Globe2 className="mr-2 h-4 w-4" />
              )}
              {collection.isPublic ? "Unpublish" : "Publish"}
            </Button>
            <Button
              type="button"
              onClick={() => setIsAddStoryOpen(true)}
              className="rounded-button gradient-primary text-white hover-lift active-scale border-0"
            >
              <Plus className="mr-2 h-4 w-4" />
              Add Story
            </Button>
          </div>
        </div>

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
              Tip: Drag and drop to reorder stories
            </p>
            {collection.items.map(item => (
              <Card
                key={item.id}
                draggable
                onDragStart={() => handleDragStart(item.id)}
                onDragOver={handleDragOver}
                onDrop={() => handleDrop(item.id)}
                onDragEnd={handleDragEnd}
                onClick={() => handleStoryClick(item.contentId)}
                onKeyDown={(event) => handleStoryKeyDown(event, item.contentId)}
                role="button"
                tabIndex={0}
                aria-label={`Open ${item.content?.title || `${item.content?.theme} Story`}`}
                className={`rounded-card shadow-playful hover-lift transition-all border-2 cursor-pointer focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ${
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
                      onClick={(event) => {
                        event.stopPropagation();
                        openStory(item.contentId);
                      }}
                      className="rounded-button gradient-primary text-white hover-lift border-0"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      {item.content?.mode === "podcast" ? "Listen" : "Watch"}
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="rounded-full text-destructive hover:bg-destructive/10"
                      onClick={(event) => {
                        event.stopPropagation();
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

      <Dialog open={isAddStoryOpen} onOpenChange={setIsAddStoryOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Story</DialogTitle>
            <DialogDescription>
              Choose a completed story from your library to add to this collection.
            </DialogDescription>
          </DialogHeader>

          {availableStories.length === 0 ? (
            <div className="py-10 text-center">
              <img src={APP_LOGO} alt="Storyling.ai" className="mx-auto mb-4 h-16 w-16 object-contain" />
              <p className="font-medium">No available stories</p>
              <p className="mt-1 text-sm text-muted-foreground">
                Completed stories that are not already in this collection will appear here.
              </p>
            </div>
          ) : (
            <div className="max-h-[60vh] space-y-3 overflow-y-auto pr-1">
              {availableStories.map((story) => (
                <div
                  key={story.id}
                  className="flex items-center gap-3 rounded-lg border bg-white p-3"
                >
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-md bg-gradient-to-br from-purple-100 via-teal-100 to-pink-100">
                    {story.thumbnailUrl ? (
                      <img src={story.thumbnailUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <BookOpen className="h-7 w-7 text-purple-300" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">
                      {story.title || `${story.theme} Story`}
                    </p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <Badge variant="outline" className="text-xs">{story.theme}</Badge>
                      <Badge variant="secondary" className="text-xs">{story.mode}</Badge>
                    </div>
                  </div>
                  <Button
                    type="button"
                    size="sm"
                    onClick={() => {
                      addToCollectionMutation.mutate({
                        collectionId,
                        contentId: story.id,
                      });
                    }}
                    disabled={addToCollectionMutation.isPending}
                    className="rounded-button"
                  >
                    {addToCollectionMutation.isPending ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Plus className="mr-2 h-4 w-4" />
                    )}
                    Add
                  </Button>
                </div>
              ))}
            </div>
          )}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsAddStoryOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
            <DialogDescription>
              Update the collection title, description, and public visibility.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="collection-title">Title</Label>
              <Input
                id="collection-title"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="collection-description">Description</Label>
              <Textarea
                id="collection-description"
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                rows={4}
              />
            </div>
            <div className="flex items-center justify-between rounded-lg border p-3">
              <div>
                <Label htmlFor="collection-public">Publish collection</Label>
                <p className="text-sm text-muted-foreground">
                  Public collections can be discovered and shared.
                </p>
              </div>
              <Switch
                id="collection-public"
                checked={editIsPublic}
                onCheckedChange={setEditIsPublic}
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsEditOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleSaveCollection}
              disabled={!editName.trim() || updateCollectionMutation.isPending || togglePublicMutation.isPending}
            >
              {(updateCollectionMutation.isPending || togglePublicMutation.isPending) ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
