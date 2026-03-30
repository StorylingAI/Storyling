import { useState, useEffect, useCallback } from "react";

/**
 * Source image coordinates for each building/landmark in the map images.
 * These are pixel positions in the original source images.
 *
 * Desktop source: 2752 × 1536
 * Mobile source:  1536 × 2752
 */
const DESKTOP_SRC = { w: 2752, h: 1536 } as const;
const MOBILE_SRC = { w: 1536, h: 2752 } as const;

// Positions measured from the source images (pixel coords in the original PNGs)
const DESKTOP_LANDMARKS = {
  stories:  { x: 1376, y: 645 },   // bookshop door center (50% left, 42% top)
  wordbank: { x: 495,  y: 998 },   // cottage sign board (18% left, 65% top)
  create:   { x: 2147, y: 922 },   // writing desk / scroll (78% left, 60% top)
  booki:    { x: 1376, y: 1029 },  // golden platform center (50% left, 67% top)
} as const;

const MOBILE_LANDMARKS = {
  stories:  { x: 615,  y: 880 },   // bookshop base
  wordbank: { x: 230,  y: 1710 },  // cottage sign
  create:   { x: 1000, y: 1710 },  // writing desk
  booki:    { x: 615,  y: 2000 },  // golden platform
} as const;

type LandmarkKey = keyof typeof DESKTOP_LANDMARKS;

interface MapPositions {
  stories:  { left: number; top: number };
  wordbank: { left: number; top: number };
  create:   { left: number; top: number };
  booki:    { left: number; top: number };
}

/**
 * Replicates the browser's object-fit:cover + object-position:center math
 * to convert source-image pixel coordinates into CSS pixel positions
 * within the container element.
 */
function computePositions(
  containerW: number,
  containerH: number,
  isMobile: boolean
): MapPositions {
  const src = isMobile ? MOBILE_SRC : DESKTOP_SRC;
  const landmarks = isMobile ? MOBILE_LANDMARKS : DESKTOP_LANDMARKS;

  // object-fit:cover scale factor
  const scale = Math.max(containerW / src.w, containerH / src.h);

  // Scaled image dimensions
  const scaledW = src.w * scale;
  const scaledH = src.h * scale;

  // object-position:center center → equal crop on both axes
  // For mobile we use "center top" so y offset is 0
  const xOffset = (scaledW - containerW) / 2;
  const yOffset = isMobile ? 0 : (scaledH - containerH) / 2;

  // Clamp positions so labels stay within visible area (with padding for label width)
  const PADDING = 60; // px padding from edges for label visibility
  const convert = (coord: { x: number; y: number }) => ({
    left: Math.max(PADDING, Math.min(containerW - PADDING, coord.x * scale - xOffset)),
    top:  Math.max(PADDING, Math.min(containerH - PADDING, coord.y * scale - yOffset)),
  });

  return {
    stories:  convert(landmarks.stories),
    wordbank: convert(landmarks.wordbank),
    create:   convert(landmarks.create),
    booki:    convert(landmarks.booki),
  };
}

/**
 * Hook that returns pixel positions for each map landmark,
 * recalculated on every resize.
 */
export function useMapPositions(isMobile: boolean) {
  const calc = useCallback(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;
    return computePositions(w, h, isMobile);
  }, [isMobile]);

  const [positions, setPositions] = useState<MapPositions>(calc);

  useEffect(() => {
    const update = () => setPositions(calc());
    update(); // initial
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [calc]);

  return positions;
}
