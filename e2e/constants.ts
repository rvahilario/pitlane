import path from "path";

export const CDP_PORT  = 9222;
export const VITE_PORT = 1420;
export const VITE_URL  = `http://localhost:${VITE_PORT}`;
export const CDP_URL   = `http://localhost:${CDP_PORT}`;

export const PID_FILE      = path.resolve(".e2e-pid");
export const VITE_PID_FILE = path.resolve(".e2e-vite-pid");
