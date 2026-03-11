import { useState } from "react";
import type { NoteListEntry } from "../atoms/store";
import { PinnedNote } from "./PinnedNote";

type PinnedZoneProps = {
  notes: NoteListEntry[];
  onUnpin: (path: string) => void;
  onEdit?: (path: string) => void;
};

export function PinnedZone({ notes, onUnpin, onEdit }: PinnedZoneProps) {
  const [expandedPath, setExpandedPath] = useState<string | null>(null);

  return (
    <ul className="list-none p-0 m-0">
      {notes.map((note) => (
        <PinnedNote
          key={note.path}
          note={note}
          expanded={expandedPath === note.path}
          onToggle={() => setExpandedPath(expandedPath === note.path ? null : note.path)}
          onUnpin={() => onUnpin(note.path)}
          onEdit={onEdit ? () => onEdit(note.path) : undefined}
        />
      ))}
    </ul>
  );
}
