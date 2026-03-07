import { Box } from "./ds/Box";
import { Stack } from "./ds/Stack";
import { Skeleton } from "./ds/Skeleton";

export function NoteCardSkeleton() {
  return (
    <Box mt="1">
      <Stack gap="2">
        <Skeleton width="3/4" />
        <Skeleton />
        <Skeleton width="5/6" />
      </Stack>
    </Box>
  );
}
