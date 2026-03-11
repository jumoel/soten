import { type ReactNode, useState } from "react";

export type MarkdownCardProps = {
  html: string;
  collapsed?: boolean;
  maxCollapsedHeight?: string;
  maxExpandedHeight?: string;
  timestamp?: string;
  actions?: ReactNode;
  fullWidth?: boolean;
};

function ChevronDown() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M3 5L7 9L11 5"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ChevronUp() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 14 14"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <path
        d="M3 9L7 5L11 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function MarkdownCard({
  html,
  collapsed: initialCollapsed = true,
  maxCollapsedHeight = "8rem",
  maxExpandedHeight = "60vh",
  timestamp,
  actions,
  fullWidth = false,
}: MarkdownCardProps) {
  const [collapsed, setCollapsed] = useState(initialCollapsed);

  const cardClasses = [
    "bg-surface border border-edge rounded-md px-3 py-2 flex flex-col gap-1",
    fullWidth ? "w-full" : "",
  ]
    .filter(Boolean)
    .join(" ");

  const hasHeader = timestamp || actions;

  return (
    <div className={cardClasses}>
      {hasHeader && (
        <div className="flex min-h-7 items-center justify-between gap-2">
          {timestamp ? (
            <span className="text-xs font-semibold uppercase tracking-widest text-muted">
              {timestamp}
            </span>
          ) : (
            <span />
          )}
          {actions && <div className="flex items-center gap-1">{actions}</div>}
        </div>
      )}

      <button
        type="button"
        onClick={() => setCollapsed((c) => !c)}
        className="w-full text-left focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent rounded-sm"
      >
        <div
          style={{
            maxHeight: collapsed ? maxCollapsedHeight : maxExpandedHeight,
            overflow: collapsed ? "hidden" : "auto",
          }}
        >
          <div className="prose max-w-none" dangerouslySetInnerHTML={{ __html: html }} />
        </div>
        {collapsed && (
          <div
            className="h-6 -mt-6 relative pointer-events-none"
            style={{ background: "linear-gradient(to top, var(--color-surface), transparent)" }}
            aria-hidden="true"
          />
        )}
        <div className="flex items-center justify-center gap-1 py-1 text-xs text-muted">
          {collapsed ? <ChevronDown /> : <ChevronUp />}
        </div>
      </button>
    </div>
  );
}
