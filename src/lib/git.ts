"use client";

import http from "isomorphic-git/http/web";
import git from "isomorphic-git";
import { fs, wipeFs } from "./fs";
import { Buffer } from "buffer";

export const REPO_DIR = "/soten";

globalThis.Buffer = Buffer;

const corsProxy = "/api/cors-proxy";

export async function clone(url: string, user: { username: string; token: string }) {
  await wipeFs();

  await git.clone({
    fs,
    http,
    dir: REPO_DIR,
    url,
    onMessage: console.debug,
    onProgress: console.debug,
    corsProxy,

    onAuth: () => ({ username: user.username, password: user.token }),
  });
}

export async function pull(user: { username: string; token: string }) {
  await git.pull({
    fs,
    http,
    dir: REPO_DIR,
    onMessage: console.debug,
    onProgress: console.debug,
    fastForwardOnly: true,
    corsProxy,

    onAuth: () => ({ username: user.username, password: user.token }),
  });
}

export async function setUser() {
  await git.setConfig({ fs, dir: REPO_DIR, path: "user.name", value: "soten" });
  await git.setConfig({ fs, dir: REPO_DIR, path: "user.email", value: "soten@soten.app" });
}
