import { useInstallPrompt } from '@/hooks/useInstallPrompt';
import { Download, X } from 'lucide-react';

export function InstallPromptBanner() {
  const { canInstall, promptInstall, dismissInstall } = useInstallPrompt();

  if (!canInstall) return null;

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-2xl mb-4 animate-bounce-in"
      style={{
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(147, 51, 234, 0.1))',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(59, 130, 246, 0.3)',
        boxShadow: '0 2px 12px rgba(59, 130, 246, 0.15)',
      }}
    >
      <Download className="h-5 w-5 text-primary shrink-0" />
      <span className="text-sm font-medium text-foreground flex-1">
        Installe Storyling pour un accès rapide
      </span>
      <button
        onClick={promptInstall}
        className="px-3 py-1.5 bg-primary text-white text-sm font-semibold rounded-xl hover:bg-primary/90 transition-colors shrink-0"
      >
        Installer
      </button>
      <button
        onClick={dismissInstall}
        className="p-1 text-muted-foreground hover:text-foreground transition-colors shrink-0"
        aria-label="Fermer"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
