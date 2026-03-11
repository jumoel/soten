import { useAtomValue } from "jotai";
import { useEffect, useState } from "react";
import { Alert, Button, Card, Spinner, Stack, Text } from "./ds";
import { init } from "./lib/init";
import { authErrorAtom, authStateAtom, login, logout, userAtom } from "./state/auth";
import {
  cachedReposAtom,
  cloneStatusAtom,
  filenamesAtom,
  repoAtom,
  selectRepo,
} from "./state/repo";
import { themeAtom } from "./state/ui";

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

function LoginScreen() {
  const authError = useAtomValue(authErrorAtom);
  return (
    <div className="flex items-center justify-center min-h-screen bg-base">
      <Card>
        <Stack gap={4} align="center">
          <Text variant="h2">Soten</Text>
          <Text variant="body-dim">Markdown notes backed by GitHub</Text>
          {authError && <Alert variant="error">{authError}</Alert>}
          <Button variant="primary" icon="github" onClick={() => login()}>
            Sign in with GitHub
          </Button>
        </Stack>
      </Card>
    </div>
  );
}

function RepoSelector() {
  const repos = useAtomValue(cachedReposAtom) ?? [];
  const user = useAtomValue(userAtom);
  if (!user) return null;

  return (
    <div className="flex items-center justify-center min-h-screen bg-base">
      <Stack gap={4} align="center">
        <Text variant="h2">Select a repository</Text>
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
          Sign out
        </Button>
      </Stack>
    </div>
  );
}

function ErrorScreen() {
  const error = useAtomValue(authErrorAtom);
  return (
    <div className="flex items-center justify-center min-h-screen bg-base">
      <Stack gap={4} align="center">
        <Alert variant="error" title="Something went wrong">
          {error ?? "An unknown error occurred"}
        </Alert>
        <Button variant="secondary" onClick={() => logout()}>
          Sign out and retry
        </Button>
      </Stack>
    </div>
  );
}

function ReadyPlaceholder() {
  const filenames = useAtomValue(filenamesAtom);
  const repo = useAtomValue(repoAtom);
  return (
    <div className="flex items-center justify-center min-h-screen bg-base">
      <Stack gap={4} align="center">
        <Text variant="h2">{repo ? `${repo.owner}/${repo.repo}` : "Ready"}</Text>
        <Text variant="body-dim">{filenames.length} notes loaded</Text>
        <Button variant="ghost" onClick={() => logout()}>
          Sign out
        </Button>
      </Stack>
    </div>
  );
}

function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-base">
      <Spinner label="Loading" size="lg" />
    </div>
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

  return <ReadyPlaceholder />;
}
