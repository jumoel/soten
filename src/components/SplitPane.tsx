import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "../ds";

export type SplitPaneProps = {
  /** First pane content (top in horizontal, left in vertical). */
  top: ReactNode;
  /** Second pane content (bottom in horizontal, right in vertical). */
  bottom: ReactNode;
  /** Split direction. "horizontal" splits top/bottom, "vertical" splits left/right. */
  direction?: "horizontal" | "vertical";
  /** Initial split ratio for the first pane (0-1). Defaults to 0.65. */
  initialRatio?: number;
  /** Minimum size in pixels for either pane. Defaults to 80. */
  minSize?: number;
};

export function SplitPane({
  top,
  bottom,
  direction = "horizontal",
  initialRatio = 0.65,
  minSize = 80,
}: SplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(initialRatio);
  const dragging = useRef(false);

  const isVertical = direction === "vertical";

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    dragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerSize = isVertical ? rect.width : rect.height;
      if (containerSize <= 0) return;

      const pos = isVertical ? e.clientX - rect.left : e.clientY - rect.top;
      const minRatio = minSize / containerSize;
      const maxRatio = 1 - minSize / containerSize;
      const newRatio = Math.max(minRatio, Math.min(maxRatio, pos / containerSize));
      setRatio(newRatio);
    },
    [minSize, isVertical],
  );

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  useEffect(() => {
    return () => {
      dragging.current = false;
    };
  }, []);

  if (isVertical) {
    return (
      <div ref={containerRef} className="flex flex-row h-full">
        <div className="overflow-auto" style={{ flex: `0 0 ${ratio * 100}%` }}>
          {top}
        </div>
        <div
          className="flex items-center justify-center w-3 cursor-col-resize shrink-0 border-x border-edge bg-surface hover:bg-surface-2 transition-colors duration-150 select-none touch-none"
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
        >
          <Icon name="grip-horizontal" size="4" />
        </div>
        <div className="overflow-auto flex-1">{bottom}</div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="flex flex-col h-full">
      <div className="overflow-auto" style={{ flex: `0 0 ${ratio * 100}%` }}>
        {top}
      </div>
      <div
        className="flex items-center justify-center h-3 cursor-row-resize shrink-0 border-y border-edge bg-surface hover:bg-surface-2 transition-colors duration-150 select-none touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        <Icon name="grip-vertical" size="4" />
      </div>
      <div className="overflow-auto flex-1">{bottom}</div>
    </div>
  );
}
