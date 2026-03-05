import type { ReactNode } from "react";

export function AlertBox({ children }: { children: ReactNode }) {
  return (
    <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-lg text-left">{children}</div>
  );
}
