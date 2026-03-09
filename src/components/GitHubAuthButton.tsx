import { redirectToGitHubAuth } from "../lib/github";
import { t } from "../i18n";
import { Button, Stack } from "../design";

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
