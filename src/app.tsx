import { useAtom } from "jotai";
import { Outlet } from "@tanstack/react-router";
import { machineAtom, send } from "./atoms/globals";
import { RepoSelector } from "./components/RepoSelector";
import { UnauthenticatedView } from "./components/UnauthenticatedView";
import { AuthenticatedShell } from "./components/AuthenticatedShell";
import { AuthError } from "./components/AuthError";
import { t } from "./i18n";
import type { ReactNode } from "react";

function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="w-screen h-screen antialiased">
      <div className="max-w-sm m-auto">{children}</div>
    </div>
  );
}

export function App() {
  const [machine] = useAtom(machineAtom);

  if (machine.phase === "initializing") {
    return (
      <Shell>
        <div>{t("app.initializing")}</div>
      </Shell>
    );
  }

  if (machine.phase === "unauthenticated") {
    return (
      <Shell>
        <UnauthenticatedView authError={machine.authError} />
      </Shell>
    );
  }

  const selectedRepo = "selectedRepo" in machine ? machine.selectedRepo : undefined;

  return (
    <Shell>
      <AuthenticatedShell user={machine.user} selectedRepo={selectedRepo}>
        {machine.phase === "selectingRepo" && <RepoSelector repos={machine.repos} />}
        {machine.phase === "error" && (
          <AuthError message={machine.message} onRetry={() => send({ type: "RETRY" })} />
        )}
        {(machine.phase === "fetchingRepos" ||
          machine.phase === "cloningRepo" ||
          machine.phase === "loadingFiles") && <div>{t("app.initializing")}</div>}
        {machine.phase === "ready" && <Outlet />}
      </AuthenticatedShell>
    </Shell>
  );
}
