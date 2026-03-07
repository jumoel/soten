import { Suspense } from "react";
import { useAtom } from "jotai";
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
  const [card] = useAtom(noteCardAtom(path));
  if (!card) return null;

  return (
    <Box mt="1">
      <ProseContent html={card.html} animate />
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
          <Suspense fallback={<NoteCardSkeleton />}>
            <NoteCardContent path={note.path} />
          </Suspense>
        </article>
      </Card>
    </NavLink>
  );
}
