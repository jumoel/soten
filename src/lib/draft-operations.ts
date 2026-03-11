import { removeDraft } from "../atoms/drafts";
import { updateSearchIndex } from "../atoms/search";
import { machineAtom, noteListAtom, store } from "../atoms/store";
import { getRepoWorker } from "../worker/client";
import { cancelAutosave } from "./autosave";
import { REPO_DIR } from "./constants";
import { pfs, refreshFs } from "./fs";
import { withGitWorking } from "./git-status";
import { pushIfOnline } from "./push";

function extractTitle(content: string): string | null {
  const fmMatch = content.match(/^---\n[\s\S]*?title:\s*(.+)\n[\s\S]*?---/);
  if (fmMatch) return fmMatch[1].trim();
  const headingMatch = content.match(/^#\s+(.+)$/m);
  if (headingMatch) return headingMatch[1].trim();
  return null;
}

export async function saveDraft(timestamp: string, content: string, isNew: boolean): Promise<void> {
  cancelAutosave(timestamp);

  const worker = getRepoWorker();
  const branch = `draft/${timestamp}`;
  const filepath = `${timestamp}.md`;

  const title = extractTitle(content);
  const prefix = isNew ? "add" : "update";
  const message = title ? `${prefix}: ${title}` : `${prefix} note ${timestamp}`;

  await withGitWorking(async () => {
    await worker.checkoutBranch(branch);
    await worker.commitFile(filepath, content, "draft: autosave");
    await worker.squashMergeToMain(branch, message);
    await pushIfOnline("main");
  });

  const machine = store.get(machineAtom);
  if (machine.phase === "ready") {
    const oldFilenames = machine.filenames;
    const filenames = await worker.readRepoFiles();
    refreshFs();
    store.set(machineAtom, { ...machine, filenames });
    updateSearchIndex(oldFilenames, filenames, store.get(noteListAtom));
  }

  removeDraft(timestamp);
}

export async function discardDraft(timestamp: string, isNew: boolean): Promise<void> {
  cancelAutosave(timestamp);

  const worker = getRepoWorker();
  const branch = `draft/${timestamp}`;

  await withGitWorking(async () => {
    try {
      await worker.deleteBranch(branch);
    } catch {
      // Branch may not exist yet
    }

    try {
      await pushIfOnline(`:refs/heads/${branch}`);
    } catch {
      // Remote branch may not exist
    }

    if (isNew) {
      try {
        await pfs.unlink(`${REPO_DIR}/${timestamp}.md`);
      } catch {
        // File may not exist
      }
    } else {
      await worker.checkoutBranch("main");
      refreshFs();
    }
  });

  removeDraft(timestamp);
}
