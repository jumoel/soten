# Phase 4: Reference Stack + Split Pane + Conflict Resolution

The research workflow (desktop and tablet) plus conflict handling.

Parent plan: [14-frontend-redesign-overview.md](./14-frontend-redesign-overview.md)
Depends on: [17-browser-view.md](./17-browser-view.md), [18-editor-autosave.md](./18-editor-autosave.md)

---

## New Compositions (this phase, each with Storybook stories)

- `ReferenceCard` - Card with collapse/excerpt/expand modes. Dismiss IconButton. Rendered MarkdownContent inside.
- `Overlay` - slide-in panel from right screen edge. Backdrop, swipe/tap-outside to dismiss. For tablet reference panel.
- `NoteCardCondensed` - compact single-column variant: title, date, one-line preview. Used in reference search results and later in ultra-wide left column.

---

## Extend SplitPane

Add vertical gutter variant to the SplitPane built in Phase 3. The desktop editor view needs both:
- Horizontal split: editor (top) / backlinks (bottom) - exists from Phase 3
- Vertical split: editor column (left) / reference column (right) - new

Nesting: the left side of the vertical split contains the horizontal split from Phase 3. Verify no drag interference between nested gutters.

---

## Desktop Layout (1200px - 1919px)

Editor view becomes two columns:
- **Left column:** editor (~65% height) + backlinks (~35% height), horizontal SplitPane
- **Right column:** reference SearchField + reference card stack
- Vertical SplitPane between columns, draggable gutter

---

## Reference Stack (Right Column)

### Search

- SearchField at top, using a second instance of the `useNoteSearch()` hook from Phase 2 (independent query state from browser search)
- Results appear as NoteCardCondensed items
- Each result has a `+` IconButton to pin it into the reference stack
- Adding a result keeps it in the stack without clearing the search
- Clear search to see just pinned reference cards

### Reference Cards

State for the stack lives in `state/ui.ts`:
- Array of `{ path: string, mode: 'collapsed' | 'excerpt' | 'expanded' }`
- Persists for the editing session
- Clears when switching to a different note

ReferenceCard modes (see overview for full spec):
- Collapsed: title + date
- Excerpt: ~10 lines of rendered MarkdownContent (default when added)
- Expanded: full rendered note, scrollable
- Dismiss: removes from stack

---

## Tablet Layout (768px - 1199px)

- Reference panel is an Overlay (slide-in from right edge)
- Triggered by IconButton in editor TopBar
- Same content as desktop: SearchField + reference card stack
- Swipe right or tap outside to dismiss

---

## Wikilink + Backlink Click Behavior Update

Update click handlers from Phase 3's "always navigate" to breakpoint-aware behavior:
- **Mobile:** navigate (unchanged)
- **Tablet:** open in reference Overlay
- **Desktop:** add to reference stack

---

## Cmd+K (Desktop Only)

- Keyboard shortcut: Cmd+K (Mac) / Ctrl+K (Windows)
- Focuses the reference SearchField in the right column
- No-op if not in editor view or reference column not visible

---

## Conflict Resolution

When sync detects both local and remote changes to the same file:
- **Desktop:** show remote version as a ReferenceCard in the stack, labeled "Remote version - resolve by editing and publishing"
- **Tablet:** show remote version in the reference Overlay
- **Mobile:** show inline Alert with a "View remote version" button that navigates to a read-only rendered view of the remote content
- Badge on affected NoteCards in the browser indicating unresolved conflict
- User resolves by editing the local version and publishing. No automatic merging.

---

## Done When

- Desktop editor has two-column layout with draggable vertical gutter
- Reference SearchField searches notes independently from browser search
- `+` button adds notes to the reference stack
- ReferenceCards work in all three modes (collapsed, excerpt, expanded) with dismiss
- Stack persists within editing session, clears on note switch
- Tablet has slide-in Overlay for references
- Wikilink and backlink clicks route correctly per breakpoint
- Cmd+K focuses reference search on desktop
- Conflict detection surfaces both versions appropriately at each breakpoint
- Nested SplitPane gutters don't interfere with each other
- Storybook stories for ReferenceCard, Overlay, NoteCardCondensed
- All UI composed from design system primitives
