import { atom } from "jotai";
import { store } from "./store";
import type { User, TextFile, ImageFile } from "./store";
import { machineStateAtom, send } from "./machine";
import type { AppMachineState, AppEvent, Repo, Files } from "./machine";
import { extractTitle } from "../markdown";
import { REPO_DIR } from "../lib/constants";
import { t } from "../i18n";

export { store };
export type { User, TextFile, ImageFile };
export { machineStateAtom, send };
export type { AppMachineState, AppEvent, Repo, Files };

const EMPTY_FILES: Record<string, TextFile | ImageFile> = {};

export const filesAtom = atom<Record<string, TextFile | ImageFile>>((get) => {
  const state = get(machineStateAtom);
  return state.name === "ready" ? state.files : EMPTY_FILES;
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
  const state = get(machineStateAtom);
  if (state.name !== "ready") return [];

  const prefix = REPO_DIR + "/";
  const entries: NoteListEntry[] = [];

  for (const path of state.filenames) {
    const relativePath = path.startsWith(prefix) ? path.slice(prefix.length) : path;

    if (relativePath.startsWith("uploads/")) continue;

    const file = state.files[path];
    const content = file?.type === "text" ? file.content : null;
    const title = relativePath.endsWith(".md") ? noteTitle(relativePath, content) : relativePath;

    entries.push({ path, relativePath, title });
  }

  return entries;
});

import "./init.run";
