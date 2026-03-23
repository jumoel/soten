import type { ReactNode } from "react";

type CardVariant = "default" | "interactive";

export type CardProps = {
  variant?: CardVariant;
  header?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  onClick?: (e: React.MouseEvent<HTMLButtonElement>) => void;
  className?: string;
};

const baseClasses = "bg-surface border border-edge rounded-md";
const interactiveClasses = "hover:bg-surface-2 cursor-pointer transition-colors duration-150";

export function Card({
  variant = "default",
  header,
  footer,
  children,
  onClick,
  className,
}: CardProps) {
  const isInteractive = variant === "interactive" || !!onClick;
  const classes = [baseClasses, isInteractive ? interactiveClasses : "", className]
    .filter(Boolean)
    .join(" ");

  const content = (
    <>
      {header && <div className="px-4 py-3 border-b border-edge">{header}</div>}
      <div className="px-4 py-3">{children}</div>
      {footer && <div className="px-4 py-3 border-t border-edge">{footer}</div>}
    </>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={["text-left w-full", classes].join(" ")}>
        {content}
      </button>
    );
  }

  return <div className={classes}>{content}</div>;
}
