# Pitlane — Especificação de Interface (UI/UX)

> Documento de referência para design e implementação da interface do Pitlane.
> Este material define estrutura, componentes, fluxos e diretrizes visuais, mantendo abertura para iteração.

---

# 1. Visão geral

## O que é o Pitlane

Pitlane é um gerenciador de ciclo de vida para aplicações de sim racing que:

- Detecta quando o iRacing inicia
- Inicia automaticamente apps configurados
- Monitora execução (incluindo crashes)
- Encerra tudo quando o iRacing fecha

## Princípios de UX

- **Clareza > estética**
- **Status em tempo real é prioridade**
- **Interações rápidas e diretas**
- **Baixa carga cognitiva**
- **Uso episódico (configuração, não operação contínua)**

---

# 2. Estrutura da interface

## Layout principal

```
┌──────────────────────────────────────────────┐
│ PITLANE          🌐 Language   ● iRacing ON  │
├───────────────┬──────────────────────────────┤
│ Sidebar       │ Content                      │
│               │                              │
│ Apps          │                              │
│ Profiles      │                              │
│ Settings      │                              │
│ Logs          │                              │
└───────────────┴──────────────────────────────┘
```

## Componentes fixos

- Sidebar de navegação
- Área de conteúdo dinâmica
- Indicador global de status (iRacing)
- Seletor de idioma (i18n)

---

# 3. Navegação

## Sidebar

Itens:

- Apps
- Profiles
- Settings
- Logs

### Regras

- Item ativo destacado
- Labels sempre visíveis (não apenas ícones)
- Largura flexível (suporte a i18n)

---

# 4. Tela: Apps (principal)

## Objetivo

Gerenciar apps e visualizar estado em tempo real.

---

## Estrutura do card (definitiva)

```
┌──────────────────────────────────────────────┐
│ [icon] SimHub   ● Running        Stop Edit 🗑 │
│ Auto-start with iRacing   [ ON ]              │
└──────────────────────────────────────────────┘
```

---

## Elementos

### Linha 1

- Ícone do app
- Nome
- Status (Running / Idle / Crashed)
- Ações rápidas

### Linha 2

- Configuração: Auto-start (toggle)

---

## Status

| Estado  | Representação |
| ------- | ------------- |
| Running | ● verde       |
| Idle    | ○ neutro      |
| Crashed | ⚠ amarelo     |

---

## Ações

### Visíveis

- Start (quando Idle)
- Stop (quando Running)
- Edit
- Delete (ícone)

### Regras

- Start/Stop são **contextuais (mutuamente exclusivos)**
- Delete sempre pede confirmação
- Edit abre modal

---

## Auto-start

```
Auto-start with iRacing   [ ON ]
```

### Comportamento

- ON → participa do ciclo automático
- OFF → ignorado pelo sistema automático

---

## Interações

- Hover → revela mais contraste nas ações
- Clique no card → opcional (edição rápida futura)
- Drag-and-drop → reorder (handle opcional)

---

## Estado vazio

```
No apps configured yet

[ Add your first app ]
```

---

# 5. Modal: Add / Edit App

## Estrutura

### Seções

1. Básico
2. Startup
3. Crash behavior
4. Advanced (colapsável)

---

## Layout

```
Name
[________________]

Executable Path
[______________] [Browse]

[✓] Enabled

---

Startup

[✓] Start minimized
Delay [ 0 ]

Arguments
[______________]

Working directory
[__________]

---

Crash

[ ] Restart on crash
Max retries [ 3 ]

---

▶ Advanced

---

[Cancel] [Save]
```

---

## Regras

- Labels sempre acima dos inputs
- Inputs full width
- Advanced colapsado por padrão
- Validação inline

---

# 6. Tela: Profiles

## Estrutura

```
┌──────────────────────────────┐
│ Racing (ACTIVE)              │
│ Color: ■                     │
│ Mode: Race                   │
│ [ON] Edit Duplicate Delete   │
└──────────────────────────────┘
```

---

## Funcionalidades

- Criar perfil
- Editar
- Duplicar
- Ativar
- Remover

---

## Regras

- Apenas 1 perfil ativo
- Mudança de perfil é imediata
- Pode exigir confirmação (futuro)

---

# 7. Tela: Settings

## Estrutura

```
Language
[ English ▾ ]

Polling interval
[ 2.0 ]

Trigger mode
( ) UI
( ) Race

[✓] Notifications
[ ] Start with Windows
```

---

## i18n

- Mudança de idioma em tempo real
- Persistência local
- Feedback visual (toast opcional)

---

# 8. Tela: Logs

## Estrutura

```
[10:32:14] iRacing detected — starting apps
[10:32:14] SimHub started
```

---

## Regras

- Fonte monoespaçada
- Scroll automático opcional
- Tradução parcial (não técnica)

---

# 9. System Tray

## Estados

| Estado  | Representação |
| ------- | ------------- |
| Idle    | neutro        |
| Running | destaque      |
| Error   | alerta        |

---

## Menu

```
Show Pitlane

Profile:
  Racing
  Streaming

Quit
```

---

# 10. Fluxos principais

## Primeiro uso

1. Abrir app
2. Adicionar apps
3. Fechar janela (vai para tray)

---

## Execução

1. iRacing inicia
2. Apps são iniciados
3. Monitoramento ativo
4. iRacing fecha
5. Apps encerrados

---

## Edição

1. Abrir app via tray
2. Alterar config
3. Fechar janela

---

# 11. i18n (internacionalização)

## Regras

- Nunca depender de largura fixa
- Labels sempre acima
- Strings podem crescer 30–40%
- Evitar abreviações ambíguas

---

## Exemplos

| EN                 | PT-BR               |
| ------------------ | ------------------- |
| Start              | Iniciar             |
| Stop               | Parar               |
| Settings           | Configurações       |
| Start with iRacing | Iniciar com iRacing |

---

# 12. Paleta de cores

## Base

| Token    | Hex     |
| -------- | ------- |
| Canvas   | #0a0618 |
| Base     | #1a0f36 |
| Surface  | #251848 |
| Elevated | #352460 |

---

## Texto

| Token     | Hex     |
| --------- | ------- |
| Primary   | #f0eeff |
| Secondary | #c4b8e0 |
| Muted     | #9d8cc0 |
| Disabled  | #5a4880 |

---

## Acentos

| Token  | Hex     |
| ------ | ------- |
| Accent | #6ec4c0 |
| Hover  | #58b0ac |

---

## Status

| Estado  | Cor     |
| ------- | ------- |
| Running | #34d399 |
| Warning | #fbbf24 |
| Error   | #f87171 |

---

## Diretrizes

- WCAG AA mínimo
- Alto contraste obrigatório
- Evitar tons “zinc” (cinza neutro)
- Preferir roxo + teal como base

---

# 13. Diretrizes de interação

## Botões

- Primário: ação principal
- Secundário: neutro
- Destrutivo: vermelho

---

## Feedback

- Loading imediato
- Estado visual claro
- Evitar ações silenciosas

---

## Hover

- Aumentar contraste
- Mostrar affordance

---

# 14. Espaçamento e densidade

- Cards compactos (2 linhas)
- Espaçamento consistente (8px grid)
- Evitar layouts “arejados demais”

---

# 15. Abertura para melhorias

Este documento é base inicial e pode evoluir em:

- Modo compacto vs confortável
- Agrupamento de apps
- Filtros e busca
- Métricas (tempo rodando, histórico)
- Melhor feedback de crash
- UI do system tray mais rica
- Onboarding inicial

---

# 16. Resumo

Pitlane UI deve ser:

- Rápido de escanear
- Funcional
- Sem ambiguidade
- Compacto
- Focado em status e controle

---

**Fim do documento**
