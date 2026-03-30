import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { APP_TITLE, APP_LOGO, getLoginUrl, getSignUpUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";
import { Check, Sparkles, Lock, ChevronDown, HelpCircle, ArrowRight, Star, Shield, GraduationCap, Building2, Users, Zap } from "lucide-react";
import { useScrollToTop } from "@/hooks/useScrollToTop";
import { PREMIUM_PRICING, FREE_TIER_LIMITS, SCHOOL_PRICING } from "../../../shared/freemiumLimits";

export default function Pricing() {
  useScrollToTop();
  const [, setLocation] = useLocation();
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("annual");
  const [referralCode, setReferralCode] = useState("");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const { user } = useAuth();
  const [showStickyBar, setShowStickyBar] = useState(false);
  const premiumCardRef = useRef<HTMLDivElement>(null);

  // Scroll detection for sticky CTA bar
  useEffect(() => {
    const handleScroll = () => {
      if (premiumCardRef.current) {
        const rect = premiumCardRef.current.getBoundingClientRect();
        setShowStickyBar(rect.bottom < 0);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

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
      toast.info("Redirecting to checkout...");
      window.location.href = data.checkoutUrl;
    },
    onError: (error) => {
      if (error.message?.includes("already have")) {
        toast.info("You already have an active subscription!");
      } else {
        toast.error(error.message || "Failed to create checkout session");
      }
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
        window.history.replaceState({}, "", "/pricing");
        createCheckout.mutate({ billingPeriod: period });
      }
    }
  }, [user]);

  const handleCheckout = () => {
    if (!user) {
      const returnUrl = encodeURIComponent(`/pricing?upgrade=true&period=${billingPeriod}`);
      const loginUrl = getLoginUrl();
      const separator = loginUrl.includes('?') ? '&' : '?';
      window.location.href = `${loginUrl}${separator}return_to=${returnUrl}`;
    } else {
      createCheckout.mutate({
        billingPeriod,
        referralCode: referralCode || undefined,
      });
    }
  };

  const faqs = [
    { q: "How does the 7-day free trial work?", a: "Start your Premium trial with full access — no charge for 7 days. Cancel anytime before the trial ends and you won't be billed. After the trial, your selected plan begins automatically.", icon: "⏱️" },
    { q: "Can I switch between monthly and annual?", a: "Yes! You can switch at any time. If you upgrade from monthly to annual, we'll prorate the difference. Changes take effect immediately.", icon: "🔄" },
    { q: "What payment methods do you accept?", a: "We accept all major credit cards (Visa, Mastercard, American Express) through our secure Stripe payment processing.", icon: "💳" },
    { q: "Is there a money-back guarantee?", a: "Absolutely! If you're not satisfied within 30 days, we'll refund your subscription — no questions asked.", icon: "🛡️" },
    { q: "What languages are supported?", a: "We support 19 languages including Spanish, French, German, Chinese, Japanese, Arabic, Korean, and many more. New languages added regularly.", icon: "🌍" },
    { q: "Do you offer school or enterprise plans?", a: "Yes! School plans range from $3–$8/seat/month (billed annually) depending on volume — with teacher dashboards, class management, and bulk enrollment. Enterprise plans include SSO, custom branding, and dedicated support. Scroll down or contact us for details.", icon: "🏫" },
  ];

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg, #FAF5FF 0%, #FFFFFF 30%, #F5F3FF08 60%, #FFFFFF 100%)" }}>
      {/* Sticky Free-to-Join Bar */}
      <div
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${showStickyBar ? "translate-y-0 opacity-100" : "-translate-y-full opacity-0"}`}
        style={{ background: "linear-gradient(135deg, #7C3AED 0%, #4F46E5 50%, #2563EB 100%)" }}
      >
        <div className="container flex items-center justify-between h-14 gap-4">
          <div className="flex items-center gap-3">
            <Sparkles className="h-4 w-4 text-yellow-300" />
            <span className="text-white text-sm font-medium" style={{ fontFamily: "Fredoka, sans-serif" }}>
              Start your 7-day free trial — full access, no charge
            </span>
          </div>
          <div className="flex items-center gap-3">
            <Button
              size="sm"
              onClick={handleCheckout}
              className="rounded-full bg-white text-purple-700 hover:bg-white/90 hover:scale-[1.02] font-bold shadow-lg border-0 transition-all duration-200 text-sm px-5 h-9"
              style={{ fontFamily: "Fredoka, sans-serif" }}
            >
              Try Premium Free
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b shadow-sm sticky top-0 z-40">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setLocation("/")}>
            <img src={APP_LOGO} alt={APP_TITLE} className="h-10 w-10" />
            <h1 className="text-2xl font-bold text-purple-700 hidden sm:block" style={{ fontFamily: "Fredoka, sans-serif" }}>{APP_TITLE}</h1>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" onClick={() => setLocation("/")} className="rounded-full" style={{ fontFamily: "Fredoka, sans-serif" }}>
              Home
            </Button>
            {user ? (
              <Button onClick={() => setLocation("/app")} className="rounded-full bg-purple-600 hover:bg-purple-700 text-white" style={{ fontFamily: "Fredoka, sans-serif" }}>
                Dashboard
              </Button>
            ) : (
              <Button onClick={() => window.location.href = getLoginUrl()} className="rounded-full bg-purple-600 hover:bg-purple-700 text-white" style={{ fontFamily: "Fredoka, sans-serif" }}>
                Sign In
              </Button>
            )}
          </div>
        </div>
      </header>

      <div className="container py-16 space-y-20 relative">
        {/* Sparkle decorations */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
          <div className="absolute top-[3%] left-[4%] text-purple-400/40 text-base" style={{ animation: "twinkle 3s ease-in-out infinite" }}>{"\u2726"}</div>
          <div className="absolute top-[5%] right-[5%] text-purple-300/35 text-sm" style={{ animation: "twinkle 4s ease-in-out infinite", animationDelay: "1s" }}>{"\u2726"}</div>
          <div className="absolute top-[20%] left-[2%] text-purple-300/25 text-xs" style={{ animation: "twinkle 3.5s ease-in-out infinite", animationDelay: "0.5s" }}>{"\u2726"}</div>
          <div className="absolute top-[40%] right-[3%] text-purple-400/30 text-base" style={{ animation: "twinkle 5s ease-in-out infinite", animationDelay: "2s" }}>{"\u2726"}</div>
        </div>

        {/* Hero Section */}
        <div className="text-center space-y-6 max-w-3xl mx-auto relative z-10">
          <Badge className="rounded-full px-5 py-2.5 bg-purple-600 text-white border-0 shadow-lg" style={{ fontFamily: "Fredoka, sans-serif" }}>
            <Sparkles className="inline h-4 w-4 mr-2" />
            Simple, Transparent Pricing
          </Badge>
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900" style={{ fontFamily: "Fredoka, sans-serif" }}>
            <span className="text-purple-400" style={{ animation: "twinkle 3s ease-in-out infinite" }}>{"\u2728"}</span>
            {" "}Invest in Your Fluency{" "}
            <span className="text-purple-400" style={{ animation: "twinkle 3s ease-in-out infinite", animationDelay: "1.5s" }}>{"\u2728"}</span>
          </h1>
          <p className="text-lg text-gray-500 max-w-xl mx-auto" style={{ fontFamily: "Outfit, sans-serif" }}>
            Join free. Upgrade when you're ready. Cancel anytime.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center gap-3 pt-4">
            <span className={`text-sm font-medium ${billingPeriod === "monthly" ? "text-gray-900" : "text-gray-400"}`} style={{ fontFamily: "Fredoka, sans-serif" }}>Monthly</span>
            <button
              onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "annual" : "monthly")}
              className={`relative w-14 h-7 rounded-full transition-colors ${billingPeriod === "annual" ? "bg-purple-600" : "bg-gray-300"}`}
            >
              <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${billingPeriod === "annual" ? "translate-x-7" : "translate-x-0.5"}`} />
            </button>
            <span className={`text-sm font-medium ${billingPeriod === "annual" ? "text-gray-900" : "text-gray-400"}`} style={{ fontFamily: "Fredoka, sans-serif" }}>
              Annual
            </span>
            <Badge className="bg-green-100 text-green-700 border-0 text-xs font-bold" style={{ fontFamily: "Fredoka, sans-serif" }}>Save {PREMIUM_PRICING.annualSavingsPercent}%</Badge>
          </div>
        </div>

        {/* Referral Code */}
        {!user && referralCode && (
          <div className="max-w-md mx-auto relative z-10">
            <div className="rounded-2xl bg-white/80 backdrop-blur-sm border-2 border-purple-100 p-5 space-y-3">
              <h3 className="font-bold text-gray-900" style={{ fontFamily: "Fredoka, sans-serif" }}>Referral Code Applied</h3>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Enter referral code"
                  value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  className="flex-1 px-3 py-2 border rounded-xl text-sm"
                  style={{ fontFamily: "Outfit, sans-serif" }}
                />
              </div>
              {validateReferral.data?.valid && (
                <div className="flex items-center gap-2 text-sm text-green-600">
                  <Check className="h-4 w-4" />
                  <span style={{ fontFamily: "Outfit, sans-serif" }}>Valid referral code applied!</span>
                </div>
              )}
              {validateReferral.data && !validateReferral.data.valid && (
                <div className="text-sm text-red-600" style={{ fontFamily: "Outfit, sans-serif" }}>
                  {validateReferral.data.message}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== 2-TIER PRICING CARDS (Free vs Premium) ===== */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch relative z-10">
          {/* Free Card */}
          <div>
            <div className="rounded-3xl bg-white border-2 border-purple-200 p-8 md:p-10 flex flex-col h-full hover:-translate-y-1 transition-all">
              <h3 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: "Fredoka, sans-serif" }}>Free</h3>
              <div className="flex items-baseline gap-1 mb-2">
                <span className="text-4xl font-bold text-gray-900" style={{ fontFamily: "Fredoka, sans-serif" }}>$0</span>
                <span className="text-gray-500 text-sm" style={{ fontFamily: "Outfit, sans-serif" }}>/ forever</span>
              </div>
              <p className="text-sm text-gray-600 mb-8" style={{ fontFamily: "Outfit, sans-serif" }}>Start learning through immersive stories.</p>

              <ul className="space-y-4 mb-10 flex-1">
                {[
                  `${FREE_TIER_LIMITS.bonusStarterStories} starter stories`,
                  `${FREE_TIER_LIMITS.storiesPerDay} story per day`,
                  "All levels A1\u2013C2",
                  `${FREE_TIER_LIMITS.dictionaryLookupsPerDay} dictionary lookups per day`,
                  `Save ${FREE_TIER_LIMITS.vocabSavesPerDay} vocabulary words per day`,
                  "Standard audio playback",
                  "Online reading only",
                ].map((f, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm text-gray-700" style={{ fontFamily: "Outfit, sans-serif" }}>
                    <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-purple-600" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                className="w-full rounded-full bg-purple-600 text-white hover:bg-purple-700 hover:scale-[1.02] font-bold transition-all duration-300 py-3 text-base shadow-lg"
                onClick={() => window.location.href = getSignUpUrl()}
                style={{ fontFamily: "Fredoka, sans-serif" }}
              >
                Start Reading
              </Button>
              <p className="text-xs text-gray-400 text-center mt-3" style={{ fontFamily: "Outfit, sans-serif" }}>No credit card required</p>
            </div>
          </div>

          {/* Premium Card — Highlighted */}
          <div ref={premiumCardRef}>
            <div className="relative rounded-3xl overflow-hidden shadow-2xl hover:-translate-y-1 transition-all h-full" style={{ background: "linear-gradient(135deg, #7C3AED 0%, #4F46E5 50%, #2563EB 100%)" }}>
              <div className="absolute top-4 right-4">
                <Badge className="rounded-full px-3 py-1 bg-yellow-400 text-yellow-900 border-0 font-bold text-xs" style={{ fontFamily: "Fredoka, sans-serif" }}>
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  MOST POPULAR
                </Badge>
              </div>

              <div className="p-8 md:p-10 flex flex-col h-full">
                <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "Fredoka, sans-serif" }}>Premium</h3>
                <p className="text-sm text-white/80 mb-6" style={{ fontFamily: "Outfit, sans-serif" }}>
                  Unlock the full Storyling experience.
                </p>

                <div className="mb-8">
                  <div className="flex items-baseline gap-2">
                    <span className="text-4xl font-bold text-white" style={{ fontFamily: "Fredoka, sans-serif" }}>
                      {billingPeriod === "annual" ? `$${PREMIUM_PRICING.annualPerMonth}` : `$${PREMIUM_PRICING.monthly}`}
                    </span>
                    <span className="text-white/70 text-sm" style={{ fontFamily: "Outfit, sans-serif" }}>/ month</span>
                  </div>
                  {billingPeriod === "annual" && (
                    <p className="text-white/50 text-xs mt-1" style={{ fontFamily: "Outfit, sans-serif" }}>Billed annually (${PREMIUM_PRICING.annual}/year)</p>
                  )}
                  {billingPeriod === "monthly" && (
                    <p className="text-white/50 text-xs mt-1" style={{ fontFamily: "Outfit, sans-serif" }}>
                      Switch to annual for just ${PREMIUM_PRICING.annualPerMonth}/mo
                    </p>
                  )}
                </div>

                <ul className="space-y-4 flex-1 mb-10">
                  {[
                    "Unlimited stories",
                    "Unlimited dictionary lookups",
                    "Unlimited vocabulary saving",
                    "Offline reading",
                    "Audio speed control",
                    "Advanced comprehension tools",
                    "Faster learning progress",
                  ].map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm text-white" style={{ fontFamily: "Outfit, sans-serif" }}>
                      <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-yellow-300" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full rounded-full bg-white text-purple-700 hover:bg-white/90 hover:scale-[1.02] hover:shadow-2xl font-bold shadow-xl border-0 transition-all duration-300 text-base py-3"
                  onClick={handleCheckout}
                  disabled={createCheckout.isPending}
                  style={{ fontFamily: "Fredoka, sans-serif" }}
                >
                  {createCheckout.isPending ? "Loading..." : `Start ${PREMIUM_PRICING.trialDays}-day free trial`}
                  <Sparkles className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-xs text-white/50 text-center mt-3" style={{ fontFamily: "Outfit, sans-serif" }}>Cancel anytime during trial</p>
              </div>
            </div>
          </div>
        </div>

        {/* Social Proof Strip */}
        <div className="flex flex-wrap items-center justify-center gap-8 text-sm text-gray-400 relative z-10">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-purple-400" />
            <span style={{ fontFamily: "Outfit, sans-serif" }}>{PREMIUM_PRICING.trialDays}-Day Free Trial</span>
          </div>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-green-400" />
            <span style={{ fontFamily: "Outfit, sans-serif" }}>30-Day Money-Back Guarantee</span>
          </div>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 text-yellow-400 fill-current" />
            <span style={{ fontFamily: "Outfit, sans-serif" }}>4.8/5 Rating</span>
          </div>
          <p className="w-full text-center text-sm text-gray-400" style={{ fontFamily: "Outfit, sans-serif" }}>
            Trusted by 35,000+ learners worldwide
          </p>
        </div>

        {/* Feature Comparison Table (Free vs Premium only) */}
        <div className="max-w-4xl mx-auto space-y-8 relative z-10">
          <div className="text-center">
            <Badge className="rounded-full px-5 py-2.5 mb-6 bg-purple-600 text-white border-0 shadow-lg" style={{ fontFamily: "Fredoka, sans-serif" }}>
              <Check className="inline h-4 w-4 mr-2" />
              Feature Comparison
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900" style={{ fontFamily: "Fredoka, sans-serif" }}>
              <span className="text-purple-400" style={{ animation: "twinkle 3s ease-in-out infinite" }}>{"\u2728"}</span>
              {" "}Compare Plans{" "}
              <span className="text-purple-400" style={{ animation: "twinkle 3s ease-in-out infinite", animationDelay: "1.5s" }}>{"\u2728"}</span>
            </h2>
          </div>

          <div className="rounded-3xl overflow-hidden border-2 border-purple-100/60 bg-white/80 backdrop-blur-sm shadow-lg">
            <table className="w-full text-sm" style={{ fontFamily: "Outfit, sans-serif" }}>
              <thead>
                <tr className="border-b-2 border-purple-100">
                  <th className="text-left p-4 md:p-5 font-bold text-gray-900" style={{ fontFamily: "Fredoka, sans-serif" }}>Feature</th>
                  <th className="text-center p-4 md:p-5 font-bold text-gray-900" style={{ fontFamily: "Fredoka, sans-serif" }}>Free</th>
                  <th className="text-center p-4 md:p-5 font-bold text-purple-700" style={{ fontFamily: "Fredoka, sans-serif" }}>
                    <span className="inline-flex items-center gap-1.5">
                      <Sparkles className="h-4 w-4" />
                      Premium
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody>
                {[
                  { feature: "Stories", free: "1/day + 3 starter", premium: "Unlimited" },
                  { feature: "Difficulty levels (CEFR)", free: "A1\u2013C2", premium: "A1\u2013C2" },
                  { feature: "Dictionary lookups", free: "10/day", premium: "Unlimited" },
                  { feature: "Vocabulary saving", free: "3/day", premium: "Unlimited" },
                  { feature: "Audio playback", free: "Standard", premium: "Speed control" },
                  { feature: "Reading mode", free: "Online only", premium: "Online + Offline" },
                  { feature: "Comprehension tools", free: "Basic", premium: "Advanced" },
                  { feature: "Learning progress", free: "Standard", premium: "Faster" },
                ].map((row, i) => (
                  <tr key={i} className={`border-b border-purple-50 ${i % 2 === 0 ? "bg-purple-50/30" : ""}`}>
                    <td className="p-4 md:p-5 text-gray-700 font-medium">{row.feature}</td>
                    <td className="p-4 md:p-5 text-center text-gray-500">
                      {row.free === "\u2713" ? (
                        <Check className="h-5 w-5 text-green-500 mx-auto" />
                      ) : row.free === "\u2717" ? (
                        <Lock className="h-4 w-4 text-gray-300 mx-auto" />
                      ) : (
                        row.free
                      )}
                    </td>
                    <td className="p-4 md:p-5 text-center text-purple-700 font-semibold">
                      {row.premium === "\u2713" ? (
                        <Check className="h-5 w-5 text-purple-600 mx-auto" />
                      ) : row.premium === "\u2717" ? (
                        <Lock className="h-4 w-4 text-gray-300 mx-auto" />
                      ) : (
                        row.premium
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* School & Enterprise Plans */}
        <div className="max-w-5xl mx-auto relative z-10 space-y-8">
          <div className="text-center space-y-4">
            <Badge className="rounded-full px-5 py-2.5 bg-teal-600 text-white border-0 shadow-lg" style={{ fontFamily: "Fredoka, sans-serif" }}>
              <GraduationCap className="inline h-4 w-4 mr-2" />
              For Schools & Organizations
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900" style={{ fontFamily: "Fredoka, sans-serif" }}>
              Plans for Teams & Classrooms
            </h2>
            <p className="text-gray-500 max-w-xl mx-auto" style={{ fontFamily: "Outfit, sans-serif" }}>
              Empower your students or team with immersive language learning at scale.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {/* School Plan */}
            <div className="rounded-3xl bg-white border-2 border-teal-200 p-8 md:p-10 flex flex-col hover:-translate-y-1 transition-all shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-teal-100 flex items-center justify-center">
                  <GraduationCap className="h-5 w-5 text-teal-600" />
                </div>
                <h3 className="text-3xl font-bold text-gray-900" style={{ fontFamily: "Fredoka, sans-serif" }}>School</h3>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-sm text-gray-500" style={{ fontFamily: "Outfit, sans-serif" }}>Starting at</span>
              </div>
              <div className="flex items-baseline gap-1 mb-1">
                <span className="text-4xl font-bold text-gray-900" style={{ fontFamily: "Fredoka, sans-serif" }}>${SCHOOL_PRICING.startingPerSeatPerMonth}</span>
                <span className="text-gray-500" style={{ fontFamily: "Outfit, sans-serif" }}>/ seat / month</span>
              </div>
              <p className="text-xs text-gray-400 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Billed annually. Minimum {SCHOOL_PRICING.minSeats} seats.</p>

              {/* Volume discount tiers */}
              <div className="rounded-2xl bg-teal-50 p-4 mb-6 space-y-2">
                <p className="text-xs font-bold text-teal-700 uppercase tracking-wide mb-2" style={{ fontFamily: "Fredoka, sans-serif" }}>Volume Pricing</p>
                {SCHOOL_PRICING.tiers.map((tier, i) => (
                  <div key={i} className="flex items-center justify-between text-sm" style={{ fontFamily: "Outfit, sans-serif" }}>
                    <span className="text-gray-600">
                      {tier.maxSeats ? `${tier.minSeats}–${tier.maxSeats} seats` : `${tier.minSeats}+ seats`}
                    </span>
                    <span className="font-bold text-gray-900">
                      ${tier.perSeatPerMonth}/mo <span className="text-xs text-gray-400 font-normal">(${tier.perSeatPerYear}/yr)</span>
                    </span>
                  </div>
                ))}
              </div>

              <ul className="space-y-4 mb-10 flex-1">
                {[
                  "All Premium features for every student",
                  "Teacher dashboard & analytics",
                  "Class management tools",
                  "Bulk student enrollment (CSV)",
                  "Curriculum-aligned content",
                  "Assignment & progress tracking",
                  "Priority email support",
                ].map((f, j) => (
                  <li key={j} className="flex items-center gap-3 text-sm text-gray-700" style={{ fontFamily: "Outfit, sans-serif" }}>
                    <div className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                      <Check className="h-3 w-3 text-teal-600" />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>

              <Button
                className="w-full rounded-full bg-teal-600 text-white hover:bg-teal-700 hover:scale-[1.02] font-bold transition-all duration-300 py-3 text-base shadow-lg"
                onClick={() => setLocation("/contact")}
                style={{ fontFamily: "Fredoka, sans-serif" }}
              >
                Get Started for Your School
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <p className="text-xs text-gray-400 text-center mt-3" style={{ fontFamily: "Outfit, sans-serif" }}>Custom quotes available for districts</p>
            </div>

            {/* Enterprise Plan */}
            <div className="relative rounded-3xl overflow-hidden shadow-2xl hover:-translate-y-1 transition-all" style={{ background: "linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%)" }}>
              <div className="absolute top-4 right-4">
                <Badge className="rounded-full px-3 py-1 bg-amber-400 text-amber-900 border-0 font-bold text-xs" style={{ fontFamily: "Fredoka, sans-serif" }}>
                  <Building2 className="h-3 w-3 mr-1" />
                  CUSTOM
                </Badge>
              </div>

              <div className="p-8 md:p-10 flex flex-col h-full">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center">
                    <Building2 className="h-5 w-5 text-white" />
                  </div>
                  <h3 className="text-3xl font-bold text-white" style={{ fontFamily: "Fredoka, sans-serif" }}>Enterprise</h3>
                </div>

                <div className="flex items-baseline gap-1 mb-3">
                  <span className="text-4xl font-bold text-white" style={{ fontFamily: "Fredoka, sans-serif" }}>Custom</span>
                </div>
                <p className="text-base text-white/70 mb-8" style={{ fontFamily: "Outfit, sans-serif" }}>Tailored language training for your organization. Let's build your plan together.</p>

                <ul className="space-y-4 flex-1 mb-10">
                  {[
                    "Everything in School",
                    "SSO & SAML integration",
                    "Custom content & branding",
                    "API access & LMS integration",
                    "Dedicated account manager",
                    "Advanced analytics & reporting",
                    "SLA & priority support",
                    "Onboarding & training sessions",
                  ].map((f, j) => (
                    <li key={j} className="flex items-center gap-3 text-sm text-white" style={{ fontFamily: "Outfit, sans-serif" }}>
                      <div className="w-5 h-5 rounded-full bg-white/15 flex items-center justify-center flex-shrink-0">
                        <Check className="h-3 w-3 text-amber-300" />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>

                <Button
                  className="w-full rounded-full bg-white text-gray-900 hover:bg-white/90 hover:scale-[1.02] hover:shadow-2xl font-bold shadow-xl border-0 transition-all duration-300 text-base py-3"
                  onClick={() => setLocation("/contact")}
                  style={{ fontFamily: "Fredoka, sans-serif" }}
                >
                  Contact Sales
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-xs text-white/50 text-center mt-3" style={{ fontFamily: "Outfit, sans-serif" }}>Typically responds within 24 hours</p>
              </div>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto space-y-8 relative z-10">
          <div className="text-center">
            <Badge className="rounded-full px-5 py-2.5 mb-6 bg-purple-600 text-white border-0 shadow-lg" style={{ fontFamily: "Fredoka, sans-serif" }}>
              <HelpCircle className="inline h-4 w-4 mr-2" />
              FAQ
            </Badge>
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900" style={{ fontFamily: "Fredoka, sans-serif" }}>
              <span className="text-purple-400" style={{ animation: "twinkle 3s ease-in-out infinite" }}>{"\u2728"}</span>
              {" "}Common Questions{" "}
              <span className="text-purple-400" style={{ animation: "twinkle 3s ease-in-out infinite", animationDelay: "1.5s" }}>{"\u2728"}</span>
            </h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="rounded-2xl bg-white/80 backdrop-blur-sm shadow-sm hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden border-2 border-purple-100/60 hover:border-purple-200"
                onClick={() => setOpenFaq(openFaq === i ? null : i)}
              >
                <div className="flex items-center justify-between p-5 gap-4">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{faq.icon}</span>
                    <h3 className="font-bold text-gray-900 text-base md:text-lg" style={{ fontFamily: "Fredoka, sans-serif" }}>{faq.q}</h3>
                  </div>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-300 ${openFaq === i ? "bg-purple-600 text-white" : "bg-purple-100 text-purple-600"}`}>
                    <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${openFaq === i ? "rotate-180" : ""}`} />
                  </div>
                </div>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? "max-h-40 pb-5 px-5 pl-14" : "max-h-0"}`}>
                  <p className="text-gray-600 text-sm leading-relaxed" style={{ fontFamily: "Outfit, sans-serif" }}>{faq.a}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
