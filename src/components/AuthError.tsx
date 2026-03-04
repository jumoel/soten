import { t } from "../i18n";
import { AlertBox } from "./AlertBox";
import { Button } from "./Button";

export function AuthError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <AlertBox>
      <p className="text-red-800">{message}</p>
      {onRetry && (
        <Button className="mt-3 text-sm" onClick={onRetry}>
          {t("auth.tryAgain")}
        </Button>
      )}
    </AlertBox>
  );
}
