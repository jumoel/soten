import type { ReactNode } from "react";

export function Stack({ gap = "3", children }: { gap?: string; children: ReactNode }) {
  return <div className={`flex flex-col gap-${gap}`}>{children}</div>;
}
