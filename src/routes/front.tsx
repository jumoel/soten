import { useState } from "react";
import { useAtom } from "jotai";
import { noteListAtom, pageSizeAtom } from "../atoms/globals";
import { NoteCard } from "../components/NoteCard";
import { Button } from "../components/Button";
import { t } from "../i18n";

export function FrontPage() {
  const [notes] = useAtom(noteListAtom);
  const [pageSize] = useAtom(pageSizeAtom);
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(notes.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pageNotes = notes.slice(safePage * pageSize, (safePage + 1) * pageSize);

  return (
    <div>
      {pageNotes.map((note) => (
        <NoteCard key={note.path} note={note} />
      ))}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-6 pb-2">
          <Button
            variant="ghost"
            className="text-sm px-3 py-1.5 disabled:opacity-40 disabled:cursor-default"
            onClick={() => setPage((p) => p - 1)}
            disabled={safePage === 0}
          >
            {t("pagination.previous")}
          </Button>
          <span className="text-sm text-gray-500">
            {t("pagination.pageOf", { page: safePage + 1, total: totalPages })}
          </span>
          <Button
            variant="ghost"
            className="text-sm px-3 py-1.5 disabled:opacity-40 disabled:cursor-default"
            onClick={() => setPage((p) => p + 1)}
            disabled={safePage >= totalPages - 1}
          >
            {t("pagination.next")}
          </Button>
        </div>
      )}
    </div>
  );
}
