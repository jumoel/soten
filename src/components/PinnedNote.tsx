import { useAtom } from "jotai";
import { loadable } from "jotai/utils";
import { useMemo } from "react";
import { renderedNoteAtom } from "../atoms/globals";
import type { NoteListEntry } from "../atoms/store";
import { Button, Link, MarkdownCard, Stack, Text } from "../design";

type PinnedNoteProps = {
  note: NoteListEntry;
  expanded: boolean;
  onToggle: () => void;
  onUnpin: () => void;
  onEdit?: () => void;
};

export function PinnedNote({ note, expanded, onToggle, onUnpin, onEdit }: PinnedNoteProps) {
  const noteAtom = useMemo(() => loadable(renderedNoteAtom(note.path)), [note.path]);
  const [result] = useAtom(noteAtom);

  const html = result.state === "hasData" && result.data ? result.data.html : "";

  return (
    <li className="border-b border-edge">
      <Stack direction="horizontal" gap={2} as="div">
        <div className="px-4 py-2 flex items-center gap-2 flex-1 min-w-0">
          <Text variant="meta" as="span">
            📌
          </Text>
          <Link variant="muted" onClick={onToggle}>
            {note.title}
          </Link>
        </div>
        <div className="flex items-center gap-1 pr-2">
          <Button variant="ghost" size="sm" onClick={onToggle} aria-label="Toggle expand">
            {expanded ? "▾" : "▸"}
          </Button>
          {onEdit && (
            <Button variant="ghost" size="sm" onClick={onEdit} aria-label="Edit">
              ✏
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={onUnpin} aria-label="Unpin">
            ×
          </Button>
        </div>
      </Stack>
      {expanded && html && (
        <div className="px-4 pb-3">
          <MarkdownCard html={html} collapsed={false} fullWidth />
        </div>
      )}
    </li>
  );
}
