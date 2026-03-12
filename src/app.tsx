import { useAtomValue, useSetAtom } from "jotai";
import type { ReactNode } from "react";
import { useCallback, useEffect, useState } from "react";
import { SotenLogo } from "./components/SotenLogo";
import { TopBar } from "./components/TopBar";
import { Alert, Button, Card, IconButton, Spinner, Stack, Text } from "./ds";
import { t } from "./i18n";
import { init } from "./lib/init";
import { routeAtom } from "./lib/router";
import { authErrorAtom, authStateAtom, login, logout, userAtom } from "./state/auth";
import { cachedReposAtom, cloneStatusAtom, repoAtom, selectRepo } from "./state/repo";
import { calendarOpenAtom, themeAtom } from "./state/ui";
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

function MainTopBar() {
  const repo = useAtomValue(repoAtom);
  const calendarPref = useAtomValue(calendarOpenAtom);
  const setCalendarPref = useSetAtom(calendarOpenAtom);
  const calendarOpen =
    calendarPref !== null
      ? calendarPref
      : typeof window !== "undefined" && window.innerWidth >= 1200;

  const handleNewNote = useCallback(() => {
    const ts = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
    window.location.hash = `#/${ts}.md?draft=${ts}`;
  }, []);

  return (
    <TopBar
      left={
        <div className="flex items-center gap-1.5">
          <SotenLogo />
          <Text variant="h3" as="span" className="text-sm">
            {repo ? `${repo.owner}/${repo.repo}` : t("app.name")}
          </Text>
        </div>
      }
      right={
        <div className="flex items-center gap-1">
          <IconButton
            icon="calendar"
            size="sm"
            aria-label={t("calendar.toggle")}
            onClick={() => setCalendarPref(!calendarOpen)}
            className={calendarOpen ? "text-accent" : ""}
          />
          <Button
            variant="primary"
            size="sm"
            icon="plus"
            onClick={handleNewNote}
            className="hidden md:flex"
          >
            {t("note.new")}
          </Button>
          <IconButton
            icon="settings"
            size="sm"
            aria-label={t("menu.settings")}
            onClick={() => {
              window.location.hash = "#/settings";
            }}
          />
        </div>
      }
    />
  );
}

function AuthenticatedApp() {
  const route = useAtomValue(routeAtom);

  let content: ReactNode;
  switch (route.view) {
    case "settings":
      content = <SettingsView />;
      break;
    case "note":
    case "draft":
      content = <EditorView route={route} />;
      break;
    default:
      content = <BrowserView />;
  }

  return (
    <div className="flex flex-col h-screen bg-base">
      <MainTopBar />
      {content}
    </div>
  );
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
  if (cloneStatus !== "ready" && cloneStatus !== "cloning") return <LoadingScreen />;

  return <AuthenticatedApp />;
}
