import { spawn } from "child_process";
import fs from "fs";
import { CDP_PORT, PID_FILE } from "./constants.ts";

const BINARY_CANDIDATES = [
  "src-tauri/target/debug/pitlane.exe",
  "src-tauri/target/release/pitlane.exe",
];

async function isCDPAvailable(port: number): Promise<boolean> {
  try {
    const resp = await fetch(`http://localhost:${port}/json/version`);
    return resp.ok;
  } catch {
    return false;
  }
}

async function waitForCDP(port: number, timeoutMs = 30_000): Promise<void> {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    if (await isCDPAvailable(port)) return;
    await new Promise((r) => setTimeout(r, 400));
  }
  throw new Error(
    `[e2e] Pitlane CDP not available on port ${port} after ${timeoutMs}ms.\n` +
      `Make sure the binary is built:\n  cargo build --manifest-path src-tauri/Cargo.toml`
  );
}

export default async function globalSetup() {
  // If already running (e.g. dev started manually), just connect
  if (await isCDPAvailable(CDP_PORT)) {
    console.log(`[e2e] Using existing Pitlane instance on CDP :${CDP_PORT}`);
    return;
  }

  const binaryPath = BINARY_CANDIDATES.find((p) => fs.existsSync(p));
  if (!binaryPath) {
    throw new Error(
      `[e2e] Pitlane binary not found.\n` +
        `Run: cargo build --manifest-path src-tauri/Cargo.toml`
    );
  }

  console.log(`[e2e] Starting Pitlane: ${binaryPath}`);

  const proc = spawn(binaryPath, [], {
    env: {
      ...process.env,
      WEBVIEW2_ADDITIONAL_BROWSER_ARGUMENTS: `--remote-debugging-port=${CDP_PORT}`,
    },
    stdio: "ignore",
    detached: false,
  });

  proc.on("error", (err) => {
    throw new Error(`[e2e] Failed to start Pitlane: ${err.message}`);
  });

  fs.writeFileSync(PID_FILE, String(proc.pid));

  console.log(`[e2e] Waiting for CDP on port ${CDP_PORT}...`);
  await waitForCDP(CDP_PORT);
  console.log("[e2e] Pitlane ready.");
}
