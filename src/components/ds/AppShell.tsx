import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return <div className="w-screen min-h-screen antialiased bg-gray-100">{children}</div>;
}
