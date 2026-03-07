"use client";

import { fs, wipeFs, readRepoDir } from "./fs";
import { REPO_DIR } from "./constants";

type GitDeps = {
  git: typeof import("isomorphic-git").default;
  http: typeof import("isomorphic-git/http/web").default;
};

let cached: Promise<GitDeps> | null = null;

function getGit(): Promise<GitDeps> {
  if (!cached) {
    cached = Promise.all([
      import("isomorphic-git"),
      import("isomorphic-git/http/web"),
      import("buffer"),
    ]).then(
      ([gitMod, httpMod, bufferMod]) => {
        globalThis.Buffer = bufferMod.Buffer;
        return { git: gitMod.default, http: httpMod.default };
      },
      (err) => {
        cached = null;
        throw err;
      },
    );
  }
  return cached;
}

const corsProxy = "/api/cors-proxy";

export async function clone(url: string, user: { username: string; token: string; email: string }) {
  const { git, http } = await getGit();
  await wipeFs();

  await git.clone({
    fs,
    http,
    dir: REPO_DIR,
    url,
    corsProxy,

    singleBranch: true,
    depth: 1,

    onMessage: (message) => console.debug("clone onMessage", message),
    onProgress: (progress) => console.debug("clone onProgress", progress),

    onAuth: () => ({ username: user.username, password: user.token }),
  });

  await setUser(user);
}

export async function isInitialized() {
  try {
    const files = await readRepoDir();

    return files.includes(".git");
  } catch {
    return false;
  }
}

export async function pull(user: { username: string; token: string }) {
  const { git, http } = await getGit();
  await git.pull({
    fs,
    http,
    dir: REPO_DIR,
    fastForwardOnly: true,
    corsProxy,

    onMessage: (message) => console.debug("pull onMessage", message),
    onProgress: (progress) => console.debug("pull onProgress", progress),

    onAuth: () => ({ username: user.username, password: user.token }),
  });
}

export async function setUser(user: { username: string; email: string }) {
  const { git } = await getGit();
  await Promise.all([
    git.setConfig({ fs, dir: REPO_DIR, path: "user.name", value: user.username }),
    git.setConfig({ fs, dir: REPO_DIR, path: "user.email", value: user.email }),
  ]);
}
