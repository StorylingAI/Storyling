import { useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Menu,
  LayoutDashboard,
  BookOpen,
  FolderHeart,
  Sparkles,
  Settings,
  LogOut,
  HelpCircle,
  Share2,
  Bell,
  ArrowLeft,
  BookMarked,
  UserCircle,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { UserAvatar } from "./UserAvatar";

const learningItems = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/app" },
  { icon: Sparkles, label: "Create Story", path: "/create" },
  { icon: BookOpen, label: "Library", path: "/library" },
  { icon: FolderHeart, label: "Collections", path: "/collections" },
  { icon: BookMarked, label: "Word Bank", path: "/wordbank" },
];

const accountItems = [
  { icon: Settings, label: "Settings", path: "/settings" },
  { icon: HelpCircle, label: "Help & Tutorials", path: "/help-tutorials" },
  { icon: Share2, label: "Affiliates", path: "__coming_soon__" },
];

interface MobileNavProps {
  /** Title to show in the header bar. Defaults to APP_TITLE */
  title?: string;
  /** Show a back button instead of the hamburger on the left */
  backPath?: string;
  /** Custom header background class */
  headerClassName?: string;
  /** Additional right-side actions (shown next to hamburger on desktop-hidden area) */
  rightActions?: React.ReactNode;
  /** Whether to use the gradient purple header style (for Library, etc.) */
  gradient?: boolean;
  /** Whether to use light (white) text — for dark backgrounds */
  darkBg?: boolean;
  /** Control open state externally (e.g. from a desktop hamburger button) */
  externalOpen?: boolean;
  /** Callback when external open state changes */
  onExternalOpenChange?: (open: boolean) => void;
  /** Hide the floating hamburger button (when using external trigger) */
  hideFloatingButton?: boolean;
}

export function MobileNav({
  title,
  backPath,
  headerClassName,
  rightActions,
  gradient = false,
  darkBg = false,
  externalOpen,
  onExternalOpenChange,
  hideFloatingButton = false,
}: MobileNavProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  
  // Use external state if provided, otherwise internal
  const open = externalOpen !== undefined ? externalOpen : internalOpen;
  const setOpen = (v: boolean) => {
    if (onExternalOpenChange) onExternalOpenChange(v);
    setInternalOpen(v);
  };
  const [location, setLocation] = useLocation();
  const { user, logout } = useAuth();

  // Fetch unread notification count for badge
  const { data: unreadCount } = trpc.follow.getUnreadCount.useQuery(undefined, {
    refetchInterval: 30000,
    enabled: !!user,
  });
  const notifCount = unreadCount?.count ?? 0;

  const renderNavItem = (item: { icon: any; label: string; path: string }) => {
    const isComingSoon = item.path === "__coming_soon__";
    const isActive = !isComingSoon && location === item.path;
    return (
      <button
        key={item.label}
        onClick={() => {
          if (isComingSoon) return;
          setLocation(item.path);
          setOpen(false);
        }}
        className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
          isComingSoon
            ? "text-gray-400 cursor-default"
            : isActive
              ? "bg-purple-50 text-purple-700 font-medium border-r-2 border-purple-600"
              : "text-gray-700 hover:bg-gray-50"
        }`}
      >
        <item.icon
          className={`h-5 w-5 shrink-0 ${
            isComingSoon ? "text-gray-300" : isActive ? "text-purple-600" : "text-gray-400"
          }`}
        />
        <span className="flex-1 text-left">{item.label}</span>
        {isComingSoon && (
          <span className="px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider rounded-full bg-gradient-to-r from-purple-100 to-teal-100 text-purple-600 border border-purple-200/50">
            Soon
          </span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* Floating hamburger button — fixed top-right */}
      {!hideFloatingButton && (
        <div className="fixed top-4 right-4 z-50 flex items-center gap-2">
          {/* Back button if needed */}
          {backPath && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setLocation(backPath)}
              className="h-11 w-11 rounded-full bg-transparent hover:bg-white/10 transition-all"
            >
              <ArrowLeft className={`h-5 w-5 drop-shadow-md ${
                darkBg ? 'text-white' : 'text-purple-600'
              }`} />
            </Button>
          )}
          {rightActions}
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setOpen(true)}
            className="relative h-12 w-12 rounded-full bg-transparent hover:bg-white/10 hover:scale-105 transition-all"
          >
            <Menu className={`h-6 w-6 drop-shadow-md ${
              darkBg ? 'text-white' : 'text-purple-600'
            }`} />
            {notifCount > 0 && (
              <span className="absolute -top-1 -right-1 h-5 min-w-[20px] px-1 rounded-full bg-red-500 text-white text-[11px] font-bold flex items-center justify-center leading-none shadow-sm">
                {notifCount > 9 ? "9+" : notifCount}
              </span>
            )}
          </Button>
        </div>
      )}

      {/* Slide-out drawer */}
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-72 p-0 bg-white">
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation Menu</SheetTitle>
            <SheetDescription>Navigate through the app</SheetDescription>
          </SheetHeader>

          {/* User info at top */}
          <div className="p-4 border-b bg-gradient-to-r from-purple-50 to-teal-50">
            <div className="flex items-center gap-3">
              <UserAvatar
                name={user?.name || user?.email}
                avatarUrl={user?.avatarUrl}
                className="h-10 w-10"
                fallbackClassName="text-sm font-medium"
              />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1.5">
                  <p className="text-sm font-semibold truncate">
                    {user?.name || "Guest"}
                  </p>
                  {user?.subscriptionTier === 'premium' && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-bold text-white shrink-0" style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)', lineHeight: 1 }}>
                      PRO
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {user?.email || ""}
                </p>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {/* Notifications — standalone at top with badge */}
            <div className="py-2 border-b">
              <button
                onClick={() => {
                  setLocation("/notifications");
                  setOpen(false);
                }}
                className={`w-full flex items-center gap-3 px-4 py-3 text-sm transition-colors ${
                  location === "/notifications"
                    ? "bg-purple-50 text-purple-700 font-medium border-r-2 border-purple-600"
                    : "text-gray-700 hover:bg-gray-50"
                }`}
              >
                <div className="relative shrink-0">
                  <Bell
                    className={`h-5 w-5 ${
                      location === "/notifications" ? "text-purple-600" : "text-gray-400"
                    }`}
                  />
                  {notifCount > 0 && (
                    <span className="absolute -top-1.5 -right-1.5 h-4 min-w-[16px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
                      {notifCount > 9 ? "9+" : notifCount}
                    </span>
                  )}
                </div>
                <span className="flex-1">Notifications</span>
                {notifCount > 0 && (
                  <span className="text-xs text-red-500 font-medium">
                    {notifCount} new
                  </span>
                )}
              </button>
            </div>

            {/* Learning Tools section */}
            <div className="py-2 border-b">
              <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Learning Tools
              </p>
              {learningItems.map(renderNavItem)}
            </div>

            {/* Account section */}
            <div className="py-2">
              <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase tracking-wider">
                Account
              </p>
              {user?.id && renderNavItem({ icon: UserCircle, label: "Profile", path: `/profile/${user.id}` })}
              {accountItems.map(renderNavItem)}
            </div>
          </div>

          {/* Pro badge or upgrade CTA */}
          {user?.subscriptionTier === 'premium' ? (
            <div className="mx-3 mb-2 p-3 rounded-xl flex items-center gap-2" style={{ background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(239,68,68,0.1))', border: '1px solid rgba(245,158,11,0.2)' }}>
              <span className="text-lg">✨</span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-amber-700">Pro Member</p>
                <p className="text-xs text-amber-600/70">Unlimited stories & features</p>
              </div>
            </div>
          ) : (
            <button
              onClick={() => { setLocation('/pricing'); setOpen(false); }}
              className="mx-3 mb-2 w-[calc(100%-24px)] p-3 rounded-xl flex items-center gap-2 transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #F59E0B, #EF4444)', border: 'none' }}
            >
              <span className="text-lg">✨</span>
              <div className="min-w-0 flex-1 text-left">
                <p className="text-sm font-bold text-white">Upgrade to Pro</p>
                <p className="text-xs text-white/80">Unlimited stories & more</p>
              </div>
            </button>
          )}

          {/* Sign out at bottom */}
          <div className="border-t p-3">
            <button
              onClick={() => {
                logout();
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="h-5 w-5 shrink-0" />
              Sign out
            </button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
