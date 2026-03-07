import { useState, useEffect, useCallback } from "react";
import { useAtom } from "jotai";
import { Outlet, useNavigate } from "@tanstack/react-router";
import { machineAtom, send } from "./atoms/globals";
import { UnauthenticatedView } from "./components/UnauthenticatedView";
import { AuthError } from "./components/AuthError";
import { TopBar } from "./components/TopBar";
import { Menu } from "./components/Menu";
import { PageContainer } from "./components/PageContainer";
import { LoadingSpinner } from "./components/LoadingSpinner";

export function App() {
  const [machine] = useAtom(machineAtom);
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const toggleMenu = useCallback(() => setMenuOpen((prev) => !prev), []);
  const closeMenu = useCallback(() => setMenuOpen(false), []);

  useEffect(() => {
    if (machine.phase === "selectingRepo") {
      navigate({ to: "/settings", replace: true });
    }
  }, [machine.phase, navigate]);

  const selectedRepo = "selectedRepo" in machine ? machine.selectedRepo : undefined;
  const showChrome = machine.phase !== "initializing" && machine.phase !== "unauthenticated";

  return (
    <div className="w-screen min-h-screen antialiased bg-gray-100">
      {showChrome && (
        <>
          <TopBar menuOpen={menuOpen} onMenuToggle={toggleMenu} />
          <Menu open={menuOpen} onClose={closeMenu} selectedRepo={selectedRepo} />
        </>
      )}
      <PageContainer>
        {machine.phase === "initializing" && <LoadingSpinner />}
        {machine.phase === "unauthenticated" && (
          <UnauthenticatedView authError={machine.authError} />
        )}
        {machine.phase === "error" && (
          <AuthError message={machine.message} onRetry={() => send({ type: "RETRY" })} />
        )}
        {(machine.phase === "fetchingRepos" || machine.phase === "cloningRepo") && (
          <LoadingSpinner />
        )}
        {(machine.phase === "ready" || machine.phase === "selectingRepo") && <Outlet />}
      </PageContainer>
    </div>
  );
}
