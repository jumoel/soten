import { createStore, atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { extractTitle } from "../markdown";
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
export const selectedRepoAtom = atomWithStorage<{ owner: string; repo: string } | null>(
  "selectedRepo",
  null,
  undefined,
  { getOnInit: true },
);

export type AppMachine =
  | { phase: "initializing" }
  | { phase: "unauthenticated"; authError: string | null }
  | { phase: "fetchingRepos"; user: User }
  | { phase: "selectingRepo"; user: User; repos: string[] }
  | {
      phase: "cloningRepo";
      user: User;
      repos: string[];
      selectedRepo: { owner: string; repo: string };
    }
  | {
      phase: "loadingFiles";
      user: User;
      repos: string[];
      selectedRepo: { owner: string; repo: string };
      filenames: string[];
      loaded: number;
    }
  | {
      phase: "ready";
      user: User;
      repos: string[];
      selectedRepo: { owner: string; repo: string };
      filenames: string[];
      files: Record<string, TextFile | ImageFile>;
    }
  | { phase: "error"; message: string; user: User };

export const machineAtom = atom<AppMachine>({ phase: "initializing" });

export const filesAtom = atom<Record<string, TextFile | ImageFile>>((get) => {
  const m = get(machineAtom);
  return m.phase === "ready" ? m.files : {};
});

const dateFileRe = /^(\d{4})-(\d{2})-(\d{2})\.md$/;
const prettyDate = new Intl.DateTimeFormat("en-US", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});
const prettyDateTime = new Intl.DateTimeFormat("en-US", {
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

function noteTitle(relativePath: string, content: string | null): string {
  if (content) {
    const h1 = extractTitle(content);
    if (h1) return h1;
  }

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

export type NoteListEntry = { path: string; relativePath: string; title: string };

export const noteListAtom = atom<NoteListEntry[]>((get) => {
  const m = get(machineAtom);
  if (m.phase !== "ready") return [];

  const prefix = REPO_DIR + "/";
  const entries: NoteListEntry[] = [];

  for (const path of m.filenames) {
    const relativePath = path.startsWith(prefix) ? path.slice(prefix.length) : path;

    if (relativePath.startsWith("uploads/")) continue;

    const file = m.files[path];
    const content = file?.type === "text" ? file.content : null;
    const title = relativePath.endsWith(".md") ? noteTitle(relativePath, content) : relativePath;

    entries.push({ path, relativePath, title });
  }

  return entries;
});
