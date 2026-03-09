import { useMemo } from "react";

export type SubtitlePosition = "top" | "center" | "bottom";
export type SubtitleColorTheme = "white" | "yellow" | "black" | "custom";
export type SubtitleFontFamily = "Arial" | "Times New Roman" | "Courier New" | "Georgia" | "Verdana";

interface SubtitlePreviewProps {
  text?: string;
  fontSize: number;
  position: SubtitlePosition;
  colorTheme: SubtitleColorTheme;
  customColor?: string;
  fontFamily?: SubtitleFontFamily;
  outlineThickness?: number; // 0-5px
  backgroundOpacity?: number; // 0-100%
  className?: string;
}

export function SubtitlePreview({
  text = "Sample subtitle text for preview",
  fontSize,
  position,
  colorTheme,
  customColor,
  fontFamily = "Arial",
  outlineThickness = 2,
  backgroundOpacity = 0,
  className = "",
}: SubtitlePreviewProps) {
  // Calculate position styles
  const positionStyles = useMemo(() => {
    switch (position) {
      case "top":
        return "top-8";
      case "center":
        return "top-1/2 -translate-y-1/2";
      case "bottom":
        return "bottom-8";
      default:
        return "bottom-8";
    }
  }, [position]);

  // Calculate color and outline styles
  const textStyles = useMemo(() => {
    let color = "#FFFFFF";
    let outlineColor = "rgba(0, 0, 0, 0.8)";

    switch (colorTheme) {
      case "white":
        color = "#FFFFFF";
        outlineColor = "rgba(0, 0, 0, 0.8)";
        break;
      case "yellow":
        color = "#FFD700";
        outlineColor = "rgba(0, 0, 0, 0.9)";
        break;
      case "black":
        color = "#000000";
        outlineColor = "rgba(255, 255, 255, 0.8)";
        break;
      case "custom":
        color = customColor || "#FFFFFF";
        outlineColor = "rgba(0, 0, 0, 0.8)";
        break;
    }

    // Build text shadow for outline effect based on thickness
    const shadows = [];
    if (outlineThickness > 0) {
      for (let i = 1; i <= outlineThickness; i++) {
        shadows.push(`${i}px ${i}px 0 ${outlineColor}`);
        shadows.push(`-${i}px -${i}px 0 ${outlineColor}`);
        shadows.push(`${i}px -${i}px 0 ${outlineColor}`);
        shadows.push(`-${i}px ${i}px 0 ${outlineColor}`);
      }
      // Add blur shadow for depth
      shadows.push(`2px 2px 4px ${outlineColor}`);
    }

    return {
      color,
      fontFamily: fontFamily === "Times New Roman" ? "'Times New Roman', serif" : 
                  fontFamily === "Courier New" ? "'Courier New', monospace" :
                  fontFamily === "Georgia" ? "Georgia, serif" :
                  fontFamily === "Verdana" ? "Verdana, sans-serif" :
                  "Arial, sans-serif",
      textShadow: shadows.length > 0 ? shadows.join(", ") : "none",
    };
  }, [colorTheme, customColor, fontFamily, outlineThickness]);

  // Calculate background opacity
  const backgroundStyle = useMemo(() => {
    if (backgroundOpacity > 0) {
      return {
        backgroundColor: `rgba(0, 0, 0, ${backgroundOpacity / 100})`,
        padding: "8px 16px",
        borderRadius: "4px",
      };
    }
    return {};
  }, [backgroundOpacity]);

  return (
    <div className={`relative w-full bg-gray-900 rounded-lg overflow-hidden ${className}`}>
      {/* Video placeholder background */}
      <div className="relative w-full aspect-video bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 flex items-center justify-center">
        <div className="text-gray-500 text-sm">Video Preview</div>
        
        {/* Subtitle overlay */}
        <div className={`absolute left-0 right-0 ${positionStyles} px-8 flex justify-center`}>
          <div style={backgroundStyle}>
            <p
              className="text-center font-bold leading-tight"
              style={{
                fontSize: `${fontSize}px`,
                ...textStyles,
              }}
            >
              {text}
            </p>
          </div>
        </div>
      </div>
      
      {/* Preview label */}
      <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
        Subtitle Preview
      </div>
    </div>
  );
}

// Helper component for subtitle settings
interface SubtitleSettingsPreviewProps {
  fontSize: number;
  position: SubtitlePosition;
  colorTheme: SubtitleColorTheme;
  customColor?: string;
  fontFamily?: SubtitleFontFamily;
  outlineThickness?: number;
  backgroundOpacity?: number;
  onFontSizeChange: (size: number) => void;
  onPositionChange: (position: SubtitlePosition) => void;
  onColorThemeChange: (theme: SubtitleColorTheme) => void;
  onCustomColorChange?: (color: string) => void;
  onFontFamilyChange?: (font: SubtitleFontFamily) => void;
  onOutlineThicknessChange?: (thickness: number) => void;
  onBackgroundOpacityChange?: (opacity: number) => void;
}

export function SubtitleSettingsWithPreview({
  fontSize,
  position,
  colorTheme,
  customColor,
  fontFamily = "Arial",
  outlineThickness = 2,
  backgroundOpacity = 0,
  onFontSizeChange,
  onPositionChange,
  onColorThemeChange,
  onCustomColorChange,
  onFontFamilyChange,
  onOutlineThicknessChange,
  onBackgroundOpacityChange,
}: SubtitleSettingsPreviewProps) {
  return (
    <div className="space-y-4">
      {/* Preview */}
      <SubtitlePreview
        fontSize={fontSize}
        position={position}
        colorTheme={colorTheme}
        customColor={customColor}
        fontFamily={fontFamily}
        outlineThickness={outlineThickness}
        backgroundOpacity={backgroundOpacity}
      />
      
      {/* Settings info */}
      <div className="text-sm text-muted-foreground space-y-1">
        <p>
          <span className="font-medium">Font Size:</span> {fontSize}px
        </p>
        <p>
          <span className="font-medium">Font Family:</span> {fontFamily}
        </p>
        <p>
          <span className="font-medium">Position:</span> {position.charAt(0).toUpperCase() + position.slice(1)}
        </p>
        <p>
          <span className="font-medium">Color:</span> {colorTheme.charAt(0).toUpperCase() + colorTheme.slice(1)}
          {colorTheme === "custom" && customColor && ` (${customColor})`}
        </p>
        <p>
          <span className="font-medium">Outline:</span> {outlineThickness}px
        </p>
        <p>
          <span className="font-medium">Background Opacity:</span> {backgroundOpacity}%
        </p>
      </div>
    </div>
  );
}
