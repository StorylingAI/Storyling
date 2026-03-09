import { useParams, useLocation } from "wouter";
import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  ArrowLeft,
  Trophy,
  FolderOpen,
  Users,
  Calendar,
  Award,
  Clock,
  Copy,
  UserPlus,
  UserMinus,
  Loader2,
} from "lucide-react";
import { APP_LOGO } from "@/const";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

export default function Profile() {
  const { userId } = useParams<{ userId: string }>();
  const [, setLocation] = useLocation();
  const { user: currentUser } = useAuth();
  const [showFollowers, setShowFollowers] = useState(false);
  const [showFollowing, setShowFollowing] = useState(false);
  const utils = trpc.useUtils();

  const { data: profile, isLoading } = trpc.leaderboard.getUserProfile.useQuery(
    { userId: parseInt(userId!) },
    { enabled: !!userId && !isNaN(parseInt(userId!)) }
  );

  const { data: followStats } = trpc.follow.getFollowStats.useQuery(
    { userId: parseInt(userId!) },
    { enabled: !!userId && !isNaN(parseInt(userId!)) }
  );

  const { data: isFollowingData } = trpc.follow.isFollowing.useQuery(
    { userId: parseInt(userId!) },
    { enabled: !!currentUser && !!userId && !isNaN(parseInt(userId!)) && currentUser.id !== parseInt(userId!) }
  );

  const { data: followers } = trpc.follow.getFollowers.useQuery(
    { userId: parseInt(userId!), limit: 50 },
    { enabled: showFollowers && !!userId && !isNaN(parseInt(userId!)) }
  );

  const { data: following } = trpc.follow.getFollowing.useQuery(
    { userId: parseInt(userId!), limit: 50 },
    { enabled: showFollowing && !!userId && !isNaN(parseInt(userId!)) }
  );

  const followMutation = trpc.follow.followUser.useMutation({
    onSuccess: () => {
      toast.success("Following!", {
        description: `You are now following ${profile?.user.name}`,
      });
      utils.follow.isFollowing.invalidate();
      utils.follow.getFollowStats.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to follow", {
        description: error.message,
      });
    },
  });

  const unfollowMutation = trpc.follow.unfollowUser.useMutation({
    onSuccess: () => {
      toast.success("Unfollowed", {
        description: `You unfollowed ${profile?.user.name}`,
      });
      utils.follow.isFollowing.invalidate();
      utils.follow.getFollowStats.invalidate();
    },
    onError: (error) => {
      toast.error("Failed to unfollow", {
        description: error.message,
      });
    },
  });

  const handleCopyShareLink = (shareToken: string) => {
    const shareUrl = `${window.location.origin}/shared/${shareToken}`;
    navigator.clipboard.writeText(shareUrl);
    toast.success("Link copied!", {
      description: "Share link copied to clipboard",
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-teal-50 to-pink-50 flex items-center justify-center">
        <Card className="rounded-card shadow-playful-lg max-w-md">
          <CardContent className="py-16 text-center">
            <Trophy className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-2xl font-bold mb-2">User not found</h3>
            <p className="text-muted-foreground mb-6">
              This user profile doesn't exist or has been removed.
            </p>
            <Button
              onClick={() => setLocation("/leaderboard")}
              className="rounded-button gradient-primary text-white hover-lift border-0"
            >
              Back to Leaderboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const badgeColors: Record<string, string> = {
    collection_starter: "bg-gray-100 text-gray-700",
    collection_rising: "bg-blue-100 text-blue-700",
    collection_popular: "bg-green-100 text-green-700",
    collection_viral: "bg-orange-100 text-orange-700",
    collection_legend: "bg-purple-100 text-purple-700",
    collection_iconic: "bg-pink-100 text-pink-700",
  };

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
            <h1 className="text-2xl font-bold gradient-text-primary">Creator Profile</h1>
          </div>
        </div>
      </header>

      <div className="container py-12 space-y-8">
        {/* User Info Card */}
        <Card className="rounded-card shadow-playful-lg border-2 animate-slide-up">
          <CardContent className="py-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
              {/* Avatar */}
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-400 via-pink-400 to-orange-400 flex items-center justify-center text-white text-4xl font-bold shadow-playful">
                {profile.user.name.charAt(0).toUpperCase()}
              </div>

              {/* User Details */}
              <div className="flex-1 text-center md:text-left">
                <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4 mb-2">
                  <h2 className="text-3xl font-bold">{profile.user.name}</h2>
                  {currentUser && currentUser.id !== parseInt(userId!) && (
                    <Button
                      onClick={() => {
                        if (isFollowingData?.isFollowing) {
                          unfollowMutation.mutate({ userId: parseInt(userId!) });
                        } else {
                          followMutation.mutate({ userId: parseInt(userId!) });
                        }
                      }}
                      disabled={followMutation.isPending || unfollowMutation.isPending}
                      className={`rounded-button ${
                        isFollowingData?.isFollowing
                          ? "bg-gray-200 text-gray-700 hover:bg-gray-300"
                          : "gradient-primary text-white hover-lift border-0"
                      }`}
                    >
                      {followMutation.isPending || unfollowMutation.isPending ? (
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      ) : isFollowingData?.isFollowing ? (
                        <UserMinus className="mr-2 h-4 w-4" />
                      ) : (
                        <UserPlus className="mr-2 h-4 w-4" />
                      )}
                      {isFollowingData?.isFollowing ? "Unfollow" : "Follow"}
                    </Button>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground mb-3">
                  <div className="flex items-center gap-1">
                    <Calendar className="h-4 w-4" />
                    <span>
                      Joined {formatDistanceToNow(new Date(profile.user.joinedAt))} ago
                    </span>
                  </div>
                  <button
                    onClick={() => setShowFollowers(true)}
                    className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
                  >
                    <Users className="h-4 w-4" />
                    <span className="font-semibold">{followStats?.followers || 0}</span>
                    <span>Followers</span>
                  </button>
                  <button
                    onClick={() => setShowFollowing(true)}
                    className="flex items-center gap-1 hover:text-primary transition-colors cursor-pointer"
                  >
                    <span className="font-semibold">{followStats?.following || 0}</span>
                    <span>Following</span>
                  </button>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="bg-gradient-to-br from-purple-100 to-purple-200 rounded-card p-4 text-center">
                    <FolderOpen className="h-6 w-6 mx-auto mb-2 text-purple-600" />
                    <div className="text-2xl font-bold text-purple-900">
                      {profile.stats.totalCollections}
                    </div>
                    <div className="text-xs text-purple-700">Collections</div>
                  </div>
                  <div className="bg-gradient-to-br from-teal-100 to-teal-200 rounded-card p-4 text-center">
                    <Users className="h-6 w-6 mx-auto mb-2 text-teal-600" />
                    <div className="text-2xl font-bold text-teal-900">
                      {profile.stats.totalClones}
                    </div>
                    <div className="text-xs text-teal-700">Total Clones</div>
                  </div>
                  <div className="bg-gradient-to-br from-pink-100 to-pink-200 rounded-card p-4 text-center">
                    <Trophy className="h-6 w-6 mx-auto mb-2 text-pink-600" />
                    <div className="text-2xl font-bold text-pink-900">
                      {profile.stats.badgesEarned}
                    </div>
                    <div className="text-xs text-pink-700">Badges</div>
                  </div>
                  <div className="bg-gradient-to-br from-orange-100 to-orange-200 rounded-card p-4 text-center">
                    <FolderOpen className="h-6 w-6 mx-auto mb-2 text-orange-600" />
                    <div className="text-2xl font-bold text-orange-900">
                      {profile.stats.publicCollections}
                    </div>
                    <div className="text-xs text-orange-700">Public</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Badges Section */}
        {profile.badges.length > 0 && (
          <Card className="rounded-card shadow-playful-lg border-2 animate-slide-up stagger-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5" />
                Earned Badges
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profile.badges.map((badge) => (
                  <div
                    key={badge.id}
                    className={`${
                      badgeColors[badge.key] || "bg-gray-100 text-gray-700"
                    } rounded-card p-4 hover-lift transition-all`}
                  >
                    <div className="flex items-start gap-3">
                      <div className="text-3xl">{badge.icon}</div>
                      <div className="flex-1">
                        <h4 className="font-bold text-sm mb-1">{badge.name}</h4>
                        <p className="text-xs opacity-80 mb-2">{badge.description}</p>
                        <div className="flex items-center justify-between text-xs">
                          <span className="font-semibold">+{badge.xpReward} XP</span>
                          <span className="opacity-70">
                            {formatDistanceToNow(new Date(badge.unlockedAt))} ago
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Public Collections Portfolio */}
        {profile.collections.length > 0 && (
          <Card className="rounded-card shadow-playful-lg border-2 animate-slide-up stagger-3">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5" />
                Public Collections
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {profile.collections.map((collection) => (
                  <Card
                    key={collection.id}
                    className="rounded-card border-2 hover-lift transition-all cursor-pointer"
                    style={{ borderColor: collection.color || '#8b5cf6' }}
                    onClick={() =>
                      collection.shareToken &&
                      setLocation(`/shared/${collection.shareToken}`)
                    }
                  >
                    <CardContent className="py-6">
                      <div className="flex items-start justify-between mb-3">
                        <div
                          className="w-12 h-12 rounded-card flex items-center justify-center text-white text-xl font-bold shadow-playful"
                          style={{ backgroundColor: collection.color || '#8b5cf6' }}
                        >
                          {collection.name.charAt(0).toUpperCase()}
                        </div>
                        {collection.shareToken && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 rounded-full"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleCopyShareLink(collection.shareToken!);
                            }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <h4 className="font-bold text-lg mb-2 line-clamp-2">
                        {collection.name}
                      </h4>
                      {collection.description && (
                        <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                          {collection.description}
                        </p>
                      )}
                      <div className="flex items-center justify-between text-sm">
                        <Badge variant="secondary" className="rounded-full">
                          {collection.itemCount} stories
                        </Badge>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          <span>{collection.cloneCount}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Recent Activity Timeline */}
        {profile.recentActivity.length > 0 && (
          <Card className="rounded-card shadow-playful-lg border-2 animate-slide-up stagger-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Recent Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {profile.recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex items-center gap-4 p-4 bg-gradient-to-r from-purple-50 to-teal-50 rounded-card hover-lift transition-all"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold shadow-playful">
                      <FolderOpen className="h-5 w-5" />
                    </div>
                    <div className="flex-1">
                      <h5 className="font-semibold">{activity.name}</h5>
                      <p className="text-sm text-muted-foreground">
                        Created {formatDistanceToNow(new Date(activity.createdAt))} ago
                      </p>
                    </div>
                    <Badge variant="secondary" className="rounded-full">
                      <Users className="h-3 w-3 mr-1" />
                      {activity.cloneCount} clones
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Empty State */}
        {profile.collections.length === 0 && profile.badges.length === 0 && (
          <Card className="rounded-card shadow-playful-lg border-2 animate-bounce-in">
            <CardContent className="py-16 text-center">
              <Trophy className="w-32 h-32 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-2xl font-bold mb-2">Just Getting Started</h3>
              <p className="text-muted-foreground">
                This creator hasn't shared any collections yet.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Followers Modal */}
      <Dialog open={showFollowers} onOpenChange={setShowFollowers}>
        <DialogContent className="rounded-card max-w-md">
          <DialogHeader>
            <DialogTitle>Followers</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {followers && followers.length > 0 ? (
              followers.map((follower) => (
                <div
                  key={follower.id}
                  className="flex items-center justify-between p-3 rounded-card hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => {
                    setShowFollowers(false);
                    setLocation(`/profile/${follower.id}`);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white font-bold">
                      {(follower.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold">{follower.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Followed {formatDistanceToNow(new Date(follower.followedAt))} ago
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>No followers yet</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Following Modal */}
      <Dialog open={showFollowing} onOpenChange={setShowFollowing}>
        <DialogContent className="rounded-card max-w-md">
          <DialogHeader>
            <DialogTitle>Following</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {following && following.length > 0 ? (
              following.map((user) => (
                <div
                  key={user.id}
                  className="flex items-center justify-between p-3 rounded-card hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => {
                    setShowFollowing(false);
                    setLocation(`/profile/${user.id}`);
                  }}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-400 to-blue-400 flex items-center justify-center text-white font-bold">
                      {(user.name || 'U').charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <div className="font-semibold">{user.name}</div>
                      <div className="text-xs text-muted-foreground">
                        Following since {formatDistanceToNow(new Date(user.followedAt))} ago
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-2 opacity-50" />
                <p>Not following anyone yet</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
