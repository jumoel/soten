import { useAtomValue, useSetAtom } from "jotai";
import { useCallback } from "react";
import { TopBar } from "../components/TopBar";
import { Button, Card, Divider, IconButton, Text } from "../ds";
import { t } from "../i18n";
import { FILE_SYSTEM_NAME, fs } from "../lib/fs";
import { logout } from "../state/auth";
import { repoAtom, resetRepo } from "../state/repo";
import { type Theme, themeAtom } from "../state/ui";

const themes: Array<{ value: Theme; label: string; icon: "sun" | "moon" | "settings" }> = [
  { value: "light", label: t("settings.theme.light"), icon: "sun" },
  { value: "dark", label: t("settings.theme.dark"), icon: "moon" },
  { value: "system", label: t("settings.theme.system"), icon: "settings" },
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
    <div className="flex flex-col h-screen bg-base">
      <TopBar
        left={
          <IconButton
            icon="chevron-left"
            size="sm"
            aria-label={t("nav.back")}
            onClick={() => {
              window.location.hash = "#/";
            }}
          />
        }
        center={
          <Text variant="h3" as="span" className="text-sm">
            {t("menu.settings")}
          </Text>
        }
      />

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-lg px-4 sm:px-6 py-6 flex flex-col gap-6">
          <ThemeSelector />

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
    </div>
  );
}
