import { Icon } from "../Icon/Icon";

type SpinnerSize = "sm" | "md" | "lg";

export type SpinnerProps = {
  size?: SpinnerSize;
  label?: string;
};

const sizeMap: Record<SpinnerSize, "4" | "5" | "6"> = {
  sm: "4",
  md: "5",
  lg: "6",
};

export function Spinner({ size = "md", label = "Loading" }: SpinnerProps) {
  return (
    <output className="flex items-center justify-center" aria-label={label}>
      <Icon name="spinner" size={sizeMap[size]} spin />
      <span className="sr-only">{label}</span>
    </output>
  );
}
