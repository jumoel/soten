import { useMemo, useState, useCallback, useEffect } from "react";
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

function NoteCardPreview({ path, onTitle }: { path: string; onTitle: (t: string | null) => void }) {
  const cardAtom = useMemo(() => loadable(noteCardAtom(path)), [path]);
  const [result] = useAtom(cardAtom);

  useEffect(() => {
    if (result.state === "hasData" && result.data) {
      onTitle(result.data.derivedTitle);
    }
  }, [result, onTitle]);

  if (result.state !== "hasData" || !result.data) return null;
  return (
    <div
      className="prose prose-sm dark:prose-invert mt-1 line-clamp-5 [&_*]:!m-0 [&_*]:!p-0 [&_h1]:!text-sm [&_h1]:!font-semibold [&_h2]:!text-sm [&_h2]:!font-medium [&_h3]:!text-sm [&_h3]:!font-medium"
      dangerouslySetInnerHTML={{ __html: result.data.html }}
    />
  );
}

export function NoteRow({ note, expanded, onExpand, onPin, onEdit }: NoteRowProps) {
  const [cardTitle, setCardTitle] = useState<string | null>(null);
  const handleTitle = useCallback((t: string | null) => setCardTitle(t), []);

  return (
    <li className="flex flex-col gap-1">
      <Card as="button" interactive hoverable onClick={onExpand} className="w-full text-left">
        <div className="flex items-baseline gap-3">
          <Text variant="meta" as="span" className="shrink-0 whitespace-nowrap">
            {note.date ? formatDate(note.date) : ""}
          </Text>
          <Text variant="body" as="span" className="truncate font-medium">
            {cardTitle ?? note.title}
          </Text>
        </div>
        <NoteCardPreview path={note.path} onTitle={handleTitle} />
      </Card>

      {expanded && <NoteExpanded path={note.path} onPin={onPin} onEdit={onEdit} />}
    </li>
  );
}
