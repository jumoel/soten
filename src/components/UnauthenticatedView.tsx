import { t } from "../i18n";
import { Alert, Text, Stack } from "../design";
import { GitHubAuthButton } from "./GitHubAuthButton";

export function UnauthenticatedView({ authError }: { authError: string | null }) {
  return (
    <div className="flex flex-col items-center justify-center h-full p-8">
      <Stack gap={3} align="center">
        <Text variant="h1" as="h1">
          soten
        </Text>
        <Text variant="h3" as="p">
          {t("app.tagline")}
        </Text>
        {authError && (
          <Alert variant="error" title={t("auth.loginFailed")}>
            {authError}
          </Alert>
        )}
        <GitHubAuthButton />
      </Stack>
    </div>
  );
}
