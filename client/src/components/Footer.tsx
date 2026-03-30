import { useState, useEffect } from "react";
import { Link, useLocation } from "wouter";
import { Home, BookOpen, Plus, BarChart3, MessageCircle, Globe } from "lucide-react";
import { cn } from "@/lib/utils";
import { APP_TITLE, APP_LOGO } from "@/const";

export function Footer() {
  const currentYear = new Date().getFullYear();
  const [location] = useLocation();

  // Don't show footer on authenticated app pages (but DO show on landing page)
  const appPages = [
    '/app', '/dashboard', '/create', '/library', '/history', '/vocab', '/admin',
    '/collections', '/collection', '/creator-dashboard', '/leaderboard', '/profile',
    '/discover', '/notifications', '/level-test', '/tone-practice', '/tone-mastery',
    '/tone-pair-drills', '/content', '/progress', '/gamification', '/wordbank',
    '/srs-stats', '/review-mode', '/review', '/settings', '/batch', '/teacher',
    '/help', '/affiliates', '/affiliate-onboarding', '/referrals', '/watch-history'
  ];
  
  // Check if we're on an authenticated app page
  const isAuthenticatedPage = appPages.some(page => location.startsWith(page));
  
  // Only show desktop footer on public pages (landing, pricing, blog, etc.)
  const showDesktopFooter = !isAuthenticatedPage;

  // Track viewport width for responsive hiding
  const [isLargeDesktop, setIsLargeDesktop] = useState(false);
  useEffect(() => {
    const check = () => setIsLargeDesktop(window.innerWidth >= 1024);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Bottom nav only shows on /app (Dashboard), hidden on large desktop (1024px+)
  const isDashboard = location === '/app' || location === '/dashboard';
  const showBottomNav = isDashboard && !isLargeDesktop;

  // Check if current page is active
  const isActive = (path: string) => {
    if (path === "/app") return location === "/app" || location === "/dashboard";
    return location === path || location.startsWith(path + "/");
  };

  // Bottom nav items (Create is handled separately as the center elevated button)
  const leftNavItems = [
    { href: "/app", label: "Home", icon: Home },
    { href: "/library", label: "Library", icon: BookOpen },
  ];
  
  const rightNavItems = [
    { href: "/wordbank", label: "Word Bank", icon: BarChart3 },
    { href: "/discover", label: "Chat", icon: MessageCircle },
  ];

  return (
    <>
      {/* Desktop Footer - only on public pages */}
      {showDesktopFooter && <footer className="hidden md:block">
        {/* ─── Dark Navy Footer ─── */}
        <div style={{ background: "linear-gradient(180deg, #1a1a3e 0%, #151530 100%)" }}>
          <div className="container mx-auto px-4 py-14">
            <div className="grid grid-cols-4 gap-10">
              {/* Brand Column */}
              <div className="space-y-5">
                <div className="flex items-center gap-3">
                  <img src={APP_LOGO} alt={APP_TITLE} className="h-10 w-10" />
                  <h3 className="text-xl font-bold text-white" style={{ fontFamily: "Fredoka, sans-serif" }}>
                    Storyling.ai
                  </h3>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed" style={{ fontFamily: "Outfit, sans-serif" }}>
                  Learn languages through stories you love
                </p>
                {/* Social Icons */}
                <div className="flex gap-3 pt-1">
                  <a href="https://twitter.com/storylingai" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:-translate-y-0.5" aria-label="Follow us on X">
                    <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" /></svg>
                  </a>
                  <a href="https://instagram.com/storylingai" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:-translate-y-0.5" aria-label="Follow us on Instagram">
                    <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" /></svg>
                  </a>
                  <a href="https://tiktok.com/@storylingai" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:-translate-y-0.5" aria-label="Follow us on TikTok">
                    <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1v-3.5a6.37 6.37 0 00-.79-.05A6.34 6.34 0 003.15 15.2a6.34 6.34 0 0010.86 4.48V13a8.28 8.28 0 005.58 2.15V11.7a4.83 4.83 0 01-3.77-1.78V6.69h3.77z" /></svg>
                  </a>
                  <a href="https://youtube.com/@storylingai" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center transition-all hover:-translate-y-0.5" aria-label="Follow us on YouTube">
                    <svg className="w-4 h-4 text-gray-300" fill="currentColor" viewBox="0 0 24 24"><path d="M23.498 6.186a3.016 3.016 0 00-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 00.502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 002.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 002.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" /></svg>
                  </a>
                </div>
              </div>

              {/* Product Column */}
              <div className="space-y-4">
                <h4 className="text-base font-bold text-white" style={{ fontFamily: "Fredoka, sans-serif" }}>Product</h4>
                <ul className="space-y-3">
                  <li><a href="#features" className="text-sm text-gray-400 hover:text-purple-300 transition-colors" style={{ fontFamily: "Outfit, sans-serif" }}>Features</a></li>
                  <li><Link href="/pricing" className="text-sm text-gray-400 hover:text-purple-300 transition-colors" style={{ fontFamily: "Outfit, sans-serif" }}>Pricing</Link></li>
                  <li><Link href="/library" className="text-sm text-gray-400 hover:text-purple-300 transition-colors" style={{ fontFamily: "Outfit, sans-serif" }}>Library</Link></li>
                  <li><Link href="/blog" className="text-sm text-gray-400 hover:text-purple-300 transition-colors" style={{ fontFamily: "Outfit, sans-serif" }}>Blog</Link></li>
                </ul>
              </div>

              {/* Support Column */}
              <div className="space-y-4">
                <h4 className="text-base font-bold text-white" style={{ fontFamily: "Fredoka, sans-serif" }}>Support</h4>
                <ul className="space-y-3">
                  <li><Link href="/faq" className="text-sm text-gray-400 hover:text-purple-300 transition-colors" style={{ fontFamily: "Outfit, sans-serif" }}>Help Center</Link></li>
                  <li><Link href="/contact" className="text-sm text-gray-400 hover:text-purple-300 transition-colors" style={{ fontFamily: "Outfit, sans-serif" }}>Contact Us</Link></li>
                  <li><Link href="/faq" className="text-sm text-gray-400 hover:text-purple-300 transition-colors" style={{ fontFamily: "Outfit, sans-serif" }}>FAQ</Link></li>
                  <li><Link href="/affiliates" className="text-sm text-gray-400 hover:text-purple-300 transition-colors" style={{ fontFamily: "Outfit, sans-serif" }}>Affiliates</Link></li>
                </ul>
              </div>

              {/* Company Column */}
              <div className="space-y-4">
                <h4 className="text-base font-bold text-white" style={{ fontFamily: "Fredoka, sans-serif" }}>Company</h4>
                <ul className="space-y-3">
                  <li><Link href="/about" className="text-sm text-gray-400 hover:text-purple-300 transition-colors" style={{ fontFamily: "Outfit, sans-serif" }}>About</Link></li>
                  <li><Link href="/careers" className="text-sm text-gray-400 hover:text-purple-300 transition-colors" style={{ fontFamily: "Outfit, sans-serif" }}>Careers</Link></li>
                  <li><Link href="/privacy" className="text-sm text-gray-400 hover:text-purple-300 transition-colors" style={{ fontFamily: "Outfit, sans-serif" }}>Privacy Policy</Link></li>
                  <li><Link href="/terms" className="text-sm text-gray-400 hover:text-purple-300 transition-colors" style={{ fontFamily: "Outfit, sans-serif" }}>Terms of Service</Link></li>
                </ul>
              </div>
            </div>

            {/* Bottom Bar */}
            <div className="mt-12 pt-6 border-t border-white/10">
              <div className="flex justify-between items-center">
                <p className="text-sm text-gray-500" style={{ fontFamily: "Outfit, sans-serif" }}>
                  &copy; {currentYear} Storyling.ai. All rights reserved.
                </p>
                <div className="flex items-center gap-2 text-sm text-gray-400 cursor-pointer hover:text-gray-300 transition-colors">
                  <Globe className="h-4 w-4" />
                  <span style={{ fontFamily: "Outfit, sans-serif" }}>English</span>
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      </footer>}

      {/* ═══ App Bottom Navigation Bar ═══ */}
      {showBottomNav && (
        <nav className="fixed bottom-0 left-0 right-0 z-50">
          {/* Dark purple bar */}
          <div className="relative" style={{ background: "linear-gradient(135deg, rgba(45, 27, 105, 0.85) 0%, rgba(26, 17, 69, 0.85) 100%)", backdropFilter: "blur(20px)", WebkitBackdropFilter: "blur(20px)" }}>
            {/* Center Create button — elevated above the bar */}
            <div className="absolute left-1/2 -translate-x-1/2 -top-7 z-10">
              <Link href="/create">
                <button
                  className="relative h-16 w-16 rounded-full flex items-center justify-center shadow-2xl active:scale-95 transition-transform"
                  style={{
                    background: "linear-gradient(135deg, #4dd9c0 0%, #38b2ac 30%, #7c3aed 100%)",
                    boxShadow: "0 4px 20px rgba(77, 217, 192, 0.4), 0 0 40px rgba(124, 58, 237, 0.2)",
                  }}
                >
                  {/* Outer ring */}
                  <div className="absolute inset-0 rounded-full border-[3px] border-white/30" />
                  <Plus className="h-7 w-7 text-white" strokeWidth={2.5} />
                </button>
              </Link>
            </div>

            <div className="grid grid-cols-5 items-end px-2 pt-3 pb-2 safe-area-inset-bottom">
              {/* Left items */}
              {leftNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href}>
                    <button className="flex flex-col items-center justify-center gap-1 w-full py-1 active:scale-95 transition-transform">
                      <Icon className={cn("h-5 w-5 transition-all", active ? "text-cyan-400" : "text-gray-400")} />
                      <span
                        className={cn("text-[10px] transition-all", active ? "text-cyan-400 font-bold" : "text-gray-400 font-medium")}
                        style={{ fontFamily: "Fredoka, sans-serif" }}
                      >
                        {item.label}
                      </span>
                    </button>
                  </Link>
                );
              })}

              {/* Center spacer for the elevated Create button */}
              <div className="flex flex-col items-center justify-end pb-1">
                <span className="text-[10px] text-gray-400 font-medium" style={{ fontFamily: "Fredoka, sans-serif" }}>
                  Create
                </span>
              </div>

              {/* Right items */}
              {rightNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);
                return (
                  <Link key={item.href} href={item.href}>
                    <button className="flex flex-col items-center justify-center gap-1 w-full py-1 active:scale-95 transition-transform">
                      <Icon className={cn("h-5 w-5 transition-all", active ? "text-cyan-400" : "text-gray-400")} />
                      <span
                        className={cn("text-[10px] transition-all", active ? "text-cyan-400 font-bold" : "text-gray-400 font-medium")}
                        style={{ fontFamily: "Fredoka, sans-serif" }}
                      >
                        {item.label}
                      </span>
                    </button>
                  </Link>
                );
              })}
            </div>
          </div>
        </nav>
      )}

      {/* Bottom padding to prevent content from being hidden behind the nav bar */}
      {showBottomNav && <div className="h-20" aria-hidden="true" />}
    </>
  );
}
