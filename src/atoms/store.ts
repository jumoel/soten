import { createStore, atom } from "jotai";
import { atomWithStorage } from "jotai/utils";
import { extractTitle } from "../markdown";
import { REPO_DIR } from "../lib/constants";
import { t } from "../i18n";

export const store = createStore();

export enum AppState {
  Initializing = "Initializing",
  Initialized = "Initialized",
}
export const appStateAtom = atom(AppState.Initializing);

export enum AuthState {
  Unauthenticated = "Unauthenticated",
  Authenticated = "Authenticated",
}
export const authStateAtom = atom(AuthState.Unauthenticated);

export type TextFile = { type: "text"; content: string };
export type ImageFile = { type: "image"; content: Blob };

export type User = {
  username: string;
  token: string;
  installationId: string;
  email: string;
};

export const errorAtom = atom<string | null>(null);
export const authErrorAtom = atom<string | null>(null);
export const userAtom = atomWithStorage<User | null>("user", null, undefined, { getOnInit: true });
export const reposAtom = atom<string[]>([]);
export const selectedRepoAtom = atomWithStorage<{ owner: string; repo: string } | null>(
  "selectedRepo",
  null,
  undefined,
  { getOnInit: true },
);
export const repoFilenamesAtom = atom<string[]>([]);
export const filesAtom = atom<Record<string, TextFile | ImageFile>>({});
export const repoReadyAtom = atom<boolean>(false);

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
  // Compact datetime: YYYYMMDDHHmmss (14 digits) or YYYYMMDDHHmm (12 digits)
  const compactMatch = stem.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})?$/);
  if (compactMatch) {
    const [, y, mo, d, h, mi, s] = compactMatch;
    const date = new Date(Date.UTC(+y, +mo - 1, +d, +h, +mi, +(s ?? 0)));
    if (!isNaN(date.getTime()) && date.getFullYear() >= 2000 && date.getFullYear() <= 2100) {
      return date;
    }
  }

  // Unix timestamp in seconds (10 digits) or milliseconds (13 digits)
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
  const filenames = get(repoFilenamesAtom);
  const files = get(filesAtom);
  const prefix = REPO_DIR + "/";

  const entries: NoteListEntry[] = [];

  for (const path of filenames) {
    const relativePath = path.startsWith(prefix) ? path.slice(prefix.length) : path;

    if (relativePath.startsWith("uploads/")) continue;

    const file = files[path];
    const content = file?.type === "text" ? file.content : null;
    const title = relativePath.endsWith(".md") ? noteTitle(relativePath, content) : relativePath;

    entries.push({ path, relativePath, title });
  }

  return entries;
});
