/**
 * PremiumFeatureGate — Wraps premium-only features with an upgrade prompt.
 * 
 * When a free user taps a gated feature, shows a contextual upgrade prompt
 * instead of the feature. Premium users see the feature normally.
 */

import { useState } from "react";
import { Crown, Lock } from "lucide-react";
import { useEntitlements } from "../../hooks/useEntitlements";
import { PaywallModal } from "./PaywallModal";

interface PremiumFeatureGateProps {
  /** The feature name shown in the upgrade prompt */
  featureName: string;
  /** Description of what this feature does */
  featureDescription: string;
  /** The entitlement key to check */
  entitlementKey: "canUseAudioSpeedControl" | "canDownloadOffline" | "canUseAdvancedComprehension" | "canUseFilmFormat";
  /** The children to render if the user has access */
  children: React.ReactNode;
  /** Optional: render as inline badge instead of blocking overlay */
  inline?: boolean;
  /** Optional: custom trigger source for analytics */
  triggerSource?: string;
}

export function PremiumFeatureGate({
  featureName,
  featureDescription,
  entitlementKey,
  children,
  inline = false,
  triggerSource,
}: PremiumFeatureGateProps) {
  const entitlements = useEntitlements();
  const [showPaywall, setShowPaywall] = useState(false);
  
  const hasAccess = entitlements[entitlementKey];
  
  // Premium users see the feature directly
  if (hasAccess) {
    return <>{children}</>;
  }
  
  // Free users see the gate
  if (inline) {
    return (
      <>
        <button
          onClick={() => setShowPaywall(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-50 text-purple-600 text-xs font-medium hover:bg-purple-100 transition-colors"
        >
          <Crown className="h-3 w-3" />
          <span>{featureName}</span>
          <Lock className="h-3 w-3 opacity-60" />
        </button>
        <PaywallModal
          open={showPaywall}
          onOpenChange={setShowPaywall}
          trigger="feature_gate"
          headline="keep_going"
        />
      </>
    );
  }
  
  return (
    <>
      <div
        onClick={() => setShowPaywall(true)}
        className="relative cursor-pointer group"
      >
        {/* Blurred/dimmed version of the feature */}
        <div className="opacity-40 pointer-events-none select-none blur-[1px]">
          {children}
        </div>
        
        {/* Overlay with upgrade prompt */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/60 backdrop-blur-sm rounded-lg">
          <div className="flex flex-col items-center gap-2 p-4 text-center">
            <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
              <Crown className="h-5 w-5 text-purple-600" />
            </div>
            <p className="font-semibold text-gray-900 text-sm">{featureName}</p>
            <p className="text-xs text-gray-500 max-w-[200px]">{featureDescription}</p>
            <span className="text-xs font-medium text-purple-600 group-hover:underline">
              Upgrade to Premium
            </span>
          </div>
        </div>
      </div>
      <PaywallModal
        open={showPaywall}
        onOpenChange={setShowPaywall}
        trigger="feature_gate"
        headline="keep_going"
      />
    </>
  );
}

/**
 * Simple hook-based check for use in event handlers.
 * Returns a function that either executes the callback or opens the paywall.
 */
export function usePremiumGate() {
  const entitlements = useEntitlements();
  const [showPaywall, setShowPaywall] = useState(false);
  
  const gate = (
    entitlementKey: "canUseAudioSpeedControl" | "canDownloadOffline" | "canUseAdvancedComprehension" | "canUseFilmFormat",
    callback: () => void
  ) => {
    if (entitlements[entitlementKey]) {
      callback();
    } else {
      setShowPaywall(true);
    }
  };
  
  return {
    gate,
    showPaywall,
    setShowPaywall,
    isPremium: entitlements.isPremium,
  };
}
