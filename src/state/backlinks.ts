import { atom } from "jotai";
import { pfs } from "../lib/fs";
import { store } from "./store";

/**
 * Global backlinks index: maps a filename stem to the set of filename stems that link to it.
 * e.g. { "1773221352": Set(["1776933600"]) } means 1776933600.md contains [[1773221352]].
 */
export const backlinksIndexAtom = atom<Map<string, Set<string>>>(new Map<string, Set<string>>());

const WIKILINK_RE = /\[\[([^\]]+)\]\]/g;

function extractWikilinks(content: string): string[] {
  const links: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = WIKILINK_RE.exec(content)) !== null) {
    links.push(match[1]);
  }
  return links;
}

function stemFromPath(path: string): string {
  const filename = path.split("/").pop() ?? path;
  return filename.endsWith(".md") ? filename.slice(0, -3) : filename;
}

/** Build the full backlinks index from all note files. Call on clone/sync. */
export async function buildBacklinksIndex(filePaths: string[]): Promise<void> {
  const index = new Map<string, Set<string>>();

  const results = await Promise.allSettled(
    filePaths.map(async (path) => {
      const content = await pfs.readFile(path, { encoding: "utf8" });
      const sourceStem = stemFromPath(path);
      const links = extractWikilinks(content);
      return { sourceStem, links };
    }),
  );

  for (const result of results) {
    if (result.status !== "fulfilled") continue;
    const { sourceStem, links } = result.value;
    for (const target of links) {
      let set = index.get(target);
      if (!set) {
        set = new Set();
        index.set(target, set);
      }
      set.add(sourceStem);
    }
  }

  store.set(backlinksIndexAtom, index);
}

/** Update the index for a single note that changed. */
export async function updateBacklinksForNote(path: string): Promise<void> {
  const sourceStem = stemFromPath(path);
  const current = store.get(backlinksIndexAtom);
  const next = new Map(current);

  // Remove all old entries where this note was the source
  for (const [target, sources] of next) {
    if (sources.has(sourceStem)) {
      const updated = new Set(sources);
      updated.delete(sourceStem);
      if (updated.size === 0) {
        next.delete(target);
      } else {
        next.set(target, updated);
      }
    }
  }

  // Re-scan this note's content for links
  try {
    const content = await pfs.readFile(path, { encoding: "utf8" });
    const links = extractWikilinks(content);
    for (const target of links) {
      let set = next.get(target);
      if (!set) {
        set = new Set();
        next.set(target, set);
      }
      set.add(sourceStem);
    }
  } catch {
    // File may have been deleted
  }

  store.set(backlinksIndexAtom, next);
}
