# Plan 07: Save works without a git remote

## Problem

When using `?localRepo=` (or any repo with no `origin` configured), clicking Save or typing in the editor triggers autosave, which calls `pushIfOnline()`. Even though `pushIfOnline` has a try/catch around `worker.push()`, the error `"Could not find origin/draft/<timestamp>"` escapes the `withGitWorking` block and aborts the entire autosave, including the local `checkoutBranch` → `commitFile` → `squashMergeToMain` steps. The note is never committed.

The root cause is that `git.push()` (or a git operation preceding it inside the worker) throws when no remote is configured, and the error propagates out of `withGitWorking` before `pushIfOnline`'s own try/catch can catch it. This is specific to repos without an `origin` remote.

## Goal

- Local commit + squash-merge succeeds unconditionally — a missing remote never aborts it.
- Push is skipped entirely when no remote is configured (not retried, not errored).
- The git working spinner still appears and disappears naturally from the local git operations (checkout, commit, merge typically take 100–500 ms — enough to show feedback).
- No artificial delay is added; the `withGitWorking` duration is determined by the real local operations.

## Implementation

### Step 1 — Add `hasRemote` to the worker

Add a new worker message type `"hasRemote"` → `boolean` to `src/worker/protocol.ts`:

```ts
// protocol.ts — request
| { type: "hasRemote" }

// protocol.ts — response result: boolean
```

Implement in `src/worker/repo.worker.ts`:

```ts
async function hasRemote(): Promise<boolean> {
  const { git } = await getGit();
  try {
    const remotes = await git.listRemotes({ fs, dir: REPO_DIR });
    return remotes.length > 0;
  } catch {
    return false;
  }
}
```

Add to the dispatch switch:
```ts
case "hasRemote":
  result = await hasRemote();
  break;
```

Add the typed client method in `src/worker/client.ts`:
```ts
hasRemote(): Promise<boolean> { return this.send({ type: "hasRemote" }); }
```

### Step 2 — Store remote availability in `machineAtom`

The `AppMachine` `ready` phase already carries per-session data. Add a `hasRemote: boolean` field:

```ts
// store.ts
| {
    phase: "ready";
    user: User;
    repos: string[];
    selectedRepo: Repo;
    filenames: string[];
    hasRemote: boolean;   // ← new
  }
```

### Step 3 — Set `hasRemote` after repo load

In `src/atoms/machine.ts`, after `cloneAndLoad` sets the machine to `ready`, call `worker.hasRemote()` and include the result:

```ts
const filenames = await worker.readRepoFiles();
const remoteAvailable = await worker.hasRemote();

store.set(machineAtom, {
  phase: "ready",
  user, repos, selectedRepo, filenames,
  hasRemote: remoteAvailable,
});
```

For the localRepo init path (`src/atoms/init.local.ts`), the same pattern applies — call `worker.hasRemote()` before setting the machine to `ready`.

### Step 4 — Guard `pushIfOnline` with the `hasRemote` flag

In `src/lib/push.ts`, read `hasRemote` from the machine before attempting a push:

```ts
export async function pushIfOnline(ref?: string): Promise<void> {
  const online = store.get(onlineAtom);
  if (!online) return;

  const machine = store.get(machineAtom);
  if (machine.phase !== "ready") return;
  if (!machine.hasRemote) return;          // ← new guard

  const worker = getRepoWorker();
  try {
    await worker.push(machine.user, ref);
  } catch (e) {
    console.debug("push failed (will retry on next sync)", e);
  }
}
```

This is the single change that prevents any push attempt from reaching the worker when no remote is configured, making the save flow robust to the missing-remote case.

### Step 5 — Verify with test-notes

After the changes:
1. Load `?localRepo=../test-notes` (no remote).
2. Click "+ New note", type content, click Save.
3. Expected: spinner appears briefly, editor closes, note appears in the list.
4. Console should show no errors.
5. Check `git -C ../test-notes log --oneline` — the saved note should appear as a commit on `main`.

### Step 6 — Verify normal flow still works

With a real GitHub-backed repo (or a local repo that has `origin` set up):
1. Save a note.
2. Expected: spinner appears, push runs, note commits to both local and remote.

## What is NOT in scope

- Showing a "no remote" badge or indicator in the UI — the app works correctly without it.
- Reconnecting or adding a remote — that is a settings-level concern.
- Retrying failed pushes with backoff — `pushIfOnline` already logs failures and the next sync picks them up.
