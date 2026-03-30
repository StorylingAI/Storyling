import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Settings } from "lucide-react";

export interface SubtitleSettings {
  fontSize: number;
  position: "top" | "bottom";
  color: string;
  fontFamily: string;
  outlineThickness: number;
  backgroundOpacity: number;
}

interface SubtitleCustomizationModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SubtitleSettings;
  onSettingsChange: (settings: SubtitleSettings) => void;
}

export function SubtitleCustomizationModal({
  isOpen,
  onClose,
  settings,
  onSettingsChange,
}: SubtitleCustomizationModalProps) {
  const [localSettings, setLocalSettings] = useState<SubtitleSettings>(settings);

  const handleApply = () => {
    onSettingsChange(localSettings);
    onClose();
  };

  const handleReset = () => {
    const defaultSettings: SubtitleSettings = {
      fontSize: 24,
      position: "bottom",
      color: "#FFFFFF",
      fontFamily: "Arial, sans-serif",
      outlineThickness: 2,
      backgroundOpacity: 0.7,
    };
    setLocalSettings(defaultSettings);
  };

  const colorPresets = [
    { name: "White", value: "#FFFFFF" },
    { name: "Yellow", value: "#FFD700" },
    { name: "Cyan", value: "#00FFFF" },
    { name: "Pink", value: "#FF69B4" },
    { name: "Lime", value: "#00FF00" },
  ];

  const fontFamilies = [
    { name: "Arial", value: "Arial, sans-serif" },
    { name: "Helvetica", value: "Helvetica, sans-serif" },
    { name: "Times New Roman", value: "'Times New Roman', serif" },
    { name: "Georgia", value: "Georgia, serif" },
    { name: "Verdana", value: "Verdana, sans-serif" },
    { name: "Courier", value: "'Courier New', monospace" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] rounded-card">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Subtitle Settings
          </DialogTitle>
          <DialogDescription>
            Customize how subtitles appear on your video
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Preview */}
          <div className="relative bg-black rounded-lg aspect-video flex items-center justify-center overflow-hidden">
            <div
              className={`absolute ${
                localSettings.position === "top" ? "top-8" : "bottom-8"
              } left-1/2 -translate-x-1/2 px-4 py-2 text-center max-w-[90%]`}
              style={{
                fontSize: `${localSettings.fontSize}px`,
                color: localSettings.color,
                fontFamily: localSettings.fontFamily,
                textShadow: `
                  -${localSettings.outlineThickness}px -${localSettings.outlineThickness}px 0 #000,
                  ${localSettings.outlineThickness}px -${localSettings.outlineThickness}px 0 #000,
                  -${localSettings.outlineThickness}px ${localSettings.outlineThickness}px 0 #000,
                  ${localSettings.outlineThickness}px ${localSettings.outlineThickness}px 0 #000
                `,
                backgroundColor: `rgba(0, 0, 0, ${localSettings.backgroundOpacity})`,
                borderRadius: "4px",
              }}
            >
              Sample subtitle text
            </div>
          </div>

          {/* Font Size */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Font Size</Label>
              <span className="text-sm text-muted-foreground">{localSettings.fontSize}px</span>
            </div>
            <Slider
              value={[localSettings.fontSize]}
              onValueChange={([value]) =>
                setLocalSettings({ ...localSettings, fontSize: value })
              }
              min={16}
              max={48}
              step={2}
              className="cursor-pointer"
            />
          </div>

          {/* Position */}
          <div className="space-y-2">
            <Label>Position</Label>
            <Select
              value={localSettings.position}
              onValueChange={(value: "top" | "bottom") =>
                setLocalSettings({ ...localSettings, position: value })
              }
            >
              <SelectTrigger className="rounded-button">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="top">Top</SelectItem>
                <SelectItem value="bottom">Bottom</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Color */}
          <div className="space-y-2">
            <Label>Text Color</Label>
            <div className="flex gap-2">
              {colorPresets.map((preset) => (
                <button
                  key={preset.value}
                  onClick={() =>
                    setLocalSettings({ ...localSettings, color: preset.value })
                  }
                  className={`w-12 h-12 rounded-full border-2 transition-all hover-scale ${
                    localSettings.color === preset.value
                      ? "border-primary ring-2 ring-primary/30"
                      : "border-border"
                  }`}
                  style={{ backgroundColor: preset.value }}
                  title={preset.name}
                />
              ))}
            </div>
          </div>

          {/* Font Family */}
          <div className="space-y-2">
            <Label>Font Family</Label>
            <Select
              value={localSettings.fontFamily}
              onValueChange={(value) =>
                setLocalSettings({ ...localSettings, fontFamily: value })
              }
            >
              <SelectTrigger className="rounded-button">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {fontFamilies.map((font) => (
                  <SelectItem key={font.value} value={font.value}>
                    {font.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Outline Thickness */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Outline Thickness</Label>
              <span className="text-sm text-muted-foreground">
                {localSettings.outlineThickness}px
              </span>
            </div>
            <Slider
              value={[localSettings.outlineThickness]}
              onValueChange={([value]) =>
                setLocalSettings({ ...localSettings, outlineThickness: value })
              }
              min={0}
              max={5}
              step={0.5}
              className="cursor-pointer"
            />
          </div>

          {/* Background Opacity */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label>Background Opacity</Label>
              <span className="text-sm text-muted-foreground">
                {Math.round(localSettings.backgroundOpacity * 100)}%
              </span>
            </div>
            <Slider
              value={[localSettings.backgroundOpacity]}
              onValueChange={([value]) =>
                setLocalSettings({ ...localSettings, backgroundOpacity: value })
              }
              min={0}
              max={1}
              step={0.1}
              className="cursor-pointer"
            />
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={handleReset}
            className="flex-1 rounded-button"
          >
            Reset to Default
          </Button>
          <Button
            onClick={handleApply}
            className="flex-1 rounded-button gradient-primary text-white border-0"
          >
            Apply Settings
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
