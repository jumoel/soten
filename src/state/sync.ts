import { atom } from "jotai";
import { getRepoWorker } from "../worker/client";
import type { ConflictEntry } from "../worker/protocol";
import { userAtom } from "./auth";
import { applyRepoState } from "./repo";
import { store } from "./store";

export type SyncState = "idle" | "syncing" | "error" | "offline";

export const syncStateAtom = atom<SyncState>("idle");
export const isOnlineAtom = atom(typeof navigator !== "undefined" ? navigator.onLine : true);
export const lastSyncAtom = atom<number | null>(null);
export const syncErrorAtom = atom<string | null>(null);
export const conflictsAtom = atom<ConflictEntry[]>([]);

/** Guard to prevent concurrent sync operations. */
let syncing = false;

/** Drafts atom tracks known draft timestamps for sync pushes. */
export const draftTimestampsAtom = atom<string[]>([]);

export async function doSync(): Promise<void> {
  if (syncing) return;
  const user = store.get(userAtom);
  if (!user) return;
  const online = store.get(isOnlineAtom);
  if (!online) return;

  syncing = true;
  store.set(syncStateAtom, "syncing");
  store.set(syncErrorAtom, null);

  try {
    const worker = getRepoWorker();
    const draftTimestamps = store.get(draftTimestampsAtom);
    const result = await worker.sync(
      { username: user.username, token: user.token },
      draftTimestamps,
    );
    await applyRepoState(result.state);
    store.set(lastSyncAtom, Date.now());
    store.set(syncStateAtom, "idle");
  } catch (e) {
    store.set(syncStateAtom, "error");
    store.set(syncErrorAtom, e instanceof Error ? e.message : String(e));
  } finally {
    syncing = false;
  }
}

let periodicTimer: ReturnType<typeof setInterval> | null = null;
const SYNC_INTERVAL_MS = 5 * 60 * 1000;

function startPeriodicSync(): void {
  if (periodicTimer) return;
  periodicTimer = setInterval(() => {
    const online = store.get(isOnlineAtom);
    if (online && document.visibilityState === "visible") {
      doSync();
    }
  }, SYNC_INTERVAL_MS);
}

function stopPeriodicSync(): void {
  if (periodicTimer) {
    clearInterval(periodicTimer);
    periodicTimer = null;
  }
}

export function initSyncListeners(): void {
  window.addEventListener("online", () => {
    store.set(isOnlineAtom, true);
    store.set(syncStateAtom, "idle");
    doSync();
  });

  window.addEventListener("offline", () => {
    store.set(isOnlineAtom, false);
    store.set(syncStateAtom, "offline");
  });

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible" && store.get(isOnlineAtom)) {
      doSync();
    }
  });

  if (!store.get(isOnlineAtom)) {
    store.set(syncStateAtom, "offline");
  }

  startPeriodicSync();
}

export function teardownSyncListeners(): void {
  stopPeriodicSync();
}
