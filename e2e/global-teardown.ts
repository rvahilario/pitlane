import { execSync } from "child_process";
import fs from "fs";
import { PID_FILE } from "./constants.ts";

export default async function globalTeardown() {
  if (!fs.existsSync(PID_FILE)) return;

  const pid = fs.readFileSync(PID_FILE, "utf8").trim();
  fs.unlinkSync(PID_FILE);

  try {
    execSync(`taskkill /PID ${pid} /F /T`, { stdio: "ignore" });
    console.log(`[e2e] Killed Pitlane (PID ${pid})`);
  } catch {
    // Already gone
  }
}
