import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type StackGap = 1 | 2 | 3 | 4 | 6;
type StackAlign = "start" | "center" | "end" | "stretch";
type StackJustify = "start" | "center" | "end" | "between";
type StackDirection = "vertical" | "horizontal";

export type StackProps<T extends ElementType = "div"> = {
  as?: T;
  gap?: StackGap;
  align?: StackAlign;
  justify?: StackJustify;
  direction?: StackDirection;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "className" | "children">;

const gapClass: Record<StackGap, string> = {
  1: "gap-1",
  2: "gap-2",
  3: "gap-3",
  4: "gap-4",
  6: "gap-6",
};

const alignClass: Record<StackAlign, string> = {
  start: "items-start",
  center: "items-center",
  end: "items-end",
  stretch: "items-stretch",
};

const justifyClass: Record<StackJustify, string> = {
  start: "justify-start",
  center: "justify-center",
  end: "justify-end",
  between: "justify-between",
};

export function Stack<T extends ElementType = "div">({
  as,
  gap = 2,
  align = "stretch",
  justify = "start",
  direction = "vertical",
  children,
  ...rest
}: StackProps<T>) {
  const Tag = (as ?? "div") as ElementType;
  const classes = [
    direction === "horizontal" ? "flex flex-row items-center" : "flex flex-col",
    gapClass[gap],
    direction === "vertical" ? alignClass[align] : "",
    justifyClass[justify],
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}
