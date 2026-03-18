import { atomWithStorage } from "jotai/utils";

export type Theme = "light" | "dark" | "system";
export const themeAtom = atomWithStorage<Theme>("theme", "light", undefined, { getOnInit: true });

/** 0 = Sunday, 1 = Monday, ... 6 = Saturday */
export type WeekStart = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export const weekStartAtom = atomWithStorage<WeekStart>("weekStart", 1, undefined, {
  getOnInit: true,
});

export const calendarOpenAtom = atomWithStorage<boolean | null>("calendarOpen", null, undefined, {
  getOnInit: true,
});
