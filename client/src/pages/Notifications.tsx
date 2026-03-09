import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Loader2, Bell, BellOff, ArrowLeft, UserPlus, FolderOpen, Star, Award } from "lucide-react";
import { APP_LOGO } from "@/const";
import { formatDistanceToNow } from "date-fns";
import { useAuth } from "@/_core/hooks/useAuth";

export default function Notifications() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const { data: notifications, isLoading } = trpc.follow.getNotifications.useQuery({
    limit: 50,
    unreadOnly: false,
  });

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
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const handleNotificationClick = (notification: any) => {
    // Mark as read
    if (!notification.isRead) {
      markAsReadMutation.mutate({ notificationId: notification.id });
    }

    // Navigate based on notification type
    if (notification.type === "new_follower" && notification.relatedUserId) {
      setLocation(`/profile/${notification.relatedUserId}`);
    } else if (notification.type === "new_collection" && notification.relatedCollectionId) {
      // Navigate to collection - need to get share token first
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50 shadow-playful">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => window.history.back()}
              className="rounded-full"
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <img src={APP_LOGO} alt="Storyling.ai" className="h-10 w-10" />
            <h1 className="text-2xl font-bold gradient-text-primary">Notifications</h1>
          </div>
          {notifications && notifications.length > 0 && (
            <Button
              variant="outline"
              onClick={() => markAllAsReadMutation.mutate()}
              disabled={markAllAsReadMutation.isPending}
              className="rounded-button"
            >
              {markAllAsReadMutation.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : null}
              Mark All as Read
            </Button>
          )}
        </div>
      </header>

      <div className="container py-12 max-w-3xl">
        {notifications && notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <Card
                key={notification.id}
                className={`rounded-card border-2 transition-all cursor-pointer hover-lift ${
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
                        {!notification.isRead && (
                          <Badge className="rounded-full bg-primary text-white text-xs">
                            New
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {notification.content}
                      </p>
                      <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(notification.createdAt))} ago
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
    </div>
  );
}
