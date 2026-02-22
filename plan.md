# Plan: Add Unit Tests to Soten

## Current State

- No test framework exists — `package.json` has no test-related deps or scripts
- Core logic lives in these files:
  - `src/atoms/handlers.ts` — event handlers with side effects (the "business logic")
  - `src/atoms/init.ts` — initialization/boot logic
  - `src/atoms/events.ts` — dispatch system mapping events to handlers
  - `src/lib/github.ts` — GitHub API calls with branching logic
  - `functions/api/gh-auth/callback.js` — OAuth callback worker
- These files directly import side-effectful modules (`../lib/git`, `../lib/fs`, `../lib/github`), making them hard to test without mocking

## Testability Problems

### 1. Hard-wired imports (solvable without refactor)

handlers.ts directly calls `fetchUserRepos()`, `git.clone()`, `readRepoFiles()`, `wipeFs()`, etc. Vitest's `vi.mock()` can mock these at the module boundary without changing production code.

### 2. Dispatch chaining makes handlers non-isolated

`handleAuthenticated` → `dispatch(FetchAndSelectRepos)` → `handleFetchAndSelectRepos` → `dispatch(SelectRepo)` → ... If dispatch isn't mocked, calling one handler triggers the full chain — that's integration testing, not unit testing. Each handler must be tested in isolation by mocking `./events`'s `dispatch`.

### 3. Circular import between events.ts ↔ handlers.ts requires partial mocking

`handlers.ts` imports `{ dispatch, Event }` from `./events`. `events.ts` imports all handlers from `./handlers`. A naive `vi.mock('./events')` replaces the **entire** module — including the `Event` enum. Test assertions like `expect(dispatch).toHaveBeenCalledWith(Event.SelectRepo, ...)` would then fail because `Event` is `undefined`.

**Solution:** Use a partial mock that preserves the real `Event` enum:
```ts
vi.mock("./events", async (importOriginal) => {
  const actual = await importOriginal<typeof import("./events")>();
  return { ...actual, dispatch: vi.fn() };
});
```

### 4. Top-level side effects in init.ts

`init.ts` runs `await init()` and `window.addEventListener(...)` at module scope (lines 88-90). Importing the module triggers the entire init flow. The logic must be extracted into exported functions so tests can call them individually.

### 5. `globals.ts` re-exports trigger init

`globals.ts` has `import "./init"` which runs the side-effect. **Test files must import from `./store` and `./events` directly, never from `./globals`**, to avoid triggering init.

### 6. Shared singleton store requires careful per-test cleanup

The Jotai `store` and all atoms are module-level singletons — all tests in a file share the same instances. `atomWithStorage` atoms (`userAtom`, `selectedRepoAtom`) both read from and write to `localStorage`. Between tests, we must:
1. Reset every atom to its default via `store.set()`
2. Call `localStorage.clear()` **after** atom resets (because `store.set()` on `atomWithStorage` writes to localStorage)

The specific atoms that need resetting in `beforeEach`:
```ts
store.set(appStateAtom, AppState.Initializing);
store.set(authStateAtom, AuthState.Unauthenticated);
store.set(appViewAtom, AppView.Front);
store.set(errorAtom, null);
store.set(authErrorAtom, null);
store.set(userAtom, null);
store.set(reposAtom, []);
store.set(selectedRepoAtom, null);
store.set(repoFilenamesAtom, []);
store.set(filesAtom, {});
store.set(repoReadyAtom, false);
store.set(currentPathAtom, "/");
localStorage.clear();
```

---

## Plan

### Step 1: Add Vitest + jsdom

Install `vitest` and `jsdom` as devDependencies. Vitest integrates natively with Vite (already used) and supports ESM, TypeScript, and `vi.mock()` out of the box. `jsdom` is required for the browser-like test environment (handlers use `window.location`, `localStorage`).

**Changes:**
- `npm install -D vitest jsdom`
- Add `"test": "vitest run"` to `package.json` scripts
- Add `/// <reference types="vitest" />` and a `test` config block to `vite.config.ts`:
  ```ts
  test: {
    environment: "jsdom",
    clearMocks: true,   // clears call history between tests, keeps mock implementations
  }
  ```
  Note: `clearMocks: true` (not `restoreMocks: true`). `restoreMocks` calls `.mockRestore()` which removes mock implementations from `vi.fn()` created inside `vi.mock()` factories, breaking subsequent tests in the same file. `clearMocks` only resets call counts and arguments.

### Step 2: Refactor `src/atoms/init.ts` — extract testable functions

The file currently runs `await init()` and `window.addEventListener(...)` as top-level side effects. This makes it un-importable in tests.

**Refactor:**
- Export `parseOAuthHash`, `parseAuthError`, `init`, and `router` as named exports
- Move the two side-effect lines (`window.addEventListener` + `await init()`) into a new `src/atoms/init.run.ts` that imports and calls them:
  ```ts
  import { init, router } from "./init";
  window.addEventListener("hashchange", router);
  await init();
  ```
- Update `src/atoms/globals.ts` to import `./init.run` instead of `./init`
- No behavior change — just decoupling "definition" from "execution"

### Step 3: Write unit tests for `src/atoms/handlers.ts`

File: `src/atoms/handlers.test.ts`

All test functions explicitly import from `'vitest'` — do NOT use Vitest globals. This avoids ESLint "no-undef" errors without any config changes:
```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
```

Mock boundaries (via `vi.mock()`):
- `../lib/github` → mock `fetchUserRepos`
- `../lib/git` → mock `clone`, `pull`, `isInitialized`
- `../lib/fs` → mock `wipeFs`, `readRepoFiles`, `readFile`
- `./events` → **partial mock** preserving `Event` enum, only replacing `dispatch` with `vi.fn()` (see Testability Problem #3)

Before each test: reset all atoms + `localStorage.clear()` (see Testability Problem #6).

**Test cases:**

1. **`handleAuthenticated`** — sets `userAtom` and `authStateAtom` to Authenticated, calls `dispatch(Event.FetchAndSelectRepos)`
2. **`handleFetchAndSelectRepos` — single repo** — when `fetchUserRepos` returns `["owner/repo"]`, calls `dispatch(Event.SelectRepo, { owner, repo })`
3. **`handleFetchAndSelectRepos` — multiple repos** — when `fetchUserRepos` returns 2+ repos, sets `reposAtom`, sets `selectedRepoAtom` to null, does NOT call dispatch
4. **`handleFetchAndSelectRepos` — cached repo still valid** — when `selectedRepoAtom` already has a value matching a returned repo, calls `dispatch(Event.FetchRepoFiles)`
5. **`handleFetchAndSelectRepos` — no user** — calls `dispatch(Event.Error, ...)`
6. **`handleFetchAndSelectRepos` — fetch returns null** — calls `dispatch(Event.Error, { message: "Failed to fetch repos" })`
7. **`handleFetchAndSelectRepos` — fetch returns empty** — calls `dispatch(Event.Error, { message: "No repos found" })`
8. **`handleSelectRepo`** — sets `selectedRepoAtom`, clears `repoFilenamesAtom`/`filesAtom`/`repoReadyAtom`, calls `wipeFs()`, calls `dispatch(Event.FetchRepoFiles)`
9. **`handleFetchRepoFiles` — fresh clone** — when `isInitialized()` returns false, calls `git.clone()` with `https://github.com/{owner}/{repo}.git` and user object; asserts `store.get(repoFilenamesAtom)` is set from mocked `readRepoFiles()` return; asserts `dispatch(Event.ReadRepoFilesContent)` called
10. **`handleFetchRepoFiles` — existing repo** — when `isInitialized()` returns true, calls `git.pull()` (not clone), same assertions on filenames and dispatch
11. **`handleFetchRepoFiles` — missing state** — when no `selectedRepoAtom` or `userAtom`, calls `dispatch(Event.Error, ...)`
12. **`handleReadRepoFilesContent` — files read successfully** — pre-set `repoFilenamesAtom` to `["/soten/a.md", "/soten/b.md"]`, mock `readFile` to return content for each; asserts `store.get(filesAtom)` has both entries, `store.get(repoReadyAtom)` is `true`
13. **`handleReadRepoFilesContent` — some files fail** — mock `readFile` to return `null` for one file; asserts that file is filtered out of `filesAtom`
14. **`handleReadRepoFilesContent` — empty file list** — `repoFilenamesAtom` is `[]`; asserts `filesAtom` is `{}`, `repoReadyAtom` is `true`
15. **`handleLogout`** — resets all atoms to defaults, calls `wipeFs()`
16. **`handleShowNote`** — sets `currentPathAtom` to the path and `appViewAtom` to `AppView.Note`
17. **`handleShowFront`** — sets `currentPathAtom` to `"/"` and `appViewAtom` to `AppView.Front`
18. **`handleError`** — sets `errorAtom` to the payload message

### Step 4: Write unit tests for `src/atoms/init.ts`

File: `src/atoms/init.test.ts`

Same conventions: explicit vitest imports, partial mock for `./events`, import from `./store` directly.

Mock boundaries:
- `../lib/github` → mock `fetchCurrentUser`
- `./events` → partial mock (preserve `Event` enum, mock `dispatch`)
- Set `window.location.hash` directly (jsdom supports this), spy on `window.history.replaceState`

**Test cases:**

1. **`parseAuthError`** — hash `#auth_error=something` returns `"something"`; empty hash returns null
2. **`parseOAuthHash`** — hash with all four params (`access_token`, `username`, `email`, `app_install_id`) returns the object; missing any one returns null
3. **`init` — auth error in hash** — sets `authErrorAtom`, calls `replaceState` to clear hash, sets `appStateAtom` to Initialized, does NOT call dispatch
4. **`init` — OAuth params in hash** — dispatches `Event.Authenticated` with parsed params, clears hash, sets Initialized
5. **`init` — returning user with valid token** — pre-set `userAtom` in store, `fetchCurrentUser` returns `{ login: "..." }`, dispatches `Event.Authenticated` with the cached user
6. **`init` — returning user with expired token** — `fetchCurrentUser` returns null, dispatches `Event.Logout`
7. **`init` — no cached user** — dispatches `Event.Logout`, sets Initialized

### Step 5: Write unit tests for `src/lib/github.ts`

File: `src/lib/github.test.ts`

Mock boundary: `vi.spyOn(globalThis, 'fetch')` — cleaner than `vi.stubGlobal` because it auto-restores with `clearMocks`.

**Test cases for `fetchCurrentUser`:**

1. **200 OK** — returns `{ login: "..." }`
2. **401 Unauthorized** — returns `null`
3. **403 Forbidden** — returns `null`
4. **500 Server Error** — throws `"Unexpected status code returned from user endpoint"`

**Test cases for `fetchUserRepos`:**

5. **200 with repos** — returns array of `full_name` strings
6. **200 with empty repositories array** — returns `[]`
7. **Non-OK response** — returns `null`

### Step 6: Write unit tests for the OAuth callback Worker

File: `functions/api/gh-auth/callback.test.js`

**Environment override:** Add `// @vitest-environment node` at the top of the file. The worker doesn't need DOM APIs, and Node 24 provides `Request`, `Response`, `URL`, `URLSearchParams` natively.

Test through the exported `onRequest()` with mock context objects. Use `vi.spyOn(globalThis, 'fetch')` to mock the GitHub API calls.

**Test cases:**

1. **No `code` param** — returns 302 redirect to GitHub OAuth authorize URL with correct `client_id` and `redirect_uri`
2. **Code exchange fails (no access_token)** — redirects with `#auth_error=...`
3. **Code exchange succeeds, app not installed** — redirects to GitHub app installation page
4. **Code exchange succeeds, app installed** — redirects with `#app_install_id=...&access_token=...&username=...&email=...`
5. **Exchange throws** — redirects with `#auth_error=<error.message>`

### Step 7: Add `test` to CI

Update `.github/workflows/checks.yml`:
- Add `test` to the matrix: `tool: [lint, types, style, build, test]`

### Step 8: Run all quality checks

Run `npm run lint`, `npm run types`, `npm run style`, `npm run build`, and `npm run test`. Fix any issues.

---

## Summary of production code changes

| File | Change | Why |
|---|---|---|
| `src/atoms/init.ts` | Export `parseOAuthHash`, `parseAuthError`, `init`, `router`; remove the 2 side-effect lines at bottom | Make init logic importable without triggering it |
| `src/atoms/init.run.ts` | **New file** — 3 lines: import + addEventListener + await init() | Preserve existing boot behavior |
| `src/atoms/globals.ts` | Change `import "./init"` → `import "./init.run"` | Point to the new side-effect entry |
| `package.json` | Add `vitest` + `jsdom` devDeps, add `test` script | Test infrastructure |
| `vite.config.ts` | Add `test` config block with jsdom environment | Vitest environment config |
| `.github/workflows/checks.yml` | Add `test` to matrix | CI |

No changes to handlers.ts, events.ts, store.ts, git.ts, github.ts, or any component files.

## New test files

| File | Tests | Env | Lines (est.) |
|---|---|---|---|
| `src/atoms/handlers.test.ts` | 18 cases | jsdom (default) | ~250 |
| `src/atoms/init.test.ts` | 7 cases | jsdom (default) | ~120 |
| `src/lib/github.test.ts` | 7 cases | jsdom (default) | ~100 |
| `functions/api/gh-auth/callback.test.js` | 5 cases | node (override) | ~120 |

## Key conventions for all test files

1. **Explicit vitest imports** — `import { describe, it, expect, vi, beforeEach } from "vitest"` — never rely on globals (avoids ESLint errors without config changes)
2. **Import from `./store` and `./events`** — never from `./globals` (avoids triggering init side effects)
3. **Partial mocks for `./events`** — preserve `Event` enum, only replace `dispatch`
4. **Full atom reset + `localStorage.clear()`** in `beforeEach` for any test file that touches the store

## What was intentionally excluded

- **React component tests** — App, RepoSelector, GitHubAuthButton are thin UI wrappers. Testing them requires `@testing-library/react` setup and provides low value relative to testing the logic layer.
- **`src/lib/fs.ts` private functions** (`isImage`, `mimeFromFilename`) — trivial switch/lookup functions. Exporting them just for testing is an anti-pattern. They're covered indirectly if `readFile` is ever tested.
- **`src/lib/fs.ts` `readRepoFiles`** — has meaningful logic (recursion, hidden file filtering) but requires deep mocking of the LightningFS instance. Could be added as a follow-up.
- **`src/atoms/events.ts` dispatch routing** — the switch/case mapping is boilerplate; handlers are already tested directly.
