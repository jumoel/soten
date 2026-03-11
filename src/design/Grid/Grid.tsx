import type { ReactNode } from "react";

type GridCols = 1 | 2 | 3 | 4;
type GridGap = 2 | 3 | 4 | 6;

export type GridProps = {
  cols?: GridCols;
  gap?: GridGap;
  children?: ReactNode;
};

const mdColsClass: Record<GridCols, string> = {
  1: "md:grid-cols-1",
  2: "md:grid-cols-2",
  3: "md:grid-cols-3",
  4: "md:grid-cols-4",
};

const gapClass: Record<GridGap, string> = {
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  6: "gap-6",
};

export function Grid({ cols = 2, gap = 2, children }: GridProps) {
  const classes = ["grid grid-cols-1", mdColsClass[cols], gapClass[gap]].filter(Boolean).join(" ");

  return <div className={classes}>{children}</div>;
}
