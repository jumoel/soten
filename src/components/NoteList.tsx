import { Link } from "@tanstack/react-router";
import type { NoteListEntry } from "../atoms/store";
import { DividedList } from "./ds/DividedList";

export function NoteList({ notes }: { notes: NoteListEntry[] }) {
  return (
    <DividedList>
      {notes.map((note) => (
        <li key={note.path}>
          <Link
            to={"/note/" + note.relativePath}
            className="block py-2.5 no-underline text-gray-800 hover:underline"
          >
            {note.title}
          </Link>
        </li>
      ))}
    </DividedList>
  );
}
