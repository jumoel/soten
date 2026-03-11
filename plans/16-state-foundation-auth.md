# Phase 1: State Foundation + Auth Shell

Get a user from unauthenticated to "repo cloned, ready" with minimal UI. Only create the atoms this phase needs - other domain atoms are created in their respective phases.

Parent plan: [14-frontend-redesign-overview.md](./14-frontend-redesign-overview.md)
Depends on: [15-design-system.md](./15-design-system.md)

---

## State Atoms (this phase only)

- `state/auth.ts` - token, user info, auth state enum (unauthenticated, authenticating, authenticated, error)
- `state/repo.ts` - repo config (owner, name, url, default branch), clone status
- `state/ui.ts` - theme mode (light/dark/system). Split ratios and reference pane state added in later phases.

Other atom files (`notes`, `editor`, `search`, `sync`) are created in the phases that need them (2, 3, 2, 3 respectively).

---

## Theme Side Effect

The theme atom reads from localStorage. A `useEffect` in the root component syncs the atom value to `document.documentElement.dataset.theme` so CSS custom properties respond. This is the only place a Jotai atom directly manipulates the DOM.

---

## Worker Integration

- Rewrite `applyRepoState` to target the new atom structure. This function is load-bearing for every subsequent phase - it reconciles worker-returned state snapshots into main-thread atoms.
- Start with a minimal version that handles clone results. Expand it as atoms are added in later phases.
- Worker client (`src/worker/client.ts`) is reused as-is.

---

## Auth Flow

1. App boots, checks localStorage for existing token
2. If no token: show login button (Button primary)
3. Login button calls `redirectToGitHubAuth()` (reused from `src/lib/github.ts`)
4. OAuth callback redirects back with hash fragment (token + user info)
5. Hash parsed, auth atoms updated, token validated via `fetchCurrentUser()`
6. `fetchUserRepos()` retrieves available repos
7. Single repo: auto-select, begin clone
8. Multiple repos: show repo selection UI (Stack of Cards)
9. Clone via worker, `applyRepoState` confirms ready state

---

## Routing

- `src/lib/router.ts` - pure function `parseHash(hash: string): Route`
- Route type includes query parameters:
  ```
  type Route =
    | { view: 'home'; query?: string }
    | { view: 'note'; path: string; draft?: string }
    | { view: 'settings' }
  ```
- `routeAtom` derived from `window.location.hash` + `window.location.search`, updates on `hashchange`
- Query params `?q=` and `?draft=` parsed here, available to consuming phases

---

## Migration Strategy

This is a hard cut from the old atom structure. The old `src/atoms/` directory is deleted. Every import in the app breaks and is rewired in subsequent phases. The app will not fully function until Phase 2 builds the browser view - Phase 1's "Done When" only requires auth + clone to work.

---

## Minimal UI

Just enough to complete the auth flow:

- Login screen: centered Card with GitHub login Button
- Loading state: Spinner while cloning
- Repo selection: Stack of Cards if multiple repos
- Error state: Alert for auth failures
- Ready state: placeholder confirming note count

All composed from Phase 0 primitives.

---

## Done When

- Auth flow works end-to-end: login -> OAuth -> clone -> ready
- Repo selection works for multi-repo users
- `applyRepoState` correctly handles clone results
- Hash router parses all route types including query parameters (`?q=`, `?draft=`)
- Theme atom reads from localStorage and applies `data-theme` attribute via useEffect
- App builds and type-checks (lint, types, build all pass)
- Old `src/atoms/` directory is deleted
