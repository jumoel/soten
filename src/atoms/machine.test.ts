import { describe, it, expect, vi } from "vitest";

vi.mock("../lib/fs", () => ({
  wipeFs: vi.fn(),
  readRepoFiles: vi.fn(),
  readFile: vi.fn(),
}));

vi.mock("../lib/git", () => ({
  clone: vi.fn(),
  pull: vi.fn(),
  isInitialized: vi.fn(),
}));

vi.mock("../lib/github", () => ({
  fetchUserRepos: vi.fn(),
}));

import { transition, type AppMachineState } from "./machine";

const mockUser = {
  username: "testuser",
  token: "tok_123",
  installationId: "inst_456",
  email: "test@example.com",
};

describe("transition", () => {
  describe("initializing", () => {
    const state: AppMachineState = { name: "initializing" };

    it("AUTHENTICATED → fetchingRepos", () => {
      const next = transition(state, { type: "AUTHENTICATED", user: mockUser });
      expect(next).toEqual({ name: "fetchingRepos", user: mockUser });
    });

    it("AUTH_ERROR → unauthenticated with error", () => {
      const next = transition(state, { type: "AUTH_ERROR", message: "bad_token" });
      expect(next).toEqual({ name: "unauthenticated", authError: "bad_token" });
    });

    it("NO_AUTH → unauthenticated", () => {
      const next = transition(state, { type: "NO_AUTH" });
      expect(next).toEqual({ name: "unauthenticated", authError: null });
    });

    it("invalid event returns same state", () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      const next = transition(state, { type: "SHOW_FRONT" });
      expect(next).toBe(state);
    });
  });

  describe("unauthenticated", () => {
    const state: AppMachineState = { name: "unauthenticated", authError: null };

    it("AUTHENTICATED → fetchingRepos", () => {
      const next = transition(state, { type: "AUTHENTICATED", user: mockUser });
      expect(next).toEqual({ name: "fetchingRepos", user: mockUser });
    });

    it("invalid event returns same state", () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      const next = transition(state, { type: "SHOW_FRONT" });
      expect(next).toBe(state);
    });
  });

  describe("fetchingRepos", () => {
    const state: AppMachineState = { name: "fetchingRepos", user: mockUser };

    it("REPOS_LOADED with cached repo → loadingRepo", () => {
      const cachedRepo = { owner: "acme", repo: "notes" };
      const next = transition(state, {
        type: "REPOS_LOADED",
        repos: ["acme/notes", "acme/wiki"],
        cachedRepo,
      });
      expect(next).toEqual({
        name: "loadingRepo",
        user: mockUser,
        repo: cachedRepo,
        repos: ["acme/notes", "acme/wiki"],
      });
    });

    it("REPOS_LOADED with single repo → loadingRepo", () => {
      const next = transition(state, {
        type: "REPOS_LOADED",
        repos: ["acme/notes"],
        cachedRepo: null,
      });
      expect(next).toEqual({
        name: "loadingRepo",
        user: mockUser,
        repo: { owner: "acme", repo: "notes" },
        repos: ["acme/notes"],
      });
    });

    it("REPOS_LOADED with multiple repos and no cache → selectingRepo", () => {
      const next = transition(state, {
        type: "REPOS_LOADED",
        repos: ["acme/notes", "acme/wiki"],
        cachedRepo: null,
      });
      expect(next).toEqual({
        name: "selectingRepo",
        user: mockUser,
        repos: ["acme/notes", "acme/wiki"],
      });
    });

    it("REPOS_LOADED with stale cached repo → selectingRepo", () => {
      const next = transition(state, {
        type: "REPOS_LOADED",
        repos: ["acme/notes", "acme/wiki"],
        cachedRepo: { owner: "acme", repo: "old" },
      });
      expect(next).toEqual({
        name: "selectingRepo",
        user: mockUser,
        repos: ["acme/notes", "acme/wiki"],
      });
    });

    it("FETCH_ERROR → error", () => {
      const next = transition(state, { type: "FETCH_ERROR", message: "Failed to fetch repos" });
      expect(next).toEqual({ name: "error", user: mockUser, message: "Failed to fetch repos" });
    });

    it("LOGOUT → unauthenticated", () => {
      const next = transition(state, { type: "LOGOUT" });
      expect(next).toEqual({ name: "unauthenticated", authError: null });
    });
  });

  describe("selectingRepo", () => {
    const state: AppMachineState = {
      name: "selectingRepo",
      user: mockUser,
      repos: ["acme/notes", "acme/wiki"],
    };

    it("SELECT_REPO → loadingRepo", () => {
      const repo = { owner: "acme", repo: "notes" };
      const next = transition(state, { type: "SELECT_REPO", repo });
      expect(next).toEqual({
        name: "loadingRepo",
        user: mockUser,
        repo,
        repos: ["acme/notes", "acme/wiki"],
      });
    });

    it("LOGOUT → unauthenticated", () => {
      const next = transition(state, { type: "LOGOUT" });
      expect(next).toEqual({ name: "unauthenticated", authError: null });
    });
  });

  describe("loadingRepo", () => {
    const state: AppMachineState = {
      name: "loadingRepo",
      user: mockUser,
      repo: { owner: "acme", repo: "notes" },
      repos: ["acme/notes"],
    };

    it("REPO_READY → ready with front view", () => {
      const files = { "/soten/a.md": { type: "text" as const, content: "# A" } };
      const next = transition(state, {
        type: "REPO_READY",
        filenames: ["/soten/a.md"],
        files,
      });
      expect(next).toEqual({
        name: "ready",
        user: mockUser,
        repo: { owner: "acme", repo: "notes" },
        repos: ["acme/notes"],
        filenames: ["/soten/a.md"],
        files,
        view: { name: "front" },
      });
    });

    it("LOAD_ERROR → error", () => {
      const next = transition(state, { type: "LOAD_ERROR", message: "clone failed" });
      expect(next).toEqual({ name: "error", user: mockUser, message: "clone failed" });
    });

    it("LOGOUT → unauthenticated", () => {
      const next = transition(state, { type: "LOGOUT" });
      expect(next).toEqual({ name: "unauthenticated", authError: null });
    });
  });

  describe("ready", () => {
    const state: AppMachineState = {
      name: "ready",
      user: mockUser,
      repo: { owner: "acme", repo: "notes" },
      repos: ["acme/notes"],
      filenames: ["/soten/a.md"],
      files: { "/soten/a.md": { type: "text", content: "# A" } },
      view: { name: "front" },
    };

    it("SHOW_NOTE → ready with note view", () => {
      const next = transition(state, { type: "SHOW_NOTE", path: "/soten/a.md" });
      expect(next).toEqual({ ...state, view: { name: "note", path: "/soten/a.md" } });
    });

    it("SHOW_FRONT → ready with front view", () => {
      const noteState = { ...state, view: { name: "note" as const, path: "/soten/a.md" } };
      const next = transition(noteState, { type: "SHOW_FRONT" });
      expect(next).toEqual({ ...noteState, view: { name: "front" } });
    });

    it("SELECT_REPO → loadingRepo", () => {
      const repo = { owner: "acme", repo: "wiki" };
      const next = transition(state, { type: "SELECT_REPO", repo });
      expect(next).toEqual({
        name: "loadingRepo",
        user: mockUser,
        repo,
        repos: ["acme/notes"],
      });
    });

    it("SWITCH_REPO → selectingRepo", () => {
      const next = transition(state, { type: "SWITCH_REPO" });
      expect(next).toEqual({
        name: "selectingRepo",
        user: mockUser,
        repos: ["acme/notes"],
      });
    });

    it("LOGOUT → unauthenticated", () => {
      const next = transition(state, { type: "LOGOUT" });
      expect(next).toEqual({ name: "unauthenticated", authError: null });
    });
  });

  describe("error", () => {
    const state: AppMachineState = {
      name: "error",
      user: mockUser,
      message: "something went wrong",
    };

    it("LOGOUT → unauthenticated", () => {
      const next = transition(state, { type: "LOGOUT" });
      expect(next).toEqual({ name: "unauthenticated", authError: null });
    });

    it("invalid event returns same state", () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      const next = transition(state, { type: "SHOW_FRONT" });
      expect(next).toBe(state);
    });
  });
});
