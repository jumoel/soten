import { Button, Stack } from "../ds";
import { t } from "../i18n";
import { redirectToGitHubAuth } from "../lib/github";

export function GitHubAuthButton() {
  return (
    <div className="my-4">
      <Stack direction="horizontal" justify="center">
        <Button onClick={redirectToGitHubAuth} icon="github">
          {t("auth.loginWithGithub")}
        </Button>
      </Stack>
    </div>
  );
}
