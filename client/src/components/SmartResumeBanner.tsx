import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Play, Clock } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";

export function SmartResumeBanner() {
  const [, setLocation] = useLocation();
  const { data: inProgressStory, isLoading } = trpc.storyProgress.getMostRecentInProgress.useQuery();

  if (isLoading || !inProgressStory) {
    return null;
  }

  const { progress } = inProgressStory;
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return (
    <Card className="rounded-card shadow-playful-lg border-2 border-primary/30 bg-gradient-to-r from-primary/5 to-teal-50 hover-lift transition-all animate-slide-up">
      <CardContent className="p-6">
        <div className="flex items-center gap-4">
          {/* Thumbnail */}
          <div className="relative flex-shrink-0">
            <img
              src={inProgressStory.thumbnailUrl || "/placeholder-thumbnail.png"}
              alt={inProgressStory.title || "Story"}
              className="w-24 h-24 object-cover rounded-lg"
            />
            <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
              <Play className="h-8 w-8 text-white drop-shadow-lg" />
            </div>
          </div>

          {/* Content Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-2">
              <Clock className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">Continue Watching</span>
            </div>
            
            <h3 className="text-lg font-bold mb-2 truncate">
              {inProgressStory.title && inProgressStory.titleTranslation
                ? `${inProgressStory.title} / ${inProgressStory.titleTranslation}`
                : inProgressStory.title || "Untitled Story"}
            </h3>

            <div className="flex items-center gap-2 mb-3 flex-wrap">
              <Badge className="rounded-full gradient-primary text-white border-0 text-xs">
                {inProgressStory.theme}
              </Badge>
              <Badge variant="outline" className="rounded-full text-xs">
                {inProgressStory.mode === "podcast" ? "🎙️ Podcast" : "🎬 Film"}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {formatTime(progress.currentTime)} / {formatTime(progress.totalDuration)}
              </span>
            </div>

            {/* Progress Bar */}
            <div className="space-y-1">
              <Progress value={progress.progressPercent} className="h-2" />
              <p className="text-xs text-muted-foreground">
                {progress.progressPercent}% complete
              </p>
            </div>
          </div>

          {/* Resume Button */}
          <div className="flex items-center">
            <Button
              size="lg"
              onClick={() => setLocation(`/content/${inProgressStory.id}`)}
              className="rounded-button gradient-primary text-white hover-lift hover-glow active-scale border-0 transition-all"
            >
              <Play className="h-5 w-5 mr-2" />
              Resume
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
