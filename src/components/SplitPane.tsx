import { type ReactNode, useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "../ds";

export type SplitPaneProps = {
  top: ReactNode;
  bottom: ReactNode;
  /** Initial split ratio for the top pane (0-1). Defaults to 0.65. */
  initialRatio?: number;
  /** Minimum height in pixels for either pane. Defaults to 80. */
  minHeight?: number;
};

export function SplitPane({ top, bottom, initialRatio = 0.65, minHeight = 80 }: SplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [ratio, setRatio] = useState(initialRatio);
  const dragging = useRef(false);

  const handlePointerDown = useCallback((e: React.PointerEvent) => {
    e.preventDefault();
    dragging.current = true;
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging.current || !containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const containerHeight = rect.height;
      if (containerHeight <= 0) return;

      const y = e.clientY - rect.top;
      const minRatio = minHeight / containerHeight;
      const maxRatio = 1 - minHeight / containerHeight;
      const newRatio = Math.max(minRatio, Math.min(maxRatio, y / containerHeight));
      setRatio(newRatio);
    },
    [minHeight],
  );

  const handlePointerUp = useCallback(() => {
    dragging.current = false;
  }, []);

  // Clean up on unmount if pointer was still captured
  useEffect(() => {
    return () => {
      dragging.current = false;
    };
  }, []);

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
