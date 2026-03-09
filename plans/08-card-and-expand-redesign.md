# Plan 08: Card and expand redesign

## Problem

The current card implementation has two related issues:

**Duplicate content.** `noteCardAtom` extracts the first H1 heading, strips it from the markdown body, then renders the stripped body. `NoteRow` displays the extracted heading as a `Text variant="heading"` element *and* renders the card HTML below it. If the note opens with an H1, users see it twice — once as a styled heading, once in the preview HTML. For notes without an H1, `NoteRow` falls back to the filename-derived title, which is unrelated to content.

**Card / expanded inconsistency.** When a note is expanded, `NoteExpanded` renders `renderedNoteAtom` HTML — the full, unmodified markdown. The card preview was rendered from `noteCardAtom` with H1 stripped and body truncated. The two renderings are visually different, making expansion feel like a content switch rather than a reveal.

## Goal

The card preview is literally a short version of what you see expanded. Collapsed = date + first ~375 chars of rendered markdown, cut naturally. Expanded = date + full rendered markdown + Pin/Edit action buttons. No separate title extraction. No H1 stripping. `NoteExpanded` is deleted.

---

## Step 1 — Simplify `noteCardAtom` — `src/atoms/store.ts`

### 1a. Narrow `cardCache` type

Change:

```ts
const cardCache = new Map<
  string,
  { html: string; isShort: boolean; derivedTitle: string | null }
>();
```

to:

```ts
const cardCache = new Map<string, { html: string; isShort: boolean }>();
```

### 1b. Remove H1 extraction from `noteCardAtom`

Change the atom body from:

```ts
    const content = file.content;
    const bodyStart = findBodyStart(content);
    const body = content.slice(bodyStart);

    const h1Re = /^#\s+(.+)$/m;
    const h1Match = body.match(h1Re);
    const derivedTitle = h1Match ? h1Match[1].trim() : null;
    const strippedBody = derivedTitle ? body.replace(h1Re, "").trimStart() : body;

    const isShort = strippedBody.length <= NOTE_CARD_THRESHOLD;
    const previewBody = isShort
      ? strippedBody
      : strippedBody.slice(0, findCutPoint(strippedBody, NOTE_CARD_THRESHOLD));
    const displayContent = content.slice(0, bodyStart) + previewBody;

    const cached = cardCache.get(displayContent);
    if (cached) return cached;

    const { html } = await renderMarkdown(displayContent);
    const result = { html, isShort, derivedTitle };
    cardCache.set(displayContent, result);
    return result;
```

to:

```ts
    const content = file.content;
    const bodyStart = findBodyStart(content);
    const body = content.slice(bodyStart);

    const isShort = body.length <= NOTE_CARD_THRESHOLD;
    const previewBody = isShort
      ? body
      : body.slice(0, findCutPoint(body, NOTE_CARD_THRESHOLD));
    const displayContent = content.slice(0, bodyStart) + previewBody;

    const cached = cardCache.get(displayContent);
    if (cached) return cached;

    const { html } = await renderMarkdown(displayContent);
    const result = { html, isShort };
    cardCache.set(displayContent, result);
    return result;
```

---

## Step 2 — New file `src/components/NoteFullContent.tsx`

Extract the expanded-note rendering into a standalone exported component. This is used by both `NoteRow` (expanded card) and `PinnedNote`.

Copy the SVG icons from `NoteExpanded.tsx` (they are not exported there). The action buttons call `e.stopPropagation()` to prevent the card's `onClick={onExpand}` from firing.

```tsx
import { useMemo } from "react";
import { useAtom } from "jotai";
import { loadable } from "jotai/utils";
import { Button } from "./Button";
import { ProseContent } from "./ProseContent";
import { FrontmatterTable } from "./FrontmatterTable";
import { LoadingSpinner } from "./LoadingSpinner";
import { renderedNoteAtom } from "../atoms/globals";
import { t } from "../i18n";

function PinIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M12 2l3 7h5l-4 4 1.5 7L12 17l-5.5 3L8 13 4 9h5z" />
    </svg>
  );
}

function EditIcon() {
  return (
    <svg
      width="14"
      height="14"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.5"
      aria-hidden="true"
    >
      <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
      <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
    </svg>
  );
}

type NoteFullContentProps = {
  path: string;
  onPin: () => void;
  onEdit?: () => void;
};

export function NoteFullContent({ path, onPin, onEdit }: NoteFullContentProps) {
  const fullAtom = useMemo(() => loadable(renderedNoteAtom(path)), [path]);
  const [result] = useAtom(fullAtom);

  if (result.state === "loading") return <LoadingSpinner />;
  if (result.state !== "hasData" || !result.data) return null;

  return (
    <>
      <div className="flex gap-2 mt-2 mb-1">
        <Button
          variant="ghost"
          size="sm"
          onClick={(e) => {
            e.stopPropagation();
            onPin();
          }}
          aria-label={t("note.pin")}
        >
          <PinIcon /> {t("note.pin")}
        </Button>
        {onEdit && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            aria-label={t("note.edit")}
          >
            <EditIcon /> {t("note.edit")}
          </Button>
        )}
      </div>
      <div className="max-h-[60vh] overflow-y-auto">
        <FrontmatterTable data={result.data.frontmatter} />
        <ProseContent html={result.data.html} />
      </div>
    </>
  );
}
```

---

## Step 3 — Rewrite `src/components/NoteRow.tsx`

### 3a. Updated imports

```tsx
import { useMemo } from "react";
import { useAtom } from "jotai";
import { loadable } from "jotai/utils";
import { Card } from "./ds/Card";
import { Text } from "./ds/Text";
import { NoteFullContent } from "./NoteFullContent";
import { noteCardAtom } from "../atoms/globals";
import { prettyDate, prettyDateTime } from "../atoms/store";
import type { NoteListEntry } from "../atoms/store";
```

Removed: `useState`, `useCallback`, `useEffect`, `NoteExpanded`, `renderedNoteAtom`, `Button`, `ProseContent`, `FrontmatterTable`, `LoadingSpinner`, `t` (all moved to `NoteFullContent`).

### 3b. Simplified `NoteCardPreview`

Remove the `onTitle` prop, `useEffect`, and all `derivedTitle` machinery:

```tsx
function NoteCardPreview({ path }: { path: string }) {
  const cardAtom = useMemo(() => loadable(noteCardAtom(path)), [path]);
  const [result] = useAtom(cardAtom);
  if (result.state !== "hasData" || !result.data) return null;
  return (
    <div
      className="prose prose-sm dark:prose-invert mt-1 line-clamp-5 [&_*]:!m-0 [&_*]:!p-0 [&_h1]:!text-sm [&_h1]:!font-semibold [&_h2]:!text-sm [&_h2]:!font-medium [&_h3]:!text-sm [&_h3]:!font-medium"
      dangerouslySetInnerHTML={{ __html: result.data.html }}
    />
  );
}
```

### 3c. Simplified `NoteRow`

Remove title state, `handleTitle`, `displayTitle`, and the heading element. The card conditionally renders either the truncated preview or the full content with action buttons:

```tsx
export function NoteRow({ note, expanded, onExpand, onPin, onEdit }: NoteRowProps) {
  return (
    <li className="flex flex-col gap-1">
      <Card as="button" interactive hoverable onClick={onExpand} className="w-full text-left">
        {note.date && (
          <Text variant="meta" as="span">
            {formatCardDate(note.date)}
          </Text>
        )}
        {expanded ? (
          <NoteFullContent path={note.path} onPin={onPin} onEdit={onEdit} />
        ) : (
          <NoteCardPreview path={note.path} />
        )}
      </Card>
    </li>
  );
}
```

The `<li>` no longer has a sibling `NoteExpanded` element — all content is inside the card.

---

## Step 4 — Update `src/components/PinnedNote.tsx`

Replace the `NoteExpanded` import with `NoteFullContent` and update the render:

Change:

```tsx
import { NoteExpanded } from "./NoteExpanded";
```

to:

```tsx
import { NoteFullContent } from "./NoteFullContent";
```

Find the usage (check current line count with a read) and change:

```tsx
{expanded && <NoteExpanded path={note.path} onPin={() => {}} onEdit={onEdit} />}
```

to:

```tsx
{expanded && <NoteFullContent path={note.path} onPin={() => {}} onEdit={onEdit} />}
```

---

## Step 5 — Delete `src/components/NoteExpanded.tsx`

After steps 2–4, `NoteExpanded` has no remaining importers. Delete the file.

Verify first:

```sh
grep -r "NoteExpanded" src/
```

Expected: no results.

---

## Step 6 — Verify

```sh
npm run types
npm run lint
npm run style
npm run build
```

Common issues to catch:

- Leftover `useState` / `useCallback` / `useEffect` imports in `NoteRow.tsx` — lint will flag as unused
- `result.data.derivedTitle` reference still present somewhere — types will catch it
- `onTitle` prop lingering on `NoteCardPreview` call site — types will catch it

---

## Summary of changes

| File | Change |
|------|--------|
| `src/atoms/store.ts` | Narrow `cardCache` type; remove H1 extraction from `noteCardAtom` |
| `src/components/NoteFullContent.tsx` | **New file** — exported expanded note renderer with action buttons |
| `src/components/NoteRow.tsx` | Remove title state and `NoteExpanded`; simplify `NoteCardPreview`; conditional expanded render inside card |
| `src/components/NoteExpanded.tsx` | **Deleted** |
| `src/components/PinnedNote.tsx` | Replace `NoteExpanded` import/usage with `NoteFullContent` |

## What is NOT in scope

- Changes to `noteTitle()` or `NoteListEntry.title` — filename-based titles are unchanged
- Changes to `renderedNoteAtom` or `renderMarkdown` — full render pipeline is unchanged
- Changes to `ReferencePanel`, `expandedNoteAtom`, or URL sync logic
- The `isShort` flag on `noteCardAtom` — returned but not yet used for a "show more" indicator; left for future use
- Dark mode or typography changes
