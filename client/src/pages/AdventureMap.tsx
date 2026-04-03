import { useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { Settings, Sparkles } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuickStartTutorial } from "@/components/QuickStartTutorial";
import { useChallengeDetection } from "@/hooks/useChallengeDetection";
import { PremiumWelcomeModal } from "@/components/PremiumWelcomeModal";
import { WeeklyGoalOnboarding } from "@/components/WeeklyGoalOnboarding";

const BG_DESKTOP = "/images/dashboardBg2.webp";
const BG_MOBILE = "/images/storyling_mobileLargeBg.webp";
const DESKTOP_ART_ASPECT_RATIO = 1920 / 1389;
const DESKTOP_ART_HEIGHT_RATIO = 1 / DESKTOP_ART_ASPECT_RATIO;
const MOBILE_ART_ASPECT_RATIO = 800 / 890;
const DESKTOP_WORLD_VERTICAL_SHIFT = 72;

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
    desktop: { left: 1, top: 18, width: 42, height: 29 },
    mobile: { left: 7, top: 6, width: 64, height: 22 },
    zoomTarget: { x: 22, y: 27 },
  },
  {
    id: "library",
    label: "Your Stories",
    fullLabel: "Your Stories",
    description:
      "Open your saved stories, continue reading, and revisit your latest adventures.",
    path: "/library",
    desktop: { left: 71, top: 17, width: 27, height: 34 },
    mobile: { left: 14, top: 70, width: 42, height: 26 },
    zoomTarget: { x: 84, y: 29 },
  },
  {
    id: "wordbank",
    label: "Word Bank",
    fullLabel: "Word Bank",
    description:
      "Review and practice the vocabulary you collected across your stories.",
    path: "/wordbank",
    desktop: { left: 0, top: 48, width: 34, height: 32 },
    mobile: { left: 12, top: 28, width: 35, height: 18 },
    zoomTarget: { x: 16, y: 61 },
  },
  {
    id: "chat",
    label: "Chat with Booki",
    fullLabel: "Chat with Booki",
    description:
      "Practice conversation with Booki whenever you want a language buddy.",
    path: "__chat__",
    desktop: { left: 64, top: 51, width: 32, height: 31 },
    mobile: { left: 40, top: 52, width: 39, height: 18 },
    zoomTarget: { x: 80, y: 62 },
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

const DESKTOP_FAIRY_DUST = [
  { left: 15, top: 30, size: 6, duration: "8s", delay: "0s" },
  { left: 28, top: 55, size: 5, duration: "10s", delay: "1.2s" },
  { left: 45, top: 40, size: 7, duration: "9s", delay: "0.6s" },
  { left: 60, top: 65, size: 5, duration: "11s", delay: "1.8s" },
  { left: 72, top: 35, size: 6, duration: "8.5s", delay: "0.4s" },
  { left: 85, top: 50, size: 5, duration: "10.5s", delay: "1.4s" },
  { left: 20, top: 72, size: 5, duration: "9.5s", delay: "2.0s" },
  { left: 50, top: 20, size: 7, duration: "12s", delay: "0.8s" },
  { left: 35, top: 80, size: 5, duration: "7.5s", delay: "1.6s" },
  { left: 68, top: 25, size: 6, duration: "11s", delay: "0.2s" },
];

const DESKTOP_LIGHT_RAYS = [
  { left: 72, top: -5, angle: -25, width: 180, height: 600, delay: "0s", duration: "6s" },
  { left: 82, top: -5, angle: -18, width: 140, height: 550, delay: "2s", duration: "7s" },
  { left: 62, top: -5, angle: -32, width: 160, height: 580, delay: "4s", duration: "5.5s" },
];

const MOBILE_SPARKLES = [
  { left: 12, top: 8, size: 14, delay: "0s" },
  { left: 82, top: 10, size: 12, delay: "0.6s" },
  { left: 25, top: 28, size: 16, delay: "1.2s" },
  { left: 70, top: 35, size: 14, delay: "0.3s" },
  { left: 45, top: 18, size: 12, delay: "1.6s" },
  { left: 55, top: 52, size: 16, delay: "0.9s" },
  { left: 18, top: 65, size: 14, delay: "1.8s" },
  { left: 78, top: 72, size: 12, delay: "0.5s" },
  { left: 35, top: 85, size: 14, delay: "1.4s" },
  { left: 62, top: 90, size: 12, delay: "2.0s" },
];

const MOBILE_FIREFLIES = [
  { left: 10, top: 30, size: 18, duration: "10s", delay: "0s" },
  { left: 40, top: 50, size: 16, duration: "12s", delay: "0.8s" },
  { left: 70, top: 35, size: 20, duration: "11s", delay: "0.4s" },
  { left: 25, top: 70, size: 18, duration: "13s", delay: "1.2s" },
  { left: 80, top: 65, size: 16, duration: "9s", delay: "1.6s" },
  { left: 55, top: 20, size: 18, duration: "14s", delay: "0.6s" },
  { left: 15, top: 88, size: 16, duration: "11.5s", delay: "1.0s" },
  { left: 65, top: 80, size: 20, duration: "10.5s", delay: "1.8s" },
];

const MOBILE_LANTERNS = [
  { left: 15, top: 32, size: 50, color: "255,180,80" },
  { left: 50, top: 55, size: 44, color: "255,200,100" },
  { left: 80, top: 42, size: 48, color: "255,170,70" },
  { left: 30, top: 75, size: 40, color: "255,190,90" },
  { left: 70, top: 20, size: 44, color: "180,200,255" },
];

const MOBILE_FAIRY_DUST = [
  { left: 15, top: 30, size: 10, duration: "7s", delay: "0s" },
  { left: 45, top: 45, size: 12, duration: "8s", delay: "0.6s" },
  { left: 75, top: 25, size: 10, duration: "6.5s", delay: "1.0s" },
  { left: 30, top: 65, size: 12, duration: "9s", delay: "0.4s" },
  { left: 60, top: 15, size: 10, duration: "7.5s", delay: "1.4s" },
  { left: 20, top: 80, size: 12, duration: "8.5s", delay: "0.8s" },
  { left: 85, top: 55, size: 10, duration: "7s", delay: "1.6s" },
  { left: 50, top: 75, size: 12, duration: "6s", delay: "1.2s" },
  { left: 10, top: 50, size: 10, duration: "9.5s", delay: "2.0s" },
  { left: 68, top: 42, size: 12, duration: "8s", delay: "0.2s" },
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
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent<HTMLButtonElement>) => {
      const touch = e.touches[0];
      if (!touch) return;
      touchStartRef.current = { x: touch.clientX, y: touch.clientY };
      onHover();
    },
    [onHover]
  );

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent<HTMLButtonElement>) => {
      if (!touchStartRef.current) return;

      const touch = e.changedTouches[0];
      if (!touch) {
        touchStartRef.current = null;
        onLeave();
        return;
      }

      const dx = Math.abs(touch.clientX - touchStartRef.current.x);
      const dy = Math.abs(touch.clientY - touchStartRef.current.y);
      touchStartRef.current = null;

      // Ignore scroll gestures and only treat short movements as taps.
      if (dx < 15 && dy < 15) {
        e.preventDefault();
        onClick();
      }

      onLeave();
    },
    [onClick, onLeave]
  );

  return (
    <button
      type="button"
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      onTouchCancel={onLeave}
      className="absolute inset-0 rounded-[32px] focus:outline-none"
      style={{
        minWidth: 48,
        minHeight: 48,
        cursor: "pointer",
        touchAction: "manipulation",
        WebkitTapHighlightColor: "transparent",
        zIndex: 30,
      }}
      aria-label={building.fullLabel}
      title={building.fullLabel}
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

  // Burst particles on click
  const [burstParticles, setBurstParticles] = useState<{ id: number; x: number; y: number; particles: { bx: string; by: string; color: string }[] }[]>([]);
  const burstIdRef = useRef(0);

  const handleMagicBurst = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    const x = clientX;
    const y = clientY;
    const id = burstIdRef.current++;
    const colors = ["rgba(255,222,146,0.9)", "rgba(255,180,80,0.85)", "rgba(200,170,255,0.8)", "rgba(120,200,255,0.8)", "rgba(255,255,255,0.9)"];
    const particles = Array.from({ length: 12 }, () => {
      const angle = Math.random() * Math.PI * 2;
      const dist = 30 + Math.random() * 50;
      return {
        bx: `${Math.cos(angle) * dist}px`,
        by: `${Math.sin(angle) * dist}px`,
        color: colors[Math.floor(Math.random() * colors.length)],
      };
    });
    setBurstParticles(prev => [...prev, { id, x, y, particles }]);
    setTimeout(() => setBurstParticles(prev => prev.filter(b => b.id !== id)), 700);
  }, []);

  // Parallax — mouse (desktop) / gyroscope (mobile)
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (window.innerWidth >= 768) {
      // Desktop: mousemove
      const handleMouseMove = (e: MouseEvent) => {
        const cx = (e.clientX / window.innerWidth - 0.5) * 2;  // -1 to 1
        const cy = (e.clientY / window.innerHeight - 0.5) * 2;
        setParallax({ x: cx * 18, y: cy * 12 });
      };
      window.addEventListener("mousemove", handleMouseMove);
      return () => window.removeEventListener("mousemove", handleMouseMove);
    } else {
      // Mobile: gyroscope
      let initialBeta: number | null = null;
      let initialGamma: number | null = null;
      const handleOrientation = (e: DeviceOrientationEvent) => {
        if (e.beta === null || e.gamma === null) return;
        if (initialBeta === null) { initialBeta = e.beta; initialGamma = e.gamma; }
        const dx = Math.max(-1, Math.min(1, ((e.gamma! - initialGamma!) / 20)));
        const dy = Math.max(-1, Math.min(1, ((e.beta - initialBeta) / 15)));
        setParallax({ x: dx * 15, y: dy * 10 });
      };
      window.addEventListener("deviceorientation", handleOrientation);
      return () => window.removeEventListener("deviceorientation", handleOrientation);
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setWorldReady(true), 250);
    return () => clearTimeout(timeout);
  }, []);

  const [isLandscapeMobile, setIsLandscapeMobile] = useState(
    () => window.innerWidth >= 768 && window.innerHeight < 500
  );

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
      setIsLandscapeMobile(window.innerWidth >= 768 && window.innerHeight < 500);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    const previousHtmlOverflow = document.documentElement.style.overflow;
    const previousBodyOverflow = document.body.style.overflow;
    const previousHtmlOverscroll =
      document.documentElement.style.overscrollBehavior;
    const previousBodyOverscroll = document.body.style.overscrollBehavior;

    const keepViewportAtTop = () => {
      if (window.scrollX !== 0 || window.scrollY !== 0) {
        window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      }
    };

    document.documentElement.style.overflow = "hidden";
    document.body.style.overflow = "hidden";
    document.documentElement.style.overscrollBehavior = "none";
    document.body.style.overscrollBehavior = "none";
    keepViewportAtTop();
    window.addEventListener("scroll", keepViewportAtTop, true);

    return () => {
      window.removeEventListener("scroll", keepViewportAtTop, true);
      document.documentElement.style.overflow = previousHtmlOverflow;
      document.body.style.overflow = previousBodyOverflow;
      document.documentElement.style.overscrollBehavior =
        previousHtmlOverscroll;
      document.body.style.overscrollBehavior = previousBodyOverscroll;
    };
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
      } else if (building.path === "/profile") {
        setLocation("/settings");
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
          0%, 100% { opacity: 0.3; transform: scale(0.6); filter: blur(0px); }
          50% { opacity: 1; transform: scale(1.3); filter: blur(0.5px); }
        }
        @keyframes hotspot-pulse {
          0%, 100% { transform: translate(-50%, -50%) scale(0.92); opacity: 0.6; }
          50% { transform: translate(-50%, -50%) scale(1.18); opacity: 1; }
        }
        @keyframes firefly-wander {
          0% { transform: translate(0, 0) scale(1); opacity: 0.5; }
          25% { transform: translate(25px, -35px) scale(1.4); opacity: 1; }
          50% { transform: translate(-18px, -20px) scale(0.8); opacity: 0.6; }
          75% { transform: translate(30px, 20px) scale(1.3); opacity: 0.9; }
          100% { transform: translate(0, 0) scale(1); opacity: 0.5; }
        }
        @keyframes lantern-flicker {
          0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
          35% { opacity: 1; transform: translate(-50%, -50%) scale(1.25); }
          70% { opacity: 0.7; transform: translate(-50%, -50%) scale(0.95); }
        }
        @keyframes title-shimmer {
          0%, 100% { text-shadow: 0 2px 10px rgba(79, 50, 135, 0.45), 0 0 18px rgba(255, 222, 146, 0.28); }
          50% { text-shadow: 0 2px 14px rgba(79, 50, 135, 0.62), 0 0 26px rgba(255, 222, 146, 0.4); }
        }
        @keyframes fairy-dust-rise {
          0% { transform: translateY(0) translateX(0) scale(1); opacity: 0; }
          10% { opacity: 1; }
          50% { transform: translateY(-80px) translateX(20px) scale(0.7); opacity: 0.8; }
          80% { opacity: 0.4; }
          100% { transform: translateY(-150px) translateX(-15px) scale(0.3); opacity: 0; }
        }
        @keyframes aurora-wave {
          0% { transform: translateX(-30%) skewX(-5deg); opacity: 0.18; }
          33% { transform: translateX(0%) skewX(3deg); opacity: 0.3; }
          66% { transform: translateX(20%) skewX(-2deg); opacity: 0.22; }
          100% { transform: translateX(-30%) skewX(-5deg); opacity: 0.18; }
        }
        @keyframes light-ray-pulse {
          0%, 100% { opacity: 0.05; }
          30% { opacity: 0.3; }
          60% { opacity: 0.15; }
        }
        @keyframes burst-particle {
          0% { transform: translate(0, 0) scale(1); opacity: 1; }
          100% { transform: translate(var(--bx), var(--by)) scale(0); opacity: 0; }
        }
      `}</style>

      <QuickStartTutorial autoScrollTargets={false} />
      <WeeklyGoalOnboarding />
      <PremiumWelcomeModal
        open={showPremiumWelcome}
        onClose={() => setShowPremiumWelcome(false)}
      />

      <div className="fixed inset-0 overflow-hidden">
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
                backgroundPosition: "top",
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

            <div className="absolute inset-0 overflow-hidden" onClick={handleMagicBurst}>
                <div
                  className="absolute left-1/2 top-1/2 overflow-hidden"
                  style={{
                    width: `max(100vw, calc(100dvh * ${DESKTOP_ART_ASPECT_RATIO}))`,
                    height: `max(100dvh, calc(100vw * ${DESKTOP_ART_HEIGHT_RATIO}))`,
                    top: `calc(50% + ${isLandscapeMobile ? 0 : DESKTOP_WORLD_VERTICAL_SHIFT}px)`,
                    transform: `translate(-50%, -50%) scale(${zoomState.active ? 1.24 : 1})`,
                    transformOrigin: `${zoomState.targetX}% ${zoomState.targetY}%`,
                    transition: "transform 0.4s ease-out, transform-origin 0.1s",
                    animation: "world-fade-in 0.3s ease-out both",
                  }}
              >
                <div
                  className="absolute inset-0"
                  style={{
                    zIndex: 1,
                    backgroundImage: `url(${BG_DESKTOP})`,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    transform: `translate(${parallax.x}px, ${parallax.y}px) scale(1.05)`,
                    transition: "transform 0.3s ease-out",
                  }}
                />

                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    zIndex: 2,
                    background:
                      "linear-gradient(180deg, rgba(16, 10, 45, 0.08) 0%, rgba(16, 10, 45, 0.02) 16%, transparent 30%, transparent 78%, rgba(16, 10, 45, 0.16) 100%)",
                  }}
                />

                {!isLandscapeMobile && (
                <div
                  className="pointer-events-none absolute z-30 px-6 py-5"
                  style={{
                    left: "max(0px, calc((100% - 100vw) / 2 + 56px))",
                    right: "max(0px, calc((100% - 100vw) / 2 + 56px))",
                    top: `max(0px, calc((100% - 100dvh) / 2 + 6px - ${DESKTOP_WORLD_VERTICAL_SHIFT}px))`,
                    opacity: worldReady ? 1 : 0,
                    transition: "opacity 0.5s ease 0.15s",
                  }}
                >
                  <div className="mx-auto max-w-4xl text-center">
                    <h1
                      className="text-[44px] font-semibold uppercase tracking-[0.06em] text-[#4C3524]"
                      style={{
                        fontFamily: 'Georgia, "Times New Roman", serif',
                        textShadow: "0 2px 12px rgba(255,248,230,0.55)",
                      }}
                    >
                      Story Village Navigation
                    </h1>
                    <div
                      className="mx-auto mt-2 h-px w-full max-w-[720px]"
                      style={{
                        background:
                          "linear-gradient(90deg, transparent 0%, rgba(121,88,55,0.28) 18%, rgba(121,88,55,0.55) 50%, rgba(121,88,55,0.28) 82%, transparent 100%)",
                      }}
                    />
                    <p
                      className="mt-2 text-[20px] font-medium uppercase tracking-[0.22em] text-[#6A4A33]"
                      style={{
                        fontFamily: 'Georgia, "Times New Roman", serif',
                        textShadow: "0 1px 8px rgba(255,248,230,0.42)",
                      }}
                    >
                      Explore the Realm of Tales
                    </p>
                    <p
                      className="mx-auto mt-4 max-w-[760px] text-[20px] leading-relaxed text-[#5E4631]"
                      style={{
                        fontFamily: 'Georgia, "Times New Roman", serif',
                        textShadow: "0 1px 8px rgba(255,248,230,0.32)",
                      }}
                    >
                      Welcome to our enchanting world where every building tells a story and every path leads to adventure.
                      Discover the creative heart of our narrative universe.
                    </p>
                  </div>
                </div>
                )}

                {DESKTOP_SCENE_BUILDINGS.map((building, index) => {
                  const zone = building.desktop;
                  const tutorialTarget =
                    building.id === "create"
                      ? "create-story"
                      : building.id === "library"
                      ? "library"
                      : building.id === "wordbank"
                      ? "wordbank"
                      : undefined;
                  return (
                    <div
                      key={building.id}
                      data-tutorial={tutorialTarget}
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
                  <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20, transform: `translate(${-parallax.x * 0.5}px, ${-parallax.y * 0.5}px)`, transition: "transform 0.3s ease-out" }}>
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

                    {/* Fairy dust — tiny golden particles rising */}
                    {DESKTOP_FAIRY_DUST.map((dust, index) => (
                      <div
                        key={`desktop-dust-${index}`}
                        className="absolute rounded-full"
                        style={{
                          width: dust.size,
                          height: dust.size,
                          left: `${dust.left}%`,
                          top: `${dust.top}%`,
                          background: "radial-gradient(circle, rgba(255,230,160,0.9) 0%, rgba(255,200,100,0.4) 60%, transparent 100%)",
                          boxShadow: "0 0 4px rgba(255,220,130,0.5)",
                          willChange: "transform, opacity",
                          animation: `fairy-dust-rise ${dust.duration} ease-in-out ${dust.delay} infinite`,
                        }}
                      />
                    ))}

                    {/* Light rays — diagonal beams from sunset */}
                    {DESKTOP_LIGHT_RAYS.map((ray, index) => (
                      <div
                        key={`desktop-ray-${index}`}
                        className="absolute"
                        style={{
                          left: `${ray.left}%`,
                          top: `${ray.top}%`,
                          width: ray.width,
                          height: ray.height,
                          transform: `rotate(${ray.angle}deg)`,
                          background: "linear-gradient(180deg, rgba(255,220,140,0.35) 0%, rgba(255,200,100,0.15) 50%, transparent 100%)",
                          willChange: "opacity",
                          animation: `light-ray-pulse ${ray.duration} ease-in-out ${ray.delay} infinite`,
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Aurora — color band at top */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    zIndex: 21,
                    top: 0,
                    left: "-20%",
                    width: "140%",
                    height: "35%",
                    background: "linear-gradient(90deg, rgba(124,58,237,0.25) 0%, rgba(6,182,212,0.20) 35%, rgba(255,200,100,0.15) 65%, rgba(124,58,237,0.20) 100%)",
                    filter: "blur(40px)",
                    willChange: "transform, opacity",
                    transform: `translate(${-parallax.x * 0.8}px, ${-parallax.y * 0.8}px)`,
                    transition: "transform 0.3s ease-out",
                    animation: "aurora-wave 12s ease-in-out infinite",
                  }}
                />


                <button
                  type="button"
                  onClick={() => setLocation("/settings")}
                  className="absolute z-30 flex h-12 w-12 items-center justify-center rounded-full transition-all hover:brightness-105 active:scale-[0.97]"
                  style={{
                    right: "max(20px, calc((100% - 100vw) / 2 + 24px))",
                    bottom: `max(24px, calc((100% - 100dvh) / 2 + 24px + ${DESKTOP_WORLD_VERTICAL_SHIFT}px))`,
                    color: "#5A3F29",
                    background:
                      "linear-gradient(180deg, rgba(255,250,241,0.95) 0%, rgba(248,232,204,0.9) 100%)",
                    border: "1px solid rgba(138,106,68,0.28)",
                    boxShadow:
                      "0 12px 24px rgba(82,58,34,0.16), inset 0 1px 0 rgba(255,255,255,0.7)",
                    backdropFilter: "blur(10px)",
                  }}
                  aria-label="Open settings"
                >
                  <Settings className="h-5 w-5" />
                </button>
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
                  borderColor: "rgba(255,246,224,0.7)",
                  background:
                    "linear-gradient(180deg, rgba(255,248,233,0.9) 0%, rgba(250,236,213,0.78) 100%)",
                  backdropFilter: "blur(18px)",
                  boxShadow:
                    "0 16px 36px rgba(31, 18, 69, 0.18), inset 0 1px 0 rgba(255,255,255,0.65)",
                }}
              >
                <div
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full"
                  style={{
                    background: "rgba(255,255,255,0.7)",
                    boxShadow: "0 8px 18px rgba(74, 42, 18, 0.12)",
                  }}
                >
                  <img src={APP_LOGO} alt="" className="h-8 w-8 object-contain" />
                </div>
                <div className="min-w-0 flex-1 text-center">
                  <h1
                    className="truncate text-[21px] font-semibold"
                    style={{
                      fontFamily: "Fredoka, sans-serif",
                      color: "#7A5230",
                      letterSpacing: "0.01em",
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
                      "linear-gradient(180deg, rgba(255,255,255,0.95) 0%, rgba(249,231,200,0.96) 100%)",
                    boxShadow:
                      "0 10px 22px rgba(74, 42, 18, 0.16), inset 0 1px 0 rgba(255,255,255,0.75)",
                  }}
                  aria-label="Open settings"
                >
                  <Settings className="h-5 w-5" style={{ color: "#6B4A1E" }} />
                </button>
              </div>
            </div>

            <div className="absolute inset-x-0 top-0 bottom-0 z-20 flex items-start justify-center px-0" onClick={handleMagicBurst}>
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
                    position: "relative",
                    zIndex: 1,
                    animation: "world-fade-in 0.8s ease-out",
                    filter: "drop-shadow(0 20px 44px rgba(22, 13, 51, 0.22))",
                    transform: `translate(${parallax.x}px, ${parallax.y}px) scale(1.04)`,
                    transition: "transform 0.3s ease-out",
                  }}
                />

                {worldReady && (
                  <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 20, transform: `translate(${-parallax.x * 0.5}px, ${-parallax.y * 0.5}px)`, transition: "transform 0.3s ease-out" }}>
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
                            "radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,242,199,0.9) 25%, rgba(255,212,112,0.6) 50%, transparent 100%)",
                          boxShadow: "0 0 16px 4px rgba(255,217,128,0.7), 0 0 30px rgba(255,200,80,0.3)",
                          animation: `sparkle 2.4s ease-in-out ${sparklePoint.delay} infinite`,
                        }}
                      />
                    ))}

                    {/* Mobile fireflies */}
                    {MOBILE_FIREFLIES.map((firefly, index) => (
                      <div
                        key={`mobile-firefly-${index}`}
                        className="absolute rounded-full"
                        style={{
                          width: firefly.size,
                          height: firefly.size,
                          left: `${firefly.left}%`,
                          top: `${firefly.top}%`,
                          background: "radial-gradient(circle, rgba(255,240,170,0.9) 0%, rgba(255,226,146,0.5) 40%, transparent 75%)",
                          boxShadow: "0 0 12px 3px rgba(255,226,146,0.5)",
                          filter: "blur(1px)",
                          animation: `firefly-wander ${firefly.duration} ease-in-out ${firefly.delay} infinite`,
                        }}
                      />
                    ))}

                    {/* Mobile lanterns */}
                    {MOBILE_LANTERNS.map((lantern, index) => (
                      <div
                        key={`mobile-lantern-${index}`}
                        className="absolute rounded-full"
                        style={{
                          width: lantern.size,
                          height: lantern.size,
                          left: `${lantern.left}%`,
                          top: `${lantern.top}%`,
                          transform: "translate(-50%, -50%)",
                          background: `radial-gradient(circle, rgba(${lantern.color},0.7) 0%, rgba(${lantern.color},0.3) 42%, transparent 74%)`,
                          boxShadow: `0 0 20px 5px rgba(${lantern.color},0.25)`,
                          animation: `lantern-flicker ${2.6 + index * 0.25}s ease-in-out ${index * 0.2}s infinite`,
                        }}
                      />
                    ))}

                    {/* Mobile fairy dust */}
                    {MOBILE_FAIRY_DUST.map((dust, index) => (
                      <div
                        key={`mobile-dust-${index}`}
                        className="absolute rounded-full"
                        style={{
                          width: dust.size,
                          height: dust.size,
                          left: `${dust.left}%`,
                          top: `${dust.top}%`,
                          background: "radial-gradient(circle, rgba(255,255,220,1) 0%, rgba(255,230,160,0.7) 40%, transparent 100%)",
                          boxShadow: "0 0 10px 2px rgba(255,220,130,0.6)",
                          willChange: "transform, opacity",
                          animation: `fairy-dust-rise ${dust.duration} ease-in-out ${dust.delay} infinite`,
                        }}
                      />
                    ))}
                  </div>
                )}

                {/* Mobile aurora */}
                <div
                  className="absolute pointer-events-none"
                  style={{
                    zIndex: 21,
                    top: 0,
                    left: "-30%",
                    width: "160%",
                    height: "35%",
                    background: "linear-gradient(90deg, rgba(124,58,237,0.35) 0%, rgba(6,182,212,0.28) 35%, rgba(255,200,100,0.20) 65%, rgba(124,58,237,0.30) 100%)",
                    filter: "blur(35px)",
                    willChange: "transform, opacity",
                    transform: `translate(${-parallax.x * 0.8}px, ${-parallax.y * 0.8}px)`,
                    transition: "transform 0.3s ease-out",
                    animation: "aurora-wave 14s ease-in-out infinite",
                  }}
                />

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
                        zIndex: 30,
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

      {/* Burst particles — fixed position overlay */}
      {burstParticles.map(burst => (
        <div
          key={burst.id}
          className="pointer-events-none"
          style={{ position: "fixed", left: burst.x, top: burst.y, zIndex: 9999 }}
        >
          {burst.particles.map((p, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: 6,
                height: 6,
                background: p.color,
                boxShadow: `0 0 8px ${p.color}`,
                "--bx": p.bx,
                "--by": p.by,
                animation: "burst-particle 0.6s ease-out forwards",
              } as React.CSSProperties}
            />
          ))}
        </div>
      ))}
    </>
  );
}
