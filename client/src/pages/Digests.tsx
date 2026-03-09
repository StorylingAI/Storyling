import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, Sparkles, Eye, Copy } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

export default function Digests() {
  const [activeTab, setActiveTab] = useState("all");

  // Fetch digests
  const { data: digests, isLoading, refetch } = trpc.digest.getMyDigests.useQuery({ limit: 20 });
  const { data: unreadCount } = trpc.digest.getUnreadCount.useQuery();

  // Mutations
  const generateCreatorDigest = trpc.digest.generateCreatorDigest.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const generateStoryHighlights = trpc.digest.generateStoryHighlights.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      refetch();
    },
    onError: (error) => {
      toast.error(error.message);
    },
  });

  const markAsRead = trpc.digest.markAsRead.useMutation({
    onSuccess: () => {
      refetch();
    },
  });

  const handleGenerateCreatorDigest = () => {
    generateCreatorDigest.mutate();
  };

  const handleGenerateStoryHighlights = () => {
    generateStoryHighlights.mutate();
  };

  const handleMarkAsRead = (digestId: number) => {
    markAsRead.mutate({ digestId });
  };

  const filteredDigests = digests?.filter((digest) => {
    if (activeTab === "all") return true;
    if (activeTab === "unread") return !digest.isRead;
    if (activeTab === "creator") return digest.digestType === "weekly_creator";
    if (activeTab === "stories") return digest.digestType === "story_highlights";
    return true;
  });

  return (
    <div className="container max-w-6xl py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-2">📬 Your Digests</h1>
        <p className="text-muted-foreground">
          Weekly summaries of your learning journey and creator stats
        </p>
      </div>

      {/* Generate Digest Actions */}
      <div className="grid md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5" />
              Creator Digest
            </CardTitle>
            <CardDescription>
              See how your collections are performing
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleGenerateCreatorDigest}
              disabled={generateCreatorDigest.isPending}
              className="w-full"
            >
              {generateCreatorDigest.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Creator Digest
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="w-5 h-5" />
              Story Highlights
            </CardTitle>
            <CardDescription>
              Review your recent story creations
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              onClick={handleGenerateStoryHighlights}
              disabled={generateStoryHighlights.isPending}
              className="w-full"
            >
              {generateStoryHighlights.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Generate Story Highlights
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Digests List */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Your Digests</CardTitle>
            {unreadCount && unreadCount.count > 0 && (
              <Badge variant="secondary">{unreadCount.count} unread</Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
              <TabsTrigger value="creator">Creator</TabsTrigger>
              <TabsTrigger value="stories">Stories</TabsTrigger>
            </TabsList>

            <TabsContent value={activeTab} className="space-y-4">
              {isLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : filteredDigests && filteredDigests.length > 0 ? (
                filteredDigests.map((digest) => (
                  <DigestCard
                    key={digest.id}
                    digest={digest}
                    onMarkAsRead={handleMarkAsRead}
                  />
                ))
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <p>No digests yet. Generate your first digest above!</p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

interface DigestCardProps {
  digest: any;
  onMarkAsRead: (id: number) => void;
}

function DigestCard({ digest, onMarkAsRead }: DigestCardProps) {
  const [expanded, setExpanded] = useState(false);
  const content = digest.content;

  return (
    <Card className={!digest.isRead ? "border-primary" : ""}>
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="flex items-center gap-2">
              {digest.title}
              {!digest.isRead && <Badge variant="default" className="text-xs">New</Badge>}
            </CardTitle>
            <CardDescription>
              {digest.weekStartDate && digest.weekEndDate && (
                <span>
                  {new Date(digest.weekStartDate).toLocaleDateString()} -{" "}
                  {new Date(digest.weekEndDate).toLocaleDateString()}
                </span>
              )}
              {" • "}
              <span>{new Date(digest.createdAt).toLocaleDateString()}</span>
            </CardDescription>
          </div>
          {!digest.isRead && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onMarkAsRead(digest.id)}
            >
              Mark as read
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {digest.digestType === "weekly_creator" && (
          <CreatorDigestContent content={content} expanded={expanded} />
        )}
        {digest.digestType === "story_highlights" && (
          <StoryHighlightsContent content={content} expanded={expanded} />
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setExpanded(!expanded)}
          className="mt-4"
        >
          {expanded ? "Show less" : "Show more"}
        </Button>
      </CardContent>
    </Card>
  );
}

function CreatorDigestContent({ content, expanded }: { content: any; expanded: boolean }) {
  if (!content) return null;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-center gap-2">
          <Eye className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-2xl font-bold">{content.totalViews}</p>
            <p className="text-sm text-muted-foreground">Total Views</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Copy className="w-4 h-4 text-muted-foreground" />
          <div>
            <p className="text-2xl font-bold">{content.totalClones}</p>
            <p className="text-sm text-muted-foreground">Total Clones</p>
          </div>
        </div>
      </div>

      {content.topCollection && (
        <div className="p-4 bg-muted rounded-lg">
          <p className="text-sm font-medium mb-1">🏆 Top Collection</p>
          <p className="font-semibold">{content.topCollection.name}</p>
          <p className="text-sm text-muted-foreground">
            {content.topCollection.viewCount} views • {content.topCollection.cloneCount} clones
          </p>
        </div>
      )}

      {expanded && content.collections && content.collections.length > 0 && (
        <div className="space-y-2">
          <p className="text-sm font-medium">All Collections</p>
          {content.collections.map((collection: any) => (
            <div key={collection.id} className="p-3 border rounded-lg">
              <p className="font-medium">{collection.name}</p>
              <p className="text-sm text-muted-foreground">
                {collection.viewCount} views • {collection.cloneCount} clones
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function StoryHighlightsContent({ content, expanded }: { content: any; expanded: boolean }) {
  if (!content || !content.stories) return null;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        You created {content.totalStories} {content.totalStories === 1 ? "story" : "stories"} this week!
      </p>

      <div className="space-y-3">
        {content.stories.slice(0, expanded ? undefined : 2).map((story: any) => (
          <Link key={story.id} href={`/story/${story.id}`}>
            <div className="p-4 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer">
              <div className="flex items-start gap-3">
                {story.thumbnailUrl && (
                  <img
                    src={story.thumbnailUrl}
                    alt={story.title || "Story"}
                    className="w-16 h-16 rounded object-cover"
                  />
                )}
                <div className="flex-1">
                  <p className="font-semibold">{story.title || story.titleTranslation}</p>
                  <p className="text-sm text-muted-foreground mb-2">
                    {story.theme} • {story.mode}
                  </p>
                  <p className="text-sm line-clamp-2">{story.excerpt}</p>
                </div>
              </div>
              <Button variant="link" className="mt-2 p-0 h-auto">
                Keep Learning →
              </Button>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
