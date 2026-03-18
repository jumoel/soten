import type { ReactNode } from "react";
import { useId, useState } from "react";
import { Text } from "../ds";

type MetaSectionProps = {
  title: string;
  count?: number;
  defaultOpen?: boolean;
  children: ReactNode;
};

export function MetaSection({ title, count, defaultOpen = true, children }: MetaSectionProps) {
  const [open, setOpen] = useState(defaultOpen);
  const contentId = useId();

  return (
    <div className="border-t border-edge first:border-t-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-controls={contentId}
        className="flex items-center gap-1.5 w-full min-h-10 px-3 py-2 text-left hover:bg-surface-2 transition-colors focus-visible:outline-2 focus-visible:outline-offset-[-2px] focus-visible:outline-accent"
      >
        <span className="text-xs text-paper-dim" aria-hidden="true">
          {open ? "\u25BC" : "\u25B6"}
        </span>
        <Text variant="meta" as="span" className="text-xs">
          {title}
          {count !== undefined && ` (${count})`}
        </Text>
      </button>
      {open && <div id={contentId}>{children}</div>}
    </div>
  );
}

export function NoteMetaPanel({ children }: { children: ReactNode }) {
  return <div className="bg-surface-2 border-t border-edge overflow-hidden">{children}</div>;
}
