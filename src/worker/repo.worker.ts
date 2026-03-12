import LightningFS from "@isomorphic-git/lightning-fs";
import MiniSearch from "minisearch";
import type {
  DomainResult,
  GitUser,
  RepoState,
  SearchEntry,
  SearchResult,
  SyncStatus,
  WorkerRequest,
  WorkerResponse,
} from "./protocol";

const FILE_SYSTEM_NAME = "fs";
const REPO_DIR = "/soten";

const fs = new LightningFS(FILE_SYSTEM_NAME, { defer: true });
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

let corsProxy: string = "/api/cors-proxy";

// ---------------------------------------------------------------------------
// Low-level git helpers (private to worker)
// ---------------------------------------------------------------------------

async function clone(url: string, user: GitUser): Promise<void> {
  const { git, http } = await getGit();
  await fs.promises.init(FILE_SYSTEM_NAME, { wipe: true });

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
// Tree/blob helpers for no-checkout commits
// ---------------------------------------------------------------------------

async function buildTreeWithFile(
  parentTreeOid: string,
  filepath: string,
  blobOid: string,
): Promise<string> {
  const { git } = await getGit();
  const { tree: entries } = await git.readTree({ fs, dir: REPO_DIR, oid: parentTreeOid });

  const existing = entries.filter((e) => e.path !== filepath);
  const newEntry = { mode: "100644" as const, path: filepath, oid: blobOid, type: "blob" as const };
  const newTree = [...existing, newEntry];

  return await git.writeTree({ fs, dir: REPO_DIR, tree: newTree });
}

async function fileExistsOnMain(filepath: string): Promise<boolean> {
  const { git } = await getGit();
  try {
    const mainOid = await git.resolveRef({ fs, dir: REPO_DIR, ref: "main" });
    const { commit } = await git.readCommit({ fs, dir: REPO_DIR, oid: mainOid });
    const { tree: entries } = await git.readTree({ fs, dir: REPO_DIR, oid: commit.tree });
    return entries.some((e) => e.path === filepath);
  } catch {
    return false;
  }
}

// ---------------------------------------------------------------------------
// Draft branch helpers
// ---------------------------------------------------------------------------

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
// gatherState
// ---------------------------------------------------------------------------

// Module-level conflict state (persists across calls, cleared on successful pull)
let detectedConflicts: Array<{ path: string; remoteContent: string }> = [];

async function detectConflicts(user: {
  username: string;
  token: string;
}): Promise<Array<{ path: string; remoteContent: string }>> {
  const { git, http } = await getGit();
  try {
    // Fetch without merging to get remote state
    await git.fetch({
      fs,
      http,
      dir: REPO_DIR,
      corsProxy,
      singleBranch: true,
      onAuth: () => ({ username: user.username, password: user.token }),
    });

    const localOid = await git.resolveRef({ fs, dir: REPO_DIR, ref: "main" });
    let remoteOid: string;
    try {
      remoteOid = await git.resolveRef({ fs, dir: REPO_DIR, ref: "refs/remotes/origin/main" });
    } catch {
      return []; // No remote tracking branch
    }

    if (localOid === remoteOid) return [];

    const { commit: localCommit } = await git.readCommit({ fs, dir: REPO_DIR, oid: localOid });
    const { commit: remoteCommit } = await git.readCommit({ fs, dir: REPO_DIR, oid: remoteOid });
    const { tree: localEntries } = await git.readTree({ fs, dir: REPO_DIR, oid: localCommit.tree });
    const { tree: remoteEntries } = await git.readTree({
      fs,
      dir: REPO_DIR,
      oid: remoteCommit.tree,
    });

    const localMap = new Map(localEntries.map((e) => [e.path, e.oid]));
    const remoteMap = new Map(remoteEntries.map((e) => [e.path, e.oid]));

    const conflicts: Array<{ path: string; remoteContent: string }> = [];
    for (const [path, remoteOidVal] of remoteMap) {
      const localOidVal = localMap.get(path);
      // File exists in both but differs
      if (localOidVal && localOidVal !== remoteOidVal) {
        try {
          const { blob } = await git.readBlob({ fs, dir: REPO_DIR, oid: remoteOidVal });
          conflicts.push({ path, remoteContent: new TextDecoder().decode(blob) });
        } catch {
          // Skip unreadable blobs
        }
      }
    }
    return conflicts;
  } catch {
    return [];
  }
}

async function gatherState(opts?: { skipFilenames?: boolean }): Promise<RepoState> {
  const filenames = opts?.skipFilenames ? [] : await readRepoFiles();
  const drafts = await listDraftBranches();
  return { filenames, drafts, conflicts: detectedConflicts };
}

// ---------------------------------------------------------------------------
// Domain handlers
// ---------------------------------------------------------------------------

async function autosaveDraftHandler(
  timestamp: string,
  content: string,
  user: { username: string; token: string },
  hasRemote: boolean,
  isOnline: boolean,
): Promise<DomainResult> {
  const { git } = await getGit();
  const branch = `draft/${timestamp}`;
  const filepath = `${timestamp}.md`;

  // Resolve branch tip, or create branch from main HEAD
  let parentOid: string;
  try {
    parentOid = await git.resolveRef({ fs, dir: REPO_DIR, ref: branch });
  } catch {
    const mainOid = await git.resolveRef({ fs, dir: REPO_DIR, ref: "main" });
    parentOid = mainOid;
  }

  // Read parent tree, write new blob, build new tree
  const { commit: parentCommit } = await git.readCommit({ fs, dir: REPO_DIR, oid: parentOid });
  const enc = new TextEncoder();
  const blobOid = await git.writeBlob({ fs, dir: REPO_DIR, blob: enc.encode(content) });
  const tree = await buildTreeWithFile(parentCommit.tree, filepath, blobOid);

  const oid = await git.commit({
    fs,
    dir: REPO_DIR,
    message: "draft: autosave",
    tree,
    parent: [parentOid],
    author: { name: "soten", email: "soten@local" },
  });
  await git.writeRef({
    fs,
    dir: REPO_DIR,
    ref: `refs/heads/${branch}`,
    value: oid,
    force: true,
  });

  let syncStatus: SyncStatus = "local-only";
  if (hasRemote && isOnline) {
    try {
      await push(user, branch);
      syncStatus = "synced";
    } catch {
      /* local-only */
    }
  }

  return { state: await gatherState({ skipFilenames: true }), syncStatus };
}

async function publishDraftHandler(
  timestamp: string,
  content: string,
  message: string,
  user: { username: string; token: string },
  hasRemote: boolean,
  isOnline: boolean,
): Promise<DomainResult> {
  const { git } = await getGit();
  const branch = `draft/${timestamp}`;
  const filepath = `${timestamp}.md`;

  // Commit to draft branch (same tree/blob approach as autosave)
  let parentOid: string;
  try {
    parentOid = await git.resolveRef({ fs, dir: REPO_DIR, ref: branch });
  } catch {
    const mainOid = await git.resolveRef({ fs, dir: REPO_DIR, ref: "main" });
    parentOid = mainOid;
  }

  const { commit: parentCommit } = await git.readCommit({ fs, dir: REPO_DIR, oid: parentOid });
  const enc = new TextEncoder();
  const blobOid = await git.writeBlob({ fs, dir: REPO_DIR, blob: enc.encode(content) });
  const draftTree = await buildTreeWithFile(parentCommit.tree, filepath, blobOid);

  const draftOid = await git.commit({
    fs,
    dir: REPO_DIR,
    message: "draft: autosave",
    tree: draftTree,
    parent: [parentOid],
    author: { name: "soten", email: "soten@local" },
  });
  await git.writeRef({
    fs,
    dir: REPO_DIR,
    ref: `refs/heads/${branch}`,
    value: draftOid,
    force: true,
  });

  // Squash merge: commit with draft's tree, parent = main HEAD
  const mainHead = await git.resolveRef({ fs, dir: REPO_DIR, ref: "main" });
  const squashOid = await git.commit({
    fs,
    dir: REPO_DIR,
    message,
    tree: draftTree,
    parent: [mainHead],
    author: { name: "soten", email: "soten@local" },
  });
  await git.writeRef({
    fs,
    dir: REPO_DIR,
    ref: "refs/heads/main",
    value: squashOid,
    force: true,
  });

  // Checkout main (updates working directory for main-thread LightningFS reads)
  await git.checkout({ fs, dir: REPO_DIR, ref: "main" });

  // Delete draft branch locally
  try {
    await git.deleteBranch({ fs, dir: REPO_DIR, ref: branch });
  } catch {
    // Branch may already be gone
  }

  // Push main + push branch deletion if online
  let syncStatus: SyncStatus = "local-only";
  if (hasRemote && isOnline) {
    let allPushed = true;
    try {
      await push(user, "main");
    } catch {
      allPushed = false;
    }
    try {
      await push(user, `:refs/heads/${branch}`);
    } catch {
      // Remote branch may not exist
    }
    if (allPushed) syncStatus = "synced";
  }

  return { state: await gatherState(), syncStatus };
}

async function discardDraftHandler(
  timestamp: string,
  user: { username: string; token: string },
  hasRemote: boolean,
  isOnline: boolean,
): Promise<DomainResult> {
  const filepath = `${timestamp}.md`;
  const branch = `draft/${timestamp}`;
  const existsOnMain = await fileExistsOnMain(filepath);

  // Delete branch locally
  try {
    const { git } = await getGit();
    // Need to be on main before deleting the branch
    await git.checkout({ fs, dir: REPO_DIR, ref: "main" });
    await git.deleteBranch({ fs, dir: REPO_DIR, ref: branch });
  } catch {
    // Branch may not exist yet
  }

  if (existsOnMain) {
    // Checkout main restores the file from main
    const { git } = await getGit();
    await git.checkout({ fs, dir: REPO_DIR, ref: "main" });
  } else {
    // File doesn't exist on main, remove from IndexedDB
    try {
      await pfs.unlink(`${REPO_DIR}/${filepath}`);
    } catch {
      // File may not exist
    }
  }

  // Push branch deletion if online
  let syncStatus: SyncStatus = "local-only";
  if (hasRemote && isOnline) {
    try {
      await push(user, `:refs/heads/${branch}`);
      syncStatus = "synced";
    } catch {
      // Remote branch may not exist
    }
  }

  return { state: await gatherState(), syncStatus };
}

async function syncHandler(
  user: { username: string; token: string },
  draftTimestamps: string[],
): Promise<DomainResult> {
  let allPushed = true;

  // Push all draft branches (non-fatal per branch)
  for (const ts of draftTimestamps) {
    try {
      await push(user, `draft/${ts}`);
    } catch {
      allPushed = false;
    }
  }

  // Push main (non-fatal)
  try {
    await push(user);
  } catch {
    allPushed = false;
  }

  // Pull (non-fatal). If it fails (non-fast-forward), detect conflicts.
  try {
    await pull(user);
    detectedConflicts = []; // Successful pull clears conflicts
  } catch {
    allPushed = false;
    detectedConflicts = await detectConflicts(user);
  }

  const syncStatus: SyncStatus = allPushed ? "synced" : "local-only";
  return { state: await gatherState(), syncStatus };
}

/** Tracks whether we've ever successfully cloned in this worker session. */
let repoReady = false;

async function domainCloneHandler(url: string, user: GitUser): Promise<DomainResult> {
  if (repoReady) {
    // Warm path: repo already exists in IDB from a previous clone in this session.
    try {
      await pull(user);
    } catch {
      await clone(url, user);
    }
  } else {
    // Cold path: skip the expensive IDB probe and clone directly.
    // clone() calls fs.promises.init({ wipe: true }) which handles any stale state.
    await clone(url, user);
    repoReady = true;
  }

  return { state: await gatherState(), syncStatus: "synced" };
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

function search(query: string): SearchResult[] {
  if (!searchIndex) return [];
  return searchIndex
    .search(query, { prefix: true, fuzzy: 0.2, boost: { title: 2 } })
    .map((r) => ({ path: r.id, score: r.score }));
}

function clearSearchIndex(): void {
  searchIndex = null;
}

// ---------------------------------------------------------------------------
// Message handler (queued - one message at a time)
// ---------------------------------------------------------------------------

let queue: Promise<void> = Promise.resolve();

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data;
  queue = queue
    .then(async () => {
      let result: unknown;

      try {
        switch (msg.type) {
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
          case "setCorsProxy":
            corsProxy = msg.value;
            break;
          case "autosaveDraft":
            result = await autosaveDraftHandler(
              msg.timestamp,
              msg.content,
              msg.user,
              msg.hasRemote,
              msg.isOnline,
            );
            break;
          case "publishDraft":
            result = await publishDraftHandler(
              msg.timestamp,
              msg.content,
              msg.message,
              msg.user,
              msg.hasRemote,
              msg.isOnline,
            );
            break;
          case "discardDraft":
            result = await discardDraftHandler(
              msg.timestamp,
              msg.user,
              msg.hasRemote,
              msg.isOnline,
            );
            break;
          case "sync":
            result = await syncHandler(msg.user, msg.draftTimestamps);
            break;
          case "domainClone":
            result = await domainCloneHandler(msg.url, msg.user);
            break;
          case "getState":
            result = await gatherState();
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
    })
    .catch(() => {});
};
