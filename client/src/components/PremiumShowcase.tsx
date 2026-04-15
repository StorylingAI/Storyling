import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Crown, Sparkles, Film, TrendingUp, Zap, CheckCircle2 } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";

export function PremiumShowcase() {
  const [, setLocation] = useLocation();
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const { data: subscription } = trpc.subscription.getMySubscription.useQuery();
  const { data: usage } = trpc.subscription.getUsageStats.useQuery({ timezone });

  // Don't show to Premium users
  if (subscription?.isPremium) {
    return null;
  }

  const features = [
    {
      icon: Zap,
      title: "Unlimited Stories",
      description: "Create as many stories as you want, no monthly limits",
      highlight: usage ? `Currently: ${usage.storiesToday}/${usage.storiesLimit ?? '∞'} used today` : null,
    },
    {
      icon: Film,
      title: "Film Format",
      description: "AI-generated videos with subtitles and background music",
      highlight: "Free users: Podcast only",
    },
    {
      icon: TrendingUp,
      title: "Advanced Analytics",
      description: "Detailed insights into your learning progress and vocabulary mastery",
      highlight: "Track your growth",
    },
    {
      icon: Sparkles,
      title: "Priority Support",
      description: "Get help faster with dedicated premium support",
      highlight: "24/7 assistance",
    },
  ];

  const handleUpgrade = () => {
    setLocation("/pricing");
  };

  return (
    <Card className="border-2 border-amber-200 dark:border-amber-800 bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-950/20 dark:to-orange-950/20">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-amber-500 to-orange-500 rounded-lg">
              <Crown className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="flex items-center gap-2">
                Unlock Premium Features
                <Badge className="bg-gradient-to-r from-amber-500 to-orange-500">
                  Limited Time Offer
                </Badge>
              </CardTitle>
              <CardDescription>
                Take your language learning to the next level
              </CardDescription>
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {features.map((feature, index) => (
            <div
              key={index}
              className="flex items-start gap-3 p-4 bg-white dark:bg-gray-900 rounded-lg border border-amber-100 dark:border-amber-900"
            >
              <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                <feature.icon className="h-5 w-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="font-semibold text-sm mb-1">{feature.title}</h4>
                <p className="text-sm text-muted-foreground mb-1">
                  {feature.description}
                </p>
                {feature.highlight && (
                  <p className="text-xs text-amber-600 dark:text-amber-400 font-medium">
                    {feature.highlight}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* What You Get */}
        <div className="bg-white dark:bg-gray-900 rounded-lg p-4 border border-amber-100 dark:border-amber-900">
          <h4 className="font-semibold mb-3 flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-green-500" />
            Everything in Premium
          </h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>Unlimited story generation every month</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>Access to both Podcast and Film formats</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>Advanced vocabulary mastery tracking</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>Detailed learning analytics and insights</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>Priority customer support</span>
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-green-500 flex-shrink-0" />
              <span>Export progress reports (PDF/CSV)</span>
            </li>
          </ul>
        </div>

        {/* Pricing Highlight */}
        <div className="flex items-center justify-between p-4 bg-gradient-to-r from-amber-500 to-orange-500 rounded-lg text-white">
          <div>
            <p className="text-sm opacity-90">Starting at</p>
            <p className="text-2xl font-bold">$5.75/month</p>
            <p className="text-xs opacity-90">or save 42% with annual billing ($69/year)</p>
          </div>
          <Button
            size="lg"
            onClick={handleUpgrade}
            className="bg-white text-amber-600 hover:bg-gray-100"
          >
            <Crown className="h-4 w-4 mr-2" />
            Upgrade Now
          </Button>
        </div>

        {/* Social Proof */}
        <div className="text-center">
          <p className="text-sm text-muted-foreground">
            Join <span className="font-semibold text-amber-600 dark:text-amber-400">5,000+ Premium learners</span> who are mastering languages faster
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
