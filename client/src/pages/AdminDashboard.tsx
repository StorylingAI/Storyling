import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Building2,
  DollarSign,
  TrendingUp,
  Activity,
  AlertCircle,
  BarChart3,
  BookOpen,
  Eye,
  Copy,
  Gift,
  CheckCircle,
  XCircle,
  Edit,
  FlaskConical,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useState } from "react";

const ADMIN_USER_PAGE_SIZE = 20;
const USER_ROLE_OPTIONS = ["user", "admin", "teacher", "org_admin"] as const;
type UserRole = (typeof USER_ROLE_OPTIONS)[number];
type UserRoleFilter = UserRole | "all";

function formatDate(value: Date | string | null | undefined) {
  if (!value) return "Never";
  return new Intl.DateTimeFormat(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(value));
}

function formatRole(role: string) {
  return role.replace("_", " ");
}

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const isAdmin = user?.role === "admin";
  const utils = trpc.useUtils();
  const [userSearch, setUserSearch] = useState("");
  const [userRoleFilter, setUserRoleFilter] = useState<UserRoleFilter>("all");
  const [userPage, setUserPage] = useState(1);

  const { data: overview, isLoading: overviewLoading } = trpc.adminAnalytics.getOverviewStats.useQuery(undefined, {
    enabled: isAdmin,
  });
  const { data: revenue, isLoading: revenueLoading } = trpc.adminAnalytics.getRevenueMetrics.useQuery(undefined, {
    enabled: isAdmin,
  });
  const { data: activeUsers, isLoading: activeUsersLoading } = trpc.adminAnalytics.getActiveUsersMetrics.useQuery({
    period: "month",
  }, {
    enabled: isAdmin,
  });
  const { data: engagement, isLoading: engagementLoading } = trpc.adminAnalytics.getEngagementMetrics.useQuery(undefined, {
    enabled: isAdmin,
  });
  const { data: churn, isLoading: churnLoading } = trpc.adminAnalytics.getChurnAnalysis.useQuery(undefined, {
    enabled: isAdmin,
  });
  const { data: orgUsage, isLoading: orgUsageLoading } = trpc.adminAnalytics.getOrganizationUsage.useQuery(undefined, {
    enabled: isAdmin,
  });
  const { data: collectionAnalytics, isLoading: collectionAnalyticsLoading } = trpc.adminAnalytics.getCollectionAnalytics.useQuery({ limit: 20 }, {
    enabled: isAdmin,
  });
  const { data: referralOverview, isLoading: referralOverviewLoading } = trpc.adminReferral.getOverviewStats.useQuery(undefined, {
    enabled: isAdmin,
  });
  const { data: topReferrers, isLoading: topReferrersLoading } = trpc.adminReferral.getTopReferrers.useQuery({ limit: 20 }, {
    enabled: isAdmin,
  });
  const { data: pendingRewards, isLoading: pendingRewardsLoading } = trpc.adminReferral.getPendingRewards.useQuery(undefined, {
    enabled: isAdmin,
  });
  const {
    data: userDirectory,
    isLoading: userDirectoryLoading,
    isFetching: userDirectoryFetching,
  } = trpc.adminAnalytics.getUsers.useQuery({
    search: userSearch.trim() || undefined,
    role: userRoleFilter,
    page: userPage,
    pageSize: ADMIN_USER_PAGE_SIZE,
    sortBy: "createdAt",
    sortDirection: "desc",
  }, {
    enabled: isAdmin,
  });
  const updateUserRole = trpc.adminAnalytics.updateUserRole.useMutation({
    onSuccess: async () => {
      await Promise.all([
        utils.adminAnalytics.getUsers.invalidate(),
        utils.auth.me.invalidate(),
      ]);
    },
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <Skeleton className="h-10 w-64 mb-8" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-32" />
          ))}
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-orange-500" />
              <CardTitle>Admin access required</CardTitle>
            </div>
            <CardDescription>
              This account is signed in, but it does not have admin access yet.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-md bg-gray-100 px-3 py-2 text-sm text-gray-700">
              Current role: <span className="font-medium">{user?.role ?? "none"}</span>
            </div>
            <div className="flex gap-2">
              <Button onClick={() => navigate("/app")} variant="outline">
                Go to app
              </Button>
              <Button onClick={() => window.location.reload()}>
                Refresh session
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8 max-w-7xl">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Analytics</h1>
            <p className="text-lg text-gray-600">Platform metrics and insights</p>
          </div>
          <Button
            onClick={() => navigate("/admin/ab-testing")}
            variant="outline"
            className="flex items-center gap-2"
          >
            <FlaskConical className="h-4 w-4" />
            A/B Testing
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
              <Users className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              {overviewLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-3xl font-bold">{overview?.totalUsers.toLocaleString()}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    +{overview?.newUsersThisWeek} this week
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Organizations</CardTitle>
              <Building2 className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              {overviewLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-3xl font-bold">{overview?.totalOrganizations}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    {overview?.activeOrganizations} active
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Monthly Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              {revenueLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-3xl font-bold">${revenue?.totalMRR.toLocaleString()}</div>
                  <p className="text-xs text-gray-500 mt-1">
                    ${revenue?.annualRunRate.toLocaleString()} ARR
                  </p>
                </>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">Content Created</CardTitle>
              <BarChart3 className="h-4 w-4 text-gray-400" />
            </CardHeader>
            <CardContent>
              {overviewLoading ? (
                <Skeleton className="h-8 w-24" />
              ) : (
                <>
                  <div className="text-3xl font-bold">
                    {overview?.totalContentCreated.toLocaleString()}
                  </div>
                  <p className="text-xs text-gray-500 mt-1">Stories & podcasts</p>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Tabs */}
        <Tabs defaultValue="revenue" className="space-y-6">
          <TabsList>
            <TabsTrigger value="revenue">Revenue</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="engagement">Engagement</TabsTrigger>
            <TabsTrigger value="organizations">Organizations</TabsTrigger>
            <TabsTrigger value="collections">Collections</TabsTrigger>
            <TabsTrigger value="referrals">Referrals</TabsTrigger>
            <TabsTrigger value="churn">Churn</TabsTrigger>
          </TabsList>

          {/* Revenue Tab */}
          <TabsContent value="revenue" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Breakdown</CardTitle>
                  <CardDescription>Monthly recurring revenue by tier</CardDescription>
                </CardHeader>
                <CardContent>
                  {revenueLoading ? (
                    <Skeleton className="h-40" />
                  ) : (
                    <div className="space-y-4">
                      {Object.entries(revenue?.revenueByTier || {}).map(([tier, amount]) => (
                        <div key={tier} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div
                              className={`w-3 h-3 rounded-full ${
                                tier === "trial"
                                  ? "bg-gray-400"
                                  : tier === "basic"
                                  ? "bg-blue-500"
                                  : tier === "premium"
                                  ? "bg-purple-500"
                                  : "bg-yellow-500"
                              }`}
                            />
                            <span className="font-medium capitalize">{tier}</span>
                          </div>
                          <span className="text-lg font-bold">${amount.toLocaleString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Subscription Metrics</CardTitle>
                  <CardDescription>Active paid subscriptions</CardDescription>
                </CardHeader>
                <CardContent>
                  {revenueLoading ? (
                    <Skeleton className="h-40" />
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Active Subscriptions</span>
                        <span className="text-2xl font-bold">{revenue?.activeSubscriptions}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Average Revenue per Org</span>
                        <span className="text-2xl font-bold">
                          $
                          {revenue?.activeSubscriptions
                            ? Math.round(revenue.totalMRR / revenue.activeSubscriptions)
                            : 0}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Users Tab */}
          <TabsContent value="users" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Active Users</CardTitle>
                  <CardDescription>Users who signed in recently</CardDescription>
                </CardHeader>
                <CardContent>
                  {activeUsersLoading ? (
                    <Skeleton className="h-24" />
                  ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Active This Month</span>
                        <span className="text-3xl font-bold">{activeUsers?.activeUsers}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Total Users</span>
                        <span className="text-2xl font-bold">{activeUsers?.totalUsers}</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Activation Rate</CardTitle>
                  <CardDescription>Monthly active users divided by total users</CardDescription>
                </CardHeader>
                <CardContent>
                  {activeUsersLoading ? (
                    <Skeleton className="h-24" />
                  ) : (
                    <div className="text-4xl font-bold">
                      {activeUsers?.totalUsers
                        ? Math.round((activeUsers.activeUsers / activeUsers.totalUsers) * 100)
                        : 0}
                      %
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>New Signups</CardTitle>
                  <CardDescription>Accounts created in the last 7 days</CardDescription>
                </CardHeader>
                <CardContent>
                  {overviewLoading ? (
                    <Skeleton className="h-24" />
                  ) : (
                    <div className="text-4xl font-bold">{overview?.newUsersThisWeek ?? 0}</div>
                  )}
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                  <div>
                    <CardTitle>User Management</CardTitle>
                    <CardDescription>
                      Review signups, account info, activity, subscriptions, and roles.
                    </CardDescription>
                  </div>
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <Input
                      value={userSearch}
                      onChange={(event) => {
                        setUserSearch(event.target.value);
                        setUserPage(1);
                      }}
                      placeholder="Search name or email"
                      className="w-full sm:w-64"
                    />
                    <Select
                      value={userRoleFilter}
                      onValueChange={(value) => {
                        setUserRoleFilter(value as UserRoleFilter);
                        setUserPage(1);
                      }}
                    >
                      <SelectTrigger className="w-full sm:w-40">
                        <SelectValue placeholder="Role" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All roles</SelectItem>
                        {USER_ROLE_OPTIONS.map((role) => (
                          <SelectItem key={role} value={role}>
                            {formatRole(role)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {updateUserRole.error && (
                  <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {updateUserRole.error.message}
                  </div>
                )}

                {userDirectoryLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4, 5].map((item) => (
                      <Skeleton key={item} className="h-14 w-full" />
                    ))}
                  </div>
                ) : (
                  <>
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <span>
                        {userDirectory?.pagination.total ?? 0} user
                        {(userDirectory?.pagination.total ?? 0) === 1 ? "" : "s"}
                      </span>
                      {userDirectoryFetching && <span>Refreshing...</span>}
                    </div>

                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>User</TableHead>
                          <TableHead>Signup</TableHead>
                          <TableHead>Last Sign In</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Plan</TableHead>
                          <TableHead>Languages</TableHead>
                          <TableHead>Content</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {userDirectory?.users.length ? (
                          userDirectory.users.map((account) => (
                            <TableRow key={account.id}>
                              <TableCell>
                                <div className="font-medium">{account.name || "Unnamed user"}</div>
                                <div className="text-xs text-gray-500">{account.email || "No email"}</div>
                                <div className="mt-1 flex gap-1">
                                  <Badge variant={account.emailVerified ? "secondary" : "outline"}>
                                    {account.emailVerified ? "Verified" : "Unverified"}
                                  </Badge>
                                  {account.loginMethod && (
                                    <Badge variant="outline">{account.loginMethod}</Badge>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>{formatDate(account.createdAt)}</TableCell>
                              <TableCell>{formatDate(account.lastSignedIn)}</TableCell>
                              <TableCell>
                                <Select
                                  value={account.role}
                                  disabled={account.id === user?.id || updateUserRole.isPending}
                                  onValueChange={(role) => {
                                    updateUserRole.mutate({
                                      userId: account.id,
                                      role: role as UserRole,
                                    });
                                  }}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {USER_ROLE_OPTIONS.map((role) => (
                                      <SelectItem key={role} value={role}>
                                        {formatRole(role)}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <div className="capitalize">{account.subscriptionTier}</div>
                                <div className="text-xs text-gray-500">
                                  {account.subscriptionStatus || "No subscription"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div>{account.preferredLanguage || "en"}</div>
                                <div className="text-xs text-gray-500">
                                  Translation: {account.preferredTranslationLanguage || "en"}
                                </div>
                              </TableCell>
                              <TableCell>
                                <div className="font-medium">{account.stats.totalContent} total</div>
                                <div className="text-xs text-gray-500">
                                  {account.stats.completedContent} completed, {account.stats.failedContent} failed
                                </div>
                                <div className="text-xs text-gray-500">
                                  Last: {formatDate(account.stats.lastGeneratedAt)}
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        ) : (
                          <TableRow>
                            <TableCell colSpan={7} className="py-8 text-center text-gray-500">
                              No users match the current filters.
                            </TableCell>
                          </TableRow>
                        )}
                      </TableBody>
                    </Table>

                    <div className="flex items-center justify-between">
                      <Button
                        variant="outline"
                        disabled={userPage <= 1 || userDirectoryFetching}
                        onClick={() => setUserPage((page) => Math.max(1, page - 1))}
                      >
                        Previous
                      </Button>
                      <span className="text-sm text-gray-600">
                        Page {userDirectory?.pagination.page ?? userPage} of{" "}
                        {userDirectory?.pagination.totalPages ?? 1}
                      </span>
                      <Button
                        variant="outline"
                        disabled={
                          !userDirectory ||
                          userPage >= userDirectory.pagination.totalPages ||
                          userDirectoryFetching
                        }
                        onClick={() => setUserPage((page) => page + 1)}
                      >
                        Next
                      </Button>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Engagement Tab */}
          <TabsContent value="engagement" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Content Statistics</CardTitle>
                  <CardDescription>Platform-wide content metrics</CardDescription>
                </CardHeader>
                <CardContent>
                  {engagementLoading ? (
                    <Skeleton className="h-40" />
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Total Content</span>
                        <span className="text-2xl font-bold">{engagement?.totalContent}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Completed</span>
                        <span className="text-2xl font-bold text-green-600">
                          {engagement?.completedContent}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Failed</span>
                        <span className="text-2xl font-bold text-red-600">
                          {engagement?.failedContent}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Success Rate</span>
                        <span className="text-2xl font-bold">
                          {engagement?.successRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Top Creators</CardTitle>
                  <CardDescription>Most active users</CardDescription>
                </CardHeader>
                <CardContent>
                  {engagementLoading ? (
                    <Skeleton className="h-40" />
                  ) : (
                    <div className="space-y-3">
                      {engagement?.topCreators.slice(0, 5).map((creator, index) => (
                        <div key={creator.userId} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-gray-500">#{index + 1}</span>
                            <span className="font-medium">{creator.userName || "Anonymous"}</span>
                          </div>
                          <span className="text-sm text-gray-600">{creator.contentCount} stories</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Organizations Tab */}
          <TabsContent value="organizations" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Organization Usage</CardTitle>
                <CardDescription>Seat utilization by organization</CardDescription>
              </CardHeader>
              <CardContent>
                {orgUsageLoading ? (
                  <Skeleton className="h-96" />
                ) : (
                  <div className="space-y-4 max-h-96 overflow-y-auto">
                    {orgUsage?.organizations.map((org) => (
                      <div key={org.id} className="p-4 border rounded-lg">
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <h4 className="font-semibold">{org.name}</h4>
                            <p className="text-sm text-gray-500 capitalize">{org.subscriptionTier}</p>
                          </div>
                          <span
                            className={`px-2 py-1 text-xs rounded ${
                              org.isActive
                                ? "bg-green-100 text-green-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {org.isActive ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-600">Students: </span>
                            <span className="font-medium">
                              {org.currentStudents} / {org.maxStudents}
                            </span>
                            <span className="text-gray-500 ml-2">
                              ({org.studentUtilization.toFixed(0)}%)
                            </span>
                          </div>
                          <div>
                            <span className="text-gray-600">Teachers: </span>
                            <span className="font-medium">
                              {org.currentTeachers} / {org.maxTeachers}
                            </span>
                            <span className="text-gray-500 ml-2">
                              ({org.teacherUtilization.toFixed(0)}%)
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Collections Tab */}
          <TabsContent value="collections" className="space-y-6">
            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Collections</CardTitle>
                  <BookOpen className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  {collectionAnalyticsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <div className="text-3xl font-bold">{collectionAnalytics?.summary.totalCollections}</div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Views</CardTitle>
                  <Eye className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  {collectionAnalyticsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-3xl font-bold">{collectionAnalytics?.summary.totalViews.toLocaleString()}</div>
                      <p className="text-xs text-gray-500 mt-1">
                        Avg: {collectionAnalytics?.summary.avgViewsPerCollection} per collection
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Clones</CardTitle>
                  <Copy className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  {collectionAnalyticsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-3xl font-bold">{collectionAnalytics?.summary.totalClones.toLocaleString()}</div>
                      <p className="text-xs text-gray-500 mt-1">
                        Avg: {collectionAnalytics?.summary.avgClonesPerCollection} per collection
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Engagement Rate</CardTitle>
                  <TrendingUp className="h-4 w-4 text-gray-400" />
                </CardHeader>
                <CardContent>
                  {collectionAnalyticsLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-3xl font-bold">
                        {collectionAnalytics?.summary.totalViews && collectionAnalytics?.summary.totalClones
                          ? ((collectionAnalytics.summary.totalClones / collectionAnalytics.summary.totalViews) * 100).toFixed(1)
                          : 0}%
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Clone rate</p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Collections Table */}
            <Card>
              <CardHeader>
                <CardTitle>Public Collections Analytics</CardTitle>
                <CardDescription>Top collections by views</CardDescription>
              </CardHeader>
              <CardContent>
                {collectionAnalyticsLoading ? (
                  <div className="space-y-4">
                    {[1, 2, 3, 4, 5].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Collection</th>
                          <th className="text-left py-3 px-4 font-medium text-gray-600">Creator</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-600">Stories</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-600">Views</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-600">Clones</th>
                          <th className="text-center py-3 px-4 font-medium text-gray-600">Featured</th>
                        </tr>
                      </thead>
                      <tbody>
                        {collectionAnalytics?.collections.map((collection) => (
                          <tr key={collection.id} className="border-b hover:bg-gray-50">
                            <td className="py-3 px-4">
                              <div>
                                <p className="font-medium">{collection.name}</p>
                                {collection.description && (
                                  <p className="text-sm text-gray-500 truncate max-w-xs">
                                    {collection.description}
                                  </p>
                                )}
                              </div>
                            </td>
                            <td className="py-3 px-4">
                              <div>
                                <p className="text-sm">{collection.userName}</p>
                                <p className="text-xs text-gray-500">{collection.userEmail}</p>
                              </div>
                            </td>
                            <td className="py-3 px-4 text-center">{collection.itemCount}</td>
                            <td className="py-3 px-4 text-center font-medium">{collection.viewCount.toLocaleString()}</td>
                            <td className="py-3 px-4 text-center font-medium">{collection.cloneCount.toLocaleString()}</td>
                            <td className="py-3 px-4 text-center">
                              {collection.isFeatured ? (
                                <span className="inline-flex items-center px-2 py-1 rounded-full text-xs bg-yellow-100 text-yellow-800">
                                  Featured
                                </span>
                              ) : (
                                <span className="text-gray-400">-</span>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Churn Tab */}
          <TabsContent value="churn" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>User Churn</CardTitle>
                  <CardDescription>Inactive users (30+ days)</CardDescription>
                </CardHeader>
                <CardContent>
                  {churnLoading ? (
                    <Skeleton className="h-40" />
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Inactive Users</span>
                        <span className="text-2xl font-bold text-orange-600">
                          {churn?.inactiveUsers}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Total Users</span>
                        <span className="text-2xl font-bold">{churn?.totalUsers}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Churn Rate</span>
                        <span className="text-3xl font-bold text-red-600">
                          {churn?.userChurnRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Organization Churn</CardTitle>
                  <CardDescription>Inactive organizations</CardDescription>
                </CardHeader>
                <CardContent>
                  {churnLoading ? (
                    <Skeleton className="h-40" />
                  ) : (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Inactive Orgs</span>
                        <span className="text-2xl font-bold text-orange-600">
                          {churn?.inactiveOrganizations}
                        </span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Total Orgs</span>
                        <span className="text-2xl font-bold">{churn?.totalOrganizations}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Churn Rate</span>
                        <span className="text-3xl font-bold text-red-600">
                          {churn?.orgChurnRate.toFixed(1)}%
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Referrals Tab */}
          <TabsContent value="referrals" className="space-y-6">
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Active Codes</CardTitle>
                </CardHeader>
                <CardContent>
                  {referralOverviewLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-3xl font-bold">{referralOverview?.activeCodes}</div>
                      <p className="text-xs text-gray-500 mt-1">
                        {referralOverview?.totalCodes} total codes
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Total Conversions</CardTitle>
                </CardHeader>
                <CardContent>
                  {referralOverviewLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-3xl font-bold">{referralOverview?.totalConversions}</div>
                      <p className="text-xs text-gray-500 mt-1">
                        {referralOverview?.appliedRewards} applied
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Pending Rewards</CardTitle>
                </CardHeader>
                <CardContent>
                  {referralOverviewLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-orange-600">
                        {referralOverview?.pendingRewards}
                      </div>
                      <p className="text-xs text-gray-500 mt-1">Awaiting approval</p>
                    </>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">Months Distributed</CardTitle>
                </CardHeader>
                <CardContent>
                  {referralOverviewLoading ? (
                    <Skeleton className="h-8 w-24" />
                  ) : (
                    <>
                      <div className="text-3xl font-bold">{referralOverview?.totalMonthsEarned}</div>
                      <p className="text-xs text-gray-500 mt-1">
                        {referralOverview?.totalMonthsAvailable} available
                      </p>
                    </>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Top Referrers */}
            <Card>
              <CardHeader>
                <CardTitle>Top Referrers</CardTitle>
                <CardDescription>Users with the most successful referrals</CardDescription>
              </CardHeader>
              <CardContent>
                {topReferrersLoading ? (
                  <Skeleton className="h-96" />
                ) : (
                  <div className="space-y-4">
                    {topReferrers && topReferrers.length > 0 ? (
                      topReferrers.map((referrer) => (
                        <div
                          key={referrer.userId}
                          className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div>
                                <p className="font-medium">{referrer.userName}</p>
                                <p className="text-sm text-gray-500">{referrer.userEmail}</p>
                              </div>
                              <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-700">
                                {referrer.subscriptionTier}
                              </span>
                              {referrer.isActive ? (
                                <CheckCircle className="h-4 w-4 text-green-500" />
                              ) : (
                                <XCircle className="h-4 w-4 text-gray-400" />
                              )}
                            </div>
                            <div className="flex items-center gap-4 mt-2 text-sm text-gray-600">
                              <span>Code: <strong>{referrer.referralCode}</strong></span>
                              <span>Discount: <strong>{referrer.discountPercent}%</strong></span>
                            </div>
                          </div>
                          <div className="flex items-center gap-6 text-center">
                            <div>
                              <p className="text-2xl font-bold">{referrer.totalReferrals}</p>
                              <p className="text-xs text-gray-500">Total</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-green-600">
                                {referrer.successfulConversions}
                              </p>
                              <p className="text-xs text-gray-500">Success</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-orange-600">
                                {referrer.pendingConversions}
                              </p>
                              <p className="text-xs text-gray-500">Pending</p>
                            </div>
                            <div>
                              <p className="text-2xl font-bold text-blue-600">
                                {referrer.monthsAvailable}
                              </p>
                              <p className="text-xs text-gray-500">Months</p>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">No referrers yet</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Pending Rewards */}
            <Card>
              <CardHeader>
                <CardTitle>Pending Rewards</CardTitle>
                <CardDescription>Referral rewards awaiting approval</CardDescription>
              </CardHeader>
              <CardContent>
                {pendingRewardsLoading ? (
                  <Skeleton className="h-64" />
                ) : (
                  <div className="space-y-3">
                    {pendingRewards && pendingRewards.length > 0 ? (
                      pendingRewards.map((reward) => (
                        <div
                          key={reward.id}
                          className="flex items-center justify-between p-4 border rounded-lg"
                        >
                          <div>
                            <p className="font-medium">
                              {reward.referrerName} → {reward.referredName}
                            </p>
                            <p className="text-sm text-gray-500">
                              {reward.referrerEmail} referred {reward.referredEmail}
                            </p>
                            <p className="text-xs text-gray-400 mt-1">
                              {new Date(reward.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="text-lg font-bold text-green-600">
                              {reward.rewardMonths} month(s)
                            </p>
                            <p className="text-xs text-gray-500">
                              {reward.discountApplied}% discount applied
                            </p>
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-gray-500 py-8">No pending rewards</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
