import { type ReactNode, useCallback, useEffect, useRef } from "react";
import { IconButton } from "../ds";
import { t } from "../i18n";

export type OverlayProps = {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
};

export function Overlay({ open, onClose, title, children }: OverlayProps) {
  const startX = useRef<number | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    startX.current = e.touches[0].clientX;
  }, []);

  const handleTouchEnd = useCallback(
    (e: React.TouchEvent) => {
      if (startX.current === null) return;
      const diff = e.changedTouches[0].clientX - startX.current;
      startX.current = null;
      // Swipe right to dismiss (>80px threshold)
      if (diff > 80) onClose();
    },
    [onClose],
  );

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40 transition-opacity duration-200"
        onClick={onClose}
        aria-hidden="true"
      />
      {/* Panel */}
      <div
        className="relative w-80 max-w-[85vw] bg-base border-l border-edge shadow-lg flex flex-col animate-slide-in-right"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {title && (
          <div className="flex items-center justify-between px-3 py-2 border-b border-edge shrink-0">
            <span className="text-sm font-semibold text-paper truncate">{title}</span>
            <IconButton
              icon="close"
              size="sm"
              aria-label={t("reference.close")}
              onClick={onClose}
            />
          </div>
        )}
        <div className="flex-1 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
