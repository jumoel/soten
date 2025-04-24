import { pfs, FILE_SYSTEM_NAME } from "./fs";
import * as git from "./git";

export async function init(repoName: string, user: { username: string; token: string }) {
  await indexedDB.deleteDatabase(FILE_SYSTEM_NAME);

  const repoExists = await pfs
    .readdir(git.REPO_DIR)
    .then(() => true)
    .catch(() => false);

  console.log("setting user");
  await git.setUser();

  if (!repoExists) {
    console.log("cloning");
    await git.clone(`https://github.com/${repoName}`, user);
  }

  console.log("pulling");
}
