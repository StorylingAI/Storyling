import { spawn } from "node:child_process";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const tsxCli = require.resolve("tsx/cli");

const mode = process.argv[2] === "production" ? "production" : "development";
const isProduction = mode === "production";
const command = process.execPath;
const args = isProduction
  ? ["dist/index.js"]
  : [tsxCli, "watch", "server/_core/index.ts"];

const child = spawn(command, args, {
  env: {
    ...process.env,
    NODE_ENV: mode,
  },
  stdio: "inherit",
});

const forwardSignal = (signal) => {
  if (!child.killed) {
    child.kill(signal);
  }
};

process.on("SIGINT", () => forwardSignal("SIGINT"));
process.on("SIGTERM", () => forwardSignal("SIGTERM"));

child.on("exit", (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
