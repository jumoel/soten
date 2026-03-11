import { Icon, type IconName } from "../Icon/Icon";

export type IconButtonProps = {
  icon: IconName;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  disabled?: boolean;
  "aria-label": string;
  size?: "sm" | "md";
  loading?: boolean;
  className?: string;
};

const baseClasses =
  "inline-flex items-center justify-center rounded-md border border-edge text-paper-dim hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const sizeClasses: Record<"sm" | "md", string> = {
  md: "min-h-[32px] min-w-[32px] p-1.5",
  sm: "min-h-[28px] min-w-[28px] p-1 text-sm",
};

const disabledClasses = "text-muted pointer-events-none cursor-default";

export function IconButton({
  icon,
  onClick,
  disabled = false,
  "aria-label": ariaLabel,
  size = "md",
  loading = false,
  className,
}: IconButtonProps) {
  const isDisabled = disabled || loading;

  const classes = [baseClasses, sizeClasses[size], isDisabled ? disabledClasses : "", className]
    .filter(Boolean)
    .join(" ");

  const iconSize = size === "sm" ? "4" : ("4" as const);

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onClick}
      className={classes}
      aria-label={ariaLabel}
    >
      {loading ? (
        <Icon name="spinner" size={iconSize} spin />
      ) : (
        <Icon name={icon} size={iconSize} />
      )}
    </button>
  );
}
