import { send } from "../atoms/globals";
import { Card } from "./ds/Card";
import { Stack } from "./ds/Stack";
import { Text } from "./ds/Text";
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
      <Text variant="sectionLabel" className="mb-2">
        {t("repo.selectRepository")}
      </Text>
      <Stack gap="1.5">
        {repos.map((fullName) => {
          const [owner, repo] = fullName.split("/");
          return (
            <button
              key={fullName}
              className="w-full text-left hover:bg-gray-100"
              onClick={() =>
                onSelect ? onSelect(owner, repo) : send({ type: "SELECT_REPO", owner, repo })
              }
            >
              <Card muted>
                <Text variant="mono" className="text-gray-800">
                  {fullName}
                </Text>
              </Card>
            </button>
          );
        })}
      </Stack>
      <Text variant="secondary" className="mt-4">
        <a
          href="https://github.com/apps/soten-notes/installations/select_target"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          {t("repo.manageAccess")}
        </a>
      </Text>
    </div>
  );
}
