import { createStore, atom } from "jotai";
import { atomWithStorage, atomFamily } from "jotai/utils";
import { renderMarkdown } from "../markdown";
import { readFile } from "../lib/fs";
import { REPO_DIR } from "../lib/constants";
import { t } from "../i18n";

export const store = createStore();

export type TextFile = { type: "text"; content: string };
export type ImageFile = { type: "image"; content: Blob };

export type User = {
  username: string;
  token: string;
  installationId: string;
  email: string;
};

export const userAtom = atomWithStorage<User | null>("user", null, undefined, { getOnInit: true });
export type Repo = { owner: string; repo: string };

export const selectedRepoAtom = atomWithStorage<Repo | null>("selectedRepo", null, undefined, {
  getOnInit: true,
});

export const cachedReposAtom = atomWithStorage<string[] | null>("cachedRepos", null, undefined, {
  getOnInit: true,
});

export type Theme = "light" | "dark" | "system";
export const themeAtom = atomWithStorage<Theme>("theme", "light", undefined, { getOnInit: true });

export type AppMachine =
  | { phase: "initializing" }
  | { phase: "unauthenticated"; authError: string | null }
  | { phase: "fetchingRepos"; user: User }
  | { phase: "selectingRepo"; user: User; repos: string[] }
  | { phase: "cloningRepo"; user: User; repos: string[]; selectedRepo: Repo }
  | {
      phase: "ready";
      user: User;
      repos: string[];
      selectedRepo: Repo;
      filenames: string[];
      hasRemote: boolean;
    }
  | { phase: "error"; message: string; user: User };

export const machineAtom = atom<AppMachine>({ phase: "initializing" });

export const fileAtom = atomFamily((path: string) => atom(async () => readFile(path)));

const dateFileRe = /^(\d{4})-(\d{2})-(\d{2})\.md$/;
const prettyDate = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});
export const prettyDateTime = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
  timeZone: "UTC",
});

function parseTimestampFilename(stem: string): Date | null {
  const compactMatch = stem.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?$/);
  if (compactMatch) {
    const [, y, mo, d, h, mi, s] = compactMatch;
    const date = new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +(s ?? 0)));
    if (!isNaN(date.getTime()) && date.getFullYear() >= 2000 && date.getFullYear() <= 2100) {
      return date;
    }
  }

  if (/^\d{10}$/.test(stem) || /^\d{13}$/.test(stem)) {
    const ms = stem.length === 10 ? +stem * 1000 : +stem;
    const date = new Date(ms);
    if (!isNaN(date.getTime()) && date.getFullYear() >= 2000 && date.getFullYear() <= 2100) {
      return date;
    }
  }

  return null;
}

function noteDate(relativePath: string): Date | null {
  const filename = relativePath.split("/").pop() ?? relativePath;
  const dateMatch = filename.match(dateFileRe);
  if (dateMatch) {
    return new Date(Date.UTC(+dateMatch[1], +dateMatch[2] - 1, +dateMatch[3]));
  }

  const stem = filename.endsWith(".md") ? filename.slice(0, -3) : filename;
  return parseTimestampFilename(stem);
}

function noteTitle(relativePath: string): string {
  const filename = relativePath.split("/").pop() ?? relativePath;

  const dateMatch = filename.match(dateFileRe);
  if (dateMatch) {
    const date = new Date(Date.UTC(+dateMatch[1], +dateMatch[2] - 1, +dateMatch[3]));
    return t("note.dayPrefix", { date: prettyDate.format(date) });
  }

  const stem = filename.endsWith(".md") ? filename.slice(0, -3) : filename;
  const tsDate = parseTimestampFilename(stem);
  if (tsDate) return t("note.unnamedWithDate", { date: prettyDateTime.format(tsDate) });

  return t("note.unnamedWithStem", { stem });
}

export type RenderedNote = { frontmatter: Record<string, unknown> | null; html: string };

export const renderedNoteAtom = atomFamily((path: string) =>
  atom(async (get) => {
    const file = await get(fileAtom(path));
    if (!file || file.type !== "text") return null;
    return renderMarkdown(file.content);
  }),
);

export type NoteListEntry = {
  path: string;
  relativePath: string;
  title: string;
  date: Date | null;
};

export const noteListAtom = atom<NoteListEntry[]>((get) => {
  const m = get(machineAtom);
  if (m.phase !== "ready") return [];

  const prefix = REPO_DIR + "/";
  const entries: NoteListEntry[] = [];

  for (const path of m.filenames) {
    const relativePath = path.startsWith(prefix) ? path.slice(prefix.length) : path;

    if (relativePath.startsWith("uploads/")) continue;

    const title = relativePath.endsWith(".md") ? noteTitle(relativePath) : relativePath;
    const date = relativePath.endsWith(".md") ? noteDate(relativePath) : null;

    entries.push({ path, relativePath, title, date });
  }

  return entries;
});

export const pinnedNotesAtom = atom<string[]>([]);
export const expandedNoteAtom = atom<string | null>(null);

const NOTE_CARD_THRESHOLD = 375;
const closingFmRe = /\n---\r?\n/;

function findBodyStart(content: string): number {
  if (!content.startsWith("---\n") && !content.startsWith("---\r\n")) return 0;
  const closing = closingFmRe.exec(content);
  return closing !== null ? closing.index + closing[0].length : 0;
}

function findCutPoint(body: string, threshold: number): number {
  const headingCut = body.lastIndexOf("\n\n#", threshold);
  if (headingCut > 0) return headingCut;
  const paraCut = body.lastIndexOf("\n\n", threshold);
  if (paraCut > 0) return paraCut;
  const lineCut = body.lastIndexOf("\n", threshold);
  if (lineCut > 0) return lineCut;
  return threshold;
}

const cardCache = new Map<string, { html: string; isShort: boolean }>();

export function clearCardCache() {
  cardCache.clear();
}

export const noteCardAtom = atomFamily((path: string) =>
  atom(async (get) => {
    const file = await get(fileAtom(path));
    if (!file || file.type !== "text") return null;

    const content = file.content;
    const bodyStart = findBodyStart(content);
    const body = content.slice(bodyStart);
    const isShort = body.length <= NOTE_CARD_THRESHOLD;
    const displayContent = isShort
      ? content
      : content.slice(0, bodyStart + findCutPoint(body, NOTE_CARD_THRESHOLD));

    const cached = cardCache.get(displayContent);
    if (cached) return cached;

    const { html } = await renderMarkdown(displayContent);
    const result = { html, isShort };
    cardCache.set(displayContent, result);
    return result;
  }),
);

export const gitWorkingAtom = atom(false);
