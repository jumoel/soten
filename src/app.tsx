import { useAtom } from "jotai";
import { Outlet, useNavigate } from "@tanstack/react-router";
import { type ReactNode } from "react";
import { machineStateAtom, send } from "./atoms/globals";
import { GitHubAuthButton } from "./components/GitHubAuthButton";
import { RepoSelector } from "./components/RepoSelector";
import { t } from "./i18n";

function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="w-screen h-screen antialiased">
      <div className="max-w-sm m-auto">{children}</div>
    </div>
  );
}

function Header({
  user,
  repo,
  onSwitchRepo,
}: {
  user: { username: string };
  repo?: { owner: string; repo: string };
  onSwitchRepo?: () => void;
}) {
  const navigate = useNavigate();

  return (
    <div className="text-center">
      <h1 className="text-3xl">soten</h1>
      <h2>{t("app.tagline")}</h2>
      <div className="my-4">
        <p>{t("auth.welcome", { username: user.username })}</p>
        {repo && (
          <p className="text-sm">
            {repo.owner}/{repo.repo}{" "}
            {onSwitchRepo && (
              <button className="underline" onClick={onSwitchRepo}>
                {t("auth.switchRepo")}
              </button>
            )}
          </p>
        )}
        <p>
          <button
            onClick={async () => {
              await send({ type: "LOGOUT" });
              navigate({ to: "/" });
            }}
          >
            {t("auth.logout")}
          </button>
        </p>
      </div>
    </div>
  );
}

export function App() {
  const [state] = useAtom(machineStateAtom);

  switch (state.name) {
    case "initializing":
      return (
        <Layout>
          <div>{t("app.initializing")}</div>
        </Layout>
      );

    case "unauthenticated":
      return (
        <Layout>
          <div className="text-center">
            <h1 className="text-3xl">soten</h1>
            <h2>{t("app.tagline")}</h2>
            {state.authError && (
              <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                <p className="text-red-800 font-medium">{t("auth.loginFailed")}</p>
                <pre className="mt-2 text-sm text-red-700 whitespace-pre-wrap">
                  {state.authError}
                </pre>
              </div>
            )}
            <GitHubAuthButton />
          </div>
        </Layout>
      );

    case "fetchingRepos":
      return (
        <Layout>
          <Header user={state.user} />
          <p>Loading repositories...</p>
        </Layout>
      );

    case "selectingRepo":
      return (
        <Layout>
          <Header user={state.user} />
          <RepoSelector repos={state.repos} />
        </Layout>
      );

    case "loadingRepo":
      return (
        <Layout>
          <Header user={state.user} repo={state.repo} />
          <p>
            Loading {state.repo.owner}/{state.repo.repo}...
          </p>
        </Layout>
      );

    case "ready":
      return (
        <Layout>
          <Header
            user={state.user}
            repo={state.repo}
            onSwitchRepo={() => send({ type: "SWITCH_REPO" })}
          />
          <Outlet />
        </Layout>
      );

    case "error":
      return (
        <Layout>
          <Header user={state.user} />
          <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
            <p className="text-red-800 font-medium">Error</p>
            <pre className="mt-2 text-sm text-red-700 whitespace-pre-wrap">{state.message}</pre>
          </div>
        </Layout>
      );
  }
}
