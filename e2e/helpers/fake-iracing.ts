/**
 * Simulates iRacing being open by creating an iRacingUI.exe process.
 * Mirrors what scripts/fake-iracing.ps1 does, without showing a window.
 *
 * Pitlane's monitor polls every ~2 s; helpers add extra wait time to absorb that.
 */

import { execSync, spawn } from "child_process";
import fs from "fs";
import os from "os";
import path from "path";

const FAKE_EXE = path.join(os.tmpdir(), "iRacingUI.exe");
const CMD_EXE = path.join(process.env.SystemRoot ?? "C:\\Windows", "System32", "cmd.exe");

/** Start iRacingUI.exe (hidden cmd.exe clone). Waits for Pitlane to detect it. */
export async function startFakeIRacing(): Promise<void> {
  fs.copyFileSync(CMD_EXE, FAKE_EXE);

  spawn(FAKE_EXE, ["/K", "echo [fake iRacing] running"], {
    windowsHide: true,
    detached: true,
    stdio: "ignore",
  }).unref();

  // Give Pitlane's monitor thread time to detect the process (2 s poll + margin)
  await delay(4_000);
}

/** Kill iRacingUI.exe and clean up the temp copy. Waits for Pitlane to react. */
export async function stopFakeIRacing(): Promise<void> {
  try {
    execSync("taskkill /F /IM iRacingUI.exe", { stdio: "ignore" });
  } catch {
    // Already gone — no-op
  }

  try {
    fs.unlinkSync(FAKE_EXE);
  } catch {
    // Ignore cleanup errors
  }

  await delay(4_000);
}

function delay(ms: number) {
  return new Promise<void>((r) => setTimeout(r, ms));
}
