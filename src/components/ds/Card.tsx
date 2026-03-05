import type { ReactNode } from "react";

const base = "rounded border border-gray-200 border-l-[3px]";
const variants = {
  default: `${base} border-l-gray-400 bg-white px-4 py-3`,
  muted: `${base} border-l-gray-400 bg-gray-50 px-3 py-2`,
};

export function Card({
  muted,
  className,
  children,
}: {
  muted?: boolean;
  className?: string;
  children: ReactNode;
}) {
  const style = muted ? variants.muted : variants.default;
  return <div className={[style, className].filter(Boolean).join(" ")}>{children}</div>;
}
