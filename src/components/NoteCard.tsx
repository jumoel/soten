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

function NoteCardContent({ path, relativePath }: { path: string; relativePath: string }) {
  const [card] = useAtom(noteCardAtom(path));
  if (!card) return null;

  return (
    <>
      <ProseContent html={card.html} className="mt-1" />
      {!card.isShort && (
        <p className="mt-1">
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
    <article className="rounded border border-gray-200 border-l-[3px] border-l-gray-500 bg-[#fffef5] px-4 py-3">
      <header>
        {note.date && (
          <p className="mb-0.5 text-xs text-gray-400 uppercase tracking-widest font-normal">
            {cardDateFormat.format(note.date)}
          </p>
        )}
        <h2 className="text-base font-semibold leading-tight m-0">
          <Link
            to={"/note/" + note.relativePath}
            className="no-underline text-gray-900 hover:text-gray-600"
          >
            {note.title}
          </Link>
        </h2>
      </header>
      <Suspense fallback={<p className="mt-1 text-sm text-gray-400">{t("note.loading")}</p>}>
        <NoteCardContent path={note.path} relativePath={note.relativePath} />
      </Suspense>
    </article>
  );
}
