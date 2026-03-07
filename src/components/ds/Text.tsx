import type { ElementType, ComponentPropsWithoutRef, ReactNode } from "react";

const variantConfig = {
  body: { tag: "p", style: "text-sm text-gray-700" },
  secondary: { tag: "p", style: "text-sm text-gray-500" },
  meta: { tag: "span", style: "text-xs text-gray-400 uppercase tracking-widest" },
  mono: { tag: "code", style: "font-mono text-sm text-gray-500" },
  monoStrong: { tag: "code", style: "font-mono text-sm text-gray-800" },
  label: { tag: "label", style: "block text-sm font-semibold text-gray-700" },
  sectionLabel: { tag: "h3", style: "text-xs font-semibold uppercase tracking-wide text-gray-500" },
  error: { tag: "p", style: "text-red-700 font-medium" },
  errorDetail: { tag: "pre", style: "text-sm text-red-600 whitespace-pre-wrap" },
  title: { tag: "h1", style: "text-2xl font-semibold text-gray-800" },
  heading: { tag: "h2", style: "text-lg font-medium tracking-tight text-gray-800" },
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
