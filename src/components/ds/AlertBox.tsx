import type { ReactNode } from "react";

export function AlertBox({ children }: { children: ReactNode }) {
  return (
    <div className="my-4 p-4 bg-error-surface border border-error-edge rounded text-left">
      {children}
    </div>
  );
}
