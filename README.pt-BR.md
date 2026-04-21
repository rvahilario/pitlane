# 🏁 Pitlane

> **O copiloto invisível do seu setup no iRacing.**
> Automático, leve e sem fricção.

Pitlane cuida de todo o ciclo de vida dos seus apps enquanto você foca no que importa: **correr**.

Ele detecta quando o iRacing abre ou fecha e orquestra tudo nos bastidores — inicia, monitora, reinicia se necessário e encerra com limpeza total ao final da sessão.

Perfeito para quem usa **SimHub, CrewChief, VoiceAttack, Kapps, OBS** e outros companions.

---

## ✨ Destaques

- 🚀 **Auto-launch inteligente**
  Seus apps iniciam automaticamente junto com o iRacing — na ordem certa.

- 🛑 **Auto-stop configurável**
  Encerra tudo ao sair do iRacing (com toggle por sessão).

- 🧠 **Watchdog resiliente**
  Detecta crashes e reinicia apps automaticamente (com limite configurável).

- ⚙️ **Gerenciamento avançado de processos**
  `force kill`, `kill process tree` e tracking por nome (ideal para launchers como G Hub).

- 📜 **Log em tempo real**
  Acompanhe tudo: launches, stops, eventos do iRacing.

- 🔁 **Startup com Windows**
  Inicialização automática (opcional).

- 🧩 **System tray-first**
  Roda em background — interface sob demanda.

- 🔒 **Instância única**
  Evita duplicação e traz a janela ao foco.

- 🌍 **Multilíngue**
  🇧🇷 Português · 🇺🇸 English

---

## 🧱 Stack

| Camada      | Tecnologia                                         |
| ----------- | -------------------------------------------------- |
| 🎨 Frontend | React 19 · TypeScript · Vite                       |
| 💅 UI       | Tailwind CSS v4 · Dark Theme exclusivo             |
| ⚙️ Backend  | Rust · Tauri v2                                    |
| 🔌 IPC      | Tauri Commands (`invoke`) + Events (`emit/listen`) |
| 💾 Config   | JSON em `%LOCALAPPDATA%\Pitlane\config.json`       |

### 💡 Por que Tauri?

O **iGnition** (predecessor em Python + pywebview) consumia ~150–300MB idle.
O Pitlane opera em **~15–30MB**, instanciando o WebView2 apenas quando necessário.

---

## 📦 Instalação

Baixe a versão mais recente na página de releases:
👉 [https://github.com/rvahilario/pitlane/releases](https://github.com/rvahilario/pitlane/releases)

| Arquivo                          | Descrição                        |
| -------------------------------- | -------------------------------- |
| 🟢 `Pitlane_x.y.z_x64-setup.exe` | NSIS installer (**recomendado**) |
| ⚪ `Pitlane_x.y.z_x64_en-US.msi` | MSI                              |

**Requisitos:**

- Windows 10/11 x64
- WebView2 Runtime _(já incluso no Windows 11)_

---

## 🛠️ Desenvolvimento

**Pré-requisitos:**

- Node.js 20+
- Rust (stable `x86_64-pc-windows-msvc`)
- MSVC Build Tools 2022

```bash
# Clone e setup
git clone https://github.com/rvahilario/pitlane.git
cd pitlane
npm install

# Ambiente completo (Rust + React)
npm run tauri dev

# Apenas frontend (iterações rápidas de UI)
npm run dev

# Testes
npm run test
npm run rust:test

# Build de produção
powershell -ExecutionPolicy Bypass -File scripts/build-release.ps1
```

**Saídas:**

```
src-tauri/target/release/bundle/nsis/   → .exe
src-tauri/target/release/bundle/msi/    → .msi
```

### 🧪 Testar sem abrir o iRacing

```powershell
powershell -ExecutionPolicy Bypass -File scripts/fake-iracing.ps1
```

Simula o ciclo completo de abertura/fechamento — ideal para desenvolvimento rápido.

---

## 🗺️ Roadmap

- 🎛️ UI de gerenciamento de perfis
- 🖼️ Extração de ícones dos executáveis
- 💤 `start_minimized` (aguardando ajuste de spawn)
- 🖱️ Drag-and-drop para ordenação de apps

---

## 📄 Licença

Distribuído sob a **GPL v3**.
Veja mais em [`LICENSE`](./LICENSE).
