import { useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";
import { Button, Card, Divider, IconButton, Select, Text } from "../ds";
import { t } from "../i18n";
import { FILE_SYSTEM_NAME, fs } from "../lib/fs";
import { logout } from "../state/auth";
import { repoAtom, resetRepo } from "../state/repo";
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
            variant={theme === value ? "primary" : "secondary"}
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

  const handleWipe = useCallback(async () => {
    fs.init(FILE_SYSTEM_NAME, { wipe: true });
    resetRepo();
    window.location.hash = "#/";
    window.location.reload();
  }, []);

  const handleSwitchRepo = useCallback(() => {
    resetRepo();
    window.location.hash = "#/";
    window.location.reload();
  }, []);

  const handleLogout = useCallback(() => {
    logout();
    window.location.hash = "#/";
  }, []);

  return (
    <>
      <div className="flex items-center h-9 px-3 border-b border-edge bg-surface shrink-0">
        <IconButton
          icon="chevron-left"
          size="sm"
          aria-label={t("nav.back")}
          onClick={() => {
            window.location.hash = "#/";
          }}
        />
        <Text variant="h4" as="span" className="text-xs flex-1 text-center">
          {t("menu.settings")}
        </Text>
        <div className="w-8" />
      </div>

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-lg px-4 sm:px-6 py-6 flex flex-col gap-6">
          <ThemeSelector />

          <WeekStartSelector />

          <Divider />

          {repo && (
            <>
              <div className="flex flex-col gap-2">
                <Text variant="h4" as="span" className="text-sm">
                  {t("settings.repository")}
                </Text>
                <Card>
                  <div className="flex items-center justify-between">
                    <Text as="span" className="text-sm">
                      {repo.owner}/{repo.repo}
                    </Text>
                    <Button variant="ghost" size="sm" onClick={handleSwitchRepo}>
                      {t("settings.switchRepo")}
                    </Button>
                  </div>
                </Card>
              </div>

              <Divider />
            </>
          )}

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
    </>
  );
}
