import { useEffect } from "react";
import { useLocation } from "wouter";

/**
 * Hook that scrolls to top of page on route change
 * Fixes issue where navigating to new pages starts at middle of page
 */
export function useScrollToTop() {
  const [location] = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [location]);
}
