import { Suspense } from "react";
import { Link } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { noteCardAtom } from "../atoms/globals";
import type { NoteListEntry } from "../atoms/store";
import { t } from "../i18n";

const cardDateFormat = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

function NoteCardContent({ path, relativePath }: { path: string; relativePath: string }) {
  const [card] = useAtom(noteCardAtom(path));
  if (!card) return null;

  return (
    <>
      <div
        className="prose prose-sm prose-gray mt-3"
        dangerouslySetInnerHTML={{ __html: card.html }}
      />
      {!card.isShort && (
        <p className="mt-3">
          <Link
            to={"/note/" + relativePath}
            className="text-sm text-gray-500 no-underline hover:text-gray-900"
          >
            {t("note.continueReading")}
          </Link>
        </p>
      )}
    </>
  );
}

export function NoteCard({ note }: { note: NoteListEntry }) {
  return (
    <article className="py-10 border-b border-gray-200 last:border-0">
      <header>
        <h2 className="text-lg font-normal leading-snug m-0">
          <Link
            to={"/note/" + note.relativePath}
            className="no-underline text-gray-900 hover:underline"
          >
            {note.title}
          </Link>
        </h2>
        {note.date && (
          <p className="mt-1 text-xs text-gray-400 uppercase tracking-widest font-normal">
            {cardDateFormat.format(note.date)}
          </p>
        )}
      </header>
      <Suspense>
        <NoteCardContent path={note.path} relativePath={note.relativePath} />
      </Suspense>
    </article>
  );
}
