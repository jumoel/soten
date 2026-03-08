import { store } from "../atoms/store";
import { gitWorkingAtom } from "../atoms/store";

let activeCount = 0;

export async function withGitWorking<T>(fn: () => Promise<T>): Promise<T> {
  activeCount++;
  store.set(gitWorkingAtom, true);
  try {
    return await fn();
  } finally {
    activeCount--;
    if (activeCount === 0) store.set(gitWorkingAtom, false);
  }
}
