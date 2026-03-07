import { useAtom } from "jotai";
import { loadable } from "jotai/utils";
import { noteCardAtom } from "../atoms/globals";
import { prettyDateTime } from "../atoms/store";
import type { NoteListEntry } from "../atoms/store";
import { ProseContent } from "./ProseContent";
import { Card } from "./ds/Card";
import { Text } from "./ds/Text";
import { Box } from "./ds/Box";
import { NavLink } from "./ds/NavLink";
import { useMemo } from "react";

function NoteCardContent({ path }: { path: string }) {
  const loadableAtom = useMemo(() => loadable(noteCardAtom(path)), [path]);
  const [result] = useAtom(loadableAtom);
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
