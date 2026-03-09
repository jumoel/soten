import { type ReactNode } from "react";

export type TopBarProps = {
  left?: ReactNode;
  center?: ReactNode;
  right?: ReactNode;
  sticky?: boolean;
  as?: "header" | "nav" | "div";
  className?: string;
};

export function TopBar({
  left,
  center,
  right,
  sticky = false,
  as: Tag = "header",
  className,
}: TopBarProps) {
  const classes = [
    "grid grid-cols-[1fr_auto_1fr] items-center gap-2 px-3 py-1.5 border-b border-edge bg-surface",
    sticky ? "sticky top-0 z-10" : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag className={classes}>
      <div className="flex items-center gap-2">{left}</div>
      <div className="flex items-center justify-center gap-2">{center}</div>
      <div className="flex items-center gap-2 justify-end">{right}</div>
    </Tag>
  );
}
