import { useMemo, useState, useCallback, useEffect } from "react";
import { useAtom } from "jotai";
import { loadable } from "jotai/utils";
import { Card } from "./ds/Card";
import { Text } from "./ds/Text";
import { NoteExpanded } from "./NoteExpanded";
import { noteCardAtom } from "../atoms/globals";
import { prettyDate, prettyDateTime } from "../atoms/store";
import type { NoteListEntry } from "../atoms/store";

function formatCardDate(date: Date): string {
  const isDateOnly = date.getUTCHours() === 0 && date.getUTCMinutes() === 0;
  return isDateOnly ? prettyDate.format(date) : prettyDateTime.format(date);
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

  const displayTitle = cardTitle ?? (note.date ? null : note.title);

  return (
    <li className="flex flex-col gap-1">
      <Card as="button" interactive hoverable onClick={onExpand} className="w-full text-left">
        {note.date && (
          <Text variant="meta" as="span">
            {formatCardDate(note.date)}
          </Text>
        )}
        {displayTitle && (
          <Text variant="heading" as="span" className="block mt-0.5">
            {displayTitle}
          </Text>
        )}
        <NoteCardPreview path={note.path} onTitle={handleTitle} />
      </Card>

      {expanded && <NoteExpanded path={note.path} onPin={onPin} onEdit={onEdit} />}
    </li>
  );
}
