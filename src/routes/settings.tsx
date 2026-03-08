import { useAtom } from "jotai";
import { useNavigate } from "@tanstack/react-router";
import { machineAtom, send, themeAtom } from "../atoms/globals";
import type { Theme } from "../atoms/store";
import { RepoSelector } from "../components/RepoSelector";
import { Text } from "../components/ds/Text";
import { Box } from "../components/ds/Box";
import { t } from "../i18n";

export function SettingsPage() {
  const [machine] = useAtom(machineAtom);
  const [theme, setTheme] = useAtom(themeAtom);
  const navigate = useNavigate();

  const repos = "repos" in machine ? machine.repos : null;
  if (!repos) return null;

  return (
    <div>
      <Box mb="6">
        <Box mb="1">
          <Text variant="label">{t("settings.theme")}</Text>
        </Box>
        <div className="inline-flex rounded border border-edge overflow-hidden">
          {(["light", "dark", "system"] as const).map((option: Theme) => (
            <button
              key={option}
              onClick={() => setTheme(option)}
              className={[
                "px-3 py-1.5 text-sm border-r border-edge last:border-r-0",
                theme === option
                  ? "bg-accent text-white"
                  : "bg-surface-2 text-muted hover:text-paper-dim",
              ].join(" ")}
            >
              {t(`settings.theme.${option}`)}
            </button>
          ))}
        </div>
      </Box>
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
