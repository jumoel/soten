import { Suspense } from "react";
import { Link } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { noteCardAtom } from "../atoms/globals";
import type { NoteListEntry } from "../atoms/store";
import { ProseContent } from "./ProseContent";
import { t } from "../i18n";

const cardDateFormat = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

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
        <header>
          {note.date && (
            <p className="mb-0.5 text-xs text-gray-400 uppercase tracking-widest font-normal">
              {cardDateFormat.format(note.date)}
            </p>
          )}
          <h2 className="text-base font-semibold leading-tight m-0 text-gray-900">{note.title}</h2>
        </header>
        <Suspense fallback={<p className="mt-1 text-sm text-gray-400">{t("note.loading")}</p>}>
          <NoteCardContent path={note.path} />
        </Suspense>
      </article>
    </Link>
  );
}
