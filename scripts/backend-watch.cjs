const { spawn } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");

const repoRoot = path.resolve(__dirname, "..");
const backendDir = path.join(repoRoot, "Server-side");
const watchTargets = [
  "server.js",
  "Config",
  "Controllers",
  "DataBase",
  "Middlewares",
  "Models",
  "Routes",
  "Utils",
];

let child = null;
let restartTimer = null;
let restarting = false;
let shuttingDown = false;

function startServer() {
  child = spawn(process.execPath, ["server.js"], {
    cwd: backendDir,
    env: process.env,
    stdio: "inherit",
  });

  child.on("exit", (code, signal) => {
    child = null;

    if (shuttingDown) {
      process.exit(code || 0);
    }

    if (restarting) {
      restarting = false;
      startServer();
      return;
    }

    console.error(`Backend exited with ${signal || `code ${code}`}`);
    process.exit(code || 1);
  });

  child.on("error", (error) => {
    console.error(`Backend failed to start: ${error.message}`);
    process.exit(1);
  });
}

function scheduleRestart() {
  if (shuttingDown) return;

  clearTimeout(restartTimer);
  restartTimer = setTimeout(() => {
    if (!child) {
      startServer();
      return;
    }

    restarting = true;
    console.log("Backend file change detected; restarting server.js");
    child.kill(process.platform === "win32" ? undefined : "SIGTERM");
  }, 750);
}

function watchTarget(target) {
  const absoluteTarget = path.join(backendDir, target);
  if (!fs.existsSync(absoluteTarget)) return;

  fs.watch(
    absoluteTarget,
    {
      recursive: fs.statSync(absoluteTarget).isDirectory(),
    },
    (_eventType, fileName) => {
      const changedFile = String(fileName || "");
      if (
        changedFile.includes(`${path.sep}logs${path.sep}`) ||
        changedFile.startsWith("logs")
      ) {
        return;
      }

      if (changedFile && !/\.(js|json)$/i.test(changedFile)) {
        return;
      }

      scheduleRestart();
    }
  );
}

function stopServer(signal) {
  if (shuttingDown) return;

  shuttingDown = true;
  clearTimeout(restartTimer);

  if (!child) {
    process.exit(0);
    return;
  }

  child.kill(process.platform === "win32" ? undefined : signal);

  setTimeout(() => {
    process.exit(0);
  }, 10_000).unref();
}

for (const target of watchTargets) {
  watchTarget(target);
}

startServer();

process.on("SIGINT", () => stopServer("SIGINT"));
process.on("SIGTERM", () => stopServer("SIGTERM"));
