# Pitlane — Levantamento de Requisitos de Interface

> **Contexto:** O backend e a lógica do app já estão implementados. Este documento descreve as telas, fluxos e informações que a interface precisa cobrir para que um designer possa propor um layout visual. A implementação frontend seguirá o design aprovado.

---

## O que é o Pitlane

Pitlane é um gerenciador de ciclo de vida de aplicativos para sim racers. Ele monitora o processo do **iRacing** e, quando detecta que o simulador foi aberto, lança automaticamente os apps companheiros configurados (SimHub, OBS, CrewChief, etc.). Quando o iRacing fecha, ele encerra todos esses apps.

O app roda **minimizado na bandeja do sistema (system tray)**. A janela principal é aberta apenas para configuração — não precisa ficar visível enquanto o usuário está correndo.

---

## Stack técnica

| Camada       | Tecnologia                  |
| ------------ | --------------------------- |
| Backend      | Rust (Tauri v2)             |
| Frontend     | React 19 + TypeScript       |
| UI atual     | shadcn/ui + Tailwind CSS v4 |
| Plataforma   | Windows exclusivo           |
| Distribuição | Executável + system tray    |

A interface comunica com o backend via chamadas IPC (invoke/events). Não há servidor — tudo é local.

---

## Paleta de cores atual

O app usa dark theme exclusivo com paleta roxa escura + accent teal-aqua:

| Token           | Variável CSS             | Hex       | Uso                                     |
| --------------- | ------------------------ | --------- | --------------------------------------- |
| Canvas          | `--color-canvas`         | `#0a0618` | Header, overlays — roxo quase preto     |
| Base            | `--color-base`           | `#1a0f36` | Fundo principal — roxo escuro           |
| Surface         | `--color-surface`        | `#251848` | Cards, painéis                          |
| Elevated        | `--color-elevated`       | `#352460` | Hover, itens elevados                   |
| Border          | `--color-border`         | `#2a1850` | Bordas padrão                           |
| Border strong   | `--color-border-strong`  | `#3d2d6a` | Bordas com mais destaque                |
| Text            | `--color-text`           | `#f0eeff` | Texto principal (15.8:1 sobre base)     |
| Text secondary  | `--color-text-secondary` | `#c4b8e0` | Lavanda — textos de suporte             |
| Text muted      | `--color-text-muted`     | `#9d8cc0` | Textos terciários (6:1 sobre base)      |
| Text disabled   | `--color-text-disabled`  | `#5a4880` | Elementos desabilitados                 |
| Accent          | `--color-accent`         | `#6ec4c0` | Teal-aqua — botões primários, destaques |
| Accent hover    | `--color-accent-hover`   | `#58b0ac` | Estado hover do accent                  |
| Sucesso/Online  | `--color-success`        | `#34d399` | Status "Rodando"                        |
| Warning/Crashed | `--color-warning`        | `#fbbf24` | Status "Crashed"                        |
| Danger          | `--color-danger`         | `#f87171` | Erros, ações destrutivas                |

**Estamos abertos a evoluções nessa paleta.** O único requisito é manter dark theme e respeitar critérios mínimos de contraste WCAG AA (4.5:1 para texto normal, 3:1 para texto grande e elementos gráficos). Os tokens de texto já foram validados contra os fundos — favor preservar essas proporções em qualquer revisão.
ps.: gostaria de me livrar dos tons de zinc.

---

## Estrutura geral da janela

A janela principal tem **uso episódico** — o usuário abre para configurar, depois minimiza. O fluxo principal acontece invisível em background.

Estrutura sugerida:

- **Barra lateral ou tabs de navegação** com as seções principais
- **Área de conteúdo** que muda conforme a seção ativa
- **Indicador de status global** (iRacing online/offline) sempre visível

### Seções da janela

1. **Apps** — lista e gerenciamento dos apps monitorados
2. **Perfis** — organização de conjuntos de apps por contexto
3. **Configurações** — opções globais do Pitlane
4. **Log** _(secundário)_ — visualização de eventos recentes

---

## Seção: Apps

### O que exibir

Lista dos apps configurados no perfil ativo. Cada app mostra:

| Campo         | Descrição                                                                           |
| ------------- | ----------------------------------------------------------------------------------- |
| Ícone         | Ícone extraído automaticamente do `.exe` configurado                                |
| Nome          | Nome definido pelo usuário (ex: "SimHub", "OBS")                                    |
| Status        | Idle / Rodando / Crashed — com indicador visual                                     |
| PID           | Número do processo quando rodando (visível no tooltip ou inline, pode ser ignorado) |
| Habilitado    | Toggle rápido para incluir/excluir do ciclo automático                              |
| Ações rápidas | Botão "Forçar iniciar" e "Forçar encerrar"                                          |

### Estados de status

- **Idle** — app não está rodando (neutro, discreto)
- **Rodando** — app está ativo (verde, destaque positivo)
- **Crashed** — o processo encerrou inesperadamente (laranja/amarelo, atenção)

O status é atualizado em tempo real via eventos do backend (polling a cada ~0.8s).

### Ícones dos apps

O ícone de cada app é extraído automaticamente do `.exe` configurado (via PowerShell → base64 PNG). Caso a extração falhe, exibir um ícone genérico de fallback.

O ícone aparece na lista e pode ser reaproveitado no system tray como indicação do que está rodando.

### Ações da lista

- **Adicionar app** — abre formulário de cadastro
- **Editar app** — clique no item ou ícone de edição
- **Remover app** — com confirmação
- **Reordenar** — drag-and-drop (ordem influencia a sequência de inicialização)

---

## Seção: Formulário de app (add/edit)

Este é o formulário mais rico do app. Campos organizados por relevância:

### Campos essenciais

| Campo                 | Tipo                | Descrição                         |
| --------------------- | ------------------- | --------------------------------- |
| Nome                  | Texto               | Nome de exibição do app           |
| Caminho do executável | Texto + file picker | Caminho completo para o `.exe`    |
| Habilitado            | Toggle              | Inclui/exclui do ciclo automático |

### Comportamento de inicialização

| Campo                          | Tipo                  | Padrão  | Descrição                                    |
| ------------------------------ | --------------------- | ------- | -------------------------------------------- |
| Iniciar minimizado             | Toggle                | Ativado | Abre o app minimizado na barra de tarefas    |
| Delay de inicialização         | Número (segundos)     | 0       | Aguarda N segundos antes de iniciar este app |
| Argumentos de linha de comando | Texto                 | —       | Args opcionais passados ao executável        |
| Diretório de trabalho          | Texto + folder picker | —       | Working directory para o processo            |

### Comportamento em crash

| Campo                | Tipo   | Padrão     | Descrição                                        |
| -------------------- | ------ | ---------- | ------------------------------------------------ |
| Reiniciar em crash   | Toggle | Desativado | Relança o app se ele encerrar inesperadamente    |
| Máximo de tentativas | Número | 3          | Limite de reinicios antes de marcar como Crashed |

### Comportamento de encerramento

| Campo                     | Tipo   | Padrão     | Descrição                                                                                        |
| ------------------------- | ------ | ---------- | ------------------------------------------------------------------------------------------------ |
| Forçar encerramento       | Toggle | Desativado | Usa TerminateProcess em vez de fechar pela janela (para apps com shutdown problemático, ex: OBS) |
| Matar árvore de processos | Toggle | Desativado | Encerra também os processos filhos spawned pelo app (ex: G Hub)                                  |
| Nome do processo real     | Texto  | —          | Para apps com launcher stub (ex: Squirrel): nome do `.exe` do processo real a ser encerrado      |

> Os três últimos campos são avançados e podem ficar em seção colapsável "Configurações avançadas".

---

## Seção: Perfis

Perfis permitem ter conjuntos de apps diferentes para contextos diferentes (ex: "Corrida online", "Treino solo", "Streaming").

### O que exibir

- Lista de perfis existentes
- Indicação de qual é o perfil ativo
- Botão para criar novo perfil

### Por perfil

| Campo           | Tipo         | Descrição                                   |
| --------------- | ------------ | ------------------------------------------- |
| Nome            | Texto        | Nome do perfil                              |
| Cor             | Color picker | Cor de identificação visual                 |
| Modo de trigger | Seleção      | Herda global / Somente UI / Somente corrida |
| Habilitado      | Toggle       | Ativa/desativa o perfil inteiro             |

### Fluxo de troca de perfil

- Trocar o perfil ativo é uma ação imediata
- Se o iRacing estiver rodando no momento da troca, pode ser necessário confirmar (não implementado ainda — decisão de design/UX)

---

## Seção: Configurações globais

| Campo                  | Tipo              | Padrão     | Descrição                                                                                                              |
| ---------------------- | ----------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| Intervalo de polling   | Número (segundos) | 2.0        | Frequência de verificação do processo iRacing                                                                          |
| Modo de trigger padrão | Seleção           | UI         | **UI:** abre/fecha pelo Pitlane. **Race:** só inicia quando entra na sessão de corrida (hookeia na memória do iRacing) |
| Notificações           | Toggle            | Ativado    | Notificações do sistema ao iniciar/encerrar apps                                                                       |
| Iniciar com Windows    | Toggle            | Desativado | Registra no autostart do Windows                                                                                       |

---

## Seção: Log

Exibição de eventos recentes para diagnóstico. Exemplos de eventos:

- `[10:32:14] iRacing detectado — iniciando apps`
- `[10:32:14] SimHub iniciado (PID 12345)`
- `[10:32:14] OBS iniciado (PID 67890)`
- `[10:47:03] iRacing encerrado — finalizando apps`
- `[10:47:04] OBS encerrado`
- `[10:47:09] SimHub encerrado`
- `[10:47:09] Kapps — crash detectado, reiniciando (1/3)`

Esta seção é secundária — útil para debug, não para uso cotidiano.

---

## System tray

O app vive no system tray. O ícone deve comunicar o estado atual:

| Estado                       | Ícone                                |
| ---------------------------- | ------------------------------------ |
| iRacing offline, apps idle   | Ícone padrão (neutro)                |
| iRacing online, apps rodando | Ícone com destaque (verde ou accent) |
| Algum app em crash           | Ícone com alerta                     |

Menu de contexto ao clicar com botão direito:

- **Mostrar Pitlane** — abre/foca a janela
- **Perfil ativo:** `[nome]` _(informativo ou com submenu de troca rápida)_
- **Sair**

Clique simples (botão esquerdo) → abre a janela.

---

## Indicador global de status iRacing

Sempre visível na interface (sugestão: rodapé ou cabeçalho da janela).

| Estado  | O que mostrar                           |
| ------- | --------------------------------------- |
| Online  | Ponto verde + "iRacing online"          |
| Offline | Ponto cinza/apagado + "iRacing offline" |

---

## Fluxo de uso típico

```
1. Usuário instala o Pitlane e abre pela primeira vez
   → Janela de configuração abre

2. Usuário cadastra os apps que quer gerenciar
   → Formulário de add app para cada um

3. Usuário fecha a janela
   → App vai para o system tray

4. Usuário abre o iRacing
   → Pitlane detecta (em até 2s pelo padrão)
   → Todos os apps habilitados no perfil ativo são iniciados automaticamente
   → Notificação do sistema (se habilitado)

5. Usuário corre normalmente
   → Apps ficam rodando, watchdog monitora crashes e reinicia se configurado

6. Usuário fecha o iRacing
   → Pitlane detecta
   → Todos os apps são encerrados automaticamente
   → Notificação do sistema (se habilitado)

7. Usuário quer ajustar configuração
   → Clica no ícone do tray → "Mostrar Pitlane"
   → Faz ajustes → fecha a janela novamente
```

---

## Notas para o designer

- A janela de configuração **não precisa ser grande** — o app não é usado enquanto o usuário está correndo
- Priorizamos **clareza sobre riqueza visual** — o usuário precisa entender rapidamente o que está rodando e o que não está
- O **status dos apps em tempo real** é a informação mais valiosa na tela principal
- Formulários de configuração são usados raramente — podem ser mais densos
- Dark theme é **obrigatório** — o app é usado em ambientes com pouca luz (setup de simulador)
- Considere **acessibilidade de contraste**: WCAG AA mínimo (4.5:1 texto normal, 3:1 texto grande/UI)
- O app é **Windows-only** — pode assumir métricas e padrões visuais do Windows 11
