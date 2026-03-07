import { useState, useEffect } from "react";
import { useAtom, useAtomValue } from "jotai";
import { pageSizeAtom, searchQueryAtom, searchResultsAtom } from "../atoms/globals";
import { NoteCard } from "../components/NoteCard";
import { Button } from "../components/Button";
import { Stack } from "../components/ds/Stack";
import { Text } from "../components/ds/Text";
import { Inline } from "../components/ds/Inline";
import { Box } from "../components/ds/Box";
import { t } from "../i18n";

export function FrontPage() {
  const notes = useAtomValue(searchResultsAtom);
  const query = useAtomValue(searchQueryAtom);
  const [pageSize] = useAtom(pageSizeAtom);
  const [page, setPage] = useState(0);
  const isSearching = query.trim().length > 0;

  useEffect(() => {
    setPage(0);
  }, [query]);

  const totalPages = Math.max(1, Math.ceil(notes.length / pageSize));
  const safePage = Math.min(page, totalPages - 1);
  const pageNotes = notes.slice(safePage * pageSize, (safePage + 1) * pageSize);

  return (
    <Stack>
      {isSearching && (
        <Text variant="secondary">{t("search.resultCount", { count: notes.length })}</Text>
      )}
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
