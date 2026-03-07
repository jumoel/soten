import { fetchCurrentUser, fetchUserRepos } from "../lib/github";
import * as git from "../lib/git";
import { readRepoFiles } from "../lib/fs";
import type { User } from "./store";
import { store, machineAtom, userAtom, selectedRepoAtom, cachedReposAtom } from "./store";

let syncing = false;

export async function backgroundSync(user: User): Promise<void> {
  if (syncing) return;
  syncing = true;

  try {
    if (store.get(machineAtom).phase !== "ready") return;

    const currentUser = await fetchCurrentUser(user.token);
    if (!currentUser?.login) {
      if (store.get(machineAtom).phase === "ready") {
        store.set(userAtom, null);
        store.set(machineAtom, { phase: "unauthenticated", authError: null });
      }
      return;
    }

    const repos = await fetchUserRepos(user.installationId, user.token);
    if (repos) {
      store.set(cachedReposAtom, repos);

      const selectedRepo = store.get(selectedRepoAtom);
      if (selectedRepo && !repos.includes(`${selectedRepo.owner}/${selectedRepo.repo}`)) {
        if (store.get(machineAtom).phase === "ready") {
          store.set(machineAtom, { phase: "selectingRepo", user, repos });
        }
        return;
      }
    }

    try {
      await git.pull(user);
    } catch {
      return;
    }

    const filenames = await readRepoFiles();
    const machine = store.get(machineAtom);
    if (machine.phase === "ready") {
      store.set(machineAtom, { ...machine, filenames });
    }
  } catch {
    // Network errors during background sync are silently ignored
  } finally {
    syncing = false;
  }
}
