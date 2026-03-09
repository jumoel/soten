# Plan 07: UX & UI Polish

Implementation-ready plan based on a systematic DevTools audit. Issues are grouped by theme, ordered by impact, with precise file/line references and code changes.

§1 (save bug) is handled by [plan 06](./06-save-without-remote.md) and excluded here.

---

## Commit A: Card title/heading cleanup (§2 + §3)

**Problem:** Double date in card headers ("Dec 7, 2023 Unnamed note · December 7, 2023 at 9:54 AM") and H1/H2 headings render at full prose size inside card previews.

### A1. Fix timestamp title in `noteTitle()` — `src/atoms/store.ts:101-115`

For timestamp-named files, return just the time portion instead of the full datetime.

Add a time-only formatter near line 60:

```ts
const prettyTime = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});
```

Change line 112 from:

```ts
if (tsDate) return t("note.unnamedWithDate", { date: prettyDateTime.format(tsDate) });
```

to:

```ts
if (tsDate) return prettyTime.format(tsDate);
```

This drops the "Unnamed note · December 7, 2023 at 9:54 AM" pattern and returns just "9:54 AM", since the date column already shows the compact date.

**i18n cleanup:** The `note.unnamedWithDate` key in `src/i18n/en.ts:17` is no longer referenced. Remove it. (Keep `note.unnamedWithStem` — it's still used for non-timestamp, non-date filenames.)

### A2. Promote first H1 as card title — `src/atoms/store.ts:183-204`

Modify `noteCardAtom` to extract and return a `derivedTitle` from the note body.

After computing `body` (line 190), extract and strip the leading H1:

```ts
const h1Re = /^#\s+(.+)$/m;
const h1Match = body.match(h1Re);
const derivedTitle = h1Match ? h1Match[1].trim() : null;

// Strip the H1 line from displayContent so it doesn't render in the preview
const strippedBody = derivedTitle ? body.replace(h1Re, "").trimStart() : body;
```

Use `strippedBody` instead of `body` when computing `displayContent` and `isShort`.

Change the return type from `{ html: string; isShort: boolean }` to `{ html: string; isShort: boolean; derivedTitle: string | null }`.

Update the `cardCache` type accordingly.

### A3. Use derived title in `NoteRow` — `src/components/NoteRow.tsx:39-69`

In `NoteCardPreview`, also return `derivedTitle`:

```ts
function NoteCardPreview({ path, onTitle }: { path: string; onTitle: (t: string | null) => void }) {
  const cardAtom = useMemo(() => loadable(noteCardAtom(path)), [path]);
  const [result] = useAtom(cardAtom);

  useEffect(() => {
    if (result.state === "hasData" && result.data) {
      onTitle(result.data.derivedTitle);
    }
  }, [result, onTitle]);

  if (result.state !== "hasData" || !result.data) return null;
  return (
    <div
      className="prose prose-sm dark:prose-invert mt-1 line-clamp-5 [&_*]:!m-0 [&_*]:!p-0"
      dangerouslySetInnerHTML={{ __html: result.data.html }}
    />
  );
}
```

In `NoteRow`, add state for the derived title and use it:

```ts
const [cardTitle, setCardTitle] = useState<string | null>(null);
const handleTitle = useCallback((t: string | null) => setCardTitle(t), []);

// In the render:
<Text variant="body" as="span" className="truncate font-medium">
  {cardTitle ?? note.title}
</Text>
```

### A4. Suppress heading sizes in card preview CSS

Even after stripping the first H1, subsequent headings (H2, H3) may appear in previews. Add CSS overrides to the preview div in `NoteCardPreview`:

```
[&_h1]:text-sm [&_h1]:font-semibold [&_h2]:text-sm [&_h2]:font-medium [&_h3]:text-sm [&_h3]:font-medium
```

Full className becomes:

```ts
"prose prose-sm dark:prose-invert mt-1 line-clamp-5 [&_*]:!m-0 [&_*]:!p-0 [&_h1]:!text-sm [&_h1]:!font-semibold [&_h2]:!text-sm [&_h2]:!font-medium [&_h3]:!text-sm [&_h3]:!font-medium";
```

(Use `!` to override prose defaults.)

---

## Commit B: Wikilink rendering (§4)

**Problem:** `[[1701957526441|GameMaker]]` and `[[2024-02-01]]` appear as raw bracket text.

### B1. Add a remark plugin in `src/markdown.ts`

Add a custom remark plugin that runs **after** `remarkGfm` and **before** `remarkRehype`. It walks the AST and transforms wikilink text nodes.

```ts
import { visit } from "unist-util-visit";
import type { Text } from "mdast";

const remarkWikilinks: Plugin<[], Root> = function () {
  return function transformer(tree) {
    visit(tree, "text", (node: Text, index, parent) => {
      if (!parent || index == null) return;
      const re = /\[\[([^\]]+?)(?:\|([^\]]+?))?\]\]/g;
      const parts: (Text | { type: "html"; value: string })[] = [];
      let lastIndex = 0;
      let match;

      while ((match = re.exec(node.value)) !== null) {
        if (match.index > lastIndex) {
          parts.push({ type: "text", value: node.value.slice(lastIndex, match.index) });
        }
        const label = match[2] ?? match[1];
        parts.push({ type: "html", value: `<span class="wikilink">${label}</span>` });
        lastIndex = re.lastIndex;
      }

      if (parts.length === 0) return;
      if (lastIndex < node.value.length) {
        parts.push({ type: "text", value: node.value.slice(lastIndex) });
      }
      parent.children.splice(index, 1, ...parts);
    });
  };
};
```

Import `visit` dynamically alongside the other imports in `buildProcessor()`:

```ts
const [{ visit }] = await Promise.all([
  import("unist-util-visit"),
  // ...existing imports
]);
```

Add `unist-util-visit` as a dependency:

```sh
npm install unist-util-visit
```

Insert `.use(remarkWikilinks)` in the pipeline after `.use(remarkGfm)` and before `.use(remarkFrontmatterMatter)`.

### B2. Style wikilinks

The `rehype-sanitize` default schema strips `class` attributes. Either:

- **Option A (preferred):** Use `<span data-wikilink>` instead of `class="wikilink"` and style with `[data-wikilink]` in CSS. Update `rehype-sanitize` schema to allow `data-wikilink` on `span` elements.
- **Option B:** Extend the `rehype-sanitize` schema to allow `class` on `span` elements (broader change, less safe).

Go with Option A. In the remark plugin, emit:

```html
<span data-wikilink>label</span>
```

In `src/index.css`, add:

```css
[data-wikilink] {
  @apply text-gray-500 font-medium;
}
```

For sanitization, pass a custom schema to `rehypeSanitize`:

```ts
import { defaultSchema } from "rehype-sanitize";

const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    span: [...(defaultSchema.attributes?.span ?? []), ["data-wikilink", ""]],
  },
};
```

Pass `sanitizeSchema` to `.use(rehypeSanitize, sanitizeSchema)`.

---

## Commit C: Strip frontmatter from rendered output (§5)

**Problem:** YAML frontmatter renders as a visible key-value table in expanded note view.

### C1. Add `remarkRemoveFrontmatter` plugin — `src/markdown.ts`

The `remark-frontmatter` plugin recognizes YAML blocks and adds them as `yaml` nodes in the AST. The `vfile-matter` plugin (`remarkFrontmatterMatter`) extracts the data. But the `yaml` node remains in the AST and renders as body content.

Add a plugin that removes `yaml` nodes from the tree. Place it **after** `remarkFrontmatterMatter` and **before** `remarkRehype`:

```ts
const remarkRemoveFrontmatter: Plugin<[], Root> = function () {
  return function transformer(tree) {
    tree.children = tree.children.filter((node) => node.type !== "yaml");
  };
};
```

Pipeline order becomes:

```ts
.use(remarkParse)
.use(remarkFrontmatter)
.use(remarkGfm)
.use(remarkWikilinks)
.use(remarkFrontmatterMatter)
.use(remarkRemoveFrontmatter)  // ← new
.use(remarkRehype, { allowDangerousHtml: true })
.use(rehypeRaw)
.use(rehypeSanitize, sanitizeSchema)
.use(rehypeStringify)
```

### C2. Verify

After this change:

- Notes with frontmatter (e.g. the CouchDB ADR) should render without the YAML table.
- `renderMarkdown()` still returns `frontmatter` data in the result object — the data is extracted, just not rendered.

---

## Commit D: Editor button hierarchy (§6)

**Problem:** Save, Minimize, and Discard all render as identical ghost buttons with no visual distinction.

### D1. Restyle buttons — `src/components/EditorPane.tsx:65-73`

Replace the three button lines with:

```tsx
<Button variant="ghost" size="sm" onClick={handleMinimize}>
  {t("draft.minimize")}
</Button>
<Button variant="secondary" size="sm" onClick={() => void handleSave()}>
  {t("draft.save")}
</Button>
<Button variant="ghost" size="sm" className="text-red-600" onClick={() => void handleDiscard()}>
  {t("draft.discard")}
</Button>
```

Changes:

- **Minimize**: `↓` symbol → text label "Minimize", stays `ghost`. Remove `aria-label` (the visible text is sufficient).
- **Save**: `ghost` → `secondary` (bordered, visible as primary action).
- **Discard**: `ghost` with `text-red-600` className to signal destructive action.

### D2. Inline discard confirmation — `src/components/EditorPane.tsx`

Replace `window.confirm()` with an inline confirmation state.

Add state:

```ts
const [confirmingDiscard, setConfirmingDiscard] = useState(false);
```

Change `handleDiscard`:

```ts
const handleDiscard = async () => {
  await discardDraft(draft.timestamp, draft.isNew);
  void navigate({ to: "/", search: (prev) => ({ ...prev, draft: undefined }) });
};
```

Replace the Discard button with a conditional:

```tsx
{
  confirmingDiscard ? (
    <>
      <Text variant="body" as="span" className="text-red-600 text-sm">
        {t("draft.discardAreYouSure")}
      </Text>
      <Button
        variant="ghost"
        size="sm"
        className="text-red-600"
        onClick={() => void handleDiscard()}
      >
        {t("draft.discardConfirmAction")}
      </Button>
      <Button variant="ghost" size="sm" onClick={() => setConfirmingDiscard(false)}>
        {t("draft.discardCancel")}
      </Button>
    </>
  ) : (
    <Button
      variant="ghost"
      size="sm"
      className="text-red-600"
      onClick={() => setConfirmingDiscard(true)}
    >
      {t("draft.discard")}
    </Button>
  );
}
```

### D3. Add i18n keys — `src/i18n/en.ts`

```ts
"draft.discardAreYouSure": "Are you sure?",
"draft.discardConfirmAction": "Confirm",
"draft.discardCancel": "Cancel",
```

The existing `draft.discardConfirm` key (for `window.confirm`) becomes unused. Remove it.

---

## Commit E: Gear popover consistency (§7)

**Problem:** Settings (NavLink, no decoration) and Log out (Button with underline) have different visual styles in the same menu.

### E1. Restyle menu items — `src/components/GearPopover.tsx:58-81`

Replace the menu content with `DividedList` and uniform item styling:

```tsx
import { DividedList } from "./ds/DividedList";
```

Replace lines 58-81:

```tsx
<div className="absolute right-0 top-full mt-1 z-30 min-w-48 border border-edge rounded bg-surface shadow-sm">
  {selectedRepo && (
    <div className="px-3 py-2 border-b border-edge">
      <Text variant="mono" as="p">
        {selectedRepo.owner}/{selectedRepo.repo}
      </Text>
    </div>
  )}
  <DividedList>
    <li>
      <NavLink to="/settings" variant="listItem" onClick={() => setOpen(false)}>
        {t("menu.settings")}
      </NavLink>
    </li>
    <li>
      <button
        className="block w-full text-left py-2.5 text-sm text-paper hover:underline"
        onClick={() => {
          setOpen(false);
          void send({ type: "LOGOUT" });
        }}
      >
        {t("auth.logout")}
      </button>
    </li>
  </DividedList>
</div>
```

This uses `DividedList` for consistent hairline dividers and `NavLink variant="listItem"` for Settings. Log out uses a plain `<button>` styled to match `NavLink listItem` (block, py-2.5, text-sm, hover:underline). The `px-3` padding moves to each item or the list container.

Note: `DividedList` renders a `<ul>`, so menu items should be `<li>` elements. Check that `NavLink` wraps correctly inside `<li>`.

Alternatively, add padding to the `DividedList` wrapper:

```tsx
<div className="px-3">
  <DividedList>...</DividedList>
</div>
```

---

## Commit F: Empty states (§8)

**Problem:** Empty repo and empty search results show blank space with no feedback.

### F1. Add i18n keys — `src/i18n/en.ts`

```ts
"notes.empty": "No notes yet. Click + New note to get started.",
"notes.noResults": "No notes matching \u2018{query}\u2019.",
```

### F2. Add empty state to `ReferencePanel` — `src/components/ReferencePanel.tsx:75-94`

Import `searchQueryAtom`:

```ts
import { searchQueryAtom } from "../atoms/globals";
```

Read the query:

```ts
const query = useAtomValue(searchQueryAtom);
```

Replace the `<ul>` block (lines 75-94) with:

```tsx
{notes.length === 0 ? (
  <div className="flex items-center justify-center h-48">
    <Text variant="secondary" className="text-center">
      {query ? t("notes.noResults", { query }) : t("notes.empty")}
    </Text>
  </div>
) : (
  <ul className="list-none p-0 m-0 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3 p-4">
    {notes.map((note) => (
      // ...existing NoteRow rendering
    ))}
  </ul>
)}
```

### F3. Verify `t()` supports interpolation

Check `src/i18n/index.ts` to confirm the `t()` function handles `{query}` replacement. If it doesn't, it needs a simple `.replace("{query}", query)` path — or pass the formatted string directly:

```ts
t("notes.noResults").replace("{query}", query);
```

---

## Commit G: Note sort order + sort control (§9 + §11)

**Problem:** Notes sort oldest-first with no way to change. Newest-first is more useful for daily workflows. Search results have no "best match" option.

### G1. Sort `noteListAtom` newest-first — `src/atoms/store.ts:134-153`

After building the `entries` array, sort before returning:

```ts
entries.sort((a, b) => {
  if (a.date && b.date) return b.date.getTime() - a.date.getTime();
  if (a.date && !b.date) return -1;
  if (!a.date && b.date) return 1;
  return b.relativePath.localeCompare(a.relativePath);
});

return entries;
```

This gives newest-first with nulls last, and lexicographic descending tiebreaker.

### G2. Add sort atom — `src/atoms/search.ts`

```ts
export type SortOrder = "newest" | "oldest" | "best-match";
export const sortAtom = atom<SortOrder>("newest");
```

### G3. Derive sorted results — `src/atoms/search.ts`

Rename current `searchResultsAtom` to `rawSearchResultsAtom` (internal). Create a new `searchResultsAtom` that applies sorting:

```ts
const rawSearchResultsAtom = atom<NoteListEntry[]>((get) => {
  // ...existing searchResultsAtom logic
});

export const searchResultsAtom = atom<NoteListEntry[]>((get) => {
  const entries = get(rawSearchResultsAtom);
  const sort = get(sortAtom);
  const query = get(searchQueryAtom);

  // "best-match" only applies when there's a query (MiniSearch order is already by score)
  if (sort === "best-match" && query.trim()) return entries;

  const sorted = [...entries];
  const direction = sort === "oldest" ? 1 : -1;

  sorted.sort((a, b) => {
    if (a.date && b.date) return direction * (a.date.getTime() - b.date.getTime());
    if (a.date && !b.date) return -1;
    if (!a.date && b.date) return 1;
    return direction * a.relativePath.localeCompare(b.relativePath);
  });

  return sorted;
});
```

Note: Since `noteListAtom` now sorts newest-first (G1), the `rawSearchResultsAtom` for non-search results is already newest-first. The `searchResultsAtom` derivation re-sorts to respect the user's choice. When `sort === "newest"`, the re-sort matches the default order.

### G4. Add sort control to `ReferencePanel` header — `src/components/ReferencePanel.tsx`

Add imports:

```ts
import { sortAtom, searchQueryAtom } from "../atoms/globals";
import type { SortOrder } from "../atoms/search";
```

Read and set sort:

```ts
const [sort, setSort] = useAtom(sortAtom);
const query = useAtomValue(searchQueryAtom);
```

In the sticky header bar (line 59), add a `<select>` after `SearchBar`:

```tsx
<div className="sticky top-0 z-10 bg-base h-11 flex items-center gap-2 px-4 border-b border-edge">
  <SearchBar />
  <select
    className="text-xs text-muted bg-transparent border-none focus:outline-none cursor-pointer"
    value={sort === "best-match" && !query.trim() ? "newest" : sort}
    onChange={(e) => setSort(e.target.value as SortOrder)}
  >
    <option value="newest">{t("sort.newest")}</option>
    <option value="oldest">{t("sort.oldest")}</option>
    {query.trim() && <option value="best-match">{t("sort.bestMatch")}</option>}
  </select>
</div>
```

### G5. Add i18n keys — `src/i18n/en.ts`

```ts
"sort.newest": "Newest",
"sort.oldest": "Oldest",
"sort.bestMatch": "Best match",
```

### G6. Reset sort when query clears

In `searchResultsAtom` derivation (G3), when `sort === "best-match"` and query is empty, fall through to newest-first sorting. This handles the case automatically without needing an effect to reset the atom.

### G7. Export `sortAtom` from globals

In `src/atoms/globals.ts` (or wherever the barrel export is), re-export `sortAtom` and `SortOrder` from search.

---

## Commit H: Search input accessibility (§10)

**Problem:** Console warns about missing id/name on the search input.

### H1. Add attributes — `src/components/SearchBar.tsx:22-29`

Add `id` and `name` props to the `TextInput`:

```tsx
<TextInput
  id="note-search"
  name="q"
  type="search"
  placeholder={t("search.placeholder")}
  aria-label={t("search.placeholder")}
  value={local}
  onChange={(e) => setLocal(e.target.value)}
  width="full"
/>
```

---

## Implementation order

| #   | Commit | Sections | Files touched                                                        | Risk                                                 |
| --- | ------ | -------- | -------------------------------------------------------------------- | ---------------------------------------------------- |
| 1   | A      | §2 + §3  | `store.ts`, `NoteRow.tsx`, `en.ts`                                   | Medium — touches title derivation and card rendering |
| 2   | B      | §4       | `markdown.ts`, `index.css`, `package.json`                           | Low — additive plugin, no existing code changed      |
| 3   | C      | §5       | `markdown.ts`                                                        | Low — 3-line plugin, removes rendered frontmatter    |
| 4   | D      | §6       | `EditorPane.tsx`, `en.ts`                                            | Low — visual-only + remove `window.confirm`          |
| 5   | E      | §7       | `GearPopover.tsx`                                                    | Low — visual-only                                    |
| 6   | F      | §8       | `ReferencePanel.tsx`, `en.ts`                                        | Low — additive, no existing logic changed            |
| 7   | G      | §9 + §11 | `store.ts`, `search.ts`, `ReferencePanel.tsx`, `globals.ts`, `en.ts` | Medium — renames internal atom, adds sort state      |
| 8   | H      | §10      | `SearchBar.tsx`                                                      | Trivial — two attributes                             |

## Dependencies

- **New npm package:** `unist-util-visit` (for commit B). Already a transitive dependency of the unified ecosystem but should be added as a direct dependency.
- **Plan 06** should be implemented first — §1 (save bug) blocks testing with localRepo.
