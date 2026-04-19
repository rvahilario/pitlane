import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SettingsScreen } from "@/components/screens/SettingsScreen";
import type { Settings } from "@/lib/api";

vi.mock("@/lib/api", () => ({
  api: {
    getSettings: vi.fn(),
    saveSettings: vi.fn(),
  },
}));

vi.mock("@/components/LanguageSelector", () => ({
  LanguageSelector: () => null,
}));

const { api } = await import("@/lib/api");

const DEFAULT_SETTINGS: Settings = {
  poll_interval_secs: 1,
  default_trigger: "ui",
  notifications_enabled: true,
  autostart: false,
};

beforeEach(() => {
  vi.mocked(api.getSettings).mockResolvedValue({ ...DEFAULT_SETTINGS });
  vi.mocked(api.saveSettings).mockResolvedValue(undefined);
});

describe("SettingsScreen", () => {
  it("should load and display poll interval from api", async () => {
    vi.mocked(api.getSettings).mockResolvedValue({ ...DEFAULT_SETTINGS, poll_interval_secs: 2.5 });
    render(<SettingsScreen />);
    const input = await screen.findByRole<HTMLInputElement>("spinbutton");
    expect(input.value).toBe("2.5");
  });

  it("should mark the active trigger button based on loaded settings", async () => {
    vi.mocked(api.getSettings).mockResolvedValue({ ...DEFAULT_SETTINGS, default_trigger: "race" });
    render(<SettingsScreen />);
    await waitFor(() => {
      expect(screen.getByText("iRacingSim64DX11.exe")).toHaveAttribute("data-active", "true");
      expect(screen.getByText("iRacingUI.exe")).toHaveAttribute("data-active", "false");
    });
  });

  it("should switch active trigger when clicking the other option", async () => {
    render(<SettingsScreen />);
    await screen.findByRole("spinbutton");

    await userEvent.click(screen.getByText("iRacingSim64DX11.exe"));

    expect(screen.getByText("iRacingSim64DX11.exe")).toHaveAttribute("data-active", "true");
    expect(screen.getByText("iRacingUI.exe")).toHaveAttribute("data-active", "false");
  });

  it("should toggle autostart when clicking its toggle", async () => {
    render(<SettingsScreen />);
    await screen.findByRole("spinbutton");

    const autostartToggle = screen.getAllByRole("switch")
      .find((b) => b.closest("div")?.textContent?.includes("Start with Windows"));
    expect(autostartToggle).toBeDefined();

    await userEvent.click(autostartToggle!);
    await userEvent.click(screen.getByText("Save"));

    expect(vi.mocked(api.saveSettings)).toHaveBeenCalledWith(
      expect.objectContaining({ autostart: true }),
    );
  });

  it("should call saveSettings with current state on save", async () => {
    render(<SettingsScreen />);
    await screen.findByRole("spinbutton");

    await userEvent.click(screen.getByText("Save"));

    expect(vi.mocked(api.saveSettings)).toHaveBeenCalledOnce();
    expect(vi.mocked(api.saveSettings)).toHaveBeenCalledWith(DEFAULT_SETTINGS);
  });

  it("should show saving indicator while save is in flight", async () => {
    let resolve!: () => void;
    vi.mocked(api.saveSettings).mockReturnValue(new Promise((r) => { resolve = r; }));

    render(<SettingsScreen />);
    await screen.findByRole("spinbutton");

    await userEvent.click(screen.getByText("Save"));
    expect(screen.getByText("…")).toBeInTheDocument();

    resolve();
    await waitFor(() => expect(screen.getByText("Save")).toBeInTheDocument());
  });
});
