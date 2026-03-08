export type GitUser = { username: string; token: string; email: string };

export type SearchEntry = { path: string; title: string };

export type WorkerRequest =
  | { id: number; type: "clone"; url: string; user: GitUser }
  | { id: number; type: "pull"; user: { username: string; token: string } }
  | { id: number; type: "isInitialized" }
  | { id: number; type: "readRepoFiles" }
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
  | { id: number; type: "populateFiles"; files: Array<{ path: string; content: string }> };

export type WorkerResponse =
  | { id: number; ok: true; result?: unknown }
  | { id: number; ok: false; error: string };
