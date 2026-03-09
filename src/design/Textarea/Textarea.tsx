import { useId } from "react";

type TextareaSize = "sm" | "md";

export type TextareaProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
  labelVisible?: boolean;
  id?: string;
  disabled?: boolean;
  rows?: number;
  size?: TextareaSize;
  mono?: boolean;
  className?: string;
};

const sizeClasses: Record<TextareaSize, string> = {
  sm: "px-3 py-2 text-xs",
  md: "px-4 py-3 text-sm",
};

const baseClasses =
  "w-full rounded-md border border-edge-2 bg-surface text-paper resize-none placeholder:text-muted focus:outline-2 focus:outline-accent focus:border-transparent";

const disabledClasses = "text-muted pointer-events-none cursor-default";

export function Textarea({
  value,
  onChange,
  placeholder,
  label,
  labelVisible = false,
  id,
  disabled = false,
  rows = 8,
  size = "md",
  mono = false,
  className,
}: TextareaProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const classes = [
    baseClasses,
    sizeClasses[size],
    disabled ? disabledClasses : "",
    mono ? "font-mono" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={inputId}
        className={labelVisible ? "text-sm font-medium text-paper" : "sr-only"}
      >
        {label}
      </label>
      <textarea
        id={inputId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={classes}
      />
    </div>
  );
}
