import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Eye, Copy, Sparkles } from "lucide-react";
import { Link } from "wouter";

interface SimilarCollectionsProps {
  collectionId: number;
  limit?: number;
}

export function SimilarCollections({ collectionId, limit = 6 }: SimilarCollectionsProps) {
  const { data: similarCollections, isLoading } = trpc.collectionAnalytics.getSimilarCollections.useQuery({
    collectionId,
    limit,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <h2 className="text-2xl font-bold">Similar Collections</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-48" />
          ))}
        </div>
      </div>
    );
  }

  if (!similarCollections || similarCollections.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Sparkles className="h-6 w-6 text-purple-600" />
        <h2 className="text-2xl font-bold">Similar Collections</h2>
      </div>
      <p className="text-muted-foreground">
        Discover more collections like this one
      </p>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {similarCollections.map((collection) => (
          <Link key={collection.id} href={`/shared/${collection.shareToken}`}>
            <Card className="h-full hover:shadow-lg transition-shadow cursor-pointer">
              <CardHeader>
                <div
                  className="w-full h-2 rounded-full mb-3"
                  style={{ backgroundColor: collection.color || "#8B5CF6" }}
                />
                <CardTitle className="line-clamp-2">{collection.name}</CardTitle>
                <CardDescription className="line-clamp-2">
                  {collection.description || "No description"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">
                      {collection.itemCount} {collection.itemCount === 1 ? "story" : "stories"}
                    </span>
                    <div className="flex items-center gap-3">
                      <div className="flex items-center gap-1">
                        <Eye className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{collection.viewCount}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Copy className="h-3 w-3 text-muted-foreground" />
                        <span className="text-muted-foreground">{collection.cloneCount}</span>
                      </div>
                    </div>
                  </div>
                  {collection.creator && (
                    <div className="text-xs text-muted-foreground">
                      by {collection.creator.name || "Anonymous"}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
