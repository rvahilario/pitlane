# 🏁 Pitlane

> **Your invisible co-pilot for iRacing.**
> Automatic, lightweight, zero friction.

Pitlane handles the full lifecycle of your companion apps while you focus on what matters: **racing**.

It detects when iRacing opens or closes and orchestrates everything behind the scenes — launches, monitors, restarts on crash, and shuts everything down cleanly at the end of the session.

Built for **SimHub, CrewChief, VoiceAttack, Kapps, OBS** and any other companion app you rely on.

🇧🇷 [Leia em Português](./README.pt-BR.md)

---

## ✨ Highlights

- 🚀 **Smart auto-launch**
  Your apps start automatically with iRacing — in the right order.

- 🛑 **Configurable auto-stop**
  Kills everything when iRacing closes (toggle per session).

- 🧠 **Resilient watchdog**
  Detects crashes and restarts apps automatically (up to a configurable limit).

- ⚙️ **Advanced process management**
  `force kill`, `kill process tree`, and track-by-name support (great for stub launchers like G Hub).

- 📜 **Real-time event log**
  Track everything: launches, stops, iRacing events.

- 🔁 **Start with Windows**
  Optional startup registry integration.

- 🧩 **System tray-first**
  Runs in the background — UI opens on demand.

- 🔒 **Single instance**
  Prevents duplicates and brings the window to focus.

- 🌍 **Multilingual**
  🇧🇷 Português · 🇺🇸 English

---

## 🧱 Stack

| Layer       | Technology                                         |
| ----------- | -------------------------------------------------- |
| 🎨 Frontend | React 19 · TypeScript · Vite                       |
| 💅 UI       | Tailwind CSS v4 · Exclusive dark theme             |
| ⚙️ Backend  | Rust · Tauri v2                                    |
| 🔌 IPC      | Tauri Commands (`invoke`) + Events (`emit/listen`) |
| 💾 Config   | JSON at `%LOCALAPPDATA%\Pitlane\config.json`       |

### 💡 Why Tauri?

The **iGnition** predecessor (Python + pywebview) used ~150–300 MB idle.
Pitlane runs at **~15–30 MB** — WebView2 is only instantiated when the settings window opens.

---

## 📦 Installation

Download the latest release:
👉 [https://github.com/rvahilario/pitlane/releases](https://github.com/rvahilario/pitlane/releases)

| File                             | Description                      |
| -------------------------------- | -------------------------------- |
| 🟢 `Pitlane_x.y.z_x64-setup.exe` | NSIS installer **(recommended)** |
| ⚪ `Pitlane_x.y.z_x64_en-US.msi` | MSI                              |

**Requirements:**

- Windows 10/11 x64
- WebView2 Runtime _(already bundled in Windows 11)_

---

## 🛠️ Development

**Prerequisites:**

- Node.js 20+
- Rust (stable `x86_64-pc-windows-msvc`)
- MSVC Build Tools 2022

```bash
# Clone and setup
git clone https://github.com/rvahilario/pitlane.git
cd pitlane
npm install

# Full dev (Rust + React with hot reload)
npm run tauri dev

# Frontend only (fast UI iteration)
npm run dev

# Tests
npm run test        # frontend (Vitest)
npm run rust:test   # backend (cargo test)

# Local production build
powershell -ExecutionPolicy Bypass -File scripts/build-release.ps1
```

**Output:**

```
src-tauri/target/release/bundle/nsis/   → .exe
src-tauri/target/release/bundle/msi/    → .msi
```

### 🧪 Testing without opening iRacing

```powershell
powershell -ExecutionPolicy Bypass -File scripts/fake-iracing.ps1
```

Simulates a full open/close cycle — perfect for fast development iteration.

---

## 🗺️ Roadmap

- 🎛️ Profile management UI
- 🖼️ Executable icon extraction for app cards
- 💤 `start_minimized` (pending spawn fix)
- 🖱️ Drag-and-drop to reorder apps

---

## 📄 License

Distributed under the **GPL v3**.
See [`LICENSE`](./LICENSE) for details.
