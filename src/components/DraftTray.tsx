import { useAtomValue } from "jotai";
import { useNavigate } from "@tanstack/react-router";
import { Button, Box, Link, Text } from "../design";
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
      <Text variant="meta" as="span">
        ✏
      </Text>
      <Link variant="muted" onClick={onRestore}>
        {title}
      </Link>
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
    <Box surface="surface" border="edge">
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
    </Box>
  );
}
