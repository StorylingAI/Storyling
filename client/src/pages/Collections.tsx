import { useAuth } from "@/_core/hooks/useAuth";
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, FolderPlus, Folder, Edit, Trash2, Share2, Globe2, Lock } from "lucide-react";
import { ShareCollectionModal } from "@/components/ShareCollectionModal";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { APP_LOGO } from "@/const";
import Breadcrumb from "@/components/Breadcrumb";
import { CollectionsOnboardingTutorial } from "@/components/CollectionsOnboardingTutorial";
import { MobileNav } from "@/components/MobileNav";

export default function Collections() {
  const { user, isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [showCollectionsTutorial, setShowCollectionsTutorial] = useState(false);
  const [hasSeenCollectionsTutorial, setHasSeenCollectionsTutorial] = useState(() => {
    return localStorage.getItem('collectionsTutorialSeen') === 'true';
  });

  // Show collections tutorial for first-time users
  useEffect(() => {
    if (user && isAuthenticated && !hasSeenCollectionsTutorial) {
      const timer = setTimeout(() => {
        setShowCollectionsTutorial(true);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [user, isAuthenticated, hasSeenCollectionsTutorial]);

  const handleCollectionsTutorialComplete = () => {
    setShowCollectionsTutorial(false);
    localStorage.setItem('collectionsTutorialSeen', 'true');
    setHasSeenCollectionsTutorial(true);
  };
  const [newName, setNewName] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [newColor, setNewColor] = useState("#8B5CF6");
  const [editingCollection, setEditingCollection] = useState<any>(null);
  const [editName, setEditName] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editColor, setEditColor] = useState("#8B5CF6");
  const [editIsPublic, setEditIsPublic] = useState(false);
  const [shareModalCollection, setShareModalCollection] = useState<{
    id: number;
    name: string;
    isPublic: boolean;
    shareToken: string | null;
  } | null>(null);

  const { data: collections, isLoading } = trpc.collections.getMyCollections.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const createMutation = trpc.collections.createCollection.useMutation({
    onSuccess: () => {
      utils.collections.getMyCollections.invalidate();
      setIsCreateOpen(false);
      setNewName("");
      setNewDescription("");
      setNewColor("#8B5CF6");
    },
  });

  const deleteMutation = trpc.collections.deleteCollection.useMutation({
    onSuccess: () => {
      utils.collections.getMyCollections.invalidate();
    },
  });

  const togglePublicMutation = trpc.collections.togglePublicSharing.useMutation({
    onSuccess: () => {
      utils.collections.getMyCollections.invalidate();
    },
  });

  const updateMutation = trpc.collections.updateCollection.useMutation({
    onSuccess: () => {
      utils.collections.getMyCollections.invalidate();
      setEditingCollection(null);
    },
  });

  const handleCreate = () => {
    if (!newName.trim()) return;
    createMutation.mutate({
      name: newName,
      description: newDescription || undefined,
      color: newColor,
    });
  };

  const handleOpenEdit = (collection: any) => {
    setEditingCollection(collection);
    setEditName(collection.name || "");
    setEditDescription(collection.description || "");
    setEditColor(collection.color || "#8B5CF6");
    setEditIsPublic(Boolean(collection.isPublic));
  };

  const handleUpdate = async () => {
    if (!editingCollection || !editName.trim()) return;

    await updateMutation.mutateAsync({
      id: editingCollection.id,
      name: editName.trim(),
      description: editDescription.trim(),
      color: editColor,
    });

    if (editIsPublic !== Boolean(editingCollection.isPublic)) {
      await togglePublicMutation.mutateAsync({
        collectionId: editingCollection.id,
        isPublic: editIsPublic,
      });
      utils.collections.getMyCollections.invalidate();
    }
  };

  const colorOptions = ["#8B5CF6", "#EC4899", "#14B8A6", "#F59E0B", "#84CC16", "#3B82F6"];

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-card shadow-playful-lg border-2">
          <CardContent className="pt-6 text-center space-y-4">
            <img src="/flip-mascot.png" alt="Flip" className="w-24 h-24 mx-auto" />
            <h3 className="text-xl font-bold">Sign in to continue</h3>
            <p className="text-muted-foreground">Please sign in to view your collections</p>
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
        <p className="text-muted-foreground">Loading collections...</p>
      </div>
    );
  }

  return (
    <>
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50">
      {/* Mobile hamburger nav */}
      <MobileNav title="Collections" backPath="/app" />



      <section className="container py-12">
        <Breadcrumb items={[
          { label: "Library", href: "/library" },
          { label: "Collections" }
        ]} showHome={false} />

        <div className="mb-6 flex justify-end">
          <Button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="bg-gradient-to-r from-blue-500 to-teal-500 text-white hover:from-blue-600 hover:to-teal-600 border-0 shadow-sm"
            data-tutorial="create-collection"
          >
            <FolderPlus className="mr-2 h-4 w-4" />
            New Collection
          </Button>
        </div>
        
        {!collections || collections.length === 0 ? (
          <div className="flex items-center justify-center min-h-[60vh]">
            <Card className="w-full max-w-md bg-white shadow-sm border border-border" data-tutorial="collection-grid">
              <CardContent className="py-16 text-center space-y-6">
                {/* Flip mascot */}
                <div className="flex justify-center">
                  <img src={APP_LOGO} alt="Storyling.ai" className="w-24 h-24 mx-auto object-contain" />
                </div>

                <div className="space-y-3">
                  <h3 className="text-2xl font-bold text-foreground">
                    No collections yet
                  </h3>
                  <p className="text-muted-foreground text-base max-w-sm mx-auto">
                    Create your first collection to organize your stories by theme, topic, or learning goal.
                  </p>
                </div>

                <Button 
                  onClick={() => setIsCreateOpen(true)}
                  className="bg-gradient-to-r from-blue-500 to-teal-500 text-white hover:from-blue-600 hover:to-teal-600 border-0 shadow-sm"
                  data-tutorial="create-collection"
                >
                  <FolderPlus className="mr-2 h-4 w-4" />
                  Create Your First Collection
                </Button>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4" data-tutorial="collection-grid">
            {collections.map(collection => (
              <Card
                key={collection.id}
                className="rounded-card shadow-playful hover-lift active-scale transition-all border-2 cursor-pointer overflow-hidden"
                onClick={() => setLocation(`/collection/${collection.id}`)}
              >
                <div 
                  className="h-24 flex items-center justify-center"
                  style={{ backgroundColor: collection.color || "#8B5CF6" }}
                >
                  <Folder className="h-16 w-16 text-white/90" />
                </div>
                <CardHeader>
                  <CardTitle className="line-clamp-1">{collection.name}</CardTitle>
                  <p className="text-sm text-muted-foreground">
                    {collection.itemCount} {collection.itemCount === 1 ? "story" : "stories"}
                  </p>
                </CardHeader>
                {collection.description && (
                  <CardContent>
                    <p className="text-sm text-muted-foreground line-clamp-2">
                      {collection.description}
                    </p>
                  </CardContent>
                )}
                <CardContent className="pt-0">
                  <div className="flex gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="flex-1 rounded-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenEdit(collection);
                      }}
                    >
                      <Edit className="mr-2 h-3 w-3" />
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setShareModalCollection({
                          id: collection.id,
                          name: collection.name,
                          isPublic: collection.isPublic || false,
                          shareToken: collection.shareToken || null,
                        });
                      }}
                    >
                      <Share2 className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-button"
                      onClick={(e) => {
                        e.stopPropagation();
                        togglePublicMutation.mutate({
                          collectionId: collection.id,
                          isPublic: !collection.isPublic,
                        });
                      }}
                      disabled={togglePublicMutation.isPending}
                      title={collection.isPublic ? "Unpublish" : "Publish"}
                    >
                      {collection.isPublic ? (
                        <Lock className="h-3 w-3" />
                      ) : (
                        <Globe2 className="h-3 w-3" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-button text-destructive hover:bg-destructive/10"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Delete "${collection.name}"? This will remove all stories from this collection.`)) {
                          deleteMutation.mutate({ id: collection.id });
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </section>

      {/* Share Collection Modal */}
      {shareModalCollection && (
        <ShareCollectionModal
          collectionId={shareModalCollection.id}
          collectionName={shareModalCollection.name}
          isPublic={shareModalCollection.isPublic}
          shareToken={shareModalCollection.shareToken}
          onClose={() => setShareModalCollection(null)}
        />
      )}

      <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Create Collection</DialogTitle>
            <DialogDescription>
              Group related stories by theme, topic, or learning goal.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="collection-name">Name</Label>
              <Input
                id="collection-name"
                value={newName}
                onChange={(event) => setNewName(event.target.value)}
                placeholder="Travel phrases"
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="collection-description">Description</Label>
              <Textarea
                id="collection-description"
                value={newDescription}
                onChange={(event) => setNewDescription(event.target.value)}
                placeholder="Stories for a specific topic or goal"
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex flex-wrap gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    className={`h-9 w-9 rounded-full border-2 transition ${
                      newColor === color ? "border-gray-900 scale-105" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                    onClick={() => setNewColor(color)}
                    aria-label={`Use collection color ${color}`}
                  />
                ))}
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setIsCreateOpen(false)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleCreate}
              disabled={!newName.trim() || createMutation.isPending}
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Collection"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(editingCollection)} onOpenChange={(open) => !open && setEditingCollection(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Collection</DialogTitle>
            <DialogDescription>
              Change the title, description, color, and publishing status.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Title</Label>
              <Input
                id="edit-name"
                value={editName}
                onChange={(event) => setEditName(event.target.value)}
                maxLength={200}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={editDescription}
                onChange={(event) => setEditDescription(event.target.value)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label>Color</Label>
              <div className="flex gap-2">
                {colorOptions.map(color => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setEditColor(color)}
                    className={`h-8 w-8 rounded-full border-2 ${editColor === color ? "border-foreground" : "border-transparent"}`}
                    style={{ backgroundColor: color }}
                    aria-label={`Select color ${color}`}
                  />
                ))}
              </div>
            </div>
            <label className="flex items-center justify-between rounded-lg border p-3">
              <span>
                <span className="block text-sm font-medium">Publish collection</span>
                <span className="block text-xs text-muted-foreground">Make this collection public.</span>
              </span>
              <input
                type="checkbox"
                checked={editIsPublic}
                onChange={(event) => setEditIsPublic(event.target.checked)}
                className="h-5 w-5"
              />
            </label>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setEditingCollection(null)}>
              Cancel
            </Button>
            <Button
              type="button"
              onClick={handleUpdate}
              disabled={!editName.trim() || updateMutation.isPending || togglePublicMutation.isPending}
            >
              {(updateMutation.isPending || togglePublicMutation.isPending) && (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    {showCollectionsTutorial && (
      <CollectionsOnboardingTutorial onComplete={handleCollectionsTutorialComplete} />
    )}
    </>
  );
}
