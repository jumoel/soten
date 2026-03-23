/// <reference types="vitest" />

import { execFile, spawn } from "node:child_process";
import { readdir, readFile, stat } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { VitePWA } from "vite-plugin-pwa";

async function collectFiles(dir: string, base: string): Promise<string[]> {
  const entries = await readdir(dir);
  const files: string[] = [];
  for (const entry of entries) {
    if (entry.startsWith(".")) continue;
    const full = join(dir, entry);
    const s = await stat(full);
    if (s.isDirectory()) {
      files.push(...(await collectFiles(full, base)));
    } else {
      files.push(relative(base, full));
    }
  }
  return files;
}

export default defineConfig({
  plugins: [
    {
      name: "local-repo",
      configureServer(server) {
        const sandboxRoot = resolve(process.cwd(), "..");
        const configuredRepos = new Set<string>();

        async function ensureReceiveConfig(repoPath: string): Promise<void> {
          if (configuredRepos.has(repoPath)) return;
          await new Promise<void>((resolve, reject) => {
            execFile(
              "git",
              ["config", "receive.denyCurrentBranch", "updateInstead"],
              { cwd: repoPath },
              (err) => (err ? reject(err) : resolve()),
            );
          });
          configuredRepos.add(repoPath);
        }

        function resolveLocalGitRepo(
          pathname: string,
        ): { repoPath: string; gitPath: string } | null {
          const prefix = "/api/local-git/";
          if (!pathname.startsWith(prefix)) return null;
          const rest = pathname.slice(prefix.length);
          const slashIdx = rest.indexOf("/");
          if (slashIdx === -1) return null;
          const dir = decodeURIComponent(rest.slice(0, slashIdx));
          const gitPath = rest.slice(slashIdx + 1);
          const repoPath = resolve(process.cwd(), dir);
          if (!repoPath.startsWith(sandboxRoot)) return null;
          return { repoPath, gitPath };
        }

        server.middlewares.use(async (req, res, next) => {
          const url = new URL(req.url ?? "/", "http://localhost");

          // Git smart HTTP protocol handler
          const gitRepo = resolveLocalGitRepo(url.pathname);
          if (gitRepo) {
            const { repoPath, gitPath } = gitRepo;

            try {
              await ensureReceiveConfig(repoPath);
            } catch {
              res.statusCode = 500;
              res.end("Failed to configure repo");
              return;
            }

            // GET /info/refs?service=git-upload-pack or git-receive-pack
            if (req.method === "GET" && gitPath === "info/refs") {
              const service = url.searchParams.get("service");
              if (service !== "git-upload-pack" && service !== "git-receive-pack") {
                res.statusCode = 403;
                res.end("Unsupported service");
                return;
              }
              const proc = execFile(
                "git",
                [service.replace("git-", ""), "--stateless-rpc", "--advertise-refs", repoPath],
                { encoding: "buffer", maxBuffer: 50 * 1024 * 1024 },
                (err, stdout) => {
                  if (err) {
                    res.statusCode = 500;
                    res.end(err.message);
                    return;
                  }
                  res.setHeader("Content-Type", `application/x-${service}-advertisement`);
                  res.setHeader("Cache-Control", "no-cache");
                  // Smart HTTP ref advertisement preamble
                  const pktLine = `# service=${service}\n`;
                  const pktLen = (pktLine.length + 4).toString(16).padStart(4, "0");
                  res.write(pktLen + pktLine);
                  res.write("0000");
                  res.end(stdout);
                },
              );
              proc.on("error", () => {
                res.statusCode = 500;
                res.end("Failed to spawn git");
              });
              return;
            }

            // POST /git-upload-pack or /git-receive-pack
            if (
              req.method === "POST" &&
              (gitPath === "git-upload-pack" || gitPath === "git-receive-pack")
            ) {
              const service = gitPath.replace("git-", "");
              res.setHeader("Content-Type", `application/x-git-${service}-result`);
              res.setHeader("Cache-Control", "no-cache");

              const proc = spawn("git", [service, "--stateless-rpc", repoPath]);

              req.pipe(proc.stdin);
              proc.stdout.pipe(res);
              proc.stderr.on("data", (data: Buffer) => {
                console.error("[local-git]", data.toString());
              });
              proc.on("error", () => {
                res.statusCode = 500;
                res.end("Failed to spawn git");
              });
              return;
            }

            res.statusCode = 404;
            res.end("Not found");
            return;
          }

          if (url.pathname === "/api/test-repo/files") {
            const dir = url.searchParams.get("dir");
            if (!dir) {
              res.statusCode = 400;
              res.end("Missing dir");
              return;
            }
            const target = resolve(process.cwd(), dir);
            if (!target.startsWith(sandboxRoot)) {
              res.statusCode = 403;
              res.end("Forbidden");
              return;
            }
            try {
              const files = await collectFiles(target, target);
              res.setHeader("Content-Type", "application/json");
              res.end(JSON.stringify(files));
            } catch {
              res.statusCode = 500;
              res.end("Error reading directory");
            }
            return;
          }

          if (url.pathname === "/api/test-repo/file") {
            const path = url.searchParams.get("path");
            if (!path) {
              res.statusCode = 400;
              res.end("Missing path");
              return;
            }
            const target = resolve(process.cwd(), path);
            if (!target.startsWith(sandboxRoot)) {
              res.statusCode = 403;
              res.end("Forbidden");
              return;
            }
            try {
              const content = await readFile(target, "utf8");
              res.setHeader("Content-Type", "text/plain; charset=utf-8");
              res.end(content);
            } catch {
              res.statusCode = 404;
              res.end("Not found");
            }
            return;
          }

          next();
        });
      },
    },
    react(),
    tailwindcss(),
    VitePWA({
      registerType: "autoUpdate",
      workbox: {
        globPatterns: ["**/*.{js,css,html,svg,png,woff2}"],
        navigateFallback: "index.html",
        navigateFallbackDenylist: [/^\/api\//],
        // Raise limit to accommodate Storybook manager bundles (default 2 MiB)
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024,
      },
      manifest: {
        name: "Soten",
        short_name: "Soten",
        description: "Minimal Markdown note editor",
        theme_color: "#f0ece4",
        background_color: "#f0ece4",
        display: "standalone",
        icons: [
          { src: "pwa-192x192.png", sizes: "192x192", type: "image/png" },
          { src: "pwa-512x512.png", sizes: "512x512", type: "image/png" },
          { src: "soten-app-icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
        ],
      },
    }),
  ],

  worker: {
    format: "es",
  },

  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          "markdown-render": [
            "remark-parse",
            "remark-frontmatter",
            "remark-gfm",
            "remark-rehype",
            "rehype-raw",
            "rehype-stringify",
          ],
        },
      },
    },
  },

  server: {
    proxy: {
      "/api/cors-proxy": { target: "http://localhost:8788" },
      "/api/gh-auth": { target: "http://localhost:8788" },
      "/api/test-repo": { target: "http://localhost:8788" },
    },
  },

  test: {
    environment: "jsdom",
    clearMocks: true,
    exclude: ["e2e/**", "node_modules/**"],
  },
});
