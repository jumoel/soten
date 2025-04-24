import LightningFS from "@isomorphic-git/lightning-fs";

export const FILE_SYSTEM_NAME = "fs";
export const fs = new LightningFS(FILE_SYSTEM_NAME);
export const pfs = fs.promises;

import { REPO_DIR } from "./git";

export async function mkRepoDir() {
  await pfs.mkdir(REPO_DIR);
}

export async function readRepoDir() {
  return pfs.readdir(REPO_DIR);
}

export async function wipeFs() {
  indexedDB.deleteDatabase(FILE_SYSTEM_NAME);
}