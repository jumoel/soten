import type {
  DomainResult,
  GitUser,
  RepoState,
  SearchEntry,
  SearchResult,
  WorkerResponse,
} from "./protocol";

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

  search(query: string): Promise<SearchResult[]> {
    return this.call({ type: "search", query }) as Promise<SearchResult[]>;
  }

  clearSearchIndex(): Promise<void> {
    return this.call({ type: "clearSearchIndex" }) as Promise<void>;
  }

  setCorsProxy(value: string): Promise<void> {
    return this.call({ type: "setCorsProxy", value }) as Promise<void>;
  }

  autosaveDraft(
    timestamp: string,
    content: string,
    user: { username: string; token: string },
    isOnline: boolean,
  ): Promise<DomainResult> {
    return this.call({
      type: "autosaveDraft",
      timestamp,
      content,
      user,
      isOnline,
    }) as Promise<DomainResult>;
  }

  publishDraft(
    timestamp: string,
    content: string,
    message: string,
    user: { username: string; token: string },
    isOnline: boolean,
  ): Promise<DomainResult> {
    return this.call({
      type: "publishDraft",
      timestamp,
      content,
      message,
      user,
      isOnline,
    }) as Promise<DomainResult>;
  }

  discardDraft(
    timestamp: string,
    user: { username: string; token: string },
    isOnline: boolean,
  ): Promise<DomainResult> {
    return this.call({
      type: "discardDraft",
      timestamp,
      user,
      isOnline,
    }) as Promise<DomainResult>;
  }

  sync(
    user: { username: string; token: string },
    draftTimestamps: string[],
  ): Promise<DomainResult> {
    return this.call({ type: "sync", user, draftTimestamps }) as Promise<DomainResult>;
  }

  domainClone(url: string, user: GitUser): Promise<DomainResult> {
    return this.call({ type: "domainClone", url, user }) as Promise<DomainResult>;
  }

  deleteNote(
    filepath: string,
    message: string,
    user: { username: string; token: string },
    isOnline: boolean,
  ): Promise<DomainResult> {
    return this.call({
      type: "deleteNote",
      filepath,
      message,
      user,
      isOnline,
    }) as Promise<DomainResult>;
  }

  getState(): Promise<RepoState> {
    return this.call({ type: "getState" }) as Promise<RepoState>;
  }
}

export function getRepoWorker(): RepoWorkerClient {
  if (!instance) instance = new RepoWorkerClient();
  return instance;
}
