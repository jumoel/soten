import { useAtomValue } from "jotai";
import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Alert, Button, Card, Spinner, Stack, Text } from "./ds";
import { t } from "./i18n";
import { init } from "./lib/init";
import { routeAtom } from "./lib/router";
import { authErrorAtom, authStateAtom, login, logout, userAtom } from "./state/auth";
import { cachedReposAtom, cloneStatusAtom, selectRepo } from "./state/repo";
import { themeAtom } from "./state/ui";
import { BrowserView } from "./views/BrowserView";
import { EditorView } from "./views/EditorView";
import { SettingsView } from "./views/SettingsView";

function useTheme() {
  const theme = useAtomValue(themeAtom);
  useEffect(() => {
    function apply() {
      const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
      const isDark = theme === "dark" || (theme === "system" && prefersDark);
      document.documentElement.classList.toggle("dark", isDark);
    }
    apply();
    if (theme === "system") {
      const mq = window.matchMedia("(prefers-color-scheme: dark)");
      mq.addEventListener("change", apply);
      return () => mq.removeEventListener("change", apply);
    }
  }, [theme]);
}

function CenterScreen({ children }: { children: ReactNode }) {
  return <div className="flex items-center justify-center min-h-screen bg-base">{children}</div>;
}

function LoginScreen() {
  const authError = useAtomValue(authErrorAtom);
  return (
    <CenterScreen>
      <Card>
        <Stack gap={4} align="center">
          <Text variant="h2">{t("app.name")}</Text>
          <Text variant="body-dim">{t("app.tagline")}</Text>
          {authError && <Alert variant="error">{authError}</Alert>}
          <Button variant="primary" icon="github" onClick={() => login()}>
            {t("auth.loginWithGithub")}
          </Button>
        </Stack>
      </Card>
    </CenterScreen>
  );
}

function RepoSelector() {
  const repos = useAtomValue(cachedReposAtom) ?? [];
  const user = useAtomValue(userAtom);
  if (!user) return null;

  return (
    <CenterScreen>
      <Stack gap={4} align="center">
        <Text variant="h2">{t("repo.selectRepository")}</Text>
        <Stack gap={2}>
          {repos.map((fullName) => {
            const [owner, repo] = fullName.split("/");
            return (
              <Card
                key={fullName}
                variant="interactive"
                onClick={() => void selectRepo(owner, repo, user)}
              >
                <Text>{fullName}</Text>
              </Card>
            );
          })}
        </Stack>
        <Button variant="ghost" onClick={() => logout()}>
          {t("auth.logout")}
        </Button>
      </Stack>
    </CenterScreen>
  );
}

function ErrorScreen() {
  const error = useAtomValue(authErrorAtom);
  return (
    <CenterScreen>
      <Stack gap={4} align="center">
        <Alert variant="error" title={t("error.somethingWentWrong")}>
          {error ?? t("error.unknown")}
        </Alert>
        <Button variant="secondary" onClick={() => logout()}>
          {t("auth.logoutAndRetry")}
        </Button>
      </Stack>
    </CenterScreen>
  );
}

function AuthenticatedApp() {
  const route = useAtomValue(routeAtom);

  switch (route.view) {
    case "settings":
      return <SettingsView />;
    case "note":
      return <EditorView route={route} />;
    case "draft":
      return <EditorView route={route} />;
    default:
      return <BrowserView />;
  }
}

function LoadingScreen() {
  return (
    <CenterScreen>
      <Spinner label={t("loading")} size="lg" />
    </CenterScreen>
  );
}

export function App() {
  useTheme();
  const [ready, setReady] = useState(false);
  const authState = useAtomValue(authStateAtom);
  const cloneStatus = useAtomValue(cloneStatusAtom);

  useEffect(() => {
    init().then(() => setReady(true));
  }, []);

  if (!ready) return <LoadingScreen />;

  if (authState === "unauthenticated") return <LoginScreen />;
  if (authState === "error") return <ErrorScreen />;
  if (authState === "authenticating") return <LoadingScreen />;

  // authenticated
  if (cloneStatus === "selecting") return <RepoSelector />;
  if (cloneStatus !== "ready") return <LoadingScreen />;

  return <AuthenticatedApp />;
}
