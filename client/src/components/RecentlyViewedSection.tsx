import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Mic, Film, Library, ChevronRight } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export default function RecentlyViewedSection() {
  const [, setLocation] = useLocation();
  const { data: recentlyViewed, isLoading } = trpc.recentlyViewed.getRecentlyViewed.useQuery({
    limit: 5,
  });

  // Don't show section if no items
  if (!isLoading && (!recentlyViewed || recentlyViewed.length === 0)) {
    return null;
  }

  const getItemIcon = (itemType: string) => {
    switch (itemType) {
      case "story":
        return <Mic className="h-4 w-4" />;
      case "collection":
        return <Library className="h-4 w-4" />;
      case "wordbank":
        return <Library className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const getItemRoute = (item: any) => {
    switch (item.itemType) {
      case "story":
        return `/content/${item.itemId}`;
      case "collection":
        return `/collections/${item.itemId}`;
      case "wordbank":
        return `/wordbank`;
      default:
        return "/";
    }
  };

  const formatTimeAgo = (viewedAt: Date) => {
    const now = new Date();
    const diff = now.getTime() - new Date(viewedAt).getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xl font-bold flex items-center gap-2">
          <Clock className="h-5 w-5 text-primary" />
          Recently Viewed
        </h3>
      </div>

      {isLoading ? (
        <div className="flex gap-4 overflow-x-auto pb-2">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="rounded-card shadow-playful border-2 animate-pulse min-w-[280px]">
              <CardContent className="p-4 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-3/4" />
                <div className="h-3 bg-gray-200 rounded w-1/2" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
          {recentlyViewed?.map((item) => (
            <Card
              key={item.id}
              className="rounded-card shadow-playful border-2 hover-lift transition-all cursor-pointer min-w-[280px] group"
              onClick={() => setLocation(getItemRoute(item))}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-teal-500 flex items-center justify-center text-white">
                        {getItemIcon(item.itemType)}
                      </div>
                      <Badge variant="outline" className="rounded-full text-xs capitalize">
                        {item.itemType}
                      </Badge>
                    </div>
                    <h4 className="font-semibold text-sm line-clamp-2 mb-1">
                      {item.itemTitle || `${item.itemType} #${item.itemId}`}
                    </h4>
                    <p className="text-xs text-muted-foreground">
                      {formatTimeAgo(item.viewedAt)}
                    </p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
