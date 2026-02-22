import { describe, it, expect, vi, beforeEach } from "vitest";
import { fetchCurrentUser, fetchUserRepos } from "./github";

beforeEach(() => {
  vi.spyOn(globalThis, "fetch");
});

function mockFetchResponse(status: number, body: unknown) {
  vi.mocked(globalThis.fetch).mockResolvedValue({
    ok: status >= 200 && status < 300,
    status,
    statusText: `Status ${status}`,
    json: async () => body,
  } as Response);
}

describe("fetchCurrentUser", () => {
  it("returns user data on 200", async () => {
    mockFetchResponse(200, { login: "testuser" });

    const result = await fetchCurrentUser("tok_123");

    expect(result).toEqual({ login: "testuser" });
    expect(globalThis.fetch).toHaveBeenCalledWith("https://api.github.com/user", {
      headers: {
        Authorization: "token tok_123",
        Accept: "application/vnd.github.v3+json",
      },
    });
  });

  it("returns null on 401", async () => {
    mockFetchResponse(401, {});

    const result = await fetchCurrentUser("bad_token");

    expect(result).toBeNull();
  });

  it("returns null on 403", async () => {
    mockFetchResponse(403, {});

    const result = await fetchCurrentUser("bad_token");

    expect(result).toBeNull();
  });

  it("throws on 500", async () => {
    mockFetchResponse(500, {});

    await expect(fetchCurrentUser("tok_123")).rejects.toThrow(
      "Unexpected status code returned from user endpoint",
    );
  });
});

describe("fetchUserRepos", () => {
  it("returns repo names on 200 with repos", async () => {
    mockFetchResponse(200, {
      repositories: [{ full_name: "acme/notes" }, { full_name: "acme/wiki" }],
    });

    const result = await fetchUserRepos("inst_456", "tok_123");

    expect(result).toEqual(["acme/notes", "acme/wiki"]);
    expect(globalThis.fetch).toHaveBeenCalledWith(
      "https://api.github.com/user/installations/inst_456/repositories",
      {
        cache: "reload",
        headers: {
          Authorization: "token tok_123",
          Accept: "application/vnd.github.v3+json",
        },
      },
    );
  });

  it("returns empty array on 200 with no repos", async () => {
    mockFetchResponse(200, { repositories: [] });

    const result = await fetchUserRepos("inst_456", "tok_123");

    expect(result).toEqual([]);
  });

  it("returns null on non-OK response", async () => {
    mockFetchResponse(500, {});

    const result = await fetchUserRepos("inst_456", "tok_123");

    expect(result).toBeNull();
  });
});
