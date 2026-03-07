import { useState } from "react";
import { useAtom } from "jotai";
import { noteListAtom, pageSizeAtom } from "../atoms/globals";
import { NoteCard } from "../components/NoteCard";
import { Button } from "../components/Button";
import { Stack } from "../components/ds/Stack";
import { Text } from "../components/ds/Text";
import { Inline } from "../components/ds/Inline";
import { Box } from "../components/ds/Box";
import { t } from "../i18n";

export function FrontPage() {
  const [notes] = useAtom(noteListAtom);
  const [pageSize] = useAtom(pageSizeAtom);
  const [page, setPage] = useState(0);

  const totalPages = Math.max(1, Math.ceil(notes.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pageNotes = notes.slice(safePage * pageSize, (safePage + 1) * pageSize);

  return (
    <Stack>
      {pageNotes.map((note) => (
        <NoteCard key={note.path} note={note} />
      ))}
      {totalPages > 1 && (
        <Box pt="6" pb="2">
          <Inline justify="between">
            <Button
              variant="pagination"
              onClick={() => setPage((p) => p - 1)}
              disabled={safePage === 0}
            >
              {t("pagination.previous")}
            </Button>
            <Text variant="secondary" as="span">
              {t("pagination.pageOf", { page: safePage + 1, total: totalPages })}
            </Text>
            <Button
              variant="pagination"
              onClick={() => setPage((p) => p + 1)}
              disabled={safePage >= totalPages - 1}
            >
              {t("pagination.next")}
            </Button>
          </Inline>
        </Box>
      )}
    </Stack>
  );
}
