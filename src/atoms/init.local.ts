import { REPO_DIR } from "../lib/constants";
import { refreshFs } from "../lib/fs";
import { getRepoWorker } from "../worker/client";
import { draftsAtom } from "./drafts";
import { buildSearchIndex } from "./search";
import { machineAtom, noteListAtom, store } from "./store";

export async function initFromLocalRepo(dir: string): Promise<void> {
  const worker = getRepoWorker();
  const localGitUrl = `${window.location.origin}/api/local-git/${encodeURIComponent(dir)}`;

  await worker.setCorsProxy("");
  const result = await worker.domainClone(localGitUrl, {
    username: "local",
    token: "",
    email: "local@soten",
  });

  refreshFs();

  const repoName = dir.split("/").pop() ?? dir;

  store.set(machineAtom, {
    phase: "ready",
    user: { username: "local", token: "", installationId: "0", email: "local@soten" },
    repos: [`local/${repoName}`],
    selectedRepo: { owner: "local", repo: repoName },
    filenames: result.state.filenames,
    hasRemote: true,
  });

  buildSearchIndex(store.get(noteListAtom));

  // Reconcile drafts from git state
  const existingFiles = new Set(result.state.filenames);
  const recoveredDrafts = result.state.drafts.map(({ timestamp, content }) => ({
    timestamp,
    content,
    isNew: !existingFiles.has(`${REPO_DIR}/${timestamp}.md`),
    minimized: true,
  }));

  store.set(draftsAtom, (prev) => {
    const existingTimestamps = new Set(prev.map((d) => d.timestamp));
    const newDrafts = recoveredDrafts.filter((d) => !existingTimestamps.has(d.timestamp));
    return [...prev, ...newDrafts];
  });
}
