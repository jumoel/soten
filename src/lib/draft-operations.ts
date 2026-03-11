import { machineAtom, store, syncStatusAtom } from "../atoms/store";
import { getRepoWorker } from "../worker/client";
import { applyRepoState } from "./apply-repo-state";
import { cancelAutosave } from "./autosave";
import { onlineAtom } from "./online";

function extractTitle(content: string): string | null {
  const fmMatch = content.match(/^---\n[\s\S]*?title:\s*(.+)\n[\s\S]*?---/);
  if (fmMatch) return fmMatch[1].trim();
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) return headingMatch[1].trim();
  return null;
}

export async function saveDraft(timestamp: string, content: string, isNew: boolean): Promise<void> {
  cancelAutosave(timestamp);

  const machine = store.get(machineAtom);
  if (machine.phase !== "ready") return;

  const title = extractTitle(content);
  const prefix = isNew ? "add" : "update";
  const message = title ? `${prefix}: ${title}` : `${prefix} note ${timestamp}`;

  const worker = getRepoWorker();

  store.set(syncStatusAtom, "working");
  const result = await worker.publishDraft(
    timestamp,
    content,
    message,
    machine.user,
    machine.hasRemote,
    store.get(onlineAtom),
  );
  applyRepoState(result.state);
  store.set(syncStatusAtom, result.syncStatus);
}

export async function discardDraft(timestamp: string): Promise<void> {
  cancelAutosave(timestamp);

  const machine = store.get(machineAtom);
  if (machine.phase !== "ready") return;

  const worker = getRepoWorker();

  store.set(syncStatusAtom, "working");
  const result = await worker.discardDraft(
    timestamp,
    machine.user,
    machine.hasRemote,
    store.get(onlineAtom),
  );
  applyRepoState(result.state);
  store.set(syncStatusAtom, result.syncStatus);
}
