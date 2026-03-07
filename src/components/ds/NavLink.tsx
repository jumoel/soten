import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

const variantStyles = {
  default: "text-sm no-underline hover:underline",
  brand: "flex items-center gap-2 text-lg font-medium tracking-tight no-underline text-paper",
  listItem: "block py-2.5 no-underline text-paper hover:underline",
  card: "block no-underline",
  back: "block mb-4 text-sm text-muted no-underline hover:underline",
} as const;

export function NavLink({
  to,
  variant = "default",
  onClick,
  children,
}: {
  to: string;
  variant?: keyof typeof variantStyles;
  onClick?: () => void;
  children: ReactNode;
}) {
  return (
    <Link to={to} className={variantStyles[variant]} onClick={onClick}>
      {children}
    </Link>
  );
}
