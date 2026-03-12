import type { ReactNode } from "react";

export function TopBar({
  left,
  center,
  right,
}: {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <header className="flex items-center h-11 px-3 border-b border-edge bg-surface shrink-0">
      <div className="flex items-center gap-2 min-w-0">{left}</div>
      <div className="flex-1 flex items-center justify-center min-w-0">{center}</div>
      <div className="flex items-center gap-2 min-w-0">{right}</div>
    </header>
  );
}
