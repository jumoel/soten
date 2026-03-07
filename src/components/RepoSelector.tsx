import { send } from "../atoms/globals";
import { Card } from "./ds/Card";
import { Stack } from "./ds/Stack";
import { Text } from "./ds/Text";
import { Box } from "./ds/Box";
import { ExternalLink } from "./ds/ExternalLink";
import { t } from "../i18n";

export function RepoSelector({
  repos,
  onSelect,
}: {
  repos: string[];
  onSelect?: (owner: string, repo: string) => void;
}) {
  return (
    <Box my="4">
      <Box mb="2">
        <Text variant="sectionLabel">{t("repo.selectRepository")}</Text>
      </Box>
      <Stack gap="1.5">
        {repos.map((fullName) => {
          const [owner, repo] = fullName.split("/");
          return (
            <Card
              key={fullName}
              muted
              interactive
              as="button"
              onClick={() =>
                onSelect ? onSelect(owner, repo) : send({ type: "SELECT_REPO", owner, repo })
              }
            >
              <Text variant="monoStrong">{fullName}</Text>
            </Card>
          );
        })}
      </Stack>
      <Box mt="4">
        <Text variant="secondary">
          <ExternalLink href="https://github.com/apps/soten-notes/installations/select_target">
            {t("repo.manageAccess")}
          </ExternalLink>
        </Text>
      </Box>
    </Box>
  );
}
