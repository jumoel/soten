# Plan 13: Move domain logic into the web worker

## Problem

The worker exposes low-level git primitives (checkoutBranch, commitFile, push, squashMergeToMain). The main thread orchestrates multi-step transactions across an async boundary, requiring a mutex that was missing until recently. Draft state lives in two places (Jotai atoms and git branches) and can diverge. Push failures are silently swallowed. Draft recovery is a separate init step that causes cross-device conflicts (orphaned remote branches recovered as phantom drafts on other devices).

## Target architecture

The worker exposes high-level domain operations. Each operation is a single message, runs atomically (the worker processes one message at a time via an internal queue), and returns the full current state so the main thread can replace its atoms wholesale.

Key changes from current design:

- **No checkouts during autosave.** Use isomorphic-git's tree/blob APIs to commit directly to a branch ref without changing HEAD or the working directory. The existing `squashMergeToMain` already uses this pattern (explicit `tree` + `parent` parameters).
- **Worker derives `isNew` internally.** The worker checks whether a file exists on main by reading the tree, eliminating the need for the main thread to track this flag.
- **`gatherState()` is smart about what it re-reads.** Autosave only changed a draft branch, so it skips the file list re-read and only re-reads draft refs. Operations that change main do the full read.
- **Sync status is explicit.** Operations return `"synced"` or `"local-only"` so the UI can show sync state instead of just a working spinner.

## Domain operations

### `autosaveDraft(timestamp, content, user, hasRemote, isOnline)`

1. Read current tree from `draft/{timestamp}` branch tip (create branch from main HEAD if it doesn't exist)
2. Write blob for `{timestamp}.md` with new content
3. Build new tree replacing the file blob
4. Commit with explicit tree + parent (draft branch tip), update `refs/heads/draft/{timestamp}`
5. Push draft branch if online (non-fatal)
6. Return `{ state: { filenames: <unchanged>, drafts: <re-read refs> }, syncStatus }`

No checkout. No working directory mutation. Main branch file list unchanged.

### `publishDraft(timestamp, content, message, user, hasRemote, isOnline)`

1. Read current tree from `draft/{timestamp}` branch tip
2. Write blob, build new tree, commit to draft branch (same as autosave)
3. Check if `{timestamp}.md` exists on main tree (determines "add" vs "update" prefix if message not provided)
4. Squash merge: commit with draft's tree, parent = main HEAD, update `refs/heads/main`
5. Checkout main (updates working directory for main-thread reads via LightningFS)
6. Delete draft branch locally
7. Push main + push branch deletion if online (non-fatal)
8. Return `{ state: { filenames: <full re-read>, drafts: <re-read refs> }, syncStatus }`

### `discardDraft(timestamp, user, hasRemote, isOnline)`

1. Check if `{timestamp}.md` exists on main tree
2. Delete `draft/{timestamp}` branch locally
3. If file exists on main: checkout main (restores working directory). If not: unlink file from IndexedDB.
4. Push branch deletion if online (non-fatal)
5. Return `{ state: { filenames: <full re-read>, drafts: <re-read refs> }, syncStatus }`

Note: `isNew` is not a parameter. The worker derives it from git state.

### `sync(user, draftTimestamps)`

1. Push all draft branches (non-fatal per branch)
2. Push main (non-fatal)
3. Pull (non-fatal)
4. Return `{ state: { filenames: <full re-read>, drafts: <re-read refs> }, syncStatus }`

`draftTimestamps` is `string[]` telling the worker which draft branches to push. The caller passes what it has in the drafts atom.

### `domainClone(url, user)`

1. If already initialized: try pull, fall back to wipe + clone
2. If not initialized: clone
3. Return `{ state: { filenames: <full re-read>, drafts: <re-read refs> }, syncStatus: "synced" }`

### `setCorsProxy(value)`

Unchanged from current. Sets the cors proxy variable for local mode.

## Shared types

```typescript
export type RepoState = {
  filenames: string[];
  drafts: Array<{ timestamp: string; content: string }>;
};

export type SyncStatus = "synced" | "local-only";

export type DomainResult = {
  state: RepoState;
  syncStatus: SyncStatus;
};
```

## Implementation steps

Each step leaves the codebase in a passing state (lint/types/build).

### Step 1: Protocol types + worker queue + gatherState

**Files modified:**
- `src/worker/protocol.ts` - Add `RepoState`, `SyncStatus`, `DomainResult` types. Add new domain request types to the `WorkerRequest` union alongside existing ones.
- `src/worker/repo.worker.ts` - Wrap `self.onmessage` in an internal queue (chain each handler onto a promise so operations never interleave). Add `gatherState(opts?: { skipFilenames?: boolean })` helper. When `skipFilenames` is true, return empty filenames array (caller uses its cached value). When false, call `readRepoFiles()`. Always call `listDraftBranches()` for drafts.

**Detail on the worker queue:**

```typescript
let queue: Promise<void> = Promise.resolve();

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const msg = e.data;
  queue = queue.then(async () => {
    // ... existing switch/case logic ...
  }).catch(() => {});
};
```

This replaces the current bare `async` onmessage handler. Each message waits for the previous to complete before executing. The `.catch(() => {})` prevents a failed operation from blocking the queue.

**Detail on gatherState:**

```typescript
async function gatherState(opts?: { skipFilenames?: boolean }): Promise<RepoState> {
  const filenames = opts?.skipFilenames ? [] : await readRepoFiles();
  const drafts = await listDraftBranches();
  return { filenames, drafts };
}
```

Callers that set `skipFilenames: true` are responsible for carrying forward the previous filenames on the main thread side.

**Verify:** lint/types/build pass. No behavior change.

### Step 2: Implement `autosaveDraft` handler

**Files modified:**
- `src/worker/repo.worker.ts` - Add `autosaveDraft` handler. Uses tree/blob APIs (no checkout).
- `src/worker/client.ts` - Add `autosaveDraft` method.

**Worker implementation detail (no-checkout commit):**

```typescript
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
    await git.branch({ fs, dir: REPO_DIR, ref: branch });
    parentOid = mainOid;
  }

  // Read parent tree, write new blob, build new tree
  const { commit: parentCommit } = await git.readCommit({ fs, dir: REPO_DIR, oid: parentOid });
  const enc = new TextEncoder();
  const blobOid = await git.writeBlob({ fs, dir: REPO_DIR, blob: enc.encode(content) });

  // Walk parent tree entries, replace or add the file
  // (use git.writeTree with the modified entries)
  const tree = await buildTreeWithFile(parentCommit.tree, filepath, blobOid);

  const oid = await git.commit({
    fs,
    dir: REPO_DIR,
    message: "draft: autosave",
    tree,
    parent: [parentOid],
    author: { name: "soten", email: "soten@local" },
  });
  await git.writeRef({ fs, dir: REPO_DIR, ref: `refs/heads/${branch}`, value: oid, force: true });

  let syncStatus: SyncStatus = "local-only";
  if (hasRemote && isOnline) {
    try {
      await push(user, branch);
      syncStatus = "synced";
    } catch { /* local-only */ }
  }

  return { state: await gatherState({ skipFilenames: true }), syncStatus };
}
```

A helper `buildTreeWithFile(parentTreeOid, filepath, blobOid)` reads the parent tree entries via `git.readTree`, replaces the entry for `filepath` (or adds it), and writes a new tree via `git.writeTree`. This needs to handle nested paths (split on `/`, walk/create subtrees). For the current note structure (flat files like `1234567890.md`), it's a single-level replacement.

**Verify:** lint/types/build pass. Not called yet.

### Step 3: Implement `publishDraft` handler

**Files modified:**
- `src/worker/repo.worker.ts` - Add `publishDraftHandler`.
- `src/worker/client.ts` - Add `publishDraft` method.

**Logic:**

1. Commit to draft branch (same tree/blob approach as autosave)
2. Check if file exists on main tree to determine add vs update (read main tree, check for filepath entry)
3. Squash merge: `git.commit` with draft tree, parent = main HEAD, write to `refs/heads/main`
4. `git.checkout` main (updates working directory for main-thread LightningFS reads)
5. `git.deleteBranch` draft branch
6. Push main + push `:refs/heads/draft/{timestamp}` if online
7. Return `gatherState()` (full re-read, main changed)

**Verify:** lint/types/build pass. Not called yet.

### Step 4: Implement `discardDraft` handler

**Files modified:**
- `src/worker/repo.worker.ts` - Add `discardDraftHandler`.
- `src/worker/client.ts` - Add `discardDraft` method.

**Logic:**

1. Check if `{timestamp}.md` exists on main tree
2. Delete branch locally (try/catch, may not exist)
3. If file exists on main: `git.checkout` main. If not: `pfs.unlink` the file.
4. Push branch deletion if online
5. Return `gatherState()` (full re-read)

**Verify:** lint/types/build pass. Not called yet.

### Step 5: Implement `sync` handler

**Files modified:**
- `src/worker/repo.worker.ts` - Add `syncHandler`.
- `src/worker/client.ts` - Add `sync` method.

**Logic:** Push all draft branches (non-fatal per branch), push main (non-fatal), pull (non-fatal). Return `gatherState()` + aggregate syncStatus.

**Verify:** lint/types/build pass. Not called yet.

### Step 6: Implement `domainClone` handler

**Files modified:**
- `src/worker/repo.worker.ts` - Add `domainCloneHandler`.
- `src/worker/client.ts` - Add `domainClone` method.

**Logic:** If `isInitialized()`, try pull, fall back to wipe + clone. Else clone. Return `gatherState()`.

**Verify:** lint/types/build pass. Not called yet.

### Step 7: State application helper

**File created:**
- `src/lib/apply-repo-state.ts`

**What it does:**

```typescript
export function applyRepoState(
  state: RepoState,
  opts?: { skipFilenames?: boolean },
): void {
  const machine = store.get(machineAtom);
  if (machine.phase !== "ready") return;

  if (!opts?.skipFilenames) {
    const oldFilenames = machine.filenames;
    store.set(machineAtom, { ...machine, filenames: state.filenames });
    refreshFs();
    updateSearchIndex(oldFilenames, state.filenames, store.get(noteListAtom));
  }

  // Reconcile drafts: remove branches that no longer exist,
  // add new branches as minimized drafts, preserve UI flags for existing
  store.set(draftsAtom, (prev) => {
    const gitTimestamps = new Set(state.drafts.map((d) => d.timestamp));
    const kept = prev.filter((d) => gitTimestamps.has(d.timestamp));
    const existing = new Set(kept.map((d) => d.timestamp));
    const added = state.drafts
      .filter((d) => !existing.has(d.timestamp))
      .map((d) => ({
        timestamp: d.timestamp,
        content: d.content,
        isNew: !state.filenames.some((f) => f.endsWith(`/${d.timestamp}.md`)),
        minimized: true,
      }));
    return [...kept, ...added];
  });
}
```

When `skipFilenames` is true (autosave case), filenames and search index are untouched. Draft reconciliation still runs since draft refs may have changed.

**Verify:** lint/types/build pass. Not called yet.

### Step 8: Migrate autosave

**Files modified:**
- `src/lib/autosave.ts` - Replace `autosave()` body: call `worker.autosaveDraft()`, then `applyRepoState(result.state, { skipFilenames: true })`. Remove `withGitWorking` import and usage.

**Verify:** lint/types/build pass. Functional: edit a note, wait 2s, check draft branch created in git.

### Step 9: Migrate saveDraft

**Files modified:**
- `src/lib/draft-operations.ts` - Replace `saveDraft()` body: call `worker.publishDraft()`, then `applyRepoState(result.state)`. Remove `removeDraft` call (applyRepoState handles it). Remove imports: `withGitWorking`, `pushIfOnline`, `pfs`, `refreshFs`, `REPO_DIR`, `machineAtom`, `noteListAtom`, `updateSearchIndex`.

The `isNew` parameter stays on `saveDraft`'s signature for now (the caller in the UI passes it), but it's only used for the commit message prefix. The worker derives "add" vs "update" internally, so this parameter can be removed once the worker handles the message. Actually, the `extractTitle` + prefix logic can move into the worker too since it receives the content. Decision: keep `extractTitle` on the main thread for now (it's a pure function, not worth moving). Pass the full `message` string to `publishDraft`.

**Verify:** lint/types/build pass. Functional: save a note, check squash merge on main, draft branch deleted.

### Step 10: Migrate discardDraft

**Files modified:**
- `src/lib/draft-operations.ts` - Replace `discardDraft()` body: call `worker.discardDraft()`, then `applyRepoState(result.state)`. Remove `isNew` parameter (worker derives it). Update all callers of `discardDraft` to stop passing `isNew`.

**Verify:** lint/types/build pass. Functional: discard a draft, check branch deleted.

### Step 11: Migrate fullSync

**Files modified:**
- `src/atoms/sync.ts` - Keep GitHub API validation. Replace git portion with `worker.sync(user, draftTimestamps)` + `applyRepoState(result.state)`. Remove `withGitWorking` import.

**Verify:** lint/types/build pass. Functional: go offline, make edits, go online, check sync pushes.

### Step 12: Migrate init flows

**Files modified:**
- `src/atoms/init.local.ts` - Replace `worker.setCorsProxy()` + `worker.clone()` + `worker.readRepoFiles()` with `worker.setCorsProxy()` + `worker.domainClone()`. Use returned state to set machineAtom and build search index.
- `src/atoms/machine.ts` - Replace `cloneAndLoad` git portion with `worker.domainClone()`. Use returned state.
- `src/atoms/init.ts` - Replace "already initialized" fast path with a lightweight state read from worker (add a `getState` message type that just returns `gatherState()`).

**Verify:** lint/types/build pass. Functional: fresh load clones and shows notes. Reload recovers state.

### Step 13: Sync status UI

**Files modified:**
- `src/atoms/store.ts` - Add `syncStatusAtom` of type `"idle" | "working" | "local-only" | "synced"`.
- `src/lib/autosave.ts`, `src/lib/draft-operations.ts`, `src/atoms/sync.ts` - Set `syncStatusAtom` to `"working"` before domain call, to `result.syncStatus` or `"idle"` after.
- `src/components/TopBar.tsx` - Replace `gitWorkingAtom` spinner with `syncStatusAtom` indicator. Show spinner for "working", warning for "local-only", check for "synced", nothing for "idle".

**Verify:** lint/types/build pass. Visual: sync indicator changes state correctly.

### Step 14: Remove dead code

**Files deleted:**
- `src/lib/git-status.ts` - `withGitWorking` no longer used.
- `src/lib/push.ts` - `pushIfOnline` no longer used.
- `src/atoms/draft-recovery.ts` - Replaced by `applyRepoState` reconciliation.

**Files modified:**
- `src/worker/protocol.ts` - Remove old primitive request types: `createBranch`, `checkoutBranch`, `commitFile`, `squashMergeToMain`, `deleteBranch`, `listDraftBranches`, `readFileFromBranch`, `pull`, `push`, `clone`, `readRepoFiles`, `isInitialized`, `hasRemote`, `populateFiles`. Keep: `search`, `buildSearchIndex`, `updateSearchIndex`, `clearSearchIndex`, `setCorsProxy`, and all new domain types.
- `src/worker/repo.worker.ts` - Remove `case` handlers for deleted primitives. Internal functions (`clone`, `pull`, `push`, `checkoutBranch`, etc.) stay as private helpers called by domain handlers.
- `src/worker/client.ts` - Remove methods for deleted primitives.
- `src/atoms/store.ts` - Remove `gitWorkingAtom` (replaced by `syncStatusAtom`).
- `src/atoms/drafts.ts` - Remove `isNew` from draft type if fully derived by worker. Check all usages first.

**Verify:** lint/types/build pass. Grep for any remaining references to deleted exports.

## Risks and mitigations

| Risk | Mitigation |
|------|------------|
| **No-checkout commit complexity** | The `buildTreeWithFile` helper handles single-level paths (current note naming). If nested directories are needed later, extend it to walk subtrees. Test with the existing flat `{timestamp}.md` structure first. |
| **`gatherState` cost** | `autosaveDraft` skips the file list re-read (only draft refs changed). Other operations do the full read. For a notes repo this is fine. Cache if it becomes measurable. |
| **`isNew` removal from drafts atom** | Verify all UI consumers. The only places that need it are `saveDraft` (commit message prefix - worker derives it) and `discardDraft` (file cleanup - worker derives it). The UI doesn't display `isNew` directly. |
| **Migration ordering** | Steps 8-12 can be done in any order since old and new handlers coexist. Each step migrates one caller. If a step breaks, revert just that step. |
