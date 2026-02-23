# Plan: Refactor State Management to a State Machine

## Problem

The current state management uses 11 independent Jotai atoms (`appStateAtom`, `authStateAtom`,
`appViewAtom`, `repoReadyAtom`, `userAtom`, `reposAtom`, `selectedRepoAtom`,
`repoFilenamesAtom`, `filesAtom`, `currentPathAtom`, `errorAtom`) combined with an event
dispatch system. This creates several issues:

1. **Implicit states** — The actual app state is a composite of several atoms. For example,
   "show the repo selector" requires `authState === Authenticated && repos.length > 0 &&
!selectedRepo`. This is a real, distinct app state, but it's never named or modeled
   explicitly.

2. **No transition guards** — Any event can be dispatched from any state. Nothing prevents
   `FetchRepoFiles` from firing when unauthenticated, or `ShowNote` before files are loaded.
   Handlers defend against this with null checks, but there's no structural enforcement.

3. **Scattered context** — Data that belongs to a state (user, repos, files) lives in separate
   atoms that can be stale or inconsistent relative to the logical state. `handleLogout` must
   manually reset 9 atoms to avoid stale data leaking across states.

4. **Render logic re-derives state** — `app.tsx` reads 8 atoms and uses conditional logic to
   figure out what to show. The rendering code is essentially re-deriving a state machine that
   should be explicit.

## Solution: Single Discriminated Union State

Replace the scattered atoms with one `appStateAtom` holding a discriminated union. Each variant
carries exactly the data relevant to that state.

### State definition

```typescript
type Repo = { owner: string; repo: string };
type Files = Record<string, TextFile | ImageFile>;
type View = { name: "front" } | { name: "note"; path: string };

type AppMachineState =
  | { name: "initializing" }
  | { name: "unauthenticated"; authError: string | null }
  | { name: "fetchingRepos"; user: User }
  | { name: "selectingRepo"; user: User; repos: string[] }
  | { name: "loadingRepo"; user: User; repo: Repo; repos: string[] }
  | {
      name: "ready";
      user: User;
      repo: Repo;
      repos: string[];
      filenames: string[];
      files: Files;
      view: View;
    }
  | { name: "error"; user: User; message: string };
```

Each state name maps 1:1 to a distinct UI screen/phase. No combining atoms to figure out
what to render — just `switch (state.name)`.

### Transition table

| Current State   | Event                             | Next State         | Side Effect            |
| --------------- | --------------------------------- | ------------------ | ---------------------- |
| initializing    | AUTHENTICATED(user)               | fetchingRepos      | fetchRepos()           |
| initializing    | AUTH_ERROR(message)               | unauthenticated    | —                      |
| initializing    | NO_AUTH                           | unauthenticated    | —                      |
| unauthenticated | AUTHENTICATED(user)               | fetchingRepos      | fetchRepos()           |
| fetchingRepos   | REPOS_LOADED(repos), cached valid | loadingRepo        | cloneOrPull()          |
| fetchingRepos   | REPOS_LOADED(repos), len=1        | loadingRepo        | cloneOrPull()          |
| fetchingRepos   | REPOS_LOADED(repos), len>1        | selectingRepo      | —                      |
| fetchingRepos   | FETCH_ERROR(message)              | error              | —                      |
| selectingRepo   | SELECT_REPO(repo)                 | loadingRepo        | wipeFs + cloneOrPull   |
| loadingRepo     | REPO_READY(filenames, files)      | ready (front view) | —                      |
| loadingRepo     | LOAD_ERROR(message)               | error              | —                      |
| ready           | SHOW_NOTE(path)                   | ready (note view)  | —                      |
| ready           | SHOW_FRONT                        | ready (front view) | —                      |
| ready           | SELECT_REPO(repo)                 | loadingRepo        | wipeFs + cloneOrPull   |
| ready           | SWITCH_REPO                       | selectingRepo      | —                      |
| any (authed)    | LOGOUT                            | unauthenticated    | wipeFs + clear storage |

Invalid transitions (e.g., `SHOW_NOTE` while in `fetchingRepos`) are no-ops with a
console warning — the type system makes these structurally obvious.

### Architecture

```
┌──────────────────────────────────────────────────┐
│                   transition()                    │
│  Pure function: (state, event) → new state        │
│  No side effects. Trivially testable.             │
└──────────────────────────────────────────────────┘
                        ↑
┌──────────────────────────────────────────────────┐
│                    send()                         │
│  1. Calls transition(currentState, event)         │
│  2. Writes new state to appStateAtom              │
│  3. Runs associated side effects (if any)         │
│  4. Side effects dispatch result events back      │
└──────────────────────────────────────────────────┘
                        ↑
┌──────────────────────────────────────────────────┐
│              Components / init()                  │
│  Call send(event) to trigger transitions          │
│  Read appStateAtom and switch on state.name       │
└──────────────────────────────────────────────────┘
```

The `transition()` function is pure — it takes a state and event and returns the next state.
The `send()` function is the imperative wrapper that updates the atom and runs side effects.
Side effects (API calls, git operations, filesystem) are triggered after the state updates,
and their results feed back as new events.

## File-by-file changes

### `src/atoms/store.ts`

- Remove the `AppState`, `AuthState`, `AppView` enums and all their atoms
- Remove `repoReadyAtom`, `repoFilenamesAtom`, `filesAtom`, `currentPathAtom`, `errorAtom`,
  `authErrorAtom`, `reposAtom`, `selectedRepoAtom`
- Keep `userAtom` and `selectedRepoAtom` as `atomWithStorage` for **rehydration only** — read
  during `init()` to restore sessions across page loads, written as a side effect of relevant
  transitions, but never the source of truth for current-state rendering
- Add `AppMachineState` type and the single `appStateAtom`
- Keep `User`, `TextFile`, `ImageFile` type exports (still needed)

### `src/atoms/machine.ts` (new file)

- Define the `AppMachineState` discriminated union type
- Define the `AppEvent` discriminated union type
- Implement `transition(state, event): AppMachineState` — a pure function with a switch on
  `state.name`, then a nested switch on event type. Invalid transitions return the current
  state unchanged (with a console.warn in dev)
- Implement `send(event)` — reads current state from store, calls `transition`, writes new
  state, then runs effects

This is the core of the state machine. It replaces both `events.ts` and `handlers.ts`.

### `src/atoms/effects.ts` (new file, replaces `handlers.ts`)

- Contains async effect functions: `fetchRepos(user)`, `loadRepo(user, repo)`,
  `readAllFiles(filenames)`
- Each effect calls the existing lib functions (`fetchUserRepos`, `git.clone`, `git.pull`,
  `readFile`, etc.) and dispatches result events back via `send()`
- These are the only functions that perform I/O. They're small and focused.

### `src/atoms/events.ts` (remove)

- Replaced by `machine.ts`. The `Event` enum, `dispatch`, `dispatchInternal` all go away.

### `src/atoms/handlers.ts` (remove)

- Replaced by `effects.ts`. The handler functions that mixed state updates with I/O are split:
  state updates happen in `transition()`, I/O happens in `effects.ts`.

### `src/atoms/init.ts`

- Adapt to call `send()` instead of `dispatch()`
- Same logical flow, different event names:
  - `parseAuthError()` → `send({ type: "AUTH_ERROR", message })`
  - `parseOAuthHash()` → `send({ type: "AUTHENTICATED", user })`
  - Cached user valid → `send({ type: "AUTHENTICATED", user })`
  - No user / expired → `send({ type: "NO_AUTH" })`
- The `router()` function calls `send({ type: "SHOW_NOTE", path })` or
  `send({ type: "SHOW_FRONT" })`

### `src/atoms/globals.ts`

- Update re-exports for the new module structure
- Export `send` (replaces `dispatch`)
- Export `AppMachineState` and state-related types

### `src/app.tsx`

- Read a single `appStateAtom` instead of 8 separate atoms
- Replace the nested conditional rendering with a `switch (state.name)`:

```tsx
function App() {
  const [state] = useAtom(appStateAtom);

  switch (state.name) {
    case "initializing":
      return <Initializing />;
    case "unauthenticated":
      return <Unauthenticated authError={state.authError} />;
    case "fetchingRepos":
      return <Layout user={state.user}>Loading repos...</Layout>;
    case "selectingRepo":
      return (
        <Layout user={state.user}>
          <RepoSelector repos={state.repos} />
        </Layout>
      );
    case "loadingRepo":
      return <Layout user={state.user}>Loading {state.repo.repo}...</Layout>;
    case "ready":
      return (
        <Layout user={state.user} repo={state.repo}>
          <ReadyView state={state} />
        </Layout>
      );
    case "error":
      return (
        <Layout user={state.user}>
          <ErrorView message={state.message} />
        </Layout>
      );
  }
}
```

Each branch gets exactly the data it needs from the state variant. No combining atoms, no
derived `needsRepoSelection` booleans.

### `src/components/RepoSelector.tsx`

- Accept `repos` as a prop instead of reading `reposAtom`
- Call `send({ type: "SELECT_REPO", ... })` instead of `dispatch(Event.SelectRepo, ...)`

### `src/components/GitHubAuthButton.tsx`

- No change needed (it just calls `redirectToGitHubAuth()` which triggers an OAuth redirect)

### Test files

- `handlers.test.ts` → becomes `machine.test.ts` (testing `transition` — pure, trivially
  testable) and `effects.test.ts` (testing effect functions with mocked I/O)
- `init.test.ts` → update to use `send` instead of `dispatch`
- Testing `transition()` is significantly easier than the current handlers because it's a
  pure function: give it a state + event, assert the returned state. No mocking needed.

## Key design decisions

1. **No library** — Plain TypeScript discriminated unions + switch statements. The `transition`
   function is ~80 lines of pure logic. No need for XState or similar.

2. **localStorage atoms kept for rehydration only** — `userAtom` and `selectedRepoAtom` stay
   as `atomWithStorage` atoms but are only read during `init()` to restore a session. They're
   written to as a side effect of relevant transitions so they stay in sync, but components
   never read them directly.

3. **Single atom for the UI** — Components read `appStateAtom` and pattern-match on `name`.
   No more combining atoms to figure out what to render.

4. **Effects as convention, not framework** — When `send()` writes the new state, it checks
   if the transition has associated side effects and runs them. This is a simple conditional
   after the state update, not an effect-scheduling system.

5. **Gradual migration possible** — If desired, this can be done incrementally by introducing
   the state machine alongside the existing atoms and migrating one state at a time. However,
   the app is small enough that a single pass is straightforward.

## Implementation order

1. Define types: `AppMachineState`, `AppEvent`, `View`, `Repo` in `machine.ts`
2. Implement `transition()` — pure function, test immediately
3. Implement `send()` — wires transition to the store + effects
4. Move side effects from `handlers.ts` to `effects.ts`
5. Update `init.ts` to use `send()`
6. Update `app.tsx` to read single state atom
7. Update components (`RepoSelector`)
8. Remove old files (`events.ts`, `handlers.ts`, old enums from `store.ts`)
9. Update `globals.ts` re-exports
10. Update tests
11. Run lint/types/style/build checks

## What this does NOT change

- The lib layer (`git.ts`, `fs.ts`, `github.ts`, `config.ts`) — untouched
- The Cloudflare Workers (`functions/`) — untouched
- The markdown pipeline (`markdown.ts`) — untouched
- The overall user-facing behavior — identical
- The hash-based routing mechanism — same events, just different names
