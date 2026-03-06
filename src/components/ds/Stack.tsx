import type { ReactNode } from "react";

export function Stack({
  gap = "3",
  className,
  children,
}: {
  gap?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={[`flex flex-col gap-${gap}`, className].filter(Boolean).join(" ")}>
      {children}
    </div>
  );
}
