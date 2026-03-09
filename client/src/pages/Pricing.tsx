import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_TITLE, APP_LOGO, getLoginUrl, getSignUpUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { Check, Sparkles, Users, Building2, Zap } from "lucide-react";
import { Footer } from "@/components/Footer";
import { useScrollToTop } from "@/hooks/useScrollToTop";

export default function Pricing() {
  useScrollToTop();
  const [, setLocation] = useLocation();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const [referralCode, setReferralCode] = useState("");
  const { user } = useAuth();

  // Check for referral code in URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const refCode = params.get("ref");
    if (refCode) {
      setReferralCode(refCode);
    }
  }, []);

  const createCheckout = trpc.checkout.createPremiumCheckout.useMutation({
    onSuccess: (data) => {
      // Redirect to Stripe checkout
      window.location.href = data.checkoutUrl;
    },
    onError: (error) => {
      toast.error(error.message || "Failed to create checkout session");
    },
  });

  const validateReferral = trpc.referral.validateReferralCode.useQuery(
    { code: referralCode },
    { enabled: referralCode.length > 0 }
  );

  // Handle post-login checkout redirect
  useEffect(() => {
    if (user) {
      const params = new URLSearchParams(window.location.search);
      const shouldUpgrade = params.get("upgrade");
      const period = params.get("period") as "monthly" | "annual" | null;
      
      if (shouldUpgrade === "true" && period) {
        // Clear URL params
        window.history.replaceState({}, "", "/pricing");
        // Trigger checkout
        createCheckout.mutate({ billingPeriod: period });
      }
    }
  }, [user]);

  const plans = [
    {
      name: "Free",
      description: "Perfect for individual learners getting started",
      price: { monthly: 0, annual: 0 },
      icon: Sparkles,
      features: [
        "5 stories per month",
        "Podcast format only",
        "Basic vocabulary tracking",
        "Quiz mode with instant feedback",
        "Progress dashboard",
        "Community support",
      ],
      cta: "Start Learning Free",
      ctaVariant: "outline" as const,
      popular: false,
      audience: "individual",
    },
    {
      name: "Premium",
      description: "Unlock unlimited learning potential",
      price: { monthly: 9.99, annual: 99 },
      icon: Zap,
      features: [
        "Unlimited stories",
        "Podcast + Film formats",
        "Advanced vocabulary mastery",
        "Spaced repetition system",
        "Detailed analytics & insights",
        "Priority support",
        "Export progress reports",
        "Custom themes & voices",
      ],
      cta: "Upgrade to Premium",
      ctaVariant: "default" as const,
      popular: true,
      audience: "individual",
    },
    {
      name: "School Plan",
      description: "For language schools & universities",
      price: { monthly: "Custom", annual: "Custom" },
      priceDetail: "$5-10 per student/month",
      icon: Users,
      features: [
        "Everything in Premium",
        "Class management dashboard",
        "Bulk student enrollment",
        "Assignment creation & tracking",
        "Student progress analytics",
        "Dedicated account manager",
        "Teacher training & onboarding",
        "Minimum 20 students",
      ],
      cta: "Contact Sales",
      ctaVariant: "default" as const,
      popular: false,
      audience: "school",
    },
    {
      name: "Enterprise",
      description: "Custom solutions for large organizations",
      price: { monthly: "Custom", annual: "Custom" },
      priceDetail: "Volume pricing available",
      icon: Building2,
      features: [
        "Everything in School Plan",
        "White-label branding",
        "Custom domain & SSO",
        "API access & integrations",
        "Advanced security & compliance",
        "Custom content library",
        "Dedicated infrastructure",
        "24/7 premium support",
      ],
      cta: "Contact Sales",
      ctaVariant: "default" as const,
      popular: false,
      audience: "enterprise",
    },
  ];

  const handleCTA = (plan: typeof plans[0]) => {
    if (plan.name === "Free") {
      window.location.href = getSignUpUrl();
    } else if (plan.name === "Premium") {
      if (!user) {
        // Not logged in - redirect to login with return URL
        const returnUrl = encodeURIComponent(`/pricing?upgrade=true&period=${billingPeriod}`);
        window.location.href = `${getLoginUrl()}&return_to=${returnUrl}`;
      } else {
        // Logged in - create checkout session with optional referral code
        createCheckout.mutate({ 
          billingPeriod,
          referralCode: referralCode || undefined 
        });
      }
    } else {
      // Contact sales - redirect to contact form
      setLocation("/contact");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-teal-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b shadow-sm sticky top-0 z-40">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setLocation("/")}>
            <img src={APP_LOGO} alt="Flip" className="h-10 w-10" />
            <h1 className="text-2xl font-bold gradient-text-primary hidden sm:block">{APP_TITLE}</h1>
          </div>
          <Button
            variant="outline"
            onClick={() => window.location.href = getLoginUrl()}
            className="rounded-full hover-lift active-scale"
          >
            Sign In
          </Button>
        </div>
      </header>

      <div className="container py-16 space-y-16">
        {/* Hero Section */}
        <div className="text-center space-y-6 max-w-3xl mx-auto animate-fade-in">
          <Badge className="bg-gradient-to-r from-purple-500 to-teal-500 text-white border-0">
            Simple, Transparent Pricing
          </Badge>
          <h1 className="text-5xl md:text-6xl font-bold">
            Choose Your Learning Plan
          </h1>
          <p className="text-xl text-muted-foreground">
            Whether you're an individual learner or an educational institution, we have the perfect plan for you.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-4 pt-4">
            <button
              onClick={() => setBillingPeriod("monthly")}
              className={`px-4 py-2 rounded-full transition-all ${
                billingPeriod === "monthly"
                  ? "bg-gradient-to-r from-purple-500 to-teal-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBillingPeriod("annual")}
              className={`px-4 py-2 rounded-full transition-all ${
                billingPeriod === "annual"
                  ? "bg-gradient-to-r from-purple-500 to-teal-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              Annual
              <Badge className="ml-2 bg-green-500 text-white border-0">Save 17%</Badge>
            </button>
          </div>
        </div>

        {/* Referral Code Input */}
        {!user && (
          <div className="max-w-md mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Have a Referral Code?</CardTitle>
                <CardDescription>
                  Enter your code to get 20% off your first Premium subscription
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Enter referral code"
                    value={referralCode}
                    onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                    className="flex-1 px-3 py-2 border rounded-md"
                  />
                </div>
                {validateReferral.data?.valid && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <Check className="h-4 w-4" />
                    Valid code! You'll save {validateReferral.data.discountPercent}% on your first month
                  </div>
                )}
                {validateReferral.data && !validateReferral.data.valid && (
                  <div className="text-sm text-red-600">
                    {validateReferral.data.message}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {plans.map((plan, index) => {
            const Icon = plan.icon;
            const price = typeof plan.price[billingPeriod] === "number" 
              ? plan.price[billingPeriod] 
              : plan.price[billingPeriod];

            return (
              <Card
                key={plan.name}
                className={`relative hover-lift transition-all animate-slide-up ${
                  plan.popular ? "border-2 border-purple-500 shadow-xl" : ""
                }`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                    <Badge className="bg-gradient-to-r from-purple-500 to-teal-500 text-white border-0 px-4 py-1">
                      Most Popular
                    </Badge>
                  </div>
                )}

                <CardHeader className="space-y-4">
                  <div className="flex items-center gap-3">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-purple-100 to-teal-100">
                      <Icon className="h-6 w-6 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-2xl">{plan.name}</CardTitle>
                      <CardDescription className="text-sm">{plan.description}</CardDescription>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      {typeof price === "number" ? (
                        <>
                          <span className="text-4xl font-bold">${price}</span>
                          <span className="text-muted-foreground">
                            /{billingPeriod === "monthly" ? "mo" : "yr"}
                          </span>
                        </>
                      ) : (
                        <span className="text-4xl font-bold">{price}</span>
                      )}
                    </div>
                    {plan.priceDetail && (
                      <p className="text-sm text-muted-foreground">{plan.priceDetail}</p>
                    )}
                  </div>
                </CardHeader>

                <CardContent className="space-y-6">
                  <Button
                    className={`w-full rounded-full ${
                      plan.popular
                        ? "bg-gradient-to-r from-purple-500 to-teal-500 hover:opacity-90 text-white border-0"
                        : ""
                    }`}
                    variant={plan.ctaVariant}
                    onClick={() => handleCTA(plan)}
                  >
                    {plan.cta}
                  </Button>

                  <div className="space-y-3">
                    {plan.features.map((feature) => (
                      <div key={feature} className="flex items-start gap-2">
                        <Check className="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{feature}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto space-y-8 pt-8">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
            <p className="text-muted-foreground">Have questions? We're here to help.</p>
          </div>

          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Can I switch plans at any time?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! You can upgrade or downgrade your plan at any time. Changes take effect immediately, and we'll prorate any charges.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">What payment methods do you accept?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  We accept all major credit cards (Visa, Mastercard, American Express) and PayPal. Enterprise customers can arrange invoicing.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Is there a minimum commitment for School Plans?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  School Plans require a minimum of 20 students and typically involve a semester or annual commitment. Contact our sales team for flexible options.
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Do you offer discounts for non-profits?</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Yes! We offer special pricing for non-profit organizations and educational institutions. Contact our sales team to learn more.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-purple-500 to-teal-500 rounded-3xl p-12 text-center text-white space-y-6">
          <h2 className="text-4xl font-bold">Ready to Transform Your Language Learning?</h2>
          <p className="text-xl opacity-90 max-w-2xl mx-auto">
            Join thousands of learners and educators who are already using Storyling.ai to make language learning immersive and engaging.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <Button
              size="lg"
              variant="secondary"
              onClick={() => window.location.href = getSignUpUrl()}
              className="rounded-full px-8"
            >
              Start Free Trial
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => setLocation("/contact")}
              className="rounded-full px-8 bg-white/10 border-white text-white hover:bg-white/20"
            >
              Talk to Sales
            </Button>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
}
