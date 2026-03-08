# Phase 4: Draft Recovery

On app load, scan the git repo for `draft/*` branches and restore any found drafts into the
tray. This means a draft survives browser tab closes, crashes, and device switches (once the
branch has been pushed — see Phase 5).

## Goals

- No draft is ever silently lost
- Recovered drafts appear as minimized tray entries on load
- User can restore, save, or discard recovered drafts

## Init Sequence Change

The current init sequence (in `init.ts`) after the repo is confirmed initialized:

1. `readRepoFiles()` — build file list
2. `refreshFs()` — refresh the in-memory fs view
3. Set `machineAtom` to `ready`
4. `buildSearchIndex()`
5. `backgroundSync()`

Phase 4 inserts a step between 1 and 2:

1. `readRepoFiles()`
2. **`listDraftBranches()`** — scan for `draft/*` branches → populate draft tray
3. `refreshFs()`
4. Set `machineAtom` to `ready`
5. `buildSearchIndex()`
6. `backgroundSync()`

The same applies to the local-repo init path in `init.local.ts` (no-op since there are no
branches in the local test repo, but the call should still be made for consistency).

## Worker: `listDraftBranches`

New worker message. Uses `git.listBranches({ fs, dir: REPO_DIR })` to get all local branches,
filters for those matching `draft/*`, and for each:

1. Reads the file content from the tip of that branch
2. Returns an array of `{ timestamp: string; content: string }` objects

The timestamp is extracted from the branch name: `draft/<timestamp>` → `<timestamp>`.

## Determining New vs Existing

For each recovered draft, check whether `<REPO_DIR>/<timestamp>.md` exists on the main branch:

- If it exists on main: this is an edit of an existing note (`isNew: false`)
- If it does not: this is a new note in progress (`isNew: true`)

This check uses `git.readBlob` or simply checking the file list from `readRepoFiles()` (which
reads from the working directory / main state).

## Restoring to the Tray

Each recovered branch becomes a `Draft` entry in `draftsAtom` with `minimized: true`. The tray
renders them as it would any other minimized draft.

The `?draft` URL param is not set for recovered drafts on load — they appear in the tray without
polluting the URL until the user explicitly opens one.

## Edge Cases

**Branch exists but file is empty**: the autosave may not have fired yet before the tab closed.
Restore with empty content — the user can discard if they don't want it.

**Branch exists but has no commits beyond the branch point**: treat as an empty draft, same as
above.

**Multiple draft branches for the same timestamp**: should not occur (branch creation is
idempotent per timestamp), but if found, use the one with the most recent commit.

## What Does Not Change

- The `Draft` type and `draftsAtom` from Phase 2/3
- The tray UI from Phase 2
- All worker git operations beyond the new `listDraftBranches` message
