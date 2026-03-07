import type { NoteListEntry } from "../atoms/store";
import { DividedList } from "./ds/DividedList";
import { NavLink } from "./ds/NavLink";

export function NoteList({ notes }: { notes: NoteListEntry[] }) {
  return (
    <DividedList>
      {notes.map((note) => (
        <li key={note.path}>
          <NavLink to={"/note/" + note.relativePath} variant="listItem">
            {note.title}
          </NavLink>
        </li>
      ))}
    </DividedList>
  );
}
