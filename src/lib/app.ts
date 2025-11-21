import * as git from "./git";

export async function init(
  repoName: string,
  user: { username: string; token: string; email: string },
) {
  console.log("cloning");
  await git.clone(`https://github.com/${repoName}.git`, user);
}
