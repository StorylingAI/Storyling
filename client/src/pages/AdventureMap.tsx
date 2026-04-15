import { type ReactNode, useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuickStartTutorial } from "@/components/QuickStartTutorial";
import { PremiumWelcomeModal } from "@/components/PremiumWelcomeModal";
import { WeeklyGoalOnboarding } from "@/components/WeeklyGoalOnboarding";
import { PullToRefresh } from "@/components/PullToRefresh";
import { useChallengeDetection } from "@/hooks/useChallengeDetection";
import {
  BookOpen,
  ChevronRight,
  Coins,
  Flame,
  Gem,
  Sparkles,
} from "lucide-react";
import { BottomTabBar } from "@/components/BottomTabBar";
import { motion, useReducedMotion } from "framer-motion";

type ContinueItem = {
  id: number;
  title: string;
  subtitle?: string | null;
  thumbnailUrl?: string | null;
  targetLanguage?: string | null;
  progressPercent: number;
};

type ExploreAvatar = {
  id: string;
  name: string;
  gradient: string;
  badge: string;
  avatarUrl?: string | null;
  targetPath: string;
  collectionName: string;
};

function CreateStoryTileIcon() {
  return (
    <div className="relative h-full w-full">
      <div className="absolute bottom-2 left-1 h-7 w-8 -rotate-6 rounded-[5px] border-2 border-[#4A3A58] bg-[#FFF7DA] shadow-[0_4px_8px_rgba(60,42,75,0.18)] sm:h-8 sm:w-9">
        <span className="absolute left-1 top-2 h-[2px] w-4 rounded-full bg-[#C9B58D]" />
        <span className="absolute left-1 top-4 h-[2px] w-5 rounded-full bg-[#C9B58D]" />
      </div>
      <div className="absolute bottom-2 left-6 h-7 w-8 rotate-6 rounded-[5px] border-2 border-[#4A3A58] bg-[#FFF1CB] shadow-[0_4px_8px_rgba(60,42,75,0.16)] sm:h-8 sm:w-9">
        <span className="absolute left-2 top-2 h-[2px] w-4 rounded-full bg-[#C9B58D]" />
        <span className="absolute left-2 top-4 h-[2px] w-5 rounded-full bg-[#C9B58D]" />
      </div>
      <div className="absolute bottom-1 left-[30px] h-8 w-[3px] rotate-[34deg] rounded-full bg-[#C77B48] shadow-[0_1px_2px_rgba(70,42,40,0.2)] sm:h-10">
        <span className="absolute -top-2 left-[-2px] h-3 w-2 rounded-t-full bg-[#F5D46B]" />
        <span className="absolute -bottom-1 left-[-2px] h-2 w-2 rotate-45 bg-[#544153]" />
      </div>
    </div>
  );
}

function LibraryTileIcon() {
  const books = [
    ["left-[7px]", "top-2", "h-8", "#B66AA7"],
    ["left-[17px]", "top-1", "h-9", "#6EC4D2"],
    ["left-[28px]", "top-3", "h-7", "#FFD46C"],
    ["left-[39px]", "top-2", "h-8", "#7E6AC7"],
  ];

  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-x-1 bottom-1 h-10 rounded-[5px] border-2 border-[#4A3A58] bg-[#E7BD79] shadow-[0_4px_8px_rgba(60,42,75,0.16)] sm:h-11">
        {books.map(([left, top, height, color]) => (
          <span
            key={`${left}-${color}`}
            className={`absolute ${left} ${top} ${height} w-[7px] rounded-[3px] border border-[#4A3A58]/70`}
            style={{ background: color }}
          />
        ))}
        <span className="absolute bottom-2 left-1 right-1 h-[3px] rounded-full bg-[#4A3A58]/55" />
      </div>
    </div>
  );
}

function WordbankTileIcon() {
  return (
    <div className="relative h-full w-full">
      <div className="absolute bottom-1 left-2 h-9 w-9 -rotate-12 rounded-[5px] border-2 border-[#4A3A58] bg-[#F6F1EE] shadow-[0_4px_8px_rgba(60,42,75,0.14)]">
        <span className="absolute left-2 top-2 text-[10px] font-bold leading-none text-[#4A3A58]">
          VC
        </span>
        <span className="absolute bottom-2 left-2 h-[2px] w-5 rounded-full bg-[#C8BFC7]" />
      </div>
      <div className="absolute bottom-2 left-6 h-9 w-9 rotate-8 rounded-[5px] border-2 border-[#4A3A58] bg-[#FDF8F2] shadow-[0_4px_8px_rgba(60,42,75,0.16)]">
        <span className="absolute left-2 top-2 text-[10px] font-bold leading-none text-[#4A3A58]">
          VC
        </span>
        <span className="absolute bottom-2 left-2 h-[2px] w-5 rounded-full bg-[#C8BFC7]" />
      </div>
    </div>
  );
}

function ChatTileIcon() {
  return (
    <div className="relative h-full w-full">
      <div className="absolute left-1 top-3 h-7 w-9 rounded-[9px] border-2 border-[#4A3A58] bg-[#F3EAFB] shadow-[0_4px_8px_rgba(60,42,75,0.14)]">
        <span className="absolute -bottom-[6px] left-3 h-3 w-3 rotate-45 border-b-2 border-r-2 border-[#4A3A58] bg-[#F3EAFB]" />
        <span className="absolute left-2 top-3 h-[3px] w-4 rounded-full bg-[#AFA0BC]" />
      </div>
      <div className="absolute bottom-1 right-1 h-7 w-9 rounded-[9px] border-2 border-[#4A3A58] bg-[#A8DDF7] shadow-[0_4px_8px_rgba(60,42,75,0.16)]">
        <span className="absolute -bottom-[6px] right-3 h-3 w-3 rotate-45 border-b-2 border-r-2 border-[#4A3A58] bg-[#A8DDF7]" />
        <span className="absolute left-2 top-3 h-[3px] w-4 rounded-full bg-[#5E7E9A]" />
      </div>
      <span className="absolute right-0 top-1 h-3 w-3 rounded-full border border-[#4A3A58] bg-[#F36D77]" />
    </div>
  );
}

/* ── Framer-motion animation variants ── */
const staggerContainer = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};
const fadeSlideUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { type: "spring", damping: 20, stiffness: 200 } },
};
const scaleIn = {
  hidden: { opacity: 0, scale: 0.85 },
  show: { opacity: 1, scale: 1, transition: { type: "spring", damping: 18, stiffness: 180 } },
};

/* ── Floating particles layer ── */
const PARTICLE_COLORS = [
  "rgba(168,130,255,0.5)",
  "rgba(255,182,193,0.45)",
  "rgba(255,213,93,0.4)",
  "rgba(130,220,255,0.4)",
  "rgba(255,150,130,0.35)",
];
function DashboardParticles() {
  const prefersReduced = useReducedMotion();
  if (prefersReduced) return null;
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden>
      {/* Soft glow orbs */}
      {[
        { x: "8%", y: "12%", size: 180, color: "rgba(168,130,255,0.22)", delay: 0 },
        { x: "78%", y: "6%", size: 140, color: "rgba(255,182,193,0.18)", delay: 2 },
        { x: "55%", y: "55%", size: 200, color: "rgba(130,220,255,0.12)", delay: 4 },
        { x: "20%", y: "70%", size: 160, color: "rgba(255,213,93,0.14)", delay: 1 },
      ].map((orb, i) => (
        <div
          key={`orb-${i}`}
          className="absolute rounded-full"
          style={{
            left: orb.x,
            top: orb.y,
            width: orb.size,
            height: orb.size,
            background: `radial-gradient(circle, ${orb.color} 0%, transparent 70%)`,
            animation: `dash-glow-breathe ${7 + i * 1.5}s ease-in-out ${orb.delay}s infinite`,
          }}
        />
      ))}
      {/* Rising particles */}
      {Array.from({ length: 18 }).map((_, i) => {
        const size = 3 + Math.random() * 5;
        const left = `${5 + Math.random() * 90}%`;
        const duration = 12 + Math.random() * 18;
        const delay = Math.random() * 15;
        const driftX = -30 + Math.random() * 60;
        const color = PARTICLE_COLORS[i % PARTICLE_COLORS.length];
        return (
          <div
            key={`p-${i}`}
            className="absolute bottom-0 rounded-full"
            style={{
              left,
              width: size,
              height: size,
              background: color,
              boxShadow: size > 5 ? `0 0 ${size * 2}px ${color}` : undefined,
              "--drift-x": `${driftX}px`,
              animation: `dash-particle-rise ${duration}s linear ${delay}s infinite`,
            } as React.CSSProperties}
          />
        );
      })}
      {/* Sparkle stars */}
      {Array.from({ length: 12 }).map((_, i) => {
        const size = 6 + Math.random() * 8;
        return (
          <svg
            key={`s-${i}`}
            className="absolute"
            style={{
              left: `${8 + Math.random() * 84}%`,
              top: `${5 + Math.random() * 60}%`,
              width: size,
              height: size,
              animation: `dash-sparkle-pulse ${3 + Math.random() * 4}s ease-in-out ${Math.random() * 5}s infinite`,
            }}
            viewBox="0 0 24 24"
            fill="rgba(255,215,0,0.6)"
          >
            <path d="M12 0L14.5 9.5L24 12L14.5 14.5L12 24L9.5 14.5L0 12L9.5 9.5Z" />
          </svg>
        );
      })}
      {/* Shooting streaks */}
      {[0, 1].map(i => (
        <div
          key={`streak-${i}`}
          className="absolute h-[1px] w-[60px]"
          style={{
            top: `${15 + i * 25}%`,
            left: "10%",
            background: `linear-gradient(90deg, transparent, rgba(255,255,255,0.7), transparent)`,
            animation: `dash-streak ${6 + i * 3}s ease-in-out ${i * 8}s infinite`,
          }}
        />
      ))}
    </div>
  );
}

const ACTION_TILES = [
  {
    id: "create",
    label: "Create\nStory",
    colors: "linear-gradient(135deg, #7C3AED 0%, #8B5CF6 42%, #C084FC 100%)",
    accent: "rgba(255,255,255,0.14)",
    tone: "light" as const,
    icon: <CreateStoryTileIcon />,
    action: "create" as const,
  },
  {
    id: "library",
    label: "Library",
    colors: "linear-gradient(135deg, #FF6C7A 0%, #FF8D74 46%, #FFB454 100%)",
    accent: "rgba(255,255,255,0.16)",
    tone: "light" as const,
    icon: <LibraryTileIcon />,
    action: "library" as const,
  },
  {
    id: "wordbank",
    label: "Wordbank",
    colors: "linear-gradient(135deg, #9DE2C8 0%, #A8EDD4 46%, #7CD7D9 100%)",
    accent: "rgba(255,255,255,0.18)",
    tone: "dark" as const,
    icon: <WordbankTileIcon />,
    action: "wordbank" as const,
  },
  {
    id: "chat",
    label: "Chat",
    colors: "linear-gradient(135deg, #79C8FF 0%, #88D4FF 48%, #A8DDF7 100%)",
    accent: "rgba(255,255,255,0.18)",
    tone: "dark" as const,
    icon: <ChatTileIcon />,
    action: "chat" as const,
  },
];

const DAILY_CHALLENGE_XP_REWARD = 50;
const DAILY_CHALLENGE_COIN_REWARD = 200;

function getDisplayName(name: string | null | undefined) {
  const safeName = name?.trim();
  if (!safeName) return "there";
  return safeName.split("@")[0].split(/\s+/)[0];
}

function getInitials(name: string | null | undefined) {
  const safeName = name?.trim();
  if (!safeName) return "?";
  return safeName
    .split("@")[0]
    .split(/\s+/)
    .slice(0, 2)
    .map(part => part[0]?.toUpperCase() ?? "")
    .join("");
}

function getSeedIndex(seed: string, size: number) {
  const source = seed || "storyling";
  let hash = 0;

  for (let index = 0; index < source.length; index += 1) {
    hash = (hash * 31 + source.charCodeAt(index)) % 2147483647;
  }

  return Math.abs(hash) % size;
}

function getAvatarGradient(baseColor: string | null | undefined, seed: string) {
  const accentPalette = [
    "#F6CF9D",
    "#C4A9FF",
    "#8EDFD1",
    "#8FC7FF",
    "#FFB7C6",
    "#FFE186",
  ];
  const fallbackPalette = [
    ["#F7B0C0", "#F6D7E6"],
    ["#7B63E8", "#BCA8FF"],
    ["#71D8C1", "#B8F0DE"],
    ["#79B8FF", "#B7E0FF"],
    ["#FFB57A", "#FFD6A8"],
    ["#9BDFB1", "#D1F3DD"],
  ];

  const paletteIndex = getSeedIndex(seed, fallbackPalette.length);
  const palette = fallbackPalette[paletteIndex];
  const accent = accentPalette[paletteIndex];
  const normalizedColor =
    typeof baseColor === "string" &&
    /^#(?:[0-9a-fA-F]{3}){1,2}$/.test(baseColor)
      ? baseColor
      : null;

  if (normalizedColor) {
    return `linear-gradient(135deg, ${normalizedColor} 0%, ${accent} 100%)`;
  }

  return `linear-gradient(135deg, ${palette[0]} 0%, ${palette[1]} 100%)`;
}

function getBadgeColor(seed: string) {
  const badgePalette = [
    "#F57C7C",
    "#9A7ADF",
    "#78D3B4",
    "#71B9EB",
    "#F5BF54",
    "#F87B69",
  ];
  return badgePalette[getSeedIndex(seed, badgePalette.length)];
}

function getFlagEmoji(language?: string | null) {
  const normalized = language?.toLowerCase() ?? "";
  if (normalized.includes("spanish")) return "\u{1F1EA}\u{1F1F8}";
  if (normalized.includes("french")) return "\u{1F1EB}\u{1F1F7}";
  if (normalized.includes("german")) return "\u{1F1E9}\u{1F1EA}";
  if (normalized.includes("italian")) return "\u{1F1EE}\u{1F1F9}";
  if (normalized.includes("japanese")) return "\u{1F1EF}\u{1F1F5}";
  if (normalized.includes("korean")) return "\u{1F1F0}\u{1F1F7}";
  if (normalized.includes("chinese")) return "\u{1F1E8}\u{1F1F3}";
  if (normalized.includes("portuguese")) return "\u{1F1F5}\u{1F1F9}";
  if (normalized.includes("english")) return "\u{1F1EC}\u{1F1E7}";
  return "LG";
}

function getStoryTitle(story: {
  title?: string | null;
  titleTranslation?: string | null;
  theme?: string | null;
}) {
  return (
    story.title ||
    story.titleTranslation ||
    `${story.theme || "Story"} Adventure`
  );
}

function MiniBookBadge({ color }: { color: string }) {
  return (
    <span
      className="absolute -bottom-0.5 -right-0.5 h-6 w-5 rounded-[6px] border border-white/90"
      style={{
        background: `linear-gradient(180deg, ${color} 0%, color-mix(in srgb, ${color} 78%, white) 100%)`,
        boxShadow: "0 6px 12px rgba(121, 89, 150, 0.16)",
      }}
    >
      <span className="absolute inset-y-[2px] left-[6px] w-[1.5px] rounded-full bg-white/90" />
      <span className="absolute right-[3px] top-[2px] h-[2px] w-[6px] rounded-full bg-white/80" />
      <span className="absolute right-[3px] top-[6px] h-[2px] w-[6px] rounded-full bg-white/80" />
    </span>
  );
}

function TopBadge({
  icon,
  value,
  variant,
}: {
  icon: ReactNode;
  value: number;
  variant: "purple" | "gold";
}) {
  const background =
    variant === "purple"
      ? "linear-gradient(135deg, rgba(182,142,255,0.85) 0%, rgba(197,168,255,0.72) 100%)"
      : "linear-gradient(135deg, rgba(255,206,112,0.92) 0%, rgba(255,175,86,0.92) 100%)";

  return (
    <div
      className="flex min-w-[76px] items-center justify-center gap-1 rounded-full px-2 py-1 text-[0.78rem] font-semibold text-[#3A2456] sm:min-w-[88px] sm:gap-1.5 sm:px-2.5 sm:py-1.5 sm:text-[0.88rem] xl:min-w-[104px] xl:px-3 xl:text-[1rem]"
      style={{
        background,
        boxShadow:
          "0 14px 24px rgba(157, 133, 206, 0.16), inset 0 1px 0 rgba(255,255,255,0.52)",
      }}
    >
      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-white/38 text-[0.8rem] sm:h-[22px] sm:w-[22px] sm:text-[0.86rem] xl:h-7 xl:w-7 xl:text-[1rem]">
        {icon}
      </span>
      <span>{value}</span>
    </div>
  );
}

function StorylingMascot({
  className = "",
  imageClassName = "",
}: {
  className?: string;
  imageClassName?: string;
}) {
  return (
    <div className={`relative ${className}`}>
      <Sparkles
        className="absolute left-1 top-3 h-6 w-6 text-[#F2C261]"
        strokeWidth={1.9}
      />
      <Sparkles
        className="absolute left-9 top-0 h-4 w-4 text-[#5B466D]"
        strokeWidth={1.8}
        style={{ opacity: 0.75 }}
      />
      <span className="absolute left-3 top-11 h-2 w-2 rounded-full bg-[#5C476C]" />
      <Sparkles
        className="absolute right-3 top-5 h-5 w-5 text-[#E8DEC0]"
        strokeWidth={1.8}
        style={{ opacity: 0.92 }}
      />
      <span className="absolute right-7 top-2 h-2.5 w-2.5 rounded-full bg-[#E8DEC0]" />
      <img
        src={APP_LOGO}
        alt="Storyling mascot"
        className={`h-full w-full object-contain drop-shadow-[0_18px_26px_rgba(151,122,196,0.22)] ${imageClassName}`}
      />
    </div>
  );
}

function ActionTile({
  label,
  colors,
  accent,
  tone,
  icon,
  onClick,
  tutorial,
}: {
  label: string;
  colors: string;
  accent: string;
  tone: "light" | "dark";
  icon: ReactNode;
  onClick: () => void;
  tutorial?: string;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      data-tutorial={tutorial}
      variants={scaleIn}
      whileHover={{ scale: 1.04, y: -4 }}
      whileTap={{ scale: 0.97 }}
      className="group relative flex h-[74px] overflow-hidden rounded-[18px] px-4 py-3 text-left text-[#24173A] shadow-[0_14px_26px_rgba(170,140,216,0.28)] sm:h-[84px] sm:rounded-[22px] lg:h-[96px] lg:px-4 lg:py-4 xl:h-[106px] xl:px-5 xl:py-5 2xl:h-[116px]"
      style={{ background: colors }}
    >
      {/* Shimmer sweep on hover */}
      <div className="absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100">
        <div
          className="absolute inset-0"
          style={{
            background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.25) 50%, transparent 60%)",
            animation: "dash-card-shimmer 1.8s ease-in-out infinite",
          }}
        />
      </div>
      <div
        className="absolute -right-5 top-1/2 h-20 w-20 -translate-y-1/2 rounded-full transition-transform duration-500 group-hover:scale-125 sm:h-24 sm:w-24 xl:h-28 xl:w-28"
        style={{ background: accent }}
      />
      <div className="relative flex h-full w-full items-center justify-between gap-3">
        <span
          className={`whitespace-pre-line text-[1rem] font-semibold leading-[1.05] sm:text-[1.12rem] lg:text-[1.05rem] xl:text-[1.22rem] 2xl:text-[1.42rem] ${tone === "light" ? "text-white" : "text-[#2A2438]"}`}
          style={
            tone === "light"
              ? { textShadow: "0 2px 10px rgba(75, 44, 107, 0.18)" }
              : undefined
          }
        >
          {label}
        </span>
        <span
          className={`flex h-[50px] w-[50px] items-center justify-center rounded-[16px] p-3 shadow-inner transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110 sm:h-[56px] sm:w-[56px] lg:h-[54px] lg:w-[54px] lg:rounded-[18px] xl:h-[64px] xl:w-[64px] xl:rounded-[20px] 2xl:h-[74px] 2xl:w-[74px] 2xl:rounded-[22px] ${tone === "light" ? "bg-white/24 text-white" : "bg-white/30 text-[#3D3158]"}`}
        >
          {icon}
        </span>
      </div>
    </motion.button>
  );
}

function ContinueCard({
  item,
  onClick,
}: {
  item: ContinueItem;
  onClick: () => void;
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      variants={fadeSlideUp}
      whileHover={{ scale: 1.03, y: -3 }}
      whileTap={{ scale: 0.98 }}
      className="group relative flex min-h-[96px] overflow-hidden rounded-[18px] bg-[linear-gradient(135deg,#CAA3FF_0%,#F6D2E3_100%)] p-2.5 text-left shadow-[0_14px_28px_rgba(177,145,213,0.24)] sm:min-h-[116px] sm:rounded-[22px] sm:p-3 lg:min-h-[138px] lg:rounded-[24px] lg:p-3.5 xl:min-h-[148px] xl:p-4 2xl:min-h-[166px] 2xl:p-5"
    >
      {/* Bookmark ribbon */}
      <div className="absolute right-3 top-0 z-10 h-5 w-3 rounded-b-[3px] bg-[linear-gradient(180deg,#FF7A79_0%,#FF8E86_100%)] shadow-[0_4px_8px_rgba(236,108,123,0.24)] sm:right-4 sm:h-6 sm:w-3.5" />

      <div className="flex w-full items-start gap-2.5 sm:gap-3 xl:gap-4">
        {/* Thumbnail — square, left side */}
        <div className="h-[76px] w-[66px] shrink-0 overflow-hidden rounded-[14px] bg-[linear-gradient(135deg,#7A56B7_0%,#A69BFF_100%)] shadow-[0_10px_18px_rgba(89,70,149,0.26)] sm:h-[92px] sm:w-[80px] sm:rounded-[18px] lg:h-[84px] lg:w-[72px] xl:h-[94px] xl:w-[82px] xl:rounded-[20px] 2xl:h-[108px] 2xl:w-[94px]">
          {item.thumbnailUrl ? (
            <img
              src={item.thumbnailUrl}
              alt={item.title}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-white">
              <BookOpen className="h-7 w-7 sm:h-10 sm:w-10" />
            </div>
          )}
        </div>

        {/* Content — right side */}
        <div className="flex min-w-0 flex-1 flex-col justify-between self-stretch">
          <h3 className="line-clamp-3 text-[0.78rem] font-semibold leading-tight text-[#2E2147] sm:text-[0.95rem] lg:text-[0.94rem] xl:text-[1.04rem] 2xl:text-[1.2rem]">
            {item.title}
          </h3>

          <div className="mt-auto flex items-center justify-between gap-1.5 text-[0.66rem] font-medium text-[#4E356B] sm:gap-3 sm:text-[0.78rem] lg:text-[0.8rem] xl:text-[0.9rem] 2xl:text-sm">
            <span className="inline-flex min-w-0 items-center gap-1 rounded-full bg-white/78 px-2 py-0.5 sm:gap-2 sm:px-3 sm:py-1 lg:px-2.5 xl:px-3 xl:py-1.5">
              <span className="text-[0.62rem] sm:text-[0.72rem]">
                {getFlagEmoji(item.targetLanguage)}
              </span>
              <span className="truncate text-[0.62rem] sm:text-[0.72rem]">
                {item.targetLanguage || "Language"}
              </span>
            </span>
            <span className="text-[0.66rem] sm:text-[0.78rem]">
              {item.progressPercent}%
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}

function ExploreAvatarCard({ avatar }: { avatar: ExploreAvatar }) {
  return (
    <motion.div
      className="relative flex min-w-[68px] flex-col items-center gap-2 xl:min-w-[74px]"
      whileHover={{ scale: 1.12, y: -4 }}
      whileTap={{ scale: 0.95 }}
      transition={{ type: "spring", stiffness: 300, damping: 15 }}
    >
      <div className="relative h-[60px] w-[60px] rounded-full bg-white p-[3px] shadow-[0_8px_18px_rgba(170,143,215,0.18)] transition-shadow duration-300 hover:shadow-[0_12px_28px_rgba(170,143,215,0.32)] xl:h-[66px] xl:w-[66px]">
        <div className="h-full w-full rounded-full border-[3px] border-[#B28EEA] bg-white p-[3px]">
          {avatar.avatarUrl ? (
            <img
              src={avatar.avatarUrl}
              alt={avatar.name}
              className="h-full w-full rounded-full object-cover"
            />
          ) : (
            <div
              className="flex h-full w-full items-center justify-center rounded-full text-sm font-semibold text-white xl:text-base"
              style={{ background: avatar.gradient }}
            >
              {getInitials(avatar.name)}
            </div>
          )}
        </div>
        <MiniBookBadge color={avatar.badge} />
      </div>
    </motion.div>
  );
}

export default function AdventureMap() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();
  const [showPremiumWelcome, setShowPremiumWelcome] = useState(false);

  useChallengeDetection();

  const pullRefresh = async () => {
    await Promise.all([
      utils.auth.me.invalidate(),
      utils.gamification.getMyStats.invalidate(),
      utils.content.getLibrary.invalidate(),
      utils.storyProgress.getRecentlyWatched.invalidate(),
      utils.wordbank.getDueCount.invalidate(),
      utils.wordbank.getReviewStreak.invalidate(),
      utils.weeklyGoal.getWeeklyGoalStatus.invalidate(),
      utils.practice.getStats.invalidate(),
    ]);
  };

  const { data: stats } = trpc.gamification.getMyStats.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: dueCount } = trpc.wordbank.getDueCount.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: reviewStreak } = trpc.wordbank.getReviewStreak.useQuery(
    undefined,
    {
      enabled: isAuthenticated,
    }
  );
  const { data: weeklyGoal } = trpc.weeklyGoal.getWeeklyGoalStatus.useQuery(
    undefined,
    {
      enabled: isAuthenticated,
    }
  );
  const { data: library } = trpc.content.getLibrary.useQuery(undefined, {
    enabled: isAuthenticated,
  });
  const { data: recentlyWatched } =
    trpc.storyProgress.getRecentlyWatched.useQuery(undefined, {
      enabled: isAuthenticated,
    });
  const { data: discoveryFeed } = trpc.discovery.getDiscoveryFeed.useQuery(
    {
      userId: user?.id,
      limit: 12,
    },
    {
      enabled: isAuthenticated,
    }
  );

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
        if (!updatedUser.premiumOnboardingCompleted) {
          setShowPremiumWelcome(true);
        }
        return;
      }

      if (attempts >= 10) {
        window.clearInterval(pollInterval);
        setShowPremiumWelcome(true);
      }
    }, 1000);

    return () => window.clearInterval(pollInterval);
  }, [isAuthenticated, user, utils]);

  const displayName = getDisplayName(user?.name || user?.email);
  const initials = getInitials(user?.name || user?.email);
  const headerAvatarGradient = getAvatarGradient(
    null,
    user?.name || user?.email || "storyling"
  );
  const displayStreak = Math.max(
    stats?.currentStreak ?? 0,
    reviewStreak?.currentStreak ?? 0,
    0
  );
  const displayXp = stats?.totalXp ?? 0;
  const displayWordsLearned = stats?.wordsLearned ?? 0;
  const libraryLanguageById = useMemo(() => {
    return new Map(
      (library ?? []).map(story => [story.id, story.targetLanguage || null])
    );
  }, [library]);

  const continueWatching = useMemo<ContinueItem[]>(() => {
    if (recentlyWatched && recentlyWatched.length > 0) {
      return recentlyWatched.slice(0, 2).map((item, index) => ({
        id: item?.id ?? index,
        title: getStoryTitle(item || {}),
        subtitle: item?.titleTranslation || null,
        thumbnailUrl: item?.thumbnailUrl,
        targetLanguage: libraryLanguageById.get(item?.id ?? -1) || null,
        progressPercent: item?.progress?.progressPercent ?? 0,
      }));
    }

    if (library && library.length > 0) {
      return library
        .filter(item => item.status === "completed")
        .slice(0, 2)
        .map(item => ({
          id: item.id,
          title: getStoryTitle(item),
          subtitle: item.titleTranslation,
          thumbnailUrl: item.thumbnailUrl,
          targetLanguage: item.targetLanguage || null,
          progressPercent: 100,
        }));
    }

    return [];
  }, [library, libraryLanguageById, recentlyWatched]);

  const exploreAvatars = useMemo<ExploreAvatar[]>(() => {
    const collections = [
      ...(discoveryFeed?.personalized ?? []),
      ...(discoveryFeed?.new ?? []),
      ...(discoveryFeed?.trending ?? []),
      ...(discoveryFeed?.popular ?? []),
    ];
    const uniqueCreators = new Map<string, ExploreAvatar>();

    for (const collection of collections) {
      const creatorKey = String(collection.userId ?? collection.id);
      if (uniqueCreators.has(creatorKey)) continue;

      const creatorName = collection.userName?.trim() || "Creator";
      uniqueCreators.set(creatorKey, {
        id: creatorKey,
        name: creatorName,
        gradient: getAvatarGradient(collection.color, creatorName),
        badge: getBadgeColor(`${creatorName}-${collection.id}`),
        avatarUrl: collection.avatarUrl,
        targetPath: collection.shareToken
          ? `/shared/${collection.shareToken}`
          : "/discover",
        collectionName: collection.name || "Untitled collection",
      });

      if (uniqueCreators.size >= 10) break;
    }

    return Array.from(uniqueCreators.values());
  }, [discoveryFeed]);

  const challengeCopy = useMemo(() => {
    const reviewsDue = dueCount?.count ?? 0;
    const weeklyGoalTarget = weeklyGoal?.weeklyGoal ?? user?.weeklyGoal ?? 5;
    const weeklyProgress =
      weeklyGoal?.weeklyProgress ?? user?.weeklyProgress ?? 0;
    const weeklyRemaining = Math.max(0, weeklyGoalTarget - weeklyProgress);

    if (reviewsDue > 0) {
      return {
        title: "Daily Challenge",
        subtitle: `Review ${reviewsDue} word${reviewsDue > 1 ? "s" : ""} in your wordbank today.`,
        actionLabel: "Start Challenge",
        action: () => setLocation("/wordbank"),
      };
    }

    if (weeklyRemaining > 0) {
      return {
        title: "Daily Challenge",
        subtitle: `Create ${weeklyRemaining} more stor${weeklyRemaining > 1 ? "ies" : "y"} to hit your weekly goal.`,
        actionLabel: "Start Challenge",
        action: () => setLocation("/create"),
      };
    }

    return {
      title: "Daily Challenge",
      subtitle: "You reached your weekly goal. Explore and continue learning.",
      actionLabel: "Explore Now",
      action: () => setLocation("/discover"),
    };
  }, [
    dueCount?.count,
    setLocation,
    user?.weeklyGoal,
    user?.weeklyProgress,
    weeklyGoal?.weeklyGoal,
    weeklyGoal?.weeklyProgress,
  ]);

  const challengeBadges = [
    {
      icon: <Gem className="h-[14px] w-[14px]" />,
      label: `+${DAILY_CHALLENGE_XP_REWARD} XP`,
      className:
        "bg-[linear-gradient(135deg,#C8AAFF_0%,#A87BFF_100%)] text-white shadow-[0_6px_14px_rgba(152,107,255,0.30)]",
    },
    {
      icon: <Coins className="h-[14px] w-[14px]" />,
      label: `+${DAILY_CHALLENGE_COIN_REWARD} coins`,
      className:
        "bg-[linear-gradient(135deg,#FFD055_0%,#FFB830_100%)] text-[#7A4800] shadow-[0_6px_14px_rgba(255,184,48,0.32)]",
    },
  ];

  const handleTileAction = (
    action: (typeof ACTION_TILES)[number]["action"]
  ) => {
    if (action === "create") {
      setLocation("/create");
      return;
    }

    if (action === "library") {
      setLocation("/library");
      return;
    }

    if (action === "wordbank") {
      setLocation("/wordbank");
      return;
    }

    window.dispatchEvent(new CustomEvent("open-booki-chat"));
  };

  if (loading) {
    return (
      <div
        className="storyling-loader-screen"
        role="status"
        aria-live="polite"
      >
        <div className="storyling-loader-stage">
          <div className="storyling-loader-mascot" aria-hidden="true">
            <img
              src={APP_LOGO}
              alt=""
              className="storyling-loader-logo"
            />
          </div>
          <div className="storyling-loader-copy">
            <p className="storyling-loader-title">Opening your story world</p>
            <div className="storyling-page-loader" aria-hidden="true">
              <span />
              <span />
              <span />
              <span />
            </div>
          </div>
          <span className="sr-only">Loading Storyling</span>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[linear-gradient(180deg,#D9D1FF_0%,#FDFBFF_56%,#FFFDFE_100%)] flex items-center justify-center p-4">
        <Card className="w-full max-w-md overflow-hidden rounded-[32px] border-0 shadow-[0_24px_60px_rgba(175,149,220,0.22)]">
          <div className="h-2 bg-[linear-gradient(90deg,#8A5EFF_0%,#FF8A7E_50%,#FFB859_100%)]" />
          <CardContent className="space-y-6 px-8 py-10 text-center">
            <img
              src={APP_LOGO}
              alt="Storyling.ai"
              className="mx-auto h-28 w-28 animate-float"
            />
            <div className="space-y-2">
              <h2 className="text-3xl font-bold text-gray-900">
                Welcome to {APP_TITLE}
              </h2>
              <p className="text-lg text-gray-500">
                Sign in to open your dashboard.
              </p>
            </div>
            <Button
              size="lg"
              onClick={() => {
                window.location.href = getLoginUrl();
              }}
              className="h-14 rounded-full border-0 bg-[linear-gradient(135deg,#8A5EFF_0%,#5DAFFF_100%)] px-8 text-lg text-white shadow-[0_14px_28px_rgba(132,104,225,0.32)]"
            >
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
        @keyframes floaty {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-8px); }
        }
        @keyframes shimmer-drift {
          0%, 100% { transform: translateX(0px) rotate(-1deg); opacity: 0.7; }
          50% { transform: translateX(12px) rotate(2deg); opacity: 1; }
        }
      `}</style>

      <QuickStartTutorial autoScrollTargets={false} />
      <WeeklyGoalOnboarding />
      <PremiumWelcomeModal
        open={showPremiumWelcome}
        onClose={() => setShowPremiumWelcome(false)}
      />

      <BottomTabBar />

      <PullToRefresh
        onRefresh={pullRefresh}
        className="min-h-screen bg-[linear-gradient(180deg,#C9B8F2_0%,#DDD4FA_18%,#F4F0FF_35%,#FFFDFE_60%,#FFF9FD_100%)]"
      >
        <div className="relative overflow-hidden pb-24 lg:pb-36">
          {/* Animated particles background */}
          <DashboardParticles />
          <div
            className="pointer-events-none absolute inset-x-0 top-0 h-[420px]"
            style={{
              background:
                "radial-gradient(circle at 10% 20%, rgba(255,255,255,0.55) 0%, transparent 32%), radial-gradient(circle at 85% 14%, rgba(253,207,121,0.22) 0%, transparent 20%), radial-gradient(circle at 50% 60%, rgba(210,180,255,0.18) 0%, transparent 22%)",
            }}
          />

          <motion.div
            className="relative mx-auto w-full max-w-[1180px] px-4 pb-4 pt-3 sm:px-6 sm:pt-4 xl:px-7 2xl:max-w-[1220px] 2xl:pt-6"
            initial="hidden"
            animate="show"
            variants={staggerContainer}
          >
            <motion.section variants={fadeSlideUp} className="relative z-20 mb-0 rounded-[34px] bg-transparent px-1 py-0.5 sm:mb-1 lg:mb-3">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] gap-2.5 lg:grid-cols-[minmax(0,1fr)_auto_auto] lg:items-center lg:gap-3.5 xl:gap-4">
                {/* Avatar + Name */}
                <div className="flex min-w-0 items-center gap-2.5 xl:gap-3.5">
                  <div
                    className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-full border-[3px] border-white text-[0.98rem] font-semibold text-white shadow-[0_10px_22px_rgba(164,132,211,0.18)] sm:h-[60px] sm:w-[60px] sm:text-[1.12rem] 2xl:h-[68px] 2xl:w-[68px] 2xl:text-[1.26rem]"
                    style={{ background: headerAvatarGradient }}
                  >
                    {user?.avatarUrl ? (
                      <img
                        src={user.avatarUrl}
                        alt={displayName}
                        className="h-full w-full rounded-full object-cover"
                      />
                    ) : (
                      initials
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate whitespace-nowrap text-[1.48rem] font-semibold leading-none text-[#241436] sm:text-[1.8rem] xl:text-[2.25rem] 2xl:text-[2.65rem]">
                      Hey {displayName}!
                    </p>
                  </div>
                </div>

                {/* Streak badge — same row as name on mobile (col 2, right-aligned) */}
                <div className="flex items-center justify-end lg:justify-center">
                  <motion.div
                    className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-[0.95rem] font-semibold text-[#3A2208] sm:gap-2 sm:px-4 sm:text-[1.02rem] xl:px-5 xl:text-[1.18rem] 2xl:gap-2.5 2xl:py-2.5 dash-animate-gradient"
                    style={{
                      background:
                        "linear-gradient(135deg, #FFD56D 0%, #FFCA4D 33%, #FFB95A 66%, #FFD56D 100%)",
                      backgroundSize: "200% 200%",
                      boxShadow:
                        "0 16px 28px rgba(243, 162, 81, 0.28), inset 0 1px 0 rgba(255,255,255,0.55)",
                    }}
                    animate={{ scale: [1, 1.04, 1] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                  >
                    <Flame className="h-5 w-5 text-[#FF7A00] sm:h-[22px] sm:w-[22px] xl:h-[26px] xl:w-[26px]" />
                    <span>
                      {displayStreak} {displayStreak === 1 ? "Day" : "Days"}{" "}
                      Streak
                    </span>
                  </motion.div>
                </div>

                {/* Gems + Coins — spans both cols on mobile, own col on desktop */}
                <div className="col-span-2 hidden flex-wrap items-center gap-2.5 lg:col-span-1 lg:flex lg:justify-self-end">
                  <TopBadge
                    icon={<Gem className="h-5 w-5" />}
                    value={displayXp}
                    variant="purple"
                  />
                  <TopBadge
                    icon={<Coins className="h-5 w-5" />}
                    value={displayWordsLearned}
                    variant="gold"
                  />
                </div>
              </div>

              <div className="relative mt-1 h-[56px] sm:h-[64px] lg:hidden">
                <div className="absolute inset-x-0 top-0 z-20 h-[108px]">
                  <StorylingMascot
                    className="absolute left-[18px] -top-3 z-30 h-[96px] w-[96px] animate-[floaty_4s_ease-in-out_infinite]"
                    imageClassName="-rotate-[6deg]"
                  />
                  <div className="absolute left-[96px] -top-1 z-40">
                    <div className="absolute -left-2 top-1/2 h-0 w-0 -translate-y-1/2 border-y-[8px] border-r-[10px] border-y-transparent border-r-white/95 drop-shadow-[0_10px_14px_rgba(178,157,223,0.18)]" />
                    <div className="whitespace-nowrap rounded-[18px] bg-white/95 px-4 py-2.5 text-[1rem] font-medium text-[#3B2A50] shadow-[0_14px_22px_rgba(178,157,223,0.2)]">
                      Keep it up!
                    </div>
                  </div>
                  <div className="absolute right-0 top-[38px] z-40 flex items-center gap-2">
                    <TopBadge
                      icon={<Gem className="h-4 w-4" />}
                      value={displayXp}
                      variant="purple"
                    />
                    <TopBadge
                      icon={<Coins className="h-4 w-4" />}
                      value={displayWordsLearned}
                      variant="gold"
                    />
                  </div>
                </div>
              </div>
            </motion.section>

            <motion.section variants={fadeSlideUp} className="relative z-10 overflow-visible rounded-[30px] bg-white/90 p-4 shadow-[0_18px_42px_rgba(174,150,220,0.16),0_4px_12px_rgba(174,150,220,0.06)] backdrop-blur-[12px] sm:rounded-[34px] sm:p-5 lg:p-5 xl:p-6 2xl:rounded-[40px] 2xl:p-8">
              {/* TOP GRID: action tiles | mascot (desktop) | continue watching */}
              <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_318px] lg:grid-rows-[auto_auto] lg:items-start lg:gap-6 xl:grid-cols-[minmax(0,1fr)_336px] 2xl:grid-cols-[minmax(0,1fr)_360px] 2xl:gap-8">
                {/* LEFT: Action tiles — 2×2 always */}
                <div className="lg:col-start-1 lg:row-start-1">
                  <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_188px] lg:items-center lg:gap-5 xl:grid-cols-[minmax(0,1fr)_204px] 2xl:grid-cols-[minmax(0,1fr)_280px] 2xl:gap-8">
                    <motion.div variants={staggerContainer} initial="hidden" animate="show" className="grid grid-cols-2 gap-4 lg:gap-3.5 xl:gap-4">
                      {ACTION_TILES.map(tile => (
                        <ActionTile
                          key={tile.id}
                          label={tile.label}
                          colors={tile.colors}
                          accent={tile.accent}
                          tone={tile.tone}
                          icon={tile.icon}
                          onClick={() => handleTileAction(tile.action)}
                          tutorial={
                            tile.id === "create"
                              ? "create-story"
                              : tile.id === "library"
                                ? "library"
                                : tile.id === "wordbank"
                                  ? "wordbank"
                                  : undefined
                          }
                        />
                      ))}
                    </motion.div>

                    {/* CENTER: Mascot + speech bubble (desktop only) */}
                    <div className="hidden lg:flex lg:items-center lg:justify-center">
                      <div className="relative w-[188px] xl:w-[210px] 2xl:w-[282px]">
                        <StorylingMascot
                          className="h-[162px] w-[162px] animate-[floaty_4s_ease-in-out_infinite] xl:h-[178px] xl:w-[178px] 2xl:h-[200px] 2xl:w-[200px]"
                          imageClassName="-rotate-[6deg]"
                        />
                        <div className="absolute left-1/2 top-[130px] z-10 flex -translate-x-1/2 flex-col items-center xl:top-[144px] 2xl:top-[164px]">
                          <div className="h-3.5 w-3.5 -mb-2 rotate-45 rounded-[3px] bg-white/95 shadow-[0_8px_16px_rgba(178,157,223,0.12)] 2xl:h-4 2xl:w-4" />
                          <div className="whitespace-nowrap rounded-[20px] bg-white/95 px-4 py-2.5 text-[0.95rem] font-medium text-[#3B2A50] shadow-[0_10px_20px_rgba(178,157,223,0.18)] xl:text-[1.02rem] 2xl:rounded-[22px] 2xl:px-5 2xl:py-3 2xl:text-[1.14rem]">
                            Keep it up!
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                {/* RIGHT: Continue Watching */}
                <div
                  className="relative lg:col-start-2 lg:row-span-2"
                  data-tutorial="recently-watched"
                >
                  <Sparkles
                    className="pointer-events-none absolute right-14 -top-1 h-4 w-4 text-[#DDD2F0] opacity-80"
                    strokeWidth={1.6}
                  />
                  <Sparkles
                    className="pointer-events-none absolute right-0 top-5 h-6 w-6 text-[#DDD2F0]"
                    strokeWidth={1.6}
                  />
                  <span className="pointer-events-none absolute right-2 -top-0.5 h-2 w-2 rounded-full bg-[#DDD2F0] opacity-70" />
                  <span className="pointer-events-none absolute right-8 top-8 h-1.5 w-1.5 rounded-full bg-[#DDD2F0] opacity-50" />
                  <motion.div variants={fadeSlideUp} className="mb-3 flex items-center justify-between xl:mb-4">
                    <h2 className="text-[1.55rem] font-semibold leading-none text-[#231532] xl:text-[1.7rem] 2xl:text-[1.9rem]">
                      Continue Watching
                    </h2>
                  </motion.div>
                  {continueWatching.length > 0 ? (
                    <div className="grid grid-cols-2 gap-3 lg:grid-cols-1 lg:gap-3.5 xl:gap-4">
                      {continueWatching.map(item => (
                        <ContinueCard
                          key={item.id}
                          item={item}
                          onClick={() => setLocation(`/content/${item.id}`)}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[24px] bg-[linear-gradient(135deg,#F5EEFF_0%,#FCE8F3_100%)] px-5 py-4 text-[#4E356B] shadow-[0_12px_24px_rgba(177,145,213,0.18)] lg:rounded-[28px] lg:p-5">
                      <p className="text-[1rem] font-semibold text-[#2E2147] lg:text-[1.08rem]">
                        No story in progress yet
                      </p>
                      <p className="mt-1 hidden text-[0.88rem] leading-relaxed sm:block lg:mt-2 lg:text-[0.94rem]">
                        Open your library or create a new story to start
                        tracking progress here.
                      </p>
                      <button
                        type="button"
                        onClick={() => setLocation("/library")}
                        className="mt-3 inline-flex h-10 items-center justify-center rounded-full bg-white/90 px-5 text-[0.9rem] font-semibold text-[#5A3D7B] shadow-[0_10px_18px_rgba(177,145,213,0.16)] transition-transform duration-200 hover:-translate-y-0.5 lg:mt-4 lg:h-11 lg:text-[0.95rem]"
                      >
                        Open Library
                      </button>
                    </div>
                  )}
                </div>

                {/* DAILY CHALLENGE — full-width below the top grid */}
                <div className="lg:col-start-1 lg:row-start-2">
                  <div className="relative mt-6 overflow-visible rounded-[28px] border border-[#EDE4F6] bg-[linear-gradient(105deg,#F3EDFF_0%,#FDFBFF_35%,#FFFDFE_100%)] shadow-[0_8px_24px_rgba(179,156,223,0.10)] lg:mt-0">
                    <Sparkles
                      className="pointer-events-none absolute right-4 top-3 h-4 w-4 text-[#D4C9B8] opacity-50"
                      strokeWidth={1.5}
                    />
                    <span className="pointer-events-none absolute right-10 top-2.5 h-1.5 w-1.5 rounded-full bg-[#D4C9B8] opacity-40" />

                    <div className="flex items-center gap-2.5 px-3 py-3.5 sm:gap-4 sm:px-5 sm:py-4 lg:gap-4 lg:px-5 lg:py-3">
                      {/* Mascot */}
                      <div className="relative h-[72px] w-[76px] shrink-0 sm:h-[78px] sm:w-[88px] lg:h-[56px] lg:w-[72px] xl:h-[62px] xl:w-[80px] 2xl:h-[76px] 2xl:w-[100px]">
                        <StorylingMascot
                          className="pointer-events-none absolute z-10 -left-5 -top-4 h-[96px] w-[96px] sm:-left-8 sm:-top-6 sm:h-[116px] sm:w-[116px] lg:-left-7 lg:-top-5 lg:h-[92px] lg:w-[92px] xl:-left-8 xl:-top-6 xl:h-[102px] xl:w-[102px] 2xl:-left-10 2xl:-top-8 2xl:h-[130px] 2xl:w-[130px]"
                          imageClassName="-rotate-[8deg]"
                        />
                      </div>

                      {/* Content — title + subtitle left, badges + button right */}
                      <div className="min-w-0 flex-1">
                        <p className="truncate whitespace-nowrap text-[0.92rem] font-semibold leading-none text-[#231532] sm:text-[1.2rem] lg:text-[0.95rem] xl:text-[1rem] 2xl:text-[1.15rem]">
                          {challengeCopy.title}
                        </p>
                        <p className="mt-1.5 text-[0.76rem] leading-[1.2] text-[#6B5A82] sm:text-[0.86rem] lg:text-[0.76rem] xl:text-[0.8rem] 2xl:text-[0.88rem]">
                          {challengeCopy.subtitle}
                        </p>
                      </div>

                      {/* Right column — badges stacked above button, same width */}
                      <div className="flex w-max shrink-0 flex-col items-stretch gap-1.5 sm:w-[164px] sm:gap-2 lg:w-auto lg:gap-1.5">
                        <div className="flex w-full items-center justify-between gap-1 sm:gap-2">
                          {challengeBadges.map(badge => (
                            <div
                              key={badge.label}
                              className={`inline-flex h-[21px] shrink-0 items-center gap-0.5 rounded-full px-1.5 text-[0.6rem] font-semibold sm:h-[26px] sm:gap-1 sm:px-2.5 sm:text-[0.74rem] lg:h-[22px] lg:px-2 lg:text-[0.68rem] xl:h-[24px] xl:px-2.5 xl:text-[0.7rem] 2xl:h-[26px] 2xl:px-3 2xl:text-[0.76rem] ${badge.className}`}
                            >
                              {badge.icon}
                              {badge.label}
                            </div>
                          ))}
                        </div>
                        <motion.button
                          type="button"
                          onClick={challengeCopy.action}
                          whileHover={{ scale: 1.05, y: -2 }}
                          whileTap={{ scale: 0.96 }}
                          className="relative inline-flex h-[40px] w-full items-center justify-center overflow-hidden rounded-full bg-[linear-gradient(180deg,#FF9B8E_0%,#FF8577_50%,#FF7468_100%)] px-3 text-[0.8rem] font-semibold text-white shadow-[0_8px_18px_rgba(255,118,116,0.22)] sm:h-[44px] sm:px-6 sm:text-[0.92rem] lg:h-[36px] lg:px-4 lg:text-[0.78rem] xl:h-[38px] xl:px-5 xl:text-[0.82rem] 2xl:h-[44px] 2xl:px-6 2xl:text-[0.92rem]"
                        >
                          {challengeCopy.actionLabel}
                        </motion.button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div
                className="mt-7 border-t border-[#EEE8FA] pt-5 xl:mt-9 xl:pt-7"
                data-tutorial="progress-tracking"
              >
                <motion.div variants={fadeSlideUp} className="mb-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <h2 className="text-[1.65rem] font-semibold leading-none text-[#231532] xl:text-[1.78rem] 2xl:text-[1.9rem]">
                      Explore new stories
                    </h2>
                    {/* Decorative confetti streamer */}
                    <span className="pointer-events-none hidden select-none text-[0.85rem] opacity-60 sm:inline">
                      💜✨⭐🩷🎵✨
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setLocation("/discover")}
                    className="inline-flex h-10 w-10 items-center justify-center rounded-full text-[#B1A1CE] transition-colors hover:bg-[#F6F1FF] hover:text-[#7C63A6]"
                    aria-label="Open discover"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </motion.div>

                <div className="relative">
                  <div
                    className="pointer-events-none absolute left-1/2 top-[-8px] hidden h-16 w-48 -translate-x-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,120,168,0.15)_0%,rgba(193,145,255,0.08)_46%,transparent_75%)] md:block"
                    style={{
                      animation: "shimmer-drift 5s ease-in-out infinite",
                    }}
                  />
                  {exploreAvatars.length > 0 ? (
                    <div className="relative flex gap-3 overflow-x-auto pb-2 [scrollbar-width:none] xl:gap-4 [&::-webkit-scrollbar]:hidden">
                      {exploreAvatars.map((avatar, i) => (
                        <button
                          type="button"
                          key={avatar.id}
                          onClick={() => setLocation(avatar.targetPath)}
                          className="relative shrink-0"
                          aria-label={`Open ${avatar.collectionName} by ${avatar.name}`}
                          title={`${avatar.name} · ${avatar.collectionName}`}
                        >
                          <ExploreAvatarCard avatar={avatar} />
                          {/* Decorative mini books below avatars */}
                          {i < 8 && (
                            <span
                              className="pointer-events-none absolute -bottom-1 left-1/2 -translate-x-1/2 text-[0.7rem] opacity-80"
                              style={{ filter: `hue-rotate(${i * 42}deg)` }}
                            >
                              📖
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[24px] bg-[linear-gradient(135deg,#F7F2FF_0%,#FFF8FC_100%)] px-5 py-4 text-[0.95rem] text-[#6C5687] shadow-[0_10px_20px_rgba(177,145,213,0.12)]">
                      No public stories available yet.
                    </div>
                  )}
                </div>
              </div>
            </motion.section>

            <motion.div variants={fadeSlideUp} className="pointer-events-none absolute inset-x-0 top-[92px] hidden lg:block">
              <div className="mx-auto flex max-w-[1220px] justify-end px-8">
                <span className="mr-[230px] mt-1 text-[#F9B252]">* *</span>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </PullToRefresh>
    </>
  );
}
