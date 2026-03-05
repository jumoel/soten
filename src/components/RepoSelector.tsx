import { send } from "../atoms/globals";
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
      <p className="mb-2 font-semibold">{t("repo.selectRepository")}</p>
      <ul className="flex flex-col gap-1.5">
        {repos.map((fullName) => {
          const [owner, repo] = fullName.split("/");
          return (
            <li key={fullName}>
              <button
                className="w-full text-left rounded border border-gray-200 border-l-[3px] border-l-gray-500 bg-gray-50 px-3 py-2 font-mono text-sm text-gray-800 hover:bg-gray-100"
                onClick={() =>
                  onSelect ? onSelect(owner, repo) : send({ type: "SELECT_REPO", owner, repo })
                }
              >
                {fullName}
              </button>
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
