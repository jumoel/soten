import { t } from "../i18n";
import { AlertBox } from "./AlertBox";
import { Button } from "./Button";
import { Text } from "./ds/Text";
import { Box } from "./ds/Box";

export function AuthError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <AlertBox>
      <Text variant="error">{message}</Text>
      {onRetry && (
        <Box mt="3">
          <Button size="sm" onClick={onRetry}>
            {t("auth.tryAgain")}
          </Button>
        </Box>
      )}
    </AlertBox>
  );
}
