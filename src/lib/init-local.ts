import { authStateAtom } from "../state/auth";
import { cloneStatusAtom, filenamesAtom, hasRemoteAtom } from "../state/repo";
import { store } from "../state/store";
import { getRepoWorker } from "../worker/client";
import { refreshFs } from "./fs";

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

  store.set(filenamesAtom, result.state.filenames);
  store.set(cloneStatusAtom, "ready");
  store.set(hasRemoteAtom, true);
  store.set(authStateAtom, "authenticated");
}
