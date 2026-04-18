# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

---

## O que é este projeto

**Pitlane** é um rewrite do [iGnition](../iGnition) em Tauri v2 (Rust backend + React frontend).
Monitora o iRacing e gerencia automaticamente o ciclo de vida de apps companheiros (SimHub, CrewChief, VoiceAttack, etc.).

**Motivação:** iGnition (Python + pywebview) consome ~150–300 MB idle com WebView2 sempre carregado. Pitlane mantém ~15–30 MB idle — o WebView2 só é instanciado quando a janela de configurações é aberta.

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| UI | shadcn/ui + Tailwind CSS v4 (dark theme exclusivo) |
| Backend | Rust (Tauri v2) |
| IPC | Tauri Commands (`#[tauri::command]`) + Events (`emit/listen`) |
| Config | JSON em `%LOCALAPPDATA%\Pitlane\config.json` |

## Comandos

```bash
# Dev (Tauri completo — Rust + React com hot reload)
npm run tauri dev

# Dev só frontend (sem Rust, para iterar UI rapidamente)
npm run dev

# Testes backend (Rust)
cargo test --manifest-path src-tauri/Cargo.toml

# Testes frontend
npm run test

# Build de produção
npm run tauri build
```

## Arquitetura

### Backend Rust (`src-tauri/src/`)

```
lib.rs            # Entry point da lib; registra commands e inicializa plugins
main.rs           # Entry point binário (só chama lib::run())
models.rs         # ManagedApp, Profile, AppConfig — serde Serialize/Deserialize
config.rs         # Load/save JSON atômico em %LOCALAPPDATA%\Pitlane\config.json
monitor.rs        # Thread que policia iRacing via sysinfo; dispara callbacks
launcher.rs       # Spawn de processos externos (STARTUPINFO para minimizado)
process_killer.rs # WM_CLOSE → grace period → TerminateProcess (Win32)
watchdog.rs       # Thread que detecta crash e reinicia até max_restart_attempts
controller.rs     # Orquestrador: coordena monitor → launcher → watchdog → killer
commands.rs       # Tauri commands (#[tauri::command]) — API surface do frontend
```

**Threading:**
- Main thread: Tauri event loop
- `monitor` thread: poll `sysinfo` a cada N segundos (configurável)
- `watchdog` thread: poll processos em execução a cada 2 s
- `status-emit` thread: `app.emit("status-updated", payload)` a cada 0.8 s

**IPC:**
- JS → Rust: `invoke("command_name", args)` → `#[tauri::command]`
- Rust → JS: `app.emit("event-name", payload)` → `listen("event-name", handler)`

### Frontend React (`src/`)

```
lib/api.ts            # Wrappers tipados sobre invoke() — toda chamada Rust passa aqui
hooks/useStatus.ts    # Escuta "status-updated" e expõe estado reativo
hooks/useLog.ts       # Poll get_log_since(seq) e mantém buffer local
components/           # Componentes shadcn/ui + componentes do domínio
App.tsx               # Shell: layout, roteamento entre abas
```

## Referência iGnition

O projeto `../iGnition` é uma **referência de funcionalidades**, não um alvo de migração. Consulte-o para entender *o que* o app faz, mas Pitlane pode (e deve) tomar decisões melhores de design, schema e UX.

| Arquivo iGnition | O que ele ilustra |
|---|---|
| `core/models.py` | Campos de configuração de um app gerenciado |
| `core/ignition_controller.py` | Fluxo de lifecycle: detect → launch → watchdog → kill |
| `core/process_killer.py` | Sequência de encerramento gracioso no Windows |
| `core/iracing_monitor.py` | Loop de detecção de processo |
| `core/app_launcher.py` | Como spawnar processo minimizado no Windows |
| `gui/web/api.py` | Quais operações a UI precisa expor |

## Convenções

### Rust
- Sem `unwrap()` em código de produção — usar `?` ou `match` explícito
- Cada módulo tem `#[cfg(test)]` com testes dos comportamentos de negócio
- Thread-safety via `Arc<Mutex<>>` ou `Arc<RwLock<>>`; nunca compartilhar estado sem lock
- Windows-only: não abstrair para cross-platform

### Commits (Conventional Commits)

Formato obrigatório: `<tipo>(<escopo>): <mensagem em inglês, imperativo>`

**Tipos:**
- `feat` — nova funcionalidade
- `fix` — correção de bug
- `refactor` — mudança sem alterar comportamento
- `test` — adição ou correção de testes
- `chore` — tooling, deps, config, CI
- `docs` — documentação

**Escopos por domínio:**

| Escopo | O que cobre |
|---|---|
| `scaffold` | boilerplate inicial do projeto |
| `tooling` | build, vite, tsconfig, deps |
| `ui/theme` | tokens de cor, CSS global |
| `ui/shell` | layout, sidebar, status bar |
| `ui/screens` | telas individuais (apps, log, history, settings) |
| `ui/components` | componentes reutilizáveis |
| `i18n` | traduções e configuração de idioma |
| `models` | structs Rust: ManagedApp, Profile, AppConfig |
| `config` | load/save de config.json |
| `monitor` | detecção do processo iRacing |
| `launcher` | spawn de processos externos |
| `process-killer` | encerramento gracioso de processos |
| `watchdog` | crash detection e auto-restart |
| `controller` | orquestrador principal |
| `commands` | Tauri commands (API surface) |
| `tray` | system tray e janela lazy |
| `autostart` | inicialização com Windows |

**Exemplos:**
```
feat(models): add ManagedApp and Profile structs with serde
feat(config): atomic save with temp-file rename
feat(monitor): iRacing process detection thread
fix(watchdog): respect max_restart_attempts on rapid crashes
feat(ui/theme): dark purple palette with semantic color tokens
feat(i18n): add pt-BR and en translations with i18next
chore(tooling): configure Tailwind v4 and path aliases
```

**Regras:**
- **Só commitar quando o usuário pedir explicitamente**
- Um commit por domínio — não misturar `monitor` com `ui/apps` no mesmo commit
- Mensagem em inglês, verbo no imperativo ("add", "fix", "remove", não "added", "fixes")
- Nunca commitar uma camada incompleta — deve ser testável antes do commit

### Design
- Dark theme exclusivo — sem toggle
- Paleta: `zinc-900` bg, `zinc-800` cards, `zinc-700` borders
- Accent: `#E8002D` (vermelho iRacing)
- Monospace para log e valores numéricos

## Notas Windows

- Win32 via `windows` crate: `EnumWindows`, `SendMessageTimeoutW`, `TerminateProcess`
- Autostart: `tauri-plugin-autostart` (registry `HKCU\...\Run`)
- Icon extraction: PowerShell subprocess → base64 PNG
- Notificações: `tauri-plugin-notification`
- Single instance: `tauri-plugin-single-instance`
