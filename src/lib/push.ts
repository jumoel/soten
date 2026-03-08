import { getRepoWorker } from "../worker/client";
import { store, machineAtom } from "../atoms/store";
import { onlineAtom } from "./online";

export async function pushIfOnline(ref?: string): Promise<void> {
  const online = store.get(onlineAtom);
  if (!online) return;

  const machine = store.get(machineAtom);
  if (machine.phase !== "ready") return;
  if (!machine.hasRemote) return;

  const worker = getRepoWorker();
  try {
    await worker.push(machine.user, ref);
  } catch (e) {
    console.debug("push failed (will retry on next sync)", e);
  }
}
