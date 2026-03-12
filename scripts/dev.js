#!/usr/bin/env node
/**
 * Runs Vite dev server and Wrangler Pages proxy in parallel with
 * color-coded, prefixed log output. Kills both on Ctrl-C.
 */
import { spawn } from "node:child_process";
import { createInterface } from "node:readline";

const tasks = [
  { cmd: "npx", args: ["vite", "dev"], label: "vite", color: "\x1b[36m" },
  { cmd: "npx", args: ["wrangler", "pages", "dev"], label: "proxy", color: "\x1b[35m" },
];

const reset = "\x1b[0m";
const dim = "\x1b[2m";
const children = [];

for (const { cmd, args, label, color } of tasks) {
  const prefix = `${color}[${label}]${reset} `;

  const child = spawn(cmd, args, {
    stdio: ["ignore", "pipe", "pipe"],
    env: { ...process.env, FORCE_COLOR: "1" },
  });

  children.push(child);

  for (const stream of [child.stdout, child.stderr]) {
    const rl = createInterface({ input: stream });
    rl.on("line", (line) => {
      process.stdout.write(`${prefix}${line}\n`);
    });
  }

  child.on("exit", (code) => {
    process.stdout.write(`${dim}${prefix}exited with code ${code}${reset}\n`);
  });
}

function cleanup() {
  for (const child of children) {
    child.kill("SIGTERM");
  }
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
