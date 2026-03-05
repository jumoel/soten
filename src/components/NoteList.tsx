import { Link } from "@tanstack/react-router";
import type { NoteListEntry } from "../atoms/store";

export function NoteList({ notes }: { notes: NoteListEntry[] }) {
  return (
    <ul className="list-none p-0 m-0 divide-y divide-gray-200">
      {notes.map((note) => (
        <li key={note.path}>
          <Link
            to={"/note/" + note.relativePath}
            className="block py-2.5 no-underline text-gray-900 hover:underline"
          >
            {note.title}
          </Link>
        </li>
      ))}
    </ul>
  );
}
