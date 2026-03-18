import type { ReactNode } from "react";
import { Icon, type IconName } from "../Icon/Icon";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md";

export type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  active?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children?: ReactNode;
  "aria-label"?: string;
  icon?: IconName;
  iconRight?: IconName;
  iconOnly?: boolean;
  loading?: boolean;
  className?: string;
};

const baseClasses =
  "flex items-center justify-center gap-2 font-medium rounded-lg transition-colors duration-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent select-none";

const variantClasses: Record<ButtonVariant, string> = {
  primary:
    "bg-accent text-white dark:text-black hover:bg-accent-hover active:bg-accent-hover border border-accent-hover",
  secondary: "bg-surface text-paper hover:bg-surface-2 active:bg-surface-2 border border-edge",
  ghost: "text-paper hover:bg-surface-2 active:bg-surface-2 border border-edge",
};

const activeVariantClasses: Record<ButtonVariant, string> = {
  primary: "bg-accent-hover text-white dark:text-black border border-accent-hover",
  secondary: "bg-surface-2 text-paper border border-edge-2",
  ghost: "bg-surface-2 text-accent border border-edge-2",
};

const variantDisabledClasses: Record<ButtonVariant, string> = {
  primary: "bg-accent/40 text-white/50 border border-accent/30 pointer-events-none cursor-default",
  secondary: "bg-surface text-muted border border-edge pointer-events-none cursor-default",
  ghost: "text-muted border border-edge pointer-events-none cursor-default",
};

// Min height: md = 44px (WCAG touch target), sm = 36px
const sizeClasses: Record<ButtonSize, Record<"normal" | "iconOnly", string>> = {
  md: { normal: "min-h-11 px-4 py-2 text-sm", iconOnly: "min-h-11 min-w-11 p-2" },
  sm: { normal: "min-h-9 px-3 py-1.5 text-sm", iconOnly: "min-h-9 min-w-9 p-1.5" },
};

export function Button({
  variant = "secondary",
  size = "md",
  disabled = false,
  active = false,
  type = "button",
  onClick,
  children,
  "aria-label": ariaLabel,
  icon,
  iconRight,
  iconOnly = false,
  loading = false,
  className,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const sizeKey = iconOnly ? "iconOnly" : "normal";

  const classes = [
    baseClasses,
    isDisabled
      ? variantDisabledClasses[variant]
      : active
        ? activeVariantClasses[variant]
        : variantClasses[variant],
    sizeClasses[size][sizeKey],
    className,
  ]
    .filter(Boolean)
    .join(" ");

  const iconSize = size === "sm" ? "4" : "5";

  const leadingIcon = loading ? (
    <Icon name="spinner" size={iconSize} spin />
  ) : icon ? (
    <Icon name={icon} size={iconSize} />
  ) : null;

  return (
    <button
      type={type}
      disabled={isDisabled}
      onClick={onClick}
      className={classes}
      aria-label={ariaLabel}
    >
      {leadingIcon}
      {!iconOnly && children}
      {iconRight && !loading && <Icon name={iconRight} size={iconSize} />}
    </button>
  );
}
