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
    <header className="border-b border-edge bg-surface shrink-0">
      <div className="flex items-center h-14 px-4 sm:px-6 lg:px-10">
        <div className="flex items-center gap-2 min-w-0">{left}</div>
        <div className="flex-1 flex items-center justify-center min-w-0">{center}</div>
        <div className="flex items-center gap-2 min-w-0">{right}</div>
      </div>
    </header>
  );
}
