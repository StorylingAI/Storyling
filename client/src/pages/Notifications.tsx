import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bell, BellOff, ArrowLeft, UserPlus, FolderOpen, Star, Award, BookOpen, ChevronRight } from "lucide-react";
import { APP_LOGO } from "@/const";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/_core/hooks/useAuth";
import { MobileNav } from "@/components/MobileNav";
import { PullToRefresh } from "@/components/PullToRefresh";

export default function Notifications() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: notifications, isLoading } = trpc.follow.getNotifications.useQuery({
    limit: 50,
    unreadOnly: false,
  });

  // Fetch user's content library to match story titles for older notifications without relatedContentId
  const { data: userContent } = trpc.content.getLibrary.useQuery(
    undefined,
    { enabled: !!user }
  );

  const markAsReadMutation = trpc.follow.markAsRead.useMutation({
    onSuccess: () => {
      utils.follow.getNotifications.invalidate();
      utils.follow.getUnreadCount.invalidate();
    },
  });

  const markAllAsReadMutation = trpc.follow.markAllAsRead.useMutation({
    onSuccess: () => {
      utils.follow.getNotifications.invalidate();
      utils.follow.getUnreadCount.invalidate();
    },
  });

  const handlePullRefresh = async () => {
    await Promise.all([
      utils.follow.getNotifications.invalidate(),
      utils.follow.getUnreadCount.invalidate(),
    ]);
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_follower":
        return <UserPlus className="h-5 w-5 text-purple-500" />;
      case "new_collection":
        return <FolderOpen className="h-5 w-5 text-teal-500" />;
      case "collection_featured":
        return <Star className="h-5 w-5 text-yellow-500" />;
      case "badge_earned":
        return <Award className="h-5 w-5 text-pink-500" />;
      case "story_ready":
        return <BookOpen className="h-5 w-5 text-teal-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  /**
   * Extract the story title from the notification content text.
   * The content format is: "Title" has been generated...
   * or: Your podcast "Title" has been converted...
   */
  const extractTitleFromContent = (content: string): string | null => {
    // Match text between curly/smart quotes or straight quotes
    const match = content.match(/["\u201C]([^"\u201D]+)["\u201D]/);
    return match ? match[1] : null;
  };

  /**
   * Resolve the content ID for a story_ready notification.
   * First checks relatedContentId, then falls back to title matching.
   */
  const resolveContentId = (notification: any): number | null => {
    // If the notification has a direct content ID link, use it
    if (notification.relatedContentId) {
      return notification.relatedContentId;
    }

    // Fall back to matching by title from the notification text
    if (userContent && notification.type === "story_ready") {
      const title = extractTitleFromContent(notification.content);
      if (title) {
        const match = userContent.find(
          (c: any) => c.title === title || c.titleTranslation === title
        );
        if (match) return match.id;
      }
    }

    return null;
  };

  const handleNotificationClick = (notification: any) => {
    // Mark as read
    if (!notification.isRead) {
      markAsReadMutation.mutate({ notificationId: notification.id });
    }

    // Navigate based on notification type
    if (notification.type === "story_ready") {
      const contentId = resolveContentId(notification);
      if (contentId) {
        setLocation(`/content/${contentId}`);
        return;
      }
      // If we can't resolve the content, go to library
      setLocation("/library");
    } else if (notification.type === "new_follower" && notification.relatedUserId) {
      setLocation(`/profile/${notification.relatedUserId}`);
    } else if (notification.type === "new_collection" && notification.relatedCollectionId) {
      setLocation(`/collections`);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50 flex items-center justify-center">
        <Card className="rounded-card shadow-playful-lg max-w-md">
          <CardContent className="py-16 text-center">
            <Bell className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-2xl font-bold mb-2">Login Required</h3>
            <p className="text-muted-foreground mb-6">
              Please log in to view your notifications.
            </p>
            <Button
              onClick={() => setLocation("/library")}
              className="rounded-button gradient-primary text-white hover-lift border-0"
            >
              Back to Library
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading notifications...</p>
        </div>
      </div>
    );
  }

  return (
    <PullToRefresh onRefresh={handlePullRefresh} className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50">
      {/* Hamburger nav with Mark All as Read action */}
      <MobileNav
        title="Notifications"
        backPath="/app"
        rightActions={
          notifications && notifications.length > 0 ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="rounded-full text-xs h-8 px-3"
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
              ) : null}
              Mark Read
            </Button>
          ) : undefined
        }
      />

      <div className="container py-12 max-w-3xl">
        {notifications && notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => {
              const isStoryReady = notification.type === "story_ready";
              const contentId = isStoryReady ? resolveContentId(notification) : null;
              const isClickable = isStoryReady || notification.type === "new_follower" || notification.type === "new_collection";

              return (
                <Card
                  key={notification.id}
                  className={`rounded-card border-2 transition-all ${
                    isClickable ? "cursor-pointer hover-lift" : ""
                  } ${
                    notification.isRead
                      ? "bg-white border-gray-200"
                      : "bg-gradient-to-r from-purple-50 to-teal-50 border-primary"
                  }`}
                  onClick={() => handleNotificationClick(notification)}
                >
                  <CardContent className="py-4">
                    <div className="flex items-start gap-4">
                      {/* Icon */}
                      <div className="flex-shrink-0 mt-1">
                        {getNotificationIcon(notification.type)}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h4 className="font-semibold text-sm">{notification.title}</h4>
                          <div className="flex items-center gap-2 shrink-0">
                            {!notification.isRead && (
                              <Badge className="rounded-full bg-primary text-white text-xs">
                                New
                              </Badge>
                            )}
                            {isStoryReady && contentId && (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">
                          {notification.content}
                        </p>
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">
                            {formatDistanceToNow(new Date(notification.createdAt))} ago
                          </span>
                          {isStoryReady && contentId && (
                            <span className="text-xs text-primary font-medium">
                              View Story →
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card className="rounded-card shadow-playful-lg border-2 animate-bounce-in">
            <CardContent className="py-16 text-center">
              <BellOff className="w-32 h-32 mx-auto text-muted-foreground mb-4 opacity-50" />
              <h3 className="text-2xl font-bold mb-2">No notifications yet</h3>
              <p className="text-muted-foreground mb-6">
                Follow creators to get notified when they publish new collections!
              </p>
              <Button
                onClick={() => setLocation("/discover")}
                className="rounded-button gradient-primary text-white hover-lift border-0"
              >
                Discover Creators
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </PullToRefresh>
  );
}
