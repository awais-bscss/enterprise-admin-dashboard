import { spawn } from "node:child_process";

const isWin = process.platform === "win32";

function startService(scriptName) {
  return isWin
    ? spawn("cmd.exe", ["/c", "npm", "run", scriptName], { stdio: "inherit" })
    : spawn("npm", ["run", scriptName], { stdio: "inherit" });
}

const children = [startService("dev:api"), startService("dev:web")];

function shutdown() {
  for (const child of children) {
    if (!child.killed && child.pid) {
      if (isWin) {
        spawn("taskkill", ["/pid", String(child.pid), "/T", "/F"], { stdio: "ignore" });
      } else {
        child.kill("SIGTERM");
      }
    }
  }
}

process.on("SIGINT", () => {
  shutdown();
  process.exit(0);
});
process.on("SIGTERM", () => {
  shutdown();
  process.exit(0);
});

for (const child of children) {
  child.on("exit", (code) => {
    if (code && code !== 0) {
      shutdown();
      process.exit(code);
    }
  });
}
