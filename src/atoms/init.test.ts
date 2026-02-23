import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("../lib/github", () => ({
  fetchCurrentUser: vi.fn(),
}));

vi.mock("./machine", () => ({
  send: vi.fn(),
}));

import { fetchCurrentUser } from "../lib/github";
import { send } from "./machine";
import { store, cachedUserAtom } from "./store";
import { parseAuthError, parseOAuthHash, init } from "./init";

const mockUser = {
  username: "testuser",
  token: "tok_123",
  installationId: "inst_456",
  email: "test@example.com",
};

beforeEach(() => {
  store.set(cachedUserAtom, null);
  localStorage.clear();
  window.location.hash = "";
});

describe("parseAuthError", () => {
  it("returns error string from hash", () => {
    window.location.hash = "#auth_error=something%20went%20wrong";

    expect(parseAuthError()).toBe("something went wrong");
  });

  it("returns null when hash is empty", () => {
    window.location.hash = "";

    expect(parseAuthError()).toBeNull();
  });

  it("returns null when hash has no auth_error param", () => {
    window.location.hash = "#other=value";

    expect(parseAuthError()).toBeNull();
  });
});

describe("parseOAuthHash", () => {
  it("returns user object when all four params are present", () => {
    window.location.hash =
      "#access_token=tok_123&username=testuser&email=test%40example.com&app_install_id=inst_456";

    expect(parseOAuthHash()).toEqual({
      username: "testuser",
      token: "tok_123",
      installationId: "inst_456",
      email: "test@example.com",
    });
  });

  it("returns null when access_token is missing", () => {
    window.location.hash = "#username=testuser&email=test%40example.com&app_install_id=inst_456";

    expect(parseOAuthHash()).toBeNull();
  });

  it("returns null when username is missing", () => {
    window.location.hash = "#access_token=tok_123&email=test%40example.com&app_install_id=inst_456";

    expect(parseOAuthHash()).toBeNull();
  });

  it("returns null when email is missing", () => {
    window.location.hash = "#access_token=tok_123&username=testuser&app_install_id=inst_456";

    expect(parseOAuthHash()).toBeNull();
  });

  it("returns null when app_install_id is missing", () => {
    window.location.hash = "#access_token=tok_123&username=testuser&email=test%40example.com";

    expect(parseOAuthHash()).toBeNull();
  });

  it("returns null when hash is empty", () => {
    window.location.hash = "";

    expect(parseOAuthHash()).toBeNull();
  });
});

describe("init", () => {
  it("handles auth error in hash", async () => {
    const replaceState = vi.spyOn(window.history, "replaceState");
    window.location.hash = "#auth_error=bad_token";

    await init();

    expect(send).toHaveBeenCalledWith({ type: "AUTH_ERROR", message: "bad_token" });
    expect(replaceState).toHaveBeenCalledWith(null, "", window.location.pathname);
  });

  it("handles OAuth params in hash", async () => {
    const replaceState = vi.spyOn(window.history, "replaceState");
    window.location.hash =
      "#access_token=tok_123&username=testuser&email=test%40example.com&app_install_id=inst_456";

    await init();

    expect(send).toHaveBeenCalledWith({
      type: "AUTHENTICATED",
      user: {
        username: "testuser",
        token: "tok_123",
        installationId: "inst_456",
        email: "test@example.com",
      },
    });
    expect(replaceState).toHaveBeenCalledWith(null, "", window.location.pathname);
  });

  it("re-authenticates returning user with valid token", async () => {
    store.set(cachedUserAtom, mockUser);
    vi.mocked(fetchCurrentUser).mockResolvedValue({ login: "testuser" });

    await init();

    expect(fetchCurrentUser).toHaveBeenCalledWith("tok_123");
    expect(send).toHaveBeenCalledWith({ type: "AUTHENTICATED", user: mockUser });
  });

  it("sends NO_AUTH for returning user with expired token", async () => {
    store.set(cachedUserAtom, mockUser);
    vi.mocked(fetchCurrentUser).mockResolvedValue(null);

    await init();

    expect(fetchCurrentUser).toHaveBeenCalledWith("tok_123");
    expect(send).toHaveBeenCalledWith({ type: "NO_AUTH" });
  });

  it("sends NO_AUTH when no cached user", async () => {
    await init();

    expect(send).toHaveBeenCalledWith({ type: "NO_AUTH" });
  });
});
