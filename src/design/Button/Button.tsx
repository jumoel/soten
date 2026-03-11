import type { ReactNode } from "react";
import { Icon, type IconName } from "../Icon/Icon";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "sm" | "md";

export type ButtonProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  type?: "button" | "submit" | "reset";
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  children?: ReactNode;
  "aria-label"?: string;
  icon?: IconName;
  iconRight?: IconName;
  iconOnly?: boolean;
  loading?: boolean;
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

const sizeClasses: Record<
  ButtonVariant,
  Record<ButtonSize, Record<"normal" | "iconOnly", string>>
> = {
  primary: {
    md: { normal: "px-3 py-1.5", iconOnly: "p-1.5" },
    sm: { normal: "px-2 py-1 text-sm", iconOnly: "p-1 text-sm" },
  },
  secondary: {
    md: { normal: "px-3 py-1.5", iconOnly: "p-1.5" },
    sm: { normal: "px-2 py-1 text-sm", iconOnly: "p-1 text-sm" },
  },
  ghost: {
    md: { normal: "px-2 py-0.5", iconOnly: "p-1.5" },
    sm: { normal: "px-1.5 py-0.5 text-sm", iconOnly: "p-1 text-sm" },
  },
};

export function Button({
  variant = "secondary",
  size = "md",
  disabled = false,
  type = "button",
  onClick,
  children,
  "aria-label": ariaLabel,
  icon,
  iconRight,
  iconOnly = false,
  loading = false,
}: ButtonProps) {
  const isDisabled = disabled || loading;
  const sizeKey = iconOnly ? "iconOnly" : "normal";

  const classes = [
    baseClasses,
    isDisabled ? variantDisabledClasses[variant] : variantClasses[variant],
    sizeClasses[variant][size][sizeKey],
  ]
    .filter(Boolean)
    .join(" ");

  const leadingIcon = loading ? (
    <Icon name="spinner" size="4" spin />
  ) : icon ? (
    <Icon name={icon} size="4" />
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
      {iconRight && !loading && <Icon name={iconRight} size="4" />}
    </button>
  );
}
