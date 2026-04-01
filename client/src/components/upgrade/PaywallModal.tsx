import { useState, useEffect } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Sparkles,
  ArrowRight,
  BookOpen,
  Search,
  Download,
  Zap,
  Star,
  Check,
} from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { getLoginUrl } from "@/const";
import { PREMIUM_PRICING } from "../../../../shared/freemiumLimits";

export type PaywallTrigger =
  | "first_story"
  | "daily_limit"
  | "locked_content"
  | "vocab_limit"
  | "lookup_limit"
  | "feature_gate"
  | "audio_speed"
  | "offline_download"
  | "advanced_tools"
  | "generic";

export type PaywallHeadline =
  | "keep_going"
  | "go_unlimited"
  | "unlock_lookups"
  | "build_vocab"
  | "unlock_speed_control"
  | "unlock_offline"
  | "unlock_advanced"
  | "generic";

interface PaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  trigger: PaywallTrigger;
  /** Dynamic headline based on user behavior */
  headline?: PaywallHeadline;
  /** Optional stats to show (e.g., "14 new words today") */
  progressStat?: { value: string; label: string };
  /** Skip directly to pricing step */
  skipToStep2?: boolean;
}

const HERO_IMAGE_URL =
  "https://d2xsxph8kpxj0f.cloudfront.net/103676959/REBiP2ev8rqbpxn8LRb7vA/paywall-hero-PifsCVADtEXv9aWZPzSseC.webp";

const HEADLINES: Record<PaywallHeadline, { title: string; subtitle: string }> = {
  keep_going: {
    title: "Nice! You finished your story.",
    subtitle: "Keep learning with unlimited stories, unlimited lookups, and more.",
  },
  go_unlimited: {
    title: "You've used today's free story.",
    subtitle: "Start your free trial for unlimited stories every day.",
  },
  unlock_lookups: {
    title: "Unlock unlimited dictionary lookups.",
    subtitle: "Look up every word, every time \u2014 no daily cap.",
  },
  build_vocab: {
    title: "Build your vocabulary faster.",
    subtitle: "Save unlimited words and master them with spaced repetition.",
  },
  generic: {
    title: "Keep the story going.",
    subtitle: "Upgrade to unlock the full Storyling experience.",
  },
  unlock_speed_control: {
    title: "Control your listening speed.",
    subtitle: "Slow down or speed up audio to match your level.",
  },
  unlock_offline: {
    title: "Learn anywhere, anytime.",
    subtitle: "Download stories for offline reading and listening.",
  },
  unlock_advanced: {
    title: "Deeper comprehension tools.",
    subtitle: "Get sentence explanations, grammar help, and contextual insights.",
  },
};

const VALUE_FEATURES = [
  { icon: Zap, text: "Unlimited stories every day", color: "text-purple-500" },
  { icon: Search, text: "Unlimited dictionary lookups", color: "text-blue-500" },
  { icon: Download, text: "Offline listening & downloads", color: "text-emerald-500" },
  { icon: BookOpen, text: "All levels A1–C2 & advanced series", color: "text-amber-500" },
];

/**
 * Two-step paywall modal:
 * Step 1 — Value Screen (illustration + features + "Continue")
 * Step 2 — Pricing Screen (Free vs Premium)
 */
export function PaywallModal({
  open,
  onOpenChange,
  trigger,
  headline = "keep_going",
  progressStat,
  skipToStep2 = false,
}: PaywallModalProps) {
  const [step, setStep] = useState<1 | 2>(skipToStep2 ? 2 : 1);
  const [billingPeriod, setBillingPeriod] = useState<"monthly" | "annual">("monthly");
  const [, setLocation] = useLocation();
  const { user } = useAuth();

  // Reset step when modal opens
  useEffect(() => {
    if (open) {
      setStep(skipToStep2 ? 2 : 1);
    }
  }, [open, skipToStep2]);

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

  const handleCheckout = () => {
    if (!user) {
      const returnUrl = encodeURIComponent(`/pricing?upgrade=true&period=${billingPeriod}`);
      const loginUrl = getLoginUrl();
      const separator = loginUrl.includes('?') ? '&' : '?';
      window.location.href = `${loginUrl}${separator}return_to=${returnUrl}`;
      return;
    }
    createCheckout.mutate({ billingPeriod });
  };

  const headlineContent = HEADLINES[headline];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] p-0 border-0 overflow-hidden rounded-3xl max-h-[90vh] overflow-y-auto">
        {step === 1 ? (
          /* ========== STEP 1: VALUE SCREEN ========== */
          <div>
            {/* Hero illustration */}
            <div
              className="relative w-full pt-6 pb-4 flex justify-center"
              style={{
                background: "linear-gradient(135deg, #E9D5FF 0%, #DBEAFE 50%, #D1FAE5 100%)",
              }}
            >
              <img
                src={HERO_IMAGE_URL}
                alt="Reading illustration"
                className="w-48 h-36 object-contain drop-shadow-lg"
              />
              {/* Sparkle decorations */}
              <span className="absolute top-4 right-6 text-purple-400 text-lg animate-pulse">
                ✦
              </span>
              <span
                className="absolute top-10 left-8 text-blue-400 text-sm animate-pulse"
                style={{ animationDelay: "0.7s" }}
              >
                ✦
              </span>
            </div>

            {/* Content */}
            <div className="px-8 py-6 space-y-5">
              {/* Progress stat badge (if provided) */}
              {progressStat && (
                <div className="flex justify-center">
                  <div className="inline-flex items-center gap-2 bg-amber-50 rounded-full px-4 py-2">
                    <Star className="h-4 w-4 text-amber-500 fill-amber-500" />
                    <span
                      className="text-sm font-semibold text-amber-700"
                      style={{ fontFamily: "Fredoka, sans-serif" }}
                    >
                      {progressStat.value} {progressStat.label}
                    </span>
                  </div>
                </div>
              )}

              <div className="text-center">
                <h2
                  className="text-2xl font-bold text-gray-900 mb-2"
                  style={{ fontFamily: "Fredoka, sans-serif" }}
                >
                  {headlineContent.title}
                </h2>
                <p className="text-gray-500 text-base leading-relaxed">
                  {headlineContent.subtitle}
                </p>
              </div>

              {/* Feature bullets */}
              <div className="space-y-3">
                {VALUE_FEATURES.map((feature, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
                      <feature.icon className={`h-4.5 w-4.5 ${feature.color}`} />
                    </div>
                    <span
                      className="text-sm font-medium text-gray-700"
                      style={{ fontFamily: "Fredoka, sans-serif" }}
                    >
                      {feature.text}
                    </span>
                  </div>
                ))}
              </div>

              {/* CTA — matches spec: "Start free trial" + "Continue" */}
              <div className="space-y-3 pt-1">
                <Button
                  onClick={() => setStep(2)}
                  className="w-full h-12 rounded-2xl text-base font-semibold text-white border-0 transition-all duration-200 hover:scale-[1.02] hover:shadow-lg"
                  style={{
                    fontFamily: "Fredoka, sans-serif",
                    background: "linear-gradient(135deg, #8B5CF6 0%, #6366F1 50%, #3B82F6 100%)",
                  }}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  Start free trial
                </Button>

                <button
                  onClick={() => onOpenChange(false)}
                  className="w-full text-center text-sm text-gray-400 hover:text-gray-600 transition-colors py-2"
                  style={{ fontFamily: "Fredoka, sans-serif" }}
                >
                  Continue
                </button>
              </div>
            </div>
          </div>
        ) : (
          /* ========== STEP 2: PRICING SCREEN (Free vs Premium) ========== */
          <div>
            {/* Header */}
            <div
              className="px-8 pt-8 pb-5 text-center"
              style={{
                background: "linear-gradient(135deg, #FAF5FF 0%, #EEF2FF 50%, #F0FDF4 100%)",
              }}
            >
              <h2
                className="text-2xl font-bold text-gray-900 mb-2"
                style={{ fontFamily: "Fredoka, sans-serif" }}
              >
                Choose your plan
              </h2>
              <p className="text-gray-500 text-sm">
                Join free. Upgrade when you're ready.
              </p>

              {/* Billing toggle */}
              <div className="flex items-center justify-center gap-3 mt-4">
                <span
                  className={`text-sm font-medium ${billingPeriod === "monthly" ? "text-gray-900" : "text-gray-400"}`}
                  style={{ fontFamily: "Fredoka, sans-serif" }}
                >
                  Monthly
                </span>
                <button
                  onClick={() => setBillingPeriod(billingPeriod === "monthly" ? "annual" : "monthly")}
                  className={`relative w-12 h-6 rounded-full transition-colors ${billingPeriod === "annual" ? "bg-purple-600" : "bg-gray-300"}`}
                >
                  <div
                    className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-md transition-transform ${billingPeriod === "annual" ? "translate-x-6" : "translate-x-0.5"}`}
                  />
                </button>
                <span
                  className={`text-sm font-medium ${billingPeriod === "annual" ? "text-gray-900" : "text-gray-400"}`}
                  style={{ fontFamily: "Fredoka, sans-serif" }}
                >
                  Annual
                </span>
                <span className="text-xs font-bold text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                  Save {PREMIUM_PRICING.annualSavingsPercent}%
                </span>
              </div>
            </div>

            {/* Plan cards */}
            <div className="px-6 py-5 space-y-4">
              {/* Free Plan — compact */}
              <div className="rounded-2xl border-2 border-gray-100 p-4 flex items-center justify-between">
                <div>
                  <h3
                    className="text-base font-bold text-gray-900"
                    style={{ fontFamily: "Fredoka, sans-serif" }}
                  >
                    Free
                  </h3>
                  <p className="text-xs text-gray-500 mt-0.5">1 story/day, all levels</p>
                </div>
                <span
                  className="text-sm text-gray-400 font-medium"
                  style={{ fontFamily: "Fredoka, sans-serif" }}
                >
                  $0
                </span>
              </div>

              {/* Premium Plan — highlighted */}
              <div
                className="relative rounded-2xl overflow-hidden shadow-lg"
                style={{
                  background: "linear-gradient(135deg, #7C3AED 0%, #4F46E5 50%, #2563EB 100%)",
                }}
              >
                {/* Most Popular badge */}
                <div className="absolute top-3 right-3">
                  <span
                    className="text-[10px] font-bold text-amber-900 bg-yellow-400 px-2.5 py-1 rounded-full inline-flex items-center gap-1"
                    style={{ fontFamily: "Fredoka, sans-serif" }}
                  >
                    <Star className="h-3 w-3 fill-current" />
                    MOST POPULAR
                  </span>
                </div>

                <div className="p-5">
                  <h3
                    className="text-lg font-bold text-white mb-1"
                    style={{ fontFamily: "Fredoka, sans-serif" }}
                  >
                    Premium
                  </h3>

                  <div className="flex items-baseline gap-1 mb-3">
                    <span
                      className="text-3xl font-bold text-white"
                      style={{ fontFamily: "Fredoka, sans-serif" }}
                    >
                      {billingPeriod === "annual" ? `$${PREMIUM_PRICING.annualPerMonth}` : `$${PREMIUM_PRICING.monthly}`}
                    </span>
                    <span className="text-white/60 text-sm">/month</span>
                  </div>
                  {billingPeriod === "annual" && (
                    <p className="text-white/50 text-xs mb-3">
                      Billed annually (${PREMIUM_PRICING.annual}/year)
                    </p>
                  )}
                  {billingPeriod === "monthly" && (
                    <p className="text-white/50 text-xs mb-3">
                      Switch to annual for just ${PREMIUM_PRICING.annualPerMonth}/mo
                    </p>
                  )}

                  <div className="grid grid-cols-2 gap-2 mb-4">
                    {[
                      "Unlimited stories",
                      "Unlimited lookups",
                      "Unlimited vocab saving",
                      "Offline reading",
                      "Audio speed control",
                      "Advanced tools",
                    ].map((f, i) => (
                      <div key={i} className="flex items-center gap-1.5">
                        <Check className="h-3.5 w-3.5 text-yellow-300 flex-shrink-0" />
                        <span className="text-xs text-white/90">{f}</span>
                      </div>
                    ))}
                  </div>

                  <Button
                    onClick={handleCheckout}
                    disabled={createCheckout.isPending}
                    className="w-full h-11 rounded-2xl text-sm font-bold text-purple-700 bg-white hover:bg-white/90 hover:scale-[1.02] border-0 shadow-lg transition-all"
                    style={{ fontFamily: "Fredoka, sans-serif" }}
                  >
                    <Sparkles className="mr-2 h-4 w-4" />
                    {createCheckout.isPending ? "Loading..." : `Start ${PREMIUM_PRICING.trialDays}-day free trial`}
                  </Button>
                  <p className="text-[11px] text-white/40 text-center mt-2">
                    Cancel anytime during trial
                  </p>
                </div>
              </div>

              {/* Back / dismiss */}
              <div className="flex justify-center gap-4 pt-1 pb-2">
                <button
                  onClick={() => setStep(1)}
                  className="text-sm text-purple-500 hover:text-purple-700 transition-colors font-medium"
                  style={{ fontFamily: "Fredoka, sans-serif" }}
                >
                  Back
                </button>
                <span className="text-gray-300">|</span>
                <button
                  onClick={() => onOpenChange(false)}
                  className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                  style={{ fontFamily: "Fredoka, sans-serif" }}
                >
                  Maybe later
                </button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
