import { trpc } from "@/lib/trpc";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import {
  FlaskConical,
  BarChart3,
  Users,
  MousePointerClick,
  Eye,
  TrendingUp,
  Trophy,
  ArrowLeft,
  RefreshCw,
  Power,
  PowerOff,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Zap,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLocation } from "wouter";
import { useState } from "react";

// ─── Types ────────────────────────────────────────────────────────────

interface VariantResult {
  variantKey: string;
  label: string;
  weight: number;
  usersAssigned: number;
  impressions: number;
  uniqueImpressions: number;
  clicks: number;
  uniqueClicks: number;
  conversions: number;
  clickThroughRate: number;
  conversionRate: number;
}

interface SignificanceResult {
  zScore: number;
  pValue: number;
  significant: boolean;
  confidenceLevel: string;
  winner: "A" | "B" | null;
  winnerVariant: string | null;
  liftPercent: number;
}

interface AnalyticsData {
  experiment: {
    key: string;
    name: string;
    description: string | null;
    isActive: boolean;
    createdAt: Date;
  };
  variants: VariantResult[];
  significance: {
    clickThrough: SignificanceResult;
    conversion: SignificanceResult;
    recommendation: string;
    sampleSizeRecommendation: string;
  } | null;
}

// ─── Sub-Components ───────────────────────────────────────────────────

function SignificanceBadge({ sig }: { sig: SignificanceResult }) {
  if (sig.significant) {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-700">
        <CheckCircle2 className="h-3 w-3" />
        {sig.confidenceLevel} confident
      </span>
    );
  }
  if (sig.confidenceLevel === "90%") {
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700">
        <AlertTriangle className="h-3 w-3" />
        Trending ({sig.confidenceLevel})
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-500">
      <Clock className="h-3 w-3" />
      {sig.confidenceLevel}
    </span>
  );
}

function WinnerBadge({
  variantKey,
  winnerVariant,
}: {
  variantKey: string;
  winnerVariant: string | null;
}) {
  if (variantKey !== winnerVariant) return null;
  return (
    <span className="inline-flex items-center gap-1 ml-2 px-2 py-0.5 rounded-full text-xs font-bold bg-amber-100 text-amber-700">
      <Trophy className="h-3 w-3" />
      Winner
    </span>
  );
}

function MetricCard({
  icon: Icon,
  label,
  value,
  subtext,
  color,
}: {
  icon: typeof Eye;
  label: string;
  value: string | number;
  subtext?: string;
  color: string;
}) {
  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-white border border-gray-100">
      <div
        className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs text-gray-500 font-medium">{label}</p>
        <p className="text-lg font-bold text-gray-900">{value}</p>
        {subtext && <p className="text-xs text-gray-400">{subtext}</p>}
      </div>
    </div>
  );
}

// ─── Experiment Detail Card ───────────────────────────────────────────

function ExperimentCard({
  experimentKey,
  onToggle,
}: {
  experimentKey: string;
  onToggle: () => void;
}) {
  const { data, isLoading, refetch } = trpc.abTest.getAnalytics.useQuery(
    { experimentKey },
    { refetchInterval: 30000 } // Auto-refresh every 30s
  );
  const toggleMutation = trpc.abTest.toggleExperiment.useMutation({
    onSuccess: () => {
      refetch();
      onToggle();
    },
  });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72 mt-2" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-40" />
        </CardContent>
      </Card>
    );
  }

  if (!data) return null;

  const analytics = data as AnalyticsData;
  const { experiment, variants, significance } = analytics;

  const totalImpressions = variants.reduce(
    (s, v) => s + v.uniqueImpressions,
    0
  );
  const totalClicks = variants.reduce((s, v) => s + v.uniqueClicks, 0);
  const totalConversions = variants.reduce((s, v) => s + v.conversions, 0);
  const totalAssigned = variants.reduce((s, v) => s + v.usersAssigned, 0);

  return (
    <Card className="overflow-hidden">
      {/* Header */}
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                experiment.isActive
                  ? "bg-emerald-100 text-emerald-600"
                  : "bg-gray-100 text-gray-400"
              }`}
            >
              <FlaskConical className="h-5 w-5" />
            </div>
            <div>
              <CardTitle className="text-lg">{experiment.name}</CardTitle>
              <CardDescription className="text-xs font-mono text-gray-400">
                {experiment.key}
              </CardDescription>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              className="h-8"
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Refresh
            </Button>
            <Button
              variant={experiment.isActive ? "outline" : "default"}
              size="sm"
              onClick={() =>
                toggleMutation.mutate({
                  experimentKey: experiment.key,
                  isActive: !experiment.isActive,
                })
              }
              className={`h-8 ${
                experiment.isActive
                  ? "text-red-600 border-red-200 hover:bg-red-50"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
            >
              {experiment.isActive ? (
                <>
                  <PowerOff className="h-3.5 w-3.5 mr-1" />
                  Pause
                </>
              ) : (
                <>
                  <Power className="h-3.5 w-3.5 mr-1" />
                  Resume
                </>
              )}
            </Button>
          </div>
        </div>
        {experiment.description && (
          <p className="text-sm text-gray-500 mt-2">{experiment.description}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Overview Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <MetricCard
            icon={Users}
            label="Users Assigned"
            value={totalAssigned.toLocaleString()}
            color="bg-blue-50 text-blue-600"
          />
          <MetricCard
            icon={Eye}
            label="Unique Impressions"
            value={totalImpressions.toLocaleString()}
            color="bg-purple-50 text-purple-600"
          />
          <MetricCard
            icon={MousePointerClick}
            label="Unique Clicks"
            value={totalClicks.toLocaleString()}
            color="bg-amber-50 text-amber-600"
          />
          <MetricCard
            icon={TrendingUp}
            label="Conversions"
            value={totalConversions.toLocaleString()}
            color="bg-emerald-50 text-emerald-600"
          />
        </div>

        {/* Per-Variant Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100">
                <th className="text-left py-3 px-3 text-gray-500 font-medium">
                  Variant
                </th>
                <th className="text-right py-3 px-3 text-gray-500 font-medium">
                  Weight
                </th>
                <th className="text-right py-3 px-3 text-gray-500 font-medium">
                  Users
                </th>
                <th className="text-right py-3 px-3 text-gray-500 font-medium">
                  Impressions
                </th>
                <th className="text-right py-3 px-3 text-gray-500 font-medium">
                  Clicks
                </th>
                <th className="text-right py-3 px-3 text-gray-500 font-medium">
                  CTR
                </th>
                <th className="text-right py-3 px-3 text-gray-500 font-medium">
                  Conversions
                </th>
                <th className="text-right py-3 px-3 text-gray-500 font-medium">
                  Conv. Rate
                </th>
              </tr>
            </thead>
            <tbody>
              {variants.map((v, i) => (
                <tr
                  key={v.variantKey}
                  className={`border-b border-gray-50 ${
                    significance?.conversion?.winnerVariant === v.variantKey
                      ? "bg-emerald-50/50"
                      : ""
                  }`}
                >
                  <td className="py-3 px-3">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2.5 h-2.5 rounded-full ${
                          i === 0 ? "bg-blue-500" : "bg-purple-500"
                        }`}
                      />
                      <span className="font-medium text-gray-900">
                        {v.label}
                      </span>
                      {significance?.conversion && (
                        <WinnerBadge
                          variantKey={v.variantKey}
                          winnerVariant={
                            significance.conversion.winnerVariant
                          }
                        />
                      )}
                    </div>
                    <span className="text-xs text-gray-400 font-mono ml-5">
                      {v.variantKey}
                    </span>
                  </td>
                  <td className="text-right py-3 px-3 text-gray-600">
                    {v.weight}%
                  </td>
                  <td className="text-right py-3 px-3 font-semibold text-gray-900">
                    {v.usersAssigned.toLocaleString()}
                  </td>
                  <td className="text-right py-3 px-3 text-gray-600">
                    {v.uniqueImpressions.toLocaleString()}
                  </td>
                  <td className="text-right py-3 px-3 text-gray-600">
                    {v.uniqueClicks.toLocaleString()}
                  </td>
                  <td className="text-right py-3 px-3">
                    <span
                      className={`font-semibold ${
                        v.clickThroughRate > 0
                          ? "text-blue-600"
                          : "text-gray-400"
                      }`}
                    >
                      {v.clickThroughRate}%
                    </span>
                  </td>
                  <td className="text-right py-3 px-3 text-gray-600">
                    {v.conversions.toLocaleString()}
                  </td>
                  <td className="text-right py-3 px-3">
                    <span
                      className={`font-semibold ${
                        v.conversionRate > 0
                          ? "text-emerald-600"
                          : "text-gray-400"
                      }`}
                    >
                      {v.conversionRate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Statistical Significance Section */}
        {significance && (
          <div className="space-y-4">
            <h4 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Statistical Significance (Z-Test)
            </h4>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* CTR Significance */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600">
                    Click-Through Rate
                  </span>
                  <SignificanceBadge sig={significance.clickThrough} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400">Z-Score</span>
                    <p className="font-mono font-semibold text-gray-700">
                      {significance.clickThrough.zScore}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">P-Value</span>
                    <p className="font-mono font-semibold text-gray-700">
                      {significance.clickThrough.pValue}
                    </p>
                  </div>
                  {significance.clickThrough.significant && (
                    <div className="col-span-2">
                      <span className="text-gray-400">Lift</span>
                      <p className="font-semibold text-emerald-600">
                        +{significance.clickThrough.liftPercent}%
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* Conversion Significance */}
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-600">
                    Conversion Rate
                  </span>
                  <SignificanceBadge sig={significance.conversion} />
                </div>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div>
                    <span className="text-gray-400">Z-Score</span>
                    <p className="font-mono font-semibold text-gray-700">
                      {significance.conversion.zScore}
                    </p>
                  </div>
                  <div>
                    <span className="text-gray-400">P-Value</span>
                    <p className="font-mono font-semibold text-gray-700">
                      {significance.conversion.pValue}
                    </p>
                  </div>
                  {significance.conversion.significant && (
                    <div className="col-span-2">
                      <span className="text-gray-400">Lift</span>
                      <p className="font-semibold text-emerald-600">
                        +{significance.conversion.liftPercent}%
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Recommendation */}
            <div
              className={`p-4 rounded-xl border ${
                significance.conversion.significant
                  ? "bg-emerald-50 border-emerald-200"
                  : significance.clickThrough.significant
                  ? "bg-blue-50 border-blue-200"
                  : "bg-amber-50 border-amber-200"
              }`}
            >
              <div className="flex items-start gap-3">
                <Zap
                  className={`h-5 w-5 mt-0.5 flex-shrink-0 ${
                    significance.conversion.significant
                      ? "text-emerald-600"
                      : significance.clickThrough.significant
                      ? "text-blue-600"
                      : "text-amber-600"
                  }`}
                />
                <div>
                  <p
                    className={`text-sm font-semibold ${
                      significance.conversion.significant
                        ? "text-emerald-800"
                        : significance.clickThrough.significant
                        ? "text-blue-800"
                        : "text-amber-800"
                    }`}
                  >
                    {significance.recommendation}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {significance.sampleSizeRecommendation}
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ─── Main Dashboard Page ──────────────────────────────────────────────

export default function ABTestDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, navigate] = useLocation();
  const isAdmin = user?.role === "admin";

  const {
    data: experiments,
    isLoading: experimentsLoading,
    refetch: refetchExperiments,
  } = trpc.abTest.listExperiments.useQuery(undefined, {
    enabled: isAdmin,
  });

  const seedMutation = trpc.abTest.seedAllExperiments.useMutation({
    onSuccess: () => refetchExperiments(),
  });

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8">
        <Skeleton className="h-10 w-64 mb-8" />
        <Skeleton className="h-64" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <Card className="w-full max-w-md">
          <CardHeader>
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-5 w-5 text-orange-500" />
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

  const activeExperiments =
    experiments?.filter((e) => e.isActive).length ?? 0;
  const totalAssignments =
    experiments?.reduce((s, e) => s + e.totalAssignments, 0) ?? 0;
  const totalEvents =
    experiments?.reduce((s, e) => s + e.totalEvents, 0) ?? 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container py-8 max-w-7xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate("/admin")}
              className="h-9"
            >
              <ArrowLeft className="h-4 w-4 mr-1" />
              Admin
            </Button>
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <FlaskConical className="h-8 w-8 text-purple-600" />
                A/B Testing Dashboard
              </h1>
              <p className="text-gray-500 mt-1">
                Monitor experiments, track conversions, and identify winners
              </p>
            </div>
          </div>
          <Button
            onClick={() => seedMutation.mutate()}
            disabled={seedMutation.isPending}
            className="bg-purple-600 hover:bg-purple-700"
          >
            <Sparkles className="h-4 w-4 mr-2" />
            {seedMutation.isPending ? "Seeding..." : "Seed All Experiments"}
          </Button>
        </div>

        {/* Overview Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="w-12 h-12 rounded-xl bg-purple-100 flex items-center justify-center">
                <FlaskConical className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Active Experiments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {experimentsLoading ? (
                    <Skeleton className="h-7 w-8 inline-block" />
                  ) : (
                    `${activeExperiments}/${experiments?.length ?? 0}`
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="w-12 h-12 rounded-xl bg-blue-100 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Assignments</p>
                <p className="text-2xl font-bold text-gray-900">
                  {experimentsLoading ? (
                    <Skeleton className="h-7 w-16 inline-block" />
                  ) : (
                    totalAssignments.toLocaleString()
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="flex items-center gap-4 p-5">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 flex items-center justify-center">
                <BarChart3 className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-gray-500">Total Events Tracked</p>
                <p className="text-2xl font-bold text-gray-900">
                  {experimentsLoading ? (
                    <Skeleton className="h-7 w-16 inline-block" />
                  ) : (
                    totalEvents.toLocaleString()
                  )}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Experiment Cards */}
        {experimentsLoading ? (
          <div className="space-y-6">
            {[1, 2, 3].map((i) => (
              <Card key={i}>
                <CardHeader>
                  <Skeleton className="h-6 w-48" />
                </CardHeader>
                <CardContent>
                  <Skeleton className="h-40" />
                </CardContent>
              </Card>
            ))}
          </div>
        ) : experiments && experiments.length > 0 ? (
          <div className="space-y-6">
            {experiments.map((exp) => (
              <ExperimentCard
                key={exp.key}
                experimentKey={exp.key}
                onToggle={refetchExperiments}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16 text-center">
              <FlaskConical className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-lg font-semibold text-gray-600 mb-2">
                No Experiments Yet
              </h3>
              <p className="text-gray-400 mb-6 max-w-md">
                Click "Seed All Experiments" to create the initial A/B test
                experiments for your upgrade triggers.
              </p>
              <Button
                onClick={() => seedMutation.mutate()}
                disabled={seedMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                Seed Experiments
              </Button>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
