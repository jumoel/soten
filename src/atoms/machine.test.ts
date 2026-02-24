import { describe, it, expect, vi, beforeEach } from "vitest";

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

vi.mock("./effects", () => ({
  runEffect: vi.fn(),
}));

import {
  transition,
  send,
  machineStateAtom,
  type AppMachineState,
  type TransitionContext,
} from "./machine";
import { store, cachedUserAtom, cachedRepoAtom } from "./store";
import { runEffect } from "./effects";

const mockUser = {
  username: "testuser",
  token: "tok_123",
  installationId: "inst_456",
  email: "test@example.com",
};

const noCache: TransitionContext = { cachedRepo: null };

describe("transition", () => {
  describe("initializing", () => {
    const state: AppMachineState = { name: "initializing" };

    it("AUTHENTICATED → fetchingRepos", () => {
      const next = transition(state, { type: "AUTHENTICATED", user: mockUser }, noCache);
      expect(next).toEqual({ name: "fetchingRepos", user: mockUser });
    });

    it("AUTH_ERROR → unauthenticated with error", () => {
      const next = transition(state, { type: "AUTH_ERROR", message: "bad_token" }, noCache);
      expect(next).toEqual({ name: "unauthenticated", authError: "bad_token" });
    });

    it("NO_AUTH → unauthenticated", () => {
      const next = transition(state, { type: "NO_AUTH" }, noCache);
      expect(next).toEqual({ name: "unauthenticated", authError: null });
    });

    it("invalid event returns same state", () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      const next = transition(state, { type: "SHOW_FRONT" }, noCache);
      expect(next).toBe(state);
    });
  });

  describe("unauthenticated", () => {
    const state: AppMachineState = { name: "unauthenticated", authError: null };

    it("AUTHENTICATED → fetchingRepos", () => {
      const next = transition(state, { type: "AUTHENTICATED", user: mockUser }, noCache);
      expect(next).toEqual({ name: "fetchingRepos", user: mockUser });
    });

    it("invalid event returns same state", () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      const next = transition(state, { type: "SHOW_FRONT" }, noCache);
      expect(next).toBe(state);
    });
  });

  describe("fetchingRepos", () => {
    const state: AppMachineState = { name: "fetchingRepos", user: mockUser };

    it("REPOS_LOADED with cached repo → loadingRepo", () => {
      const cachedRepo = { owner: "acme", repo: "notes" };
      const next = transition(
        state,
        { type: "REPOS_LOADED", repos: ["acme/notes", "acme/wiki"] },
        { cachedRepo },
      );
      expect(next).toEqual({
        name: "loadingRepo",
        user: mockUser,
        repo: cachedRepo,
        repos: ["acme/notes", "acme/wiki"],
      });
    });

    it("REPOS_LOADED with single repo → loadingRepo", () => {
      const next = transition(state, { type: "REPOS_LOADED", repos: ["acme/notes"] }, noCache);
      expect(next).toEqual({
        name: "loadingRepo",
        user: mockUser,
        repo: { owner: "acme", repo: "notes" },
        repos: ["acme/notes"],
      });
    });

    it("REPOS_LOADED with multiple repos and no cache → selectingRepo", () => {
      const next = transition(
        state,
        { type: "REPOS_LOADED", repos: ["acme/notes", "acme/wiki"] },
        noCache,
      );
      expect(next).toEqual({
        name: "selectingRepo",
        user: mockUser,
        repos: ["acme/notes", "acme/wiki"],
      });
    });

    it("REPOS_LOADED with stale cached repo → selectingRepo", () => {
      const next = transition(
        state,
        { type: "REPOS_LOADED", repos: ["acme/notes", "acme/wiki"] },
        { cachedRepo: { owner: "acme", repo: "old" } },
      );
      expect(next).toEqual({
        name: "selectingRepo",
        user: mockUser,
        repos: ["acme/notes", "acme/wiki"],
      });
    });

    it("FETCH_ERROR → error", () => {
      const next = transition(
        state,
        { type: "FETCH_ERROR", message: "Failed to fetch repos" },
        noCache,
      );
      expect(next).toEqual({ name: "error", user: mockUser, message: "Failed to fetch repos" });
    });

    it("LOGOUT → unauthenticated", () => {
      const next = transition(state, { type: "LOGOUT" }, noCache);
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
      const next = transition(state, { type: "SELECT_REPO", repo }, noCache);
      expect(next).toEqual({
        name: "loadingRepo",
        user: mockUser,
        repo,
        repos: ["acme/notes", "acme/wiki"],
      });
    });

    it("LOGOUT → unauthenticated", () => {
      const next = transition(state, { type: "LOGOUT" }, noCache);
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
      const next = transition(
        state,
        { type: "REPO_READY", filenames: ["/soten/a.md"], files },
        noCache,
      );
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
      const next = transition(state, { type: "LOAD_ERROR", message: "clone failed" }, noCache);
      expect(next).toEqual({ name: "error", user: mockUser, message: "clone failed" });
    });

    it("LOGOUT → unauthenticated", () => {
      const next = transition(state, { type: "LOGOUT" }, noCache);
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
      const next = transition(state, { type: "SHOW_NOTE", path: "/soten/a.md" }, noCache);
      expect(next).toEqual({ ...state, view: { name: "note", path: "/soten/a.md" } });
    });

    it("SHOW_FRONT → ready with front view", () => {
      const noteState = { ...state, view: { name: "note" as const, path: "/soten/a.md" } };
      const next = transition(noteState, { type: "SHOW_FRONT" }, noCache);
      expect(next).toEqual({ ...noteState, view: { name: "front" } });
    });

    it("SELECT_REPO → loadingRepo", () => {
      const repo = { owner: "acme", repo: "wiki" };
      const next = transition(state, { type: "SELECT_REPO", repo }, noCache);
      expect(next).toEqual({
        name: "loadingRepo",
        user: mockUser,
        repo,
        repos: ["acme/notes"],
      });
    });

    it("SWITCH_REPO → selectingRepo", () => {
      const next = transition(state, { type: "SWITCH_REPO" }, noCache);
      expect(next).toEqual({
        name: "selectingRepo",
        user: mockUser,
        repos: ["acme/notes"],
      });
    });

    it("LOGOUT → unauthenticated", () => {
      const next = transition(state, { type: "LOGOUT" }, noCache);
      expect(next).toEqual({ name: "unauthenticated", authError: null });
    });
  });

  describe("error", () => {
    const state: AppMachineState = {
      name: "error",
      user: mockUser,
      message: "something went wrong",
    };

    it("RETRY → fetchingRepos", () => {
      const next = transition(state, { type: "RETRY" }, noCache);
      expect(next).toEqual({ name: "fetchingRepos", user: mockUser });
    });

    it("LOGOUT → unauthenticated", () => {
      const next = transition(state, { type: "LOGOUT" }, noCache);
      expect(next).toEqual({ name: "unauthenticated", authError: null });
    });

    it("invalid event returns same state", () => {
      vi.spyOn(console, "warn").mockImplementation(() => {});
      const next = transition(state, { type: "SHOW_FRONT" }, noCache);
      expect(next).toBe(state);
    });
  });
});

describe("send", () => {
  beforeEach(() => {
    store.set(machineStateAtom, { name: "initializing" });
    store.set(cachedUserAtom, null);
    store.set(cachedRepoAtom, null);
    localStorage.clear();
    vi.mocked(runEffect).mockReset();
  });

  it("transitions state and calls runEffect", async () => {
    await send({ type: "AUTHENTICATED", user: mockUser });

    expect(store.get(machineStateAtom)).toEqual({ name: "fetchingRepos", user: mockUser });
    expect(runEffect).toHaveBeenCalledOnce();
  });

  it("does not call runEffect for invalid transitions", async () => {
    vi.spyOn(console, "warn").mockImplementation(() => {});
    await send({ type: "SHOW_FRONT" });

    expect(store.get(machineStateAtom)).toEqual({ name: "initializing" });
    expect(runEffect).not.toHaveBeenCalled();
  });

  it("syncs cachedUserAtom on auth", async () => {
    await send({ type: "AUTHENTICATED", user: mockUser });

    expect(store.get(cachedUserAtom)).toEqual(mockUser);
  });

  it("clears cache on logout", async () => {
    store.set(machineStateAtom, { name: "fetchingRepos", user: mockUser });
    store.set(cachedUserAtom, mockUser);
    store.set(cachedRepoAtom, { owner: "acme", repo: "notes" });

    await send({ type: "LOGOUT" });

    expect(store.get(cachedUserAtom)).toBeNull();
    expect(store.get(cachedRepoAtom)).toBeNull();
  });

  it("passes cachedRepo from store as context to transition", async () => {
    store.set(machineStateAtom, { name: "fetchingRepos", user: mockUser });
    store.set(cachedRepoAtom, { owner: "acme", repo: "notes" });

    await send({ type: "REPOS_LOADED", repos: ["acme/notes", "acme/wiki"] });

    const state = store.get(machineStateAtom);
    expect(state).toEqual({
      name: "loadingRepo",
      user: mockUser,
      repo: { owner: "acme", repo: "notes" },
      repos: ["acme/notes", "acme/wiki"],
    });
  });

  it("processes queued events sequentially", async () => {
    const order: string[] = [];

    vi.mocked(runEffect).mockImplementation(async (...args) => {
      order.push(`effect:${args[0].name}`);
      if (args[0].name === "fetchingRepos") {
        await args[3]({ type: "REPOS_LOADED", repos: ["acme/notes"] });
      }
    });

    await send({ type: "AUTHENTICATED", user: mockUser });

    expect(order).toEqual(["effect:fetchingRepos", "effect:loadingRepo"]);
    expect(store.get(machineStateAtom)).toEqual({
      name: "loadingRepo",
      user: mockUser,
      repo: { owner: "acme", repo: "notes" },
      repos: ["acme/notes"],
    });
  });

  it("queued events see fresh state, not stale state", async () => {
    const statesSeenByEffect: string[] = [];

    vi.mocked(runEffect).mockImplementation(async (state) => {
      statesSeenByEffect.push(state.name);
    });

    store.set(machineStateAtom, {
      name: "ready",
      user: mockUser,
      repo: { owner: "acme", repo: "notes" },
      repos: ["acme/notes"],
      filenames: [],
      files: {},
      view: { name: "front" },
    });

    await send({ type: "SHOW_NOTE", path: "/a.md" });
    await send({ type: "SHOW_FRONT" });

    expect(statesSeenByEffect).toEqual(["ready", "ready"]);

    const finalState = store.get(machineStateAtom);
    expect(finalState.name).toBe("ready");
    if (finalState.name === "ready") {
      expect(finalState.view).toEqual({ name: "front" });
    }
  });

  it("recovers from thrown effect (draining resets)", async () => {
    vi.mocked(runEffect).mockRejectedValueOnce(new Error("effect exploded"));

    await expect(send({ type: "AUTHENTICATED", user: mockUser })).rejects.toThrow(
      "effect exploded",
    );

    vi.mocked(runEffect).mockReset();

    store.set(machineStateAtom, { name: "fetchingRepos", user: mockUser });
    await send({ type: "LOGOUT" });

    expect(store.get(machineStateAtom)).toEqual({ name: "unauthenticated", authError: null });
  });
});
