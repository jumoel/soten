import type { ReactNode } from "react";

export function DividedList({ children }: { children: ReactNode }) {
  return <ul className="list-none p-0 m-0 divide-y divide-edge">{children}</ul>;
}
