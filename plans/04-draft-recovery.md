# Phase 4: Draft Recovery

On app load, scan the git repo for `draft/*` branches and restore any found drafts into the
tray. This means a draft survives browser tab closes, crashes, and device switches (once the
branch has been pushed — see Phase 5).

## Goals

- No draft is ever silently lost
- Recovered drafts appear as minimized tray entries on load
- User can restore, save, or discard recovered drafts

## Init Sequence Change

### Current init sequence (after Phase 1–3)

The init path in `src/atoms/init.ts` for a returning user with a cached repo:

```ts
// (abbreviated from init.ts)
const worker = getRepoWorker();
if (selectedRepo && cachedRepos && (await worker.isInitialized())) {
  const filenames = await worker.readRepoFiles();
  refreshFs();
  store.set(machineAtom, { phase: "ready", user, repos: cachedRepos, selectedRepo, filenames });
  buildSearchIndex(store.get(noteListAtom));
  backgroundSync(user);
  return;
}
```

### Updated init sequence

Insert `recoverDrafts()` between setting `machineAtom` to `ready` and `backgroundSync`:

```ts
const worker = getRepoWorker();
if (selectedRepo && cachedRepos && (await worker.isInitialized())) {
  const filenames = await worker.readRepoFiles();
  refreshFs();
  store.set(machineAtom, { phase: "ready", user, repos: cachedRepos, selectedRepo, filenames });
  buildSearchIndex(store.get(noteListAtom));
  await recoverDrafts(filenames);   // ← new
  backgroundSync(user);
  return;
}
```

The same insertion applies to the `cloneAndLoad` path in `src/atoms/machine.ts` — after the
machine reaches `ready`, call `recoverDrafts`.

### `recoverDrafts` function

New file: `src/atoms/draft-recovery.ts`

```ts
import { getRepoWorker } from "../worker/client";
import { store } from "./store";
import { draftsAtom } from "./drafts";
import { REPO_DIR } from "../lib/constants";

/**
 * Scans for draft/* branches and populates the drafts atom with
 * minimized entries for each found branch.
 */
export async function recoverDrafts(filenames: string[]): Promise<void> {
  const worker = getRepoWorker();

  let branches: Array<{ timestamp: string; content: string }>;
  try {
    branches = await worker.listDraftBranches();
  } catch {
    return; // If listing fails, silently skip recovery
  }

  if (branches.length === 0) return;

  // Build a set of existing filenames on main for isNew detection
  const existingFiles = new Set(filenames);

  const recoveredDrafts = branches.map(({ timestamp, content }) => {
    const filePath = `${REPO_DIR}/${timestamp}.md`;
    const isNew = !existingFiles.has(filePath);

    return {
      timestamp,
      content,
      isNew,
      minimized: true,
    };
  });

  // Merge with any drafts that may already be in the atom
  // (shouldn't happen on init, but defensive)
  store.set(draftsAtom, (prev) => {
    const existingTimestamps = new Set(prev.map((d) => d.timestamp));
    const newDrafts = recoveredDrafts.filter(
      (d) => !existingTimestamps.has(d.timestamp),
    );
    return [...prev, ...newDrafts];
  });
}
```

### `init.local.ts` update

The local-repo init path in `src/atoms/init.local.ts` also calls `recoverDrafts` for
consistency, though it will find no branches in a local test repo:

```ts
// After buildSearchIndex:
await recoverDrafts(filenames);
```

## Worker: `listDraftBranches`

Already implemented in Phase 2. The worker function:

1. Calls `git.listBranches({ fs, dir: REPO_DIR })`
2. Filters for branches starting with `draft/`
3. For each, reads the file content from the tip of the branch using `readFileFromBranch`
4. Returns `Array<{ timestamp: string; content: string }>`

No changes needed to the worker for Phase 4.

## Determining New vs Existing

For each recovered draft, check whether `<REPO_DIR>/<timestamp>.md` exists in the `filenames`
array passed to `recoverDrafts`. This array comes from `readRepoFiles()` which reads the
working directory (main branch state).

- If the path is in `filenames`: this is an edit of an existing note (`isNew: false`)
- If not: this is a new note in progress (`isNew: true`)

This is reliable because `readRepoFiles()` runs before `recoverDrafts()` and reads from main.

## Restoring to the Tray

Each recovered branch becomes a `Draft` entry in `draftsAtom` with `minimized: true`. The
`DraftTray` component (Phase 2) renders them exactly as it does any other minimized draft.

The user can:
- Click a tray entry to restore the editor (same as Phase 2's `restoreDraft`)
- Click `×` to discard the draft (same as Phase 2's `discardDraft`)
- Click save from inside the editor (same as Phase 2's `saveDraft`)

### URL behavior

Recovered drafts do **not** set `?draft` in the URL on load. They appear silently in the tray.
The URL only gains `?draft=<timestamp>` when the user explicitly restores a draft.

## Edge Cases

### Branch exists but file is empty

The autosave may not have fired before the tab closed. `readFileFromBranch` returns `null` or
an empty string. The draft is restored with `content: ""` — the user sees an empty editor and
can discard it.

### Branch exists but has no commits beyond the branch point

The branch was created but no `commitFile` happened. `readFileFromBranch` may fail or return
`null`. Same handling: restore with `content: ""`.

### Draft branch for a note that was since deleted on another device

The file won't be in `filenames`, so `isNew: true`. The user can save it (re-creating the file)
or discard it.

### Draft branch already open (shouldn't happen on init)

The `existingTimestamps` check in `recoverDrafts` prevents duplicates.

## File change summary

| File | Action |
|---|---|
| `src/atoms/draft-recovery.ts` | New — `recoverDrafts` function |
| `src/atoms/init.ts` | Add `recoverDrafts(filenames)` call after machine reaches ready |
| `src/atoms/machine.ts` | Add `recoverDrafts(filenames)` call at end of `cloneAndLoad` |
| `src/atoms/init.local.ts` | Add `recoverDrafts(filenames)` call for consistency |

## What does not change

- The `Draft` type and `draftsAtom` from Phase 2
- The `DraftTray` UI from Phase 2
- All worker git operations (all added in Phase 2)
- The `listDraftBranches` worker function (added in Phase 2)
- Save, discard, and autosave logic
