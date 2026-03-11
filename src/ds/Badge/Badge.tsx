import type { ReactNode } from "react";

type BadgeVariant = "default" | "accent" | "warning" | "error";

export type BadgeProps = {
  variant?: BadgeVariant;
  children: ReactNode;
};

const variantClasses: Record<BadgeVariant, string> = {
  default: "bg-surface-2 text-paper-dim border border-edge",
  accent: "bg-accent/10 text-accent border border-accent/20",
  warning: "bg-warning-surface text-warning-text border border-warning-edge",
  error: "bg-error-surface text-error-text border border-error-edge",
};

const baseClasses = "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium";

export function Badge({ variant = "default", children }: BadgeProps) {
  return <span className={[baseClasses, variantClasses[variant]].join(" ")}>{children}</span>;
}
