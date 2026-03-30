import { useState, useEffect, useCallback } from "react";

/**
 * Computes the size and offset of an "image plane" div that replicates
 * object-fit:cover behaviour. Labels placed as %-children of this div
 * are anchored to the image itself and never drift.
 *
 * Returns [planeStyle, callbackRef] — attach callbackRef to the container div.
 */

interface PlaneStyle {
  width: number;
  height: number;
  left: number;
  top: number;
}

export function useImagePlane(
  imgNaturalW: number,
  imgNaturalH: number,
  anchorY: "center" | "top" = "center",
): [PlaneStyle, (node: HTMLDivElement | null) => void] {
  const [plane, setPlane] = useState<PlaneStyle>({ width: 0, height: 0, left: 0, top: 0 });
  const [containerEl, setContainerEl] = useState<HTMLDivElement | null>(null);

  // Callback ref: React calls this when the element mounts/unmounts
  const callbackRef = useCallback((node: HTMLDivElement | null) => {
    setContainerEl(node);
  }, []);

  useEffect(() => {
    if (!containerEl) return;

    function compute() {
      if (!containerEl) return;
      const cw = containerEl.clientWidth;
      const ch = containerEl.clientHeight;
      if (cw === 0 || ch === 0) return;

      // object-fit:cover scale
      const scale = Math.max(cw / imgNaturalW, ch / imgNaturalH);
      const w = imgNaturalW * scale;
      const h = imgNaturalH * scale;

      // object-position centering
      const left = (cw - w) / 2;
      const top = anchorY === "top" ? 0 : (ch - h) / 2;

      setPlane({ width: w, height: h, left, top });
    }

    // Run immediately
    compute();

    // ResizeObserver for container size changes
    const ro = new ResizeObserver(compute);
    ro.observe(containerEl);

    // Window resize as fallback
    window.addEventListener("resize", compute);

    return () => {
      ro.disconnect();
      window.removeEventListener("resize", compute);
    };
  }, [containerEl, imgNaturalW, imgNaturalH, anchorY]);

  return [plane, callbackRef];
}
