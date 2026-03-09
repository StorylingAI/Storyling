import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Loader2, Copy, Check, Gift, Users, TrendingUp, Calendar, BarChart3, PieChart, Activity, Share2, Twitter, Facebook, Linkedin, Mail, MessageCircle, DollarSign, ArrowLeft, Home, RefreshCw } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart as RechartsPieChart, Pie, Cell } from "recharts";
import { useAuth } from "@/_core/hooks/useAuth";
import { useEffect } from "react";
import { useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { ReferralWelcomeModal } from "@/components/ReferralWelcomeModal";
import { ReferralOnboardingTutorial } from "@/components/ReferralOnboardingTutorial";

export default function Referrals() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [copied, setCopied] = useState(false);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [hasSeenWelcome, setHasSeenWelcome] = useState(() => {
    return localStorage.getItem('referralWelcomeSeen') === 'true';
  });
  const [showOnboardingTutorial, setShowOnboardingTutorial] = useState(false);
  const [hasSeenTutorial, setHasSeenTutorial] = useState(() => {
    return localStorage.getItem('referralTutorialSeen') === 'true';
  });

  // Redirect to login if not authenticated
  useEffect(() => {
    if (user === null) {
      window.location.href = getLoginUrl();
    }
  }, [user]);

  // Don't render anything if not authenticated or still loading
  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-purple-600" />
      </div>
    );
  }

  const [analyticsPeriod, setAnalyticsPeriod] = useState<"7d" | "30d" | "90d" | "1y">("30d");

  const { data: referralCode, isLoading: codeLoading } = trpc.referral.getMyReferralCode.useQuery();

  // Show welcome modal for new referrers
  useEffect(() => {
    if (referralCode && !hasSeenWelcome) {
      setShowWelcomeModal(true);
      localStorage.setItem('referralWelcomeSeen', 'true');
      setHasSeenWelcome(true);
    }
  }, [referralCode, hasSeenWelcome]);

  // Show tutorial after welcome modal is closed
  useEffect(() => {
    if (referralCode && hasSeenWelcome && !hasSeenTutorial && !showWelcomeModal) {
      const timer = setTimeout(() => {
        setShowOnboardingTutorial(true);
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [referralCode, hasSeenWelcome, hasSeenTutorial, showWelcomeModal]);

  const handleTutorialComplete = () => {
    setShowOnboardingTutorial(false);
    localStorage.setItem('referralTutorialSeen', 'true');
    setHasSeenTutorial(true);
  };

  const handleResetTutorial = () => {
    localStorage.removeItem('referralTutorialSeen');
    setHasSeenTutorial(false);
    setShowOnboardingTutorial(true);
  };
  const { data: stats, isLoading: statsLoading } = trpc.referral.getMyReferralStats.useQuery();
  const { data: conversionTrends } = trpc.referralAnalytics.getConversionTrends.useQuery({ period: analyticsPeriod });
  const { data: discountEffectiveness } = trpc.referralAnalytics.getDiscountEffectiveness.useQuery();
  const { data: seasonalTrends } = trpc.referralAnalytics.getSeasonalTrends.useQuery();
  const { data: topReferrers } = trpc.referralAnalytics.getTopReferrers.useQuery({ limit: 5 });
  const { data: milestoneProgress } = trpc.tieredReferralRewards.getMilestoneProgress.useQuery();
  const redeemMutation = trpc.tieredReferralRewards.redeemFreeMonths.useMutation();

  const handleCopyCode = () => {
    if (referralCode?.code) {
      navigator.clipboard.writeText(referralCode.code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCopyLink = () => {
    if (referralCode?.code) {
      const referralLink = `${window.location.origin}/pricing?ref=${referralCode.code}`;
      navigator.clipboard.writeText(referralLink);
    }
  };

  if (!user || user.subscriptionTier !== "premium") {
    return (
      <div className="container max-w-4xl py-12">
        <Card>
          <CardHeader>
            <CardTitle>Premium Feature</CardTitle>
            <CardDescription>
              Referral program is only available to Premium members
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Upgrade to Premium to get your own referral code and earn free months when your friends subscribe!
            </p>
            <Button onClick={() => window.location.href = "/pricing"}>
              Upgrade to Premium
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (codeLoading || statsLoading) {
    return (
      <div className="container max-w-6xl py-12 flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <>
      {referralCode && (
        <>
          <ReferralWelcomeModal
            isOpen={showWelcomeModal}
            onClose={() => setShowWelcomeModal(false)}
            referralCode={referralCode.code}
          />
          {showOnboardingTutorial && (
            <ReferralOnboardingTutorial
              referralCode={referralCode.code}
              onComplete={handleTutorialComplete}
            />
          )}
        </>
      )}
      <div className="container max-w-6xl py-8 space-y-8">
      {/* Breadcrumb Navigation */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => setLocation("/dashboard")}
          className="hover:text-foreground"
        >
          <Home className="h-4 w-4 mr-1" />
          Dashboard
        </Button>
        <span>/</span>
        <span className="text-foreground font-medium">Referral Program</span>
      </div>

      {/* Header */}
      <div className="flex justify-between items-start">
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => setLocation("/dashboard")}
            className="hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-3xl font-bold mb-2">Referral Program</h1>
            <p className="text-muted-foreground">
              Share Storyling AI with friends and earn free Premium months when they subscribe
            </p>
          </div>
        </div>
        <Button onClick={() => setLocation("/payout-management")} variant="outline">
          <DollarSign className="mr-2 h-4 w-4" />
          Manage Payouts
        </Button>
      </div>

      {/* Milestone Progress */}
      {milestoneProgress && (
        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-purple-600" />
              Milestone Rewards
            </CardTitle>
            <CardDescription>
              Earn bonus months by reaching referral milestones!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Successful Referrals</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-purple-600">{milestoneProgress.successfulReferrals}</p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Total Months Earned</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-green-600">{milestoneProgress.totalMonths}</p>
                  <p className="text-xs text-muted-foreground">
                    {milestoneProgress.baseMonths} base + {milestoneProgress.bonusMonths} bonus
                  </p>
                </CardContent>
              </Card>
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm">Available Balance</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-3xl font-bold text-blue-600">{milestoneProgress.currentBalance}</p>
                  {milestoneProgress.currentBalance > 0 && (
                    <Button
                      size="sm"
                      className="mt-2 w-full"
                      onClick={() => {
                        const months = prompt(`How many months would you like to redeem? (Available: ${milestoneProgress.currentBalance})`);
                        if (months && parseInt(months) > 0) {
                          redeemMutation.mutate({ monthsToRedeem: parseInt(months) });
                        }
                      }}
                    >
                      Redeem Months
                    </Button>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Milestone Progress Bars */}
            <div className="space-y-4">
              <h3 className="font-semibold text-lg">Your Milestones</h3>
              {milestoneProgress.milestones.map((milestone) => (
                <div key={milestone.threshold} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {milestone.achieved ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                      )}
                      <span className={`font-medium ${milestone.achieved ? "text-green-600" : "text-muted-foreground"}`}>
                        {milestone.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <span className="text-sm font-bold">
                        {milestone.threshold} referrals
                      </span>
                      <span className="text-xs text-muted-foreground ml-2">
                        +{milestone.bonusMonths} bonus {milestone.bonusMonths === 1 ? "month" : "months"}
                      </span>
                    </div>
                  </div>
                  <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        milestone.achieved ? "bg-green-600" : "bg-purple-600"
                      }`}
                      style={{ width: `${milestone.progress}%` }}
                    />
                  </div>
                  {!milestone.achieved && (
                    <p className="text-xs text-muted-foreground">
                      {milestone.threshold - milestoneProgress.successfulReferrals} more referrals to unlock
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* Next Milestone */}
            {milestoneProgress.nextMilestone && (
              <Card className="bg-white/50">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <Gift className="h-8 w-8 text-purple-600" />
                    <div>
                      <p className="font-semibold">Next Milestone: {milestoneProgress.nextMilestone.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {milestoneProgress.nextMilestone.threshold - milestoneProgress.successfulReferrals} more referrals to earn{" "}
                        {milestoneProgress.nextMilestone.bonusMonths} bonus months!
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </CardContent>
        </Card>
      )}

      {/* How it Works */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5 text-primary" />
            How It Works
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                1
              </div>
              <h3 className="font-semibold">Share Your Code</h3>
              <p className="text-sm text-muted-foreground">
                Share your unique referral code or link with friends
              </p>
            </div>
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                2
              </div>
              <h3 className="font-semibold">They Get 20% Off</h3>
              <p className="text-sm text-muted-foreground">
                Your friends save 20% on their first Premium subscription
              </p>
            </div>
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                3
              </div>
              <h3 className="font-semibold">You Earn Free Months</h3>
              <p className="text-sm text-muted-foreground">
                Get 1 free month of Premium for each successful referral
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Referral Code Card */}
      <Card data-tutorial="referral-code">
        <CardHeader>
          <CardTitle>Your Referral Code</CardTitle>
          <CardDescription>
            Share this code with friends to give them 20% off their first month
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              value={referralCode?.code || ""}
              readOnly
              className="font-mono text-lg font-bold"
            />
            <Button onClick={handleCopyCode} variant="outline" size="icon">
              {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
          <Button onClick={handleCopyLink} variant="secondary" className="w-full">
            Copy Referral Link
          </Button>

          {/* Social Sharing Buttons */}
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-3">Share on Social Media</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2" data-tutorial="share-buttons">
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  const text = `🎓 I'm loving Storyling AI for language learning! Get 20% off your first month with my code: ${referralCode?.code} 🚀`;
                  const url = `${window.location.origin}/pricing?ref=${referralCode?.code}`;
                  window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
                }}
              >
                <Twitter className="h-4 w-4" />
                Twitter
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  const url = `${window.location.origin}/pricing?ref=${referralCode?.code}`;
                  window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
                }}
              >
                <Facebook className="h-4 w-4" />
                Facebook
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  const text = `I've been using Storyling AI to learn languages through AI-generated stories and it's amazing! Get 20% off with code ${referralCode?.code}`;
                  const url = `${window.location.origin}/pricing?ref=${referralCode?.code}`;
                  window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}&summary=${encodeURIComponent(text)}`, '_blank');
                }}
              >
                <Linkedin className="h-4 w-4" />
                LinkedIn
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="gap-2"
                onClick={() => {
                  const subject = 'Check out Storyling AI - 20% off!';
                  const body = `Hey!\n\nI've been using Storyling AI to learn languages and it's been incredible. You can create personalized stories, practice vocabulary, and track your progress all in one place.\n\nUse my referral code ${referralCode?.code} to get 20% off your first month: ${window.location.origin}/pricing?ref=${referralCode?.code}\n\nHappy learning!`;
                  window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                }}
              >
                <Mail className="h-4 w-4" />
                Email
              </Button>
            </div>
          </div>

          {/* Pre-written Messages */}
          <div className="pt-4 border-t">
            <p className="text-sm font-medium mb-3">Copy & Paste Messages</p>
            <div className="space-y-3">
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs font-medium text-muted-foreground mb-1">Short Message</p>
                <p className="text-sm mb-2">
                  🎓 Learn languages with AI-generated stories! Get 20% off with code {referralCode?.code} → {window.location.origin}/pricing?ref={referralCode?.code}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(`🎓 Learn languages with AI-generated stories! Get 20% off with code ${referralCode?.code} → ${window.location.origin}/pricing?ref=${referralCode?.code}`);
                  }}
                >
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
              </div>
              <div className="p-3 bg-muted rounded-lg">
                <p className="text-xs font-medium text-muted-foreground mb-1">Detailed Message</p>
                <p className="text-sm mb-2">
                  I've been using Storyling AI to learn languages and it's amazing! 🚀 You can create personalized stories in any language, practice with interactive quizzes, and track your progress. Use my code {referralCode?.code} for 20% off your first month: {window.location.origin}/pricing?ref={referralCode?.code}
                </p>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    navigator.clipboard.writeText(`I've been using Storyling AI to learn languages and it's amazing! 🚀 You can create personalized stories in any language, practice with interactive quizzes, and track your progress. Use my code ${referralCode?.code} for 20% off your first month: ${window.location.origin}/pricing?ref=${referralCode?.code}`);
                  }}
                >
                  <Copy className="h-3 w-3 mr-1" /> Copy
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid md:grid-cols-4 gap-4" data-tutorial="earnings-stats">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Referrals
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats?.totalReferrals || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Successful Conversions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-green-600" />
              <span className="text-2xl font-bold">{stats?.successfulConversions || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Pending Rewards
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-yellow-600" />
              <span className="text-2xl font-bold">{stats?.pendingRewards || 0}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Free Months Available
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Gift className="h-4 w-4 text-primary" />
              <span className="text-2xl font-bold">{stats?.monthsAvailable || 0}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Analytics Dashboard */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-primary" />
                Referral Analytics
              </CardTitle>
              <CardDescription>
                Track your referral performance and optimize your strategy
              </CardDescription>
            </div>
            <Select value={analyticsPeriod} onValueChange={(v) => setAnalyticsPeriod(v as any)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="trends" className="space-y-4">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="trends">Conversion Trends</TabsTrigger>
              <TabsTrigger value="discounts">Discount Analysis</TabsTrigger>
              <TabsTrigger value="seasonal">Seasonal Patterns</TabsTrigger>
            </TabsList>

            <TabsContent value="trends" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Total Conversions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{conversionTrends?.totalConversions || 0}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-sm">Conversion Rate</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-3xl font-bold">{conversionTrends?.conversionRate || 0}%</p>
                  </CardContent>
                </Card>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={conversionTrends?.trends || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="conversions" stroke="#8b5cf6" name="Total Conversions" />
                    <Line type="monotone" dataKey="successful" stroke="#10b981" name="Successful" />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            <TabsContent value="discounts" className="space-y-4">
              <div className="mb-4">
                <p className="text-sm text-muted-foreground">
                  Current discount: <span className="font-bold text-primary">{discountEffectiveness?.currentDiscount || 20}%</span>
                </p>
              </div>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={discountEffectiveness?.discountAnalysis || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="discountPercent" label={{ value: "Discount %", position: "insideBottom", offset: -5 }} />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="totalUses" fill="#8b5cf6" name="Total Uses" />
                    <Bar dataKey="successfulConversions" fill="#10b981" name="Successful" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="grid md:grid-cols-3 gap-4">
                {discountEffectiveness?.discountAnalysis.map((discount) => (
                  <Card key={discount.discountPercent}>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-sm">{discount.discountPercent}% Discount</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-2xl font-bold">{discount.conversionRate}%</p>
                      <p className="text-xs text-muted-foreground">
                        {discount.successfulConversions}/{discount.totalUses} conversions
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="seasonal" className="space-y-4">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <h3 className="font-semibold mb-4">Monthly Trends</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={seasonalTrends?.monthlyTrends || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="month" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Line type="monotone" dataKey="conversions" stroke="#8b5cf6" name="Conversions" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div>
                  <h3 className="font-semibold mb-4">Day of Week Distribution</h3>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={seasonalTrends?.weekdayTrends || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="day" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="conversions" fill="#8b5cf6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Top Referrers Leaderboard */}
      {topReferrers && topReferrers.topReferrers.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Top Referrers
            </CardTitle>
            <CardDescription>
              See how you compare to other top referrers
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topReferrers.topReferrers.map((referrer) => (
                <div
                  key={referrer.rank}
                  className={`flex items-center justify-between p-4 border rounded-lg ${
                    referrer.isCurrentUser ? "bg-primary/5 border-primary" : ""
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">
                      #{referrer.rank}
                    </div>
                    <div>
                      <p className="font-medium">
                        {referrer.isCurrentUser ? "You" : `Referrer #${referrer.rank}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {referrer.successfulConversions} successful conversions
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">{referrer.conversionRate}%</p>
                    <p className="text-xs text-muted-foreground">conversion rate</p>
                  </div>
                </div>
              ))}
            </div>
            {topReferrers.currentUserRank && topReferrers.currentUserRank > 5 && (
              <div className="mt-4 p-4 bg-muted rounded-lg text-center">
                <p className="text-sm text-muted-foreground">
                  Your rank: <span className="font-bold">#{topReferrers.currentUserRank}</span> out of{" "}
                  {topReferrers.totalReferrers} referrers
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Recent Referrals */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Referrals</CardTitle>
              <CardDescription>
                Track your referral activity and rewards
              </CardDescription>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleResetTutorial}
              className="flex items-center gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Show Tutorial Again
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {stats?.recentReferrals && stats.recentReferrals.length > 0 ? (
            <div className="space-y-4">
              {stats.recentReferrals.map((referral) => (
                <div
                  key={referral.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{referral.referredUserName}</p>
                    <p className="text-sm text-muted-foreground">
                      {referral.referredUserEmail}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(referral.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right space-y-1">
                    <Badge
                      variant={
                        referral.rewardStatus === "applied"
                          ? "default"
                          : referral.rewardStatus === "pending"
                          ? "secondary"
                          : "outline"
                      }
                    >
                      {referral.rewardStatus === "applied"
                        ? "Reward Applied"
                        : referral.rewardStatus === "pending"
                        ? "Pending"
                        : "Expired"}
                    </Badge>
                    <p className="text-sm text-muted-foreground">
                      {referral.discountApplied}% discount applied
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No referrals yet</p>
              <p className="text-sm">Start sharing your code to earn rewards!</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
    </>
  );
}
