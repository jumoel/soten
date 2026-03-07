import type { ReactNode } from "react";

const justifyMap = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
} as const;

const alignMap = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
} as const;

export function Inline({
  gap = "0",
  align = "center",
  justify = "start",
  children,
}: {
  gap?: string;
  align?: keyof typeof alignMap;
  justify?: keyof typeof justifyMap;
  children: ReactNode;
}) {
  const classes = ["flex", `gap-${gap}`, alignMap[align], justifyMap[justify]].join(" ");

  return <div className={classes}>{children}</div>;
}
