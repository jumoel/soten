import { draftsAtom } from "../atoms/drafts";
import { updateSearchIndex } from "../atoms/search";
import { machineAtom, noteListAtom, store } from "../atoms/store";
import type { RepoState } from "../worker/protocol";
import { REPO_DIR } from "./constants";
import { refreshFs } from "./fs";

export function applyRepoState(state: RepoState, opts?: { skipFilenames?: boolean }): void {
  const machine = store.get(machineAtom);
  if (machine.phase !== "ready") return;

  if (!opts?.skipFilenames) {
    const oldFilenames = machine.filenames;
    store.set(machineAtom, { ...machine, filenames: state.filenames });
    refreshFs();
    updateSearchIndex(oldFilenames, state.filenames, store.get(noteListAtom));
  }

  // Reconcile drafts: remove branches that no longer exist,
  // add new branches as minimized drafts, preserve UI flags for existing
  store.set(draftsAtom, (prev) => {
    const gitTimestamps = new Set(state.drafts.map((d) => d.timestamp));
    const kept = prev.filter((d) => gitTimestamps.has(d.timestamp));
    const existing = new Set(kept.map((d) => d.timestamp));
    const added = state.drafts
      .filter((d) => !existing.has(d.timestamp))
      .map((d) => ({
        timestamp: d.timestamp,
        content: d.content,
        isNew: !state.filenames.some((f) => f === `${REPO_DIR}/${d.timestamp}.md`),
        minimized: true,
      }));
    return [...kept, ...added];
  });
}
