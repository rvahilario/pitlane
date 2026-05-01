# Redesign da Interface - Delivery Tracker

Data: 2026-05-01

Este arquivo guia a implementação incremental do redesign da interface. Ele deve ser atualizado a cada entrega, marcando a checklist e registrando decisões relevantes.

Referências:

- Plano técnico: `docs/TODO/ui-redesign-v0-plan.md`
- Escopo das tabs: `docs/TODO/ui-redesign-tab-scope.md`
- Referência visual: `docs/TODO/ui-redesign-command-center-reference.png`
- Paleta: `docs/TODO/pitlane-aurora-palette-reference.png`

## Issue Principal

**Redesign V0 da interface Pitlane**

Objetivo: substituir a UI atual por uma experiência operacional centrada no Command Center, mantendo as funcionalidades existentes de apps, logs e settings, sem criar controles falsos para features sem backend.

Escopo V0:

- Command Center
- Apps
- Logs
- Settings
- Shell com top bar, sidebar e bottom status bar

Fora do V0:

- Profiles: `Future-0`
- Automation: `Future-1`

Fora de escopo:

- Integrations

## Regras De Entrega

- Cada sub-issue deve ser pequena o bastante para uma PR revisável.
- Nenhuma entrega deve quebrar o fluxo atual de adicionar, editar, deletar, iniciar e parar apps.
- Não criar API Tauri/Rust nova sem uma sub-issue explícita.
- Não mostrar ação funcional na UI se ela não estiver realmente conectada.
- Atualizar i18n em `en.json` e `pt-BR.json` na mesma entrega que introduzir textos novos.
- Ao concluir uma entrega, marcar a linha correspondente e preencher a coluna "Entregue em".

## Checklist De Sub-Issues

| Status | ID | Sub-issue | Entrega esperada | Arquivos/áreas principais | Verificação mínima | Entregue em |
| --- | --- | --- | --- | --- | --- | --- |
| [ ] | UI-00 | Preparar base visual e inventário | Confirmar tokens Aurora, mapear diferenças da referência visual e registrar decisões que não exigem código | `src/index.css`, `docs/TODO/ui-redesign-v0-plan.md` | `npm run format:check` se houver mudança em código | |
| [ ] | UI-01 | Componentes base do redesign | Criar/evoluir `IconButton`, `StatusPill`, `Panel`, `MetricTile`, `Toolbar`, `ActivityRow` sem trocar telas ainda | `src/components/ui`, `src/components/layout` | Testes unitários dos componentes novos; `npm run test` | |
| [ ] | UI-02 | Novo modelo de navegação | Atualizar o tipo de tabs, i18n de navegação e sidebar para `command`, `apps`, `profiles`, `automation`, `logs`, `settings`, sem renderizar telas futuras como funcionais | `Sidebar`, `App.tsx`, i18n | Teste de tabs; confirmar que `Integrations` não aparece | |
| [ ] | UI-03 | App shell V0 | Introduzir `AppShell`, `TopBar` e `BottomStatusBar`, preservando telas existentes dentro do novo layout | `App.tsx`, componentes de shell | Build e screenshot manual/Playwright do shell | |
| [ ] | UI-04 | Command Center estrutural | Criar `CommandCenterScreen` com hero/status, resumo de apps, lista compacta e recent activity usando dados reais | nova screen, hooks existentes, i18n | Teste dos cálculos running/idle/crashed/disabled/ready | |
| [ ] | UI-05 | Ações do Command Center | Conectar start/stop por app, bulk start/stop se implementado via APIs existentes, toggles de auto-launch e auto-stop | `CommandCenterScreen`, `api`, hooks | Mocks de API em testes; fluxo manual com app simples | |
| [ ] | UI-06 | Apps administrativo | Reorganizar `AppsScreen` como biblioteca administrativa, mantendo add/edit/delete/start/stop e modal atual | `AppsScreen`, `AppCard`, `AppFormModal` | Testes existentes de apps continuam passando | |
| [ ] | UI-07 | Modal de app por seções | Refatorar add/edit para Basic, Launch, Recovery e Advanced com colapsáveis, validação e acessibilidade | `AppFormModal`, inputs/layout | Teste add/edit; teclado; erro com `role=alert` | |
| [ ] | UI-08 | Logs V0 | Evoluir `LogScreen` com `ActivityRow`, filtros V0 e labels semânticos de evento | `LogScreen`, `ActivityRow`, i18n | Teste de filtros e renderização de eventos | |
| [ ] | UI-09 | Settings V0 alinhado ao redesign | Ajustar visual de Settings para o novo shell sem mover regras futuras de Automation antes da hora | `SettingsScreen`, componentes base | Testes de settings; fluxo save preservado | |
| [ ] | UI-10 | Placeholders futuros controlados | Se aparecerem na sidebar, `Profiles` e `Automation` devem ser placeholders claros/read-only sem CRUD falso | telas futuras, i18n | Teste de renderização e ausência de ações falsas | |
| [ ] | UI-11 | Acessibilidade e polimento visual | Revisar foco, `aria-current`, `aria-label`, targets 44x44, contraste e responsividade desktop | componentes e telas novas | `npm run test`, Playwright visual, revisão manual teclado | |
| [ ] | UI-12 | Validação final V0 | Rodar suíte completa, atualizar snapshots se necessário, revisar docs e critérios de aceite | projeto inteiro | `npm run format:check`, `npm run build`, `npm run test` | |

## Ordem Recomendada

1. UI-00
2. UI-01
3. UI-02
4. UI-03
5. UI-04
6. UI-05
7. UI-06
8. UI-08
9. UI-09
10. UI-07
11. UI-10
12. UI-11
13. UI-12

Motivo da ordem: primeiro estabilizar tokens, componentes e shell; depois entregar o Command Center; em seguida adaptar telas existentes; por fim refinar modal, placeholders e acessibilidade.

## Critérios De Aceite Da Issue Principal

- Command Center é a tela inicial da experiência V0.
- Apps continua funcional para gerenciar a biblioteca de apps.
- Logs mostra eventos reais com leitura mais diagnóstica.
- Settings continua funcional para preferências gerais.
- Profiles e Automation não prometem funcionalidade sem backend.
- Integrations não aparece em navegação, plano de execução ou UI.
- Todas as strings novas existem em inglês e português.
- Nenhum estado operacional depende apenas de cor.
- `npm run format:check`, `npm run build` e `npm run test` passam.

## Registro De Decisões

| Data | Decisão | Motivo |
| --- | --- | --- |
| 2026-05-01 | `Integrations` fora de escopo | A tab foi marcada como `not intended` e removida do plano. |
| 2026-05-01 | `Profiles` como `Future-0` | Alta prioridade futura, mas sem CRUD/API suficiente para V0. |
| 2026-05-01 | `Automation` como `Future-1` | Deve existir depois de Profiles, usando regras globais sem duplicar Settings. |
