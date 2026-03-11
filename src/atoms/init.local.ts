import { refreshFs } from "../lib/fs";
import { getRepoWorker } from "../worker/client";
import { recoverDrafts } from "./draft-recovery";
import { buildSearchIndex } from "./search";
import { machineAtom, noteListAtom, store } from "./store";

export async function initFromLocalRepo(dir: string): Promise<void> {
  const worker = getRepoWorker();
  const localGitUrl = `${window.location.origin}/api/local-git/${encodeURIComponent(dir)}`;

  await worker.setCorsProxy("");
  await worker.clone(localGitUrl, { username: "local", token: "", email: "local@soten" });
  refreshFs();

  const filenames = await worker.readRepoFiles();
  const repoName = dir.split("/").pop() ?? dir;

  store.set(machineAtom, {
    phase: "ready",
    user: { username: "local", token: "", installationId: "0", email: "local@soten" },
    repos: [`local/${repoName}`],
    selectedRepo: { owner: "local", repo: repoName },
    filenames,
    hasRemote: true,
  });

  buildSearchIndex(store.get(noteListAtom));
  await recoverDrafts(filenames);
}
