import { send } from "../atoms/globals";
import { t } from "../i18n";
import { Button } from "./Button";

export function RepoSelector({
  repos,
  onSelect,
}: {
  repos: string[];
  onSelect?: (owner: string, repo: string) => void;
}) {
  return (
    <div className="my-4">
      <p className="mb-2 font-semibold">{t("repo.selectRepository")}</p>
      <ul>
        {repos.map((fullName) => {
          const [owner, repo] = fullName.split("/");
          return (
            <li key={fullName} className="my-1">
              <Button
                className="px-3 py-1 font-mono text-sm"
                onClick={() =>
                  onSelect ? onSelect(owner, repo) : send({ type: "SELECT_REPO", owner, repo })
                }
              >
                {fullName}
              </Button>
            </li>
          );
        })}
      </ul>
      <p className="mt-4 text-sm">
        <a
          href="https://github.com/apps/soten-notes/installations/select_target"
          target="_blank"
          rel="noopener noreferrer"
          className="underline"
        >
          {t("repo.manageAccess")}
        </a>
      </p>
    </div>
  );
}
