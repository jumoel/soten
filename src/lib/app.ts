import { pfs, FILE_SYSTEM_NAME } from "./fs";
import * as git from "./git";

export async function init() {
  await indexedDB.deleteDatabase(FILE_SYSTEM_NAME);

  const repoExists = await pfs
    .readdir(git.REPO_DIR)
    .then(() => true)
    .catch(() => false);

  if (!repoExists) {
    console.log("cloning");
    await git.clone("https://github.com/jumoel/soten");
  }

  console.log("setting user");
  await git.setUser();

  console.log("pulling");
  await git.pull();
}
