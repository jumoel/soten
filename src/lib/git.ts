"use client";

import http from "isomorphic-git/http/web";
import git from "isomorphic-git";
import { fs } from "./fs";
import { Buffer } from "buffer";

export const REPO_DIR = "/soten";

globalThis.Buffer = Buffer;

export async function clone(url: string) {
  await git.clone({
    fs,
    http,
    dir: REPO_DIR,
    url,
    ref: "main",
    onMessage: console.debug,
    onProgress: console.debug,
    corsProxy: "/cors-proxy",
  });
}

export async function pull() {
  await git.pull({
    fs,
    http,
    dir: REPO_DIR,
    onMessage: console.debug,
    onProgress: console.debug,
    fastForwardOnly: true,
    corsProxy: "/cors-proxy",
  });
}

export async function setUser() {
  await git.setConfig({ fs, dir: REPO_DIR, path: "user.name", value: "soten" });
  await git.setConfig({ fs, dir: REPO_DIR, path: "user.email", value: "soten@soten.app" });
}
