import type { ReactNode } from "react";

export function PageContainer({ children }: { children: ReactNode }) {
  return <div className="max-w-xl mx-auto px-4 py-4">{children}</div>;
}
