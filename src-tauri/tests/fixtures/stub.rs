// Fixture: stub launcher — spawns fixture-dummy as a child then exits immediately.
// Simulates Squirrel-style launchers that hand off to a child process.
fn main() {
    let self_dir = std::env::current_exe()
        .expect("cannot resolve current exe")
        .parent()
        .expect("exe has no parent dir")
        .to_path_buf();

    let dummy = self_dir.join("fixture-dummy.exe");
    std::process::Command::new(&dummy)
        .spawn()
        .unwrap_or_else(|e| panic!("failed to spawn fixture-dummy at {}: {e}", dummy.display()));
    // exits immediately — stub handed off to child
}
