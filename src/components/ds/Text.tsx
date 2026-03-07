import type { ElementType, ComponentPropsWithoutRef, ReactNode } from "react";

const variantConfig = {
  body: { tag: "p", style: "text-sm text-paper-dim" },
  secondary: { tag: "p", style: "text-sm text-muted" },
  meta: { tag: "span", style: "text-xs text-muted uppercase tracking-widest" },
  mono: { tag: "code", style: "font-mono text-sm text-muted" },
  monoStrong: { tag: "code", style: "font-mono text-sm text-paper" },
  label: { tag: "label", style: "block text-sm font-semibold text-paper-dim" },
  sectionLabel: { tag: "h3", style: "text-xs font-semibold uppercase tracking-wide text-muted" },
  error: { tag: "p", style: "text-error-text font-medium" },
  errorDetail: { tag: "pre", style: "text-sm text-error-detail whitespace-pre-wrap" },
  title: { tag: "h1", style: "text-2xl font-semibold text-paper" },
  heading: { tag: "h2", style: "text-lg font-medium tracking-tight text-paper" },
} as const;

type Variant = keyof typeof variantConfig;

type TextProps<T extends ElementType> = {
  variant?: Variant;
  as?: T;
  children?: ReactNode;
} & Omit<ComponentPropsWithoutRef<T>, "variant" | "as" | "children">;

export function Text<T extends ElementType = "span">({
  variant = "body",
  as,
  children,
  ...rest
}: TextProps<T>) {
  const config = variantConfig[variant];
  const Tag = (as ?? config.tag) as ElementType;
  return (
    <Tag className={config.style} {...rest}>
      {children}
    </Tag>
  );
}
