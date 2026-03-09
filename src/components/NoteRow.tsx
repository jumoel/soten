import { useMemo } from "react";
import { useAtom } from "jotai";
import { loadable } from "jotai/utils";
import { Button, MarkdownCard, Stack } from "../design";
import { renderedNoteAtom } from "../atoms/globals";
import { prettyDate, prettyDateTime } from "../atoms/store";
import type { NoteListEntry } from "../atoms/store";
import { t } from "../i18n";

function formatCardDate(date: Date): string {
  const isDateOnly = date.getUTCHours() === 0 && date.getUTCMinutes() === 0;
  return isDateOnly ? prettyDate.format(date) : prettyDateTime.format(date);
}

type NoteRowProps = {
  note: NoteListEntry;
  onPin: () => void;
  onEdit?: () => void;
};

export function NoteRow({ note, onPin, onEdit }: NoteRowProps) {
  const noteAtom = useMemo(() => loadable(renderedNoteAtom(note.path)), [note.path]);
  const [result] = useAtom(noteAtom);

  const html = result.state === "hasData" && result.data ? result.data.html : "";

  const actions = (
    <Stack direction="horizontal" gap={1}>
      <Button variant="ghost" size="sm" onClick={onPin} aria-label={t("note.pin")}>
        {t("note.pin")}
      </Button>
      {onEdit && (
        <Button variant="ghost" size="sm" onClick={onEdit} aria-label={t("note.edit")}>
          {t("note.edit")}
        </Button>
      )}
    </Stack>
  );

  return (
    <li>
      <MarkdownCard
        html={html}
        timestamp={note.date ? formatCardDate(note.date) : undefined}
        actions={actions}
        fullWidth
      />
    </li>
  );
}
