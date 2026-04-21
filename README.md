# Pitlane

Pitlane monitora o iRacing e gerencia automaticamente o ciclo de vida de apps companheiros (SimHub, CrewChief, VoiceAttack, etc.).

**Motivação:** Alternativas existentes têm funcionalidades limitadas ou parecem abandonadas. O iGnition resolveu isso, mas (Python + pywebview) consome ~150–300 MB idle. Pitlane mantém ~15–30 MB — a janela só é instanciada quando o usuário abre as configurações.

---

## Instalação

Baixe o instalador mais recente na [página de releases](https://github.com/rvahilario/pitlane/releases):

- **`Pitlane_x.y.z_x64-setup.exe`** — NSIS installer (recomendado)
- **`Pitlane_x.y.z_x64_en-US.msi`** — MSI

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| UI | shadcn/ui + Tailwind CSS v4 |
| Backend | Rust (Tauri v2) |
| IPC | Tauri Commands + Events |
| Config | JSON em `%LOCALAPPDATA%\Pitlane\config.json` |

## Status

| Camada | Estado |
|---|---|
| 0 — Scaffold | ✅ |
| 1 — UI Shell | ✅ |
| 2 — Models + Config + Commands | ✅ |
| 3 — Monitor (iRacing detection) | ✅ |
| 4 — Launcher + Process Killer | ✅ |
| 5 — Watchdog (crash detection + auto-restart) | ✅ |
| 6 — Controller (orchestrator) + integration tests | ✅ |
| 7 — Tray + Single Instance | ✅ |
| 8 — Autostart (Windows registry) | ✅ |
| 9 — UI wired to controller (app statuses, log, edit/delete) | ✅ |
| 10 — Build + installer + release pipeline | ✅ |

## Desenvolvimento

```bash
# Dev completo (Rust + React com hot reload)
npm run tauri dev

# Dev só frontend (sem compilar Rust)
npm run dev

# Testes Rust
npm run rust:test

# Testes frontend
npm run test

# Build de produção local (gera instalador em src-tauri/target/release/bundle/)
powershell -ExecutionPolicy Bypass -File scripts/build-release.ps1
```

## Requisitos

- Windows 11
- [Rust](https://rustup.rs/) target `x86_64-pc-windows-msvc`
- MSVC Build Tools 2022
- Node.js 20+

## Future improvements

- **Drag-and-drop** to reorder apps in the list
- **Profile management UI** — create, rename, switch profiles, assign color
- **App icon extraction** — display `.exe` icon in the app card
- **`start_minimized`** — launch apps minimized to taskbar; disabled until spawn issue is resolved

## Licença

GPL v3 — veja [LICENSE](./LICENSE).
