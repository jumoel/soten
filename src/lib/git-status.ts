import { gitWorkingAtom, store } from "../atoms/store";

let queue: Promise<unknown> = Promise.resolve();
let activeCount = 0;

export function withGitWorking<T>(fn: () => Promise<T>): Promise<T> {
  const next = queue.then(async () => {
    activeCount++;
    store.set(gitWorkingAtom, true);
    try {
      return await fn();
    } finally {
      activeCount--;
      if (activeCount === 0) store.set(gitWorkingAtom, false);
    }
  });
  queue = next.catch(() => {});
  return next;
}
