import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lib/github", () => ({
  fetchUserRepos: vi.fn(),
}));

vi.mock("../lib/git", () => ({
  clone: vi.fn(),
  pull: vi.fn(),
  isInitialized: vi.fn(),
}));

vi.mock("../lib/fs", () => ({
  wipeFs: vi.fn(),
  readRepoFiles: vi.fn(),
  readFile: vi.fn(),
}));

vi.mock("./events", () => ({
  Event: {
    Authenticated: "Authenticated",
    Logout: "Logout",
    FetchAndSelectRepos: "FetchAndSelectRepos",
    FetchRepoFiles: "FetchRepoFiles",
    ReadRepoFilesContent: "ReadRepoFilesContent",
    Error: "Error",
    ShowNote: "ShowNote",
    SelectRepo: "SelectRepo",
    ShowFront: "ShowFront",
  },
  dispatch: vi.fn(),
}));

import { fetchUserRepos } from "../lib/github";
import * as git from "../lib/git";
import { readFile, readRepoFiles, wipeFs } from "../lib/fs";
import { dispatch, Event } from "./events";
import {
  store,
  AppView,
  AuthState,
  appViewAtom,
  authStateAtom,
  currentPathAtom,
  errorAtom,
  filesAtom,
  repoFilenamesAtom,
  repoReadyAtom,
  reposAtom,
  selectedRepoAtom,
  userAtom,
} from "./store";
import {
  handleAuthenticated,
  handleError,
  handleFetchAndSelectRepos,
  handleFetchRepoFiles,
  handleLogout,
  handleReadRepoFilesContent,
  handleSelectRepo,
  handleShowFront,
  handleShowNote,
} from "./handlers";

const mockUser = {
  username: "testuser",
  token: "tok_123",
  installationId: "inst_456",
  email: "test@example.com",
};

beforeEach(() => {
  store.set(authStateAtom, AuthState.Unauthenticated);
  store.set(appViewAtom, AppView.Front);
  store.set(errorAtom, null);
  store.set(userAtom, null);
  store.set(reposAtom, []);
  store.set(selectedRepoAtom, null);
  store.set(repoFilenamesAtom, []);
  store.set(filesAtom, {});
  store.set(repoReadyAtom, false);
  store.set(currentPathAtom, "/");
  localStorage.clear();
});

describe("handleAuthenticated", () => {
  it("sets user and auth state, then dispatches FetchAndSelectRepos", async () => {
    await handleAuthenticated(mockUser);

    expect(store.get(userAtom)).toEqual(mockUser);
    expect(store.get(authStateAtom)).toBe(AuthState.Authenticated);
    expect(dispatch).toHaveBeenCalledWith(Event.FetchAndSelectRepos);
  });
});

describe("handleFetchAndSelectRepos", () => {
  it("dispatches Error when no user", async () => {
    await handleFetchAndSelectRepos();

    expect(dispatch).toHaveBeenCalledWith(Event.Error, {
      message: "Invalid installationId or token",
    });
  });

  it("dispatches Error when fetch returns null", async () => {
    store.set(userAtom, mockUser);
    vi.mocked(fetchUserRepos).mockResolvedValue(null);

    await handleFetchAndSelectRepos();

    expect(dispatch).toHaveBeenCalledWith(Event.Error, {
      message: "Failed to fetch repos",
    });
  });

  it("dispatches Error when fetch returns empty array", async () => {
    store.set(userAtom, mockUser);
    vi.mocked(fetchUserRepos).mockResolvedValue([]);

    await handleFetchAndSelectRepos();

    expect(dispatch).toHaveBeenCalledWith(Event.Error, {
      message: "No repos found",
    });
  });

  it("auto-selects when only one repo is returned", async () => {
    store.set(userAtom, mockUser);
    vi.mocked(fetchUserRepos).mockResolvedValue(["acme/notes"]);

    await handleFetchAndSelectRepos();

    expect(store.get(reposAtom)).toEqual(["acme/notes"]);
    expect(dispatch).toHaveBeenCalledWith(Event.SelectRepo, { owner: "acme", repo: "notes" });
  });

  it("sets repos and clears selectedRepo when multiple repos returned", async () => {
    store.set(userAtom, mockUser);
    vi.mocked(fetchUserRepos).mockResolvedValue(["acme/notes", "acme/wiki"]);

    await handleFetchAndSelectRepos();

    expect(store.get(reposAtom)).toEqual(["acme/notes", "acme/wiki"]);
    expect(store.get(selectedRepoAtom)).toBeNull();
    expect(dispatch).not.toHaveBeenCalled();
  });

  it("dispatches FetchRepoFiles when cached repo is still valid", async () => {
    store.set(userAtom, mockUser);
    store.set(selectedRepoAtom, { owner: "acme", repo: "notes" });
    vi.mocked(fetchUserRepos).mockResolvedValue(["acme/notes", "acme/wiki"]);

    await handleFetchAndSelectRepos();

    expect(dispatch).toHaveBeenCalledWith(Event.FetchRepoFiles);
  });
});

describe("handleSelectRepo", () => {
  it("sets repo, clears file state, wipes fs, dispatches FetchRepoFiles", async () => {
    store.set(repoFilenamesAtom, ["/soten/old.md"]);
    store.set(filesAtom, { "/soten/old.md": { type: "text", content: "old" } });
    store.set(repoReadyAtom, true);

    await handleSelectRepo({ owner: "acme", repo: "notes" });

    expect(store.get(selectedRepoAtom)).toEqual({ owner: "acme", repo: "notes" });
    expect(store.get(repoFilenamesAtom)).toEqual([]);
    expect(store.get(filesAtom)).toEqual({});
    expect(store.get(repoReadyAtom)).toBe(false);
    expect(wipeFs).toHaveBeenCalled();
    expect(dispatch).toHaveBeenCalledWith(Event.FetchRepoFiles);
  });
});

describe("handleFetchRepoFiles", () => {
  it("dispatches Error when state is missing", async () => {
    await handleFetchRepoFiles();

    expect(dispatch).toHaveBeenCalledWith(Event.Error, {
      message: "Invalid state when fetching files",
    });
  });

  it("clones when repo is not initialized", async () => {
    store.set(userAtom, mockUser);
    store.set(selectedRepoAtom, { owner: "acme", repo: "notes" });
    vi.mocked(git.isInitialized).mockResolvedValue(false);
    vi.mocked(readRepoFiles).mockResolvedValue(["/soten/readme.md"]);

    await handleFetchRepoFiles();

    expect(git.clone).toHaveBeenCalledWith("https://github.com/acme/notes.git", mockUser);
    expect(git.pull).not.toHaveBeenCalled();
    expect(store.get(repoFilenamesAtom)).toEqual(["/soten/readme.md"]);
    expect(dispatch).toHaveBeenCalledWith(Event.ReadRepoFilesContent);
  });

  it("pulls when repo is already initialized", async () => {
    store.set(userAtom, mockUser);
    store.set(selectedRepoAtom, { owner: "acme", repo: "notes" });
    vi.mocked(git.isInitialized).mockResolvedValue(true);
    vi.mocked(readRepoFiles).mockResolvedValue(["/soten/readme.md"]);

    await handleFetchRepoFiles();

    expect(git.pull).toHaveBeenCalledWith(mockUser);
    expect(git.clone).not.toHaveBeenCalled();
    expect(store.get(repoFilenamesAtom)).toEqual(["/soten/readme.md"]);
    expect(dispatch).toHaveBeenCalledWith(Event.ReadRepoFilesContent);
  });
});

describe("handleReadRepoFilesContent", () => {
  it("reads all files and sets filesAtom and repoReadyAtom", async () => {
    store.set(repoFilenamesAtom, ["/soten/a.md", "/soten/b.md"]);
    vi.mocked(readFile).mockImplementation(async (path: string) => {
      if (path === "/soten/a.md") return { type: "text", content: "# A" };
      if (path === "/soten/b.md") return { type: "text", content: "# B" };
      return null;
    });

    await handleReadRepoFilesContent();

    expect(store.get(filesAtom)).toEqual({
      "/soten/a.md": { type: "text", content: "# A" },
      "/soten/b.md": { type: "text", content: "# B" },
    });
    expect(store.get(repoReadyAtom)).toBe(true);
  });

  it("filters out files that fail to read", async () => {
    store.set(repoFilenamesAtom, ["/soten/a.md", "/soten/bad.md"]);
    vi.mocked(readFile).mockImplementation(async (path: string) => {
      if (path === "/soten/a.md") return { type: "text", content: "# A" };
      return null;
    });

    await handleReadRepoFilesContent();

    expect(store.get(filesAtom)).toEqual({
      "/soten/a.md": { type: "text", content: "# A" },
    });
    expect(store.get(repoReadyAtom)).toBe(true);
  });

  it("handles empty file list", async () => {
    store.set(repoFilenamesAtom, []);

    await handleReadRepoFilesContent();

    expect(store.get(filesAtom)).toEqual({});
    expect(store.get(repoReadyAtom)).toBe(true);
  });
});

describe("handleLogout", () => {
  it("resets all atoms and wipes filesystem", async () => {
    store.set(userAtom, mockUser);
    store.set(authStateAtom, AuthState.Authenticated);
    store.set(selectedRepoAtom, { owner: "acme", repo: "notes" });
    store.set(reposAtom, ["acme/notes"]);
    store.set(repoFilenamesAtom, ["/soten/readme.md"]);
    store.set(filesAtom, { "/soten/readme.md": { type: "text", content: "hi" } });
    store.set(repoReadyAtom, true);
    store.set(errorAtom, "old error");
    store.set(appViewAtom, AppView.Note);

    await handleLogout();

    expect(store.get(userAtom)).toBeNull();
    expect(store.get(authStateAtom)).toBe(AuthState.Unauthenticated);
    expect(store.get(selectedRepoAtom)).toBeNull();
    expect(store.get(reposAtom)).toEqual([]);
    expect(store.get(repoFilenamesAtom)).toEqual([]);
    expect(store.get(filesAtom)).toEqual({});
    expect(store.get(repoReadyAtom)).toBe(false);
    expect(store.get(errorAtom)).toBeNull();
    expect(store.get(appViewAtom)).toBe(AppView.Front);
    expect(wipeFs).toHaveBeenCalled();
  });
});

describe("handleShowNote", () => {
  it("sets currentPath and appView to Note", () => {
    handleShowNote({ path: "/soten/readme.md" });

    expect(store.get(currentPathAtom)).toBe("/soten/readme.md");
    expect(store.get(appViewAtom)).toBe(AppView.Note);
  });
});

describe("handleShowFront", () => {
  it("sets currentPath to / and appView to Front", () => {
    store.set(currentPathAtom, "/soten/readme.md");
    store.set(appViewAtom, AppView.Note);

    handleShowFront();

    expect(store.get(currentPathAtom)).toBe("/");
    expect(store.get(appViewAtom)).toBe(AppView.Front);
  });
});

describe("handleError", () => {
  it("sets errorAtom", () => {
    handleError({ message: "something went wrong" });

    expect(store.get(errorAtom)).toBe("something went wrong");
  });
});
