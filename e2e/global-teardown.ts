import { execSync } from "child_process";
import fs from "fs";
import { PID_FILE, VITE_PID_FILE } from "./constants.ts";

function killByPidFile(file: string, label: string): void {
  if (!fs.existsSync(file)) return;
  const pid = fs.readFileSync(file, "utf8").trim();
  fs.unlinkSync(file);
  try {
    execSync(`taskkill /PID ${pid} /F /T`, { stdio: "ignore" });
    console.log(`[e2e] Killed ${label} (PID ${pid})`);
  } catch {
    // Already gone
  }
}

export default async function globalTeardown() {
  killByPidFile(VITE_PID_FILE, "Vite");
  killByPidFile(PID_FILE, "Pitlane");
}
