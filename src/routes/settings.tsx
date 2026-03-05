import { useAtom } from "jotai";
import { useNavigate } from "@tanstack/react-router";
import { machineAtom, send } from "../atoms/globals";
import { RepoSelector } from "../components/RepoSelector";

export function SettingsPage() {
  const [machine] = useAtom(machineAtom);
  const navigate = useNavigate();

  const repos = "repos" in machine ? machine.repos : null;
  if (!repos) return null;

  return (
    <RepoSelector
      repos={repos}
      onSelect={(owner, repo) => {
        navigate({ to: "/", replace: true });
        send({ type: "SELECT_REPO", owner, repo });
      }}
    />
  );
}
