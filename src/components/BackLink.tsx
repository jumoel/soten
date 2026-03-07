import { NavLink } from "./ds/NavLink";
import type { ReactNode } from "react";

export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <NavLink to={to} variant="back">
      &larr; {children}
    </NavLink>
  );
}
