import { atom } from "jotai";

/** The current draft timestamp being edited (null when no editor is open). */
export const editorTimestampAtom = atom<string | null>(null);

/** The live content in the textarea. */
export const editorContentAtom = atom("");

/** The content at the time of the last successful save (autosave or publish). */
export const editorSavedContentAtom = atom("");

/** Whether the editor has unsaved changes. */
export const editorDirtyAtom = atom(
  (get) => get(editorContentAtom) !== get(editorSavedContentAtom),
);

/** Timestamp (ms) of the last successful autosave, or null if never saved. */
export const editorLastSavedAtom = atom<number | null>(null);

/** Whether an autosave is currently in flight. */
export const editorSavingAtom = atom(false);
