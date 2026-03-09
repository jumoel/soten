import { Icon, Stack } from "../design";

export function LoadingSpinner() {
  return (
    <div className="py-12">
      <Stack direction="horizontal" justify="center">
        <Icon name="spinner" size="6" spin />
      </Stack>
    </div>
  );
}
