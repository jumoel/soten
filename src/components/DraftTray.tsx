import { useAtomValue } from "jotai";
import { useNavigate } from "@tanstack/react-router";
import { Button } from "./Button";
import { draftsAtom, restoreDraft } from "../atoms/globals";
import { discardDraft } from "../lib/draft-operations";
import { t } from "../i18n";
import type { Draft } from "../atoms/drafts";

function extractDisplayTitle(content: string): string {
  const fmMatch = content.match(/^---\n[\s\S]*?title:\s*(.+)\n[\s\S]*?---/);
  if (fmMatch) return fmMatch[1].trim();
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) return headingMatch[1].trim();
  return "New note\u2026";
}

type DraftTrayEntryProps = {
  draft: Draft;
  onRestore: () => void;
  onDiscard: () => void;
};

function DraftTrayEntry({ draft, onRestore, onDiscard }: DraftTrayEntryProps) {
  const title = extractDisplayTitle(draft.content);

  return (
    <div className="flex items-center px-4 py-1.5 gap-2 text-sm">
      <span className="text-muted">✏</span>
      <button className="flex-1 text-left truncate text-paper" onClick={onRestore}>
        {title}
      </button>
      <Button variant="ghost" size="sm" onClick={onRestore} aria-label="Restore">
        ↑
      </Button>
      <Button variant="ghost" size="sm" onClick={onDiscard} aria-label="Discard">
        ×
      </Button>
    </div>
  );
}

export function DraftTray() {
  const drafts = useAtomValue(draftsAtom);
  const minimized = drafts.filter((d) => d.minimized);
  const navigate = useNavigate();

  if (minimized.length === 0) return null;

  return (
    <div className="border-t border-edge bg-surface">
      {minimized.map((draft) => (
        <DraftTrayEntry
          key={draft.timestamp}
          draft={draft}
          onRestore={() => {
            restoreDraft(draft.timestamp);
            void navigate({ to: "/", search: (prev) => ({ ...prev, draft: draft.timestamp }) });
          }}
          onDiscard={async () => {
            if (!window.confirm(t("draft.discardConfirm"))) return;
            await discardDraft(draft.timestamp, draft.isNew);
          }}
        />
      ))}
    </div>
  );
}
