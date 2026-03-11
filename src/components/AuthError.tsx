import { Alert, Button } from "../design";
import { t } from "../i18n";

export function AuthError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <Alert variant="error">
      {message}
      {onRetry && (
        <div className="mt-3">
          <Button size="sm" onClick={onRetry}>
            {t("auth.tryAgain")}
          </Button>
        </div>
      )}
    </Alert>
  );
}
