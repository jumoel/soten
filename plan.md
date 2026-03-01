# Plan: Improve Note Listing Display

## Summary

Update the front page note listing to show meaningful titles instead of raw filenames, hide uploads, and format date-based filenames nicely.

## Current State

- `FrontPage` in `src/routes/front.tsx` reads `repoFilenamesAtom` (a flat `string[]` of full paths) and displays each as the relative path text
- `filesAtom` in `src/atoms/store.ts` holds `Record<string, TextFile | ImageFile>` — all file content is already loaded by the time the front page renders (`repoReadyAtom` gates rendering)
- `markdown.ts` has a full unified pipeline that extracts frontmatter but does not extract the leading h1

## Changes

### Step 1: Add `extractTitle` to `src/markdown.ts`

Add a lightweight function that parses markdown and returns the text content of the first `# heading`. Uses `unified().use(remarkParse).use(remarkFrontmatter).parse()` to build an mdast tree (no HTML conversion), then walks `tree.children` for the first `heading` node with `depth: 1`. A small recursive helper collects plain text from the heading's children (handles bold/italic/code spans inside headings).

Returns `string | null`.

### Step 2: Add a derived `noteListAtom` in `src/atoms/store.ts`

A read-only Jotai atom derived from `repoFilenamesAtom` and `filesAtom` that computes the display list:

1. **Filter out uploads**: Skip files whose relative path starts with `uploads/`
2. **For each `.md` file**, determine the display title using this priority:
   - Extract the leading h1 via `extractTitle()` → use if found
   - If filename matches `YYYY-MM-DD.md` → format as `"Day: <pretty date>"` (e.g. `"Day: March 1, 2026"`) using `Intl.DateTimeFormat` with `{ year: "numeric", month: "long", day: "numeric" }` and UTC timezone
   - Otherwise → `"Unnamed note · <filename without .md>"` to give the user some context about which file it is
3. **Non-`.md` files**: show the relative path as-is (current behavior)

Type: `{ path: string; relativePath: string; title: string }[]`

### Step 3: Re-export from `src/atoms/globals.ts`

Add `noteListAtom` to the existing re-export list.

### Step 4: Update `src/routes/front.tsx`

- Import `noteListAtom` instead of `repoFilenamesAtom`
- Render each entry's `title` as the link text
- Keep using `relativePath` for the link `to` prop
- Remove the `font-mono` class since titles are human-readable

### Step 5: Run quality checks

Run `npm run lint`, `npm run style`, `npm run types`, and `npm run build`. Fix any issues.

## Files Modified

| File                   | Change                            |
| ---------------------- | --------------------------------- |
| `src/markdown.ts`      | Add `extractTitle()` function     |
| `src/atoms/store.ts`   | Add `noteListAtom` derived atom   |
| `src/atoms/globals.ts` | Re-export `noteListAtom`          |
| `src/routes/front.tsx` | Use `noteListAtom`, render titles |

## Design Decisions

- **Lightweight title extraction**: Uses `remarkParse` only (no rehype/HTML rendering) — avoids the overhead of full rendering for every file on the front page. The parser is already a dependency.
- **Derived atom**: Keeps logic reactive and centralized. The list auto-updates when files change. No new state to manage manually.
- **No new dependencies**: Uses existing `unified`/`remark` packages and built-in `Intl.DateTimeFormat`.
- **Filter at the atom level**: Uploads are filtered in the derived atom (presentation layer) rather than in `readRepoFiles()` (filesystem layer), keeping concerns separated.
- **UTC date parsing**: `YYYY-MM-DD` filenames are parsed as UTC dates to avoid timezone-related off-by-one day issues.
