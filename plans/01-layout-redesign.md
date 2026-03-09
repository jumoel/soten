# Phase 1: Layout Redesign

Replace the current top-bar + route-based note list with a minimal top bar and a single reference
panel that serves as the primary content surface.

## Goals

- Eliminate the hamburger menu and full-width top bar
- Replace pagination and the card-based note list with a dense, scrollable reference panel
- Move search into the reference panel (sticky at top)
- Inline note expansion with pinning
- URL state via query params (composable, multiple states at once)

## Layout

The app shell becomes:

```
┌─────────────────────────────┐
│ soten          [+]     [⚙] │  ← top bar (~40px, always visible)
├─────────────────────────────┤
│ [Search...                ] │  ← sticky, never scrolls
│ ═══════════════════════════ │
│ 📌 Pinned note A   [↕] [×] │  ← pinned zone (collapsed by default)
│ 📌 Pinned note B   [↕] [×] │
│ ─────────────────────────── │  ← hairline divider
│ Dec 7  CouchDB ADR          │  ← results / browse list
│ Dec 7  Improve Handwriting  │    (all notes when search empty,
│ Dec 7  (expanded note)      │     filtered when search active)
│   full content…             │
│   [📌 pin]                  │
│ Dec 7  Other note           │
└─────────────────────────────┘
```

On desktop (≥1200px) with a draft open, the reference panel shifts to the right pane (see
Phase 2).

## Top Bar

Rewrite `src/components/TopBar.tsx`. The current component has a search bar and hamburger
button that are both removed.

### New `TopBar` interface

```tsx
export function TopBar() {
  // reads machineAtom for ready state, onlineAtom for offline dot
  // no props — all state is via atoms
}
```

### Layout

```tsx
export function TopBar() {
  const machine = useAtomValue(machineAtom);
  const online = useAtomValue(onlineAtom);

  const selectedRepo = "selectedRepo" in machine ? machine.selectedRepo : undefined;

  // No-op in Phase 1 — wired to openNewDraft + createBranch in Phase 2
  const handleNewNote = () => {};

  return (
    <Toolbar>
      {/* Left: brand + offline indicator */}
      <div className="flex items-center gap-3">
        <NavLink to="/" variant="brand">
          <SotenLogo />
          soten
        </NavLink>
        {!online && <Text variant="meta">offline</Text>}
      </div>

      {/* Centre-left: new note button */}
      {machine.phase === "ready" && (
        <Button variant="ghost" onClick={handleNewNote} aria-label={t("note.new")}>
          <PlusIcon />
        </Button>
      )}

      {/* Right: git working indicator (Phase 5) + gear */}
      <div className="flex items-center gap-2">
        <GearPopover selectedRepo={selectedRepo} />
      </div>
    </Toolbar>
  );
}
```

### `GearPopover` component

New file: `src/components/GearPopover.tsx`

```tsx
type GearPopoverProps = { selectedRepo?: Repo };

export function GearPopover({ selectedRepo }: GearPopoverProps) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <Button variant="ghost" onClick={() => setOpen((v) => !v)} aria-label="Settings">
        <GearIcon />
      </Button>
      {open && (
        <div
          className="absolute right-0 top-full mt-1 z-30 min-w-48 border border-edge
                        rounded bg-surface px-3 py-2 space-y-2 shadow-sm"
        >
          {selectedRepo && (
            <Text variant="mono" as="p">
              {selectedRepo.owner}/{selectedRepo.repo}
            </Text>
          )}
          <NavLink to="/settings" onClick={() => setOpen(false)}>
            {t("menu.settings")}
          </NavLink>
          <Button
            variant="link"
            size="sm"
            onClick={() => {
              setOpen(false);
              send({ type: "LOGOUT" });
            }}
          >
            {t("auth.logout")}
          </Button>
        </div>
      )}
    </div>
  );
}
```

### SVG Icons

Extract the SO/10 logo SVG already in `TopBar.tsx` into a small `SotenLogo` component (or keep
inline). Add two new inline SVGs:

- `PlusIcon` — a simple 20×20 `+` icon (two crossing lines)
- `GearIcon` — a simple 20×20 gear/cog icon

These are small enough to inline; no icon library needed.

## Reference Panel

New file: `src/components/ReferencePanel.tsx`

This replaces the `FrontPage` route component (`src/routes/front.tsx`).

### Structure

```tsx
export function ReferencePanel() {
  // atoms
  const notes = useAtomValue(searchResultsAtom);
  const [pinnedPaths, setPinnedPaths] = useAtom(pinnedNotesAtom);
  const [expandedPath, setExpandedPath] = useAtom(expandedNoteAtom);
  const searchParams = useSearch({ from: "/" });

  // sync URL → local state on mount
  useEffect(() => {
    if (searchParams.note) {
      const path = timestampToPath(searchParams.note);
      setExpandedPath(path);
    }
  }, []);

  const pinnedNotes = notes.filter((n) => pinnedPaths.includes(n.path));
  const listNotes = notes; // pinned notes also appear in the list

  return (
    <div className="flex flex-col h-full">
      {/* Sticky search */}
      <div className="sticky top-0 z-10 bg-base px-4 py-2 border-b border-edge">
        <SearchBar />
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto">
        {/* Pinned zone */}
        {pinnedPaths.length > 0 && (
          <>
            <PinnedZone
              notes={pinnedNotes}
              onUnpin={(path) => setPinnedPaths((ps) => ps.filter((p) => p !== path))}
            />
            <div className="border-b border-edge" />
          </>
        )}

        {/* Results list — rendered inline, not a separate component */}
        <ul className="list-none p-0 m-0">
          {listNotes.map((note) => (
            <NoteRow
              key={note.path}
              note={note}
              expanded={expandedPath === note.path}
              onExpand={() => {
                setExpandedPath(expandedPath === note.path ? null : note.path);
                navigate({
                  search: (prev) => ({
                    ...prev,
                    note: pathToTimestamp(note.path) ?? undefined,
                  }),
                });
              }}
              onPin={() => {
                setPinnedPaths((ps) => (ps.includes(note.path) ? ps : [...ps, note.path]));
                setExpandedPath(null);
              }}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}
```

### `SearchBar` component

Extract from the current `TopBar.tsx` into `src/components/SearchBar.tsx`. The logic is
unchanged — local state with 150ms debounce writing to `searchQueryAtom`. The component is
self-contained and reusable.

```tsx
export function SearchBar() {
  const query = useAtomValue(searchQueryAtom);
  const setQuery = useSetAtom(searchQueryAtom);
  const [local, setLocal] = useState(query);

  useEffect(() => {
    if (query === "") setLocal("");
  }, [query]);

  useEffect(() => {
    const id = setTimeout(() => setQuery(local), 150);
    return () => clearTimeout(id);
  }, [local, setQuery]);

  return (
    <TextInput
      type="search"
      placeholder={t("search.placeholder")}
      aria-label={t("search.placeholder")}
      value={local}
      onChange={(e) => setLocal(e.target.value)}
      width="full"
    />
  );
}
```

### `NoteRow` component

New file: `src/components/NoteRow.tsx`

Dense row for the note list. Shows date + title on a single line with a hairline divider below.

```tsx
type NoteRowProps = {
  note: NoteListEntry;
  expanded: boolean;
  onExpand: () => void;
  onPin: () => void;
};

const compactDate = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

const compactDateWithYear = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});

function formatDate(date: Date | null): string {
  if (!date) return "";
  const now = new Date();
  return date.getUTCFullYear() === now.getUTCFullYear()
    ? compactDate.format(date)
    : compactDateWithYear.format(date);
}

export function NoteRow({ note, expanded, onExpand, onPin }: NoteRowProps) {
  return (
    <li className="border-b border-edge">
      <button
        className="w-full text-left px-4 py-2 flex items-baseline gap-3 hover:bg-surface-2"
        onClick={onExpand}
      >
        <Text variant="meta" as="span" className="shrink-0 w-16">
          {note.date ? formatDate(note.date) : ""}
        </Text>
        <Text variant="body" as="span" className="truncate font-medium">
          {note.title}
        </Text>
      </button>

      {expanded && <NoteExpanded path={note.path} onPin={onPin} />}
    </li>
  );
}
```

### `NoteExpanded` component

New file: `src/components/NoteExpanded.tsx`

Renders the full note content inline with a pin button and an edit button (edit is wired in
Phase 3).

```tsx
type NoteExpandedProps = {
  path: string;
  onPin: () => void;
  onEdit?: () => void; // wired in Phase 3
};

export function NoteExpanded({ path, onPin, onEdit }: NoteExpandedProps) {
  const loadableAtom = useMemo(() => loadable(renderedNoteAtom(path)), [path]);
  const [result] = useAtom(loadableAtom);

  if (result.state === "loading") return <LoadingSpinner />;
  if (result.state !== "hasData" || !result.data) return null;

  return (
    <div className="px-4 pb-3 max-h-[60vh] overflow-y-auto">
      {/* Action bar */}
      <div className="flex gap-2 mb-2">
        <Button variant="ghost" size="sm" onClick={onPin} aria-label="Pin note">
          <PinIcon /> Pin
        </Button>
        {onEdit && (
          <Button variant="ghost" size="sm" onClick={onEdit} aria-label="Edit note">
            <EditIcon /> Edit
          </Button>
        )}
      </div>

      <FrontmatterTable data={result.data.frontmatter} />
      <ProseContent html={result.data.html} />
    </div>
  );
}
```

Notes have a `max-h-[60vh]` with `overflow-y-auto` so long notes get their own scrollbar
without pushing the rest of the list out of view.

### `PinnedZone` component

New file: `src/components/PinnedZone.tsx`

Renders a list of pinned notes. Each is collapsed by default.

```tsx
type PinnedZoneProps = {
  notes: NoteListEntry[];
  onUnpin: (path: string) => void;
};

export function PinnedZone({ notes, onUnpin }: PinnedZoneProps) {
  const [expandedPath, setExpandedPath] = useState<string | null>(null);

  return (
    <ul className="list-none p-0 m-0">
      {notes.map((note) => (
        <PinnedNote
          key={note.path}
          note={note}
          expanded={expandedPath === note.path}
          onToggle={() => setExpandedPath(expandedPath === note.path ? null : note.path)}
          onUnpin={() => onUnpin(note.path)}
        />
      ))}
    </ul>
  );
}
```

### `PinnedNote` component

New file: `src/components/PinnedNote.tsx`

Single pinned note with collapsed/expanded states.

```tsx
type PinnedNoteProps = {
  note: NoteListEntry;
  expanded: boolean;
  onToggle: () => void;
  onUnpin: () => void;
};

export function PinnedNote({ note, expanded, onToggle, onUnpin }: PinnedNoteProps) {
  return (
    <li className="border-b border-edge">
      <div className="flex items-center px-4 py-2 gap-2">
        <Text variant="meta" as="span">
          📌
        </Text>
        <button
          className="flex-1 text-left text-sm font-medium text-paper truncate"
          onClick={onToggle}
        >
          {note.title}
        </button>
        <Button variant="ghost" size="sm" onClick={onToggle} aria-label="Toggle expand">
          {expanded ? "▾" : "▸"}
        </Button>
        <Button variant="ghost" size="sm" onClick={onUnpin} aria-label="Unpin">
          ×
        </Button>
      </div>

      {expanded && <NoteExpanded path={note.path} onPin={() => {}} />}
    </li>
  );
}
```

## Types Used

The `NoteListEntry` type already exists in `src/atoms/store.ts`:

```ts
export type NoteListEntry = {
  path: string; // full LightningFS path, e.g. "/soten/1702739869049.md"
  relativePath: string; // e.g. "1702739869049.md"
  title: string; // formatted display title
  date: Date | null; // parsed from filename
};
```

All new components receive `NoteListEntry` objects from `searchResultsAtom` or `noteListAtom`.

## New Jotai Atoms

Added to `src/atoms/store.ts`:

```ts
// Session-only, not persisted. Array of note paths that are pinned.
export const pinnedNotesAtom = atom<string[]>([]);

// Path of the currently expanded note in the results list, or null.
export const expandedNoteAtom = atom<string | null>(null);
```

Re-exported from `src/atoms/globals.ts`.

## URL State

### Router changes

`src/router.tsx` is restructured:

```ts
import {
  createRouter,
  createRoute,
  createRootRoute,
  lazyRouteComponent,
} from "@tanstack/react-router";
import { App } from "./app.tsx";

type RootSearchParams = {
  q?: string;
  note?: string;
  // Phase 2 adds: draft?: string | string[]
};

const rootRoute = createRootRoute({
  component: App,
});

const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  validateSearch: (search: Record<string, unknown>): RootSearchParams => ({
    q: typeof search.q === "string" ? search.q : undefined,
    note: typeof search.note === "string" ? search.note : undefined,
  }),
  component: lazyRouteComponent(() => import("./routes/front.tsx"), "FrontPage"),
});

const settingsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "settings",
  component: lazyRouteComponent(() => import("./routes/settings.tsx"), "SettingsPage"),
});

const routeTree = rootRoute.addChildren([indexRoute, settingsRoute]);

export const router = createRouter({
  routeTree,
  defaultPendingComponent: () => null,
  defaultPendingMinMs: 0,
});

declare module "@tanstack/react-router" {
  interface Register {
    router: typeof router;
  }
}
```

Changes from current:

- `noteRoute` and `noteViewRoute` are removed (notes no longer have their own route)
- `indexRoute` gains `validateSearch` for typed `?q` and `?note` params
- The `RootSearchParams` type is exported for use in components

### Helpers for URL ↔ path conversion

New file: `src/lib/note-paths.ts`

```ts
import { REPO_DIR } from "./constants";

/** Convert a numeric timestamp string to the full LightningFS path */
export function timestampToPath(timestamp: string): string {
  return `${REPO_DIR}/${timestamp}.md`;
}

/** Extract the numeric timestamp from a full path like /soten/1702739869049.md */
export function pathToTimestamp(path: string): string | null {
  const filename = path.split("/").pop();
  if (!filename?.endsWith(".md")) return null;
  const stem = filename.slice(0, -3);
  return /^\d+$/.test(stem) ? stem : null;
}
```

### Syncing URL → atoms on mount

In `ReferencePanel`, the `?q` and `?note` search params are read on mount and synced to
`searchQueryAtom` and `expandedNoteAtom`. When the user changes search or expands a note,
the URL is updated via `navigate({ search: ... })`.

The `?q` param replaces the current debounced `searchQueryAtom` flow — the URL is the source
of truth, debounced into the atom.

## `src/routes/front.tsx` — becomes `ReferencePanel` host

The `FrontPage` component is replaced. The file becomes:

```tsx
export function FrontPage() {
  return <ReferencePanel />;
}
```

All the note list, pagination, and card rendering logic is removed.

## `src/app.tsx` — simplified

The `Menu` component and `menuOpen` state are removed. The `TopBar` no longer takes props.

```tsx
export function App() {
  const [machine] = useAtom(machineAtom);
  const [theme] = useAtom(themeAtom);
  const navigate = useNavigate();

  // theme effect unchanged
  useEffect(() => {
    /* same as current */
  }, [theme]);

  useEffect(() => {
    if (machine.phase === "selectingRepo") {
      navigate({ to: "/settings", replace: true });
    }
  }, [machine.phase, navigate]);

  const showChrome = machine.phase !== "initializing" && machine.phase !== "unauthenticated";

  return (
    <AppShell>
      {showChrome && <TopBar />}
      {machine.phase === "initializing" && <LoadingSpinner />}
      {machine.phase === "unauthenticated" && <UnauthenticatedView authError={machine.authError} />}
      {machine.phase === "error" && (
        <AuthError message={machine.message} onRetry={() => send({ type: "RETRY" })} />
      )}
      {(machine.phase === "fetchingRepos" || machine.phase === "cloningRepo") && <LoadingSpinner />}
      {(machine.phase === "ready" || machine.phase === "selectingRepo") && <Outlet />}
    </AppShell>
  );
}
```

`PageContainer` is no longer used as a wrapper in `app.tsx` — the `ReferencePanel` manages its
own padding. `PageContainer` is retained for the settings page.

## `src/components/ds/AppShell.tsx` — updated

```tsx
export function AppShell({ children }: { children: ReactNode }) {
  return <div className="w-screen h-screen flex flex-col antialiased bg-base">{children}</div>;
}
```

Changed from `min-h-screen` to `h-screen flex flex-col` so the reference panel can use
`flex-1 overflow-y-auto` to fill the remaining space and scroll independently.

## i18n additions

New keys in `src/i18n/en.ts`:

```ts
"note.new": "New note",
"note.pin": "Pin",
"note.unpin": "Unpin",
"note.edit": "Edit",
```

## Atoms removed

| Atom           | Reason                                                               |
| -------------- | -------------------------------------------------------------------- |
| `pageSizeAtom` | No more pagination                                                   |
| `noteCardAtom` | Cards replaced by dense rows; full rendering uses `renderedNoteAtom` |

The `cardCache` and `clearCardCache()` in `store.ts` are also removed.

## Components removed

| File                                  | Reason                                                        |
| ------------------------------------- | ------------------------------------------------------------- |
| `src/components/NoteCard.tsx`         | Replaced by `NoteRow`                                         |
| `src/components/NoteCardSkeleton.tsx` | No longer needed                                              |
| `src/components/NoteList.tsx`         | Logic moved into `ReferencePanel`                             |
| `src/components/Menu.tsx`             | Replaced by `GearPopover`                                     |
| `src/components/ds/Overlay.tsx`       | Only used by `Menu`; `GearPopover` uses click-outside instead |
| `src/components/ds/MenuPanel.tsx`     | Only used by `Menu`                                           |

## Components unchanged

| File                                     | Reason                           |
| ---------------------------------------- | -------------------------------- |
| `src/components/BackLink.tsx`            | Still used by settings page      |
| `src/components/LoadingSpinner.tsx`      | Still used during loading phases |
| `src/components/ProseContent.tsx`        | Used by `NoteExpanded`           |
| `src/components/FrontmatterTable.tsx`    | Used by `NoteExpanded`           |
| `src/components/UnauthenticatedView.tsx` | Unchanged                        |
| `src/components/AuthError.tsx`           | Unchanged                        |
| `src/components/RepoSelector.tsx`        | Used by settings page            |

## Settings page update

`src/routes/settings.tsx`: Remove `pageSizeAtom` import and the "Notes per page" field.
Remove the `pageSize` i18n key.

## `src/atoms/globals.ts` — updated re-exports

```ts
export {
  store,
  machineAtom,
  fileAtom,
  noteListAtom,
  renderedNoteAtom,
  themeAtom,
  pinnedNotesAtom,
  expandedNoteAtom,
} from "./store";
export { send } from "./machine";
export { searchQueryAtom, searchResultsAtom, searchIndexReadyAtom } from "./search";

import "./init.run";
```

Removed: `noteCardAtom`, `pageSizeAtom`.

## File change summary

| File                                  | Action                                                                                        |
| ------------------------------------- | --------------------------------------------------------------------------------------------- |
| `src/components/TopBar.tsx`           | Rewrite                                                                                       |
| `src/components/GearPopover.tsx`      | New                                                                                           |
| `src/components/SearchBar.tsx`        | New (extracted from TopBar)                                                                   |
| `src/components/ReferencePanel.tsx`   | New                                                                                           |
| `src/components/NoteRow.tsx`          | New                                                                                           |
| `src/components/NoteExpanded.tsx`     | New                                                                                           |
| `src/components/PinnedZone.tsx`       | New                                                                                           |
| `src/components/PinnedNote.tsx`       | New                                                                                           |
| `src/lib/note-paths.ts`               | New                                                                                           |
| `src/router.tsx`                      | Rewrite (remove note route, add search params)                                                |
| `src/app.tsx`                         | Simplify (remove Menu, PageContainer wrapper)                                                 |
| `src/routes/front.tsx`                | Rewrite (delegate to ReferencePanel)                                                          |
| `src/routes/settings.tsx`             | Remove pageSize field                                                                         |
| `src/atoms/store.ts`                  | Add `pinnedNotesAtom`, `expandedNoteAtom`; remove `pageSizeAtom`, `noteCardAtom`, `cardCache` |
| `src/atoms/globals.ts`                | Update re-exports                                                                             |
| `src/components/ds/AppShell.tsx`      | Change to `h-screen flex flex-col`                                                            |
| `src/i18n/en.ts`                      | Add new keys, remove pagination keys                                                          |
| `src/i18n/da.ts`                      | Same key changes                                                                              |
| `src/components/NoteCard.tsx`         | Delete                                                                                        |
| `src/components/NoteCardSkeleton.tsx` | Delete                                                                                        |
| `src/components/NoteList.tsx`         | Delete                                                                                        |
| `src/components/Menu.tsx`             | Delete                                                                                        |
| `src/components/ds/Overlay.tsx`       | Delete                                                                                        |
| `src/components/ds/MenuPanel.tsx`     | Delete                                                                                        |
| `src/routes/note.tsx`                 | Delete                                                                                        |

## What does not change

- Auth flow, unauthenticated view, clone/pull machine phases
- `searchQueryAtom`, `searchResultsAtom`, `noteListAtom`, `renderedNoteAtom` (logic unchanged)
- The worker and all git operations
- `backgroundSync`
- `src/markdown.ts`
- `src/lib/fs.ts`
- `src/lib/github.ts`
- `src/lib/online.ts`
