import type { WorkerResponse, SearchEntry } from "./protocol";

type Pending = { resolve: (v: unknown) => void; reject: (e: Error) => void };

let instance: RepoWorkerClient | null = null;

class RepoWorkerClient {
  private worker: Worker;
  private nextId = 0;
  private pending = new Map<number, Pending>();

  constructor() {
    this.worker = new Worker(new URL("./repo.worker.ts", import.meta.url), { type: "module" });
    this.worker.onmessage = (e: MessageEvent<WorkerResponse>) => {
      const msg = e.data;
      const p = this.pending.get(msg.id);
      if (!p) return;
      this.pending.delete(msg.id);
      if (msg.ok) p.resolve(msg.result);
      else p.reject(new Error(msg.error));
    };
  }

  private call(msg: Record<string, unknown>): Promise<unknown> {
    const id = this.nextId++;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.worker.postMessage({ id, ...msg });
    });
  }

  clone(url: string, user: { username: string; token: string; email: string }): Promise<void> {
    return this.call({ type: "clone", url, user }) as Promise<void>;
  }

  pull(user: { username: string; token: string }): Promise<void> {
    return this.call({ type: "pull", user }) as Promise<void>;
  }

  isInitialized(): Promise<boolean> {
    return this.call({ type: "isInitialized" }) as Promise<boolean>;
  }

  readRepoFiles(): Promise<string[]> {
    return this.call({ type: "readRepoFiles" }) as Promise<string[]>;
  }

  buildSearchIndex(entries: SearchEntry[]): Promise<void> {
    return this.call({ type: "buildSearchIndex", entries }) as Promise<void>;
  }

  updateSearchIndex(
    oldFilenames: string[],
    newFilenames: string[],
    entries: SearchEntry[],
  ): Promise<void> {
    return this.call({
      type: "updateSearchIndex",
      oldFilenames,
      newFilenames,
      entries,
    }) as Promise<void>;
  }

  search(query: string): Promise<string[]> {
    return this.call({ type: "search", query }) as Promise<string[]>;
  }

  clearSearchIndex(): Promise<void> {
    return this.call({ type: "clearSearchIndex" }) as Promise<void>;
  }
}

export function getRepoWorker(): RepoWorkerClient {
  if (!instance) instance = new RepoWorkerClient();
  return instance;
}
