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
- Paleta roxa escura + accent teal-aqua (definida em `src/index.css` via `@theme`):
  - `--color-base: #1a0f36` — fundo principal
  - `--color-surface: #251848` — cards/painéis
  - `--color-accent: #6ec4c0` — teal-aqua, ações primárias
  - `--color-success: #34d399`, `--color-warning: #fbbf24`, `--color-danger: #f87171`
- Contraste mínimo WCAG AA (4.5:1 texto normal, 3:1 UI)
- Monospace para log e valores numéricos

## Testando o ciclo iRacing sem abrir o simulador

Use o script `scripts/fake-iracing.ps1` para simular o iRacing abrindo e fechando:

```powershell
# Inicia o manequim (abre janela cmd.exe com nome iRacingUI.exe)
powershell -ExecutionPolicy Bypass -File scripts/fake-iracing.ps1

# Ou pelo terminal do Claude Code:
! powershell -ExecutionPolicy Bypass -File scripts/fake-iracing.ps1
```

- O Pitlane detecta `iRacingUI.exe` e lança todos os apps do perfil ativo
- Fechar a janela do manequim dispara o kill cycle
- Útil para testar qualquer configuração de app sem precisar do iRacing real

**Debug:** eventos do monitor são gravados em `%LOCALAPPDATA%\Pitlane\debug.log`. Logs do controller (`[controller] ...`) aparecem no stdout do processo — visíveis no terminal de `npm run tauri dev`.

## Padrões de projeto — lifecycle de apps

### Campos de encerramento em `ManagedApp`

| Campo | Tipo | Comportamento |
|---|---|---|
| `force_kill_on_stop` | `bool` | Pula WM_CLOSE, vai direto para `TerminateProcess` (grace=0). Use para apps com shutdown handler quebrado (OBS 32.x). |
| `kill_process_tree` | `bool` | Usa `taskkill /F /T /PID` para matar o processo e todos os filhos. Use para apps que spawnam workers. |
| `track_process_name` | `Option<String>` | Mata por nome de processo em vez do exe_path. Use para apps com launcher stub que sai cedo (G Hub: `"lghub.exe"`). |

### Kill cycle (`controller::kill_all_running`)

- Mata apps nos estados `Running` **e** `Crashed` (Squirrel stubs saem cedo e ficam em Crashed)
- Resolve o processo pelo `exe_path` no momento do kill — não pelo PID armazenado no launch
- Prioridade de kill: `track_process_name` > `kill_process_tree` > `kill_by_exe_path`
- `DEFAULT_GRACE_SECS = 5.0` — pode ser zerado com `force_kill_on_stop: true`

### Casos conhecidos de apps especiais

| App | Configuração necessária | Motivo |
|---|---|---|
| OBS 32.x | `force_kill_on_stop: true` | Crash em `~OBSBasicPreview` ao receber WM_CLOSE |
| G Hub | `track_process_name: "lghub.exe"` + `force_kill_on_stop: true` | Launcher stub sai cedo; WM_CLOSE dispara auto-restart |
| Kapps (Squirrel) | nenhum — tratado automaticamente | Stub sai → estado Crashed → kill por exe_path inclui o processo real |

## Notas Windows

- Win32 via `windows` crate: `EnumWindows`, `PostMessageW`, `TerminateProcess`
- Autostart: `tauri-plugin-autostart` (registry `HKCU\...\Run`)
- Icon extraction: PowerShell subprocess → base64 PNG
- Notificações: `tauri-plugin-notification`
- Single instance: `tauri-plugin-single-instance`
- `sysinfo` 0.32: `Process::name()` pode ou não incluir `.exe` — sempre fazer dual-match
