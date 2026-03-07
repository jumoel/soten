import type { ReactNode } from "react";

const sizeMap = {
  "5": "h-5 w-5",
  "6": "h-6 w-6",
} as const;

export function Icon({
  size = "5",
  spin,
  children,
}: {
  size?: keyof typeof sizeMap;
  spin?: boolean;
  children: ReactNode;
}) {
  return (
    <span
      className={[sizeMap[size], spin && "animate-spin"].filter(Boolean).join(" ")}
      style={
        spin ? { animationDuration: "0.8s", display: "inline-flex" } : { display: "inline-flex" }
      }
    >
      {children}
    </span>
  );
}
