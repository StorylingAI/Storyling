import { useEffect, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { ArrowRight, BookOpen, Flame, Settings, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuickStartTutorial } from "@/components/QuickStartTutorial";
import { useChallengeDetection } from "@/hooks/useChallengeDetection";
import { PremiumWelcomeModal } from "@/components/PremiumWelcomeModal";
import { WeeklyGoalOnboarding } from "@/components/WeeklyGoalOnboarding";

const BG_DESKTOP = "/images/storyling_desktop_bg.png";
const BG_MOBILE = "/images/storyBgBig.png";
const DESKTOP_ART_ASPECT_RATIO = 1536 / 1024;
const DESKTOP_ART_HEIGHT_RATIO = 1 / DESKTOP_ART_ASPECT_RATIO;
const MOBILE_ART_ASPECT_RATIO = 1728 / 2480;

interface Building {
  id: string;
  label: string;
  fullLabel: string;
  description: string;
  path: string;
  desktop: { left: number; top: number; width: number; height: number };
  mobile: { left: number; top: number; width: number; height: number };
  zoomTarget: { x: number; y: number };
}

const BUILDINGS: Building[] = [
  {
    id: "create",
    label: "Create Story",
    fullLabel: "Create Story",
    description:
      "Write your own adventure story in any language and let AI guide the journey.",
    path: "/create",
    desktop: { left: 66, top: 33, width: 25, height: 44 },
    mobile: { left: 28, top: 11, width: 44, height: 24 },
    zoomTarget: { x: 80, y: 56 },
  },
  {
    id: "library",
    label: "Your Stories",
    fullLabel: "Your Stories",
    description:
      "Open your saved stories, continue reading, and revisit your latest adventures.",
    path: "/library",
    desktop: { left: 33, top: 20, width: 33, height: 35 },
    mobile: { left: 12, top: 35, width: 34, height: 23 },
    zoomTarget: { x: 49, y: 39 },
  },
  {
    id: "wordbank",
    label: "Word Bank",
    fullLabel: "Word Bank",
    description:
      "Review and practice the vocabulary you collected across your stories.",
    path: "/wordbank",
    desktop: { left: 19, top: 38, width: 25, height: 40 },
    mobile: { left: 48, top: 38, width: 32, height: 22 },
    zoomTarget: { x: 31, y: 58 },
  },
  {
    id: "chat",
    label: "Chat with Booki",
    fullLabel: "Chat with Booki",
    description:
      "Practice conversation with Booki whenever you want a language buddy.",
    path: "__chat__",
    desktop: { left: 45, top: 43, width: 21, height: 29 },
    mobile: { left: 31, top: 59, width: 38, height: 22 },
    zoomTarget: { x: 55, y: 63 },
  },
  {
    id: "profile",
    label: "Profile",
    fullLabel: "Profile",
    description:
      "Manage your account, track progress, and customize your learning setup.",
    path: "/profile",
    desktop: { left: 38, top: 42, width: 20, height: 30 },
    mobile: { left: 35, top: 55, width: 25, height: 25 },
    zoomTarget: { x: 48, y: 75 },
  },
];

const MOBILE_SCENE_BUILDINGS = BUILDINGS.filter(
  building => building.id !== "profile"
);
const DESKTOP_SCENE_BUILDINGS = BUILDINGS.filter(
  building => building.id !== "profile"
);

const DESKTOP_SPARKLES = [
  { left: 12, top: 18, size: 5, delay: "0.1s" },
  { left: 24, top: 12, size: 6, delay: "0.8s" },
  { left: 40, top: 22, size: 4, delay: "1.2s" },
  { left: 62, top: 16, size: 5, delay: "0.5s" },
  { left: 78, top: 24, size: 4, delay: "1.6s" },
  { left: 88, top: 10, size: 6, delay: "0.4s" },
  { left: 17, top: 62, size: 4, delay: "1.8s" },
  { left: 32, top: 76, size: 5, delay: "0.7s" },
  { left: 58, top: 70, size: 6, delay: "1.4s" },
  { left: 74, top: 62, size: 4, delay: "0.2s" },
];

const DESKTOP_FIREFLIES = [
  { left: 10, top: 44, size: 10, duration: "12s", delay: "0s" },
  { left: 24, top: 68, size: 8, duration: "14s", delay: "1.2s" },
  { left: 39, top: 54, size: 9, duration: "16s", delay: "0.8s" },
  { left: 56, top: 30, size: 11, duration: "15s", delay: "1.6s" },
  { left: 76, top: 58, size: 10, duration: "18s", delay: "0.6s" },
  { left: 89, top: 42, size: 8, duration: "13s", delay: "1.4s" },
];

const DESKTOP_LANTERNS = [
  { left: 7, top: 52, size: 30, color: "255,180,80" },
  { left: 18, top: 40, size: 24, color: "255,190,90" },
  { left: 42, top: 68, size: 20, color: "255,200,100" },
  { left: 58, top: 48, size: 18, color: "180,200,255" },
  { left: 73, top: 55, size: 28, color: "255,170,70" },
  { left: 88, top: 50, size: 22, color: "255,185,85" },
];

const MOBILE_SPARKLES = [
  { left: 18, top: 10, size: 6, delay: "0s" },
  { left: 77, top: 12, size: 4, delay: "0.8s" },
  { left: 23, top: 44, size: 5, delay: "1.4s" },
  { left: 73, top: 56, size: 6, delay: "0.4s" },
  { left: 64, top: 78, size: 4, delay: "1.1s" },
  { left: 34, top: 90, size: 5, delay: "1.8s" },
];

function BuildingHotspot({
  building,
  onClick,
  onHover,
  onLeave,
  isHovered,
  entranceDelay,
  worldReady,
}: {
  building: Building;
  onClick: () => void;
  onHover: () => void;
  onLeave: () => void;
  isHovered: boolean;
  entranceDelay: number;
  worldReady: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onTouchStart={onHover}
      className="absolute inset-0 focus:outline-none"
      style={{ minWidth: 48, minHeight: 48, cursor: "pointer" }}
      aria-label={building.fullLabel}
      title={building.fullLabel}
    >
      <div
        className="absolute inset-0 rounded-[40px] pointer-events-none"
        style={{
          opacity: worldReady ? 1 : 0,
          transition: `opacity 0.45s ease ${entranceDelay}s, transform 0.25s ease, box-shadow 0.25s ease, background 0.25s ease`,
          background: isHovered
            ? "radial-gradient(circle at center, rgba(255,236,181,0.3) 0%, rgba(255,214,128,0.16) 38%, rgba(255,214,128,0.05) 68%, transparent 100%)"
            : "transparent",
          boxShadow: isHovered
            ? "0 0 0 1px rgba(255,236,187,0.26), 0 0 44px rgba(255,212,123,0.22), inset 0 0 32px rgba(255,236,187,0.14)"
            : "none",
          transform: isHovered ? "scale(1.015)" : "scale(1)",
        }}
      />
    </button>
  );
}

function MobileBuildingHotspot({
  building,
  onClick,
  onHover,
  onLeave,
  isHovered,
  entranceDelay,
  worldReady,
}: {
  building: Building;
  onClick: () => void;
  onHover: () => void;
  onLeave: () => void;
  isHovered: boolean;
  entranceDelay: number;
  worldReady: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onTouchStart={onHover}
      onTouchEnd={onLeave}
      className="absolute inset-0 rounded-[32px] focus:outline-none"
      style={{ minWidth: 48, minHeight: 48 }}
      aria-label={building.fullLabel}
    >
      <div
        className="absolute inset-0 rounded-[32px] pointer-events-none transition-all duration-300"
        style={{
          opacity: worldReady ? 1 : 0,
          transitionDelay: `${entranceDelay}s`,
          background: isHovered
            ? "radial-gradient(circle at center, rgba(255,238,192,0.22) 0%, rgba(255,204,108,0.14) 45%, rgba(255,191,106,0.04) 72%, transparent 100%)"
            : "transparent",
          boxShadow: isHovered
            ? "0 0 0 1px rgba(255,237,188,0.35), 0 0 28px rgba(255,209,120,0.32), inset 0 0 36px rgba(255,232,176,0.18)"
            : "none",
          transform: isHovered ? "scale(1.02)" : "scale(1)",
        }}
      />
      <div
        className="absolute left-1/2 top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full pointer-events-none"
        style={{
          opacity: worldReady ? 0.9 : 0,
          background:
            "radial-gradient(circle, rgba(255,246,214,0.98) 0%, rgba(255,214,120,0.9) 35%, rgba(255,214,120,0.24) 60%, transparent 100%)",
          boxShadow:
            "0 0 10px rgba(255,220,128,0.55), 0 0 18px rgba(255,211,120,0.28)",
          animation: `hotspot-pulse 2.8s ease-in-out ${entranceDelay}s infinite`,
        }}
      />
    </button>
  );
}

export default function AdventureMap() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [showPremiumWelcome, setShowPremiumWelcome] = useState(false);
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null);
  const [hoveredNavItem, setHoveredNavItem] = useState<string | null>(null);
  const [isContinueCtaHovered, setIsContinueCtaHovered] = useState(false);
  const [worldReady, setWorldReady] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [zoomState, setZoomState] = useState<{
    active: boolean;
    targetX: number;
    targetY: number;
  }>({
    active: false,
    targetX: 50,
    targetY: 50,
  });

  useChallengeDetection();

  useEffect(() => {
    const timeout = setTimeout(() => setWorldReady(true), 250);
    return () => clearTimeout(timeout);
  }, []);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const utils = trpc.useUtils();

  useEffect(() => {
    if (!user || !isAuthenticated) return;

    const params = new URLSearchParams(window.location.search);
    if (params.get("subscription") !== "success") return;

    window.history.replaceState({}, "", "/app");

    let attempts = 0;
    const pollInterval = window.setInterval(async () => {
      attempts += 1;
      await utils.auth.me.invalidate();
      const updatedUser = await utils.auth.me.fetch();

      if (updatedUser?.subscriptionTier === "premium") {
        window.clearInterval(pollInterval);
        if (!updatedUser.premiumOnboardingCompleted)
          setShowPremiumWelcome(true);
        return;
      }

      if (attempts >= 10) {
        window.clearInterval(pollInterval);
        setShowPremiumWelcome(true);
      }
    }, 1000);

    return () => window.clearInterval(pollInterval);
  }, [user, isAuthenticated, utils]);

  const { data: progressData } = trpc.progress.get.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: continueStory } =
    trpc.storyProgress.getMostRecentInProgress.useQuery(undefined, {
      enabled: isAuthenticated,
    });

  const progress =
    progressData && progressData.length > 0
      ? {
          currentStreak: Math.max(
            ...progressData.map((p: any) => p.currentStreak)
          ),
          storiesThisWeek: progressData.reduce(
            (sum: number, p: any) => sum + p.totalStoriesGenerated,
            0
          ),
        }
      : { currentStreak: 0, storiesThisWeek: 0 };

  const currentStreak = progress.currentStreak;
  const weeklyGoal = 5;
  const storiesThisWeek = progress.storiesThisWeek;
  const continueTitle = continueStory?.title || continueStory?.theme || null;
  const continueId = continueStory?.id;
  const weeklyProgress = Math.min((storiesThisWeek / weeklyGoal) * 100, 100);
  const continuePath = continueId ? `/content/${continueId}` : "/library";
  const continueButtonStyle = {
    fontFamily: "Fredoka, sans-serif",
    background: isContinueCtaHovered
      ? "linear-gradient(180deg, rgba(255,255,255,0.34) 0%, rgba(243,249,255,0.2) 100%)"
      : "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(235,244,255,0.1) 100%)",
    border: isContinueCtaHovered
      ? "1px solid rgba(255,255,255,0.4)"
      : "1px solid rgba(255,255,255,0.24)",
    boxShadow: isContinueCtaHovered
      ? "0 14px 30px rgba(16,10,45,0.24), inset 0 1px 0 rgba(255,255,255,0.44), 0 0 0 1px rgba(191,230,255,0.18)"
      : "0 10px 24px rgba(16,10,45,0.16), inset 0 1px 0 rgba(255,255,255,0.32)",
    backdropFilter: "blur(16px)",
  };
  const profilePath = user?.id ? `/profile/${user.id}` : "/settings";
  const desktopNavItems = [
    { label: "Home", path: "/app", active: true },
    { label: "Library", path: "/library", active: false },
    { label: "Word Bank", path: "/wordbank", active: false },
    { label: "Profile", path: profilePath, active: false },
  ];

  const handleBuildingClick = (building: Building) => {
    setZoomState({
      active: true,
      targetX: building.zoomTarget.x,
      targetY: building.zoomTarget.y,
    });
    const navigationDelay = isMobile ? 180 : 400;

    window.setTimeout(() => {
      if (building.path === "__chat__") {
        window.dispatchEvent(new CustomEvent("open-booki-chat"));
      } else if (building.path === "/profile" && user?.id) {
        setLocation(`/profile/${user.id}`);
      } else {
        setLocation(building.path);
      }

      window.setTimeout(
        () => setZoomState({ active: false, targetX: 50, targetY: 50 }),
        120
      );
    }, navigationDelay);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-magical flex items-center justify-center">
        <div className="text-center space-y-4">
          <img
            src={APP_LOGO}
            alt="Loading"
            className="h-24 w-24 mx-auto animate-float"
          />
          <div className="loading-fun mx-auto" />
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-magical flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-2xl shadow-magical border-0 overflow-hidden">
          <div className="h-2 gradient-primary" />
          <CardContent className="pt-10 pb-10 text-center space-y-6">
            <img
              src={APP_LOGO}
              alt="Storyling.ai"
              className="h-28 w-28 mx-auto animate-float"
            />
            <div>
              <h2
                className="text-3xl font-bold mb-2 text-gray-900"
                style={{ fontFamily: "Fredoka, sans-serif" }}
              >
                Welcome to {APP_TITLE}
              </h2>
              <p
                className="text-gray-500 text-lg"
                style={{ fontFamily: "Fredoka, sans-serif" }}
              >
                Sign in to start your language learning journey.
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => (window.location.href = getLoginUrl())}
              className="rounded-full gradient-primary text-white hover-lift active-scale border-0 h-14 px-8 text-lg shadow-magical transition-all"
              style={{ fontFamily: "Fredoka, sans-serif" }}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              Sign In to Continue
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      <style>{`
        @keyframes world-fade-in {
          0% { opacity: 0; }
          100% { opacity: 1; }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0.2; transform: scale(0.7); }
          50% { opacity: 1; transform: scale(1.1); }
        }
        @keyframes hotspot-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(0.92); opacity: 0.6; }
          50% { transform: translate(-50%, -50%) scale(1.18); opacity: 1; }
        }
        @keyframes firefly-wander {
          0% { transform: translate(0, 0) scale(1); opacity: 0.35; }
          25% { transform: translate(12px, -18px) scale(1.18); opacity: 0.75; }
          50% { transform: translate(-8px, -10px) scale(0.9); opacity: 0.5; }
          75% { transform: translate(16px, 10px) scale(1.08); opacity: 0.8; }
          100% { transform: translate(0, 0) scale(1); opacity: 0.35; }
        }
        @keyframes lantern-flicker {
          0%, 100% { opacity: 0.55; transform: translate(-50%, -50%) scale(1); }
          35% { opacity: 0.92; transform: translate(-50%, -50%) scale(1.12); }
          70% { opacity: 0.65; transform: translate(-50%, -50%) scale(0.97); }
        }
        @keyframes title-shimmer {
          0%, 100% { text-shadow: 0 2px 10px rgba(79, 50, 135, 0.45), 0 0 18px rgba(255, 222, 146, 0.28); }
          50% { text-shadow: 0 2px 14px rgba(79, 50, 135, 0.62), 0 0 26px rgba(255, 222, 146, 0.4); }
        }
      `}</style>

      <QuickStartTutorial />
      <WeeklyGoalOnboarding />
      <PremiumWelcomeModal
        open={showPremiumWelcome}
        onClose={() => setShowPremiumWelcome(false)}
      />

      <div
        className="relative"
        style={{ height: "100dvh", overflow: "hidden" }}
      >
        {!isMobile ? (
          <div
            className="relative h-full w-full overflow-hidden"
            style={{ background: "#130f32" }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${BG_DESKTOP})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                filter: "blur(30px) brightness(0.7)",
                transform: "scale(1.08)",
              }}
            />

            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 50% 12%, rgba(128,110,255,0.18) 0%, transparent 38%), linear-gradient(180deg, rgba(15,10,38,0.42) 0%, rgba(15,10,38,0.12) 22%, rgba(15,10,38,0.16) 100%)",
              }}
            />

            <div className="absolute inset-0 overflow-hidden">
              <div
                className="absolute left-1/2 top-1/2 overflow-hidden"
                style={{
                  width: `max(100vw, calc(100dvh * ${DESKTOP_ART_ASPECT_RATIO}))`,
                  height: `max(100dvh, calc(100vw * ${DESKTOP_ART_HEIGHT_RATIO}))`,
                  transform: `translate(-50%, -50%) scale(${zoomState.active ? 1.24 : 1})`,
                  transformOrigin: `${zoomState.targetX}% ${zoomState.targetY}%`,
                  transition: "transform 0.4s ease-out, transform-origin 0.1s",
                  animation: "world-fade-in 0.3s ease-out both",
                }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    backgroundImage: `url(${BG_DESKTOP})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                  }}
                />

                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(16, 10, 45, 0.08) 0%, rgba(16, 10, 45, 0.02) 16%, transparent 30%, transparent 78%, rgba(16, 10, 45, 0.16) 100%)",
                  }}
                />

                <nav
                  className="absolute z-30 flex items-center justify-between px-6 py-4"
                  style={{
                    left: "max(0px, calc((100% - 100vw) / 2))",
                    right: "max(0px, calc((100% - 100vw) / 2))",
                    top: "max(0px, calc((100% - 100dvh) / 2))",
                    opacity: worldReady ? 1 : 0,
                    transition: "opacity 0.5s ease 0.15s",
                  }}
                >
                  <div className="flex items-center gap-3 shrink-0">
                    <div
                      className="flex h-12 w-12 items-center justify-center rounded-xl"
                      style={{
                        background:
                          "linear-gradient(180deg, rgba(255,248,234,0.28) 0%, rgba(210,208,255,0.12) 100%)",
                        border: "1px solid rgba(255,255,255,0.22)",
                        boxShadow:
                          "0 8px 20px rgba(18,12,47,0.22), inset 0 1px 0 rgba(255,255,255,0.34)",
                        backdropFilter: "blur(14px)",
                      }}
                    >
                      <img
                        src={APP_LOGO}
                        alt=""
                        className="h-9 w-9 object-contain"
                      />
                    </div>

                    <span
                      className="text-[23px] font-bold text-[#F8EDE2]"
                      style={{
                        fontFamily: 'Georgia, "Times New Roman", serif',
                        textShadow: "0 3px 10px rgba(0,0,0,0.35)",
                      }}
                    >
                      {APP_TITLE}
                    </span>
                  </div>

                  <div
                    className="hidden items-center gap-2 rounded-[18px] px-3 py-2 lg:flex"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(229,228,255,0.12) 100%)",
                      border: "1px solid rgba(255,255,255,0.24)",
                      boxShadow:
                        "0 16px 36px rgba(18,12,47,0.2), inset 0 1px 0 rgba(255,255,255,0.28)",
                      backdropFilter: "blur(18px)",
                    }}
                  >
                    {desktopNavItems.map(nav => {
                      const isHovered = hoveredNavItem === nav.label;
                      const isHighlighted = nav.active || isHovered;

                      return (
                        <button
                          key={nav.label}
                          type="button"
                          onClick={() => setLocation(nav.path)}
                          onMouseEnter={() => setHoveredNavItem(nav.label)}
                          onMouseLeave={() => setHoveredNavItem(current =>
                            current === nav.label ? null : current
                          )}
                          onFocus={() => setHoveredNavItem(nav.label)}
                          onBlur={() => setHoveredNavItem(current =>
                            current === nav.label ? null : current
                          )}
                          className="group relative overflow-hidden rounded-[14px] px-6 py-2.5 text-[15px] font-semibold transition-all duration-200 hover:-translate-y-0.5 focus-visible:ring-2 focus-visible:ring-white/70"
                          style={{
                            fontFamily: "Fredoka, sans-serif",
                            color: isHighlighted
                              ? "#FFFFFF"
                              : "rgba(255,255,255,0.82)",
                            background: nav.active
                              ? isHovered
                                ? "linear-gradient(180deg, rgba(255,255,255,0.46) 0%, rgba(255,255,255,0.24) 100%)"
                                : "linear-gradient(180deg, rgba(255,255,255,0.38) 0%, rgba(255,255,255,0.18) 100%)"
                              : isHovered
                                ? "linear-gradient(180deg, rgba(255,255,255,0.24) 0%, rgba(255,255,255,0.1) 100%)"
                                : "transparent",
                            boxShadow: nav.active
                              ? isHovered
                                ? "inset 0 1px 0 rgba(255,255,255,0.42), 0 10px 22px rgba(18,12,47,0.2), 0 0 0 1px rgba(255,255,255,0.12)"
                                : "inset 0 1px 0 rgba(255,255,255,0.34), 0 8px 18px rgba(18,12,47,0.16)"
                              : isHovered
                                ? "inset 0 1px 0 rgba(255,255,255,0.28), 0 8px 18px rgba(18,12,47,0.16)"
                                : "none",
                          }}
                        >
                          <span
                            aria-hidden="true"
                            className="pointer-events-none absolute inset-0 rounded-[14px] transition-opacity duration-200"
                            style={{
                              opacity: isHovered ? 1 : nav.active ? 0.5 : 0,
                              background:
                                "linear-gradient(180deg, rgba(255,255,255,0.14) 0%, rgba(255,255,255,0.02) 100%)",
                            }}
                          />
                          <span className="relative">{nav.label}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => setLocation("/create")}
                      className="flex items-center rounded-full px-6 py-3 text-[15px] font-bold text-white transition-all hover:brightness-110 active:scale-[0.97]"
                      style={{
                        fontFamily: "Fredoka, sans-serif",
                        background:
                          "linear-gradient(135deg, rgba(132,95,255,0.98) 0%, rgba(189,92,255,0.98) 100%)",
                        border: "1px solid rgba(255,255,255,0.18)",
                        boxShadow:
                          "0 10px 26px rgba(152,101,255,0.45), inset 0 1px 0 rgba(255,255,255,0.3)",
                      }}
                    >
                      Create Story
                    </button>

                    <button
                      type="button"
                      onClick={() => setLocation("/settings")}
                      className="flex h-12 w-12 items-center justify-center rounded-full transition-all hover:brightness-110 active:scale-[0.97]"
                      style={{
                        color: "#F5F0FF",
                        background:
                          "linear-gradient(180deg, rgba(255,255,255,0.26) 0%, rgba(226,227,255,0.12) 100%)",
                        border: "1px solid rgba(255,255,255,0.24)",
                        boxShadow:
                          "0 12px 26px rgba(18,12,47,0.2), inset 0 1px 0 rgba(255,255,255,0.34)",
                        backdropFilter: "blur(16px)",
                      }}
                      aria-label="Open settings"
                    >
                      <Settings className="h-5 w-5" />
                    </button>
                  </div>
                </nav>

                <div
                  className="absolute z-20 flex"
                  style={{
                    left: "max(20px, calc((100% - 100vw) / 2 + 20px))",
                    top: "max(102px, calc((100% - 100dvh) / 2 + 102px))",
                    bottom: "max(20px, calc((100% - 100dvh) / 2 + 20px))",
                    width: "clamp(190px, 15vw, 214px)",
                    opacity: worldReady ? 1 : 0,
                    transition: "opacity 0.6s ease 0.3s",
                  }}
                >
                  <div
                    className="relative flex w-full flex-col justify-between overflow-hidden rounded-[18px] px-5 py-5"
                    style={{
                      background:
                        "linear-gradient(180deg, rgba(255,255,255,0.2) 0%, rgba(204,230,255,0.1) 18%, rgba(255,255,255,0.08) 100%)",
                      border: "1px solid rgba(255,255,255,0.22)",
                      boxShadow:
                        "0 18px 46px rgba(16, 10, 45, 0.28), inset 0 1px 0 rgba(255,255,255,0.3)",
                      backdropFilter: "blur(24px)",
                    }}
                  >
                    <div
                      className="absolute inset-0 pointer-events-none"
                      style={{
                        background:
                          "radial-gradient(circle at 35% 18%, rgba(255,255,255,0.2) 0%, transparent 22%), radial-gradient(circle at 70% 74%, rgba(149,223,255,0.16) 0%, transparent 26%)",
                      }}
                    />

                    <div className="relative space-y-5">
                      <div className="flex justify-center">
                        <div
                          className="flex h-24 w-24 items-center justify-center rounded-full"
                          style={{
                            background:
                              "linear-gradient(180deg, rgba(255,255,255,0.88) 0%, rgba(225,223,255,0.7) 100%)",
                            border: "3px solid rgba(255,255,255,0.52)",
                            boxShadow:
                              "0 12px 24px rgba(16,10,45,0.18), inset 0 1px 0 rgba(255,255,255,0.72)",
                          }}
                        >
                          <img
                            src={APP_LOGO}
                            alt=""
                            className="h-16 w-16 object-contain"
                          />
                        </div>
                      </div>

                      <div
                        className="space-y-4"
                        style={{ fontFamily: "Fredoka, sans-serif" }}
                      >
                        <div className="flex items-center gap-2 text-[16px] font-semibold text-white">
                          <Flame className="h-4 w-4 text-[#FFB25F]" />
                          <span>{currentStreak} day streak</span>
                        </div>

                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-[16px] font-medium text-white/90">
                            <BookOpen className="h-4 w-4 text-[#B9F0FF]" />
                            <span>
                              {storiesThisWeek}/{weeklyGoal} stories this week
                            </span>
                          </div>

                          <div
                            className="overflow-hidden rounded-full"
                            style={{
                              height: 12,
                              background: "rgba(255,255,255,0.22)",
                              boxShadow: "inset 0 2px 6px rgba(16,10,45,0.14)",
                            }}
                          >
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{
                                width: `${weeklyProgress}%`,
                                background:
                                  "linear-gradient(90deg, #A855F7 0%, #D946EF 100%)",
                                boxShadow: "0 0 18px rgba(212,119,255,0.42)",
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setLocation(continuePath)}
                        onMouseEnter={() => setIsContinueCtaHovered(true)}
                        onMouseLeave={() => setIsContinueCtaHovered(false)}
                        onFocus={() => setIsContinueCtaHovered(true)}
                        onBlur={() => setIsContinueCtaHovered(false)}
                        className="group relative flex w-full items-center justify-center gap-2 overflow-hidden rounded-full px-4 py-3 text-[15px] font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:scale-[1.01] focus-visible:ring-2 focus-visible:ring-white/70 active:scale-[0.97]"
                        style={continueButtonStyle}
                        title={
                          continueTitle
                            ? `Continue ${continueTitle}`
                            : "Continue reading"
                        }
                      >
                        <span
                          aria-hidden="true"
                          className="pointer-events-none absolute inset-0 rounded-full transition-opacity duration-200"
                          style={{
                            opacity: isContinueCtaHovered ? 1 : 0,
                            background:
                              "linear-gradient(180deg, rgba(255,255,255,0.18) 0%, rgba(190,233,255,0.08) 100%)",
                          }}
                        />
                        <span className="relative">Continue Reading</span>
                        <ArrowRight className="relative h-4 w-4 transition-transform duration-200 group-hover:translate-x-1" />
                      </button>
                    </div>
                  </div>
                </div>

                {DESKTOP_SCENE_BUILDINGS.map((building, index) => {
                  const zone = building.desktop;
                  return (
                    <div
                      key={building.id}
                      style={{
                        position: "absolute",
                        left: `${zone.left}%`,
                        top: `${zone.top}%`,
                        width: `${zone.width}%`,
                        height: `${zone.height}%`,
                        zIndex: 10,
                      }}
                    >
                      <BuildingHotspot
                        building={building}
                        onClick={() => handleBuildingClick(building)}
                        onHover={() => setHoveredBuilding(building.id)}
                        onLeave={() =>
                          setHoveredBuilding(current =>
                            current === building.id ? null : current
                          )
                        }
                        isHovered={hoveredBuilding === building.id}
                        entranceDelay={0.25 + index * 0.08}
                        worldReady={worldReady}
                      />
                    </div>
                  );
                })}

                {worldReady && (
                  <div className="absolute inset-0 pointer-events-none">
                    {DESKTOP_SPARKLES.map((sparklePoint, index) => (
                      <div
                        key={`desktop-sparkle-${index}`}
                        className="absolute rounded-full"
                        style={{
                          width: sparklePoint.size,
                          height: sparklePoint.size,
                          left: `${sparklePoint.left}%`,
                          top: `${sparklePoint.top}%`,
                          background:
                            "radial-gradient(circle, rgba(255,242,199,0.95) 0%, rgba(255,212,112,0.82) 35%, rgba(255,212,112,0.18) 65%, transparent 100%)",
                          boxShadow: "0 0 10px rgba(255,217,128,0.42)",
                          animation: `sparkle 2.8s ease-in-out ${sparklePoint.delay} infinite`,
                        }}
                      />
                    ))}

                    {DESKTOP_FIREFLIES.map((firefly, index) => (
                      <div
                        key={`desktop-firefly-${index}`}
                        className="absolute rounded-full"
                        style={{
                          width: firefly.size,
                          height: firefly.size,
                          left: `${firefly.left}%`,
                          top: `${firefly.top}%`,
                          background:
                            "radial-gradient(circle, rgba(255,226,146,0.45) 0%, rgba(255,226,146,0.18) 40%, transparent 75%)",
                          filter: "blur(0.6px)",
                          animation: `firefly-wander ${firefly.duration} ease-in-out ${firefly.delay} infinite`,
                        }}
                      />
                    ))}

                    {DESKTOP_LANTERNS.map((lantern, index) => (
                      <div
                        key={`desktop-lantern-${index}`}
                        className="absolute rounded-full"
                        style={{
                          width: lantern.size,
                          height: lantern.size,
                          left: `${lantern.left}%`,
                          top: `${lantern.top}%`,
                          transform: "translate(-50%, -50%)",
                          background: `radial-gradient(circle, rgba(${lantern.color},0.42) 0%, rgba(${lantern.color},0.16) 42%, transparent 74%)`,
                          animation: `lantern-flicker ${2.6 + index * 0.25}s ease-in-out ${index * 0.2}s infinite`,
                        }}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ background: "#6E5AB0" }}
          >
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${BG_MOBILE})`,
                backgroundSize: "cover",
                backgroundPosition: "center center",
                backgroundRepeat: "no-repeat",
                filter: "blur(18px)",
                transform: "scale(1.06)",
                animation: "world-fade-in 0.8s ease-out",
              }}
            />

            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "linear-gradient(180deg, rgba(52,29,90,0.26) 0%, rgba(52,29,90,0.06) 18%, transparent 34%, transparent 72%, rgba(40,25,69,0.18) 100%)",
              }}
            />

            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(circle at 50% 15%, rgba(255,240,196,0.12) 0%, rgba(255,240,196,0.04) 18%, transparent 36%), radial-gradient(circle at 50% 86%, rgba(255,240,196,0.12) 0%, rgba(255,240,196,0.04) 18%, transparent 34%)",
              }}
            />

            <div
              className="absolute inset-x-0 top-0 z-30 px-4"
              style={{
                paddingTop: "calc(env(safe-area-inset-top, 0px) + 16px)",
              }}
            >
              <div
                className="mx-auto flex max-w-md items-center gap-3 rounded-[26px] border px-3 py-3"
                style={{
                  borderColor: "rgba(255,255,255,0.34)",
                  background:
                    "linear-gradient(180deg, rgba(255,255,255,0.24) 0%, rgba(219,225,255,0.13) 100%)",
                  backdropFilter: "blur(18px)",
                  boxShadow:
                    "0 16px 36px rgba(31, 18, 69, 0.22), inset 0 1px 0 rgba(255,255,255,0.36)",
                }}
              >
                <div className="h-11 w-11 shrink-0" aria-hidden="true" />
                <div className="min-w-0 flex-1 text-center">
                  <h1
                    className="truncate text-[21px] font-semibold"
                    style={{
                      fontFamily: "Fredoka, sans-serif",
                      color: "#FFE7B3",
                      animation: "title-shimmer 3.6s ease-in-out infinite",
                    }}
                  >
                    {APP_TITLE}
                  </h1>
                </div>
                <button
                  type="button"
                  onClick={() => setLocation("/settings")}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full transition-transform active:scale-95"
                  style={{
                    background:
                      "linear-gradient(180deg, rgba(255,235,173,0.88) 0%, rgba(233,176,78,0.92) 100%)",
                    boxShadow:
                      "0 10px 22px rgba(74, 42, 18, 0.22), inset 0 1px 0 rgba(255,255,255,0.56)",
                  }}
                  aria-label="Open settings"
                >
                  <Settings className="h-5 w-5" style={{ color: "#6B4A1E" }} />
                </button>
              </div>
            </div>

            <div className="absolute inset-x-0 top-0 bottom-0 z-20 flex items-start justify-center px-0">
              <div
                className="relative h-full shrink-0"
                style={{
                  aspectRatio: `${MOBILE_ART_ASPECT_RATIO}`,
                }}
              >
                <img
                  src={BG_MOBILE}
                  alt="Storyling mobile world"
                  className="block h-full w-full object-cover"
                  style={{
                    animation: "world-fade-in 0.8s ease-out",
                    filter: "drop-shadow(0 20px 44px rgba(22, 13, 51, 0.22))",
                  }}
                />

                {worldReady && (
                  <div className="absolute inset-0 pointer-events-none">
                    {MOBILE_SPARKLES.map((sparklePoint, index) => (
                      <div
                        key={`mobile-sparkle-${index}`}
                        className="absolute rounded-full"
                        style={{
                          width: sparklePoint.size,
                          height: sparklePoint.size,
                          left: `${sparklePoint.left}%`,
                          top: `${sparklePoint.top}%`,
                          background:
                            "radial-gradient(circle, rgba(255,242,199,0.95) 0%, rgba(255,212,112,0.82) 35%, rgba(255,212,112,0.18) 65%, transparent 100%)",
                          boxShadow: "0 0 10px rgba(255,217,128,0.42)",
                          animation: `sparkle 2.8s ease-in-out ${sparklePoint.delay} infinite`,
                        }}
                      />
                    ))}
                  </div>
                )}

                {MOBILE_SCENE_BUILDINGS.map((building, index) => {
                  const zone = building.mobile;
                  return (
                    <div
                      key={building.id}
                      style={{
                        position: "absolute",
                        left: `${zone.left}%`,
                        top: `${zone.top}%`,
                        width: `${zone.width}%`,
                        height: `${zone.height}%`,
                      }}
                    >
                      <MobileBuildingHotspot
                        building={building}
                        onClick={() => handleBuildingClick(building)}
                        onHover={() => setHoveredBuilding(building.id)}
                        onLeave={() =>
                          setHoveredBuilding(current =>
                            current === building.id ? null : current
                          )
                        }
                        isHovered={hoveredBuilding === building.id}
                        entranceDelay={0.22 + index * 0.08}
                        worldReady={worldReady}
                      />
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
