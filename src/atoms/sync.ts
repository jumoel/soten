import { applyRepoState } from "../lib/apply-repo-state";
import { fetchCurrentUser, fetchUserRepos } from "../lib/github";
import { onlineAtom } from "../lib/online";
import { getRepoWorker } from "../worker/client";
import { draftsAtom } from "./drafts";
import type { User } from "./store";
import {
  cachedReposAtom,
  machineAtom,
  selectedRepoAtom,
  store,
  syncStatusAtom,
  userAtom,
} from "./store";

let syncing = false;

export async function fullSync(user: User): Promise<void> {
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

    const online = store.get(onlineAtom);
    if (!online) return;

    const worker = getRepoWorker();
    const drafts = store.get(draftsAtom);
    const draftTimestamps = drafts.map((d) => d.timestamp);

    store.set(syncStatusAtom, "working");
    const result = await worker.sync(user, draftTimestamps);
    applyRepoState(result.state);
    store.set(syncStatusAtom, result.syncStatus);
  } catch {
    store.set(syncStatusAtom, "idle");
  } finally {
    syncing = false;
  }
}

export const backgroundSync = fullSync;
