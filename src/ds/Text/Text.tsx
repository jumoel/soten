import type { ComponentPropsWithoutRef, ElementType, ReactNode } from "react";

type TextVariant = "h1" | "h2" | "h3" | "h4" | "body" | "body-dim" | "meta" | "label";

export type TextProps<T extends ElementType = "span"> = {
  variant?: TextVariant;
  as?: T;
  className?: string;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "className" | "children">;

const variantDefaultElement: Record<TextVariant, ElementType> = {
  h1: "h1",
  h2: "h2",
  h3: "h3",
  h4: "h4",
  body: "p",
  "body-dim": "p",
  meta: "span",
  label: "span",
};

const variantClass: Record<TextVariant, string> = {
  h1: "text-2xl font-semibold leading-tight tracking-tight text-paper",
  h2: "text-xl font-semibold leading-tight tracking-tight text-paper",
  h3: "text-lg font-medium leading-tight text-paper",
  h4: "text-base font-medium leading-tight text-paper",
  body: "text-base font-normal leading-tight text-paper",
  "body-dim": "text-base font-normal leading-tight text-paper-dim",
  meta: "text-sm font-semibold uppercase tracking-widest leading-none text-paper-dim",
  label: "text-base font-medium leading-tight text-paper",
};

export function Text<T extends ElementType = "span">({
  variant = "body",
  as,
  className,
  children,
  ...rest
}: TextProps<T>) {
  const Tag = (as ?? variantDefaultElement[variant]) as ElementType;
  const classes = [variantClass[variant], className].filter(Boolean).join(" ");

  return (
    <Tag className={classes} {...rest}>
      {children}
    </Tag>
  );
}
