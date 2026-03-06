import { t } from "../i18n";
import { AlertBox } from "./AlertBox";
import { GitHubAuthButton } from "./GitHubAuthButton";
import { Text } from "./ds/Text";

export function UnauthenticatedView({ authError }: { authError: string | null }) {
  return (
    <div className="text-center">
      <Text variant="title">soten</Text>
      <h2>{t("app.tagline")}</h2>
      {authError && (
        <AlertBox>
          <Text variant="error">{t("auth.loginFailed")}</Text>
          <Text variant="errorDetail" className="mt-2">
            {authError}
          </Text>
        </AlertBox>
      )}
      <GitHubAuthButton />
    </div>
  );
}
