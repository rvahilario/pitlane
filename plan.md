# Pitlane — Plano de Implementação

Abordagem: uma camada por vez, testável visualmente em `npm run tauri dev` antes de commitar.
Cada camada termina com commits Conventional Commits agrupados por domínio.

**Relação com o iGnition:** referência de funcionalidades, não de implementação. Pitlane tem liberdade total de schema, UX e decisões de design.

---

## Estado atual (última atualização: 2026-04-18)

| Camada | Estado | Observação |
|---|---|---|
| 0 — Scaffold | ✅ Done | |
| 1 — UI Shell | ✅ Done | Dark theme, layout, status bar, i18n |
| 2 — models + config + commands | 🔄 Implementado, aguardando teste | Código escrito; `npm run tauri dev` para validar |
| 3 — monitor.rs | ⬜ Próxima | |
| 4 — launcher + process_killer | ⬜ | |
| 5 — controller | ⬜ | |
| 6 — watchdog | ⬜ | |
| 7 — CRUD completo | ⬜ | |
| 8 — Tray + Single Instance | ⬜ | |
| 9 — Autostart + Import/Export | ⬜ | |
| 10 — Build | ⬜ | |

**Para retomar:** rode `npm run tauri dev` para testar a Camada 2 (settings persistindo em `%LOCALAPPDATA%\Pitlane\config.json`). Se passar, commite e inicie a Camada 3.

**Nota de ambiente:** `cargo test` requer Developer Command Prompt do VS (Git's `link.exe` shadowing MSVC no PATH padrão).

---

## Camada 0 — Ambiente funcional ✅ (scaffold)

**Objetivo:** `npm run tauri dev` abre janela com scaffold Tauri padrão.

**Estado atual:** scaffold gerado, Cargo.toml com dependências básicas, `lib.rs` com `greet` command de exemplo.

**Commit de referência:**
```
chore(scaffold): initialize Tauri v2 + React + TypeScript project
```

---

## Camada 1 — UI Shell (dark theme + layout) ✅

**Objetivo:** janela com o visual final do app — dark theme, paleta zinc, accent vermelho — mas com dados mockados. Sem Rust novo ainda.

**O que fazer:**
1. Instalar Tailwind CSS v4 + shadcn/ui
2. Criar layout principal: sidebar/abas (Apps, Log, Histórico, Configurações)
3. Implementar paleta: `zinc-900` bg, `zinc-800` cards, accent `#E8002D`
4. Status bar no topo: indicador iRacing (offline/online), contagem de apps gerenciados
5. Dados 100% mockados (sem `invoke()` ainda)

**Como testar:** `npm run dev` (só frontend, sem Rust)

**Commits:**
```
chore(ui): install Tailwind CSS v4 and shadcn/ui
feat(ui): dark shell layout with sidebar and tab navigation
feat(ui): status bar with mocked iRacing indicator
```

---

## Camada 2 — models.rs + config.rs (persistência) 🔄

**Objetivo:** app lê e salva `config.json` real; frontend exibe perfis e apps vindos do Rust.

**O que fazer (Rust):**
1. `models.rs`: structs `ManagedApp`, `Profile`, `AppConfig` com serde — schema compatível com iGnition
2. `config.rs`: load de `%LOCALAPPDATA%\Pitlane\config.json`, save atômico (write temp → rename), recovery de corrupção (backup + defaults)
3. `commands.rs` (parcial): `get_profiles`, `get_apps`, `get_settings`, `save_settings`
4. `lib/api.ts`: wrappers tipados para os commands acima

**O que fazer (Frontend):**
1. Substituir dados mockados de perfis/apps por `invoke()` real
2. Tela de Configurações: poll_interval, trigger_mode, notification_mode
3. Tela de Apps: listar apps do perfil ativo (sem ações de launch/kill ainda)

**Como testar:** `npm run tauri dev` → criar config, reiniciar, verificar persistência

**Testes Rust:** serialização round-trip, recovery de JSON corrompido

**Commits:**
```
feat(models): ManagedApp, Profile, AppConfig structs with serde
feat(config): atomic JSON load/save with corruption recovery
feat(commands): get_profiles, get_apps, get_settings, save_settings
feat(ui/settings): settings page wired to Rust commands
feat(ui/apps): app list from active profile via invoke
```

---

## Camada 3 — monitor.rs (detecção do iRacing)

**Objetivo:** status bar mostra iRacing online/offline em tempo real.

**O que fazer (Rust):**
1. `monitor.rs`: thread com `sysinfo` que policia `iRacingSim64DX11.exe` / `iRacingUI.exe`
2. Thread `status-emit`: `app.emit("status-updated", payload)` a cada 0.8 s
3. `commands.rs`: `get_status` command
4. Inicializar monitor em `lib.rs`

**O que fazer (Frontend):**
1. `hooks/useStatus.ts`: escuta evento `status-updated`
2. Status bar atualiza em tempo real (iRacing running/stopped, session type)

**Como testar:** `npm run tauri dev` → abrir/fechar iRacingUI.exe ou simular com outro processo

**Testes Rust:** mock de lista de processos, verificar callbacks disparados

**Commits:**
```
feat(monitor): iRacing process detection thread with sysinfo
feat(monitor): status-updated event emitted every 800ms
feat(ui/status): real-time iRacing status via listen hook
```

---

## Camada 4 — launcher.rs + process_killer.rs (launch e kill manual)

**Objetivo:** botões "Iniciar" e "Parar" em cada app funcionam.

**O que fazer (Rust):**
1. `launcher.rs`: spawn de processo com `STARTUPINFO` (start_minimized via SW_SHOWMINNOACTIVE), `wait_for_process`, `start_if_already_running`
2. `process_killer.rs`: WM_CLOSE via `EnumWindows`/`SendMessageTimeoutW` → grace period → `TerminateProcess`; `kill_process_tree`; `kill_by_exe_path`; `kill_by_process_name`
3. `commands.rs`: `start_app`, `stop_app`, `test_launch_app`
4. `status-emit` passa a incluir `running_app_ids`

**O que fazer (Frontend):**
1. Botões Start/Stop por app (habilitados só quando iRacing running, desabilitados caso contrário para launch automático; sempre visíveis para teste manual)
2. Badge de "rodando" em cada app card
3. Command `test_launch_app` para botão de teste fora de sessão

**Como testar:** `npm run tauri dev` → adicionar um app simples (ex: Notepad), iniciar/parar manualmente

**Testes Rust:** spawn de `cmd.exe`, verificar PID, verificar kill

**Commits:**
```
feat(launcher): spawn external process with STARTUPINFO minimized support
feat(launcher): wait_for_process with configurable timeout
feat(process-killer): WM_CLOSE grace period then TerminateProcess
feat(process-killer): kill_process_tree and kill_by_exe_path
feat(commands): start_app, stop_app, test_launch_app
feat(ui/apps): start/stop buttons wired to commands
```

---

## Camada 5 — controller.rs (orquestrador automático)

**Objetivo:** quando iRacing inicia, apps do perfil são lançados automaticamente; quando fecha, são encerrados.

**O que fazer (Rust):**
1. `controller.rs`: orquestrador que conecta monitor → launcher → killer
   - `on_iracing_started`: lança apps habilitados (com delays), inicia watchdog
   - `on_iracing_stopped`: para watchdog, encerra todos managed apps, salva session history
   - `_running: HashMap<AppId, RunningApp>` protegido por `Mutex`
   - Log de eventos (200 entries, ring buffer)
   - Session history (50 entries, persistido em JSON)
2. `commands.rs`: `set_monitoring_paused`, `get_log_since`, `clear_log`, `get_session_history`

**O que fazer (Frontend):**
1. `hooks/useLog.ts`: poll `get_log_since(seq)` a cada 1 s, exibe log em tempo real
2. Tela de Log: entradas coloridas por tipo (launch=verde, stop=laranja, error=vermelho)
3. Tela de Histórico: sessões anteriores com duração e apps lançados
4. Botão pause/resume no status bar

**Como testar:** `npm run tauri dev` → iniciar iRacingUI.exe → verificar apps lançando automaticamente

**Commits:**
```
feat(controller): orchestrator connecting monitor, launcher and killer
feat(controller): session history persistence (50 entries)
feat(controller): event log ring buffer (200 entries)
feat(commands): pause/resume monitoring, get_log_since, session_history
feat(ui/log): real-time event log with color-coded entries
feat(ui/history): session history screen
```

---

## Camada 6 — watchdog.rs (crash detection + auto-restart)

**Objetivo:** se um app crasha durante sessão, é reiniciado automaticamente (até o limite).

**O que fazer (Rust):**
1. `watchdog.rs`: thread que policia PIDs a cada 2 s, detecta processo morto, dispara restart via controller se `restart_on_crash = true`
2. Integração com controller: `_restart_counts`, `_dead_tracked_apps`
3. Log de eventos para crash e restart

**Como testar:** `npm run tauri dev` → lançar app, matar o processo externamente no Task Manager, verificar restart

**Testes Rust:** simular processo morto, verificar restart count, verificar respeito ao max_restart_attempts

**Commits:**
```
feat(watchdog): crash detection thread polling every 2s
feat(watchdog): auto-restart with max_restart_attempts limit
feat(controller): integrate watchdog into session lifecycle
```

---

## Camada 7 — CRUD completo de Apps e Perfis

**Objetivo:** usuário consegue criar, editar, reordenar e remover apps e perfis pela UI.

**O que fazer (Rust):**
- `commands.rs`: `add_app`, `edit_app`, `remove_app`, `reorder_apps`, `toggle_app_enabled`, `undo_remove_app`
- `commands.rs`: `add_profile`, `remove_profile`, `duplicate_profile`, `rename_profile`, `set_active_profile`, `toggle_profile_enabled`, `set_profile_color`, `set_profile_triggers`, `set_profile_trigger_mode`

**O que fazer (Frontend):**
1. Modal de criação/edição de app (formulário completo com todos os campos de ManagedApp)
2. Drag-and-drop para reordenar apps (ou botões ↑↓)
3. Gerenciamento de perfis (sidebar ou modal)
4. `get_common_apps`: sugestão de apps instalados detectados
5. `get_app_icon`: ícone do .exe via PowerShell (base64 PNG)

**Commits:**
```
feat(commands): full app CRUD (add, edit, remove, reorder, toggle)
feat(commands): full profile CRUD (add, remove, duplicate, rename)
feat(commands): get_common_apps and get_app_icon detection
feat(ui/apps): app edit modal with all ManagedApp fields
feat(ui/profiles): profile management panel
feat(ui/apps): drag-and-drop reorder
```

---

## Camada 8 — Tray + Single Instance + Janela Lazy

**Objetivo:** app vive no system tray, janela só existe quando usuário pede, instância única.

**O que fazer (Rust):**
1. `main.rs`/`lib.rs`: system tray com ícone e menu dinâmico de perfis
2. Janela lazy: `WebviewWindowBuilder` criado só no primeiro "Open" do tray
3. Fechar janela → hide (não quit)
4. `tauri-plugin-single-instance`: bloquear segunda instância, focar janela existente
5. `commands.rs`: `quit_app`, `open_config_folder`

**O que fazer (Frontend):**
1. Botão "Fechar para bandeja" no header
2. Menu do tray mostra perfil ativo e status iRacing

**Commits:**
```
feat(tray): system tray with dynamic profile menu
feat(tray): lazy window creation on first open
feat(tray): hide window on close instead of quit
chore(single-instance): prevent duplicate app instances
```

---

## Camada 9 — Autostart + Import/Export + Polimentos

**Objetivo:** funcionalidades finais antes do build.

**O que fazer:**
1. Autostart: `tauri-plugin-autostart` → `get_autostart_enabled`, `set_autostart`
2. Import/Export de config: `export_config`, `import_config`
3. Launch iRacing: `launch_iracing` (via Steam ou exe direto)
4. Browse de arquivo/pasta: `browse_exe`, `browse_directory`
5. Toast notifications ao iniciar sessão (`tauri-plugin-notification`)
6. Animações suaves, estados de loading, empty states

**Commits:**
```
feat(autostart): Windows registry autostart via tauri-plugin-autostart
feat(commands): import and export config JSON
feat(commands): launch_iracing via Steam or direct exe
feat(ui): file/directory browse dialogs
feat(notifications): toast on session start
```

---

## Camada 10 — Build & Distribuição

**Objetivo:** instalador `.msi` ou NSIS funcional.

```
chore(build): configure tauri bundle for Windows installer
chore(build): set app icons and metadata
```

---

## Regras do processo

- **Nunca commitar uma camada incompleta** — toda camada deve ser testável end-to-end antes do commit
- **`cargo test` e `npm run test` devem passar** antes de qualquer commit
- **Um commit por domínio** — não misturar mudanças de `monitor` com `ui/apps` no mesmo commit
- **Conventional Commits** obrigatório: `feat|fix|refactor|test|chore(escopo): mensagem`
