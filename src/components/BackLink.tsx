import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function BackLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link to={to} className="block mb-4 text-sm text-gray-500 no-underline hover:underline">
      &larr; {children}
    </Link>
  );
}
