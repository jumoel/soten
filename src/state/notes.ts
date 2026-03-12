import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { REPO_DIR } from "../lib/constants";
import { filenamesAtom } from "./repo";

export type NoteListEntry = {
  path: string;
  relativePath: string;
  title: string;
  date: Date | null;
};

const dateFileRe = /^(\d{4})-(\d{2})-(\d{2})\.md$/;

const prettyDate = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

const prettyTime = new Intl.DateTimeFormat("en-US", {
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

function parseTimestampFilename(stem: string): Date | null {
  const compactMatch = stem.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?$/);
  if (compactMatch) {
    const [, y, mo, d, h, mi, s] = compactMatch;
    const date = new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +(s ?? 0)));
    if (!Number.isNaN(date.getTime()) && date.getFullYear() >= 2000 && date.getFullYear() <= 2100) {
      return date;
    }
  }
  if (/^\d{10}$/.test(stem) || /^\d{13}$/.test(stem)) {
    const ms = stem.length === 10 ? +stem * 1000 : +stem;
    const date = new Date(ms);
    if (!Number.isNaN(date.getTime()) && date.getFullYear() >= 2000 && date.getFullYear() <= 2100) {
      return date;
    }
  }
  return null;
}

function parseNoteMeta(relativePath: string): { title: string; date: Date | null } {
  const filename = relativePath.split("/").pop() ?? relativePath;
  const dateMatch = filename.match(dateFileRe);
  if (dateMatch) {
    const date = new Date(Date.UTC(+dateMatch[1], +dateMatch[2] - 1, +dateMatch[3]));
    return { title: prettyDate.format(date), date };
  }
  const stem = filename.endsWith(".md") ? filename.slice(0, -3) : filename;
  const tsDate = parseTimestampFilename(stem);
  if (tsDate) return { title: prettyTime.format(tsDate), date: tsDate };
  return { title: stem, date: null };
}

const rawNoteListAtom = atom((get) => {
  const filenames = get(filenamesAtom);
  const prefix = `${REPO_DIR}/`;
  const entries: NoteListEntry[] = [];

  for (const path of filenames) {
    const relativePath = path.startsWith(prefix) ? path.slice(prefix.length) : path;
    if (relativePath.startsWith("uploads/")) continue;
    if (!relativePath.endsWith(".md")) continue;
    const { title, date } = parseNoteMeta(relativePath);
    entries.push({ path, relativePath, title, date });
  }

  entries.sort((a, b) => {
    if (a.date && b.date) return b.date.getTime() - a.date.getTime();
    if (a.date && !b.date) return -1;
    if (!a.date && b.date) return 1;
    return b.relativePath.localeCompare(a.relativePath);
  });

  return entries;
});

// Structurally stable: only emits a new reference when paths actually change
let prevPaths: string[] = [];
let prevEntries: NoteListEntry[] = [];

export const noteListAtom = atom<NoteListEntry[]>((get) => {
  const entries = get(rawNoteListAtom);
  const paths = entries.map((e) => e.path);
  if (paths.length === prevPaths.length && paths.every((p, i) => p === prevPaths[i])) {
    return prevEntries;
  }
  prevPaths = paths;
  prevEntries = entries;
  return entries;
});

export const pinnedNotesAtom = atomWithStorage<string[]>("pinnedNotes", [], undefined, {
  getOnInit: true,
});
