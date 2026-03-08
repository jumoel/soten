# Phase 3: Existing Note Editing

Extend the editor introduced in Phase 2 to support editing existing notes. The git branching,
autosave, save, and discard mechanics are identical to new note creation.

## Goals

- Notes have a view mode and an edit mode
- Entering edit mode creates a `draft/<timestamp>` branch
- Leaving edit mode via save squash-merges to main
- Leaving edit mode via discard reverts the file to its main state and deletes the branch
- The editor layout is identical to Phase 2 (two-pane on desktop, full-screen on mobile)

## Edit / View Distinction

In the reference panel, expanded notes (Phase 1) gain an "Edit" button in their header alongside
the existing "Pin" button. Pinned notes similarly gain an "Edit" button when expanded.

Clicking "Edit":
1. Reads the file content from LightningFS (current main state)
2. Generates the branch name from the note's filename stem: `draft/<timestamp>` where
   `<timestamp>` is the numeric stem of the filename (e.g. `1702739869049.md` → `draft/1702739869049`)
3. Creates the branch
4. Opens the editor pre-populated with the file content
5. Sets `?draft=<timestamp>` in the URL

The editor layout, minimize/restore, tray, and resize handle are all reused from Phase 2.

## Branch Naming

For existing notes, the branch name is derived from the filename: `draft/<stem>`. Since all
filenames are timestamp-based (`<timestamp>.md`), this is always `draft/<timestamp>`.

This means a new note and an edit of an existing note with the same timestamp are
indistinguishable by branch name — which is correct, since a new note *becomes* an existing
note after its first save.

## Autosave

Identical to Phase 2. Debounced 2 seconds after the last keystroke, commits to
`draft/<timestamp>` with message `draft: autosave`.

## Save

1. Write final content to `<REPO_DIR>/<timestamp>.md`
2. Commit to `draft/<timestamp>`
3. Squash-merge into main
   - Commit message: frontmatter `title:` → first `# Heading` → `update note <timestamp>`
   - Note: uses "update" prefix instead of "add" since the file already exists on main
4. Delete `draft/<timestamp>`
5. Invalidate `fileAtom(<path>)` and `renderedNoteAtom(<path>)` so the note re-renders
6. Close the editor

## Discard

After confirmation dialog:
1. Delete `draft/<timestamp>`
2. The file in LightningFS is left as-is (main state is already there — autosave writes to
   the branch, but the working file may have been updated). Re-read the file from the main
   branch to restore the correct content in LightningFS.
3. Close the editor, remove tray entry

## Distinguishing New vs Existing Notes in the Editor

The `Draft` type from Phase 2 gains an `isNew` flag:

```ts
type Draft = {
  timestamp: string;
  content: string;
  minimized: boolean;
  isNew: boolean;  // true = file doesn't exist on main yet
};
```

This determines:
- The save commit message prefix ("add" vs "update")
- Whether discard needs to clean up a file from LightningFS

## URL State

Identical to Phase 2. `?draft=<timestamp>` is set when editing an existing note. This composes
with `?note=<timestamp>` (which note is expanded in the reference panel) and `?q=<query>`.

## What Does Not Change

- All Phase 2 editor components (`EditorPane`, `DraftTray`, `ResizeHandle`)
- Worker git operations
- Reference panel behaviour
