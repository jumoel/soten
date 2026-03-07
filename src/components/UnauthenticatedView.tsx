import { t } from "../i18n";
import { AlertBox } from "./AlertBox";
import { GitHubAuthButton } from "./GitHubAuthButton";
import { Text } from "./ds/Text";
import { Box } from "./ds/Box";
import { Center } from "./ds/Center";

export function UnauthenticatedView({ authError }: { authError: string | null }) {
  return (
    <Center>
      <Text variant="title">soten</Text>
      <Text variant="heading">{t("app.tagline")}</Text>
      {authError && (
        <AlertBox>
          <Text variant="error">{t("auth.loginFailed")}</Text>
          <Box mt="2">
            <Text variant="errorDetail">{authError}</Text>
          </Box>
        </AlertBox>
      )}
      <GitHubAuthButton />
    </Center>
  );
}
