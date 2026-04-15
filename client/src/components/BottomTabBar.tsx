import { useLocation } from "wouter";
import {
  BookOpen,
  CirclePlus,
  Home,
  MessageCircleMore,
  User,
} from "lucide-react";

const TABS = [
  { id: "home", label: "Home", icon: Home, path: "/app" },
  { id: "create", label: "Create", icon: CirclePlus, path: "/create" },
  { id: "library", label: "Library", icon: BookOpen, path: "/library" },
  { id: "chat", label: "Chat", icon: MessageCircleMore, path: null, badge: true },
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
    <nav className="fixed bottom-0 left-0 right-0 z-20 border-t border-white/50 bg-white/90 px-4 py-3 backdrop-blur-md">
      <div className="mx-auto flex max-w-4xl items-center justify-around gap-2 rounded-[24px] bg-white/75 px-2 py-2 shadow-soft">
        {TABS.map(tab => {
          const active = isActive(tab);
          const Icon = tab.icon;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => handleTab(tab)}
              className={`flex items-center gap-2 rounded-2xl px-4 py-2 transition ${
                active ? "bg-[#eee1ff] text-[#7f52ff]" : "text-[#a394c3]"
              }`}
            >
              <span className="relative inline-flex">
                <Icon className="h-6 w-6" />
                {"badge" in tab && tab.badge ? (
                  <span className="absolute -right-1 -top-1 h-2.5 w-2.5 rounded-full bg-rose-400" />
                ) : null}
              </span>
              <span className="hidden text-sm font-semibold md:inline">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}
