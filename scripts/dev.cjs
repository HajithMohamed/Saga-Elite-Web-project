const { spawn } = require("node:child_process");
const readline = require("node:readline");

const processes = [
  {
    name: "BACKEND",
    color: "\x1b[34m",
    cwd: "Server-side",
    command: process.execPath,
    args: ["--watch", "server.js"],
  },
  {
    name: "FRONTEND",
    color: "\x1b[32m",
    cwd: "Client-Side",
    command: process.execPath,
    args: ["../node_modules/vite/bin/vite.js"],
  },
];

const reset = "\x1b[0m";
const children = new Map();
let shuttingDown = false;

function pipeWithPrefix(stream, name, color) {
  const rl = readline.createInterface({ input: stream });

  rl.on("line", (line) => {
    process.stdout.write(`${color}[${name}]${reset} ${line}\n`);
  });
}

function stopAll(exitCode = 0) {
  if (shuttingDown) return;
  shuttingDown = true;

  for (const child of children.values()) {
    if (!child.killed) {
      child.kill(process.platform === "win32" ? undefined : "SIGTERM");
    }
  }

  setTimeout(() => process.exit(exitCode), 250);
}

for (const proc of processes) {
  const child = spawn(proc.command, proc.args, {
    cwd: proc.cwd,
    env: process.env,
    stdio: ["inherit", "pipe", "pipe"],
  });

  children.set(proc.name, child);
  pipeWithPrefix(child.stdout, proc.name, proc.color);
  pipeWithPrefix(child.stderr, proc.name, proc.color);

  child.on("error", (error) => {
    console.error(`${proc.color}[${proc.name}]${reset} ${error.message}`);
    stopAll(1);
  });

  child.on("exit", (code, signal) => {
    children.delete(proc.name);

    if (!shuttingDown && (code !== 0 || signal)) {
      console.error(
        `${proc.color}[${proc.name}]${reset} exited with ${
          signal || `code ${code}`
        }`
      );
      stopAll(code || 1);
    }
  });
}

process.on("SIGINT", () => stopAll(0));
process.on("SIGTERM", () => stopAll(0));
