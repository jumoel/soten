import { useId } from "react";
import { Icon } from "../Icon/Icon";

export type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
  labelVisible?: boolean;
  id?: string;
  className?: string;
};

export function SearchField({
  value,
  onChange,
  placeholder,
  label,
  labelVisible = false,
  id,
  className,
}: SearchFieldProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const inputClasses = [
    "w-full rounded-md border border-edge-2 bg-surface py-1.5 pl-8 pr-8 text-sm text-paper placeholder:text-muted focus:border-transparent focus:outline-2 focus:outline-accent",
    className,
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="relative flex flex-col gap-1">
      <label
        htmlFor={inputId}
        className={labelVisible ? "text-sm font-medium text-paper" : "sr-only"}
      >
        {label}
      </label>
      <div className="relative">
        <span
          className="pointer-events-none absolute left-2.5 top-1/2 -translate-y-1/2 text-muted"
          aria-hidden="true"
        >
          <Icon name="search" size="4" />
        </span>
        <input
          id={inputId}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClasses}
        />
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Clear search"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Icon name="close" size="4" />
          </button>
        )}
      </div>
    </div>
  );
}
