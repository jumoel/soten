import { useMemo } from "react";
import { useAtom } from "jotai";
import { loadable } from "jotai/utils";
import { Card } from "./ds/Card";
import { Text } from "./ds/Text";
import { NoteExpanded } from "./NoteExpanded";
import { noteCardAtom } from "../atoms/globals";
import type { NoteListEntry } from "../atoms/store";

const compactDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const compactDateWithYear = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function formatDate(date: Date | null): string {
  if (!date) return "";
  const now = new Date();
  return date.getUTCFullYear() === now.getUTCFullYear()
    ? compactDate.format(date)
    : compactDateWithYear.format(date);
}

type NoteRowProps = {
  note: NoteListEntry;
  expanded: boolean;
  onExpand: () => void;
  onPin: () => void;
  onEdit?: () => void;
};

function NoteCardPreview({ path }: { path: string }) {
  const cardAtom = useMemo(() => loadable(noteCardAtom(path)), [path]);
  const [result] = useAtom(cardAtom);
  if (result.state !== "hasData" || !result.data) return null;
  return (
    <div
      className="prose prose-sm dark:prose-invert mt-1 line-clamp-5 [&_*]:!m-0 [&_*]:!p-0"
      dangerouslySetInnerHTML={{ __html: result.data.html }}
    />
  );
}

export function NoteRow({ note, expanded, onExpand, onPin, onEdit }: NoteRowProps) {
  return (
    <li className="flex flex-col gap-1">
      <Card as="button" interactive hoverable onClick={onExpand} className="w-full text-left">
        <div className="flex items-baseline gap-3">
          <Text variant="meta" as="span" className="shrink-0 whitespace-nowrap">
            {note.date ? formatDate(note.date) : ""}
          </Text>
          <Text variant="body" as="span" className="truncate font-medium">
            {note.title}
          </Text>
        </div>
        <NoteCardPreview path={note.path} />
      </Card>

      {expanded && <NoteExpanded path={note.path} onPin={onPin} onEdit={onEdit} />}
    </li>
  );
}
