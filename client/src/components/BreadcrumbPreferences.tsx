import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function BreadcrumbPreferences() {
  const { data: preferences, isLoading } = trpc.breadcrumb.getPreferences.useQuery();
  const utils = trpc.useUtils();
  
  const [showIcons, setShowIcons] = useState(true);
  const [compactMode, setCompactMode] = useState(false);
  const [hideOnMobile, setHideOnMobile] = useState(false);

  // Sync local state with fetched preferences
  useEffect(() => {
    if (preferences) {
      setShowIcons(preferences.showIcons);
      setCompactMode(preferences.compactMode);
      setHideOnMobile(preferences.hideOnMobile);
    }
  }, [preferences]);

  const updatePreferences = trpc.breadcrumb.updatePreferences.useMutation({
    onSuccess: () => {
      utils.breadcrumb.getPreferences.invalidate();
      toast.success("Breadcrumb preferences updated");
    },
    onError: (error) => {
      toast.error("Failed to update preferences", {
        description: error.message,
      });
    },
  });

  const handleShowIconsToggle = (checked: boolean) => {
    setShowIcons(checked);
    updatePreferences.mutate({ showIcons: checked });
  };

  const handleCompactModeToggle = (checked: boolean) => {
    setCompactMode(checked);
    updatePreferences.mutate({ compactMode: checked });
  };

  const handleHideOnMobileToggle = (checked: boolean) => {
    setHideOnMobile(checked);
    updatePreferences.mutate({ hideOnMobile: checked });
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Show Icons */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="show-icons" className="text-sm font-medium">
            Show Icons
          </Label>
          <p className="text-xs text-muted-foreground">
            Display icons next to breadcrumb labels (e.g., Home icon)
          </p>
        </div>
        <Switch
          id="show-icons"
          checked={showIcons}
          onCheckedChange={handleShowIconsToggle}
          disabled={updatePreferences.isPending}
        />
      </div>

      <Separator />

      {/* Compact Mode */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="compact-mode" className="text-sm font-medium">
            Compact Mode
          </Label>
          <p className="text-xs text-muted-foreground">
            Reduce spacing and text size for a more condensed breadcrumb
          </p>
        </div>
        <Switch
          id="compact-mode"
          checked={compactMode}
          onCheckedChange={handleCompactModeToggle}
          disabled={updatePreferences.isPending}
        />
      </div>

      <Separator />

      {/* Hide on Mobile */}
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label htmlFor="hide-on-mobile" className="text-sm font-medium">
            Hide on Mobile
          </Label>
          <p className="text-xs text-muted-foreground">
            Hide breadcrumb navigation on small screens to save space
          </p>
        </div>
        <Switch
          id="hide-on-mobile"
          checked={hideOnMobile}
          onCheckedChange={handleHideOnMobileToggle}
          disabled={updatePreferences.isPending}
        />
      </div>
    </div>
  );
}
