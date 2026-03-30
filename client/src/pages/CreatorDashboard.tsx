import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, Users, Copy, Eye, Trophy, Sparkles } from "lucide-react";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

export function CreatorDashboard() {
  const { data: dashboardData, isLoading } = trpc.collectionAnalytics.getCreatorDashboard.useQuery();

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
          <Skeleton className="h-32" />
        </div>
        <Skeleton className="h-96" />
      </div>
    );
  }

  if (!dashboardData || dashboardData.collections.length === 0) {
    return (
      <div className="container mx-auto py-16">
        <Card className="max-w-2xl mx-auto">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
              <Sparkles className="w-8 h-8 text-purple-600" />
            </div>
            <CardTitle className="text-2xl">Start Your Creator Journey</CardTitle>
            <CardDescription className="text-base">
              Create and publish your first collection to see analytics and track your impact on the community.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <a
              href="/collections"
              className="inline-flex items-center justify-center rounded-md bg-purple-600 px-6 py-3 text-sm font-medium text-white hover:bg-purple-700 transition-colors"
            >
              Create Your First Collection
            </a>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prepare chart data
  const viewChartData = dashboardData.viewTrends.map(trend => ({
    date: new Date(trend.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    views: trend.views,
    uniqueViewers: trend.uniqueViewers,
  }));

  const cloneChartData = dashboardData.cloneTrends.map(trend => ({
    date: new Date(trend.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    clones: trend.clones,
  }));

  return (
    <div className="container mx-auto py-8 space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Creator Dashboard</h1>
        <p className="text-muted-foreground mt-2">
          Track your collection performance and grow your impact
        </p>
      </div>

      {/* Stats Overview */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Views</CardTitle>
            <Eye className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalViews.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Across {dashboardData.collections.length} collection{dashboardData.collections.length !== 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Clones</CardTitle>
            <Copy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.totalClones.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground mt-1">
              People using your collections
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Collections</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboardData.collections.length}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Public collections created
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Views</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Math.round(dashboardData.totalViews / dashboardData.collections.length).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Per collection
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Next Milestone */}
      {dashboardData.nextMilestone && (
        <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-purple-600" />
              <CardTitle>Next Milestone: {dashboardData.nextMilestone.label}</CardTitle>
            </div>
            <CardDescription>Keep creating to unlock this achievement!</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Views Progress</span>
                <span className="font-medium">
                  {dashboardData.nextMilestone.viewsNeeded > 0
                    ? `${dashboardData.nextMilestone.viewsNeeded.toLocaleString()} more needed`
                    : "Complete! ✓"}
                </span>
              </div>
              <Progress value={dashboardData.nextMilestone.viewsProgress} className="h-2" />
            </div>
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span>Clones Progress</span>
                <span className="font-medium">
                  {dashboardData.nextMilestone.clonesNeeded > 0
                    ? `${dashboardData.nextMilestone.clonesNeeded.toLocaleString()} more needed`
                    : "Complete! ✓"}
                </span>
              </div>
              <Progress value={dashboardData.nextMilestone.clonesProgress} className="h-2" />
            </div>
          </CardContent>
        </Card>
      )}

      {/* View Trends Chart */}
      {viewChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>View Trends (Last 30 Days)</CardTitle>
            <CardDescription>Track how your collections are being discovered</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={viewChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="views" stroke="#8b5cf6" strokeWidth={2} name="Total Views" />
                <Line type="monotone" dataKey="uniqueViewers" stroke="#ec4899" strokeWidth={2} name="Unique Viewers" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Clone Trends Chart */}
      {cloneChartData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Clone Trends (Last 30 Days)</CardTitle>
            <CardDescription>See when people save your collections</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={cloneChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="clones" stroke="#10b981" strokeWidth={2} name="Clones" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      )}

      {/* Top Performing Collections */}
      <Card>
        <CardHeader>
          <CardTitle>Top Performing Collections</CardTitle>
          <CardDescription>Your most popular collections by engagement</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {dashboardData.topCollections.map((collection, index) => (
              <div key={collection.id} className="flex items-center justify-between p-4 border rounded-lg">
                <div className="flex items-center gap-4">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-purple-100 text-purple-700 font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <h3 className="font-medium">{collection.name}</h3>
                    <p className="text-sm text-muted-foreground">
                      {collection.storyCount} {collection.storyCount === 1 ? "story" : "stories"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <Eye className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{collection.viewCount.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Copy className="h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{collection.cloneCount.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
