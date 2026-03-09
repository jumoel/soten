import { useId } from "react";

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

  return (
    <div className={["relative flex flex-col gap-1", className ?? ""].filter(Boolean).join(" ")}>
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
          <svg
            width="14"
            height="14"
            viewBox="0 0 14 14"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.5" />
            <path
              d="M9.5 9.5L12.5 12.5"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </span>
        <input
          id={inputId}
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full rounded-md border border-edge-2 bg-surface py-1.5 pl-8 pr-8 text-sm text-paper placeholder:text-muted focus:border-transparent focus:outline-2 focus:outline-accent"
        />
        {value.length > 0 && (
          <button
            type="button"
            onClick={() => onChange("")}
            aria-label="Clear search"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded p-1 text-muted hover:bg-surface-2 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            <svg
              width="12"
              height="12"
              viewBox="0 0 12 12"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              aria-hidden="true"
            >
              <path
                d="M2 2L10 10M10 2L2 10"
                stroke="currentColor"
                strokeWidth="1.5"
                strokeLinecap="round"
              />
            </svg>
          </button>
        )}
      </div>
    </div>
  );
}
