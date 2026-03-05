import { useAtom } from "jotai";
import { noteListAtom } from "../atoms/globals";
import { NoteList } from "../components/NoteList";

export function FrontPage() {
  const [notes] = useAtom(noteListAtom);

  return <NoteList notes={notes} />;
}
