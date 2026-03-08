import { getRepoWorker } from "../worker/client";
import { REPO_DIR } from "../lib/constants";
import { store, machineAtom, noteListAtom } from "./store";
import { buildSearchIndex } from "./search";
import { recoverDrafts } from "./draft-recovery";

export async function initFromLocalRepo(dir: string): Promise<void> {
  const filesRes = await fetch(`/api/test-repo/files?dir=${encodeURIComponent(dir)}`);
  if (!filesRes.ok) throw new Error(`Failed to list local repo: ${filesRes.statusText}`);

  const relativePaths = (await filesRes.json()) as string[];
  const textPaths = relativePaths.filter((p) => !p.startsWith("uploads/"));

  const files = await Promise.all(
    textPaths.map(async (relativePath) => {
      const res = await fetch(
        `/api/test-repo/file?path=${encodeURIComponent(`${dir}/${relativePath}`)}`,
      );
      const content = res.ok ? await res.text() : "";
      return { path: `${REPO_DIR}/${relativePath}`, content };
    }),
  );

  await getRepoWorker().populateFiles(files);

  const filenames = files.map((f) => f.path);
  const repoName = dir.split("/").pop() ?? dir;

  store.set(machineAtom, {
    phase: "ready",
    user: { username: "local", token: "no-token", installationId: "0", email: "local@test" },
    repos: [`local/${repoName}`],
    selectedRepo: { owner: "local", repo: repoName },
    filenames,
  });

  buildSearchIndex(store.get(noteListAtom));
  await recoverDrafts(filenames);
}
