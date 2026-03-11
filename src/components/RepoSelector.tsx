import { send } from "../atoms/globals";
import { Box, Link, Stack, Text } from "../ds";
import { t } from "../i18n";

export function RepoSelector({
  repos,
  onSelect,
}: {
  repos: string[];
  onSelect?: (owner: string, repo: string) => void;
}) {
  return (
    <div className="my-4">
      <div className="mb-2">
        <Text variant="meta">{t("repo.selectRepository")}</Text>
      </div>
      <Stack gap={1}>
        {repos.map((fullName) => {
          const [owner, repo] = fullName.split("/");
          return (
            <Box
              key={fullName}
              as="button"
              surface="surface"
              border="edge"
              padding="card"
              rounded
              onClick={() =>
                onSelect ? onSelect(owner, repo) : send({ type: "SELECT_REPO", owner, repo })
              }
            >
              <Text variant="body" as="span">
                {fullName}
              </Text>
            </Box>
          );
        })}
      </Stack>
      <div className="mt-4">
        <Text variant="body-dim" as="p">
          <Link href="https://github.com/apps/soten-notes/installations/select_target">
            {t("repo.manageAccess")}
          </Link>
        </Text>
      </div>
    </div>
  );
}
