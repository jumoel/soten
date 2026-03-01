import { useAtom } from "jotai";
import { Link } from "@tanstack/react-router";
import { noteListAtom } from "../atoms/globals";

export function FrontPage() {
  const [notes] = useAtom(noteListAtom);

  return (
    <ul>
      {notes.map((note) => (
        <li key={note.path}>
          <Link to={"/note/" + note.relativePath}>{note.title}</Link>
        </li>
      ))}
    </ul>
  );
}
