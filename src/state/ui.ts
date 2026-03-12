import { atom } from "jotai";
import { atomWithStorage } from "jotai/utils";

export type Theme = "light" | "dark" | "system";
export const themeAtom = atomWithStorage<Theme>("theme", "light", undefined, { getOnInit: true });

/** 0 = Sunday, 1 = Monday, ... 6 = Saturday */
export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export const weekStartAtom = atomWithStorage<WeekStart>("weekStart", 1, undefined, {
  getOnInit: true,
});

// ---------------------------------------------------------------------------
// Reference stack (editor right column)
// ---------------------------------------------------------------------------

export type ReferenceMode = "collapsed" | "excerpt" | "expanded";
export type ReferenceEntry = { path: string; mode: ReferenceMode };

/** Stack of notes pinned for reference while editing. Clears on note switch. */
export const referenceStackAtom = atom<ReferenceEntry[]>([]);
