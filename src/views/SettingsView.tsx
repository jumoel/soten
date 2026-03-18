import { useAtomValue, useSetAtom } from "jotai";
import { useCallback, useMemo } from "react";
import { Button, Divider, Link, Select, Text } from "../ds";
import { t } from "../i18n";
import { FILE_SYSTEM_NAME, fs } from "../lib/fs";
import { logout, userAtom } from "../state/auth";
import { cachedReposAtom, repoAtom, resetRepo, selectRepo } from "../state/repo";
import { type Theme, themeAtom, type WeekStart, weekStartAtom } from "../state/ui";

const themes: Array<{ value: Theme; label: string; icon: "sun" | "moon" | "settings" }> = [
  { value: "light", label: t("settings.theme.light"), icon: "sun" },
  { value: "dark", label: t("settings.theme.dark"), icon: "moon" },
  { value: "system", label: t("settings.theme.system"), icon: "settings" },
];

const weekStartOptions: Array<{ value: string; label: string }> = [
  { value: "0", label: t("settings.weekStart.sunday") },
  { value: "1", label: t("settings.weekStart.monday") },
  { value: "6", label: t("settings.weekStart.saturday") },
];

function ThemeSelector() {
  const theme = useAtomValue(themeAtom);
  const setTheme = useSetAtom(themeAtom);

  return (
    <div className="flex flex-col gap-2">
      <Text variant="h4" as="span" className="text-sm">
        {t("settings.theme")}
      </Text>
      <div className="flex gap-1">
        {themes.map(({ value, label, icon }) => (
          <Button
            key={value}
            variant="secondary"
            active={theme === value}
            size="sm"
            icon={icon}
            onClick={() => setTheme(value)}
          >
            {label}
          </Button>
        ))}
      </div>
    </div>
  );
}

function WeekStartSelector() {
  const weekStart = useAtomValue(weekStartAtom);
  const setWeekStart = useSetAtom(weekStartAtom);

  return (
    <div className="flex flex-col gap-2">
      <Select
        value={String(weekStart)}
        onChange={(v) => setWeekStart(Number(v) as WeekStart)}
        options={weekStartOptions}
        label={t("settings.weekStart")}
        labelVisible
      />
    </div>
  );
}

export function SettingsView() {
  const repo = useAtomValue(repoAtom);
  const user = useAtomValue(userAtom);
  const cachedRepos = useAtomValue(cachedReposAtom) ?? [];

  const repoOptions = useMemo(() => {
    const currentFullName = repo ? `${repo.owner}/${repo.repo}` : null;
    const repos = [...cachedRepos];
    if (currentFullName && !repos.includes(currentFullName)) {
      repos.unshift(currentFullName);
    }
    return repos.map((fullName) => ({ value: fullName, label: fullName }));
  }, [cachedRepos, repo]);

  const handleRepoChange = useCallback(
    (fullName: string) => {
      if (!user) return;
      const [owner, repoName] = fullName.split("/");
      void selectRepo(owner, repoName, user);
      window.location.hash = "#/";
    },
    [user],
  );

  const handleWipe = useCallback(async () => {
    fs.init(FILE_SYSTEM_NAME, { wipe: true });
    resetRepo();
    window.location.hash = "#/";
    window.location.reload();
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    window.location.hash = "#/";
  }, []);

  const installationUrl = user?.installationId
    ? `https://github.com/settings/installations/${user.installationId}`
    : "https://github.com/settings/installations";

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="mx-auto max-w-lg px-4 sm:px-6 py-6 flex flex-col gap-6">
        <ThemeSelector />

        <WeekStartSelector />

        <Divider />

        <div className="flex flex-col gap-2">
          <Select
            value={repo ? `${repo.owner}/${repo.repo}` : ""}
            onChange={handleRepoChange}
            options={repoOptions}
            label={t("settings.repository")}
            labelVisible
          />
          <Link href={installationUrl} className="text-xs">
            {t("repo.manageAccess")}
          </Link>
        </div>

        <Divider />

        <div className="flex flex-col gap-3">
          <Button variant="ghost" icon="log-out" onClick={handleLogout}>
            {t("auth.logout")}
          </Button>
          <Button variant="ghost" icon="trash" onClick={handleWipe} className="text-error-text">
            {t("settings.wipeLocalData")}
          </Button>
        </div>
      </div>
    </main>
  );
}
