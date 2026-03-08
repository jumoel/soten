import { getRepoWorker } from "../worker/client";
import { store } from "./store";
import { draftsAtom } from "./drafts";
import { REPO_DIR } from "../lib/constants";

export async function recoverDrafts(filenames: string[]): Promise<void> {
  const worker = getRepoWorker();

  let branches: Array<{ timestamp: string; content: string }>;
  try {
    branches = await worker.listDraftBranches();
  } catch {
    return;
  }

  if (branches.length === 0) return;

  const existingFiles = new Set(filenames);

  const recoveredDrafts = branches.map(({ timestamp, content }) => {
    const filePath = `${REPO_DIR}/${timestamp}.md`;
    const isNew = !existingFiles.has(filePath);
    return { timestamp, content, isNew, minimized: true };
  });

  store.set(draftsAtom, (prev) => {
    const existingTimestamps = new Set(prev.map((d) => d.timestamp));
    const newDrafts = recoveredDrafts.filter((d) => !existingTimestamps.has(d.timestamp));
    return [...prev, ...newDrafts];
  });
}
