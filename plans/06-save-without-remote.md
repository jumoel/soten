# Plan 06: Save works without a git remote

## Problem

When using `?localRepo=` (or any repo with no `origin` configured), clicking Save or typing in the editor triggers autosave, which calls `pushIfOnline()`. The error `"Could not find origin/draft/<timestamp>"` escapes and aborts the entire save — the local `checkoutBranch` → `commitFile` → `squashMergeToMain` steps never run. The note is never committed.

## Goal

- Local commit + squash-merge succeeds unconditionally — a missing remote never aborts it.
- Push is skipped entirely when no remote is configured.
- No artificial delay; `withGitWorking` duration is determined by real local operations.

---

## Step 1 — Add `hasRemote` to the worker protocol

### `src/worker/protocol.ts:5-28`

Add a new union member to `WorkerRequest` (after line 27, before the closing semicolon):

```ts
  | { id: number; type: "hasRemote" }
```

The response `result` is `boolean`.

### `src/worker/repo.worker.ts`

**New function** — add after `isInitialized()` (after line 102):

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

**Dispatch** — add a case in the `switch` block (after the `isInitialized` case at line 358):

```ts
      case "hasRemote":
        result = await hasRemote();
        break;
```

### `src/worker/client.ts`

Add a method to `RepoWorkerClient` (after `isInitialized()` at line 46):

```ts
  hasRemote(): Promise<boolean> {
    return this.call({ type: "hasRemote" }) as Promise<boolean>;
  }
```

---

## Step 2 — Add `hasRemote` to the `ready` phase of `AppMachine`

### `src/atoms/store.ts:40-46`

Change the `ready` variant from:

```ts
  | {
      phase: "ready";
      user: User;
      repos: string[];
      selectedRepo: Repo;
      filenames: string[];
    }
```

to:

```ts
  | {
      phase: "ready";
      user: User;
      repos: string[];
      selectedRepo: Repo;
      filenames: string[];
      hasRemote: boolean;
    }
```

### Test files that construct `phase: "ready"` objects

These must also include the new `hasRemote` field to satisfy the type.

**`src/atoms/store.test.ts:17-23`** — add `hasRemote: true` to `baseReady`:

```ts
const baseReady: Extract<AppMachine, { phase: "ready" }> = {
  phase: "ready",
  user: baseUser,
  repos: ["acme/notes"],
  selectedRepo: { owner: "acme", repo: "notes" },
  filenames: [],
  hasRemote: true,
};
```

**`src/atoms/machine.test.ts:116-122`** — add `hasRemote: true`:

```ts
store.set(machineAtom, {
  phase: "ready",
  user: mockUser,
  repos: ["acme/notes"],
  selectedRepo: { owner: "acme", repo: "notes" },
  filenames: [],
  hasRemote: true,
});
```

---

## Step 3 — Set `hasRemote` when entering the `ready` phase

There are three call sites that transition the machine to `phase: "ready"`. Each must call `worker.hasRemote()` and include the result.

### `src/atoms/machine.ts:163-167`

Change:

```ts
const filenames = await worker.readRepoFiles();
checkAborted();

refreshFs();
store.set(machineAtom, { phase: "ready", user, repos, selectedRepo, filenames });
```

to:

```ts
const filenames = await worker.readRepoFiles();
checkAborted();

const hasRemote = await worker.hasRemote();
checkAborted();

refreshFs();
store.set(machineAtom, { phase: "ready", user, repos, selectedRepo, filenames, hasRemote });
```

### `src/atoms/init.ts:98-107`

Change:

```ts
  if (selectedRepo && cachedRepos && (await worker.isInitialized())) {
    const filenames = await worker.readRepoFiles();
    refreshFs();
    store.set(machineAtom, {
      phase: "ready",
      user,
      repos: cachedRepos,
      selectedRepo,
      filenames,
    });
```

to:

```ts
  if (selectedRepo && cachedRepos && (await worker.isInitialized())) {
    const filenames = await worker.readRepoFiles();
    const hasRemote = await worker.hasRemote();
    refreshFs();
    store.set(machineAtom, {
      phase: "ready",
      user,
      repos: cachedRepos,
      selectedRepo,
      filenames,
      hasRemote,
    });
```

### `src/atoms/init.local.ts:29-35`

The localRepo path populates files via fetch, not via git clone — there is no git remote. Hard-code `hasRemote: false`:

```ts
store.set(machineAtom, {
  phase: "ready",
  user: { username: "local", token: "no-token", installationId: "0", email: "local@test" },
  repos: [`local/${repoName}`],
  selectedRepo: { owner: "local", repo: repoName },
  filenames,
  hasRemote: false,
});
```

Note: `init.local.ts` doesn't use `worker.hasRemote()` because the local dev path populates files into LightningFS without a real git clone — there is no `.git/config` with remote entries. The value is always `false`.

---

## Step 4 — Guard `pushIfOnline` with the `hasRemote` flag

### `src/lib/push.ts:5-18`

Change:

```ts
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

to:

```ts
export async function pushIfOnline(ref?: string): Promise<void> {
  const online = store.get(onlineAtom);
  if (!online) return;

  const machine = store.get(machineAtom);
  if (machine.phase !== "ready") return;
  if (!machine.hasRemote) return;

  const worker = getRepoWorker();
  try {
    await worker.push(machine.user, ref);
  } catch (e) {
    console.debug("push failed (will retry on next sync)", e);
  }
}
```

The single added line (`if (!machine.hasRemote) return;`) prevents any push attempt from reaching the worker when no remote is configured, making the save flow robust to the missing-remote case.

---

## Step 5 — Verify

### With `test-notes` (no remote)

1. Start dev servers: `npm run dev` and `npm run dev:proxy`.
2. Load `http://localhost:5173/?localRepo=../test-notes`.
3. Click "+ New note", type content, click Save.
4. **Expected:** spinner appears briefly, editor closes, note appears in the list.
5. Console should show no `"Could not find origin"` errors.
6. Run `git -C ../test-notes log --oneline` — the saved note should appear as a commit on `main`.

### With a GitHub-backed repo

1. Log in normally and select a repo.
2. Save a note.
3. **Expected:** spinner appears, push runs, note commits to both local and remote.

---

## Summary of changes

| File                                | Change                                                   |
| ----------------------------------- | -------------------------------------------------------- |
| `src/worker/protocol.ts:28`         | Add `{ id; type: "hasRemote" }` to `WorkerRequest` union |
| `src/worker/repo.worker.ts:102+`    | Add `hasRemote()` function + dispatch case               |
| `src/worker/client.ts:46+`          | Add `hasRemote()` client method                          |
| `src/atoms/store.ts:40-46`          | Add `hasRemote: boolean` to `ready` phase                |
| `src/atoms/machine.ts:163-167`      | Call `worker.hasRemote()`, pass to machine               |
| `src/atoms/init.ts:98-107`          | Call `worker.hasRemote()`, pass to machine               |
| `src/atoms/init.local.ts:29-35`     | Hard-code `hasRemote: false`                             |
| `src/lib/push.ts:10+`               | Add `if (!machine.hasRemote) return;` guard              |
| `src/atoms/store.test.ts:17-23`     | Add `hasRemote: true` to test fixture                    |
| `src/atoms/machine.test.ts:116-122` | Add `hasRemote: true` to test fixture                    |

## What is NOT in scope

- Showing a "no remote" badge or indicator in the UI — the app works correctly without it.
- Reconnecting or adding a remote — that is a settings-level concern.
- Retrying failed pushes with backoff — `pushIfOnline` already logs failures and the next sync picks them up.
