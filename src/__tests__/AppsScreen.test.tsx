import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { AppsScreen } from "@/components/screens/AppsScreen";
import type { AppStatus, ManagedApp, Profile } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  api: {
    getApps: vi.fn(),
    getProfiles: vi.fn(),
    getActiveProfileId: vi.fn(),
    getAppStatuses: vi.fn(),
    forceLaunchApp: vi.fn(),
    forceKillApp: vi.fn(),
  },
}));

const { api } = await import("@/lib/api");

const PROFILE_A: Profile = { id: "p1", name: "Default", enabled: true, color: null, trigger_mode: null };

function makeApp(overrides: Partial<ManagedApp> = {}): ManagedApp {
  return {
    id: "1",
    profile_id: "p1",
    name: "SimHub",
    exe_path: "C:/SimHub/SimHub.exe",
    args: null,
    working_dir: null,
    enabled: true,
    start_minimized: true,
    restart_on_crash: false,
    max_restart_attempts: 3,
    startup_delay_secs: 0,
    track_process_name: null,
    force_kill_on_stop: false,
    kill_process_tree: false,
    ...overrides,
  };
}

function makeStatus(app_id: string, state: AppStatus["state"]): AppStatus {
  return { app_id, name: "SimHub", state };
}

beforeEach(() => {
  vi.mocked(api.getProfiles).mockResolvedValue([PROFILE_A]);
  vi.mocked(api.getActiveProfileId).mockResolvedValue("p1");
  vi.mocked(api.getApps).mockResolvedValue([]);
  vi.mocked(api.getAppStatuses).mockResolvedValue([]);
  vi.mocked(api.forceLaunchApp).mockResolvedValue(undefined);
  vi.mocked(api.forceKillApp).mockResolvedValue(undefined);
});

describe("AppsScreen", () => {
  it("should show empty state when profile has no apps", async () => {
    render(<AppsScreen />);
    await waitFor(() => expect(screen.getByText(/no apps configured/i)).toBeInTheDocument());
  });

  it("should render app name and status label", async () => {
    vi.mocked(api.getApps).mockResolvedValue([makeApp()]);
    render(<AppsScreen />);
    await waitFor(() => expect(screen.getByText("SimHub")).toBeInTheDocument());
    expect(screen.getByText(/idle/i)).toBeInTheDocument();
  });

  it("should render all apps returned by the api", async () => {
    vi.mocked(api.getApps).mockResolvedValue([
      makeApp({ id: "1", name: "SimHub" }),
      makeApp({ id: "2", name: "CrewChief", exe_path: "CrewChief.exe" }),
    ]);
    render(<AppsScreen />);
    await waitFor(() => expect(screen.getByText("SimHub")).toBeInTheDocument());
    expect(screen.getByText("CrewChief")).toBeInTheDocument();
  });

  it("should show active profile name in subtitle", async () => {
    render(<AppsScreen />);
    await waitFor(() => expect(screen.getByText(/Default/)).toBeInTheDocument());
  });

  it("should dim disabled apps", async () => {
    vi.mocked(api.getApps).mockResolvedValue([makeApp({ enabled: false })]);
    render(<AppsScreen />);
    const item = await screen.findByText("SimHub");
    expect(item.closest("li")).toHaveClass("opacity-50");
  });

  it("should show start button when app is idle", async () => {
    vi.mocked(api.getApps).mockResolvedValue([makeApp({ id: "1" })]);
    vi.mocked(api.getAppStatuses).mockResolvedValue([makeStatus("1", { type: "idle" })]);
    render(<AppsScreen />);
    await screen.findByText("SimHub");
    expect(screen.getByTitle(/start/i)).toBeInTheDocument();
  });

  it("should show stop button when app is running", async () => {
    vi.mocked(api.getApps).mockResolvedValue([makeApp({ id: "1" })]);
    vi.mocked(api.getAppStatuses).mockResolvedValue([
      makeStatus("1", { type: "running", pid: 1234, restart_count: 0 }),
    ]);
    render(<AppsScreen />);
    await screen.findByText("SimHub");
    await waitFor(() => expect(screen.getByTitle(/stop/i)).toBeInTheDocument());
  });

  it("should show start button when app has crashed", async () => {
    vi.mocked(api.getApps).mockResolvedValue([makeApp({ id: "1" })]);
    vi.mocked(api.getAppStatuses).mockResolvedValue([makeStatus("1", { type: "crashed" })]);
    render(<AppsScreen />);
    await screen.findByText("SimHub");
    await waitFor(() => expect(screen.getByTitle(/start/i)).toBeInTheDocument());
  });

  it("should call forceLaunchApp when start is clicked", async () => {
    vi.mocked(api.getApps).mockResolvedValue([makeApp({ id: "42" })]);
    vi.mocked(api.getAppStatuses).mockResolvedValue([makeStatus("42", { type: "idle" })]);
    render(<AppsScreen />);
    await waitFor(() => expect(screen.getByTitle(/start/i)).toBeInTheDocument());
    await userEvent.click(screen.getByTitle(/start/i));
    expect(vi.mocked(api.forceLaunchApp)).toHaveBeenCalledWith("42");
  });

  it("should call forceKillApp when stop is clicked", async () => {
    vi.mocked(api.getApps).mockResolvedValue([makeApp({ id: "42" })]);
    vi.mocked(api.getAppStatuses).mockResolvedValue([
      makeStatus("42", { type: "running", pid: 99, restart_count: 0 }),
    ]);
    render(<AppsScreen />);
    await waitFor(() => expect(screen.getByTitle(/stop/i)).toBeInTheDocument());
    await userEvent.click(screen.getByTitle(/stop/i));
    expect(vi.mocked(api.forceKillApp)).toHaveBeenCalledWith("42");
  });
});
