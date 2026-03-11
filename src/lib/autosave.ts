import { draftsAtom } from "../atoms/drafts";
import { store } from "../atoms/store";
import { getRepoWorker } from "../worker/client";
import { withGitWorking } from "./git-status";
import { pushIfOnline } from "./push";

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

  const worker = getRepoWorker();
  const branch = `draft/${timestamp}`;
  const filepath = `${timestamp}.md`;

  try {
    await withGitWorking(async () => {
      await worker.checkoutBranch(branch);
      await worker.commitFile(filepath, draft.content, "draft: autosave");
      lastSaved.set(timestamp, draft.content);
      await pushIfOnline(branch);
    });
  } catch (e) {
    console.debug("autosave failed", e);
  }
}

export function cancelAutosave(timestamp: string): void {
  const existing = timers.get(timestamp);
  if (existing) clearTimeout(existing);
  timers.delete(timestamp);
  lastSaved.delete(timestamp);
}
