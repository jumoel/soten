# Phase 2: New Note Creation

Add the ability to create new notes. Notes are backed by git draft branches from the moment the
editor opens, with automatic debounced commits and explicit save/discard actions.

## Goals

- New note editor in a two-pane layout (editor + reference panel)
- Resizable split between editor and reference panel
- Minimizable to a bottom tray, preserving the draft
- Multiple drafts can be open simultaneously (each minimized in the tray)
- All changes persisted to a git branch — nothing is ever lost
- Explicit save squash-merges to main; discard deletes the branch

## Filename and Branch Naming

When the user clicks `+`, a timestamp is generated immediately: `Date.now()`. This timestamp is:

- The future filename: `<timestamp>.md`
- The branch name: `draft/<timestamp>`
- The `?draft=<timestamp>` URL param

The timestamp is fixed for the lifetime of the draft. It does not change on save.

## Editor Layout

### Desktop (≥1200px)

Two-pane split: editor left, reference panel right. The reference panel behaves identically to
Phase 1 — sticky search, pinned notes, results list. The two panes are separated by a draggable
handle. Default split is 50/50.

Implemented with CSS grid: `grid-template-columns: <editorWidth>px 4px 1fr`. The 4px column is
the drag handle. Dragging updates `editorWidth` in local state (persisted to localStorage so it
survives refresh).

### Mobile / Narrow screens (<1200px)

Editor opens full-screen. The reference panel is not visible while the editor is open. The
minimize button (see below) returns to the reference panel.

## Minimize / Restore

A minimize button in the editor toolbar collapses the editor to a thin tray bar at the bottom
of the screen. The tray bar shows:

```
┌──────────────────────────────────────────────────────────┐
│ ✏ My note title…                          [↑]       [×] │
└──────────────────────────────────────────────────────────┘
```

- Title is derived from frontmatter `title:` or the first `# Heading` in the content, falling
  back to "New note…" if the note is empty
- `↑` restores the editor
- `×` discards the draft (requires confirmation — the only destructive action that needs one)

Multiple minimized drafts stack in the tray. Each has its own entry. Clicking any entry restores
that draft's editor.

Minimize is always manual. The editor never minimizes automatically.

On desktop, minimizing returns the reference panel to full width. On mobile, minimizing returns
to the full-screen reference panel.

## URL State

The `?draft=<timestamp>` search param is set when the editor is open (including when minimized —
the draft still exists). This allows the state to be distinguishable in the URL:

- `/?draft=1709123456789` — draft open, reference panel visible
- `/?note=1702739869049&draft=1709123456789` — note expanded, draft open simultaneously
- `/?q=yoghurt&draft=1709123456789` — searching with draft open

Multiple open drafts: `?draft=ts1&draft=ts2` (TanStack Router supports repeated params as
arrays).

## Git Operations

All git operations run in the web worker (`repo.worker.ts`) and are exposed via `RepoWorkerClient`.

### New worker messages

| Message | Purpose |
|---|---|
| `createBranch` | Create `draft/<timestamp>` branching off current HEAD of main |
| `commitFiles` | Stage specific files and commit on the current branch |
| `squashMergeToMain` | Squash-merge a named branch into main, then delete the branch |
| `deleteBranch` | Delete a branch without merging (discard) |
| `listDraftBranches` | List all branches matching `draft/*` (used in Phase 4) |

### Autosave

Triggered by a 2-second debounce after the last keystroke. Writes the current editor content
to `<REPO_DIR>/<timestamp>.md` in LightningFS, then commits to `draft/<timestamp>` with message
`draft: autosave`.

The autosave is fire-and-forget from the UI perspective. The git working indicator (Phase 5)
shows when a commit is in progress.

### Save

Explicit save button in the editor toolbar. Steps:

1. Write final content to `<REPO_DIR>/<timestamp>.md`
2. Commit to `draft/<timestamp>` with message `draft: autosave`
3. Squash-merge `draft/<timestamp>` into main
   - Commit message: frontmatter `title:` → first `# Heading` → `add note <timestamp>`
4. Delete `draft/<timestamp>` branch
5. Update `machineAtom` filenames to include the new file
6. Close the editor

### Discard

After confirmation dialog:

1. Delete `draft/<timestamp>` branch
2. Remove `<timestamp>.md` from LightningFS if it was written during autosave
3. Close the editor, remove tray entry

## State

New Jotai atoms:

```ts
type Draft = {
  timestamp: string;  // e.g. "1709123456789"
  content: string;
  minimized: boolean;
};

// Array of all open drafts (including minimized)
draftsAtom: atom<Draft[]>

// Timestamp of the currently visible (non-minimized) draft, if any
activeDraftTimestampAtom: atom<string | null>
```

The active draft's timestamp is also reflected in the URL `?draft` param.

## New Components

- `EditorPane` — markdown textarea, toolbar (save, discard, minimize), title display
- `DraftTray` — bottom bar showing minimized drafts
- `DraftTrayEntry` — single entry in the tray (title, restore, discard)
- `ResizeHandle` — draggable 4px column between editor and reference panel

## What Does Not Change

- Reference panel from Phase 1 — it simply shifts to the right pane when the editor is open
- All worker git infrastructure (clone, pull, push)
- Auth and machine state
