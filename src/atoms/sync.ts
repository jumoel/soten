import { refreshFs } from "../lib/fs";
import { withGitWorking } from "../lib/git-status";
import { fetchCurrentUser, fetchUserRepos } from "../lib/github";
import { getRepoWorker } from "../worker/client";
import { draftsAtom } from "./drafts";
import { updateSearchIndex } from "./search";
import type { User } from "./store";
import {
  cachedReposAtom,
  machineAtom,
  noteListAtom,
  selectedRepoAtom,
  store,
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

    const worker = getRepoWorker();

    await withGitWorking(async () => {
      // Push all draft branches non-fatally
      const drafts = store.get(draftsAtom);
      for (const draft of drafts) {
        try {
          await worker.push(user, `draft/${draft.timestamp}`);
        } catch {
          // Draft push failure is non-fatal
        }
      }

      // Push main non-fatally
      try {
        await worker.push(user);
      } catch {
        // Main push failure is non-fatal
      }

      // Pull
      try {
        await worker.pull(user);
      } catch {
        return;
      }

      const filenames = await worker.readRepoFiles();
      refreshFs();
      const machine = store.get(machineAtom);
      if (machine.phase === "ready") {
        const oldFilenames = machine.filenames;
        store.set(machineAtom, { ...machine, filenames });
        updateSearchIndex(oldFilenames, filenames, store.get(noteListAtom));
      }
    });
  } catch {
    // Network errors during sync are silently ignored
  } finally {
    syncing = false;
  }
}

export const backgroundSync = fullSync;
