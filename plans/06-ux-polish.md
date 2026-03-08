# Plan 06: UX & UI Polish

Findings from a systematic DevTools audit of the full app flow. Issues are grouped by theme and ordered by impact.

---

## 1. Save broken in localRepo mode (functional bug)

**Observed:** Clicking Save or triggering autosave throws `"Could not find origin/draft/<timestamp>"` and the note is never committed. The error is swallowed silently — the editor stays open with no feedback.

**Root cause:** `saveDraft` and `autosave` call `pushIfOnline`, which fails when no `origin` remote exists. The failure propagates and aborts the entire save, including the local squash-merge-to-main step.

**Fix:**
- In `pushIfOnline`, catch "no remote" / "remote not found" errors and return silently instead of throwing. Push errors should never prevent a local commit.
- In `saveDraft`, wrap the push step separately so a push failure does not roll back the commit.
- Verify with `../test-notes` (no remote) that Save works and the committed file appears in the note list.

---

## 2. Double date in card headers

**Observed:** Every card header reads: `Dec 7, 2023  Unnamed note · December 7, 2023 at 9:54 AM`. The date is shown twice — once as the compact date column, and again embedded in the generated title for timestamp-named files.

**Fix in `noteTitle()` (`src/atoms/store.ts`):**
- For timestamp-named files, return just the time portion (e.g. `"9:54 AM"`) as the title, since the date is already shown in the date column.
- For day-named files (`YYYY-MM-DD.md`), keep the existing `"Day: [date]"` label (the date column already shows the compact date, so the label provides the semantic "Day" context).
- If the note content starts with `# Heading`, prefer that heading as the card title over the generated timestamp string. This requires making `noteListAtom` async or adding a parallel `noteTitleAtom` that reads file content. Simpler: strip the leading `# ` from the card preview's first line at render time and promote it as the card title (see §3).

---

## 3. H1/H2 headings dominate card previews

**Observed:** Card previews render full `prose` heading sizes. `# CouchDB ADR` renders as a large bold H1 inside the card, creating visual noise and duplicating the title row. Section headings (`## Notes`, `## Opgaver`) appear as bold subheadings in short previews.

**Fix in `noteCardAtom` / card rendering:**
- Suppress heading sizes in card preview context. In `NoteRow`, apply a CSS override to the preview div that reduces all `h1`–`h3` to body text weight and size:
  ```
  [&_h1]:text-sm [&_h1]:font-semibold [&_h2]:text-sm [&_h2]:font-medium [&_h3]:text-sm
  ```
- Or: strip the leading `# Heading` line from `displayContent` in `noteCardAtom` and use it as the title (promoted approach). This eliminates the duplication and lets the title column show the note's actual subject.

**Recommended approach:** promote the first H1 line from `displayContent` as a derived title override; strip it from the rendered preview HTML. Pass this derived title alongside `html` and `isShort` in the `noteCardAtom` result, and use it in `NoteRow` when it exists, falling back to `note.title`.

---

## 4. Wikilinks show as raw `[[...]]` syntax

**Observed:** `[[1701957526441|GameMaker]]` and `[[2024-02-01]]` appear as literal bracket text in card previews and expanded notes. The Lumen note format uses Obsidian-style wikilinks.

**Fix in `src/markdown.ts`:**
- Add a remark plugin before the HTML pipeline that transforms `[[target|label]]` → `<a href="#">label</a>` (or plain `<span>`) and `[[target]]` → `<span>target</span>`. Internal links cannot navigate anywhere meaningful yet, so rendering them as styled spans (muted, no underline) is correct. Do not make them dead `<a>` tags that confuse users.

---

## 5. Frontmatter renders as a raw table in expanded notes

**Observed:** The CouchDB ADR expanded view shows its YAML frontmatter as a two-column key-value table including `pr: null`. This is technical noise for a reading view.

**Fix in `ProseContent` or the markdown pipeline:**
- In `renderMarkdown`, strip the frontmatter block from the HTML output entirely. `vfile-matter` already extracts it into `file.data.matter`; the pipeline should not also render it as body content.
- Verify: check whether `remark-frontmatter` or `vfile-matter` is leaving the YAML block in the AST. If so, add a `remarkRemoveFrontmatter` step (or use the existing `strip: true` option if available).

---

## 6. Editor action button hierarchy

**Observed:** The editor header shows three identical ghost-text buttons: `↓  Save  Discard`. No visual distinction between primary (Save), secondary (Minimize), and destructive (Discard).

**Fix in `EditorPane`:**
- **Save**: use `variant="secondary"` (bordered, visible as the primary action).
- **Minimize**: replace `↓` with the label "Minimize" and use `variant="ghost"` — keep it unobtrusive.
- **Discard**: use `variant="ghost"` with `text-red-600` className to signal the destructive action, without adding visual weight.
- Replace the native `window.confirm()` discard dialog with an inline confirmation state: clicking Discard once shows "Are you sure?" with Confirm/Cancel inline, without a browser modal.

---

## 7. Gear popover menu inconsistency

**Observed:** "Settings" renders as a NavLink (no decoration), "Log out" renders as a Button with `variant="link"` (underline). Two different visual styles in the same small menu.

**Fix in `GearPopover`:**
- Use the `DividedList` ds component for the menu items.
- Both "Settings" and "Log out" should use the same visual treatment: plain text, `text-sm`, with a hover background state. Use `Text variant="body"` wrapped in clickable elements, or extend `NavLink` with a button variant.

---

## 8. Empty states

**Observed:**
- Empty repo: blank page below the search bar with no guidance.
- Empty search results: blank space below the search input with no feedback.

**Fix in `ReferencePanel`:**
- When `notes.length === 0` and `searchQuery === ""`: show a centered muted message, e.g. _"No notes yet. Click + New note to get started."_
- When `notes.length === 0` and `searchQuery !== ""`: show _"No notes matching '[query]'."_
- Use `Text variant="secondary"` centered in the list area.

---

## 9. Note sort order

**Observed:** Timestamp-named notes appear in ascending chronological order (oldest first). Within the list, `YYYY-MM-DD.md` day notes appear after all timestamp notes as a second group. The most recent notes are at the bottom — the opposite of what a "today's notes" workflow needs.

**Fix in `noteListAtom`:**
- Sort all entries newest-first by `date` (nulls last).
- Within the same date, sort by filename lexicographically descending (so later timestamps in the same day sort to the top).

---

## 10. Search input accessibility

**Observed:** Browser console warns: _"A form field element should have an id or name attribute"_ for the search input (count: 3).

**Fix in `SearchBar`:** pass `id="note-search" name="q"` to the `TextInput`.

---

## 11. Note list sort control

**Observed:** The note list is sorted ascending by date (oldest at the top) with no way to change the order. For a "recent notes" workflow, newest-first is more useful. When search is active, sorting by relevance score is preferred over chronological.

**Fix:**

Add a sort selector to the `ReferencePanel` header bar, inline with the search input. Three options:

| Option | Behaviour |
|---|---|
| **Newest** (default) | Sort by `date` descending; nulls last |
| **Oldest** | Sort by `date` ascending; nulls last |
| **Best match** | Only active when `searchQuery !== ""`; uses MiniSearch relevance score (already returned by the search index); falls back to Newest when query is cleared |

**Implementation sketch:**

- Add `sortAtom` (`atom<"newest" | "oldest" | "best-match">`) — defaults to `"newest"`.
- Derive `sortedResultsAtom` from `searchResultsAtom` + `sortAtom`:
  - `best-match` is the raw MiniSearch order (already sorted by score).
  - `newest`/`oldest` sort by `NoteListEntry.date`.
- Render a `<select>` or small segmented control in the `ReferencePanel` search header, right-aligned. Disable/hide "Best match" when there is no active query.
- Reset sort to `"newest"` (or keep user preference) when the query is cleared.
- Use `ds/Text variant="meta"` for the control label.

---

## Implementation order

1. § 1 — Save bug (moved to plan 07; blocks all testing with localRepo)
2. § 2 + 3 — Card title/heading cleanup (highest visual impact)
3. § 4 — Wikilinks (content fidelity)
4. § 5 — Frontmatter (reading view quality)
5. § 6 — Editor button hierarchy (editing UX)
6. § 7 — Gear popover (consistency)
7. § 8 — Empty states (onboarding)
8. § 9 + 11 — Sort order + sort control (navigation)
9. § 10 — Accessibility (quick win)
