import { Suspense } from "react";
import { Link } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { noteCardAtom } from "../atoms/globals";
import { prettyDateTime } from "../atoms/store";
import type { NoteListEntry } from "../atoms/store";
import { ProseContent } from "./ProseContent";
import { NoteCardSkeleton } from "./NoteCardSkeleton";
import { Card } from "./ds/Card";
import { Text } from "./ds/Text";

function NoteCardContent({ path }: { path: string }) {
  const [card] = useAtom(noteCardAtom(path));
  if (!card) return null;

  return <ProseContent html={card.html} className="mt-1 animate-fade-in" />;
}

export function NoteCard({ note }: { note: NoteListEntry }) {
  return (
    <Link to={"/note/" + note.relativePath} className="block no-underline">
      <Card className="hover:border-l-gray-600">
        <article>
          {note.date && (
            <Text variant="meta" className="mb-0.5">
              {prettyDateTime.format(note.date)}
            </Text>
          )}
          <Suspense fallback={<NoteCardSkeleton />}>
            <NoteCardContent path={note.path} />
          </Suspense>
        </article>
      </Card>
    </Link>
  );
}
