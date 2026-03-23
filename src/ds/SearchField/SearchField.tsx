import { forwardRef, useId } from "react";
import { Icon } from "../Icon/Icon";

export type SearchFieldProps = {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label: string;
  clearLabel?: string;
  labelVisible?: boolean;
  id?: string;
  className?: string;
};

export const SearchField = forwardRef<HTMLInputElement, SearchFieldProps>(function SearchField(
  {
    value,
    onChange,
    placeholder,
    label,
    clearLabel = "Clear search",
    labelVisible = false,
    id,
    className,
  },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;

  const inputClasses = [
    "w-full rounded-lg border border-edge-2 bg-surface min-h-11 py-2 pl-10 pr-10 text-sm text-paper placeholder:text-muted focus:border-transparent focus:outline-2 focus:outline-accent",
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
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-paper-dim"
          aria-hidden="true"
        >
          <Icon name="search" size="5" />
        </span>
        <input
          ref={ref}
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
            aria-label={clearLabel}
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg min-h-9 min-w-9 inline-flex items-center justify-center text-paper-dim hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <Icon name="close" size="4" />
          </button>
        )}
      </div>
    </div>
  );
});
