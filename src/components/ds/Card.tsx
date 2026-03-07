import type { ElementType, ComponentPropsWithoutRef, ReactNode } from "react";

const base = "rounded border border-gray-200 border-l-[3px]";
const variants = {
  default: `${base} border-l-gray-400 bg-white px-4 py-3`,
  muted: `${base} border-l-gray-400 bg-gray-50 px-3 py-2`,
};

type CardProps<T extends ElementType> = {
  muted?: boolean;
  hoverable?: boolean;
  interactive?: boolean;
  as?: T;
  children: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "muted" | "hoverable" | "interactive" | "as" | "children">;

export function Card<T extends ElementType = "div">({
  muted,
  hoverable,
  interactive,
  as,
  children,
  ...rest
}: CardProps<T>) {
  const Tag = (as ?? "div") as ElementType;
  const style = muted ? variants.muted : variants.default;
  const classes = [
    style,
    hoverable && "hover:border-l-gray-600",
    interactive && "w-full text-left hover:bg-gray-100",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}
