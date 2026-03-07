import type { ReactNode } from "react";

export function Center({ children }: { children: ReactNode }) {
  return <div className="text-center">{children}</div>;
}
