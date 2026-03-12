import { authStateAtom, userAtom } from "../state/auth";
import { applyRepoState, cloneStatusAtom, hasRemoteAtom } from "../state/repo";
import { store } from "../state/store";
import { getRepoWorker } from "../worker/client";

export async function initFromLocalRepo(dir: string): Promise<void> {
  // Show the app shell immediately while the clone runs in the background.
  store.set(userAtom, { username: "local", token: "", installationId: "", email: "local@soten" });
  store.set(authStateAtom, "authenticated");
  store.set(hasRemoteAtom, false);
  store.set(cloneStatusAtom, "cloning");

  const worker = getRepoWorker();
  const localGitUrl = `${window.location.origin}/api/local-git/${encodeURIComponent(dir)}`;

  await worker.setCorsProxy("");
  const result = await worker.domainClone(localGitUrl, {
    username: "local",
    token: "",
    email: "local@soten",
  });

  await applyRepoState(result.state);
  store.set(cloneStatusAtom, "ready");
}
