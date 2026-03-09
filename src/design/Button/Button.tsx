import { type ReactNode } from "react";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md";

export type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
  children?: ReactNode;
  "aria-label"?: string;
};

const baseClasses =
  "flex items-center gap-1.5 font-medium rounded-md focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const variantClasses: Record<ButtonVariant, string> = {
  primary: "bg-accent text-white dark:text-black hover:bg-accent-hover",
  secondary: "bg-surface border border-edge text-paper hover:bg-surface-2",
  ghost: "border border-edge text-paper-dim hover:bg-surface-2",
};

const variantDisabledClasses: Record<ButtonVariant, string> = {
  primary: "text-muted pointer-events-none cursor-default",
  secondary: "text-muted pointer-events-none cursor-default",
  ghost: "text-muted pointer-events-none cursor-default",
};

const sizeClasses: Record<ButtonVariant, Record<ButtonSize, string>> = {
  primary: {
    md: "px-3 py-1.5",
    sm: "px-2 py-1 text-sm",
  },
  secondary: {
    md: "px-3 py-1.5",
    sm: "px-2 py-1 text-sm",
  },
  ghost: {
    md: "px-2 py-0.5",
    sm: "px-1.5 py-0.5 text-sm",
  },
};

export function Button({
  variant = "secondary",
  size = "md",
  disabled = false,
  type = "button",
  onClick,
  className,
  children,
  "aria-label": ariaLabel,
}: ButtonProps) {
  const classes = [
    baseClasses,
    disabled ? variantDisabledClasses[variant] : variantClasses[variant],
    sizeClasses[variant][size],
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={onClick}
      className={classes}
      aria-label={ariaLabel}
    >
      {children}
    </button>
  );
}
