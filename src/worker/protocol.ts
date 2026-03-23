export type GitUser = { username: string; token: string; email: string };

export type SearchEntry = { path: string; title: string };
export type SearchResult = { path: string; score: number };

export type ConflictEntry = {
  path: string;
  remoteContent: string;
};

export type RepoState = {
  filenames: string[];
  drafts: Array<{ timestamp: string; content: string }>;
  conflicts: ConflictEntry[];
};

export type SyncStatus = "synced" | "local-only";

export type DomainResult = {
  state: RepoState;
  syncStatus: SyncStatus;
};

export type WorkerRequest =
  | { id: number; type: "buildSearchIndex"; entries: SearchEntry[] }
  | {
      id: number;
      type: "updateSearchIndex";
      oldFilenames: string[];
      newFilenames: string[];
      entries: SearchEntry[];
    }
  | { id: number; type: "search"; query: string }
  | { id: number; type: "clearSearchIndex" }
  | { id: number; type: "setCorsProxy"; value: string }
  | {
      id: number;
      type: "autosaveDraft";
      timestamp: string;
      content: string;
      user: { username: string; token: string };
      isOnline: boolean;
    }
  | {
      id: number;
      type: "publishDraft";
      timestamp: string;
      content: string;
      message: string;
      user: { username: string; token: string };
      isOnline: boolean;
    }
  | {
      id: number;
      type: "discardDraft";
      timestamp: string;
      user: { username: string; token: string };
      isOnline: boolean;
    }
  | {
      id: number;
      type: "sync";
      user: { username: string; token: string };
      draftTimestamps: string[];
    }
  | {
      id: number;
      type: "domainClone";
      url: string;
      user: GitUser;
    }
  | {
      id: number;
      type: "deleteNote";
      filepath: string;
      message: string;
      user: { username: string; token: string };
      isOnline: boolean;
    }
  | { id: number; type: "getState" };

export type WorkerResponse =
  | { id: number; ok: true; result?: unknown }
  | { id: number; ok: false; error: string };
