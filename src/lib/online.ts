import { atom } from "jotai";
import { store, machineAtom } from "../atoms/store";
import { backgroundSync } from "../atoms/sync";

export const onlineAtom = atom(navigator.onLine);

export function initOnlineListener() {
  window.addEventListener("online", () => {
    store.set(onlineAtom, true);
    const machine = store.get(machineAtom);
    if (machine.phase === "ready") {
      backgroundSync(machine.user);
    }
  });

  window.addEventListener("offline", () => {
    store.set(onlineAtom, false);
  });
}
