import { wipeFs } from "./fs";
import * as git from "./git";

export async function init(repoName: string, user: { username: string; token: string }) {
  await wipeFs();

  console.log("setting user");
  await git.setUser();

  console.log("cloning");
  await git.clone(`https://github.com/${repoName}`, user);
}
