# Pitlane

> Gerenciador de ciclo de vida de apps para iRacing — leve, automático, sem estresse.

Pitlane detecta quando o iRacing abre ou fecha e cuida de tudo: lança seus apps companheiros na ordem certa, reinicia em caso de crash e encerra tudo limpo ao fim da sessão.

Feito para quem usa SimHub, CrewChief, VoiceAttack, Kapps, OBS e similares — sem precisar abrir e fechar cada um na mão toda vez que for correr.

---

## Funcionalidades

- **Auto-launch** — inicia seus apps automaticamente quando o iRacing abre
- **Auto-stop** — encerra todos os apps ao fechar o iRacing (toggle por sessão)
- **Watchdog** — detecta crash e reinicia o app automaticamente até um limite configurável
- **Kill inteligente** — suporte a `force kill`, `kill process tree` e rastreamento por nome de processo (para launchers stub como G Hub)
- **Log de eventos** — histórico em tempo real de lançamentos, paradas e eventos do iRacing
- **Múltiplos perfis** — organize apps por perfil (ex: treino vs. corrida)
- **Iniciar com o Windows** — optionally registra no startup registry
- **Bandeja do sistema** — roda em background, janela abre sob demanda
- **Instância única** — segunda tentativa de abrir traz a janela ao foco
- **Interface em pt-BR e English**

---

## Stack

| Camada | Tecnologia |
|---|---|
| Frontend | React 19 + TypeScript + Vite |
| UI | Tailwind CSS v4 · dark theme exclusivo |
| Backend | Rust · Tauri v2 |
| IPC | Tauri Commands (`invoke`) + Events (`emit/listen`) |
| Config | JSON em `%LOCALAPPDATA%\Pitlane\config.json` |

**Por que Tauri?** O iGnition (predecessor em Python + pywebview) consumia ~150–300 MB idle. Pitlane fica em ~15–30 MB — o WebView2 só é instanciado quando a janela de configurações é aberta.

---

## Instalação

Baixe o instalador mais recente na [página de releases](https://github.com/rvahilario/pitlane/releases):

| Arquivo | Descrição |
|---|---|
| `Pitlane_x.y.z_x64-setup.exe` | NSIS installer **(recomendado)** |
| `Pitlane_x.y.z_x64_en-US.msi` | MSI |

Requisitos: **Windows 10/11 x64**, WebView2 Runtime (incluso no Windows 11).

---

## Desenvolvimento

**Pré-requisitos:** Node.js 20+, Rust stable (`x86_64-pc-windows-msvc`), MSVC Build Tools 2022.

```bash
# Clonar e instalar dependências
git clone https://github.com/rvahilario/pitlane.git
cd pitlane
npm install

# Dev completo — Rust + React com hot reload
npm run tauri dev

# Só frontend (sem compilar Rust — ideal para iterar UI)
npm run dev

# Testes
npm run test          # frontend (Vitest)
npm run rust:test     # backend (cargo test)

# Build de produção local
powershell -ExecutionPolicy Bypass -File scripts/build-release.ps1
# → src-tauri/target/release/bundle/nsis/   (NSIS .exe)
# → src-tauri/target/release/bundle/msi/    (.msi)
```

### Testar sem abrir o iRacing

```powershell
powershell -ExecutionPolicy Bypass -File scripts/fake-iracing.ps1
```

Simula o iRacing abrindo e fechando — útil para testar o ciclo completo sem o simulador.

---

## Roadmap

- [ ] **Drag-and-drop** para reordenar apps na lista
- [ ] **Profile management UI** — criar, renomear, trocar perfis, atribuir cor
- [ ] **App icon extraction** — exibir ícone do `.exe` no card
- [ ] **`start_minimized`** — lançar apps minimizados na taskbar (desativado até resolver issue de spawn)

---

## Licença

[GPL v3](./LICENSE)
