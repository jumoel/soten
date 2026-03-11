import { useNavigate } from "@tanstack/react-router";
import { useAtom } from "jotai";
import { machineAtom, send, themeAtom } from "../atoms/globals";
import type { Theme } from "../atoms/store";
import { RepoSelector } from "../components/RepoSelector";
import { Button, Stack, Text } from "../design";
import { t } from "../i18n";

export function SettingsPage() {
  const [machine] = useAtom(machineAtom);
  const [theme, setTheme] = useAtom(themeAtom);
  const navigate = useNavigate();

  const repos = "repos" in machine ? machine.repos : null;
  if (!repos) return null;

  return (
    <Stack gap={6}>
      <Stack gap={2}>
        <Text variant="label">{t("settings.theme")}</Text>
        <Stack direction="horizontal" gap={1}>
          {(["light", "dark", "system"] as const).map((option: Theme) => (
            <Button
              key={option}
              variant={theme === option ? "primary" : "ghost"}
              size="sm"
              onClick={() => setTheme(option)}
            >
              {t(`settings.theme.${option}`)}
            </Button>
          ))}
        </Stack>
      </Stack>
      <RepoSelector
        repos={repos}
        onSelect={(owner, repo) => {
          navigate({ to: "/", replace: true });
          send({ type: "SELECT_REPO", owner, repo });
        }}
      />
    </Stack>
  );
}
