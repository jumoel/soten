import type { ReactNode } from "react";

export function MenuPanel({ children }: { children: ReactNode }) {
  return (
    <div className="relative z-20 border-b border-edge px-4 py-3 space-y-2 bg-surface">
      {children}
    </div>
  );
}
