import { useAtom } from "jotai";
import { useNavigate } from "@tanstack/react-router";
import { machineAtom, send, pageSizeAtom } from "../atoms/globals";
import { RepoSelector } from "../components/RepoSelector";
import { t } from "../i18n";

export function SettingsPage() {
  const [machine] = useAtom(machineAtom);
  const [pageSize, setPageSize] = useAtom(pageSizeAtom);
  const navigate = useNavigate();

  const repos = "repos" in machine ? machine.repos : null;
  if (!repos) return null;

  return (
    <div>
      <div className="mb-6">
        <label className="block mb-1 font-semibold text-sm" htmlFor="page-size">
          {t("settings.pageSize")}
        </label>
        <input
          id="page-size"
          type="number"
          min={1}
          max={100}
          value={pageSize}
          onChange={(e) => {
            const val = parseInt(e.target.value, 10);
            if (!isNaN(val) && val >= 1) setPageSize(val);
          }}
          className="w-20 border border-gray-300 rounded px-2 py-1 text-sm"
        />
      </div>
      <RepoSelector
        repos={repos}
        onSelect={(owner, repo) => {
          navigate({ to: "/", replace: true });
          send({ type: "SELECT_REPO", owner, repo });
        }}
      />
    </div>
  );
}
