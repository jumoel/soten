import { useMemo, useState, useEffect } from "react";
import { useAtom } from "jotai";
import { loadable } from "jotai/utils";
import { noteCardAtom } from "../atoms/globals";
import { prettyDateTime } from "../atoms/store";
import type { NoteListEntry } from "../atoms/store";
import { ProseContent } from "./ProseContent";
import { NoteCardSkeleton } from "./NoteCardSkeleton";
import { Card } from "./ds/Card";
import { Text } from "./ds/Text";
import { Box } from "./ds/Box";
import { NavLink } from "./ds/NavLink";

function NoteCardContent({ path }: { path: string }) {
  const loadableAtom = useMemo(() => loadable(noteCardAtom(path)), [path]);
  const [result] = useAtom(loadableAtom);
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    if (result.state !== "loading") return;
    const id = setTimeout(() => setShowSkeleton(true), 150);
    return () => clearTimeout(id);
  }, [result.state]);

  if (result.state === "loading") return showSkeleton ? <NoteCardSkeleton /> : null;
  if (result.state !== "hasData" || !result.data) return null;

  return (
    <Box mt="1">
      <ProseContent html={result.data.html} animate />
    </Box>
  );
}

export function NoteCard({ note }: { note: NoteListEntry }) {
  return (
    <NavLink to={"/note/" + note.relativePath} variant="card">
      <Card hoverable>
        <article>
          {note.date && (
            <Box mb="0.5">
              <Text variant="meta">{prettyDateTime.format(note.date)}</Text>
            </Box>
          )}
          <NoteCardContent path={note.path} />
        </article>
      </Card>
    </NavLink>
  );
}
