import { useState, useEffect, useCallback } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

const STORAGE_KEY = 'pwa-install-dismissed';
const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function getDismissState(): { count: number; timestamp: number } | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function shouldShowPrompt(): boolean {
  // Already installed as standalone
  if (window.matchMedia('(display-mode: standalone)').matches) return false;

  const state = getDismissState();
  if (!state) return true; // Never dismissed

  if (state.count >= 2) return false; // Dismissed twice — never again

  // Dismissed once — show again after 7 days
  if (state.count === 1 && Date.now() - state.timestamp > SEVEN_DAYS_MS) {
    return true;
  }

  return false;
}

export function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(null);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    if (!shouldShowPrompt()) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setCanInstall(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const promptInstall = useCallback(async () => {
    if (!deferredPrompt) return;

    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;

    if (outcome === 'accepted') {
      // Mark as accepted — never show again
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({ count: 99, timestamp: Date.now() })
      );
    }

    setDeferredPrompt(null);
    setCanInstall(false);
  }, [deferredPrompt]);

  const dismissInstall = useCallback(() => {
    const state = getDismissState();
    const newCount = (state?.count ?? 0) + 1;
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({ count: newCount, timestamp: Date.now() })
    );
    setCanInstall(false);
    setDeferredPrompt(null);
  }, []);

  return { canInstall, promptInstall, dismissInstall };
}
