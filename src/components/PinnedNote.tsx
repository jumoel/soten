import { Button, Text, Link, Stack } from "../design";
import { NoteFullContent } from "./NoteFullContent";
import type { NoteListEntry } from "../atoms/store";

type PinnedNoteProps = {
  note: NoteListEntry;
  expanded: boolean;
  onToggle: () => void;
  onUnpin: () => void;
  onEdit?: () => void;
};

export function PinnedNote({ note, expanded, onToggle, onUnpin, onEdit }: PinnedNoteProps) {
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
          <Button variant="ghost" size="sm" onClick={onUnpin} aria-label="Unpin">
            ×
          </Button>
        </div>
      </Stack>
      {expanded && <NoteFullContent path={note.path} onPin={() => {}} onEdit={onEdit} />}
    </li>
  );
}
