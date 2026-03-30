import React from "react";
import { useState, useEffect, useMemo } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_TITLE, APP_LOGO, getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { 
  Mic, 
  Film, 
  Play, 
  Clock, 
  Sparkles, 
  BookOpen,
  PlusCircle,
  TrendingUp,
  Home as HomeIcon,
  Flame,
  Target,
  Library,
  Settings,
  FolderHeart,
  ArrowRight,
  Heart,
  Headphones,
  Clapperboard,
  User
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { DifficultyBadge } from "@/components/DifficultyBadge";

import { QuickStartTutorial } from "@/components/QuickStartTutorial";
import { TutorialChallenges } from "@/components/TutorialChallenges";
import { useChallengeDetection } from "@/hooks/useChallengeDetection";
import { PremiumWelcomeModal } from "@/components/PremiumWelcomeModal";
import { WeeklyGoalOnboarding } from "@/components/WeeklyGoalOnboarding";
import { PremiumShowcase } from "@/components/PremiumShowcase";
import { EmailVerificationBanner } from "@/components/EmailVerificationBanner";
import { InstallPromptBanner } from "@/components/InstallPromptBanner";
import { AppFooter } from "@/components/AppFooter";
import { MobileNav } from "@/components/MobileNav";
import { PullToRefresh } from "@/components/PullToRefresh";
import { Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip";

const MASCOT_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/103676959/REBiP2ev8rqbpxn8LRb7vA/nb-mascot-v2-BbGv6ukYq7Ysujcsw5aZYd.png";
const PODCAST_BOOK_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/103676959/REBiP2ev8rqbpxn8LRb7vA/nb-podcast-book-v2_7219c3ac.png";
const FILM_BOOK_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/103676959/REBiP2ev8rqbpxn8LRb7vA/nb-film-book-v2_e1e24f67.png";

// ─── Aurora Borealis Background ──────────────────────────────────────────────
// Dramatic teal/green light bands drifting across a purple night sky
function AuroraBorealis() {
  return (
    <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden" aria-hidden="true">
      {/* Main aurora band 1 — bright teal/green sweep across center */}
      <div
        className="absolute"
        style={{
          top: '10%',
          left: '-30%',
          width: '160%',
          height: '60%',
          background: 'radial-gradient(ellipse 80% 40% at 40% 50%, rgba(78, 205, 210, 0.5), rgba(56, 189, 180, 0.25) 35%, rgba(72, 200, 190, 0.1) 60%, transparent 80%)',
          filter: 'blur(25px)',
          animation: 'aurora-drift-1 18s ease-in-out infinite',
        }}
      />
      {/* Aurora band 2 — secondary green sweep from right */}
      <div
        className="absolute"
        style={{
          top: '20%',
          left: '-15%',
          width: '140%',
          height: '55%',
          background: 'radial-gradient(ellipse 70% 35% at 65% 45%, rgba(72, 211, 200, 0.4), rgba(78, 205, 210, 0.18) 40%, transparent 70%)',
          filter: 'blur(30px)',
          animation: 'aurora-drift-2 22s ease-in-out infinite',
        }}
      />
      {/* Aurora band 3 — purple/teal mix higher up */}
      <div
        className="absolute"
        style={{
          top: '5%',
          left: '-20%',
          width: '150%',
          height: '50%',
          background: 'radial-gradient(ellipse 90% 30% at 50% 40%, rgba(139, 92, 246, 0.35), rgba(78, 205, 210, 0.18) 40%, transparent 65%)',
          filter: 'blur(20px)',
          animation: 'aurora-drift-3 28s ease-in-out infinite',
        }}
      />
      {/* Lower bright teal glow — makes the bottom half glow green */}
      <div
        className="absolute"
        style={{
          top: '45%',
          left: '-20%',
          width: '140%',
          height: '55%',
          background: 'radial-gradient(ellipse 80% 50% at 45% 30%, rgba(72, 195, 190, 0.35), rgba(78, 205, 210, 0.15) 50%, transparent 75%)',
          filter: 'blur(35px)',
          animation: 'aurora-drift-1 30s ease-in-out infinite reverse',
        }}
      />
      {/* Additional bright streak — diagonal aurora ribbon */}
      <div
        className="absolute"
        style={{
          top: '15%',
          left: '-25%',
          width: '150%',
          height: '40%',
          background: 'radial-gradient(ellipse 60% 20% at 55% 50%, rgba(110, 220, 210, 0.35), rgba(72, 200, 195, 0.15) 50%, transparent 75%)',
          filter: 'blur(18px)',
          transform: 'rotate(-8deg)',
          animation: 'aurora-drift-2 15s ease-in-out infinite',
        }}
      />
      {/* Top deep purple haze */}
      <div
        className="absolute top-0 left-0 w-full h-[35%]"
        style={{
          background: 'radial-gradient(ellipse 90% 70% at 50% 0%, rgba(88, 28, 135, 0.6), rgba(59, 42, 122, 0.3) 60%, transparent 85%)',
          filter: 'blur(15px)',
        }}
      />
      {/* Bottom teal-green ambient glow */}
      <div
        className="absolute bottom-0 left-0 w-full h-[45%]"
        style={{
          background: 'radial-gradient(ellipse 100% 60% at 50% 100%, rgba(30, 80, 90, 0.35), transparent 70%)',
          filter: 'blur(20px)',
        }}
      />
      {/* Extra bright band — cyan/aqua highlight */}
      <div
        className="absolute"
        style={{
          top: '30%',
          left: '10%',
          width: '80%',
          height: '25%',
          background: 'radial-gradient(ellipse 70% 30% at 50% 50%, rgba(6, 182, 212, 0.25), transparent 70%)',
          filter: 'blur(25px)',
          animation: 'aurora-drift-3 20s ease-in-out infinite reverse',
        }}
      />
    </div>
  );
}

// ─── Floating Sparkle Stars ────────────────────────────────────────────────
// Golden 4-pointed stars scattered across the aurora background
function SparkleStars() {
  const stars = useMemo(() => {
    return Array.from({ length: 45 }, (_, i) => ({
      id: i,
      left: `${3 + Math.random() * 94}%`,
      top: `${2 + Math.random() * 96}%`,
      size: i < 12 ? 14 + Math.random() * 10 : 6 + Math.random() * 8,
      delay: Math.random() * 6,
      duration: 3 + Math.random() * 4,
      opacity: i < 12 ? 0.6 + Math.random() * 0.4 : 0.25 + Math.random() * 0.35,
    }));
  }, []);

  return (
    <div className="absolute inset-0 pointer-events-none z-[1] overflow-hidden" aria-hidden="true">
      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute"
          style={{
            left: s.left,
            top: s.top,
            fontSize: `${s.size}px`,
            color: '#E8B84B',
            animation: `twinkle ${s.duration}s ease-in-out ${s.delay}s infinite`,
            opacity: s.opacity,
            filter: s.size > 12 ? 'drop-shadow(0 0 6px rgba(232,184,75,0.7))' : 'none',
          }}
        >
          ✦
        </span>
      ))}
    </div>
  );
}

// ─── Time-of-day greeting ──────────────────────────────────────────────────────
function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Good night";
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  if (hour < 21) return "Good evening";
  return "Good night";
}

// ─── Language flag helper ──────────────────────────────────────────────────────
function getLanguageFlag(lang?: string): string {
  if (!lang) return "";
  const l = lang.toLowerCase();
  if (l.includes("spanish")) return "🇪🇸";
  if (l.includes("french")) return "🇫🇷";
  if (l.includes("german")) return "🇩🇪";
  if (l.includes("chinese") || l.includes("mandarin")) return "🇨🇳";
  if (l.includes("japanese")) return "🇯🇵";
  if (l.includes("korean")) return "🇰🇷";
  if (l.includes("italian")) return "🇮🇹";
  if (l.includes("portuguese")) return "🇵🇹";
  return "🌍";
}

// ─── Parchment SVG border (torn/wavy old paper edges) ──────────────────────
// This creates the irregular, hand-torn paper look from the mockup
function ParchmentCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`relative ${className}`}>
      {/* SVG clip for torn paper edges */}
      <svg className="absolute inset-0 w-full h-full" viewBox="0 0 800 400" preserveAspectRatio="none" aria-hidden="true">
        <defs>
          <filter id="paper-texture" x="0%" y="0%" width="100%" height="100%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="5" result="noise" />
            <feDiffuseLighting in="noise" lightingColor="#FBF7F2" surfaceScale="1.5" result="light">
              <feDistantLight azimuth="45" elevation="55" />
            </feDiffuseLighting>
            <feComposite in="SourceGraphic" in2="light" operator="arithmetic" k1="0.8" k2="0.3" k3="0.1" k4="0" />
          </filter>
        </defs>
        <path
          d="M 20,8 C 40,3 80,12 120,6 C 160,0 200,10 240,5 C 280,0 320,8 360,4 C 400,0 440,7 480,3 C 520,-1 560,9 600,5 C 640,1 680,8 720,4 C 750,2 775,6 790,10 L 795,15 C 798,40 793,80 796,120 C 799,160 794,200 797,240 C 800,280 795,320 798,355 L 795,365 C 790,370 780,395 740,392 C 700,389 660,397 620,393 C 580,389 540,396 500,392 C 460,388 420,395 380,391 C 340,387 300,394 260,390 C 220,386 180,393 140,389 C 100,385 60,392 30,388 L 10,385 C 5,370 8,320 4,280 C 0,240 6,200 3,160 C 0,120 5,80 3,40 Z"
          fill="url(#parchment-gradient)"
          stroke="rgba(180, 165, 140, 0.2)"
          strokeWidth="1.5"
        />
        <defs>
          <linearGradient id="parchment-gradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#FBF7F2" />
            <stop offset="30%" stopColor="#F7F2EB" />
            <stop offset="70%" stopColor="#F3EDE5" />
            <stop offset="100%" stopColor="#F5F0E8" />
          </linearGradient>
        </defs>
      </svg>
      {/* Content over the parchment */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [showPremiumWelcome, setShowPremiumWelcome] = useState(false);

  useChallengeDetection();

  const completePremiumOnboarding = trpc.auth.completePremiumOnboarding.useMutation();
  const utils = trpc.useUtils();

  // Check for premium upgrade success
  useEffect(() => {
    if (user && isAuthenticated) {
      const params = new URLSearchParams(window.location.search);
      const subscriptionStatus = params.get("subscription");
      
      if (subscriptionStatus === "success") {
        window.history.replaceState({}, "", "/dashboard");

        const checkSubscription = async () => {
          // Trigger server-side verification (handles missing webhook)
          try {
            await utils.client.checkout.verifyCheckout.mutate({});
          } catch {}

          let attempts = 0;
          const maxAttempts = 10;

          const pollInterval = setInterval(async () => {
            attempts++;
            await utils.auth.me.invalidate();
            const updatedUser = await utils.auth.me.fetch();
            
            if (updatedUser?.subscriptionTier === "premium") {
              clearInterval(pollInterval);
              if (!updatedUser.premiumOnboardingCompleted) {
                setShowPremiumWelcome(true);
              }
            } else if (attempts >= maxAttempts) {
              clearInterval(pollInterval);
              setShowPremiumWelcome(true);
            }
          }, 1000);
        };
        
        checkSubscription();
      }
    }
  }, [user, isAuthenticated, utils]);

  const { data: progressData } = trpc.progress.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: dueReviewsData } = trpc.wordbank.getDueCount.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: recentlyWatched } = trpc.storyProgress.getRecentlyWatched.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const { data: continueStory } = trpc.storyProgress.getMostRecentInProgress.useQuery(undefined, {
    enabled: isAuthenticated,
  });

  const dueReviewsCount = dueReviewsData?.count || 0;

  const handlePullRefresh = async () => {
    await Promise.all([
      utils.progress.get.invalidate(),
      utils.wordbank.getDueCount.invalidate(),
      utils.storyProgress.getRecentlyWatched.invalidate(),
      utils.storyProgress.getMostRecentInProgress.invalidate(),
    ]);
  };

  const progress = progressData && progressData.length > 0 ? {
    currentStreak: Math.max(...progressData.map(p => p.currentStreak)),
    storiesThisWeek: progressData.reduce((sum, p) => sum + p.totalStoriesGenerated, 0),
  } : { currentStreak: 0, storiesThisWeek: 0 };

  // ─── Loading state ───────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-magical flex items-center justify-center">
        <div className="text-center space-y-4">
          <img src={APP_LOGO} alt="Loading" className="h-24 w-24 mx-auto animate-float" />
          <div className="loading-fun mx-auto" />
        </div>
      </div>
    );
  }

  // ─── Not authenticated ───────────────────────────────────────────────────────
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-magical flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-2xl shadow-magical border-0 overflow-hidden">
          <div className="h-2 gradient-primary" />
          <CardContent className="pt-10 pb-10 text-center space-y-6">
            <img src={APP_LOGO} alt="Flip" className="h-28 w-28 mx-auto animate-float" />
            <div>
              <h2 className="text-3xl font-bold mb-2 text-gray-900" style={{ fontFamily: 'Fredoka, sans-serif' }}>Welcome to {APP_TITLE}</h2>
              <p className="text-gray-500 text-lg" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                Sign in to start your language learning journey!
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => window.location.href = getLoginUrl()}
              className="rounded-full gradient-primary text-white hover-lift active-scale border-0 h-14 px-8 text-lg shadow-magical transition-all"
              style={{ fontFamily: 'Fredoka, sans-serif' }}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Sign In to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const currentStreak = progress?.currentStreak || 0;
  const weeklyGoal = 5;
  const storiesThisWeek = progress?.storiesThisWeek || 0;

  // Build continue story display
  const continueTitle = continueStory?.title || continueStory?.theme || null;
  const continueId = continueStory?.id;

  return (
    <>
    {/* ═══ AURORA NIGHT SKY BACKGROUND ═══ */}
    <PullToRefresh onRefresh={handlePullRefresh} className="min-h-screen relative overflow-hidden" style={{
      background: 'linear-gradient(180deg, #2D1B69 0%, #3B2A7A 10%, #2E3B6E 25%, #1E5A6B 40%, #1A6B7A 55%, #1D7A8A 70%, #1B6E7E 85%, #1A6070 100%)'
    }}>
      {/* Animated aurora borealis light bands */}
      <AuroraBorealis />
      <SparkleStars />

      <QuickStartTutorial />
      <WeeklyGoalOnboarding />
      <PremiumWelcomeModal open={showPremiumWelcome} onClose={() => setShowPremiumWelcome(false)} />

      {/* ─── Mobile Hamburger Nav ────────────────────────────────────────── */}
      <MobileNav
        title={APP_TITLE}
        headerClassName="border-b border-white/10 bg-white/5 backdrop-blur-md"
        gradient={false}
        darkBg={true}
        rightActions={
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setLocation("/settings")}
            className="h-9 w-9 rounded-full text-white/70 hover:text-white hover:bg-white/10"
          >
            <Settings className="h-5 w-5" />
          </Button>
        }
      />

      {/* ─── Main Content ───────────────────────────────────────────────────── */}
      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-28 md:pb-12 space-y-10">
        <EmailVerificationBanner />
        <InstallPromptBanner />

        {/* ═══════════════════════════════════════════════════════════════════
            ZONE 1 — Welcome Hero Card (FROSTED GLASS, aurora-themed)
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="animate-slide-up">
          <div
            className="rounded-3xl overflow-hidden"
            style={{
              background: 'rgba(255,255,255,0.08)',
              backdropFilter: 'blur(20px)',
              border: '1px solid rgba(255,255,255,0.18)',
              boxShadow: '0 8px 40px rgba(0,0,0,0.25), inset 0 1px 0 rgba(255,255,255,0.15)',
            }}
          >
            <div className="flex flex-row items-center gap-2 px-6 py-6 sm:px-8 sm:py-7">
              {/* Left: Greeting + Stats + CTA */}
              <div className="flex-1 space-y-4 min-w-0">
                <h2
                  className="text-2xl sm:text-3xl md:text-4xl leading-tight font-bold text-white"
                  style={{ fontFamily: 'Fredoka, sans-serif', textShadow: '0 2px 12px rgba(0,0,0,0.3)' }}
                >
                  {getGreeting()}, {user?.name?.split(' ')[0] || "friend"}! 🌙
                </h2>

                {/* Stats row */}
                <div className="flex flex-wrap items-center gap-2">
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-bold"
                    style={{
                      background: 'rgba(251, 146, 60, 0.2)',
                      border: '1px solid rgba(251, 146, 60, 0.4)',
                      color: '#FED7AA',
                      fontFamily: 'Fredoka, sans-serif',
                    }}
                  >
                    🔥 {currentStreak} day streak
                  </span>
                  <span
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium"
                    style={{
                      background: 'rgba(6, 182, 212, 0.15)',
                      border: '1px solid rgba(6, 182, 212, 0.35)',
                      color: '#A5F3FC',
                      fontFamily: 'Fredoka, sans-serif',
                    }}
                  >
                    📚 {storiesThisWeek}/{weeklyGoal} stories this week
                  </span>
                </div>

                {/* Continue Reading CTA */}
                {continueTitle && continueId ? (
                  <div className="space-y-1 pt-1">
                    <button
                      onClick={() => setLocation(`/content/${continueId}`)}
                      className="inline-flex items-center gap-2 rounded-full h-11 px-6 text-sm font-bold text-white shadow-lg hover-lift active-scale transition-all"
                      style={{
                        background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
                        boxShadow: '0 6px 20px -4px rgba(124, 58, 237, 0.5)',
                        fontFamily: 'Fredoka, sans-serif',
                        maxWidth: '100%',
                      }}
                      data-tutorial="continue-reading"
                    >
                      <span className="truncate">Continue: {continueTitle}</span>
                      <ArrowRight className="h-4 w-4 shrink-0" />
                    </button>
                    <p className="text-xs text-white/50 font-medium" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                      {continueStory?.theme && continueStory.theme}
                      {continueStory?.difficultyLevel && ` · ${continueStory.difficultyLevel}`}
                      {continueStory?.mode && ` · ${continueStory.mode === 'podcast' ? '🎙️ Podcast' : '🎬 Film'}`}
                    </p>
                  </div>
                ) : (
                  <button
                    onClick={() => setLocation("/create")}
                    className="inline-flex items-center gap-2 rounded-full h-11 px-6 text-sm font-bold text-white shadow-lg hover-lift active-scale transition-all"
                    style={{
                      background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
                      boxShadow: '0 6px 20px -4px rgba(124, 58, 237, 0.5)',
                      fontFamily: 'Fredoka, sans-serif',
                    }}
                    data-tutorial="create-story"
                  >
                    <Sparkles className="h-4 w-4" />
                    Create Your First Story
                  </button>
                )}
              </div>

              {/* Right: Nano banana mascot */}
              <div className="flex-shrink-0 flex items-center justify-center">
                <div className="relative">
                  <img
                    src={MASCOT_IMG}
                    alt="Booki Mascot"
                    className="h-36 w-36 sm:h-44 sm:w-44 md:h-52 md:w-52 object-contain animate-float"
                    style={{ filter: 'drop-shadow(0 4px 16px rgba(124,58,237,0.4))' }}
                  />
                  <span className="absolute -top-2 right-1 text-amber-400 text-base animate-twinkle" style={{ filter: 'drop-shadow(0 0 4px rgba(232,184,75,0.6))' }}>✦</span>
                  <span className="absolute top-4 -left-3 text-amber-300 text-sm animate-twinkle" style={{ animationDelay: '1.2s' }}>✦</span>
                  <span className="absolute -bottom-1 right-6 text-amber-400 text-xs animate-twinkle" style={{ animationDelay: '0.6s' }}>✦</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ═══════════════════════════════════════════════════════════════════
            ZONES 2+3 — Two-column layout: Create (left) + Stories (right)
            ═══════════════════════════════════════════════════════════════════ */}
        <div className="animate-slide-up grid grid-cols-1 lg:grid-cols-2 gap-6 items-start" style={{ animationDelay: '0.1s' }}>

          {/* ── LEFT COLUMN: Create Your Next Story ── */}
          <div>
          <h3
            className="text-xl sm:text-2xl font-bold mb-4"
            style={{ fontFamily: 'Fredoka, sans-serif', color: '#FFFFFF' }}
          >
            Create Your Next Story <span style={{ fontSize: '0.85em' }}>🪶</span>
          </h3>

          <div className="grid grid-cols-2 gap-4">
            {/* ── Podcast Card — frosted glass card ── */}
            <button
              onClick={() => setLocation("/create?mode=podcast")}
              className="group text-left active:scale-[0.97] focus:outline-none rounded-3xl overflow-hidden transition-all duration-300 hover:scale-[1.02]"
              data-tutorial="create-story"
              style={{
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.12)',
              }}
            >
              {/* Gradient top accent */}
              <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #7C3AED, #06B6D4)' }} />
              {/* Book image */}
              <div className="relative flex items-center justify-center pt-6 pb-2 px-4">
                <div
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[70%] h-[30px] rounded-[50%] blur-xl opacity-50 group-hover:opacity-70 transition-opacity"
                  style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.7) 0%, transparent 70%)' }}
                />
                <img
                  src={PODCAST_BOOK_IMG}
                  alt=""
                  className="relative z-10 object-contain"
                  style={{
                    height: '140px',
                    filter: 'drop-shadow(0 6px 16px rgba(139,92,246,0.4))',
                    animation: 'book-bob 3s ease-in-out infinite',
                    animationPlayState: 'paused',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.animationPlayState = 'running')}
                  onMouseLeave={(e) => { e.currentTarget.style.animationPlayState = 'paused'; }}
                  aria-hidden="true"
                />
              </div>
              {/* Card content */}
              <div className="px-5 pb-5 space-y-3">
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-bold text-sm w-full justify-center transition-all group-hover:brightness-110"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                    boxShadow: '0 3px 12px rgba(139,92,246,0.4)',
                    fontFamily: 'Fredoka, sans-serif',
                  }}
                >
                  🎧 Create Podcast
                </div>
                <div className="flex items-start gap-1.5">
                  <p className="text-white/60 text-xs leading-snug flex-1" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                    What if your vocab list became a podcast you'd actually binge?
                  </p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className="shrink-0 inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold text-white/40 border border-white/25 cursor-help hover:text-white hover:border-white/60 transition-colors mt-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        i
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[220px] text-center bg-white text-black border border-gray-200 shadow-lg" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                      AI-narrated audio story with vocabulary, quiz & reading assistant
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </button>

            {/* ── Film Card — frosted glass card ── */}
            <button
              onClick={() => setLocation("/create?mode=film")}
              className="group text-left active:scale-[0.97] focus:outline-none rounded-3xl overflow-hidden transition-all duration-300 hover:scale-[1.02]"
              style={{
                background: 'rgba(255,255,255,0.08)',
                backdropFilter: 'blur(16px)',
                border: '1px solid rgba(255,255,255,0.15)',
                boxShadow: '0 4px 24px rgba(0,0,0,0.2), inset 0 1px 0 rgba(255,255,255,0.12)',
              }}
            >
              {/* Gradient top accent */}
              <div className="h-1 w-full" style={{ background: 'linear-gradient(90deg, #7C3AED, #06B6D4)' }} />
              {/* Book image */}
              <div className="relative flex items-center justify-center pt-6 pb-2 px-4">
                <div
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[70%] h-[30px] rounded-[50%] blur-xl opacity-50 group-hover:opacity-70 transition-opacity"
                  style={{ background: 'radial-gradient(ellipse, rgba(139,92,246,0.7) 0%, transparent 70%)' }}
                />
                <img
                  src={FILM_BOOK_IMG}
                  alt=""
                  className="relative z-10 object-contain"
                  style={{
                    height: '140px',
                    filter: 'drop-shadow(0 6px 16px rgba(139,92,246,0.4))',
                    animation: 'book-bob 3s ease-in-out infinite',
                    animationDelay: '0.5s',
                    animationPlayState: 'paused',
                  }}
                  onMouseEnter={(e) => (e.currentTarget.style.animationPlayState = 'running')}
                  onMouseLeave={(e) => { e.currentTarget.style.animationPlayState = 'paused'; }}
                  aria-hidden="true"
                />
              </div>
              {/* Card content */}
              <div className="px-5 pb-5 space-y-3">
                <div
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-white font-bold text-sm w-full justify-center transition-all group-hover:brightness-110"
                  style={{
                    background: 'linear-gradient(135deg, #8b5cf6, #6d28d9)',
                    boxShadow: '0 3px 12px rgba(139,92,246,0.4)',
                    fontFamily: 'Fredoka, sans-serif',
                  }}
                >
                  🎬 Create Film
                </div>
                <div className="flex items-start gap-1.5">
                  <p className="text-white/60 text-xs leading-snug flex-1" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                    Imagine your flashcards turned into a short film
                  </p>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span
                        className="shrink-0 inline-flex items-center justify-center w-4 h-4 rounded-full text-[10px] font-bold text-white/40 border border-white/25 cursor-help hover:text-white hover:border-white/60 transition-colors mt-0.5"
                        onClick={(e) => e.stopPropagation()}
                      >
                        i
                      </span>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[220px] text-center bg-white text-black border border-gray-200 shadow-lg" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                      AI-generated video with subtitles, vocabulary & interactive learning
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </button>
          </div>

          {/* Browse Library link */}
          <div className="mt-4">
            <button
              onClick={() => setLocation("/library")}
              className="inline-flex items-center gap-2 text-teal-200/80 hover:text-teal-100 transition-colors text-sm font-medium"
              data-tutorial="browse-library"
              style={{ fontFamily: 'Fredoka, sans-serif' }}
            >
              or browse the Story Library
              <BookOpen className="h-4 w-4" />
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
          </div>{/* end left column */}

          {/* ── RIGHT COLUMN: Your Stories ── */}
          <div data-tutorial="recently-watched">
            <div className="flex items-center justify-between mb-4">
              <h3
                className="text-xl sm:text-2xl font-bold"
                style={{ fontFamily: 'Fredoka, sans-serif', color: '#FFFFFF' }}
              >
                Your Stories
              </h3>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/library")}
                className="rounded-full text-teal-300 hover:text-teal-100 hover:bg-white/10 text-sm"
                style={{ fontFamily: 'Fredoka, sans-serif' }}
              >
                View All →
              </Button>
            </div>

          {recentlyWatched && recentlyWatched.length > 0 ? (
            <div className="grid grid-cols-3 gap-3">
              {recentlyWatched.slice(0, 3).map((item: any) => (
                <div
                  key={item.id}
                  className="group relative rounded-2xl overflow-hidden cursor-pointer transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    background: 'rgba(255,255,255,0.08)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
                  }}
                  onClick={() => setLocation(`/content/${item.id}`)}
                >
                  {/* Thumbnail */}
                  <div className="relative w-full h-40 sm:h-44 bg-gradient-to-br from-purple-500/30 via-teal-400/20 to-pink-400/20 overflow-hidden">
                    {item.thumbnailUrl ? (
                      <img
                        src={item.thumbnailUrl}
                        alt={item.title || item.theme}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <div className="text-5xl opacity-30">
                          {item.mode === "podcast" ? "🎙️" : "🎬"}
                        </div>
                      </div>
                    )}

                    {/* Progress bar */}
                    {item.progress && item.progress.progressPercent > 0 && item.progress.progressPercent < 100 && (
                      <div className="absolute bottom-0 left-0 right-0">
                        <div className="h-1.5 bg-black/30">
                          <div
                            className="h-full bg-gradient-to-r from-purple-500 to-teal-400 transition-all duration-300"
                            style={{ width: `${item.progress.progressPercent}%` }}
                          />
                        </div>
                      </div>
                    )}

                    {/* Heart icon */}
                    <div className="absolute top-3 right-3 z-10">
                      {item.progress?.completed ? (
                        <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center shadow-lg">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        </div>
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-md" style={{ border: '1px solid rgba(255,255,255,0.3)' }}>
                          <Heart className="h-4 w-4 text-pink-300" fill="currentColor" />
                        </div>
                      )}
                    </div>

                    {/* Play overlay on hover */}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                      <div className="w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center shadow-xl" style={{ border: '2px solid rgba(255,255,255,0.4)' }}>
                        <Play className="h-7 w-7 text-white ml-1" />
                      </div>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="p-4 space-y-1.5">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-sm text-white line-clamp-1" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                          {item.title || item.storyText?.substring(0, 40) || `${item.theme} Story`}
                        </h4>
                        {item.titleTranslation && (
                          <p className="text-xs text-white/50 line-clamp-1 mt-0.5" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                            {item.titleTranslation}
                          </p>
                        )}
                      </div>
                      {item.difficultyLevel && (
                        <DifficultyBadge difficultyLevel={item.difficultyLevel} className="text-[10px] flex-shrink-0" />
                      )}
                    </div>
                    <div className="flex items-center justify-between pt-1">
                      <div className="flex items-center gap-2">
                        {item.theme && (
                          <Badge className="rounded-full text-[10px] px-2 py-0.5 bg-amber-400/20 text-amber-200 border border-amber-400/30 font-medium" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                            {item.theme}
                          </Badge>
                        )}
                      </div>
                      {item.storyText && (
                        <span className="text-[10px] text-white/40 font-medium" style={{ fontFamily: 'Fredoka, sans-serif' }}>
                          {item.storyText.split(/\s+/).length} words
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center" style={{ minHeight: '200px' }}>
              <div className="text-center text-white/40">
                <BookOpen className="h-10 w-10 mx-auto mb-2 opacity-40" />
                <p style={{ fontFamily: 'Fredoka, sans-serif' }}>No stories yet</p>
              </div>
            </div>
          )}
          </div>{/* end right column */}

        </div>{/* end two-column grid */}

        {/* Tutorial Challenges */}
        <TutorialChallenges />

        {/* Premium Showcase - Only for free users */}
        <PremiumShowcase />
      </div>

      {/* ─── Bottom Navigation (Mobile) ─────────────────────────────────── */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 md:hidden" style={{
        background: 'linear-gradient(180deg, rgba(45, 27, 105, 0.95) 0%, rgba(45, 27, 105, 0.98) 100%)',
        backdropFilter: 'blur(16px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        boxShadow: '0 -8px 30px rgba(0,0,0,0.3)',
      }}>
        <div className="flex items-center justify-around h-20 px-2 max-w-md mx-auto">
          {/* Home */}
          <button
            onClick={() => setLocation("/app")}
            className="flex flex-col items-center gap-0.5 min-w-[56px]"
          >
            <HomeIcon className="h-6 w-6 text-teal-300" />
            <span className="text-[10px] font-bold text-teal-300" style={{ fontFamily: 'Fredoka, sans-serif' }}>Home</span>
          </button>

          {/* Library */}
          <button
            onClick={() => setLocation("/library")}
            className="flex flex-col items-center gap-0.5 min-w-[56px] text-white/50 hover:text-teal-300 transition-colors"
          >
            <BookOpen className="h-6 w-6" />
            <span className="text-[10px] font-medium" style={{ fontFamily: 'Fredoka, sans-serif' }}>Library</span>
          </button>

          {/* Create — Raised center button */}
          <button
            onClick={() => setLocation("/create")}
            className="flex flex-col items-center -mt-7"
          >
            <div className="w-16 h-16 rounded-full shadow-xl flex items-center justify-center hover-lift transition-all" style={{
              background: 'linear-gradient(135deg, #7C3AED 0%, #06B6D4 100%)',
              boxShadow: '0 8px 24px -4px rgba(124, 58, 237, 0.5), 0 0 0 4px rgba(45, 27, 105, 0.9)',
            }}>
              <PlusCircle className="h-8 w-8 text-white" />
            </div>
          </button>

          {/* Word Bank */}
          <button
            onClick={() => setLocation("/wordbank")}
            className="flex flex-col items-center gap-0.5 min-w-[56px] text-white/50 hover:text-teal-300 transition-colors"
          >
            <Library className="h-6 w-6" />
            <span className="text-[10px] font-medium" style={{ fontFamily: 'Fredoka, sans-serif' }}>Word Bank</span>
          </button>

          {/* Profile */}
          <button
            onClick={() => setLocation("/settings")}
            className="flex flex-col items-center gap-0.5 min-w-[56px] text-white/50 hover:text-teal-300 transition-colors"
          >
            <User className="h-6 w-6" />
            <span className="text-[10px] font-medium" style={{ fontFamily: 'Fredoka, sans-serif' }}>Profile</span>
          </button>
        </div>
      </nav>
    </PullToRefresh>

    {showPremiumWelcome && (
      <PremiumWelcomeModal
        open={showPremiumWelcome}
        onClose={() => {
          setShowPremiumWelcome(false);
          completePremiumOnboarding.mutate();
        }}
      />
    )}

    <AppFooter />
    </>
  );
}
