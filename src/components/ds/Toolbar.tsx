import type { ReactNode } from "react";

const base = "flex items-center justify-between px-4 py-2 border-b border-edge bg-surface";

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className={base}>{children}</div>;
}
