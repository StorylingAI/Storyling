import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { BookMarked, BookOpen, Globe, Home, Plus, Settings } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_LOGO, APP_TITLE } from "@/const";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [location] = useLocation();

  const appPages = [
    "/app",
    "/dashboard",
    "/create",
    "/library",
    "/history",
    "/vocab",
    "/admin",
    "/collections",
    "/collection",
    "/creator-dashboard",
    "/leaderboard",
    "/profile",
    "/discover",
    "/notifications",
    "/level-test",
    "/tone-practice",
    "/tone-mastery",
    "/tone-pair-drills",
    "/content",
    "/progress",
    "/gamification",
    "/wordbank",
    "/srs-stats",
    "/review-mode",
    "/review",
    "/settings",
    "/batch",
    "/teacher",
    "/help",
    "/affiliates",
    "/affiliate-onboarding",
    "/referrals",
    "/watch-history",
  ];

  const isAuthenticatedPage = appPages.some((page) => location.startsWith(page));
  const showDesktopFooter = !isAuthenticatedPage;

  const [isLargeDesktop, setIsLargeDesktop] = useState(false);

  useEffect(() => {
    const checkViewport = () => setIsLargeDesktop(window.innerWidth >= 1024);
    checkViewport();
    window.addEventListener("resize", checkViewport);
    return () => window.removeEventListener("resize", checkViewport);
  }, []);

  const isDashboard = location === "/app" || location === "/dashboard";
  const showBottomNav = isDashboard && !isLargeDesktop;
  const isActive = (path: string, matchPath?: string) => {
    const activePath = matchPath ?? path;
    if (activePath === "/app") return location === "/app" || location === "/dashboard";
    if (activePath === "/profile") return location.startsWith("/profile") || location === "/settings";
    return location === path || location.startsWith(activePath + "/");
  };

  const leftNavItems = [
    { href: "/app", label: "Home", icon: Home, matchPath: "/app" },
    { href: "/library", label: "Library", icon: BookOpen, matchPath: "/library" },
  ];

  const rightNavItems = [
    { href: "/wordbank", label: "Word Bank", icon: BookMarked, matchPath: "/wordbank" },
    { href: "/settings", label: "Settings", icon: Settings, matchPath: "/profile" },
  ];

  return (
    <>
      {showDesktopFooter && (
        <footer className="hidden md:block">
          <div style={{ background: "linear-gradient(180deg, #1A1A3E 0%, #151530 100%)" }}>
            <div className="container mx-auto px-4 py-14">
              <div className="grid grid-cols-4 gap-10">
                <div className="space-y-5">
                  <div className="flex items-center gap-3">
                    <img src={APP_LOGO} alt={APP_TITLE} className="h-10 w-10" />
                    <h3 className="text-xl font-bold text-white" style={{ fontFamily: "Fredoka, sans-serif" }}>
                      {APP_TITLE}
                    </h3>
                  </div>
                  <p className="text-sm text-gray-400 leading-relaxed" style={{ fontFamily: "Outfit, sans-serif" }}>
                    Learn languages through stories you love.
                  </p>
                  <div className="flex gap-3 pt-1">
                    <a
                      href="https://twitter.com/storylingai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:-translate-y-0.5"
                      aria-label="Follow us on X"
                    >
                      <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                    </a>
                    <a
                      href="https://instagram.com/storylingai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:-translate-y-0.5"
                      aria-label="Follow us on Instagram"
                    >
                      <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92C2.175 15.785 2.163 15.406 2.163 12c0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
                      </svg>
                    </a>
                    <a
                      href="https://tiktok.com/@storylingai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:-translate-y-0.5"
                      aria-label="Follow us on TikTok"
                    >
                      <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48V13a8.28 8.28 0 005.58 2.15V11.7a4.83 4.83 0 01-3.77-1.78V6.69h3.77z" />
                      </svg>
                    </a>
                    <a
                      href="https://youtube.com/@storylingai"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:-translate-y-0.5"
                      aria-label="Follow us on YouTube"
                    >
                      <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                      </svg>
                    </a>
                  </div>
                </div>

                <div className="space-y-4">
                  <h4 className="text-base font-bold text-white" style={{ fontFamily: "Fredoka, sans-serif" }}>
                    Product
                  </h4>
                  <ul className="space-y-3">
                    <li>
                      <a href="#features" className="text-sm text-gray-400 hover:text-purple-300 transition-colors" style={{ fontFamily: "Outfit, sans-serif" }}>
                        Features
                      </a>
                    </li>
                    <li>
                      <Link href="/pricing" className="text-sm text-gray-400 hover:text-purple-300 transition-colors" style={{ fontFamily: "Outfit, sans-serif" }}>
                        Pricing
                      </Link>
                    </li>
                    <li>
                      <Link href="/library" className="text-sm text-gray-400 hover:text-purple-300 transition-colors" style={{ fontFamily: "Outfit, sans-serif" }}>
                        Library
                      </Link>
                    </li>
                    <li>
                      <Link href="/blog" className="text-sm text-gray-400 hover:text-purple-300 transition-colors" style={{ fontFamily: "Outfit, sans-serif" }}>
                        Blog
                      </Link>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h4 className="text-base font-bold text-white" style={{ fontFamily: "Fredoka, sans-serif" }}>
                    Support
                  </h4>
                  <ul className="space-y-3">
                    <li>
                      <Link href="/faq" className="text-sm text-gray-400 hover:text-purple-300 transition-colors" style={{ fontFamily: "Outfit, sans-serif" }}>
                        Help Center
                      </Link>
                    </li>
                    <li>
                      <Link href="/contact" className="text-sm text-gray-400 hover:text-purple-300 transition-colors" style={{ fontFamily: "Outfit, sans-serif" }}>
                        Contact Us
                      </Link>
                    </li>
                    <li>
                      <Link href="/faq" className="text-sm text-gray-400 hover:text-purple-300 transition-colors" style={{ fontFamily: "Outfit, sans-serif" }}>
                        FAQ
                      </Link>
                    </li>
                    <li>
                      <Link href="/affiliates" className="text-sm text-gray-400 hover:text-purple-300 transition-colors" style={{ fontFamily: "Outfit, sans-serif" }}>
                        Affiliates
                      </Link>
                    </li>
                  </ul>
                </div>

                <div className="space-y-4">
                  <h4 className="text-base font-bold text-white" style={{ fontFamily: "Fredoka, sans-serif" }}>
                    Company
                  </h4>
                  <ul className="space-y-3">
                    <li>
                      <Link href="/about" className="text-sm text-gray-400 hover:text-purple-300 transition-colors" style={{ fontFamily: "Outfit, sans-serif" }}>
                        About
                      </Link>
                    </li>
                    <li>
                      <Link href="/careers" className="text-sm text-gray-400 hover:text-purple-300 transition-colors" style={{ fontFamily: "Outfit, sans-serif" }}>
                        Careers
                      </Link>
                    </li>
                    <li>
                      <Link href="/privacy" className="text-sm text-gray-400 hover:text-purple-300 transition-colors" style={{ fontFamily: "Outfit, sans-serif" }}>
                        Privacy Policy
                      </Link>
                    </li>
                    <li>
                      <Link href="/terms" className="text-sm text-gray-400 hover:text-purple-300 transition-colors" style={{ fontFamily: "Outfit, sans-serif" }}>
                        Terms of Service
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-12 pt-6 border-t border-white/10">
                <div className="flex justify-between items-center">
                  <p className="text-sm text-gray-500" style={{ fontFamily: "Outfit, sans-serif" }}>
                    &copy; {currentYear} {APP_TITLE}. All rights reserved.
                  </p>
                  <div className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-gray-300 transition-colors">
                    <Globe className="h-4 w-4" />
                    <span style={{ fontFamily: "Outfit, sans-serif" }}>English</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </footer>
      )}

      {showBottomNav && (
        <nav
          className="fixed inset-x-0 bottom-0 z-50 px-3 md:hidden"
          style={{ paddingBottom: "calc(env(safe-area-inset-bottom, 0px) + 10px)" }}
        >
          <div className="pointer-events-none mx-auto max-w-md">
            <div className="pointer-events-auto relative">
              <div className="absolute left-1/2 -translate-x-1/2 -top-7 z-10">
                <Link href="/create">
                  <button
                    className="relative flex h-16 w-16 items-center justify-center rounded-full active:scale-95 transition-transform"
                    style={{
                      background: "linear-gradient(180deg, #B46BFF 0%, #9057FF 52%, #6F47E3 100%)",
                      boxShadow: "0 14px 32px rgba(88, 46, 160, 0.34), inset 0 1px 0 rgba(255,255,255,0.34)",
                    }}
                  >
                    <div className="absolute inset-[2px] rounded-full border border-white/30" />
                    <Plus className="h-8 w-8 text-white" strokeWidth={2.5} />
                  </button>
                </Link>
              </div>

              <div
                className="grid grid-cols-5 items-end rounded-[28px] border px-3 pt-4 pb-2"
                style={{
                  borderColor: "rgba(255,255,255,0.2)",
                  background: "linear-gradient(180deg, rgba(162,170,196,0.34) 0%, rgba(105,112,140,0.64) 100%)",
                  backdropFilter: "blur(20px)",
                  WebkitBackdropFilter: "blur(20px)",
                  boxShadow: "0 12px 32px rgba(28, 18, 68, 0.28), inset 0 1px 0 rgba(255,255,255,0.24)",
                }}
              >
                {leftNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href, item.matchPath);
                  return (
                    <Link key={item.href} href={item.href}>
                      <button className="flex w-full flex-col items-center justify-center gap-1 py-1 active:scale-95 transition-transform">
                        <Icon className={cn("h-5 w-5 transition-all", active ? "text-[#FFF1C8]" : "text-white/70")} />
                        <span
                          className={cn("text-[11px] transition-all", active ? "font-bold text-[#FFF1C8]" : "font-medium text-white/72")}
                          style={{ fontFamily: "Fredoka, sans-serif", textShadow: active ? "0 2px 8px rgba(77, 43, 125, 0.3)" : "none" }}
                        >
                          {item.label}
                        </span>
                      </button>
                    </Link>
                  );
                })}

                <div className="flex flex-col items-center justify-end pt-7">
                  <span className="text-[11px] font-medium text-white/84" style={{ fontFamily: "Fredoka, sans-serif" }}>
                    Create
                  </span>
                </div>

                {rightNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item.href, item.matchPath);
                  return (
                    <Link key={item.href} href={item.href}>
                      <button className="flex w-full flex-col items-center justify-center gap-1 py-1 active:scale-95 transition-transform">
                        <Icon className={cn("h-5 w-5 transition-all", active ? "text-[#FFF1C8]" : "text-white/70")} />
                        <span
                          className={cn("text-[11px] transition-all", active ? "font-bold text-[#FFF1C8]" : "font-medium text-white/72")}
                          style={{ fontFamily: "Fredoka, sans-serif", textShadow: active ? "0 2px 8px rgba(77, 43, 125, 0.3)" : "none" }}
                        >
                          {item.label}
                        </span>
                      </button>
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>
        </nav>
      )}
    </>
  );
}
