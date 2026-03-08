export type GitUser = { username: string; token: string; email: string };

export type SearchEntry = { path: string; title: string };

export type WorkerRequest =
  | { id: number; type: "clone"; url: string; user: GitUser }
  | { id: number; type: "pull"; user: { username: string; token: string } }
  | { id: number; type: "push"; user: { username: string; token: string }; ref?: string }
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
  | { id: number; type: "populateFiles"; files: Array<{ path: string; content: string }> }
  | { id: number; type: "createBranch"; name: string }
  | { id: number; type: "checkoutBranch"; name: string }
  | { id: number; type: "commitFile"; filepath: string; content: string; message: string }
  | { id: number; type: "squashMergeToMain"; branch: string; message: string }
  | { id: number; type: "deleteBranch"; name: string }
  | { id: number; type: "listDraftBranches" }
  | { id: number; type: "readFileFromBranch"; branch: string; filepath: string }
  | { id: number; type: "hasRemote" };

export type WorkerResponse =
  | { id: number; ok: true; result?: unknown }
  | { id: number; ok: false; error: string };
