import { useLocation } from "wouter";
import { Home, Plus, BookOpen, MessageCircle, User } from "lucide-react";

const TABS = [
  { id: "home", label: "Home", icon: Home, path: "/app" },
  { id: "create", label: "Add", icon: Plus, path: "/create" },
  { id: "library", label: "Library", icon: BookOpen, path: "/library" },
  { id: "chat", label: "Chat", icon: MessageCircle, path: null },
  { id: "profile", label: "Profile", icon: User, path: null },
] as const;

export function BottomTabBar() {
  const [location, setLocation] = useLocation();

  const handleTab = (tab: (typeof TABS)[number]) => {
    if (tab.id === "chat") {
      window.dispatchEvent(new CustomEvent("open-booki-chat"));
      return;
    }
    if (tab.id === "profile") {
      setLocation("/settings");
      return;
    }
    if (tab.path) {
      setLocation(tab.path);
    }
  };

  const isActive = (tab: (typeof TABS)[number]) => {
    if (tab.id === "home")
      return location === "/app" || location === "/dashboard";
    if (tab.path) return location === tab.path;
    return false;
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/60 bg-white/90 px-4 py-3 backdrop-blur-md">
      <div className="mx-auto flex h-[56px] max-w-4xl items-center justify-around gap-2 rounded-[24px] bg-white/80 px-2 py-2 shadow-[0_12px_30px_rgba(137,103,196,0.15)] md:h-[64px] md:justify-between md:px-5">
        {TABS.map(tab => {
          const active = isActive(tab);
          const isCreate = tab.id === "create";

          if (isCreate) {
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => handleTab(tab)}
                className="flex min-w-[48px] items-center justify-center gap-2 rounded-2xl px-3 py-2 text-[#A394C3] transition hover:bg-[#F8F2FF] md:min-w-[112px]"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#F0E8FA] text-[#8B6EBF] md:h-auto md:w-auto md:bg-transparent">
                  <Plus className="h-5 w-5" strokeWidth={2.2} />
                </span>
                <span className="hidden text-sm font-semibold md:inline">
                  {tab.label}
                </span>
              </button>
            );
          }

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTab(tab)}
              className={`flex min-w-[48px] items-center justify-center gap-2 rounded-2xl px-3 py-2 transition md:min-w-[112px] ${
                active
                  ? "bg-[#EEE1FF] text-[#7F52FF]"
                  : "text-[#A394C3] hover:bg-[#F8F2FF]"
              }`}
            >
              <span className="relative inline-flex">
                <tab.icon
                  className="h-[22px] w-[22px] md:h-6 md:w-6"
                  strokeWidth={active ? 2.2 : 1.8}
                  fill={active && tab.id === "home" ? "#7F52FF" : "none"}
                />
                {tab.id === "chat" ? (
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-[#FF7F7F]" />
                ) : null}
              </span>
              <span className="hidden text-sm font-semibold md:inline">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="h-[env(safe-area-inset-bottom,0px)] bg-white/90" />
    </nav>
  );
}
