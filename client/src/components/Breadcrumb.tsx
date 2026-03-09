import React, { useRef, useEffect } from "react";
import { ChevronRight, Home } from "lucide-react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { cn } from "@/lib/utils";

export interface BreadcrumbItem {
  label: string;
  href?: string;
  icon?: React.ReactNode;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
  showHome?: boolean;
  actions?: React.ReactNode; // Optional contextual action buttons
}

export default function Breadcrumb({ items, showHome = true, actions }: BreadcrumbProps) {
  const [, setLocation] = useLocation();
  const breadcrumbRefs = useRef<(HTMLButtonElement | null)[]>([]);
  
  // Fetch user preferences
  const { data: preferences } = trpc.breadcrumb.getPreferences.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });
  
  const showIcons = preferences?.showIcons ?? true;
  const compactMode = preferences?.compactMode ?? false;
  const hideOnMobile = preferences?.hideOnMobile ?? false;

  const allItems: BreadcrumbItem[] = showHome
    ? [{ label: "Home", href: "/app", icon: <Home className="h-4 w-4" /> }, ...items]
    : items;

  // Keyboard navigation handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeElement = document.activeElement;
      const currentIndex = breadcrumbRefs.current.findIndex(ref => ref === activeElement);

      if (currentIndex === -1) return;

      if (e.key === "ArrowRight") {
        e.preventDefault();
        const nextIndex = currentIndex + 1;
        if (nextIndex < breadcrumbRefs.current.length) {
          breadcrumbRefs.current[nextIndex]?.focus();
        }
      } else if (e.key === "ArrowLeft") {
        e.preventDefault();
        const prevIndex = currentIndex - 1;
        if (prevIndex >= 0) {
          breadcrumbRefs.current[prevIndex]?.focus();
        }
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className={cn(
      "flex items-center justify-between gap-4 mb-4 flex-wrap",
      hideOnMobile && "hidden md:flex"
    )}>
      <nav 
        className={cn(
          "flex items-center gap-2 flex-wrap",
          compactMode ? "text-xs" : "text-sm"
        )}
        aria-label="Breadcrumb navigation"
      >
        <ol className={cn(
          "flex items-center list-none m-0 p-0",
          compactMode ? "gap-1" : "gap-2"
        )}>
          {allItems.map((item, index) => {
            const isLast = index === allItems.length - 1;
            const buttonIndex = breadcrumbRefs.current.length;

            return (
              <li key={index} className="flex items-center gap-2">
                {index > 0 && (
                  <ChevronRight 
                    className="h-4 w-4 text-muted-foreground flex-shrink-0" 
                    aria-hidden="true"
                  />
                )}
                {isLast ? (
                  <span 
                    className={cn(
                      "font-semibold text-foreground flex items-center",
                      compactMode ? "gap-1" : "gap-1.5"
                    )}
                    aria-current="page"
                  >
                    {showIcons && item.icon}
                    {item.label}
                  </span>
                ) : (
                  <button
                    ref={(el) => {
                      breadcrumbRefs.current[buttonIndex] = el;
                    }}
                    onClick={() => item.href && setLocation(item.href)}
                    className={cn(
                      "text-muted-foreground hover:text-primary transition-colors flex items-center hover:underline focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded",
                      compactMode ? "gap-1 px-0.5" : "gap-1.5 px-1"
                    )}
                    aria-label={`Navigate to ${item.label}`}
                    tabIndex={0}
                  >
                    {showIcons && item.icon}
                    {item.label}
                  </button>
                )}
              </li>
            );
          })}
        </ol>
      </nav>
      
      {/* Contextual action buttons */}
      {actions && (
        <div className="flex items-center gap-2">
          {actions}
        </div>
      )}
    </div>
  );
}
