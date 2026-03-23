# Phase 5: Ultra-wide Layout + PWA

The three-column layout for large screens and PWA caching. This phase is focused - offline, sync, and conflicts are already handled in Phases 3 and 4.

Parent plan: [14-frontend-redesign-overview.md](./14-frontend-redesign-overview.md)
Depends on: [19-reference-stack.md](./19-reference-stack.md)

---

## Ultra-wide Layout (1920px+)

Three persistent columns when editing. The browser becomes always-visible.

- **Left column (~250-350px):** CalendarGrid + NoteCardCondensed list, filtered by calendar selection. SearchField at top (third search instance via `useNoteSearch()` hook, independent from browser and reference searches).
- **Center column (flexible):** editor (~65% height) + backlinks (~35% height)
- **Right column (~300-400px):** reference SearchField + reference card stack
- Two draggable vertical gutters

### SplitPane Nesting Decision

The ultra-wide layout needs three columns. Two options:
1. Nest two SplitPanes (outer splits left from center+right, inner splits center from right)
2. Build a dedicated `TriplePane` composition

If nested SplitPanes had drag issues in Phase 4, build TriplePane here. If nesting worked fine, reuse it.

### Left Column Content

- SearchField at top filters the NoteCardCondensed list below (and dims calendar days)
- CalendarGrid with day selection filtering
- NoteCardCondensed list - compact format since the column is narrow
- Clicking a note opens it in the center editor without losing left column context

---

## PWA / Service Worker

- Add `vite-plugin-pwa` for service worker generation
- Precache all app assets (HTML, JS, CSS)
- No runtime caching for API calls - data lives in IndexedDB
- App shell loads instantly on repeat visits, even offline

---

## Keyboard Shortcuts Audit

Review and verify all keyboard shortcuts work:
- Cmd+K: focus reference search (desktop/ultra-wide)
- Escape: close Dialog, Overlay, Popover
- Tab navigation: all interactive elements reachable
- Enter/Space: activate buttons and links

---

## Storybook Catch-up

Ensure all compositions created during Phases 2-4 have complete Storybook stories. Any gaps from feature-driven development are filled here.

---

## Done When

- Ultra-wide three-column layout works at 1920px+
- Left column shows CalendarGrid + condensed note list, filters by day selection
- Clicking a note in left column opens in center editor
- Left column search is independent from browser and reference searches
- PWA service worker caches app shell for offline loading
- All keyboard shortcuts work
- Storybook is up to date with all compositions
- All four breakpoints (mobile, tablet, desktop, ultra-wide) work correctly
- Full app round trip at every breakpoint: browse -> create -> edit -> auto-save -> publish -> search -> wikilink -> backlink -> reference stack
