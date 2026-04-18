use std::time::{Duration, Instant};

use windows::Win32::Foundation::HWND;
use windows::Win32::UI::WindowsAndMessaging::{
    EnumWindows, GetWindowThreadProcessId, SendMessageTimeoutW,
    SMTO_ABORTIFHUNG, WM_CLOSE,
};

// ── Pure helpers (fully testable) ────────────────────────────────────────────

/// Returns true when a graceful WM_CLOSE should be attempted before force-killing.
pub fn needs_graceful_close(grace_secs: f64) -> bool {
    todo!()
}

// ── Win32 helpers ─────────────────────────────────────────────────────────────

/// Enumerates all top-level windows and sends WM_CLOSE to those owned by `pid`.
pub fn send_wm_close(pid: u32) {
    todo!()
}

/// Waits up to `grace` for the process to exit on its own. Returns true if it exited.
pub fn wait_for_exit(pid: u32, grace: Duration) -> bool {
    todo!()
}

/// Immediately terminates the process via `TerminateProcess`. No-op if PID is gone.
pub fn force_kill(pid: u32) {
    todo!()
}

// ── Public API ────────────────────────────────────────────────────────────────

/// Graceful shutdown: WM_CLOSE → grace period → force kill.
/// When `grace_secs` is 0, skips straight to force kill.
pub fn graceful_kill(pid: u32, grace_secs: f64) {
    todo!()
}

// ── Tests ────────────────────────────────────────────────────────────────────

#[cfg(test)]
mod tests {
    use super::*;

    // ── needs_graceful_close ─────────────────────────────────────────────────

    #[test]
    fn should_require_graceful_close_when_grace_is_positive() {
        assert!(needs_graceful_close(5.0));
        assert!(needs_graceful_close(0.1));
    }

    #[test]
    fn should_skip_graceful_close_when_grace_is_zero() {
        assert!(!needs_graceful_close(0.0));
    }

    #[test]
    fn should_skip_graceful_close_when_grace_is_negative() {
        assert!(!needs_graceful_close(-1.0));
    }

    // ── force_kill ───────────────────────────────────────────────────────────

    #[test]
    fn should_not_panic_when_force_killing_nonexistent_pid() {
        // PID 0 and very large PIDs are never valid on Windows
        force_kill(0);
        force_kill(u32::MAX);
    }

    // ── graceful_kill ────────────────────────────────────────────────────────

    #[test]
    fn should_not_panic_when_graceful_killing_nonexistent_pid() {
        graceful_kill(0, 0.0);
        graceful_kill(u32::MAX, 5.0);
    }

    // ── Manual integration tests (require a real spawned process) ────────────
    //
    // Run with:
    //   cargo test --manifest-path src-tauri/Cargo.toml -- --ignored --nocapture

    #[test]
    #[ignore]
    fn manual_should_gracefully_kill_notepad() {
        use std::process::Command;

        let child = Command::new("C:/Windows/System32/notepad.exe")
            .spawn()
            .expect("failed to spawn notepad");
        let pid = child.id();
        println!("[killer integration] spawned notepad PID: {pid}");

        std::thread::sleep(Duration::from_secs(1));

        graceful_kill(pid, 3.0);
        std::thread::sleep(Duration::from_millis(500));

        // Verify process is gone
        let alive = wait_for_exit(pid, Duration::from_millis(100));
        println!("[killer integration] process exited: {}", !alive);
    }

    #[test]
    #[ignore]
    fn manual_should_force_kill_notepad() {
        use std::process::Command;

        let child = Command::new("C:/Windows/System32/notepad.exe")
            .spawn()
            .expect("failed to spawn notepad");
        let pid = child.id();
        println!("[killer integration] spawned notepad PID: {pid}");

        std::thread::sleep(Duration::from_secs(1));
        force_kill(pid);
        println!("[killer integration] force_kill sent");
    }
}
