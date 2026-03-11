import type { ReactNode } from "react";
import { Icon } from "../Icon/Icon";

type LinkVariant = "default" | "muted" | "nav";

export type LinkProps = {
  href?: string;
  variant?: LinkVariant;
  external?: boolean;
  children: ReactNode;
  onClick?: () => void;
};

const variantClasses: Record<LinkVariant, string> = {
  default: "text-accent hover:underline",
  muted: "text-paper-dim hover:underline",
  nav: "text-paper font-medium no-underline hover:underline",
};

const focusClasses =
  "focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent";

function isExternal(href: string) {
  return href.startsWith("http://") || href.startsWith("https://");
}

export function Link({ href, variant = "default", external, children, onClick }: LinkProps) {
  const classes = [variantClasses[variant], focusClasses].filter(Boolean).join(" ");

  if (!href) {
    return (
      <button type="button" className={classes} onClick={onClick}>
        {children}
      </button>
    );
  }

  const isExt = external ?? isExternal(href);

  if (isExt) {
    return (
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={classes}
        onClick={onClick}
      >
        {children}
        <Icon name="external-link" size="4" />
      </a>
    );
  }

  return (
    <a href={href} className={classes} onClick={onClick}>
      {children}
    </a>
  );
}
