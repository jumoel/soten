import LightningFS from "@isomorphic-git/lightning-fs";
import MiniSearch from "minisearch";
import type { WorkerRequest, WorkerResponse, GitUser, SearchEntry } from "./protocol";

const FILE_SYSTEM_NAME = "fs";
const REPO_DIR = "/soten";

const fs = new LightningFS(FILE_SYSTEM_NAME);
const pfs = fs.promises;

// ---------------------------------------------------------------------------
// Git (lazy-loaded)
// ---------------------------------------------------------------------------

type GitDeps = {
  git: typeof import("isomorphic-git").default;
  http: typeof import("isomorphic-git/http/web").default;
};

let gitDeps: Promise<GitDeps> | null = null;

function getGit(): Promise<GitDeps> {
  if (!gitDeps) {
    gitDeps = Promise.all([
      import("isomorphic-git"),
      import("isomorphic-git/http/web"),
      import("buffer"),
    ]).then(
      ([gitMod, httpMod, bufferMod]) => {
        globalThis.Buffer = bufferMod.Buffer;
        return { git: gitMod.default, http: httpMod.default };
      },
      (err) => {
        gitDeps = null;
        throw err;
      },
    );
  }
  return gitDeps;
}

const corsProxy = "/api/cors-proxy";

async function clone(url: string, user: GitUser): Promise<void> {
  const { git, http } = await getGit();
  fs.init(FILE_SYSTEM_NAME, { wipe: true });

  await git.clone({
    fs,
    http,
    dir: REPO_DIR,
    url,
    corsProxy,
    singleBranch: true,
    depth: 1,
    onMessage: (msg) => console.debug("clone onMessage", msg),
    onProgress: (prog) => console.debug("clone onProgress", prog),
    onAuth: () => ({ username: user.username, password: user.token }),
  });

  await Promise.all([
    git.setConfig({ fs, dir: REPO_DIR, path: "user.name", value: user.username }),
    git.setConfig({ fs, dir: REPO_DIR, path: "user.email", value: user.email }),
  ]);
}

async function pull(user: { username: string; token: string }): Promise<void> {
  const { git, http } = await getGit();
  await git.pull({
    fs,
    http,
    dir: REPO_DIR,
    fastForwardOnly: true,
    corsProxy,
    onMessage: (msg) => console.debug("pull onMessage", msg),
    onProgress: (prog) => console.debug("pull onProgress", prog),
    onAuth: () => ({ username: user.username, password: user.token }),
  });
}

async function push(user: { username: string; token: string }, ref?: string): Promise<void> {
  const { git, http } = await getGit();
  await git.push({
    fs,
    http,
    dir: REPO_DIR,
    corsProxy,
    ref,
    onAuth: () => ({ username: user.username, password: user.token }),
    onMessage: (msg) => console.debug("push onMessage", msg),
    onProgress: (prog) => console.debug("push onProgress", prog),
  });
}

async function isInitialized(): Promise<boolean> {
  try {
    const files = await pfs.readdir(REPO_DIR);
    return files.includes(".git");
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Filesystem
// ---------------------------------------------------------------------------

async function readRepoFiles(): Promise<string[]> {
  const foldersToRead = [REPO_DIR];
  const repoFiles: string[] = [];

  while (foldersToRead.length > 0) {
    const folder = foldersToRead.pop();
    if (!folder) continue;

    const paths = await pfs.readdir(folder);

    for (const path of paths) {
      if (path.startsWith(".")) continue;

      const fullpath = `${folder}/${path}`;
      const stat = await pfs.lstat(fullpath);

      if (stat.isDirectory()) {
        foldersToRead.push(fullpath);
        continue;
      }

      repoFiles.push(fullpath);
    }
  }

  return repoFiles;
}

async function readTextFile(path: string): Promise<string | null> {
  try {
    return await pfs.readFile(path, { encoding: "utf8" });
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Local file population (dev/test only)
// ---------------------------------------------------------------------------

async function mkdirp(path: string): Promise<void> {
  try {
    await pfs.mkdir(path);
  } catch (e) {
    if ((e as { code?: string }).code === "EEXIST") return;
    const parent = path.slice(0, path.lastIndexOf("/"));
    if (!parent || parent === path) throw e;
    await mkdirp(parent);
    await pfs.mkdir(path);
  }
}

async function populateFiles(files: Array<{ path: string; content: string }>): Promise<void> {
  const enc = new TextEncoder();
  for (const file of files) {
    const dir = file.path.slice(0, file.path.lastIndexOf("/"));
    if (dir) await mkdirp(dir);
    await pfs.writeFile(file.path, enc.encode(file.content));
  }
}

// ---------------------------------------------------------------------------
// Branch and commit operations
// ---------------------------------------------------------------------------

async function createBranch(name: string): Promise<void> {
  const { git } = await getGit();
  await git.branch({ fs, dir: REPO_DIR, ref: name });
}

async function checkoutBranch(name: string): Promise<void> {
  const { git } = await getGit();
  await git.checkout({ fs, dir: REPO_DIR, ref: name });
}

async function commitFile(filepath: string, content: string, message: string): Promise<void> {
  const { git } = await getGit();
  const enc = new TextEncoder();
  const fullpath = `${REPO_DIR}/${filepath}`;

  const dir = fullpath.slice(0, fullpath.lastIndexOf("/"));
  if (dir && dir !== REPO_DIR) await mkdirp(dir);

  await pfs.writeFile(fullpath, enc.encode(content));
  await git.add({ fs, dir: REPO_DIR, filepath });
  await git.commit({
    fs,
    dir: REPO_DIR,
    message,
    author: { name: "soten", email: "soten@local" },
  });
}

async function squashMergeToMain(branch: string, message: string): Promise<void> {
  const { git } = await getGit();

  const branchCommit = await git.resolveRef({ fs, dir: REPO_DIR, ref: branch });
  const { commit } = await git.readCommit({ fs, dir: REPO_DIR, oid: branchCommit });
  const tree = commit.tree;

  await git.checkout({ fs, dir: REPO_DIR, ref: "main" });

  const mainHead = await git.resolveRef({ fs, dir: REPO_DIR, ref: "HEAD" });
  const oid = await git.commit({
    fs,
    dir: REPO_DIR,
    message,
    tree,
    parent: [mainHead],
    author: { name: "soten", email: "soten@local" },
  });

  await git.writeRef({ fs, dir: REPO_DIR, ref: "refs/heads/main", value: oid, force: true });
  await git.checkout({ fs, dir: REPO_DIR, ref: "main" });
  await git.deleteBranch({ fs, dir: REPO_DIR, ref: branch });
}

async function deleteBranch(name: string): Promise<void> {
  const { git } = await getGit();
  await git.checkout({ fs, dir: REPO_DIR, ref: "main" });
  await git.deleteBranch({ fs, dir: REPO_DIR, ref: name });
}

async function readFileFromBranch(branch: string, filepath: string): Promise<string | null> {
  const { git } = await getGit();
  try {
    const commitOid = await git.resolveRef({ fs, dir: REPO_DIR, ref: branch });
    const { blob } = await git.readBlob({
      fs,
      dir: REPO_DIR,
      oid: commitOid,
      filepath,
    });
    return new TextDecoder().decode(blob);
  } catch {
    return null;
  }
}

async function listDraftBranches(): Promise<Array<{ timestamp: string; content: string }>> {
  const { git } = await getGit();
  const branches = await git.listBranches({ fs, dir: REPO_DIR });
  const drafts: Array<{ timestamp: string; content: string }> = [];

  for (const branch of branches) {
    if (!branch.startsWith("draft/")) continue;
    const timestamp = branch.slice("draft/".length);
    try {
      const content = await readFileFromBranch(branch, `${timestamp}.md`);
      drafts.push({ timestamp, content: content ?? "" });
    } catch {
      drafts.push({ timestamp, content: "" });
    }
  }

  return drafts;
}

// ---------------------------------------------------------------------------
// Search index
// ---------------------------------------------------------------------------

type IndexDoc = { id: string; title: string; body: string };
const FIELDS = ["title", "body"] as const;
const STORE_FIELDS = ["title"] as const;

let searchIndex: MiniSearch<IndexDoc> | null = null;

const closingFmRe = /\n---(?:\r?\n|$)/;

function findBodyStart(content: string): number {
  if (!content.startsWith("---\n") && !content.startsWith("---\r\n")) return 0;
  const closing = closingFmRe.exec(content);
  return closing !== null ? closing.index + closing[0].length : 0;
}

async function buildDoc(entry: SearchEntry): Promise<IndexDoc | null> {
  const content = await readTextFile(entry.path);
  if (!content) return null;
  const bodyStart = findBodyStart(content);
  return { id: entry.path, title: entry.title, body: content.slice(bodyStart) };
}

async function buildSearchIndex(entries: SearchEntry[]): Promise<void> {
  const docs = (await Promise.all(entries.map(buildDoc))).filter((d): d is IndexDoc => d != null);
  const index = new MiniSearch<IndexDoc>({
    fields: [...FIELDS],
    storeFields: [...STORE_FIELDS],
  });
  index.addAll(docs);
  searchIndex = index;
}

async function updateSearchIndex(
  oldFilenames: string[],
  newFilenames: string[],
  entries: SearchEntry[],
): Promise<void> {
  if (!searchIndex) return;

  const oldSet = new Set(oldFilenames);
  const newSet = new Set(newFilenames);

  for (const path of oldFilenames) {
    if (!newSet.has(path)) searchIndex.discard(path);
  }

  const added = newFilenames.filter((p) => !oldSet.has(p));
  const entryMap = new Map(entries.map((e) => [e.path, e]));
  const addedEntries = added.map((p) => entryMap.get(p)).filter((e): e is SearchEntry => e != null);
  const docs = (await Promise.all(addedEntries.map(buildDoc))).filter(
    (d): d is IndexDoc => d != null,
  );

  for (const doc of docs) {
    searchIndex.add(doc);
  }
}

function search(query: string): string[] {
  if (!searchIndex) return [];
  return searchIndex
    .search(query, { prefix: true, fuzzy: 0.2, boost: { title: 2 } })
    .map((r) => r.id);
}

function clearSearchIndex(): void {
  searchIndex = null;
}

// ---------------------------------------------------------------------------
// Message handler
// ---------------------------------------------------------------------------

self.onmessage = async (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data;
  let result: unknown;

  try {
    switch (msg.type) {
      case "clone":
        await clone(msg.url, msg.user);
        break;
      case "pull":
        await pull(msg.user);
        break;
      case "push":
        await push(msg.user, msg.ref);
        break;
      case "isInitialized":
        result = await isInitialized();
        break;
      case "readRepoFiles":
        result = await readRepoFiles();
        break;
      case "buildSearchIndex":
        await buildSearchIndex(msg.entries);
        break;
      case "updateSearchIndex":
        await updateSearchIndex(msg.oldFilenames, msg.newFilenames, msg.entries);
        break;
      case "search":
        result = search(msg.query);
        break;
      case "clearSearchIndex":
        clearSearchIndex();
        break;
      case "populateFiles":
        await populateFiles(msg.files);
        break;
      case "createBranch":
        await createBranch(msg.name);
        break;
      case "checkoutBranch":
        await checkoutBranch(msg.name);
        break;
      case "commitFile":
        await commitFile(msg.filepath, msg.content, msg.message);
        break;
      case "squashMergeToMain":
        await squashMergeToMain(msg.branch, msg.message);
        break;
      case "deleteBranch":
        await deleteBranch(msg.name);
        break;
      case "listDraftBranches":
        result = await listDraftBranches();
        break;
      case "readFileFromBranch":
        result = await readFileFromBranch(msg.branch, msg.filepath);
        break;
    }

    self.postMessage({ id: msg.id, ok: true, result } satisfies WorkerResponse);
  } catch (err) {
    self.postMessage({
      id: msg.id,
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    } satisfies WorkerResponse);
  }
};
