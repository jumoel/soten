import { type ReactNode, useEffect, useRef } from "react";

type PopoverAlign = "start" | "end";
type PopoverSide = "bottom" | "top";

export type PopoverProps = {
  trigger: ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  align?: PopoverAlign;
  side?: PopoverSide;
  className?: string;
  children?: ReactNode;
};

const alignClasses: Record<PopoverAlign, string> = {
  start: "left-0",
  end: "right-0",
};

const sideClasses: Record<PopoverSide, string> = {
  bottom: "top-full mt-1",
  top: "bottom-full mb-1",
};

const panelBaseClasses = "absolute z-30 min-w-48 border border-edge rounded-md bg-surface";

export function Popover({
  trigger,
  open,
  onOpenChange,
  align = "end",
  side = "bottom",
  className,
  children,
}: PopoverProps) {
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    function handleMouseDown(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        onOpenChange(false);
      }
    }

    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onOpenChange(false);
      }
    }

    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onOpenChange]);

  const panelClasses = [panelBaseClasses, alignClasses[align], sideClasses[side], className ?? ""]
    .filter(Boolean)
    .join(" ");

  return (
    <div ref={wrapperRef} className="relative">
      {trigger}
      {open && <div className={panelClasses}>{children}</div>}
    </div>
  );
}
