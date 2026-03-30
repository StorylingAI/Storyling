import { useState, useRef, useCallback, useEffect } from "react";
import { Monitor, Smartphone, Copy, Check, RotateCcw, Eye, EyeOff, Move, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

// ─── CDN Assets (same as AdventureMap) ──────────────────────────────────────
const BG_DESKTOP = "https://d2xsxph8kpxj0f.cloudfront.net/103676959/REBiP2ev8rqbpxn8LRb7vA/adventure-map-disney-desktop-PjEkMa2WyeB6WUd3ryvkXk.webp";
const BG_MOBILE = "https://d2xsxph8kpxj0f.cloudfront.net/103676959/REBiP2ev8rqbpxn8LRb7vA/adventure-map-disney-mobile-RgS84ugvG8dQLmSo5YKt69.webp";
const BOOKI_IMG = "https://d2xsxph8kpxj0f.cloudfront.net/103676959/REBiP2ev8rqbpxn8LRb7vA/booki-disney-sprite-Z7oZ5pF2yhxt32VbLknKwD.png";

// ─── Color palette for each building ────────────────────────────────────────
const BUILDING_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  create: { bg: "rgba(139,107,174,0.25)", border: "#8B6BAE", text: "#6B4C8A" },
  library: { bg: "rgba(45,180,160,0.25)", border: "#2DD4BF", text: "#1A8A7A" },
  wordbank: { bg: "rgba(245,158,11,0.25)", border: "#F59E0B", text: "#B45309" },
  chat: { bg: "rgba(59,130,246,0.25)", border: "#3B82F6", text: "#1D4ED8" },
  profile: { bg: "rgba(236,72,153,0.25)", border: "#EC4899", text: "#BE185D" },
};

// ─── Types ──────────────────────────────────────────────────────────────────
interface HotspotZone {
  left: number;
  top: number;
  width: number;
  height: number;
}

interface BuildingData {
  id: string;
  label: string;
  fullLabel: string;
  desktop: HotspotZone;
  mobile: HotspotZone;
  zoomTarget: { x: number; y: number };
}

interface BookiPos {
  desktop: { left: number; top: number };
  mobile: { left: number; top: number };
}

// ─── Initial data (matches AdventureMap.tsx) ────────────────────────────────
const INITIAL_BUILDINGS: BuildingData[] = [
  {
    id: "create", label: "Create", fullLabel: "Story Creation Zone",
    desktop: { left: 18, top: 5, width: 22, height: 38 },
    mobile: { left: 15, top: 2, width: 50, height: 20 },
    zoomTarget: { x: 28, y: 22 },
  },
  {
    id: "library", label: "Library", fullLabel: "Library",
    desktop: { left: 55, top: 5, width: 28, height: 42 },
    mobile: { left: 45, top: 20, width: 42, height: 18 },
    zoomTarget: { x: 68, y: 25 },
  },
  {
    id: "wordbank", label: "Words", fullLabel: "Word Bank",
    desktop: { left: 5, top: 42, width: 24, height: 30 },
    mobile: { left: 10, top: 35, width: 40, height: 17 },
    zoomTarget: { x: 16, y: 55 },
  },
  {
    id: "chat", label: "Chat", fullLabel: "Chat with Booki",
    desktop: { left: 72, top: 42, width: 24, height: 32 },
    mobile: { left: 5, top: 58, width: 38, height: 17 },
    zoomTarget: { x: 82, y: 58 },
  },
  {
    id: "profile", label: "Profile", fullLabel: "Profile",
    desktop: { left: 38, top: 62, width: 22, height: 30 },
    mobile: { left: 55, top: 75, width: 32, height: 20 },
    zoomTarget: { x: 48, y: 75 },
  },
];

const INITIAL_BOOKI: BookiPos = {
  desktop: { left: 48, top: 42 },
  mobile: { left: 60, top: 55 },
};

type DragMode = "move" | "resize-br" | "resize-bl" | "resize-tr" | "resize-tl" | "move-booki" | "move-zoom" | null;

export default function HotspotEditor() {
  const [, setLocation] = useLocation();
  const [viewMode, setViewMode] = useState<"desktop" | "mobile">("desktop");
  const [buildings, setBuildings] = useState<BuildingData[]>(JSON.parse(JSON.stringify(INITIAL_BUILDINGS)));
  const [booki, setBooki] = useState<BookiPos>(JSON.parse(JSON.stringify(INITIAL_BOOKI)));
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showGlow, setShowGlow] = useState(true);
  const [showLabels, setShowLabels] = useState(true);
  const [copied, setCopied] = useState(false);
  const [editingZoomTarget, setEditingZoomTarget] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{
    mode: DragMode;
    buildingId: string | null;
    startX: number;
    startY: number;
    startZone: HotspotZone;
    startBooki: { left: number; top: number };
    startZoom: { x: number; y: number };
  } | null>(null);

  const bgUrl = viewMode === "desktop" ? BG_DESKTOP : BG_MOBILE;
  const selectedBuilding = buildings.find((b) => b.id === selectedId);

  // ─── Convert pixel coords to percentage of container ──────────────────────
  const pxToPercent = useCallback(
    (px: number, py: number) => {
      if (!containerRef.current) return { x: 0, y: 0 };
      const rect = containerRef.current.getBoundingClientRect();
      return {
        x: ((px - rect.left) / rect.width) * 100,
        y: ((py - rect.top) / rect.height) * 100,
      };
    },
    []
  );

  // ─── Mouse/touch drag handlers ────────────────────────────────────────────
  const startDrag = useCallback(
    (
      e: React.MouseEvent | React.TouchEvent,
      mode: DragMode,
      buildingId: string | null
    ) => {
      e.preventDefault();
      e.stopPropagation();
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const building = buildings.find((b) => b.id === buildingId);
      const zone = building ? building[viewMode] : { left: 0, top: 0, width: 0, height: 0 };
      const bookiPos = booki[viewMode];
      const zoomTarget = building?.zoomTarget || { x: 0, y: 0 };

      dragRef.current = {
        mode,
        buildingId,
        startX: clientX,
        startY: clientY,
        startZone: { ...zone },
        startBooki: { ...bookiPos },
        startZoom: { ...zoomTarget },
      };
    },
    [buildings, booki, viewMode]
  );

  const onPointerMove = useCallback(
    (e: MouseEvent | TouchEvent) => {
      if (!dragRef.current || !containerRef.current) return;
      const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
      const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

      const rect = containerRef.current.getBoundingClientRect();
      const dx = ((clientX - dragRef.current.startX) / rect.width) * 100;
      const dy = ((clientY - dragRef.current.startY) / rect.height) * 100;

      const { mode, buildingId, startZone, startBooki, startZoom } = dragRef.current;

      if (mode === "move-booki") {
        setBooki((prev) => ({
          ...prev,
          [viewMode]: {
            left: Math.max(0, Math.min(100, startBooki.left + dx)),
            top: Math.max(0, Math.min(100, startBooki.top + dy)),
          },
        }));
        return;
      }

      if (mode === "move-zoom" && buildingId) {
        setBuildings((prev) =>
          prev.map((b) =>
            b.id === buildingId
              ? {
                  ...b,
                  zoomTarget: {
                    x: Math.max(0, Math.min(100, Math.round(startZoom.x + dx))),
                    y: Math.max(0, Math.min(100, Math.round(startZoom.y + dy))),
                  },
                }
              : b
          )
        );
        return;
      }

      if (!buildingId) return;

      if (mode === "move") {
        setBuildings((prev) =>
          prev.map((b) =>
            b.id === buildingId
              ? {
                  ...b,
                  [viewMode]: {
                    ...b[viewMode],
                    left: Math.max(0, Math.min(100 - startZone.width, Math.round(startZone.left + dx))),
                    top: Math.max(0, Math.min(100 - startZone.height, Math.round(startZone.top + dy))),
                  },
                }
              : b
          )
        );
      } else if (mode === "resize-br") {
        setBuildings((prev) =>
          prev.map((b) =>
            b.id === buildingId
              ? {
                  ...b,
                  [viewMode]: {
                    ...b[viewMode],
                    width: Math.max(5, Math.min(100 - startZone.left, Math.round(startZone.width + dx))),
                    height: Math.max(5, Math.min(100 - startZone.top, Math.round(startZone.height + dy))),
                  },
                }
              : b
          )
        );
      } else if (mode === "resize-tl") {
        const newLeft = Math.max(0, Math.round(startZone.left + dx));
        const newTop = Math.max(0, Math.round(startZone.top + dy));
        setBuildings((prev) =>
          prev.map((b) =>
            b.id === buildingId
              ? {
                  ...b,
                  [viewMode]: {
                    left: newLeft,
                    top: newTop,
                    width: Math.max(5, startZone.width - (newLeft - startZone.left)),
                    height: Math.max(5, startZone.height - (newTop - startZone.top)),
                  },
                }
              : b
          )
        );
      } else if (mode === "resize-tr") {
        const newTop = Math.max(0, Math.round(startZone.top + dy));
        setBuildings((prev) =>
          prev.map((b) =>
            b.id === buildingId
              ? {
                  ...b,
                  [viewMode]: {
                    left: startZone.left,
                    top: newTop,
                    width: Math.max(5, Math.round(startZone.width + dx)),
                    height: Math.max(5, startZone.height - (newTop - startZone.top)),
                  },
                }
              : b
          )
        );
      } else if (mode === "resize-bl") {
        const newLeft = Math.max(0, Math.round(startZone.left + dx));
        setBuildings((prev) =>
          prev.map((b) =>
            b.id === buildingId
              ? {
                  ...b,
                  [viewMode]: {
                    left: newLeft,
                    top: startZone.top,
                    width: Math.max(5, startZone.width - (newLeft - startZone.left)),
                    height: Math.max(5, Math.round(startZone.height + dy)),
                  },
                }
              : b
          )
        );
      }
    },
    [viewMode]
  );

  const onPointerUp = useCallback(() => {
    dragRef.current = null;
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", onPointerMove);
    window.addEventListener("mouseup", onPointerUp);
    window.addEventListener("touchmove", onPointerMove, { passive: false });
    window.addEventListener("touchend", onPointerUp);
    return () => {
      window.removeEventListener("mousemove", onPointerMove);
      window.removeEventListener("mouseup", onPointerUp);
      window.removeEventListener("touchmove", onPointerMove);
      window.removeEventListener("touchend", onPointerUp);
    };
  }, [onPointerMove, onPointerUp]);

  // ─── Export config to clipboard ───────────────────────────────────────────
  const exportConfig = useCallback(() => {
    const buildingsCode = buildings
      .map((b) => {
        return `  {
    id: "${b.id}",
    label: "${b.label}",
    fullLabel: "${b.fullLabel}",
    description: "...", // keep existing
    path: "...", // keep existing
    bookiMessage: "...", // keep existing
    desktop: { left: ${b.desktop.left}, top: ${b.desktop.top}, width: ${b.desktop.width}, height: ${b.desktop.height} },
    mobile: { left: ${b.mobile.left}, top: ${b.mobile.top}, width: ${b.mobile.width}, height: ${b.mobile.height} },
    zoomTarget: { x: ${b.zoomTarget.x}, y: ${b.zoomTarget.y} },
  }`;
      })
      .join(",\n");

    const bookiCode = `const BOOKI_POS = {
  desktop: { left: ${booki.desktop.left}, top: ${booki.desktop.top} },
  mobile: { left: ${booki.mobile.left}, top: ${booki.mobile.top} },
};`;

    const fullCode = `// ─── Updated Building Positions ─────────────────────────────────\nconst BUILDINGS: Building[] = [\n${buildingsCode}\n];\n\n${bookiCode}`;

    navigator.clipboard.writeText(fullCode).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }, [buildings, booki]);

  // ─── Reset to initial ─────────────────────────────────────────────────────
  const resetAll = useCallback(() => {
    setBuildings(JSON.parse(JSON.stringify(INITIAL_BUILDINGS)));
    setBooki(JSON.parse(JSON.stringify(INITIAL_BOOKI)));
    setSelectedId(null);
  }, []);

  // ─── Numeric input handler ────────────────────────────────────────────────
  const updateField = useCallback(
    (buildingId: string, field: keyof HotspotZone, value: number) => {
      setBuildings((prev) =>
        prev.map((b) =>
          b.id === buildingId
            ? { ...b, [viewMode]: { ...b[viewMode], [field]: Math.max(0, Math.min(100, value)) } }
            : b
        )
      );
    },
    [viewMode]
  );

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#1a1a2e", fontFamily: "Fredoka, sans-serif" }}>
      {/* ── Left panel: controls ── */}
      <div
        className="flex flex-col shrink-0 overflow-y-auto"
        style={{
          width: 320,
          background: "#16213e",
          borderRight: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* Header */}
        <div className="px-4 py-3 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <div className="flex items-center gap-2 mb-3">
            <button
              onClick={() => setLocation("/app")}
              className="h-8 w-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <ArrowLeft className="h-4 w-4 text-white/70" />
            </button>
            <h1 className="text-lg font-bold text-white">Hotspot Editor</h1>
          </div>

          {/* View mode toggle */}
          <div className="flex gap-1 p-1 rounded-lg" style={{ background: "rgba(255,255,255,0.06)" }}>
            <button
              onClick={() => setViewMode("desktop")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-semibold transition-all ${
                viewMode === "desktop" ? "bg-white/15 text-white" : "text-white/40 hover:text-white/60"
              }`}
            >
              <Monitor className="h-4 w-4" /> Desktop
            </button>
            <button
              onClick={() => setViewMode("mobile")}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-md text-sm font-semibold transition-all ${
                viewMode === "mobile" ? "bg-white/15 text-white" : "text-white/40 hover:text-white/60"
              }`}
            >
              <Smartphone className="h-4 w-4" /> Mobile
            </button>
          </div>
        </div>

        {/* Toolbar */}
        <div className="px-4 py-3 flex gap-2 border-b" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <button
            onClick={() => setShowGlow(!showGlow)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: showGlow ? "rgba(255,215,0,0.15)" : "rgba(255,255,255,0.06)",
              color: showGlow ? "#FFD700" : "rgba(255,255,255,0.4)",
              border: `1px solid ${showGlow ? "rgba(255,215,0,0.3)" : "rgba(255,255,255,0.08)"}`,
            }}
          >
            {showGlow ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
            Glow
          </button>
          <button
            onClick={() => setShowLabels(!showLabels)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: showLabels ? "rgba(139,107,174,0.15)" : "rgba(255,255,255,0.06)",
              color: showLabels ? "#8B6BAE" : "rgba(255,255,255,0.4)",
              border: `1px solid ${showLabels ? "rgba(139,107,174,0.3)" : "rgba(255,255,255,0.08)"}`,
            }}
          >
            Labels
          </button>
          <button
            onClick={() => setEditingZoomTarget(!editingZoomTarget)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
            style={{
              background: editingZoomTarget ? "rgba(59,130,246,0.15)" : "rgba(255,255,255,0.06)",
              color: editingZoomTarget ? "#3B82F6" : "rgba(255,255,255,0.4)",
              border: `1px solid ${editingZoomTarget ? "rgba(59,130,246,0.3)" : "rgba(255,255,255,0.08)"}`,
            }}
          >
            Zoom
          </button>
          <button
            onClick={resetAll}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white/40 hover:text-white/60 transition-all"
            style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.08)" }}
          >
            <RotateCcw className="h-3.5 w-3.5" /> Reset
          </button>
        </div>

        {/* Building list */}
        <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
          {buildings.map((b) => {
            const colors = BUILDING_COLORS[b.id] || BUILDING_COLORS.create;
            const zone = b[viewMode];
            const isSelected = selectedId === b.id;
            return (
              <div
                key={b.id}
                onClick={() => setSelectedId(isSelected ? null : b.id)}
                className="rounded-xl cursor-pointer transition-all"
                style={{
                  background: isSelected ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
                  border: `1px solid ${isSelected ? colors.border : "rgba(255,255,255,0.06)"}`,
                  padding: "10px 12px",
                }}
              >
                <div className="flex items-center gap-2 mb-2">
                  <div
                    className="h-3 w-3 rounded-full shrink-0"
                    style={{ background: colors.border }}
                  />
                  <span className="text-sm font-bold text-white">{b.fullLabel}</span>
                </div>

                {/* Coordinate inputs */}
                <div className="grid grid-cols-4 gap-1.5">
                  {(["left", "top", "width", "height"] as const).map((field) => (
                    <div key={field}>
                      <label className="text-[10px] text-white/30 uppercase tracking-wider">{field.charAt(0).toUpperCase()}</label>
                      <input
                        type="number"
                        value={zone[field]}
                        onChange={(e) => updateField(b.id, field, parseInt(e.target.value) || 0)}
                        onClick={(e) => e.stopPropagation()}
                        className="w-full px-2 py-1 rounded-md text-xs font-mono text-white outline-none"
                        style={{
                          background: "rgba(255,255,255,0.06)",
                          border: "1px solid rgba(255,255,255,0.1)",
                        }}
                        min={0}
                        max={100}
                      />
                    </div>
                  ))}
                </div>

                {/* Zoom target */}
                {isSelected && (
                  <div className="mt-2 pt-2 border-t" style={{ borderColor: "rgba(255,255,255,0.06)" }}>
                    <label className="text-[10px] text-white/30 uppercase tracking-wider">Zoom Target</label>
                    <div className="grid grid-cols-2 gap-1.5 mt-1">
                      <div>
                        <label className="text-[10px] text-white/30">X</label>
                        <input
                          type="number"
                          value={b.zoomTarget.x}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setBuildings((prev) =>
                              prev.map((bb) =>
                                bb.id === b.id ? { ...bb, zoomTarget: { ...bb.zoomTarget, x: Math.max(0, Math.min(100, val)) } } : bb
                              )
                            );
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-2 py-1 rounded-md text-xs font-mono text-white outline-none"
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                          min={0} max={100}
                        />
                      </div>
                      <div>
                        <label className="text-[10px] text-white/30">Y</label>
                        <input
                          type="number"
                          value={b.zoomTarget.y}
                          onChange={(e) => {
                            const val = parseInt(e.target.value) || 0;
                            setBuildings((prev) =>
                              prev.map((bb) =>
                                bb.id === b.id ? { ...bb, zoomTarget: { ...bb.zoomTarget, y: Math.max(0, Math.min(100, val)) } } : bb
                              )
                            );
                          }}
                          onClick={(e) => e.stopPropagation()}
                          className="w-full px-2 py-1 rounded-md text-xs font-mono text-white outline-none"
                          style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                          min={0} max={100}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}

          {/* Booki position */}
          <div
            className="rounded-xl cursor-pointer transition-all"
            style={{
              background: selectedId === "__booki__" ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.03)",
              border: `1px solid ${selectedId === "__booki__" ? "#FFD700" : "rgba(255,255,255,0.06)"}`,
              padding: "10px 12px",
            }}
            onClick={() => setSelectedId(selectedId === "__booki__" ? null : "__booki__")}
          >
            <div className="flex items-center gap-2 mb-2">
              <img src={BOOKI_IMG} alt="Booki" className="h-5 w-5 object-contain" />
              <span className="text-sm font-bold text-white">Booki Position</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <div>
                <label className="text-[10px] text-white/30 uppercase tracking-wider">Left</label>
                <input
                  type="number"
                  value={Math.round(booki[viewMode].left)}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setBooki((prev) => ({ ...prev, [viewMode]: { ...prev[viewMode], left: Math.max(0, Math.min(100, val)) } }));
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-2 py-1 rounded-md text-xs font-mono text-white outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                  min={0} max={100}
                />
              </div>
              <div>
                <label className="text-[10px] text-white/30 uppercase tracking-wider">Top</label>
                <input
                  type="number"
                  value={Math.round(booki[viewMode].top)}
                  onChange={(e) => {
                    const val = parseInt(e.target.value) || 0;
                    setBooki((prev) => ({ ...prev, [viewMode]: { ...prev[viewMode], top: Math.max(0, Math.min(100, val)) } }));
                  }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-full px-2 py-1 rounded-md text-xs font-mono text-white outline-none"
                  style={{ background: "rgba(255,255,255,0.06)", border: "1px solid rgba(255,255,255,0.1)" }}
                  min={0} max={100}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Export button */}
        <div className="px-4 py-3 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <button
            onClick={exportConfig}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold transition-all hover:scale-[1.02] active:scale-95"
            style={{
              background: copied
                ? "linear-gradient(135deg, #22C55E, #16A34A)"
                : "linear-gradient(135deg, #6B4C8A, #8B6BAE)",
              color: "white",
              boxShadow: copied
                ? "0 4px 20px rgba(34,197,94,0.4)"
                : "0 4px 20px rgba(107,76,138,0.4)",
            }}
          >
            {copied ? (
              <>
                <Check className="h-4 w-4" /> Copied to Clipboard!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" /> Copy Config
              </>
            )}
          </button>
          <p className="text-[11px] text-white/30 text-center mt-2">
            Copies the BUILDINGS + BOOKI_POS config to paste into AdventureMap.tsx
          </p>
        </div>
      </div>

      {/* ── Right panel: visual map ── */}
      <div className="flex-1 flex items-center justify-center p-6 overflow-hidden" style={{ background: "#0f0f23" }}>
        <div
          ref={containerRef}
          className="relative overflow-hidden rounded-2xl shadow-2xl"
          style={{
            width: viewMode === "desktop" ? "100%" : 390,
            maxWidth: viewMode === "desktop" ? 1200 : 390,
            aspectRatio: viewMode === "desktop" ? "16/9" : "9/19.5",
            maxHeight: "calc(100vh - 48px)",
            border: "2px solid rgba(255,255,255,0.1)",
          }}
          onClick={() => setSelectedId(null)}
        >
          {/* Background */}
          <img
            src={bgUrl}
            alt="Map background"
            className="absolute inset-0 w-full h-full object-cover"
            draggable={false}
          />

          {/* Building hotspot overlays */}
          {buildings.map((b) => {
            const zone = b[viewMode];
            const colors = BUILDING_COLORS[b.id] || BUILDING_COLORS.create;
            const isSelected = selectedId === b.id;
            return (
              <div
                key={b.id}
                className="absolute"
                style={{
                  left: `${zone.left}%`,
                  top: `${zone.top}%`,
                  width: `${zone.width}%`,
                  height: `${zone.height}%`,
                  zIndex: isSelected ? 20 : 10,
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedId(isSelected ? null : b.id);
                }}
              >
                {/* Colored overlay */}
                <div
                  className="absolute inset-0 rounded-xl transition-all duration-200"
                  style={{
                    background: colors.bg,
                    border: `2px ${isSelected ? "solid" : "dashed"} ${colors.border}`,
                    boxShadow: isSelected && showGlow
                      ? `0 0 30px rgba(255,210,120,0.4), inset 0 0 20px rgba(255,210,120,0.1)`
                      : "none",
                  }}
                />

                {/* Label */}
                {showLabels && (
                  <div
                    className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 px-2 py-1 rounded-lg whitespace-nowrap pointer-events-none"
                    style={{
                      background: "rgba(0,0,0,0.7)",
                      backdropFilter: "blur(4px)",
                    }}
                  >
                    <span className="text-xs font-bold text-white">{b.label}</span>
                  </div>
                )}

                {/* Drag handle (center) */}
                <div
                  className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-6 w-6 rounded-full flex items-center justify-center cursor-move opacity-0 hover:opacity-100 transition-opacity"
                  style={{ background: "rgba(255,255,255,0.9)", zIndex: 25 }}
                  onMouseDown={(e) => startDrag(e, "move", b.id)}
                  onTouchStart={(e) => startDrag(e, "move", b.id)}
                >
                  <Move className="h-3.5 w-3.5" style={{ color: colors.text }} />
                </div>

                {/* Resize handles (corners) */}
                {isSelected && (
                  <>
                    {/* Top-left */}
                    <div
                      className="absolute -top-1.5 -left-1.5 h-4 w-4 rounded-full cursor-nw-resize"
                      style={{ background: colors.border, border: "2px solid white", zIndex: 25 }}
                      onMouseDown={(e) => startDrag(e, "resize-tl", b.id)}
                      onTouchStart={(e) => startDrag(e, "resize-tl", b.id)}
                    />
                    {/* Top-right */}
                    <div
                      className="absolute -top-1.5 -right-1.5 h-4 w-4 rounded-full cursor-ne-resize"
                      style={{ background: colors.border, border: "2px solid white", zIndex: 25 }}
                      onMouseDown={(e) => startDrag(e, "resize-tr", b.id)}
                      onTouchStart={(e) => startDrag(e, "resize-tr", b.id)}
                    />
                    {/* Bottom-left */}
                    <div
                      className="absolute -bottom-1.5 -left-1.5 h-4 w-4 rounded-full cursor-sw-resize"
                      style={{ background: colors.border, border: "2px solid white", zIndex: 25 }}
                      onMouseDown={(e) => startDrag(e, "resize-bl", b.id)}
                      onTouchStart={(e) => startDrag(e, "resize-bl", b.id)}
                    />
                    {/* Bottom-right */}
                    <div
                      className="absolute -bottom-1.5 -right-1.5 h-4 w-4 rounded-full cursor-se-resize"
                      style={{ background: colors.border, border: "2px solid white", zIndex: 25 }}
                      onMouseDown={(e) => startDrag(e, "resize-br", b.id)}
                      onTouchStart={(e) => startDrag(e, "resize-br", b.id)}
                    />
                  </>
                )}

                {/* Zoom target indicator */}
                {editingZoomTarget && (
                  <div
                    className="absolute h-5 w-5 rounded-full cursor-crosshair"
                    style={{
                      left: `${((b.zoomTarget.x - zone.left) / zone.width) * 100}%`,
                      top: `${((b.zoomTarget.y - zone.top) / zone.height) * 100}%`,
                      transform: "translate(-50%, -50%)",
                      background: "rgba(59,130,246,0.9)",
                      border: "2px solid white",
                      boxShadow: "0 0 8px rgba(59,130,246,0.6)",
                      zIndex: 30,
                    }}
                    onMouseDown={(e) => startDrag(e, "move-zoom", b.id)}
                    onTouchStart={(e) => startDrag(e, "move-zoom", b.id)}
                  />
                )}
              </div>
            );
          })}

          {/* Booki draggable */}
          <div
            className="absolute z-30"
            style={{
              left: `${booki[viewMode].left}%`,
              top: `${booki[viewMode].top}%`,
              transform: "translate(-50%, -50%)",
              cursor: "move",
            }}
            onClick={(e) => {
              e.stopPropagation();
              setSelectedId("__booki__");
            }}
            onMouseDown={(e) => {
              e.stopPropagation();
              startDrag(e, "move-booki", null);
            }}
            onTouchStart={(e) => {
              e.stopPropagation();
              startDrag(e, "move-booki", null);
            }}
          >
            <img
              src={BOOKI_IMG}
              alt="Booki"
              className="object-contain"
              style={{
                width: viewMode === "desktop" ? 70 : 50,
                height: viewMode === "desktop" ? 70 : 50,
                filter: selectedId === "__booki__"
                  ? "drop-shadow(0 0 12px rgba(255,215,0,0.8))"
                  : "drop-shadow(0 4px 12px rgba(0,0,0,0.25))",
                pointerEvents: "none",
              }}
              draggable={false}
            />
            {selectedId === "__booki__" && (
              <div
                className="absolute -top-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-md whitespace-nowrap"
                style={{ background: "rgba(0,0,0,0.7)", fontSize: 10, color: "#FFD700", fontWeight: 700 }}
              >
                Booki ({Math.round(booki[viewMode].left)}, {Math.round(booki[viewMode].top)})
              </div>
            )}
          </div>

          {/* Coordinate readout overlay */}
          <div
            className="absolute bottom-3 right-3 px-3 py-1.5 rounded-lg"
            style={{
              background: "rgba(0,0,0,0.75)",
              backdropFilter: "blur(8px)",
              zIndex: 40,
            }}
          >
            <span className="text-[11px] font-mono text-white/60">
              {viewMode.toUpperCase()} | {selectedId ? `Selected: ${selectedId}` : "Click a zone to select"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
