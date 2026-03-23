import { useId } from "react";
import { Icon, type IconName } from "../Icon/Icon";

export type InputProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
  labelVisible?: boolean;
  id?: string;
  disabled?: boolean;
  type?: string;
  icon?: IconName;
  className?: string;
};

const baseClasses =
  "w-full rounded-md border border-edge-2 bg-surface py-1.5 px-3 text-sm text-paper placeholder:text-muted focus:outline-2 focus:outline-accent focus:border-transparent";

const disabledClasses = "text-muted pointer-events-none cursor-default";

export function Input({
  value,
  onChange,
  placeholder,
  label,
  labelVisible = false,
  id,
  disabled = false,
  type = "text",
  icon,
  className,
}: InputProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const inputClasses = [baseClasses, icon ? "pl-8" : "", disabled ? disabledClasses : "", className]
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
        {icon && (
          <span
            className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
            aria-hidden="true"
          >
            <Icon name={icon} size="4" />
          </span>
        )}
        <input
          id={inputId}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          disabled={disabled}
          className={inputClasses}
        />
      </div>
    </div>
  );
}
