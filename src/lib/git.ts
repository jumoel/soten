"use client";

import http from "isomorphic-git/http/web";
import git from "isomorphic-git";
import { fs, wipeFs } from "./fs";
import { Buffer } from "buffer";

export const REPO_DIR = "/soten";

globalThis.Buffer = Buffer;

const corsProxy = "/api/cors-proxy";

export async function clone(url: string, user: { username: string; token: string; email: string }) {
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

export async function pull(user: { username: string; token: string }) {
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
  await git.setConfig({ fs, dir: REPO_DIR, path: "user.name", value: user.username });
  await git.setConfig({ fs, dir: REPO_DIR, path: "user.email", value: user.email });
}
