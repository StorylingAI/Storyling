import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, Play, Film, Mic, ArrowRight } from "lucide-react";
import { trpc } from "@/lib/trpc";

export default function RecentlyWatchedSection() {
  const { isAuthenticated } = useAuth();
  const [, setLocation] = useLocation();

  const { data: recentlyWatched, isLoading } = trpc.storyProgress.getRecentlyWatched.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  if (!isAuthenticated || isLoading) {
    return null;
  }

  if (!recentlyWatched || recentlyWatched.length === 0) {
    return null;
  }

  return (
    <div className="animate-slide-up">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <Clock className="h-6 w-6 text-primary" />
          Recently Watched
        </h3>
        <Button
          variant="ghost"
          onClick={() => setLocation("/library?filter=continue")}
          className="rounded-button"
        >
          View All
          <ArrowRight className="h-4 w-4 ml-2" />
        </Button>
      </div>

      <div className="grid md:grid-cols-2 gap-4">
        {recentlyWatched.slice(0, 2).map((item) => (
          <Card
            key={item.id}
            className="rounded-card shadow-playful hover-lift hover-glow active-scale transition-all cursor-pointer group border-2"
            onClick={() => setLocation(`/content/${item.id}`)}
          >
            {/* Thumbnail */}
            <div className="relative w-full h-32 bg-gradient-to-br from-purple-100 via-teal-100 to-pink-100 overflow-hidden">
              {item.thumbnailUrl ? (
                <img
                  src={item.thumbnailUrl}
                  alt={item.title || item.theme}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none';
                  }}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <div className="text-4xl opacity-30">
                    {item.mode === "podcast" ? "🎙️" : "🎬"}
                  </div>
                </div>
              )}

              {/* Progress bar */}
              {item.progress && item.progress.progressPercent > 0 && item.progress.progressPercent < 100 && (
                <div className="absolute bottom-0 left-0 right-0">
                  <div className="h-1 bg-black/30">
                    <div
                      className="h-full bg-gradient-to-r from-purple-500 to-pink-500 transition-all duration-300"
                      style={{ width: `${item.progress.progressPercent}%` }}
                    />
                  </div>
                  <div className="absolute bottom-1 right-1 px-1.5 py-0.5 bg-black/70 text-white text-xs font-medium rounded">
                    {item.progress.progressPercent}%
                  </div>
                </div>
              )}

              {/* Completed badge */}
              {item.progress?.completed && (
                <div className="absolute top-2 right-2 z-10">
                  <div className="w-6 h-6 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              )}

              {/* Play overlay on hover */}
              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center">
                  <Play className="h-6 w-6 text-primary ml-1" />
                </div>
              </div>
            </div>

            {/* Content */}
            <CardContent className="p-3 space-y-2">
              <div className="flex items-start gap-2">
                <Badge
                  variant={item.mode === "podcast" ? "default" : "secondary"}
                  className="rounded-full text-xs flex-shrink-0"
                >
                  {item.mode === "podcast" ? "🎙️" : "🎬"}
                </Badge>
              </div>
              <h4 className="font-semibold text-sm line-clamp-2 leading-tight">
                {item.title && item.titleTranslation
                  ? `${item.title} / ${item.titleTranslation}`
                  : item.title || item.storyText?.substring(0, 40) || `${item.theme} Story`}
              </h4>
              <div className="flex items-center gap-1 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                <span>{new Date(item.progress?.lastWatchedAt || item.generatedAt).toLocaleDateString()}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
