// @vitest-environment node
import { describe, it, expect, vi, beforeEach } from "vitest";
import { onRequest } from "./callback.js";

const env = {
  VITE_GH_CLIENT_ID: "test_client_id",
  GH_CLIENT_SECRET: "test_client_secret",
};

function makeContext(url) {
  return {
    request: new Request(url),
    env,
  };
}

beforeEach(() => {
  vi.spyOn(globalThis, "fetch");
});

describe("onRequest", () => {
  it("redirects to GitHub OAuth when no code param", async () => {
    const ctx = makeContext("https://app.example.com/api/gh-auth/callback");

    const response = await onRequest(ctx);

    expect(response.status).toBe(302);
    const location = response.headers.get("Location");
    expect(location).toContain("https://github.com/login/oauth/authorize");
    expect(location).toContain("client_id=test_client_id");
    expect(location).toContain(encodeURIComponent("https://app.example.com/api/gh-auth/callback"));
  });

  it("redirects with auth_error when code exchange returns no access_token", async () => {
    vi.mocked(globalThis.fetch).mockResolvedValue(
      new Response(JSON.stringify({ error: "bad_code", error_description: "Code is invalid" }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const ctx = makeContext("https://app.example.com/api/gh-auth/callback?code=bad_code");

    const response = await onRequest(ctx);

    expect(response.status).toBe(302);
    const location = response.headers.get("Location");
    expect(location).toContain("#auth_error=");
    expect(location).toContain("Code%20is%20invalid");
  });

  it("redirects to app installation when app is not installed", async () => {
    vi.mocked(globalThis.fetch).mockImplementation(async (url) => {
      const urlStr = typeof url === "string" ? url : url.toString();

      if (urlStr.includes("login/oauth/access_token")) {
        return new Response(JSON.stringify({ access_token: "tok_123", token_type: "bearer" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (urlStr.includes("/user/installations")) {
        return new Response(JSON.stringify({ installations: [] }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("{}", { status: 404 });
    });

    const ctx = makeContext("https://app.example.com/api/gh-auth/callback?code=valid_code");

    const response = await onRequest(ctx);

    expect(response.status).toBe(302);
    const location = response.headers.get("Location");
    expect(location).toContain("https://github.com/apps/soten-notes/installations/new");
  });

  it("redirects with token and user info when app is installed", async () => {
    vi.mocked(globalThis.fetch).mockImplementation(async (url) => {
      const urlStr = typeof url === "string" ? url : url.toString();

      if (urlStr.includes("login/oauth/access_token")) {
        return new Response(JSON.stringify({ access_token: "tok_123", token_type: "bearer" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      if (urlStr.includes("/user/installations")) {
        return new Response(
          JSON.stringify({
            installations: [{ app_slug: "soten-notes", id: 789 }],
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }
      if (urlStr.endsWith("/user")) {
        return new Response(JSON.stringify({ login: "testuser", email: "test@example.com" }), {
          status: 200,
          headers: { "Content-Type": "application/json" },
        });
      }
      return new Response("{}", { status: 404 });
    });

    const ctx = makeContext("https://app.example.com/api/gh-auth/callback?code=valid_code");

    const response = await onRequest(ctx);

    expect(response.status).toBe(302);
    const location = response.headers.get("Location");
    expect(location).toContain("app_install_id=789");
    expect(location).toContain("access_token=tok_123");
    expect(location).toContain("username=testuser");
    expect(location).toContain("email=test%40example.com");
  });

  it("redirects with auth_error when exchange throws", async () => {
    vi.mocked(globalThis.fetch).mockRejectedValue(new Error("Network failure"));

    const ctx = makeContext("https://app.example.com/api/gh-auth/callback?code=fail_code");

    const response = await onRequest(ctx);

    expect(response.status).toBe(302);
    const location = response.headers.get("Location");
    expect(location).toContain("#auth_error=");
    expect(location).toContain("Network%20failure");
  });
});
