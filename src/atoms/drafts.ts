import { atom } from "jotai";
import { store } from "./store";

export type Draft = {
  timestamp: string;
  content: string;
  isNew: boolean;
  minimized: boolean;
};

export const draftsAtom = atom<Draft[]>([]);

export const activeDraftAtom = atom<Draft | null>((get) => {
  return get(draftsAtom).find((d) => !d.minimized) ?? null;
});

export function openNewDraft(): string {
  const timestamp = String(Date.now());
  store.set(draftsAtom, (prev) => [
    ...prev.map((d) => (d.minimized ? d : { ...d, minimized: true })),
    { timestamp, content: "", isNew: true, minimized: false },
  ]);
  return timestamp;
}

export function restoreDraft(timestamp: string): void {
  store.set(draftsAtom, (prev) =>
    prev.map((d) => ({
      ...d,
      minimized: d.timestamp !== timestamp,
    })),
  );
}

export function minimizeDraft(timestamp: string): void {
  store.set(draftsAtom, (prev) =>
    prev.map((d) => (d.timestamp === timestamp ? { ...d, minimized: true } : d)),
  );
}

export function updateDraftContent(timestamp: string, content: string): void {
  store.set(draftsAtom, (prev) =>
    prev.map((d) => (d.timestamp === timestamp ? { ...d, content } : d)),
  );
}

export function removeDraft(timestamp: string): void {
  store.set(draftsAtom, (prev) => prev.filter((d) => d.timestamp !== timestamp));
}

export function openExistingDraft(timestamp: string, content: string): void {
  store.set(draftsAtom, (prev) => [
    ...prev.map((d) => ({ ...d, minimized: true })),
    { timestamp, content, isNew: false, minimized: false },
  ]);
}
