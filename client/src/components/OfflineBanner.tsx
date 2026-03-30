import { useOnlineStatus } from '@/hooks/useOnlineStatus';
import { useState, useEffect } from 'react';
import { WifiOff } from 'lucide-react';

export function OfflineBanner() {
  const { isOnline } = useOnlineStatus();
  const [visible, setVisible] = useState(false);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setVisible(true);
      setFadeOut(false);
    } else if (visible) {
      // Back online — fade out after 2s, then hide
      const fadeTimer = setTimeout(() => setFadeOut(true), 2000);
      const removeTimer = setTimeout(() => setVisible(false), 2300);
      return () => {
        clearTimeout(fadeTimer);
        clearTimeout(removeTimer);
      };
    }
  }, [isOnline, visible]);

  if (!visible) return null;

  return (
    <div
      className={`fixed bottom-20 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium transition-opacity duration-300 ${
        fadeOut ? 'opacity-0' : 'opacity-100'
      }`}
      style={{
        background: 'rgba(234, 179, 8, 0.15)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(234, 179, 8, 0.35)',
        boxShadow: '0 2px 12px rgba(0,0,0,0.15)',
      }}
    >
      <WifiOff className="h-4 w-4 text-yellow-600" />
      <span className="text-yellow-800">
        {isOnline
          ? 'Connexion rétablie'
          : 'Mode hors ligne — contenu limité au cache'}
      </span>
    </div>
  );
}
