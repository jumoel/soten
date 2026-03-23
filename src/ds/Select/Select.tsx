import { useId } from "react";
import { Icon } from "../Icon/Icon";

export type SelectOption<T extends string = string> = {
  value: T;
  label: string;
  hidden?: boolean;
};

export type SelectProps<T extends string = string> = {
  value: T;
  onChange: (value: T) => void;
  options: SelectOption<T>[];
  label: string;
  labelVisible?: boolean;
  id?: string;
  disabled?: boolean;
  className?: string;
};

const baseClasses =
  "w-full appearance-none rounded-md border border-edge-2 bg-surface py-1.5 pl-3 pr-8 text-sm text-paper focus:outline-2 focus:outline-accent focus:border-transparent";

const disabledClasses = "text-muted pointer-events-none cursor-default";

export function Select<T extends string = string>({
  value,
  onChange,
  options,
  label,
  labelVisible = false,
  id,
  disabled = false,
  className,
}: SelectProps<T>) {
  const generatedId = useId();
  const selectId = id ?? generatedId;

  const selectClasses = [baseClasses, disabled ? disabledClasses : "", className]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex flex-col gap-1">
      <label
        htmlFor={selectId}
        className={labelVisible ? "text-sm font-medium text-paper" : "sr-only"}
      >
        {label}
      </label>
      <div className="relative">
        <select
          id={selectId}
          value={value}
          onChange={(e) => onChange(e.target.value as T)}
          disabled={disabled}
          className={selectClasses}
        >
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} hidden={opt.hidden}>
              {opt.label}
            </option>
          ))}
        </select>
        <span
          className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-muted"
          aria-hidden="true"
        >
          <Icon name="chevron-down" size="4" />
        </span>
      </div>
    </div>
  );
}
