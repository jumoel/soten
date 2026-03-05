import { Suspense } from "react";
import { Link } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { noteCardAtom } from "../atoms/globals";
import { prettyDateTime } from "../atoms/store";
import type { NoteListEntry } from "../atoms/store";
import { ProseContent } from "./ProseContent";
import { t } from "../i18n";

function NoteCardContent({ path }: { path: string }) {
  const [card] = useAtom(noteCardAtom(path));
  if (!card) return null;

  return <ProseContent html={card.html} className="mt-1" />;
}

export function NoteCard({ note }: { note: NoteListEntry }) {
  return (
    <Link
      to={"/note/" + note.relativePath}
      className="block no-underline rounded border border-gray-200 border-l-[3px] border-l-gray-500 bg-white px-4 py-3 hover:border-l-gray-700"
    >
      <article>
        {note.date && (
          <p className="mb-0.5 text-xs text-gray-400 uppercase tracking-widest font-normal">
            {prettyDateTime.format(note.date)}
          </p>
        )}
        <Suspense fallback={<p className="mt-1 text-sm text-gray-400">{t("note.loading")}</p>}>
          <NoteCardContent path={note.path} />
        </Suspense>
      </article>
    </Link>
  );
}
