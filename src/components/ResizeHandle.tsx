import type { PointerEvent } from "react";

type ResizeHandleProps = {
  onDrag: (deltaX: number) => void;
};

export function ResizeHandle({ onDrag }: ResizeHandleProps) {
  const handlePointerDown = (e: PointerEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const target = e.currentTarget as Element;
    (target as HTMLElement).setPointerCapture(e.pointerId);

    const handleMove = (ev: globalThis.PointerEvent) => {
      onDrag(ev.clientX - startX);
    };
    const handleUp = () => {
      target.removeEventListener("pointermove", handleMove as EventListener);
      target.removeEventListener("pointerup", handleUp);
    };

    target.addEventListener("pointermove", handleMove as EventListener);
    target.addEventListener("pointerup", handleUp);
  };

  return (
    <div
      className="w-1 cursor-col-resize bg-edge hover:bg-edge-2 transition-colors"
      onPointerDown={handlePointerDown}
    />
  );
}
