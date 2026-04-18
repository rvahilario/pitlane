// Fixture: persistent dummy app — just stays alive until killed.
fn main() {
    loop {
        std::thread::sleep(std::time::Duration::from_secs(1));
    }
}
