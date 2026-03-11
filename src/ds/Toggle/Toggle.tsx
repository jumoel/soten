import { useId } from "react";

export type ToggleProps = {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  labelVisible?: boolean;
  id?: string;
  disabled?: boolean;
};

const trackBase =
  "relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition-colors duration-150 ease-in-out focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

const trackOff = "bg-surface-2 border border-edge";
const trackOn = "bg-accent";

const thumbBase =
  "pointer-events-none absolute left-0.5 h-4 w-4 rounded-full bg-white shadow-sm transition-transform duration-150 ease-in-out";

const disabledClasses = "opacity-50 pointer-events-none cursor-default";

export function Toggle({
  checked,
  onChange,
  label,
  labelVisible = false,
  id,
  disabled = false,
}: ToggleProps) {
  const generatedId = useId();
  const toggleId = id ?? generatedId;

  const trackClasses = [trackBase, checked ? trackOn : trackOff, disabled ? disabledClasses : ""]
    .filter(Boolean)
    .join(" ");

  const thumbClasses = [thumbBase, checked ? "translate-x-4" : "translate-x-0"]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="flex items-center gap-2">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        id={toggleId}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={trackClasses}
      >
        <span className={thumbClasses} />
      </button>
      <label htmlFor={toggleId} className={labelVisible ? "text-sm text-paper" : "sr-only"}>
        {label}
      </label>
    </div>
  );
}
