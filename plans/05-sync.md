# Phase 5: Sync

Add two UI indicators (offline status and git working status) and ensure all local git changes
— both draft branches and main — are pushed to the remote when online.

## Goals

- User always knows when the app is offline
- User always knows when a git operation is in progress
- Draft branches are pushed to remote after each autosave commit
- Main is pushed to remote after each squash merge (save)
- All pushing is automatic and requires no user action

## Offline Indicator

### Existing infrastructure

`src/lib/online.ts` already maintains an `onlineAtom` (Jotai atom, `atom(navigator.onLine)`)
and calls `backgroundSync` when the app comes back online. The current `TopBar.tsx` already
reads `onlineAtom` and shows an "offline" text label.

### Changes

The existing offline indicator in the TopBar is sufficient. Phase 1 rewrote `TopBar` but should
have preserved the offline indicator. Ensure the new TopBar includes:

```tsx
const online = useAtomValue(onlineAtom);
// ...
{!online && <Text variant="meta">offline</Text>}
```

No new atom or component needed. The `onlineAtom` already exists and is reactive.

## Git Working Indicator

### New atom

Add to `src/atoms/store.ts`:

```ts
export const gitWorkingAtom = atom(false);
```

Re-export from `src/atoms/globals.ts`.

### TopBar display

In the new `TopBar.tsx`:

```tsx
const gitWorking = useAtomValue(gitWorkingAtom);
// ...
{gitWorking && <LoadingSpinner size="sm" />}
```

Add a `size` prop to `LoadingSpinner` if it doesn't already have one, or use a small inline
spinner:

```tsx
{gitWorking && (
  <svg className="animate-spin h-4 w-4 text-muted" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10"
            stroke="currentColor" strokeWidth="4" fill="none" />
    <path className="opacity-75" fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
  </svg>
)}
```

### Where to set `gitWorkingAtom`

Wrap git-touching operations with `gitWorkingAtom` updates. Create a helper in
`src/lib/git-status.ts`:

```ts
import { store } from "../atoms/store";
import { gitWorkingAtom } from "../atoms/store";

let activeCount = 0;

export async function withGitWorking<T>(fn: () => Promise<T>): Promise<T> {
  activeCount++;
  store.set(gitWorkingAtom, true);
  try {
    return await fn();
  } finally {
    activeCount--;
    if (activeCount === 0) store.set(gitWorkingAtom, false);
  }
}
```

Uses a counter to handle concurrent git operations (e.g. autosave and background sync
running simultaneously).

### Call sites

Wrap the following operations with `withGitWorking`:

| Call site | Function |
|---|---|
| `src/lib/autosave.ts` | `autosave()` — the `checkoutBranch` + `commitFile` + push |
| `src/lib/draft-operations.ts` | `saveDraft()` — the squash merge + push |
| `src/lib/draft-operations.ts` | `discardDraft()` — the branch delete + push |
| `src/atoms/machine.ts` | `cloneAndLoad()` — clone/pull operations |
| `src/atoms/sync.ts` | `backgroundSync()` — pull + push |
| `src/atoms/draft-recovery.ts` | `recoverDrafts()` — listing branches |
| `src/components/TopBar.tsx` | `handleNewNote()` — createBranch + checkoutBranch |

Example for autosave:

```ts
async function autosave(timestamp: string): Promise<void> {
  // ... existing checks ...
  await withGitWorking(async () => {
    await worker.checkoutBranch(branch);
    await worker.commitFile(filepath, draft.content, "draft: autosave");
    lastSaved.set(timestamp, draft.content);
    await pushIfOnline(branch);
  });
}
```

## Worker: `push`

### New protocol message

Added to `src/worker/protocol.ts`:

```ts
| { id: number; type: "push"; user: { username: string; token: string }; ref?: string }
```

### Worker implementation

New function in `src/worker/repo.worker.ts`:

```ts
async function push(
  user: { username: string; token: string },
  ref?: string,
): Promise<void> {
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
```

Message handler addition:

```ts
case "push":
  await push(msg.user, msg.ref);
  break;
```

### Client method

Added to `src/worker/client.ts`:

```ts
push(user: { username: string; token: string }, ref?: string): Promise<void> {
  return this.call({ type: "push", user, ref }) as Promise<void>;
}
```

## Auto-Push Helper

New file: `src/lib/push.ts`

```ts
import { getRepoWorker } from "../worker/client";
import { store, machineAtom } from "../atoms/store";
import { onlineAtom } from "./online";

/**
 * Push a specific ref to remote if the app is online and a user is available.
 * Silently ignores errors (network failures during push are non-fatal).
 */
export async function pushIfOnline(ref?: string): Promise<void> {
  const online = store.get(onlineAtom);
  if (!online) return;

  const machine = store.get(machineAtom);
  if (machine.phase !== "ready") return;

  const worker = getRepoWorker();
  try {
    await worker.push(machine.user, ref);
  } catch (e) {
    console.debug("push failed (will retry on next sync)", e);
  }
}
```

## Integration with Autosave

Update `src/lib/autosave.ts` — add a push after each successful commit:

```ts
import { pushIfOnline } from "./push";

async function autosave(timestamp: string): Promise<void> {
  const draft = store.get(draftsAtom).find((d) => d.timestamp === timestamp);
  if (!draft) return;
  if (draft.content === lastSaved.get(timestamp)) return;

  const worker = getRepoWorker();
  const branch = `draft/${timestamp}`;
  const filepath = `${timestamp}.md`;

  try {
    await withGitWorking(async () => {
      await worker.checkoutBranch(branch);
      await worker.commitFile(filepath, draft.content, "draft: autosave");
      lastSaved.set(timestamp, draft.content);
      await pushIfOnline(branch);
    });
  } catch (e) {
    console.debug("autosave failed", e);
  }
}
```

## Integration with Save

Update `src/lib/draft-operations.ts` — push main after squash merge:

```ts
import { pushIfOnline } from "./push";

export async function saveDraft(timestamp: string, content: string, isNew: boolean): Promise<void> {
  cancelAutosave(timestamp);

  await withGitWorking(async () => {
    const worker = getRepoWorker();
    const branch = `draft/${timestamp}`;
    const filepath = `${timestamp}.md`;

    await worker.checkoutBranch(branch);
    await worker.commitFile(filepath, content, "draft: autosave");

    const title = extractTitle(content);
    const prefix = isNew ? "add" : "update";
    const message = title ? `${prefix}: ${title}` : `${prefix} note ${timestamp}`;

    await worker.squashMergeToMain(branch, message);
    await pushIfOnline("main");

    // Update app state
    const machine = store.get(machineAtom);
    if (machine.phase === "ready") {
      const oldFilenames = machine.filenames;
      const filenames = await worker.readRepoFiles();
      refreshFs();
      store.set(machineAtom, { ...machine, filenames });
      updateSearchIndex(oldFilenames, filenames, store.get(noteListAtom));
    }
  });

  removeDraft(timestamp);
}
```

## Integration with Discard

Update `src/lib/draft-operations.ts` — delete remote branch after local delete:

```ts
export async function discardDraft(timestamp: string, isNew: boolean): Promise<void> {
  cancelAutosave(timestamp);

  await withGitWorking(async () => {
    const worker = getRepoWorker();
    const branch = `draft/${timestamp}`;

    try {
      await worker.deleteBranch(branch);
    } catch {
      // Branch may not exist
    }

    // Try to delete the remote branch too
    // (push with a delete ref — isomorphic-git supports this via empty ref)
    try {
      await pushIfOnline(`:refs/heads/${branch}`);
    } catch {
      // Remote branch may not exist
    }

    if (isNew) {
      try {
        const { pfs } = await import("../lib/fs");
        const { REPO_DIR } = await import("../lib/constants");
        await pfs.unlink(`${REPO_DIR}/${timestamp}.md`);
      } catch {}
    } else {
      await worker.checkoutBranch("main");
      refreshFs();
    }
  });

  removeDraft(timestamp);
}
```

Note: deleting a remote branch via `git.push` with `:refs/heads/<branch>` as the ref is
standard git protocol. If isomorphic-git doesn't support this syntax, the remote branch can
be left — it will be orphaned but harmless. A future cleanup can prune stale remote branches.

## Coming Back Online

### Updated `src/lib/online.ts`

When the app transitions from offline to online, trigger a full sync that includes pushing:

```ts
import { atom } from "jotai";
import { store, machineAtom } from "../atoms/store";
import { fullSync } from "../atoms/sync";

export const onlineAtom = atom(navigator.onLine);

export function initOnlineListener() {
  window.addEventListener("online", () => {
    store.set(onlineAtom, true);
    const machine = store.get(machineAtom);
    if (machine.phase === "ready") {
      fullSync(machine.user);
    }
  });

  window.addEventListener("offline", () => {
    store.set(onlineAtom, false);
  });
}
```

### Updated `src/atoms/sync.ts`

Rename and extend `backgroundSync` to also push:

```ts
import { fetchCurrentUser, fetchUserRepos } from "../lib/github";
import { refreshFs } from "../lib/fs";
import { getRepoWorker } from "../worker/client";
import { withGitWorking } from "../lib/git-status";
import type { User } from "./store";
import {
  store,
  machineAtom,
  noteListAtom,
  userAtom,
  selectedRepoAtom,
  cachedReposAtom,
} from "./store";
import { draftsAtom } from "./drafts";
import { updateSearchIndex } from "./search";

let syncing = false;

export async function fullSync(user: User): Promise<void> {
  if (syncing) return;
  syncing = true;

  try {
    await withGitWorking(async () => {
      if (store.get(machineAtom).phase !== "ready") return;

      // Existing: validate user, check repos
      const currentUser = await fetchCurrentUser(user.token);
      if (!currentUser?.login) {
        if (store.get(machineAtom).phase === "ready") {
          store.set(userAtom, null);
          store.set(machineAtom, { phase: "unauthenticated", authError: null });
        }
        return;
      }

      // Existing: update cached repos
      const repos = await fetchUserRepos(user.installationId, user.token);
      if (repos) {
        store.set(cachedReposAtom, repos);
        const selectedRepo = store.get(selectedRepoAtom);
        if (selectedRepo && !repos.includes(`${selectedRepo.owner}/${selectedRepo.repo}`)) {
          if (store.get(machineAtom).phase === "ready") {
            store.set(machineAtom, { phase: "selectingRepo", user, repos });
          }
          return;
        }
      }

      const worker = getRepoWorker();

      // NEW: Push all draft branches
      const drafts = store.get(draftsAtom);
      for (const draft of drafts) {
        try {
          await worker.push(user, `draft/${draft.timestamp}`);
        } catch {
          // Individual branch push failures are non-fatal
        }
      }

      // NEW: Push main
      try {
        await worker.push(user, "main");
      } catch {
        // Non-fatal
      }

      // Existing: pull
      try {
        await worker.pull(user);
      } catch {
        return;
      }

      // Existing: update filenames
      const filenames = await worker.readRepoFiles();
      refreshFs();
      const machine = store.get(machineAtom);
      if (machine.phase === "ready") {
        const oldFilenames = machine.filenames;
        store.set(machineAtom, { ...machine, filenames });
        updateSearchIndex(oldFilenames, filenames, store.get(noteListAtom));
      }
    });
  } catch {
    // Network errors during background sync are silently ignored
  } finally {
    syncing = false;
  }
}

// Keep backward compatibility — backgroundSync still called from init.ts
export const backgroundSync = fullSync;
```

## File change summary

| File | Action |
|---|---|
| `src/atoms/store.ts` | Add `gitWorkingAtom` |
| `src/atoms/globals.ts` | Re-export `gitWorkingAtom` |
| `src/lib/git-status.ts` | New — `withGitWorking` helper |
| `src/lib/push.ts` | New — `pushIfOnline` helper |
| `src/lib/autosave.ts` | Wrap in `withGitWorking`, add `pushIfOnline` after commit |
| `src/lib/draft-operations.ts` | Wrap in `withGitWorking`, add `pushIfOnline` after save/discard |
| `src/lib/online.ts` | Call `fullSync` instead of `backgroundSync` on reconnect |
| `src/atoms/sync.ts` | Extend to push drafts + main before pulling |
| `src/worker/protocol.ts` | Add `push` message type |
| `src/worker/repo.worker.ts` | Add `push` handler function |
| `src/worker/client.ts` | Add `push` client method |
| `src/components/TopBar.tsx` | Add git working spinner, ensure offline indicator preserved |
| `src/components/TopBar.tsx` | Wrap `handleNewNote` in `withGitWorking` |

## What does not change

- The existing CORS proxy (`/api/cors-proxy`)
- Auth token usage pattern
- All Phase 1–4 functionality (only additive changes)
- Clone and pull worker operations (existing)
- The `onlineAtom` definition and location
