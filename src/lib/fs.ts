import LightningFS from "@isomorphic-git/lightning-fs";

export const FILE_SYSTEM_NAME = "fs";
// @ts-expect-error
export const fs = new LightningFS(FILE_SYSTEM_NAME, { wipe: true });
export const pfs = fs.promises;

import { REPO_DIR } from "./git";

export async function readRepoDir() {
  return pfs.readdir(REPO_DIR);
}
