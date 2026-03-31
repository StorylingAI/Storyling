import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { APP_TITLE, APP_LOGO, getLoginUrl } from "@/const";
import { useLocation, Link } from "wouter";
import { Play, Sparkles, BookOpen, Mic, Film, Target, Upload, Palette, Headphones, Star, Quote, X, TrendingUp, Users, ArrowRight, Globe, Wand2, BookMarked, GraduationCap, Zap, HelpCircle, Check, ChevronDown, Brain, BarChart3, Clock, Trophy, Heart, Shield, CreditCard, Lock, Building2, Menu } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { useState, useEffect, useRef } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";

// ===== SCROLL ANIMATION HOOK =====
function useScrollReveal() {
  const ref = useRef<HTMLDivElement>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return { ref, isVisible };
}

// ===== ANIMATED COUNTER =====
function AnimatedCounter({ target, suffix = "" }: { target: number; suffix?: string }) {
  const [count, setCount] = useState(0);
  const { ref, isVisible } = useScrollReveal();

  useEffect(() => {
    if (!isVisible) return;
    let start = 0;
    const duration = 2000;
    const increment = target / (duration / 16);
    const timer = setInterval(() => {
      start += increment;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [isVisible, target]);

  return <span ref={ref}>{count.toLocaleString()}{suffix}</span>;
}

// ===== FLOATING SPARKLES =====
function FloatingSparkles({ light = false }: { light?: boolean }) {
  const color = light ? "text-yellow-300/40" : "text-yellow-400/30";
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
      {[
        { top: "8%", left: "3%", size: "text-2xl", delay: "0s" },
        { top: "15%", left: "90%", size: "text-lg", delay: "0.5s" },
        { top: "45%", left: "7%", size: "text-sm", delay: "1s" },
        { top: "60%", left: "85%", size: "text-lg", delay: "1.5s" },
        { top: "80%", left: "15%", size: "text-xs", delay: "0.8s" },
        { top: "30%", left: "50%", size: "text-sm", delay: "1.2s" },
      ].map((s, i) => (
        <span
          key={i}
          className={`absolute ${s.size} ${color} animate-twinkle`}
          style={{ top: s.top, left: s.left, animationDelay: s.delay }}
        >
          ✦
        </span>
      ))}
    </div>
  );
}

// ===== SECTION WRAPPER WITH SCROLL REVEAL =====
function RevealSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, isVisible } = useScrollReveal();
  return (
    <div
      ref={ref}
      className={`transition-all duration-700 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}

// ===== FAQ ACCORDION ITEM =====
function FaqItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div
      className="rounded-2xl border border-purple-100/50 bg-white shadow-sm hover:shadow-md transition-all cursor-pointer overflow-hidden"
      onClick={() => setOpen(!open)}
    >
      <div className="flex items-center justify-between p-5 gap-4">
        <h3 className="font-bold text-gray-900 text-base md:text-lg" style={{ fontFamily: "Fredoka, sans-serif" }}>{q}</h3>
        <ChevronDown className={`h-5 w-5 text-purple-500 flex-shrink-0 transition-transform duration-300 ${open ? "rotate-180" : ""}`} />
      </div>
      <div className={`overflow-hidden transition-all duration-300 ${open ? "max-h-40 pb-5 px-5" : "max-h-0"}`}>
        <p className="text-gray-600 text-sm leading-relaxed" style={{ fontFamily: "Outfit, sans-serif" }}>{a}</p>
      </div>
    </div>
  );
}

// ===== STATS SECTION =====
function StatsSection() {
  const { data: stats } = trpc.discovery.getPublicStats.useQuery();

  const items = [
    { value: stats?.storiesCreated ?? 0, suffix: "+", label: "Stories Created", color: "text-purple-600" },
    { value: stats?.languages ?? 0, suffix: "", label: "Languages", color: "text-blue-600" },
    { value: stats?.activeUsers ?? 0, suffix: "+", label: "Active Learners", color: "text-purple-600" },
  ];

  return (
    <section className="py-16 px-4 bg-white">
      <div className="container">
        <div className="grid grid-cols-3 gap-5 max-w-4xl mx-auto">
          {items.map((stat, i) => (
            <RevealSection key={i} delay={i * 100}>
              <div className="text-center p-6 rounded-2xl bg-gradient-to-br from-purple-50/50 to-blue-50/50 hover:-translate-y-1 transition-all">
                <div className={`text-3xl md:text-4xl font-bold ${stat.color} mb-2`} style={{ fontFamily: "Fredoka, sans-serif" }}>
                  <AnimatedCounter target={stat.value} suffix={stat.suffix} />
                </div>
                <div className="text-sm text-gray-500 font-medium" style={{ fontFamily: "Outfit, sans-serif" }}>{stat.label}</div>
              </div>
            </RevealSection>
          ))}
        </div>
      </div>
    </section>
  );
}

// ===== FEATURED COLLECTIONS =====
const CARD_COLORS = [
  { bg: "#F3E8FF", border: "#8B5CF6", avatarGrad: "linear-gradient(135deg, #8B5CF6, #7C3AED)" },
  { bg: "#ECFDF5", border: "#10B981", avatarGrad: "linear-gradient(135deg, #10B981, #059669)" },
  { bg: "#EFF6FF", border: "#3B82F6", avatarGrad: "linear-gradient(135deg, #3B82F6, #2563EB)" },
  { bg: "#FFFBEB", border: "#F59E0B", avatarGrad: "linear-gradient(135deg, #F59E0B, #D97706)" },
  { bg: "#FDF2F8", border: "#EC4899", avatarGrad: "linear-gradient(135deg, #EC4899, #DB2777)" },
  { bg: "#F0FDFA", border: "#14B8A6", avatarGrad: "linear-gradient(135deg, #14B8A6, #0D9488)" },
];

function FeaturedCollectionsGrid() {
  const [, setLocation] = useLocation();

  const { data: feed } = trpc.discovery.getDiscoveryFeed.useQuery({
    limit: 6,
  });

  const collections = feed?.popular?.slice(0, 6) ?? [];

  if (collections.length === 0) return null;

  return (
    <section className="py-20 md:py-28 px-4 relative overflow-hidden" style={{ background: "linear-gradient(180deg, #FAFAFA 0%, #F5F3FF08 50%, #FAFAFA 100%)" }}>
      {/* Sparkle particles - matching mockup placement */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[4%] left-[3%] text-purple-400/40 text-base" style={{ animation: "twinkle 3s ease-in-out infinite" }}>{"\u2726"}</div>
        <div className="absolute top-[6%] right-[4%] text-purple-300/35 text-sm" style={{ animation: "twinkle 4s ease-in-out infinite", animationDelay: "1s" }}>{"\u2726"}</div>
        <div className="absolute top-[15%] left-[8%] text-purple-300/25 text-xs" style={{ animation: "twinkle 3.5s ease-in-out infinite", animationDelay: "0.5s" }}>{"\u2726"}</div>
        <div className="absolute top-[20%] right-[2%] text-purple-400/30 text-base" style={{ animation: "twinkle 5s ease-in-out infinite", animationDelay: "2s" }}>{"\u2726"}</div>
        <div className="absolute top-[35%] left-[1%] text-purple-300/30 text-sm" style={{ animation: "twinkle 4.5s ease-in-out infinite", animationDelay: "1.5s" }}>{"\u2726"}</div>
        <div className="absolute top-[40%] right-[6%] text-purple-400/35 text-xs" style={{ animation: "twinkle 3.8s ease-in-out infinite", animationDelay: "0.8s" }}>{"\u2726"}</div>
        <div className="absolute top-[55%] left-[5%] text-purple-300/25 text-base" style={{ animation: "twinkle 4.2s ease-in-out infinite", animationDelay: "1.2s" }}>{"\u2726"}</div>
        <div className="absolute top-[60%] right-[3%] text-purple-400/30 text-sm" style={{ animation: "twinkle 3.3s ease-in-out infinite", animationDelay: "2.5s" }}>{"\u2726"}</div>
        <div className="absolute bottom-[15%] left-[2%] text-purple-300/35 text-xs" style={{ animation: "twinkle 4.8s ease-in-out infinite", animationDelay: "0.3s" }}>{"\u2726"}</div>
        <div className="absolute bottom-[10%] right-[5%] text-purple-400/25 text-base" style={{ animation: "twinkle 3.6s ease-in-out infinite", animationDelay: "1.8s" }}>{"\u2726"}</div>
        <div className="absolute bottom-[5%] left-[7%] text-purple-300/30 text-sm" style={{ animation: "twinkle 5.2s ease-in-out infinite", animationDelay: "0.7s" }}>{"\u2726"}</div>
        <div className="absolute bottom-[3%] right-[8%] text-purple-400/20 text-xs" style={{ animation: "twinkle 4.1s ease-in-out infinite", animationDelay: "2.2s" }}>{"\u2726"}</div>
      </div>

      <div className="container relative">
        <RevealSection>
          <div className="text-center mb-14 md:mb-16">
            <Badge className="rounded-full px-5 py-2.5 mb-6 bg-purple-600 text-white border-0 shadow-md" style={{ fontFamily: "Fredoka, sans-serif" }}>
              <Star className="inline h-4 w-4 mr-2" />
              Community Favorites
            </Badge>
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5 text-gray-900" style={{ fontFamily: "Fredoka, sans-serif" }}>
              <span className="text-purple-300">{"\u2726"}</span> Explore Popular Collections <span className="text-purple-300">{"\u2726"}</span>
            </h2>
            <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto" style={{ fontFamily: "Outfit, sans-serif" }}>
              Curated story collections from our community of language learners
            </p>
          </div>
        </RevealSection>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 max-w-6xl mx-auto">
          {collections.map((col, index) => {
            const colors = CARD_COLORS[index % CARD_COLORS.length];
            return (
              <RevealSection key={col.id} delay={index * 100}>
                <div
                  className="rounded-2xl overflow-hidden cursor-pointer hover:-translate-y-2 transition-all h-full flex flex-col shadow-sm hover:shadow-lg"
                  style={{
                    backgroundColor: colors.bg,
                    borderTop: `5px solid ${col.color || colors.border}`,
                  }}
                  onClick={() => col.shareToken ? setLocation(`/shared/${col.shareToken}`) : setLocation("/discover")}
                >
                  {/* Cover image */}
                  {col.coverImage && (
                    <div className="w-full h-36 overflow-hidden">
                      <img
                        src={col.coverImage}
                        alt={col.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                      />
                    </div>
                  )}
                  <div className="p-5 md:p-6 flex-1 flex flex-col">
                    {/* Avatar + Name row */}
                    <div className="flex items-center gap-3 mb-3">
                      <div
                        className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-base font-bold shadow-md flex-shrink-0"
                        style={{ background: col.color || colors.avatarGrad, fontFamily: "Fredoka, sans-serif" }}
                      >
                        {col.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg truncate text-gray-900 leading-tight" style={{ fontFamily: "Fredoka, sans-serif" }}>{col.name}</h3>
                        <p className="text-sm text-gray-400" style={{ fontFamily: "Outfit, sans-serif" }}>by {col.userName}</p>
                      </div>
                    </div>
                    {/* Description */}
                    {col.description && (
                      <p className="text-sm text-gray-500 mb-4 line-clamp-2 flex-1 leading-relaxed" style={{ fontFamily: "Outfit, sans-serif" }}>
                        {col.description}
                      </p>
                    )}
                    {/* Stats row */}
                    <div className="flex items-center gap-4 text-gray-400 text-sm" style={{ fontFamily: "Outfit, sans-serif" }}>
                      <span className="flex items-center gap-1.5">
                        <BookOpen className="h-4 w-4" />
                        {col.itemCount} stories
                      </span>
                      <span className="flex items-center gap-1.5">
                        <Users className="h-4 w-4" />
                        {col.cloneCount} clones
                      </span>
                    </div>
                  </div>
                </div>
              </RevealSection>
            );
          })}
        </div>

        <div className="text-center mt-12">
          <Button
            variant="outline"
            className="rounded-full px-8 py-3 border-2 border-purple-400 text-purple-700 hover:bg-purple-50 transition-all hover:-translate-y-0.5 font-bold"
            onClick={() => setLocation("/discover")}
            style={{ fontFamily: "Fredoka, sans-serif" }}
          >
            View All Collections
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}

// ===== MAIN LANDING PAGE =====
export default function Landing() {
  const [, setLocation] = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [showDemoModal, setShowDemoModal] = useState(false);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "annual">("annual");
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { isAuthenticated } = useAuth();

  const createCheckout = trpc.checkout.createPremiumCheckout.useMutation({
    onSuccess: (data) => {
      toast.info("Redirecting to checkout...");
      window.location.href = data.checkoutUrl;
    },
    onError: (error) => {
      if (error.message?.includes("already have")) {
        toast.info("You already have an active Premium subscription!");
      } else {
        toast.error("Failed to start checkout. Please try again.");
      }
    },
  });

  const handleStartTrial = () => {
    if (!isAuthenticated) {
      setLocation("/pricing");
      return;
    }
    createCheckout.mutate({ billingPeriod: billingCycle });
  };

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowDemoModal(false);
    };
    if (showDemoModal) {
      window.addEventListener("keydown", handleEscape);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleEscape);
      document.body.style.overflow = "unset";
    };
  }, [showDemoModal]);

  const MASCOT_URL = "https://d2xsxph8kpxj0f.cloudfront.net/103676959/REBiP2ev8rqbpxn8LRb7vA/storyling_hero_mascot-KibRpzv6WR4eusuRSzKrWZ.webp";

  return (
    <div className="min-h-screen bg-white" style={{ fontFamily: "Outfit, sans-serif" }}>

      {/* ========== STICKY HEADER ========== */}
      <header className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled ? "bg-white/95 backdrop-blur-md shadow-md" : "bg-transparent"}`}>
        <div className="container flex h-20 items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => setLocation("/")}>
            <img src={APP_LOGO} alt="Storyling.ai" className="h-11 w-11" />
            <span className={`text-2xl font-bold transition-colors ${isScrolled ? "text-purple-700" : "text-white"}`} style={{ fontFamily: "Fredoka, sans-serif" }}>{APP_TITLE}</span>
          </div>
          <nav className="hidden md:flex items-center gap-8">
            {[
              { label: "Features", action: () => { const el = document.getElementById('features'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } },
              { label: "Pricing", action: () => { const el = document.getElementById('pricing'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } },
              { label: "FAQ", action: () => { const el = document.getElementById('faq'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); } },
              { label: "Blog", action: () => setLocation("/blog") },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className={`text-sm font-medium transition-colors ${isScrolled ? "text-gray-600 hover:text-purple-600" : "text-white/80 hover:text-white"}`}
                style={{ fontFamily: "Outfit, sans-serif" }}
              >
                {item.label}
              </button>
            ))}
            <Button
              variant="ghost"
              onClick={() => window.location.href = getLoginUrl()}
              className={`rounded-full ${isScrolled ? "text-gray-700 hover:text-purple-600" : "text-white/80 hover:text-white hover:bg-white/10"}`}
              style={{ fontFamily: "Outfit, sans-serif" }}
            >
              Log in
            </Button>
            <Button
              onClick={() => setLocation("/signup")}
              className="rounded-full bg-white text-purple-700 hover:bg-white/90 border-0 px-6 shadow-lg font-bold hover:-translate-y-0.5 transition-all"
              style={{ fontFamily: "Fredoka, sans-serif" }}
            >
              Join Free
            </Button>
          </nav>
          {/* Mobile: Show hamburger menu */}
          <div className="md:hidden flex items-center gap-2">
            <Button
              size="sm"
              onClick={() => setLocation("/signup")}
              className="rounded-full bg-white text-purple-700 hover:bg-white/90 border-0 px-4 shadow-lg font-bold text-xs"
              style={{ fontFamily: "Fredoka, sans-serif" }}
            >
              Join Free
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMobileMenuOpen(true)}
              className={`h-9 w-9 rounded-full ${isScrolled ? "text-gray-700 hover:bg-gray-100" : "text-white hover:bg-white/20"}`}
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </header>

      {/* ========== Mobile Slide-out Menu ========== */}
      <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
        <SheetContent side="right" className="w-72 p-0 bg-white">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
            <SheetDescription>Navigate through the site</SheetDescription>
          </SheetHeader>
          <div className="p-5 border-b bg-gradient-to-r from-purple-50 to-teal-50">
            <div className="flex items-center gap-3">
              <img src={APP_LOGO} alt={APP_TITLE} className="h-9 w-9" />
              <span className="text-lg font-bold text-purple-700" style={{ fontFamily: 'Fredoka, sans-serif' }}>{APP_TITLE}</span>
            </div>
          </div>
          <nav className="py-2">
            {[
              { label: "Features", action: () => { const el = document.getElementById('features'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); setMobileMenuOpen(false); } },
              { label: "Pricing", action: () => { const el = document.getElementById('pricing'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); setMobileMenuOpen(false); } },
              { label: "FAQ", action: () => { const el = document.getElementById('faq'); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); setMobileMenuOpen(false); } },
              { label: "Blog", action: () => { setLocation('/blog'); setMobileMenuOpen(false); } },
            ].map((item) => (
              <button
                key={item.label}
                onClick={item.action}
                className="w-full flex items-center px-5 py-3.5 text-sm font-medium text-gray-700 hover:bg-purple-50 hover:text-purple-700 transition-colors"
              >
                {item.label}
              </button>
            ))}
          </nav>
          <div className="border-t p-4 space-y-3">
            <Button
              variant="outline"
              className="w-full rounded-full text-purple-700 border-purple-200 hover:bg-purple-50"
              onClick={() => { window.location.href = getLoginUrl(); setMobileMenuOpen(false); }}
            >
              Log in
            </Button>
            <Button
              className="w-full rounded-full bg-purple-600 text-white hover:bg-purple-700 font-bold"
              onClick={() => { setLocation('/signup'); setMobileMenuOpen(false); }}
            >
              Join Free
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* ========== HERO SECTION - Aurora Borealis ========== */}
      <section className="relative pt-24 md:pt-32 pb-0 overflow-hidden" style={{ background: "linear-gradient(160deg, #7B3FE4 0%, #6B3FA0 18%, #5A45B8 30%, #4A5DAA 42%, #3D7A9E 55%, #3A9B8F 68%, #45B5A0 80%, #50C4A8 100%)" }}>
        {/* Aurora light streaks */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          {/* Main aurora bands */}
          <div className="absolute top-0 left-0 right-0 h-full" style={{
            background: `
              radial-gradient(ellipse 120% 50% at 30% 20%, rgba(120, 80, 200, 0.35) 0%, transparent 60%),
              radial-gradient(ellipse 100% 40% at 70% 15%, rgba(60, 180, 170, 0.3) 0%, transparent 55%),
              radial-gradient(ellipse 80% 60% at 50% 30%, rgba(100, 120, 220, 0.2) 0%, transparent 50%),
              radial-gradient(ellipse 60% 30% at 80% 40%, rgba(80, 200, 180, 0.25) 0%, transparent 45%),
              radial-gradient(ellipse 90% 35% at 20% 50%, rgba(150, 100, 220, 0.2) 0%, transparent 50%)
            `
          }} />
          {/* Misty glow layers */}
          <div className="absolute top-[5%] left-[10%] w-[500px] h-[300px] bg-purple-300/15 rounded-full blur-[100px]" />
          <div className="absolute top-[10%] right-[5%] w-[400px] h-[250px] bg-teal-300/15 rounded-full blur-[80px]" />
          <div className="absolute top-[25%] left-[30%] w-[600px] h-[200px] bg-blue-300/10 rounded-full blur-[120px]" />
          <div className="absolute bottom-[30%] right-[20%] w-[350px] h-[200px] bg-emerald-300/10 rounded-full blur-[90px]" />
          {/* Subtle star-like sparkles */}
          <div className="absolute top-[12%] left-[15%] w-1.5 h-1.5 bg-white/40 rounded-full" style={{ animation: "twinkle 3s ease-in-out infinite" }} />
          <div className="absolute top-[20%] right-[25%] w-1 h-1 bg-white/30 rounded-full" style={{ animation: "twinkle 4s ease-in-out infinite", animationDelay: "1s" }} />
          <div className="absolute top-[40%] left-[8%] w-1 h-1 bg-white/25 rounded-full" style={{ animation: "twinkle 3.5s ease-in-out infinite", animationDelay: "0.5s" }} />
          <div className="absolute top-[35%] right-[12%] w-1.5 h-1.5 bg-white/35 rounded-full" style={{ animation: "twinkle 4.5s ease-in-out infinite", animationDelay: "2s" }} />
          <div className="absolute top-[55%] left-[45%] w-1 h-1 bg-white/20 rounded-full" style={{ animation: "twinkle 3s ease-in-out infinite", animationDelay: "1.5s" }} />
          <div className="absolute top-[15%] left-[60%] w-1 h-1 bg-white/30 rounded-full" style={{ animation: "twinkle 5s ease-in-out infinite", animationDelay: "0.8s" }} />
          <div className="absolute top-[45%] right-[35%] w-1.5 h-1.5 bg-white/25 rounded-full" style={{ animation: "twinkle 3.8s ease-in-out infinite", animationDelay: "2.5s" }} />
        </div>

        <div className="container relative">
          <div className="grid md:grid-cols-2 gap-6 md:gap-8 items-center min-h-[520px] md:min-h-[580px]">
            {/* Left column - Text content */}
            <div className="space-y-5 md:space-y-7 text-left pb-8 md:pb-0">
              <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[4.5rem] font-bold leading-[1.08] text-white" style={{ fontFamily: "Fredoka, sans-serif", textShadow: "0 2px 20px rgba(0,0,0,0.15)" }}>
                Learn Languages<br />Through Stories<br />You Love
              </h1>
              <p className="text-lg md:text-xl text-white/80 max-w-md leading-relaxed" style={{ fontFamily: "Outfit, sans-serif" }}>
                Not textbooks. Not boring lessons. Real stories.
              </p>
              {/* Stacked CTA buttons */}
              <div className="flex flex-col items-start gap-3 pt-1">
                <Button
                  size="lg"
                  onClick={() => setLocation("/app")}
                  className="rounded-full px-10 py-7 text-lg font-bold bg-white text-purple-700 hover:bg-white/95 transition-all shadow-xl border-0 hover:-translate-y-1 hover:shadow-2xl"
                  style={{ fontFamily: "Fredoka, sans-serif" }}
                >
                  Start Reading
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setShowDemoModal(true)}
                  className="rounded-full px-8 py-7 text-lg font-semibold border-2 border-white/30 hover:border-white/60 hover:bg-white/10 transition-all text-white bg-transparent"
                  style={{ fontFamily: "Fredoka, sans-serif" }}
                >
                  <Play className="mr-2 h-5 w-5" />
                  Watch Demo
                </Button>
              </div>
              {/* Social proof */}
              <div className="flex flex-wrap items-center gap-5 pt-1">
                <div className="flex items-center gap-3">
                  <div className="flex -space-x-2.5">
                    {["bg-yellow-400", "bg-pink-400", "bg-teal-400", "bg-blue-300"].map((bg, i) => (
                      <div key={i} className={`w-8 h-8 rounded-full ${bg} border-2 border-white/80 shadow-sm`} />
                    ))}
                  </div>
                  <div className="flex flex-col">
                    <span className="font-bold text-white text-sm" style={{ fontFamily: "Fredoka, sans-serif" }}>35,000+ learners</span>
                    <div className="flex items-center gap-0.5">
                      {[...Array(5)].map((_, i) => (
                        <Star key={i} className="h-3.5 w-3.5 fill-yellow-300 text-yellow-300" />
                      ))}
                      <span className="ml-1 text-xs font-medium text-white/80" style={{ fontFamily: "Outfit, sans-serif" }}>4.8/5</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Right column - Mascot */}
            <div className="flex items-center justify-center md:justify-end relative">
              <img
                src={MASCOT_URL}
                alt="Storyling mascot - a friendly book character with worlds of adventure"
                className="w-[340px] sm:w-[420px] md:w-[500px] lg:w-[560px] h-auto object-contain"
                style={{ filter: "drop-shadow(0 25px 50px rgba(0,0,0,0.25))", animation: "float-rotate 6s ease-in-out infinite" }}
              />
            </div>
          </div>
        </div>

        {/* Smooth wave separator */}
        <div className="relative -mb-1">
          <svg viewBox="0 0 1440 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-auto block">
            <path d="M0,60 C240,95 480,30 720,60 C960,90 1200,35 1440,60 L1440,100 L0,100 Z" fill="white" />
          </svg>
        </div>
      </section>

      {/* ========== FEATURES SECTION (BENTO GRID) ========== */}
      <section id="features" className="py-20 md:py-28 px-4 bg-white relative overflow-x-clip">
        {/* Scattered sparkle decorations */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <span className="absolute top-[8%] left-[5%] text-purple-300/50 text-lg" style={{ animation: "twinkle 3s ease-in-out infinite" }}>✦</span>
          <span className="absolute top-[15%] right-[8%] text-purple-300/40 text-sm" style={{ animation: "twinkle 4s ease-in-out infinite", animationDelay: "0.5s" }}>✦</span>
          <span className="absolute top-[5%] left-[45%] text-purple-400/30 text-xs" style={{ animation: "twinkle 3.5s ease-in-out infinite", animationDelay: "1s" }}>✦</span>
          <span className="absolute bottom-[10%] left-[3%] text-purple-300/40 text-base" style={{ animation: "twinkle 4.5s ease-in-out infinite", animationDelay: "1.5s" }}>✦</span>
          <span className="absolute bottom-[15%] right-[5%] text-purple-300/30 text-sm" style={{ animation: "twinkle 3s ease-in-out infinite", animationDelay: "2s" }}>✦</span>
          <span className="absolute top-[40%] left-[2%] text-purple-200/40 text-xs" style={{ animation: "twinkle 5s ease-in-out infinite", animationDelay: "0.8s" }}>✦</span>
          <span className="absolute top-[35%] right-[3%] text-purple-200/30 text-base" style={{ animation: "twinkle 3.8s ease-in-out infinite", animationDelay: "2.2s" }}>✦</span>
          <span className="absolute bottom-[5%] left-[50%] text-purple-300/30 text-sm" style={{ animation: "twinkle 4s ease-in-out infinite", animationDelay: "1.2s" }}>✦</span>
        </div>

        <div className="container relative">
          <RevealSection>
            <div className="text-center mb-14 md:mb-18">
              <Badge className="rounded-full px-5 py-2.5 mb-6 bg-purple-600 text-white border-0 shadow-md" style={{ fontFamily: "Fredoka, sans-serif" }}>
                <Sparkles className="inline h-4 w-4 mr-2" />
                Features
              </Badge>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5 text-gray-900" style={{ fontFamily: "Fredoka, sans-serif" }}>
                <span className="text-purple-300/60 text-2xl md:text-3xl align-middle mr-2">✦</span>
                Learn Your Way
                <span className="text-purple-300/60 text-2xl md:text-3xl align-middle ml-2">✦</span>
              </h2>
              <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto" style={{ fontFamily: "Outfit, sans-serif" }}>
                Choose how you want to experience your language learning journey
              </p>
            </div>
          </RevealSection>

          {/* Bento Grid */}
          <div className="max-w-6xl mx-auto space-y-5 md:space-y-6">
            {/* Row 1: AI Story Generator (large) + Audio Podcasts & AI Films (stacked) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">
              {/* AI Story Generator — large card */}
              <RevealSection className="lg:col-span-7">
                <div
                  className="group rounded-2xl overflow-hidden h-full shadow-sm hover:shadow-[0_8px_30px_rgba(139,92,246,0.18)] transition-all duration-300 ease-out hover:-translate-y-1.5 cursor-pointer"
                  style={{ border: "2px solid #C4B5FD", background: "linear-gradient(135deg, #FAF5FF 0%, #F3E8FF 100%)" }}
                  onClick={() => setLocation("/app")}
                >
                  <div className="flex flex-col sm:flex-row h-full">
                    <div className="sm:w-[55%] p-3 sm:p-4 flex-shrink-0 rounded-xl">
                      <img
                        src="https://d2xsxph8kpxj0f.cloudfront.net/103676959/REBiP2ev8rqbpxn8LRb7vA/feature_story_generator-LQHhjEuZvNFeRzGa9MTNx3.webp"
                        alt="AI Story Generator"
                        className="w-full h-48 sm:h-full object-cover rounded-xl transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                    </div>
                    <div className="sm:w-[45%] p-5 sm:p-6 flex flex-col justify-center min-w-0">
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-1 transition-colors duration-300 group-hover:text-purple-700" style={{ fontFamily: "Fredoka, sans-serif" }}>AI Story Generator</h3>
                      <p className="text-sm text-gray-500 mb-4" style={{ fontFamily: "Outfit, sans-serif" }}>Your vocabulary becomes an adventure</p>
                      <ul className="space-y-2 mb-5">
                        {["Paste any word list", "Choose from 12+ genres", "Set difficulty A1-C1", "Available in 19 languages"].map((item, i) => (
                          <li key={i} className="flex items-center gap-2 text-sm text-gray-600" style={{ fontFamily: "Outfit, sans-serif" }}>
                            <span className="w-5 h-5 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                              <Check className="w-3 h-3 text-teal-600" />
                            </span>
                            {item}
                          </li>
                        ))}
                      </ul>
                      <button
                        className="font-semibold text-sm inline-flex items-center gap-1.5 transition-all duration-300 group-hover:gap-3 text-purple-600 group-hover:text-purple-700"
                        style={{ fontFamily: "Fredoka, sans-serif" }}
                      >
                        Try it free <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
                      </button>
                    </div>
                  </div>
                </div>
              </RevealSection>

              {/* Right column: Audio Podcasts + AI Films stacked */}
              <div className="lg:col-span-5 flex flex-col gap-5 md:gap-6">
                {/* Audio Podcasts */}
                <RevealSection delay={150}>
                  <div
                    className="group rounded-2xl overflow-hidden shadow-sm hover:shadow-[0_8px_30px_rgba(16,185,129,0.18)] transition-all duration-300 ease-out hover:-translate-y-1.5 cursor-pointer"
                    style={{ border: "2px solid #6EE7B7", background: "linear-gradient(135deg, #ECFDF5 0%, #D1FAE5 100%)" }}
                    onClick={() => setLocation("/app")}
                  >
                    <div className="flex flex-row">
                      <div className="w-[40%] p-3 flex-shrink-0 overflow-hidden rounded-xl">
                        <img
                          src="https://d2xsxph8kpxj0f.cloudfront.net/103676959/REBiP2ev8rqbpxn8LRb7vA/feature_audio_podcasts-C9qKaVLs8rbCEWdgKnNSGc.webp"
                          alt="Audio Podcasts"
                          className="w-full h-32 sm:h-36 object-cover rounded-xl transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                      </div>
                      <div className="w-[60%] p-4 sm:p-5 flex flex-col justify-center">
                        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-0.5 transition-colors duration-300 group-hover:text-teal-700" style={{ fontFamily: "Fredoka, sans-serif" }}>Audio Podcasts</h3>
                        <p className="text-xs md:text-sm font-semibold text-teal-600 mb-2" style={{ fontFamily: "Fredoka, sans-serif" }}>Learn while you live</p>
                        <p className="text-xs md:text-sm text-gray-500 leading-relaxed" style={{ fontFamily: "Outfit, sans-serif" }}>
                          Every story becomes a podcast narrated by native speakers. Listen while commuting, cooking, or relaxing — 3x better retention than flashcards.
                        </p>
                      </div>
                    </div>
                  </div>
                </RevealSection>

                {/* AI Films */}
                <RevealSection delay={300}>
                  <div
                    className="group rounded-2xl overflow-hidden shadow-sm hover:shadow-[0_8px_30px_rgba(139,92,246,0.18)] transition-all duration-300 ease-out hover:-translate-y-1.5 cursor-pointer"
                    style={{ border: "2px solid #C4B5FD", background: "linear-gradient(135deg, #FAF5FF 0%, #EDE9FE 100%)" }}
                    onClick={() => setShowDemoModal(true)}
                  >
                    <div className="flex flex-row">
                      <div className="w-[40%] p-3 flex-shrink-0 overflow-hidden rounded-xl">
                        <img
                          src="https://d2xsxph8kpxj0f.cloudfront.net/103676959/REBiP2ev8rqbpxn8LRb7vA/feature_ai_films-fxU4AVDDW2jHycyxGqtCFt.webp"
                          alt="AI Films"
                          className="w-full h-32 sm:h-36 object-cover rounded-xl transition-transform duration-500 ease-out group-hover:scale-105"
                        />
                      </div>
                      <div className="w-[60%] p-4 sm:p-5 flex flex-col justify-center">
                        <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-0.5 transition-colors duration-300 group-hover:text-purple-700" style={{ fontFamily: "Fredoka, sans-serif" }}>AI Films</h3>
                        <p className="text-xs md:text-sm font-semibold text-purple-600 mb-2" style={{ fontFamily: "Fredoka, sans-serif" }}>See your words come alive</p>
                        <p className="text-xs md:text-sm text-gray-500 leading-relaxed" style={{ fontFamily: "Outfit, sans-serif" }}>
                          Watch cinematic short films generated from your stories. Visual storytelling creates emotional connections.
                        </p>
                      </div>
                    </div>
                  </div>
                </RevealSection>
              </div>
            </div>

            {/* Row 2: Smart Word Bank (large) + Adventure Map */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 md:gap-6">
              {/* Smart Word Bank */}
              <RevealSection className="lg:col-span-7" delay={200}>
                <div
                  className="group rounded-2xl overflow-hidden h-full shadow-sm hover:shadow-[0_8px_30px_rgba(16,185,129,0.18)] transition-all duration-300 ease-out hover:-translate-y-1.5 cursor-pointer"
                  style={{ border: "2px solid #6EE7B7", background: "linear-gradient(135deg, #F0FDFA 0%, #CCFBF1 100%)" }}
                  onClick={() => setLocation("/app")}
                >
                  <div className="flex flex-col sm:flex-row h-full">
                    <div className="sm:w-[50%] p-3 sm:p-4 flex-shrink-0 rounded-xl">
                      <img
                        src="https://d2xsxph8kpxj0f.cloudfront.net/103676959/REBiP2ev8rqbpxn8LRb7vA/feature_word_bank-TD7bWqAGGYSZVDrEEBCe7Q.webp"
                        alt="Smart Word Bank"
                        className="w-full h-48 sm:h-full object-cover rounded-xl transition-transform duration-500 ease-out group-hover:scale-105"
                      />
                    </div>
                    <div className="sm:w-[50%] p-5 sm:p-6 flex flex-col justify-center min-w-0">
                      <h3 className="text-xl md:text-2xl font-bold text-gray-900 mb-1 transition-colors duration-300 group-hover:text-teal-700" style={{ fontFamily: "Fredoka, sans-serif" }}>Smart Word Bank</h3>
                      <p className="text-sm text-gray-500 mb-3" style={{ fontFamily: "Outfit, sans-serif" }}>Never forget a word</p>
                      <p className="text-sm text-gray-500 leading-relaxed" style={{ fontFamily: "Outfit, sans-serif" }}>
                        Save words while reading, review with spaced repetition. Export as CSV or PDF for offline study.
                      </p>
                    </div>
                  </div>
                </div>
              </RevealSection>

              {/* Adventure Map */}
              <RevealSection className="lg:col-span-5" delay={350}>
                <div
                  className="group rounded-2xl overflow-hidden h-full shadow-sm hover:shadow-[0_8px_30px_rgba(139,92,246,0.18)] transition-all duration-300 ease-out hover:-translate-y-1.5 cursor-pointer"
                  style={{ border: "2px solid #C4B5FD", background: "linear-gradient(135deg, #FAF5FF 0%, #EDE9FE 100%)" }}
                  onClick={() => setLocation("/app")}
                >
                  <div className="flex flex-row h-full">
                    <div className="w-[40%] p-3 flex-shrink-0 overflow-hidden rounded-xl">
                      <img
                        src="https://d2xsxph8kpxj0f.cloudfront.net/103676959/REBiP2ev8rqbpxn8LRb7vA/feature_adventure_map-8gWtGMVRA4MJNDjuvhbvGQ.webp"
                        alt="Adventure Map"
                        className="w-full h-full object-cover rounded-xl transition-transform duration-500 ease-out group-hover:scale-105"
                        style={{ minHeight: "160px" }}
                      />
                    </div>
                    <div className="w-[60%] p-4 sm:p-5 flex flex-col justify-center">
                      <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-0.5 transition-colors duration-300 group-hover:text-purple-700" style={{ fontFamily: "Fredoka, sans-serif" }}>Adventure Map</h3>
                      <p className="text-xs md:text-sm font-semibold text-purple-600 mb-2" style={{ fontFamily: "Fredoka, sans-serif" }}>Your learning world</p>
                      <p className="text-xs md:text-sm text-gray-500 leading-relaxed" style={{ fontFamily: "Outfit, sans-serif" }}>
                        Explore a magical world where every building unlocks a feature. Track streaks, earn rewards, stay motivated.
                      </p>
                    </div>
                  </div>
                </div>
              </RevealSection>
            </div>
          </div>
        </div>
      </section>

      {/* ========== HOW IT WORKS ========== */}
      <section id="how-it-works" className="py-20 md:py-28 px-4 relative overflow-hidden" style={{ background: "linear-gradient(180deg, #EDE9FE 0%, #F3E8FF 30%, #EDE9FE 60%, #F5F3FF 100%)" }}>
        {/* Gold sparkle particles */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-[5%] left-[3%] w-1.5 h-1.5 bg-yellow-400/40 rounded-full" style={{ animation: "twinkle 3s ease-in-out infinite" }} />
          <div className="absolute top-[8%] right-[5%] w-1 h-1 bg-yellow-300/30 rounded-full" style={{ animation: "twinkle 4s ease-in-out infinite", animationDelay: "1s" }} />
          <div className="absolute top-[15%] left-[15%] w-1 h-1 bg-yellow-400/25 rounded-full" style={{ animation: "twinkle 3.5s ease-in-out infinite", animationDelay: "0.5s" }} />
          <div className="absolute top-[20%] right-[20%] w-1.5 h-1.5 bg-yellow-300/35 rounded-full" style={{ animation: "twinkle 4.5s ease-in-out infinite", animationDelay: "2s" }} />
          <div className="absolute bottom-[15%] left-[8%] w-1 h-1 bg-yellow-400/30 rounded-full" style={{ animation: "twinkle 3s ease-in-out infinite", animationDelay: "1.5s" }} />
          <div className="absolute bottom-[10%] right-[10%] w-1.5 h-1.5 bg-yellow-300/25 rounded-full" style={{ animation: "twinkle 5s ease-in-out infinite", animationDelay: "0.8s" }} />
          <div className="absolute top-[40%] left-[50%] w-1 h-1 bg-yellow-400/20 rounded-full" style={{ animation: "twinkle 3.8s ease-in-out infinite", animationDelay: "2.5s" }} />
          <div className="absolute top-[3%] left-[40%] w-1 h-1 bg-yellow-300/30 rounded-full" style={{ animation: "twinkle 4s ease-in-out infinite", animationDelay: "1.2s" }} />
          <div className="absolute bottom-[5%] left-[60%] w-1.5 h-1.5 bg-yellow-400/25 rounded-full" style={{ animation: "twinkle 3.5s ease-in-out infinite", animationDelay: "0.3s" }} />
        </div>

        <div className="container relative">
          <RevealSection>
            <div className="text-center mb-14 md:mb-18">
              <Badge className="rounded-full px-5 py-2.5 mb-6 bg-purple-600 text-white border-0 shadow-md" style={{ fontFamily: "Fredoka, sans-serif" }}>
                <Sparkles className="inline h-4 w-4 mr-2" />
                How It Works
              </Badge>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5 text-gray-900" style={{ fontFamily: "Fredoka, sans-serif" }}>
                Your Journey to Fluency
              </h2>
              <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto" style={{ fontFamily: "Outfit, sans-serif" }}>
                Four simple steps to transform your vocabulary into unforgettable stories
              </p>
            </div>
          </RevealSection>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 md:gap-8 max-w-6xl mx-auto relative">
            {/* Connecting dotted line with sparkles - desktop only */}
            <div className="hidden md:block absolute top-[58%] left-[16%] right-[16%] z-0">
              <svg viewBox="0 0 800 20" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full">
                <path d="M0,10 C100,10 100,10 200,10 C300,10 300,10 400,10 C500,10 500,10 600,10 C700,10 700,10 800,10" stroke="#A78BFA" strokeWidth="2.5" strokeDasharray="6 6" strokeLinecap="round" />
                {/* Sparkle dots along the line */}
                <circle cx="100" cy="10" r="3" fill="#C4B5FD" />
                <circle cx="200" cy="10" r="2" fill="#A78BFA" />
                <circle cx="300" cy="10" r="3" fill="#C4B5FD" />
                <circle cx="400" cy="10" r="2" fill="#A78BFA" />
                <circle cx="500" cy="10" r="3" fill="#C4B5FD" />
                <circle cx="600" cy="10" r="2" fill="#A78BFA" />
                <circle cx="700" cy="10" r="3" fill="#C4B5FD" />
                {/* Sparkle shapes */}
                <text x="150" y="8" fill="#A78BFA" fontSize="10" textAnchor="middle">{"\u2726"}</text>
                <text x="350" y="8" fill="#A78BFA" fontSize="10" textAnchor="middle">{"\u2726"}</text>
                <text x="550" y="8" fill="#A78BFA" fontSize="10" textAnchor="middle">{"\u2726"}</text>
                <text x="750" y="8" fill="#A78BFA" fontSize="10" textAnchor="middle">{"\u2726"}</text>
              </svg>
            </div>

            {[
              {
                num: "1",
                title: "Add Your Words",
                desc: "Enter the vocabulary you want to learn",
                numBg: "linear-gradient(135deg, #8B5CF6, #7C3AED)",
                img: "https://d2xsxph8kpxj0f.cloudfront.net/103676959/REBiP2ev8rqbpxn8LRb7vA/step1-vocab-v2_8eaaf766.png",
              },
              {
                num: "2",
                title: "Choose Your Story",
                desc: "Pick a genre that excites you",
                numBg: "linear-gradient(135deg, #34D399, #10B981)",
                img: "https://d2xsxph8kpxj0f.cloudfront.net/103676959/REBiP2ev8rqbpxn8LRb7vA/step2-genre_2728b49a.png",
              },
              {
                num: "3",
                title: "Read & Listen",
                desc: "Immerse yourself in AI-generated stories",
                numBg: "linear-gradient(135deg, #60A5FA, #3B82F6)",
                img: "https://d2xsxph8kpxj0f.cloudfront.net/103676959/REBiP2ev8rqbpxn8LRb7vA/step3-listen_b784f660.png",
              },
              {
                num: "4",
                title: "Master Your Words",
                desc: "Track progress with spaced repetition",
                numBg: "linear-gradient(135deg, #D4A017, #B8860B)",
                img: "https://d2xsxph8kpxj0f.cloudfront.net/103676959/REBiP2ev8rqbpxn8LRb7vA/step4-master_a74425ae.png",
              },
            ].map((step, i) => (
              <RevealSection key={i} delay={i * 150}>
                <div className="text-center relative z-10">
                  {/* Illustration */}
                  <div className="flex justify-center mb-2 group/icon cursor-pointer">
                    <img
                      src={step.img}
                      alt={step.title}
                      className="w-32 h-32 md:w-40 md:h-40 object-contain transition-all duration-300 group-hover/icon:scale-110 group-hover/icon:-translate-y-2 group-hover/icon:drop-shadow-lg"
                    />
                  </div>
                  {/* Numbered circle */}
                  <div
                    className="w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center mx-auto text-2xl md:text-3xl font-bold text-white shadow-lg hover:scale-110 transition-transform mb-4"
                    style={{ background: step.numBg, fontFamily: "Fredoka, sans-serif" }}
                  >
                    {step.num}
                  </div>
                  <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-2" style={{ fontFamily: "Fredoka, sans-serif" }}>{step.title}</h3>
                  <p className="text-sm md:text-base text-gray-500 leading-relaxed" style={{ fontFamily: "Outfit, sans-serif" }}>{step.desc}</p>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ========== STATS ========== */}
      <StatsSection />

      {/* ========== FOR STUDENTS & TEACHERS ========== */}
      <section className="py-20 md:py-28 px-4 relative overflow-hidden" style={{ background: "linear-gradient(180deg, #F5F3FF 0%, #EDE9FE 40%, #F3E8FF 70%, #F5F3FF 100%)" }}>
        {/* Sparkle particles */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-[6%] left-[4%] text-purple-300/40 text-sm" style={{ animation: "twinkle 3s ease-in-out infinite" }}>{"\u2726"}</div>
          <div className="absolute top-[10%] right-[6%] text-purple-200/30 text-xs" style={{ animation: "twinkle 4s ease-in-out infinite", animationDelay: "1s" }}>{"\u2726"}</div>
          <div className="absolute bottom-[8%] left-[10%] text-purple-300/35 text-sm" style={{ animation: "twinkle 3.5s ease-in-out infinite", animationDelay: "0.5s" }}>{"\u2726"}</div>
          <div className="absolute bottom-[12%] right-[8%] text-purple-200/25 text-xs" style={{ animation: "twinkle 5s ease-in-out infinite", animationDelay: "2s" }}>{"\u2726"}</div>
          <div className="absolute top-[30%] left-[2%] text-purple-300/30 text-xs" style={{ animation: "twinkle 4.5s ease-in-out infinite", animationDelay: "1.5s" }}>{"\u2726"}</div>
          <div className="absolute top-[50%] right-[3%] text-purple-200/35 text-sm" style={{ animation: "twinkle 3.8s ease-in-out infinite", animationDelay: "0.8s" }}>{"\u2726"}</div>
        </div>

        <div className="container relative">
          <RevealSection>
            <div className="text-center mb-14 md:mb-18">
              <Badge className="rounded-full px-5 py-2.5 mb-6 bg-purple-600 text-white border-0 shadow-md" style={{ fontFamily: "Fredoka, sans-serif" }}>
                <Target className="inline h-4 w-4 mr-2" />
                Who It's For
              </Badge>
              <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-5 text-gray-900" style={{ fontFamily: "Fredoka, sans-serif" }}>
                <span className="text-purple-300">{"\u2726"}</span> Built for Learners & Educators <span className="text-purple-300">{"\u2726"}</span>
              </h2>
              <p className="text-lg md:text-xl text-gray-500 max-w-2xl mx-auto" style={{ fontFamily: "Outfit, sans-serif" }}>
                Whether you're learning solo or teaching a class, Storyling.ai adapts to your needs
              </p>
            </div>
          </RevealSection>

          <div className="grid md:grid-cols-2 gap-8 md:gap-10 max-w-5xl mx-auto">
            {[
              {
                title: "For Students",
                desc: "Learn at your own pace with personalized content",
                bgColor: "bg-purple-50",
                borderColor: "#8B5CF6",
                accentColor: "#7C3AED",
                img: "https://d2xsxph8kpxj0f.cloudfront.net/103676959/REBiP2ev8rqbpxn8LRb7vA/icon-student-v3_1eb6545c.png",
                items: [
                  { title: "Self-Paced Learning", desc: "Create stories from your vocabulary lists anytime" },
                  { title: "Interactive Quizzes", desc: "Test your knowledge with AI-generated questions" },
                  { title: "Spaced Repetition", desc: "Smart review system keeps vocabulary fresh" },
                  { title: "Progress Tracking", desc: "See your improvement over time" },
                ],
                cta: "Start Learning Free",
                ctaAction: () => setLocation("/app"),
              },
              {
                title: "For Teachers",
                desc: "Manage classes and track student progress effortlessly",
                bgColor: "bg-blue-50",
                borderColor: "#3B82F6",
                accentColor: "#2563EB",
                img: "https://d2xsxph8kpxj0f.cloudfront.net/103676959/REBiP2ev8rqbpxn8LRb7vA/icon-teacher_a76ba1c0.png",
                items: [
                  { title: "Class Management", desc: "Create classes, enroll students, assign content" },
                  { title: "Bulk Enrollment", desc: "Upload CSV to enroll entire class rosters instantly" },
                  { title: "Analytics Dashboard", desc: "Track quiz scores, vocabulary mastery, and engagement" },
                  { title: "Batch Content", desc: "Create multiple stories at once for your curriculum" },
                ],
                cta: "Explore Teacher Tools",
                ctaAction: () => setLocation("/teacher"),
              },
            ].map((card, i) => (
              <RevealSection key={i} delay={i * 150}>
                <div className={`${card.bgColor} rounded-3xl overflow-hidden hover:-translate-y-2 transition-all h-full flex flex-col relative`} style={{ borderTop: `4px solid ${card.borderColor}` }}>
                  {/* Illustration */}
                  <div className="flex justify-center pt-6">
                    <img
                      src={card.img}
                      alt={card.title}
                      className="w-28 h-28 md:w-36 md:h-36 object-contain"
                    />
                  </div>
                  <div className="p-7 md:p-8 flex-1 flex flex-col">
                    <div className="text-center mb-5">
                      <h3 className="text-2xl md:text-3xl font-bold text-gray-900" style={{ fontFamily: "Fredoka, sans-serif" }}>{card.title}</h3>
                      <p className="text-gray-500 text-sm mt-2" style={{ fontFamily: "Outfit, sans-serif" }}>{card.desc}</p>
                    </div>
                    <ul className="space-y-3 flex-1">
                      {card.items.map((item, j) => (
                        <li key={j} className="flex items-start gap-3">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-white shadow-sm">
                            <Check className="h-3.5 w-3.5" style={{ color: card.accentColor }} />
                          </div>
                          <div>
                            <p className="font-semibold text-gray-900 text-sm" style={{ fontFamily: "Fredoka, sans-serif" }}>{item.title}</p>
                            <p className="text-xs text-gray-500" style={{ fontFamily: "Outfit, sans-serif" }}>{item.desc}</p>
                          </div>
                        </li>
                      ))}
                    </ul>
                    <Button
                      className="w-full rounded-full text-white border-0 shadow-lg mt-6 font-bold hover:-translate-y-0.5 transition-all py-3"
                      style={{ background: `linear-gradient(135deg, ${card.accentColor}, ${card.borderColor})`, fontFamily: "Fredoka, sans-serif" }}
                      onClick={card.ctaAction}
                    >
                      {card.cta}
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Collections */}
      <FeaturedCollectionsGrid />

      {/* ========== TESTIMONIALS ========== */}
      <section className="py-20 px-4 bg-gradient-to-br from-purple-50/80 via-pink-50/30 to-blue-50/30 relative overflow-hidden">
        <FloatingSparkles />
        {/* Floating book decorations */}
        <div className="absolute top-8 left-[10%] text-3xl opacity-60 animate-float" style={{ animationDelay: '0s' }}>📖</div>
        <div className="absolute top-6 left-[15%] text-2xl opacity-50 animate-float" style={{ animationDelay: '1s' }}>📚</div>
        <div className="absolute top-10 right-[8%] text-3xl opacity-60 animate-float" style={{ animationDelay: '0.5s' }}>📖</div>
        <div className="absolute top-4 right-[14%] text-2xl opacity-50 animate-float" style={{ animationDelay: '1.5s' }}>📚</div>
        {/* Floating speech bubbles */}
        <div className="absolute top-[30%] left-[5%] bg-white/80 rounded-full px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm border border-gray-100 animate-float" style={{ animationDelay: '0.8s', fontFamily: 'Fredoka, sans-serif' }}>Hola</div>
        <div className="absolute top-[15%] right-[4%] bg-white/80 rounded-full px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm border border-gray-100 animate-float" style={{ animationDelay: '1.2s', fontFamily: 'Fredoka, sans-serif' }}>你好</div>
        <div className="absolute top-[22%] right-[10%] bg-white/80 rounded-full px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm border border-gray-100 animate-float" style={{ animationDelay: '0.3s', fontFamily: 'Fredoka, sans-serif' }}>Bonjour</div>
        <div className="absolute top-[18%] right-[3%] bg-white/80 rounded-full px-3 py-1.5 text-sm font-medium text-gray-600 shadow-sm border border-gray-100 animate-float" style={{ animationDelay: '2s', fontFamily: 'Fredoka, sans-serif' }}>مرحبا</div>

        <div className="container relative">
          <RevealSection>
            <div className="text-center mb-16">
              <Badge className="rounded-full px-5 py-2.5 mb-5 bg-teal-100 text-teal-700 border-0 text-sm" style={{ fontFamily: "Fredoka, sans-serif" }}>
                <Heart className="inline h-4 w-4 mr-2 fill-teal-500 text-teal-500" />
                What Learners Say
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900" style={{ fontFamily: "Fredoka, sans-serif" }}>
                <span className="text-yellow-400">✦</span> Stories That Changed How They Learn <span className="text-yellow-400">✦</span>
              </h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto" style={{ fontFamily: "Outfit, sans-serif" }}>
                Join thousands of learners who transformed their language journey
              </p>
            </div>
          </RevealSection>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
            {[
              {
                quote: "Storyling.ai revolutionized how I teach vocabulary. My students are 3x more engaged when they learn through stories they actually want to read. The AI-generated content is remarkably natural.",
                name: "Maria González",
                role: "Spanish Teacher, Barcelona",
                avatar: "https://d2xsxph8kpxj0f.cloudfront.net/103676959/REBiP2ev8rqbpxn8LRb7vA/avatar-maria_79946b58.png",
                ringColor: "#8B5CF6",
                borderStyle: "border-2 border-purple-400",
                quoteColor: "text-purple-500",
                icon: "📕",
              },
              {
                quote: "I learned over 500 Chinese words in just 2 months using Storyling.ai. The spaced repetition combined with stories made vocabulary stick in a way flashcards never could. Absolutely game-changing.",
                name: "James Chen",
                role: "University Student, Toronto",
                avatar: "https://d2xsxph8kpxj0f.cloudfront.net/103676959/REBiP2ev8rqbpxn8LRb7vA/avatar-james_0adcf89c.png",
                ringColor: "linear-gradient(135deg, #8B5CF6, #06B6D4)",
                borderStyle: "border-2",
                borderGradient: true,
                quoteColor: "text-teal-500",
                icon: "✦",
              },
              {
                quote: "My kids actually ask to practice their Arabic now! The stories are age-appropriate, engaging, and the audio with native speakers is incredible. Best investment in their education.",
                name: "Aisha Rahman",
                role: "Parent of 3, London",
                avatar: "https://d2xsxph8kpxj0f.cloudfront.net/103676959/REBiP2ev8rqbpxn8LRb7vA/avatar-aisha_7079640b.png",
                ringColor: "#D97706",
                borderStyle: "border-2 border-amber-400",
                quoteColor: "text-amber-600",
                icon: "⭐",
              },
            ].map((t, i) => (
              <RevealSection key={i} delay={i * 150}>
                <div
                  className={`bg-white rounded-2xl p-7 shadow-lg hover:-translate-y-1 transition-all h-full flex flex-col relative ${!t.borderGradient ? t.borderStyle : ''}`}
                  style={t.borderGradient ? { border: '2px solid transparent', backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #8B5CF6, #06B6D4)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box' } : {}}
                >
                  {/* Avatar + Name row */}
                  <div className="flex items-center gap-4 mb-4">
                    <div className="w-14 h-14 rounded-full p-0.5 flex-shrink-0" style={{ background: typeof t.ringColor === 'string' && t.ringColor.includes('gradient') ? t.ringColor : t.ringColor }}>
                      <img
                        src={t.avatar}
                        alt={t.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-lg" style={{ fontFamily: "Fredoka, sans-serif" }}>{t.name}</p>
                      <p className="text-sm text-gray-500 italic" style={{ fontFamily: "Outfit, sans-serif" }}>{t.role}</p>
                    </div>
                  </div>

                  {/* Stars */}
                  <div className="flex items-center gap-1 text-yellow-400 mb-4">
                    {[...Array(5)].map((_, j) => (
                      <Star key={j} className="h-5 w-5 fill-current" />
                    ))}
                  </div>

                  {/* Quote */}
                  <div className="flex-1">
                    <span className={`text-4xl font-bold ${t.quoteColor} leading-none`} style={{ fontFamily: 'Georgia, serif' }}>"</span>
                    <p className="text-gray-600 leading-relaxed mt-1" style={{ fontFamily: "Outfit, sans-serif" }}>
                      {t.quote}
                    </p>
                  </div>

                  {/* Bottom-right decorative icon */}
                  <div className="flex justify-end mt-4">
                    <span className={`text-2xl opacity-60 ${t.quoteColor}`}>{t.icon}</span>
                  </div>
                </div>
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ========== PRICING ========== */}
      <section id="pricing" className="py-20 md:py-28 px-4 bg-white relative">
        <FloatingSparkles />
        <div className="container relative">
          <RevealSection>
            <div className="text-center mb-14">
              <Badge className="rounded-full px-4 py-2 mb-4 bg-purple-100 text-purple-700 border-0" style={{ fontFamily: "Fredoka, sans-serif" }}>
                <Sparkles className="inline h-4 w-4 mr-2" />
                Pricing
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900" style={{ fontFamily: "Fredoka, sans-serif" }}>
                Simple, Transparent Pricing
              </h2>
              <p className="text-lg text-gray-500 max-w-2xl mx-auto mb-10" style={{ fontFamily: "Outfit, sans-serif" }}>
                Join free. Upgrade when you're ready.
              </p>

              {/* Billing Toggle */}
              <div className="flex items-center justify-center gap-3">
                <span className={`text-sm font-medium ${billingCycle === "monthly" ? "text-gray-900" : "text-gray-400"}`} style={{ fontFamily: "Fredoka, sans-serif" }}>Monthly</span>
                <button
                  onClick={() => setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")}
                  className={`relative w-14 h-7 rounded-full transition-colors ${billingCycle === "annual" ? "bg-purple-600" : "bg-gray-300"}`}
                >
                  <div className={`absolute top-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform ${billingCycle === "annual" ? "translate-x-7" : "translate-x-0.5"}`} />
                </button>
                <span className={`text-sm font-medium ${billingCycle === "annual" ? "text-gray-900" : "text-gray-400"}`} style={{ fontFamily: "Fredoka, sans-serif" }}>
                  Annual
                </span>
                <Badge className="rounded-full px-3 py-1 bg-green-100 text-green-700 border-0 text-xs font-bold" style={{ fontFamily: "Fredoka, sans-serif" }}>
                  Save 42%
                </Badge>
              </div>
            </div>
          </RevealSection>

          {/* Cards: 2-tier layout (Free vs Premium) */}
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto items-stretch">
            {/* Free Plan */}
            <RevealSection>
              <div className="bg-white rounded-3xl p-7 md:p-8 border-2 border-gray-200 hover:-translate-y-1 transition-all flex flex-col h-full">
                <h3 className="text-2xl font-bold text-gray-900 mb-2" style={{ fontFamily: "Fredoka, sans-serif" }}>Free</h3>
                <div className="flex items-baseline gap-1 mb-2">
                  <span className="text-3xl font-bold text-gray-900" style={{ fontFamily: "Fredoka, sans-serif" }}>$0</span>
                  <span className="text-gray-500 text-sm" style={{ fontFamily: "Outfit, sans-serif" }}>/ forever</span>
                </div>
                <p className="text-sm text-gray-600 mb-8" style={{ fontFamily: "Outfit, sans-serif" }}>Start learning through stories.</p>

                <ul className="space-y-4 mb-10 flex-1">
                  {[
                    "3 starter stories",
                    "1 story per day",
                    "All levels A1\u2013C2",
                    "10 dictionary lookups per day",
                    "Save 3 vocabulary words per day",
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
                  className="w-full rounded-full bg-gray-900 text-white hover:bg-gray-800 hover:scale-[1.02] font-bold transition-all duration-300 py-3 text-sm shadow-lg"
                  onClick={() => setLocation("/signup")}
                  style={{ fontFamily: "Fredoka, sans-serif" }}
                >
                  Start Reading
                </Button>
                <p className="text-xs text-gray-400 text-center mt-3" style={{ fontFamily: "Outfit, sans-serif" }}>No credit card required</p>
              </div>
            </RevealSection>

            {/* Premium Plan - highlighted */}
            <RevealSection delay={100}>
              <div className="relative rounded-3xl p-7 md:p-8 hover:-translate-y-1 transition-all flex flex-col overflow-hidden shadow-xl h-full" style={{ background: "linear-gradient(135deg, #7C3AED 0%, #4F46E5 50%, #2563EB 100%)" }}>
                <div className="absolute top-4 right-4">
                  <Badge className="rounded-full px-3 py-1 bg-yellow-400 text-yellow-900 border-0 font-bold text-xs" style={{ fontFamily: "Fredoka, sans-serif" }}>
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    MOST POPULAR
                  </Badge>
                </div>

                <h3 className="text-2xl font-bold text-white mb-2" style={{ fontFamily: "Fredoka, sans-serif" }}>Premium</h3>

                <div className="mb-2">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-bold text-white" style={{ fontFamily: "Fredoka, sans-serif" }}>
                      {billingCycle === "annual" ? "$5.75" : "$9.99"}
                    </span>
                    <span className="text-white/70 text-sm" style={{ fontFamily: "Outfit, sans-serif" }}>/ month</span>
                  </div>
                  {billingCycle === "annual" && (
                    <p className="text-white/50 text-xs mt-1" style={{ fontFamily: "Outfit, sans-serif" }}>Billed annually ($69/year)</p>
                  )}
                  {billingCycle === "monthly" && (
                    <p className="text-white/50 text-xs mt-1" style={{ fontFamily: "Outfit, sans-serif" }}>Switch to annual for just $5.75/mo</p>
                  )}
                </div>
                <p className="text-sm text-white/80 mb-8" style={{ fontFamily: "Outfit, sans-serif" }}>Unlock the full Storyling experience.</p>

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
                  className="w-full rounded-full bg-white text-purple-700 hover:bg-white/90 hover:scale-[1.02] hover:shadow-2xl font-bold shadow-xl border-0 transition-all duration-300 text-sm py-3"
                  onClick={() => handleStartTrial()}
                  style={{ fontFamily: "Fredoka, sans-serif" }}
                >
                  Start 7-day free trial
                  <Sparkles className="ml-2 h-4 w-4" />
                </Button>
                <p className="text-xs text-white/50 text-center mt-3" style={{ fontFamily: "Outfit, sans-serif" }}>Cancel anytime during trial</p>
              </div>
            </RevealSection>
          </div>

          {/* Trust badges */}
          <RevealSection>
            <div className="flex flex-wrap items-center justify-center gap-8 mt-14 text-sm text-gray-400">
              <div className="flex items-center gap-2">
                <Shield className="h-5 w-5 text-purple-400" />
                <span style={{ fontFamily: "Outfit, sans-serif" }}>7-Day Free Trial</span>
              </div>
              <div className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-purple-400" />
                <span style={{ fontFamily: "Outfit, sans-serif" }}>Secure Payment</span>
              </div>
              <div className="flex items-center gap-2">
                <Star className="h-5 w-5 text-yellow-400 fill-current" />
                <span style={{ fontFamily: "Outfit, sans-serif" }}>4.8/5 Rating</span>
              </div>
            </div>
            <p className="text-center text-sm text-gray-400 mt-4" style={{ fontFamily: "Outfit, sans-serif" }}>
              Trusted by 35,000+ learners worldwide
            </p>
            <div className="mt-8 text-center">
              <Link href="/pricing">
                <button
                  className="inline-flex items-center gap-2 px-6 py-3 text-sm font-medium text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-full transition-all hover:scale-105"
                  style={{ fontFamily: "Fredoka, sans-serif" }}
                >
                  <Building2 className="h-4 w-4" />
                  Looking for School or Team plans? View all options
                  <ArrowRight className="h-4 w-4" />
                </button>
              </Link>
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ========== FAQ ========== */}
      <section id="faq" className="py-20 md:py-28 px-4 relative overflow-hidden" style={{ background: "linear-gradient(180deg, #FAF5FF 0%, #EDE9FE 50%, #FAF5FF 100%)" }}>
        {/* Sparkle decorations */}
        <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
          <div className="absolute top-[5%] left-[4%] text-purple-400/40 text-base" style={{ animation: "twinkle 3s ease-in-out infinite" }}>{"\u2726"}</div>
          <div className="absolute top-[8%] right-[5%] text-purple-300/35 text-sm" style={{ animation: "twinkle 4s ease-in-out infinite", animationDelay: "1s" }}>{"\u2726"}</div>
          <div className="absolute top-[30%] left-[2%] text-purple-300/25 text-xs" style={{ animation: "twinkle 3.5s ease-in-out infinite", animationDelay: "0.5s" }}>{"\u2726"}</div>
          <div className="absolute top-[50%] right-[3%] text-purple-400/30 text-base" style={{ animation: "twinkle 5s ease-in-out infinite", animationDelay: "2s" }}>{"\u2726"}</div>
          <div className="absolute bottom-[15%] left-[6%] text-purple-300/30 text-sm" style={{ animation: "twinkle 4.5s ease-in-out infinite", animationDelay: "1.5s" }}>{"\u2726"}</div>
          <div className="absolute bottom-[8%] right-[4%] text-purple-400/35 text-xs" style={{ animation: "twinkle 3.8s ease-in-out infinite", animationDelay: "0.8s" }}>{"\u2726"}</div>
          {/* Floating book decorations */}
          <div className="absolute top-[3%] left-[15%] text-2xl" style={{ animation: "float 6s ease-in-out infinite" }}>{"\uD83D\uDCD6"}</div>
          <div className="absolute top-[5%] right-[12%] text-xl" style={{ animation: "float 7s ease-in-out infinite", animationDelay: "2s" }}>{"\uD83D\uDCDA"}</div>
          <div className="absolute bottom-[10%] left-[10%] text-xl" style={{ animation: "float 5s ease-in-out infinite", animationDelay: "1s" }}>{"\u2753"}</div>
        </div>

        <div className="container relative z-10">
          <RevealSection>
            <div className="text-center mb-16">
              <Badge className="rounded-full px-5 py-2.5 mb-6 bg-purple-600 text-white border-0 shadow-lg" style={{ fontFamily: "Fredoka, sans-serif" }}>
                <HelpCircle className="inline h-4 w-4 mr-2" />
                FAQ
              </Badge>
              <h2 className="text-3xl md:text-5xl font-bold mb-4 text-gray-900" style={{ fontFamily: "Fredoka, sans-serif" }}>
                <span className="text-purple-400" style={{ animation: "twinkle 3s ease-in-out infinite" }}>{"\u2728"}</span>
                {" "}Questions? We Have Answers{" "}
                <span className="text-purple-400" style={{ animation: "twinkle 3s ease-in-out infinite", animationDelay: "1.5s" }}>{"\u2728"}</span>
              </h2>
              <p className="text-gray-500 text-lg max-w-xl mx-auto" style={{ fontFamily: "Outfit, sans-serif" }}>
                Everything you need to know about learning with Storyling.ai
              </p>
            </div>
          </RevealSection>

          <div className="max-w-3xl mx-auto space-y-4">
            {[
              { q: "How long does it take to create my first story?", a: "Just 5 minutes! Upload your vocabulary, choose your format (Podcast or Film), pick a theme, and let AI do the magic.", icon: "\u23F1\uFE0F" },
              { q: "Do I need to pay to get started?", a: "No! Our free plan gives you 1 story per week at beginner level. Premium unlocks unlimited stories, all levels, and advanced features like AI grammar explanations.", icon: "\uD83D\uDCB0" },
              { q: "What languages are supported?", a: "We support 19 languages including Spanish, French, German, Chinese, Japanese, Arabic, and many more. New languages added regularly.", icon: "\uD83C\uDF0D" },
              { q: "Can I download my stories?", a: "Yes! Premium members can download stories as MP3 audio or MP4 video. Perfect for learning on the go or offline study.", icon: "\uD83D\uDCE5" },
              { q: "How does this help me learn faster?", a: "Stories create emotional connections, making vocabulary 22x more memorable than flashcards. Plus, spaced repetition keeps words fresh.", icon: "\uD83D\uDE80" },
              { q: "Is there a money-back guarantee?", a: "Absolutely! If you're not satisfied within 30 days, we'll refund your subscription — no questions asked.", icon: "\uD83D\uDEE1\uFE0F" },
            ].map((faq, i) => (
              <RevealSection key={i} delay={i * 50}>
                <div
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
              </RevealSection>
            ))}
          </div>
        </div>
      </section>

      {/* ========== FINAL CTA ========== */}
      <section className="py-20 px-4 bg-white">
        <div className="container">
          <RevealSection>
            <div className="rounded-3xl overflow-hidden shadow-2xl max-w-4xl mx-auto relative" style={{ background: "linear-gradient(135deg, #7C3AED 0%, #4F46E5 40%, #2563EB 70%, #14B8A6 100%)" }}>
              <FloatingSparkles light />
              <div className="p-12 md:p-16 text-center space-y-6 relative">
                <h2 className="text-3xl md:text-5xl font-bold text-white relative z-10" style={{ fontFamily: "Fredoka, sans-serif" }}>
                  Start Your Language<br />Adventure Today
                </h2>
                <p className="text-lg text-white/85 max-w-2xl mx-auto relative z-10" style={{ fontFamily: "Outfit, sans-serif" }}>
                  Join 35,000+ learners transforming their vocabulary into unforgettable stories
                </p>
                <div className="pt-4 relative z-10">
                  <Button
                    size="lg"
                    onClick={() => setLocation("/app")}
                    className="rounded-full bg-white text-purple-700 hover:bg-white/90 border-0 h-14 text-lg px-10 font-bold shadow-xl hover:-translate-y-1 transition-all"
                    style={{ fontFamily: "Fredoka, sans-serif" }}
                  >
                    <Wand2 className="mr-2 h-5 w-5" />
                    Start Reading Free
                  </Button>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-4 text-sm text-white/70 relative z-10" style={{ fontFamily: "Outfit, sans-serif" }}>
                  <span className="flex items-center gap-1"><Check className="h-4 w-4" /> No credit card required</span>
                  <span className="flex items-center gap-1"><Check className="h-4 w-4" /> Free forever plan</span>
                  <span className="flex items-center gap-1"><Check className="h-4 w-4" /> Cancel anytime</span>
                </div>
              </div>
              {/* Mascot peeking from bottom right */}
              <img
                src={MASCOT_URL}
                alt=""
                className="absolute bottom-0 right-4 w-24 md:w-32 opacity-30"
                aria-hidden="true"
              />
            </div>
          </RevealSection>
        </div>
      </section>

      {/* ========== DEMO MODAL ========== */}
      {showDemoModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4" onClick={() => setShowDemoModal(false)}>
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
          <div className="relative w-full max-w-5xl bg-white rounded-3xl shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowDemoModal(false)}
              className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-black/50 hover:bg-black/70 text-white flex items-center justify-center transition-all"
              aria-label="Close modal"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="relative w-full" style={{ paddingBottom: "56.25%" }}>
              <div className="absolute inset-0 w-full h-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #7C3AED 0%, #4F46E5 40%, #2563EB 70%, #14B8A6 100%)" }}>
                <div className="text-center space-y-4 p-8">
                  <div className="w-24 h-24 mx-auto rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center animate-pulse">
                    <Play className="h-12 w-12 text-white" />
                  </div>
                  <h3 className="text-2xl font-bold text-white" style={{ fontFamily: "Fredoka, sans-serif" }}>Demo Video Coming Soon!</h3>
                  <p className="text-white/90 max-w-md mx-auto" style={{ fontFamily: "Outfit, sans-serif" }}>
                    We're creating an amazing product walkthrough to show you how Storyling.ai transforms vocabulary into immersive stories.
                  </p>
                </div>
              </div>
            </div>
            <div className="p-6 bg-gray-50 border-t border-gray-100">
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-center sm:text-left">
                  <h4 className="font-semibold text-gray-800" style={{ fontFamily: "Fredoka, sans-serif" }}>Ready to start learning?</h4>
                  <p className="text-sm text-gray-500" style={{ fontFamily: "Outfit, sans-serif" }}>Create your first story in minutes</p>
                </div>
                <Button
                  onClick={() => { setShowDemoModal(false); setLocation("/app"); }}
                  className="rounded-full px-6 py-3 text-white border-0 transition-all shadow-lg font-bold"
                  style={{ background: "linear-gradient(135deg, #7C3AED, #4F46E5)", fontFamily: "Fredoka, sans-serif" }}
                >
                  Start Learning Free
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
