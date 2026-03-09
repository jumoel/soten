import { useId } from "react";

type SelectSize = "sm" | "md";

export type SelectOption = {
  value: string;
  label: string;
  disabled?: boolean;
};

export type SelectProps = {
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  size?: SelectSize;
  label: string;
  labelVisible?: boolean;
  id?: string;
  disabled?: boolean;
};

const sizeClasses: Record<SelectSize, string> = {
  sm: "pl-2 pr-7 py-1 text-xs",
  md: "pl-3 pr-8 py-2 text-sm",
};

const chevronSizeClasses: Record<SelectSize, string> = {
  sm: "right-2",
  md: "right-2.5",
};

const baseClasses =
  "w-full rounded-md border border-edge-2 bg-surface text-paper appearance-none cursor-pointer focus:outline-2 focus:outline-accent focus:border-transparent";

const disabledClasses = "text-muted pointer-events-none cursor-default";

export function Select({
  value,
  onChange,
  options,
  size = "md",
  label,
  labelVisible = false,
  id,
  disabled = false,
}: SelectProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const classes = [baseClasses, sizeClasses[size], disabled ? disabledClasses : ""]
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
      <div className="relative">
        <select
          id={inputId}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={classes}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} disabled={opt.disabled}>
              {opt.label}
            </option>
          ))}
        </select>
        <span
          className={[
            "pointer-events-none absolute top-1/2 -translate-y-1/2 text-muted",
            chevronSizeClasses[size],
          ].join(" ")}
          aria-hidden="true"
        >
          <svg
            width={size === "sm" ? 10 : 12}
            height={size === "sm" ? 10 : 12}
            viewBox="0 0 12 12"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M2 4L6 8L10 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </div>
    </div>
  );
}
