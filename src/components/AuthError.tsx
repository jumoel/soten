import { t } from "../i18n";
import { AlertBox } from "./AlertBox";
import { Button } from "./Button";
import { Text } from "./ds/Text";

export function AuthError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <AlertBox>
      <Text variant="error">{message}</Text>
      {onRetry && (
        <Button className="mt-3 text-sm" onClick={onRetry}>
          {t("auth.tryAgain")}
        </Button>
      )}
    </AlertBox>
  );
}
