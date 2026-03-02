import { useAtom } from "jotai";
import { Outlet, useNavigate } from "@tanstack/react-router";
import { machineAtom, send } from "./atoms/globals";
import { GitHubAuthButton } from "./components/GitHubAuthButton";
import { RepoSelector } from "./components/RepoSelector";
import { t } from "./i18n";

export function App() {
  const [machine] = useAtom(machineAtom);
  const navigate = useNavigate();

  if (machine.phase === "initializing") {
    return (
      <div className="w-screen h-screen antialiased">
        <div className="max-w-sm m-auto">
          <div>{t("app.initializing")}</div>
        </div>
      </div>
    );
  }

  if (machine.phase === "unauthenticated") {
    return (
      <div className="w-screen h-screen antialiased">
        <div className="max-w-sm m-auto">
          <div className="text-center">
            <h1 className="text-3xl">soten</h1>
            <h2>{t("app.tagline")}</h2>

            {machine.authError && (
              <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
                <p className="text-red-800 font-medium">{t("auth.loginFailed")}</p>
                <pre className="mt-2 text-sm text-red-700 whitespace-pre-wrap">
                  {machine.authError}
                </pre>
              </div>
            )}

            <GitHubAuthButton />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-screen h-screen antialiased">
      <div className="max-w-sm m-auto">
        <div className="text-center">
          <h1 className="text-3xl">soten</h1>
          <h2>{t("app.tagline")}</h2>

          <div className="my-4">
            <p>{t("auth.welcome", { username: machine.user.username })}</p>
            {machine.phase === "ready" && (
              <p className="text-sm">
                {machine.selectedRepo.owner}/{machine.selectedRepo.repo}{" "}
                <button className="underline" onClick={() => send({ type: "SWITCH_REPO" })}>
                  {t("auth.switchRepo")}
                </button>
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

        {machine.phase === "selectingRepo" && <RepoSelector repos={machine.repos} />}

        {machine.phase === "error" && (
          <div className="my-4 p-4 bg-red-50 border border-red-200 rounded-lg text-left">
            <p className="text-red-800">{machine.message}</p>
            <button
              className="mt-3 px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700 text-sm"
              onClick={() => send({ type: "RETRY" })}
            >
              {t("auth.tryAgain")}
            </button>
          </div>
        )}

        {(machine.phase === "fetchingRepos" ||
          machine.phase === "cloningRepo" ||
          machine.phase === "loadingFiles") && <div>{t("app.initializing")}</div>}

        {machine.phase === "ready" && <Outlet />}
      </div>
    </div>
  );
}
