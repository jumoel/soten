import * as git from "./git";

export async function init(repoName: string, user: { username: string; token: string }) {
  console.log("cloning");
  await git.clone(`https://github.com/${repoName}.git`, user);

  console.log("setting user");
  await git.setUser();
}
