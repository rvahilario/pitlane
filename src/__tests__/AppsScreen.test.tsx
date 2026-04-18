import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { AppsScreen } from "@/components/screens/AppsScreen";
import type { ManagedApp, Profile } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  api: {
    getApps: vi.fn(),
    getProfiles: vi.fn(),
    getActiveProfileId: vi.fn(),
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
    ...overrides,
  };
}

beforeEach(() => {
  vi.mocked(api.getProfiles).mockResolvedValue([PROFILE_A]);
  vi.mocked(api.getActiveProfileId).mockResolvedValue("p1");
  vi.mocked(api.getApps).mockResolvedValue([]);
});

describe("AppsScreen", () => {
  it("should show empty state when profile has no apps", async () => {
    render(<AppsScreen />);
    await waitFor(() => expect(screen.getByText(/no apps configured/i)).toBeInTheDocument());
  });

  it("should render app name and exe path", async () => {
    vi.mocked(api.getApps).mockResolvedValue([makeApp()]);
    render(<AppsScreen />);
    await waitFor(() => expect(screen.getByText("SimHub")).toBeInTheDocument());
    expect(screen.getByText("C:/SimHub/SimHub.exe")).toBeInTheDocument();
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
    expect(item.closest("li")).toHaveClass("opacity-40");
  });
});
