import { spawn } from "node:child_process";

const isWindows = process.platform === "win32";

async function isReachable(url) {
  try {
    const response = await fetch(url, { signal: AbortSignal.timeout(1000) });
    return response.ok;
  } catch {
    return false;
  }
}

function run(name, command, args) {
  const child = spawn(command, args, {
    shell: isWindows,
    stdio: "pipe",
    env: process.env,
  });

  child.stdout.on("data", (data) => {
    process.stdout.write(`[${name}] ${data}`);
  });
  child.stderr.on("data", (data) => {
    process.stderr.write(`[${name}] ${data}`);
  });
  child.on("exit", (code) => {
    if (code && code !== 0) {
      process.exitCode = code;
    }
  });

  return child;
}

const children = [];

console.log("[convex] using shared remote backend from .env.local");

if (await isReachable("http://127.0.0.1:3000")) {
  console.log("[web] already running on http://127.0.0.1:3000");
} else {
  children.push(run("web", "npm", ["run", "dev"]));
}

if (children.length === 0) {
  console.log("Web server is already running.");
} else {
  const stop = () => {
    for (const child of children) {
      child.kill();
    }
  };

  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
}
