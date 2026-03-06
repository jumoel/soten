import type { ReactNode } from "react";

export function DividedList({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <ul
      className={["list-none p-0 m-0 divide-y divide-gray-200", className]
        .filter(Boolean)
        .join(" ")}
    >
      {children}
    </ul>
  );
}
