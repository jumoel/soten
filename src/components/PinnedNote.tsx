import { Button } from "./Button";
import { Text } from "./ds/Text";
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
      <div className="flex items-center px-4 py-2 gap-2">
        <Text variant="meta" as="span">
          📌
        </Text>
        <button
          className="flex-1 text-left text-sm font-medium text-paper truncate"
          onClick={onToggle}
        >
          {note.title}
        </button>
        <Button variant="ghost" size="sm" onClick={onToggle} aria-label="Toggle expand">
          {expanded ? "▾" : "▸"}
        </Button>
        <Button variant="ghost" size="sm" onClick={onUnpin} aria-label="Unpin">
          ×
        </Button>
      </div>
      {expanded && <NoteFullContent path={note.path} onPin={() => {}} onEdit={onEdit} />}
    </li>
  );
}
