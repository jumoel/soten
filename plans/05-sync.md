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

The existing `online.ts` module fires events when connectivity changes. A new `isOnlineAtom`
(derived from the online listener) drives a small indicator in the top bar.

When offline: a dot or icon appears near the gear icon. It is not alarming — a muted gray or
amber dot is sufficient. No toast, no modal, no blocking UI. The app continues to work fully
offline (reads from LightningFS, autosaves to local branches); pushes are queued and happen
when the app comes back online.

When online: the indicator disappears. If there are pending pushes (branches or main commits
that haven't been pushed yet), they run immediately.

## Git Working Indicator

A small spinner appears in the top bar during any git operation. Driven by a new
`gitWorkingAtom: atom<boolean>`.

Set to `true` before any worker call that touches git (autosave commit, save merge, push, pull).
Set to `false` in the `finally` block after the operation completes or errors.

The spinner is non-blocking — the user can continue interacting with the app while git works.

## Auto-Push

### After autosave commit

After each successful debounced commit to `draft/<timestamp>`:
- If online: push `draft/<timestamp>` to remote
- If offline: no push; the branch will be pushed when the app next comes online

### After save (squash merge to main)

After each successful squash merge:
- If online: push `main` to remote
- If offline: main is ahead of remote; push when online

### Coming back online

The online listener triggers a sync when the app transitions from offline to online:
1. Push any `draft/*` branches that have unpushed commits
2. Push main if it is ahead of remote
3. Pull main (existing background sync behaviour)

This is an extension of `backgroundSync` in `sync.ts`. The pull already happens there; push is
added to the same function.

## Worker: `push`

New worker message. Uses `git.push` with the existing `corsProxy` and auth callback (same
pattern as `clone` and `pull`). Takes an optional `ref` param to push a specific branch; if
omitted, pushes the current branch.

```ts
push(user: { username: string; token: string }, ref?: string): Promise<void>
```

## Tracking Unpushed State

To know which branches need pushing when coming back online, the worker maintains a
`pendingPush: Set<string>` (branch names). After each local commit, the branch name is added.
After a successful push, it is removed. This set is in-memory only (lost on worker restart),
so on app load the init sequence should check for any `draft/*` branches and treat them all as
needing a push attempt.

## Interaction with `backgroundSync`

`backgroundSync` in `sync.ts` currently only pulls. Phase 5 extends it to also push pending
branches and main. The existing silent-error-catch pattern is preserved — network failures
during background sync continue to be ignored.

## What Does Not Change

- The existing pull logic in `backgroundSync`
- The existing CORS proxy (`/api/cors-proxy`)
- Auth token usage pattern
- All Phase 1–4 functionality
