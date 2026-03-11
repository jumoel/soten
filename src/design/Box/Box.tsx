import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type BoxSurface = "none" | "base" | "surface" | "surface-2";
type BoxBorder = "none" | "edge" | "edge-2";
type BoxPadding = "none" | "compact" | "card" | "page";

export type BoxProps<T extends ElementType = "div"> = {
  as?: T;
  surface?: BoxSurface;
  border?: BoxBorder;
  padding?: BoxPadding;
  rounded?: boolean;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "className" | "children">;

const surfaceClass: Record<BoxSurface, string> = {
  none: "",
  base: "bg-base",
  surface: "bg-surface",
  "surface-2": "bg-surface-2",
};

const borderClass: Record<BoxBorder, string> = {
  none: "",
  edge: "border border-edge",
  "edge-2": "border border-edge-2",
};

const paddingClass: Record<BoxPadding, string> = {
  none: "",
  compact: "px-2 py-1.5",
  card: "px-3 py-2",
  page: "px-4 sm:px-6",
};

export function Box<T extends ElementType = "div">({
  as,
  surface = "none",
  border = "none",
  padding = "none",
  rounded = false,
  children,
  ...rest
}: BoxProps<T>) {
  const Tag = (as ?? "div") as ElementType;
  const classes = [
    surfaceClass[surface],
    borderClass[border],
    paddingClass[padding],
    rounded ? "rounded-md" : "",
    as === "button" ? "text-left w-full" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag className={classes || undefined} {...rest}>
      {children}
    </Tag>
  );
}
