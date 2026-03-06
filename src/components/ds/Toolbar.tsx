import type { ReactNode } from "react";

const base = "flex items-center justify-between px-4 py-2 border-b border-gray-200";

export function Toolbar({ className, children }: { className?: string; children: ReactNode }) {
  return <div className={[base, className].filter(Boolean).join(" ")}>{children}</div>;
}
