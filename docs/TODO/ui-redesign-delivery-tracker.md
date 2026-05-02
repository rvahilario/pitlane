# Redesign da Interface - Delivery Tracker

Data: 2026-05-01

Este arquivo guia a implementação incremental do redesign da interface. Ele deve ser atualizado a cada entrega, marcando a checklist e registrando decisões relevantes.

Referências:

- Plano técnico: `docs/TODO/ui-redesign-v0-plan.md`
- Estratégia de styling: `docs/TODO/ui-redesign-styling-strategy.md`
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
| [x] | UI-00 | Preparar base visual e inventário | Confirmar tokens Aurora, mapear diferenças da referência visual e registrar decisões que não exigem código | `src/index.css`, `docs/TODO/ui-redesign-v0-plan.md` | `npm run format:check` se houver mudança em código | 2026-05-01 |
| [x] | UI-00B | Definir estratégia de styling do redesign | Reduzir verbosidade do Tailwind com regras de encapsulamento, `cva` e classes semânticas pontuais antes dos componentes base | `src/components/ui`, `src/components/layout`, `src/index.css`, docs do redesign | Revisão do padrão documentado; `npm run format:check` se houver mudança em código | 2026-05-01 |
| [x] | UI-01 | Componentes base do redesign | Criar/evoluir `IconButton`, `StatusPill`, `Panel`, `MetricTile`, `Toolbar`, `ActivityRow` sem trocar telas ainda | `src/components/ui`, `src/components/layout` | Testes unitários dos componentes novos; `npm run test` | 2026-05-01 |
| [x] | UI-02 | Novo modelo de navegação | Centralizar o modelo de tabs e deixar o runtime V0 apenas com `command`, `apps`, `logs`, `settings`; `profiles` e `automation` ficam somente no roadmap futuro | `Sidebar`, `App.tsx`, i18n | Teste de tabs; confirmar que tabs futuras e `Integrations` não aparecem | 2026-05-01 |
| [x] | UI-03 | App shell V0 | Introduzir `AppShell`, `TopBar` e `BottomStatusBar`, preservando telas existentes dentro do novo layout | `App.tsx`, componentes de shell | Build e screenshot manual/Playwright do shell | 2026-05-01 |
| [x] | UI-04 | Command Center estrutural | Criar `CommandCenterScreen` com hero/status, resumo de apps, lista compacta e recent activity usando dados reais | nova screen, hooks existentes, i18n | Teste dos cálculos running/idle/crashed/disabled/ready | 2026-05-01 |
| [x] | UI-04B | Remover versão de apps | Remover placeholder `v--` e manter a identidade do app baseada em nome e ícone, sem criar campo ou extração de versão no backend | `AppCommandRow`, testes de UI, docs do redesign | `npm run test -- AppCommandRow` | 2026-05-02 |
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
2. UI-00B
3. UI-01
4. UI-02
5. UI-03
6. UI-04
7. UI-04B
8. UI-05
9. UI-06
10. UI-08
11. UI-09
12. UI-07
13. UI-10
14. UI-11
15. UI-12

Motivo da ordem: primeiro estabilizar tokens e padrão de styling, depois criar componentes e shell; em seguida entregar o Command Center; depois adaptar telas existentes; por fim refinar modal, placeholders e acessibilidade.

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
| 2026-05-01 | Aurora tokens já batem com a referência | `src/index.css` já contém as rampas e tokens semânticos da paleta `pitlane-aurora-palette-reference.png`; UI-00 não exige alteração de CSS. |
| 2026-05-01 | Styling do redesign deve reduzir Tailwind verboso sem trocar stack | Manter Tailwind v4, mas concentrar classes longas em componentes base, usar `cva` para variantes e permitir classes semânticas pontuais apenas para padrões estruturais repetidos. |
| 2026-05-01 | Componentes base criados antes da troca de telas | `IconButton`, `StatusPill`, `Panel`, `MetricTile`, `Toolbar`, `ActivityRow` e `AppCommandRow` foram adicionados sem integrar telas existentes. |
| 2026-05-01 | Navegação V0 atualizada sem `Integrations` | Runtime V0 usa apenas `command`, `apps`, `logs`, `settings` via constants centralizadas; `profiles` e `automation` permanecem somente no roadmap futuro. |
| 2026-05-01 | App shell V0 separado das telas | `AppShell`, `TopBar` e `BottomStatusBar` concentram layout, perfil ativo e status operacional sem alterar as telas existentes. |
| 2026-05-01 | Command Center estrutural com ações por app já conectadas | Per-app start/stop e toggles foram conectados em UI-04 em vez de UI-05; bulk start/stop permanece em UI-05. `computeAppSummary` e `computeReadiness` exportadas como funções puras para teste isolado. |
| 2026-05-02 | `AppCommandRow` migrado para CSS subgrid | Cada row era um grid independente; tracks `auto` resolviam por row, causando desalinhamento de colunas. Solução: parent grid em `ApplicationsPanel` + `grid-cols-subgrid` nos rows. Layout final: `[auto 1fr auto auto]` — identity auto, status absorve espaço livre, toggles+actions content-sized à direita. |
| 2026-05-02 | Tamanho de ícones centralizado em Button/IconButton | `[&_svg]` por variante de size elimina `h-*/w-*` nos call sites e garante consistência global. |
| 2026-05-02 | Versão de apps fora do V0 | `ManagedApp` não possui `version` e extrair versão de executáveis adicionaria custo e complexidade sem valor claro para o Command Center; UI-04B remove o placeholder `v--` em vez de criar suporte backend. |
