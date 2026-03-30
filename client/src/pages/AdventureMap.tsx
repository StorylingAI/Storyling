import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { APP_TITLE, APP_LOGO, getLoginUrl } from "@/const";
import { useLocation } from "wouter";
import { Sparkles, X } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuickStartTutorial } from "@/components/QuickStartTutorial";
import { useChallengeDetection } from "@/hooks/useChallengeDetection";
import { PremiumWelcomeModal } from "@/components/PremiumWelcomeModal";
import { WeeklyGoalOnboarding } from "@/components/WeeklyGoalOnboarding";

// ─── Assets ───────────────────────────────────────────────────────────────────
const BG_DESKTOP = "/images/dashboardBg.webp";
const BG_MOBILE = "/images/dashboardBg.webp";
const BOOKI_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/103676959/REBiP2ev8rqbpxn8LRb7vA/booki-disney-sprite-Z7oZ5pF2yhxt32VbLknKwD.png";

// ─── Building data (world objects, not floating UI) ──────────────────────────
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
    label: "Story Studio",
    fullLabel: "Story Studio",
    description: "Write your own adventure story in any language! Choose a theme, characters, and let AI help you learn new words.",
    path: "/create",
    desktop: { left: 2, top: 10, width: 28, height: 55 },
    mobile: { left: 16, top: 2, width: 50, height: 20 },
    zoomTarget: { x: 16, y: 35 },
  },
  {
    id: "library",
    label: "Library",
    fullLabel: "Library",
    description: "Browse your collection of stories. Continue reading where you left off or discover new adventures.",
    path: "/library",
    desktop: { left: 65, top: 5, width: 34, height: 55 },
    mobile: { left: 51, top: 22, width: 42, height: 18 },
    zoomTarget: { x: 82, y: 30 },
  },
  {
    id: "wordbank",
    label: "Word Vault",
    fullLabel: "Word Vault",
    description: "Review and practice all the vocabulary you've learned across your stories.",
    path: "/wordbank",
    desktop: { left: 5, top: 55, width: 30, height: 35 },
    mobile: { left: 19, top: 45, width: 40, height: 17 },
    zoomTarget: { x: 20, y: 72 },
  },
  {
    id: "chat",
    label: "Booki's Corner",
    fullLabel: "Booki's Corner",
    description: "Practice conversation with your AI language buddy Booki!",
    path: "__chat__",
    desktop: { left: 60, top: 55, width: 30, height: 35 },
    mobile: { left: 3, top: 71, width: 38, height: 17 },
    zoomTarget: { x: 75, y: 72 },
  },
  {
    id: "profile",
    label: "Profile",
    fullLabel: "Profile",
    description: "Manage your account, view your stats, and customize your learning experience.",
    path: "/profile",
    desktop: { left: 38, top: 42, width: 20, height: 30 },
    mobile: { left: 35, top: 55, width: 25, height: 25 },
    zoomTarget: { x: 48, y: 75 },
  },
];

// ─── Building Hotspot Component ───────────────────────────────────────────────
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
      onClick={onClick}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
      onTouchStart={onHover}
      className="absolute inset-0 focus:outline-none"
      style={{
        cursor: "pointer",
        zIndex: 10,
        width: "100%",
        height: "100%",
        minWidth: 48,
        minHeight: 48,
        opacity: worldReady ? 1 : 0,
        transition: `opacity 0.5s ease ${entranceDelay}s`,
      }}
      aria-label={building.fullLabel}
    >
      {/* Enchanted selection glow on hover */}
      <div
        className="absolute inset-0 rounded-2xl pointer-events-none transition-all duration-500 ease-out"
        style={{
          background: isHovered
            ? "radial-gradient(ellipse at center, rgba(255,220,140,0.4) 0%, rgba(255,190,80,0.2) 40%, rgba(255,160,60,0.08) 65%, transparent 80%)"
            : "transparent",
          boxShadow: isHovered
            ? "0 0 50px rgba(255,210,120,0.5), 0 0 100px rgba(255,180,60,0.2), inset 0 0 40px rgba(255,220,140,0.15)"
            : "none",
          transform: isHovered ? "scale(1.04)" : "scale(1)",
          border: isHovered ? "2px solid rgba(255,220,150,0.3)" : "2px solid transparent",
        }}
      />
      {/* Animated sparkle ring on hover */}
      {isHovered && (
        <div className="absolute inset-0 pointer-events-none">
          {[0, 60, 120, 180, 240, 300].map((deg) => (
            <div
              key={deg}
              className="absolute rounded-full"
              style={{
                width: 4,
                height: 4,
                background: "rgba(255,230,150,0.9)",
                boxShadow: "0 0 8px rgba(255,210,100,0.8)",
                top: `${50 + 48 * Math.sin((deg * Math.PI) / 180)}%`,
                left: `${50 + 48 * Math.cos((deg * Math.PI) / 180)}%`,
                animation: `sparkle-orbit 2s ease-in-out infinite`,
                animationDelay: `${deg / 360}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Floating label that appears on hover — flips below for top buildings */}
      {(() => {
        const showBelow = building.desktop.top < 20;
        return (
          <div
            className="absolute left-1/2 -translate-x-1/2 px-4 py-2 rounded-2xl whitespace-nowrap pointer-events-none transition-all duration-400 ease-out"
            style={{
              ...(showBelow ? { top: "105%" } : { bottom: "105%" }),
              opacity: isHovered ? 1 : 0,
              transform: isHovered
                ? "translateY(0) scale(1)"
                : `translateY(${showBelow ? -12 : 12}px) scale(0.9)`,
              background: "linear-gradient(135deg, rgba(255,248,237,0.97), rgba(255,240,220,0.97))",
              backdropFilter: "blur(16px)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.15), 0 0 0 1px rgba(255,220,150,0.4), 0 0 20px rgba(255,200,100,0.15)",
              fontFamily: "Fredoka, sans-serif",
              fontSize: 15,
              fontWeight: 700,
              color: "#3D2B1F",
              letterSpacing: 0.5,
            }}
          >
            <span className="mr-1.5">
              {building.id === "create" ? "✏️" :
               building.id === "library" ? "📚" :
               building.id === "wordbank" ? "💎" :
               building.id === "chat" ? "💬" :
               "👤"}
            </span>
            {building.label}
            <div
              style={{
                position: "absolute",
                ...(showBelow
                  ? { top: -6, borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderBottom: "7px solid rgba(255,248,237,0.97)" }
                  : { bottom: -6, borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderTop: "7px solid rgba(255,248,237,0.97)" }
                ),
                left: "50%",
                transform: "translateX(-50%)",
                width: 0,
                height: 0,
              }}
            />
          </div>
        );
      })()}
    </button>
  );
}

// ─── Node detail popup (zoom-in style) ─────────────────────────────────────
function NodeDetailPopup({
  building,
  onClose,
  onNavigate,
}: {
  building: Building;
  onClose: () => void;
  onNavigate: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
      <div
        className="relative w-full max-w-sm rounded-3xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "rgba(255,248,237,0.97)",
          backdropFilter: "blur(20px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          animation: "popup-in 0.3s ease-out",
        }}
      >
        <div
          className="px-5 py-4 flex items-center justify-between"
          style={{ background: "linear-gradient(135deg, #6B4C8A, #8B6BAE)" }}
        >
          <h3
            className="text-xl font-bold text-white"
            style={{ fontFamily: "Fredoka, sans-serif" }}
          >
            {building.fullLabel}
          </h3>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full flex items-center justify-center"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            <X className="h-5 w-5 text-white" />
          </button>
        </div>

        <div className="px-6 py-6">
          <p
            className="text-center text-base leading-relaxed"
            style={{ fontFamily: "Fredoka, sans-serif", color: "#4A3728" }}
          >
            {building.description}
          </p>
        </div>

        <div className="px-6 pb-6">
          <button
            onClick={onNavigate}
            className="w-full py-3.5 rounded-full text-white font-bold text-lg transition-transform hover:scale-[1.02] active:scale-95"
            style={{
              fontFamily: "Fredoka, sans-serif",
              background: "linear-gradient(135deg, #6B4C8A, #8B6BAE)",
              boxShadow: "0 4px 20px rgba(107,76,138,0.5)",
            }}
          >
            {building.id === "create" ? "Start Writing" : `Open ${building.fullLabel}`}
          </button>
        </div>

        <div className="absolute -bottom-2 -right-2" style={{ width: 70, height: 70 }}>
          <img
            src={BOOKI_IMG}
            alt="Booki"
            className="w-full h-full object-contain"
            style={{
              filter: "drop-shadow(0 2px 8px rgba(0,0,0,0.2))",
              animation: "float-booki 3s ease-in-out infinite",
            }}
          />
        </div>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function AdventureMap() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const [showPremiumWelcome, setShowPremiumWelcome] = useState(false);
  const [selectedBuilding, setSelectedBuilding] = useState<Building | null>(null);
  const [hoveredBuilding, setHoveredBuilding] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<HTMLDivElement>(null);
  useChallengeDetection();

  // ─── Entrance animation state ─────────────────────────────────────────────
  const [worldReady, setWorldReady] = useState(false);

  useEffect(() => {
    const t1 = setTimeout(() => setWorldReady(true), 300);
    return () => { clearTimeout(t1); };
  }, []);

  // ─── Camera zoom state ────────────────────────────────────────────────────
  const [zoomState, setZoomState] = useState<{
    active: boolean;
    targetX: number;
    targetY: number;
    building: Building | null;
  }>({ active: false, targetX: 50, targetY: 50, building: null });

  // Responsive
  const [usePortraitImg, setUsePortraitImg] = useState(() => window.innerHeight > window.innerWidth);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);

  useEffect(() => {
    const handleResize = () => {
      setUsePortraitImg(window.innerHeight > window.innerWidth);
      setIsMobile(window.innerWidth < 768);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const utils = trpc.useUtils();

  useEffect(() => {
    if (user && isAuthenticated) {
      const params = new URLSearchParams(window.location.search);
      if (params.get("subscription") === "success") {
        window.history.replaceState({}, "", "/app");
        const checkSubscription = async () => {
          let attempts = 0;
          const pollInterval = setInterval(async () => {
            attempts++;
            await utils.auth.me.invalidate();
            const updatedUser = await utils.auth.me.fetch();
            if (updatedUser?.subscriptionTier === "premium") {
              clearInterval(pollInterval);
              if (!updatedUser.premiumOnboardingCompleted) setShowPremiumWelcome(true);
            } else if (attempts >= 10) {
              clearInterval(pollInterval);
              setShowPremiumWelcome(true);
            }
          }, 1000);
        };
        checkSubscription();
      }
    }
  }, [user, isAuthenticated, utils]);

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

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-magical flex items-center justify-center p-4">
        <Card className="w-full max-w-md rounded-2xl shadow-magical border-0 overflow-hidden">
          <div className="h-2 gradient-primary" />
          <CardContent className="pt-10 pb-10 text-center space-y-6">
            <img src={APP_LOGO} alt="Storylingai" className="h-28 w-28 mx-auto animate-float" />
            <div>
              <h2 className="text-3xl font-bold mb-2 text-gray-900" style={{ fontFamily: "Fredoka, sans-serif" }}>
                Welcome to {APP_TITLE}
              </h2>
              <p className="text-gray-500 text-lg" style={{ fontFamily: "Fredoka, sans-serif" }}>
                Sign in to start your language learning journey!
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

  // ─── Camera zoom + navigate ────────────────────────────────────────────────
  const handleBuildingClick = (building: Building) => {
    setZoomState({
      active: true,
      targetX: building.zoomTarget.x,
      targetY: building.zoomTarget.y,
      building,
    });

    setTimeout(() => {
      if (building.path === "__chat__") {
        window.dispatchEvent(new CustomEvent("open-booki-chat"));
      } else if (building.path.startsWith("/profile") && user?.id) {
        setLocation(`/profile/${user.id}`);
      } else {
        setLocation(building.path);
      }
      setTimeout(() => setZoomState({ active: false, targetX: 50, targetY: 50, building: null }), 100);
    }, 400);
  };

  const bgUrl = usePortraitImg ? BG_MOBILE : BG_DESKTOP;

  // ─── Render ──────────────────────────────────────────────────────────────────
  return (
    <>
      <style>{`
        @keyframes float-booki {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes popup-in {
          0% { opacity: 0; transform: scale(0.9) translateY(20px); }
          100% { opacity: 1; transform: scale(1) translateY(0); }
        }
        @keyframes world-fade-in {
          0% { opacity: 0; transform: scale(1.02); }
          100% { opacity: 1; transform: scale(1); }
        }
        @keyframes sparkle {
          0%, 100% { opacity: 0; transform: scale(0); }
          50% { opacity: 1; transform: scale(1); }
        }
        @keyframes sparkle-orbit {
          0%, 100% { opacity: 0; transform: scale(0); }
          20% { opacity: 1; transform: scale(1.2); }
          50% { opacity: 0.8; transform: scale(0.8); }
          80% { opacity: 1; transform: scale(1); }
        }
        @keyframes float-up {
          0% { transform: translateY(0) translateX(0); opacity: 0; }
          10% { opacity: 1; }
          80% { opacity: 0.6; }
          100% { transform: translateY(-120px) translateX(${20}px); opacity: 0; }
        }
        @keyframes firefly-wander {
          0% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          25% { transform: translate(15px, -20px) scale(1.2); opacity: 0.7; }
          50% { transform: translate(-10px, -10px) scale(0.8); opacity: 0.4; }
          75% { transform: translate(20px, 10px) scale(1.1); opacity: 0.8; }
          100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
        }
        @keyframes sparkle-twinkle {
          0%, 100% { opacity: 0; transform: scale(0) rotate(0deg); }
          30% { opacity: 1; transform: scale(1) rotate(15deg); }
          60% { opacity: 0.8; transform: scale(0.8) rotate(-10deg); }
          80% { opacity: 0; transform: scale(0) rotate(30deg); }
        }
        @keyframes ray-pulse {
          0%, 100% { opacity: 0.05; transform: scaleY(1); }
          50% { opacity: 0.12; transform: scaleY(1.1); }
        }
        @keyframes petal-fall {
          0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
          5% { opacity: 1; }
          50% { transform: translateY(50vh) translateX(40px) rotate(180deg); opacity: 0.6; }
          85% { opacity: 0.3; }
          100% { transform: translateY(110vh) translateX(-20px) rotate(360deg); opacity: 0; }
        }
        @keyframes shooting-star {
          0% { transform: translateX(0) translateY(0); opacity: 0; }
          5% { opacity: 1; }
          30% { opacity: 0.8; }
          100% { transform: translateX(40vw) translateY(15vh); opacity: 0; }
        }
        @keyframes lantern-flicker {
          0%, 100% { opacity: 0.6; transform: translate(-50%, -50%) scale(1); }
          30% { opacity: 1; transform: translate(-50%, -50%) scale(1.15); }
          60% { opacity: 0.5; transform: translate(-50%, -50%) scale(0.95); }
          80% { opacity: 0.9; transform: translate(-50%, -50%) scale(1.1); }
        }
        @keyframes mist-drift {
          0%, 100% { transform: translateX(0); opacity: 0.8; }
          50% { transform: translateX(3%); opacity: 1; }
        }
        @keyframes wisp-0 {
          0% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          20% { transform: translate(25px, -15px) scale(1.3); opacity: 0.8; }
          40% { transform: translate(10px, -30px) scale(0.9); opacity: 0.5; }
          60% { transform: translate(-20px, -15px) scale(1.2); opacity: 0.9; }
          80% { transform: translate(-10px, 5px) scale(0.8); opacity: 0.4; }
          100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
        }
        @keyframes wisp-1 {
          0% { transform: translate(0, 0) scale(1); opacity: 0.4; }
          25% { transform: translate(-20px, -25px) scale(1.4); opacity: 0.9; }
          50% { transform: translate(15px, -35px) scale(0.7); opacity: 0.3; }
          75% { transform: translate(25px, -10px) scale(1.1); opacity: 0.7; }
          100% { transform: translate(0, 0) scale(1); opacity: 0.4; }
        }
        @keyframes wisp-2 {
          0% { transform: translate(0, 0) scale(0.8); opacity: 0.5; }
          15% { transform: translate(18px, 10px) scale(1.2); opacity: 0.8; }
          35% { transform: translate(30px, -20px) scale(1); opacity: 0.6; }
          55% { transform: translate(5px, -30px) scale(1.3); opacity: 0.9; }
          75% { transform: translate(-15px, -12px) scale(0.9); opacity: 0.4; }
          100% { transform: translate(0, 0) scale(0.8); opacity: 0.5; }
        }
        @keyframes wisp-3 {
          0% { transform: translate(0, 0) scale(1); opacity: 0.3; }
          30% { transform: translate(-15px, -20px) scale(1.5); opacity: 0.7; }
          50% { transform: translate(-25px, 5px) scale(0.8); opacity: 0.9; }
          70% { transform: translate(10px, 15px) scale(1.1); opacity: 0.5; }
          100% { transform: translate(0, 0) scale(1); opacity: 0.3; }
        }
      `}</style>

      <QuickStartTutorial />
      <WeeklyGoalOnboarding />
      <PremiumWelcomeModal open={showPremiumWelcome} onClose={() => setShowPremiumWelcome(false)} />

      <div className="relative" style={{ height: "100dvh", overflow: "hidden" }}>
        {!isMobile ? (
          /* ── Desktop: Full-screen map ── */
          <div
            ref={mapRef}
            className="relative w-full h-full overflow-hidden"
            style={{ background: "#4A7A3A" }}
          >
            {/* Background image with camera zoom transition */}
            <div
              className="absolute inset-0 transition-all duration-400 ease-out"
              style={{
                backgroundImage: `url(${bgUrl})`,
                backgroundSize: "cover",
                backgroundPosition: "center",
                backgroundRepeat: "no-repeat",
                transform: zoomState.active ? "scale(1.3)" : "scale(1)",
                transformOrigin: zoomState.active
                  ? `${zoomState.targetX}% ${zoomState.targetY}%`
                  : "center",
                transition: "transform 0.4s ease-out, transform-origin 0.1s",
                animation: "world-fade-in 0.8s ease-out",
              }}
            />

            {/* Subtle vignette overlay for depth */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.15) 100%)",
              }}
            />

            {/* Title overlay text */}
            <div
              className="absolute top-0 left-0 right-0 z-20 pointer-events-none text-center pt-4 px-4"
              style={{
                opacity: worldReady ? 1 : 0,
                transition: "opacity 0.8s ease 0.3s",
              }}
            >
              <h1
                className="text-3xl sm:text-4xl lg:text-5xl font-black uppercase tracking-wider"
                style={{
                  fontFamily: "Fredoka, serif",
                  color: "#3D2B1F",
                  textShadow: "0 2px 8px rgba(255,248,230,0.8), 0 0 20px rgba(255,220,150,0.4)",
                  letterSpacing: "0.08em",
                }}
              >
                Story Village Navigation
              </h1>
              <p
                className="text-sm sm:text-base lg:text-lg font-bold uppercase tracking-[0.2em] mt-1"
                style={{
                  fontFamily: "Fredoka, sans-serif",
                  color: "#5A4030",
                  textShadow: "0 1px 4px rgba(255,248,230,0.6)",
                }}
              >
                Explore the Realm of Tales
              </p>
              <p
                className="mt-2 text-xs sm:text-sm max-w-lg mx-auto leading-relaxed"
                style={{
                  fontFamily: "Fredoka, sans-serif",
                  color: "#5A4030",
                  textShadow: "0 1px 3px rgba(255,248,230,0.5)",
                }}
              >
                Welcome to our enchanting world where every building tells a story and every path leads to adventure. Discover the creative heart of our narrative universe.
              </p>
            </div>

            {/* Building hotspot zones */}
            {BUILDINGS.map((building, idx) => {
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
                  }}
                >
                  <BuildingHotspot
                    building={building}
                    onClick={() => handleBuildingClick(building)}
                    onHover={() => setHoveredBuilding(building.id)}
                    onLeave={() => setHoveredBuilding(null)}
                    isHovered={hoveredBuilding === building.id}
                    entranceDelay={0.3 + idx * 0.1}
                    worldReady={worldReady}
                  />
                </div>
              );
            })}

            {/* Enchanted particle system */}
            {worldReady && (
              <div className="absolute inset-0 pointer-events-none z-5">
                {/* Floating golden dust — gentle upward drift */}
                {[...Array(20)].map((_, i) => (
                  <div
                    key={`dust-${i}`}
                    className="absolute rounded-full"
                    style={{
                      width: 2 + Math.random() * 3,
                      height: 2 + Math.random() * 3,
                      background: `rgba(255,${200 + Math.random() * 55},${80 + Math.random() * 60},${0.4 + Math.random() * 0.4})`,
                      left: `${5 + Math.random() * 90}%`,
                      top: `${Math.random() * 100}%`,
                      animation: `float-up ${8 + Math.random() * 10}s ease-in-out infinite`,
                      animationDelay: `${Math.random() * 10}s`,
                      boxShadow: `0 0 ${4 + Math.random() * 6}px rgba(255,215,100,0.5)`,
                    }}
                  />
                ))}

                {/* Soft firefly orbs — slow wander */}
                {[...Array(10)].map((_, i) => (
                  <div
                    key={`firefly-${i}`}
                    className="absolute rounded-full"
                    style={{
                      width: 6 + Math.random() * 6,
                      height: 6 + Math.random() * 6,
                      background: `radial-gradient(circle, rgba(255,${220 + Math.random() * 35},${130 + Math.random() * 50},0.6) 0%, transparent 70%)`,
                      left: `${10 + Math.random() * 80}%`,
                      top: `${15 + Math.random() * 70}%`,
                      animation: `firefly-wander ${12 + Math.random() * 8}s ease-in-out infinite`,
                      animationDelay: `${Math.random() * 8}s`,
                      filter: `blur(${Math.random() * 1.5}px)`,
                    }}
                  />
                ))}

                {/* 4-point sparkle stars */}
                {[...Array(8)].map((_, i) => (
                  <svg
                    key={`star-${i}`}
                    className="absolute"
                    viewBox="0 0 24 24"
                    fill={`rgba(255,${230 + Math.random() * 25},${160 + Math.random() * 60},${0.5 + Math.random() * 0.4})`}
                    style={{
                      width: 8 + Math.random() * 10,
                      height: 8 + Math.random() * 10,
                      left: `${10 + Math.random() * 80}%`,
                      top: `${5 + Math.random() * 85}%`,
                      animation: `sparkle-twinkle ${3 + Math.random() * 4}s ease-in-out infinite`,
                      animationDelay: `${Math.random() * 5}s`,
                      filter: `drop-shadow(0 0 3px rgba(255,220,100,0.6))`,
                    }}
                  >
                    <path d="M12 0L14 10L24 12L14 14L12 24L10 14L0 12L10 10Z" />
                  </svg>
                ))}

                {/* Colored luminous wisps — figure-eight paths */}
                {[
                  { color: "255,200,120", x: 15, y: 60, size: 8, dur: 14 },
                  { color: "180,220,255", x: 70, y: 40, size: 10, dur: 18 },
                  { color: "255,180,220", x: 40, y: 75, size: 7, dur: 16 },
                  { color: "200,255,200", x: 85, y: 65, size: 9, dur: 20 },
                  { color: "220,190,255", x: 25, y: 35, size: 6, dur: 15 },
                  { color: "255,230,150", x: 55, y: 25, size: 8, dur: 17 },
                  { color: "150,230,255", x: 60, y: 80, size: 7, dur: 19 },
                  { color: "255,160,180", x: 10, y: 45, size: 6, dur: 13 },
                  { color: "200,255,230", x: 80, y: 20, size: 9, dur: 21 },
                  { color: "255,210,170", x: 35, y: 50, size: 7, dur: 16 },
                  { color: "190,200,255", x: 50, y: 60, size: 8, dur: 15 },
                  { color: "255,240,180", x: 90, y: 50, size: 6, dur: 18 },
                ].map((wisp, i) => (
                  <div
                    key={`wisp-${i}`}
                    className="absolute rounded-full"
                    style={{
                      width: wisp.size,
                      height: wisp.size,
                      left: `${wisp.x}%`,
                      top: `${wisp.y}%`,
                      background: `radial-gradient(circle, rgba(${wisp.color},0.8) 0%, rgba(${wisp.color},0.3) 40%, transparent 70%)`,
                      boxShadow: `0 0 ${wisp.size * 2}px rgba(${wisp.color},0.5), 0 0 ${wisp.size * 4}px rgba(${wisp.color},0.2)`,
                      animation: `wisp-${i % 4} ${wisp.dur}s ease-in-out infinite`,
                      animationDelay: `${i * 1.3}s`,
                    }}
                  />
                ))}

                {/* Subtle light rays from top */}
                <div
                  className="absolute top-0 left-1/4 w-1/2 h-1/2 opacity-[0.07]"
                  style={{
                    background: "linear-gradient(180deg, rgba(255,240,200,1) 0%, transparent 100%)",
                    filter: "blur(40px)",
                    animation: "ray-pulse 6s ease-in-out infinite",
                  }}
                />
                <div
                  className="absolute top-0 right-1/4 w-1/3 h-2/5 opacity-[0.05]"
                  style={{
                    background: "linear-gradient(180deg, rgba(255,220,170,1) 0%, transparent 100%)",
                    filter: "blur(50px)",
                    animation: "ray-pulse 8s ease-in-out infinite",
                    animationDelay: "3s",
                  }}
                />

                {/* Floating cherry blossom petals */}
                {[...Array(15)].map((_, i) => (
                  <div
                    key={`petal-${i}`}
                    className="absolute"
                    style={{
                      width: 6 + Math.random() * 6,
                      height: 4 + Math.random() * 4,
                      borderRadius: "50% 0 50% 0",
                      background: `rgba(${240 + Math.random() * 15}, ${180 + Math.random() * 40}, ${190 + Math.random() * 40}, ${0.4 + Math.random() * 0.3})`,
                      left: `${Math.random() * 100}%`,
                      top: `-5%`,
                      animation: `petal-fall ${10 + Math.random() * 12}s linear infinite`,
                      animationDelay: `${Math.random() * 15}s`,
                    }}
                  />
                ))}

                {/* Shooting stars */}
                {[...Array(3)].map((_, i) => (
                  <div
                    key={`shoot-${i}`}
                    className="absolute"
                    style={{
                      width: 2,
                      height: 2,
                      borderRadius: "50%",
                      background: "white",
                      boxShadow: "0 0 4px white, -20px 0 10px rgba(255,255,255,0.3), -40px 0 6px rgba(255,255,255,0.1)",
                      top: `${5 + Math.random() * 20}%`,
                      left: `-5%`,
                      animation: `shooting-star ${2 + Math.random() * 2}s ease-out infinite`,
                      animationDelay: `${5 + i * 8 + Math.random() * 5}s`,
                      opacity: 0,
                    }}
                  />
                ))}

                {/* Lantern glow points — positioned on the visible lanterns in the image */}
                {[
                  { x: 7, y: 52, color: "255,180,80", size: 30 },
                  { x: 18, y: 40, color: "255,190,90", size: 25 },
                  { x: 73, y: 55, color: "255,170,70", size: 28 },
                  { x: 88, y: 50, color: "255,185,85", size: 22 },
                  { x: 42, y: 68, color: "255,200,100", size: 20 },
                  { x: 58, y: 48, color: "180,200,255", size: 18 },
                ].map((lantern, i) => (
                  <div
                    key={`lantern-${i}`}
                    className="absolute rounded-full pointer-events-none"
                    style={{
                      width: lantern.size,
                      height: lantern.size,
                      left: `${lantern.x}%`,
                      top: `${lantern.y}%`,
                      transform: "translate(-50%, -50%)",
                      background: `radial-gradient(circle, rgba(${lantern.color},0.4) 0%, rgba(${lantern.color},0.15) 40%, transparent 70%)`,
                      animation: `lantern-flicker ${2.5 + Math.random() * 2}s ease-in-out infinite`,
                      animationDelay: `${Math.random() * 3}s`,
                    }}
                  />
                ))}

                {/* Soft ground mist at bottom */}
                <div
                  className="absolute bottom-0 left-0 right-0 pointer-events-none"
                  style={{
                    height: "20%",
                    background: "linear-gradient(180deg, transparent 0%, rgba(255,250,240,0.08) 50%, rgba(255,245,230,0.15) 100%)",
                    filter: "blur(8px)",
                    animation: "mist-drift 12s ease-in-out infinite",
                  }}
                />
              </div>
            )}
          </div>
        ) : (
          /* ── Mobile/Tablet: Map image + navigation cards below ── */
          <div
            ref={scrollRef}
            className="absolute inset-0 overflow-y-auto overflow-x-hidden"
            style={{ WebkitOverflowScrolling: "touch", background: "linear-gradient(180deg, #E8D5B0 0%, #D4C4A0 50%, #C8B890 100%)" }}
          >
            {/* Map image — preserves aspect ratio */}
            <div className="relative w-full" style={{ aspectRatio: "16/9" }}>
              <img
                src={BG_DESKTOP}
                alt="Story Village"
                className="w-full h-full object-cover"
                style={{ animation: "world-fade-in 0.8s ease-out" }}
              />
              {/* Vignette */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.12) 100%)" }}
              />
              {/* Mobile sparkles on map */}
              {worldReady && (
                <div className="absolute inset-0 pointer-events-none">
                  {[...Array(10)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute rounded-full"
                      style={{
                        width: 3 + Math.random() * 3,
                        height: 3 + Math.random() * 3,
                        background: `rgba(255,${210 + Math.random() * 45},${100 + Math.random() * 60},0.7)`,
                        left: `${10 + Math.random() * 80}%`,
                        top: `${10 + Math.random() * 80}%`,
                        animation: `sparkle ${3 + Math.random() * 3}s ease-in-out infinite`,
                        animationDelay: `${Math.random() * 4}s`,
                        boxShadow: "0 0 6px rgba(255,215,100,0.5)",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Navigation cards */}
            <div className="px-4 py-5 space-y-3">
              <h2
                className="text-center text-xl font-bold mb-4"
                style={{ fontFamily: "Fredoka, sans-serif", color: "#3D2B1F" }}
              >
                Where would you like to go?
              </h2>
              <div className="grid grid-cols-2 gap-3">
                {BUILDINGS.map((building) => (
                  <button
                    key={building.id}
                    onClick={() => handleBuildingClick(building)}
                    className="rounded-2xl p-4 text-left transition-all hover:scale-[1.03] active:scale-95"
                    style={{
                      background: "rgba(255,248,237,0.95)",
                      backdropFilter: "blur(12px)",
                      boxShadow: "0 4px 16px rgba(0,0,0,0.1), 0 0 0 1px rgba(255,255,255,0.5)",
                    }}
                  >
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-lg">
                        {building.id === "create" ? "✏️" :
                         building.id === "library" ? "📚" :
                         building.id === "wordbank" ? "💎" :
                         building.id === "chat" ? "💬" :
                         "👤"}
                      </span>
                      <h3
                        className="font-bold text-sm"
                        style={{ fontFamily: "Fredoka, sans-serif", color: "#3D2B1F" }}
                      >
                        {building.fullLabel}
                      </h3>
                    </div>
                    <p
                      className="text-xs leading-relaxed line-clamp-2"
                      style={{ color: "#6B5B4B" }}
                    >
                      {building.description}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Node detail popup */}
      {selectedBuilding && (
        <NodeDetailPopup
          building={selectedBuilding}
          onClose={() => setSelectedBuilding(null)}
          onNavigate={() => {
            handleBuildingClick(selectedBuilding);
            setSelectedBuilding(null);
          }}
        />
      )}
    </>
  );
}
