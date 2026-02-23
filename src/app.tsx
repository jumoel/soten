import { useAtom } from "jotai";
import { Outlet, useNavigate } from "@tanstack/react-router";
import { machineStateAtom, send } from "./atoms/globals";
import { GitHubAuthButton } from "./components/GitHubAuthButton";
import { RepoSelector } from "./components/RepoSelector";
import { t } from "./i18n";

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
        <div className="w-screen h-screen antialiased">
          <div className="max-w-sm m-auto">
            <div>{t("app.initializing")}</div>
          </div>
        </div>
      );

    case "unauthenticated":
      return (
        <div className="w-screen h-screen antialiased">
          <div className="max-w-sm m-auto">
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
          </div>
        </div>
      );

    case "fetchingRepos":
      return (
        <div className="w-screen h-screen antialiased">
          <div className="max-w-sm m-auto">
            <Header user={state.user} />
            <p>Loading repositories...</p>
          </div>
        </div>
      );

    case "selectingRepo":
      return (
        <div className="w-screen h-screen antialiased">
          <div className="max-w-sm m-auto">
            <Header user={state.user} />
            <RepoSelector repos={state.repos} />
          </div>
        </div>
      );

    case "loadingRepo":
      return (
        <div className="w-screen h-screen antialiased">
          <div className="max-w-sm m-auto">
            <Header user={state.user} repo={state.repo} />
            <p>
              Loading {state.repo.owner}/{state.repo.repo}...
            </p>
          </div>
        </div>
      );

    case "ready":
      return (
        <div className="w-screen h-screen antialiased">
          <div className="max-w-sm m-auto">
            <Header
              user={state.user}
              repo={state.repo}
              onSwitchRepo={() => send({ type: "SWITCH_REPO" })}
            />
            <Outlet />
          </div>
        </div>
      );

    case "error":
      return (
        <div className="w-screen h-screen antialiased">
          <div className="max-w-sm m-auto">
            <Header user={state.user} />
            <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
              <p className="text-red-800 font-medium">Error</p>
              <pre className="mt-2 text-sm text-red-700 whitespace-pre-wrap">{state.message}</pre>
            </div>
          </div>
        </div>
      );
  }
}
