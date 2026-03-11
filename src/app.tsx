import { Outlet, useNavigate } from "@tanstack/react-router";
import { useAtom, useAtomValue } from "jotai";
import { useEffect } from "react";
import { activeDraftAtom, machineAtom, send, themeAtom } from "./atoms/globals";
import { AuthError } from "./components/AuthError";
import { DraftTray } from "./components/DraftTray";
import { EditorPane } from "./components/EditorPane";
import { LoadingSpinner } from "./components/LoadingSpinner";
import { ResizeHandle } from "./components/ResizeHandle";
import { TopBar } from "./components/TopBar";
import { UnauthenticatedView } from "./components/UnauthenticatedView";
import { useLocalStorage } from "./lib/use-local-storage";
import { useMediaQuery } from "./lib/use-media-query";

function ReadyLayout() {
  const activeDraft = useAtomValue(activeDraftAtom);
  const isWide = useMediaQuery("(min-width: 1200px)");
  const [splitRatio, setSplitRatio] = useLocalStorage("editorSplit", 0.5);

  if (!activeDraft) {
    return (
      <>
        <DraftTray />
        <div className="flex-1 overflow-hidden">
          <Outlet />
        </div>
      </>
    );
  }

  if (!isWide) {
    return (
      <>
        <DraftTray />
        <div className="flex-1 overflow-hidden">
          <EditorPane draft={activeDraft} />
        </div>
      </>
    );
  }

  const totalWidth = typeof window !== "undefined" ? window.innerWidth : 1200;

  return (
    <>
      <DraftTray />
      <div
        className="flex-1 overflow-hidden grid"
        style={{
          gridTemplateColumns: `${splitRatio}fr 4px ${1 - splitRatio}fr`,
        }}
      >
        <div className="overflow-hidden">
          <EditorPane draft={activeDraft} />
        </div>
        <ResizeHandle
          onDrag={(delta) => {
            const ratio = Math.max(0.2, Math.min(0.8, splitRatio + delta / totalWidth));
            setSplitRatio(ratio);
          }}
        />
        <div className="overflow-hidden">
          <Outlet />
        </div>
      </div>
    </>
  );
}

export function App() {
  const [machine] = useAtom(machineAtom);
  const [theme] = useAtom(themeAtom);
  const navigate = useNavigate();

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

  useEffect(() => {
    if (machine.phase === "selectingRepo") {
      navigate({ to: "/settings", replace: true });
    }
  }, [machine.phase, navigate]);

  const showChrome = machine.phase !== "initializing" && machine.phase !== "unauthenticated";

  return (
    <div className="flex flex-col h-screen bg-base text-paper">
      {showChrome && <TopBar />}
      {machine.phase === "initializing" && <LoadingSpinner />}
      {machine.phase === "unauthenticated" && <UnauthenticatedView authError={machine.authError} />}
      {machine.phase === "error" && (
        <AuthError message={machine.message} onRetry={() => void send({ type: "RETRY" })} />
      )}
      {(machine.phase === "fetchingRepos" || machine.phase === "cloningRepo") && <LoadingSpinner />}
      {(machine.phase === "ready" || machine.phase === "selectingRepo") && <ReadyLayout />}
    </div>
  );
}
