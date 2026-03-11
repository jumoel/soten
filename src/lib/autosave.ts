import { draftsAtom } from "../atoms/drafts";
import { machineAtom, store, syncStatusAtom } from "../atoms/store";
import { getRepoWorker } from "../worker/client";
import { applyRepoState } from "./apply-repo-state";
import { onlineAtom } from "./online";

const DEBOUNCE_MS = 2000;
const timers = new Map<string, ReturnType<typeof setTimeout>>();
const lastSaved = new Map<string, string>();

export function scheduleAutosave(timestamp: string): void {
  const existing = timers.get(timestamp);
  if (existing) clearTimeout(existing);

  timers.set(
    timestamp,
    setTimeout(() => {
      timers.delete(timestamp);
      void autosave(timestamp);
    }, DEBOUNCE_MS),
  );
}

async function autosave(timestamp: string): Promise<void> {
  const draft = store.get(draftsAtom).find((d) => d.timestamp === timestamp);
  if (!draft) return;
  if (draft.content === lastSaved.get(timestamp)) return;

  const machine = store.get(machineAtom);
  if (machine.phase !== "ready") return;

  const worker = getRepoWorker();

  try {
    store.set(syncStatusAtom, "working");
    const result = await worker.autosaveDraft(
      timestamp,
      draft.content,
      machine.user,
      machine.hasRemote,
      store.get(onlineAtom),
    );
    lastSaved.set(timestamp, draft.content);
    applyRepoState(result.state, { skipFilenames: true });
    store.set(syncStatusAtom, result.syncStatus);
  } catch (e) {
    console.debug("autosave failed", e);
    store.set(syncStatusAtom, "idle");
  }
}

export function cancelAutosave(timestamp: string): void {
  const existing = timers.get(timestamp);
  if (existing) clearTimeout(existing);
  timers.delete(timestamp);
  lastSaved.delete(timestamp);
}
