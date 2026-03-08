import type { ReactNode } from "react";

export function AppShell({ children }: { children: ReactNode }) {
  return <div className="w-screen h-screen flex flex-col antialiased bg-base">{children}</div>;
}
