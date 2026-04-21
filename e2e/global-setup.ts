/**
 * Global setup for the default (UI) test suite.
 * Starts the Vite dev server on port 1420 so Playwright's own Chromium
 * can navigate to it. No Tauri binary required — Tauri IPC is mocked in fixtures.
 */

import { spawn } from "child_process";
import fs from "fs";
import { VITE_PORT, VITE_PID_FILE } from "./constants.ts";

async function isPortOpen(port: number): Promise<boolean> {
  try {
    const r = await fetch(`http://localhost:${port}`);
    return r.status < 600;
  } catch {
    return false;
  }
}

async function waitForPort(port: number, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isPortOpen(port)) return;
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(`[e2e] Port ${port} not available after ${timeoutMs}ms`);
}

export default async function globalSetup() {
  if (await isPortOpen(VITE_PORT)) {
    console.log(`[e2e] Vite already running on port ${VITE_PORT}`);
    return;
  }

  console.log("[e2e] Starting Vite dev server...");

  const proc = spawn("npm", ["run", "dev"], {
    stdio: "ignore",
    detached: false,
    shell: true,
  });

  proc.on("error", (err) => {
    throw new Error(`[e2e] Vite failed to start: ${err.message}`);
  });

  fs.writeFileSync(VITE_PID_FILE, String(proc.pid));

  await waitForPort(VITE_PORT);
  console.log("[e2e] Vite ready.");
}
