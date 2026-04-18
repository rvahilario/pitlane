# Pitlane

> **Em construção** — rewrite do iGnition em Tauri v2.

Pitlane monitora o iRacing e gerencia automaticamente o ciclo de vida de apps companheiros (SimHub, CrewChief, VoiceAttack, etc.).

**Motivação:** Alternativas existentes como o iManager têm funcionalidades limitadas e parecem abandonadas. O iGnition resolveu isso, mas (Python + pywebview) consome ~150–300 MB idle. Pitlane mantém ~15–30 MB — a janela só é instanciada quando o usuário abre as configurações.

---

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
| 3 — Monitor (iRacing detection) | 🔄 |
| 4 — Launcher + Process Killer | ⬜ |
| 5 — Controller | ⬜ |
| 6 — Watchdog | ⬜ |
| 7 — CRUD completo | ⬜ |
| 8 — Tray + Single Instance | ⬜ |
| 9 — Autostart + Import/Export | ⬜ |
| 10 — Build | ⬜ |

## Desenvolvimento

```bash
# Dev completo (Rust + React com hot reload)
npm run tauri dev

# Dev só frontend (sem compilar Rust)
npm run dev

# Testes frontend
npm run test

# Testes Rust
cargo test --manifest-path src-tauri/Cargo.toml
```

## Requisitos

- Windows 11
- [Rust](https://rustup.rs/) target `x86_64-pc-windows-msvc`
- MSVC Build Tools 2022
- Node.js 20+

## Licença

GPL v3 — veja [LICENSE](./LICENSE).
