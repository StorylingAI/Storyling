import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Clock, CheckCircle2, Play, Trash2, Download } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import Breadcrumb from "@/components/Breadcrumb";
import { MobileNav } from "@/components/MobileNav";

export default function WatchHistory() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  const { data: historyData, isLoading } = trpc.watchHistory.getHistoryGroupedByDate.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-card shadow-playful-lg border-2">
          <CardContent className="pt-6 text-center space-y-4">
            <img src="/flip-mascot.png" alt="Flip" className="w-24 h-24 mx-auto" />
            <h3 className="text-xl font-bold">Sign in to continue</h3>
            <p className="text-muted-foreground">Please sign in to view your watch history</p>
            <Button
              onClick={() => setLocation("/")}
              className="rounded-button gradient-primary text-white hover-lift border-0"
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
        <p className="text-muted-foreground">Loading your watch history...</p>
      </div>
    );
  }

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}m ${secs}s`;
  };

  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const isEmpty = !historyData || Object.keys(historyData).length === 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50">
      <MobileNav title="Watch History" backPath="/library" />
      <div className="container py-8 max-w-5xl">
        <Breadcrumb
          items={[
            { label: "Dashboard", href: "/app" },
            { label: "Watch History", icon: <Clock className="h-4 w-4" /> },
          ]}
          actions={
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  toast.info("Export data feature coming soon!");
                }}
                className="gap-2"
              >
                <Download className="h-4 w-4" />
                Export Data
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  if (confirm("Are you sure you want to clear all watch history? This action cannot be undone.")) {
                    toast.info("Clear history feature coming soon!");
                  }
                }}
                className="gap-2 text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Trash2 className="h-4 w-4" />
                Clear History
              </Button>
            </>
          }
        />

        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2">Watch History</h1>
          <p className="text-muted-foreground">
            Track all your learning sessions and progress over time
          </p>
        </div>

        {isEmpty ? (
          <Card className="rounded-card shadow-playful border-2">
            <CardContent className="pt-6 text-center space-y-4">
              <img src="/flip-mascot.png" alt="Flip" className="w-24 h-24 mx-auto opacity-50" />
              <h3 className="text-xl font-bold">No watch history yet</h3>
              <p className="text-muted-foreground">
                Start watching stories to see your learning journey here
              </p>
              <Button
                onClick={() => setLocation("/library")}
                className="rounded-button gradient-primary text-white hover-lift border-0"
              >
                Browse Library
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-8">
            {Object.entries(historyData).map(([date, items]) => (
              <div key={date}>
                <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                  <Clock className="h-6 w-6 text-primary" />
                  {date}
                </h2>
                <div className="space-y-4">
                  {items.map((item) => (
                    <Card
                      key={item.id}
                      className="rounded-card shadow-playful border-2 hover-lift transition-all cursor-pointer"
                      onClick={() => setLocation(`/content/${item.contentId}`)}
                    >
                      <CardContent className="p-4">
                        <div className="flex gap-4">
                          {/* Thumbnail */}
                          <div className="relative flex-shrink-0">
                            <img
                              src={item.contentThumbnailUrl || "/placeholder-thumbnail.png"}
                              alt={item.contentTitle || "Story"}
                              className="w-32 h-32 object-cover rounded-lg"
                            />
                            {item.completed && (
                              <div className="absolute top-2 right-2 bg-green-500 text-white rounded-full p-1">
                                <CheckCircle2 className="h-4 w-4" />
                              </div>
                            )}
                          </div>

                          {/* Content Info */}
                          <div className="flex-1 min-w-0">
                            <h3 className="text-lg font-bold mb-1 truncate">
                              {item.contentTitle && item.contentTitleTranslation
                                ? `${item.contentTitle} / ${item.contentTitleTranslation}`
                                : item.contentTitle || "Untitled Story"}
                            </h3>
                            
                            <div className="flex items-center gap-2 mb-2 flex-wrap">
                              <Badge className="rounded-full gradient-primary text-white border-0">
                                {item.contentTheme}
                              </Badge>
                              <Badge variant="outline" className="rounded-full">
                                {item.contentMode === "podcast" ? "🎙️ Podcast" : "🎬 Film"}
                              </Badge>
                              <Badge variant="outline" className="rounded-full">
                                {item.contentTargetLanguage}
                              </Badge>
                            </div>

                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatTime(item.watchedAt)}
                              </span>
                              <span>Watched: {formatDuration(item.duration)}</span>
                              <span>
                                {item.completed ? (
                                  <span className="text-green-600 font-medium flex items-center gap-1">
                                    <CheckCircle2 className="h-4 w-4" />
                                    Completed
                                  </span>
                                ) : (
                                  <span className="text-orange-600 font-medium">
                                    {Math.round(item.progressPercentage)}% complete
                                  </span>
                                )}
                              </span>
                            </div>
                          </div>

                          {/* Play Button */}
                          <div className="flex items-center">
                            <Button
                              size="icon"
                              className="rounded-full h-12 w-12 gradient-primary text-white hover-lift border-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/content/${item.contentId}`);
                              }}
                            >
                              <Play className="h-5 w-5 ml-0.5" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
