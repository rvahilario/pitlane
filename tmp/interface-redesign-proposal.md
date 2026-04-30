# Pitlane - Proposta de Reformulacao Da Interface

Data: 2026-04-30

Escopo: proposta de produto e UX. Nenhuma implementacao foi feita.

## Objetivo

Transformar o Pitlane em uma interface mais operacional e previsivel para gerenciamento de apps associados ao iRacing. A tela principal deve funcionar como um painel de controle: status primeiro, lista de apps em seguida, configuracao detalhada apenas quando necessaria.

## Problemas Atuais

- Acoes principais e estados usam estilos parecidos, entao "Start", "Add", "iRacing online" e selecao visual competem pela mesma cor.
- Cards de apps sao compactos, mas misturam identidade, status, acoes e toggles no mesmo peso visual.
- O modal de app e longo e tecnico; campos avancados aparecem dentro do mesmo fluxo de cadastro basico.
- Settings e Apps usam padroes parecidos, mas nao exatamente iguais para toggles, botoes e agrupamentos.
- Log e History parecem telas secundarias cruas, sem filtros, resumo ou leitura por severidade/evento.
- Acessibilidade esta sendo tratada como troca de classes, quando deveria entrar nos padroes de componente.

## Arquitetura Recomendada

Manter as quatro secoes, mas mudar a hierarquia:

1. Apps: painel operacional principal.
2. Sessions: substituir ou evoluir History para historico de sessoes com resumo.
3. Activity: evoluir Log para feed filtravel.
4. Settings: configuracoes globais, mais enxutas.

Se quiser manter os nomes atuais por enquanto, a mesma estrutura pode ser aplicada sem mudar rotas.

## Layout Principal

### Shell

- Header fixo com logo, status do iRacing, apps gerenciados ativos e seletor de idioma.
- Sidebar com largura um pouco menor ou modo icon+label, usando `aria-current`.
- Conteudo principal com header de tela padronizado: titulo, descricao curta e acoes.
- Evitar cards dentro de cards. Usar lista densa para apps e paineis apenas para agrupamentos reais.

### Header Operacional

No topo da tela Apps, adicionar uma faixa compacta com:

- estado iRacing: Offline, Open, Racing;
- apps rodando: contador;
- auto-stop global: switch com texto explicito;
- perfil ativo: seletor ou link de configuracao.

Isso tira informacao critica dos cards individuais e reduz repeticao.

## Tela Apps

### Lista Recomendada

Cada app deve ser uma linha/card operacional com tres zonas:

| Zona | Conteudo | Observacao |
|---|---|---|
| Identidade | avatar pequeno, nome, caminho/processo truncado | texto principal sempre legivel |
| Estado | Running/Idle/Crashed/Disabled, PID quando existir | usar icone + label, nao so cor |
| Acoes | Start/Stop, Edit, Delete, toggles | botoes com area clicavel 44x44 |

### Estados De Card

- Running: rail lateral ou badge `success`, botao principal vira Stop.
- Idle: neutro, botao principal Start.
- Crashed: badge `warning`, acao secundaria "Restart" pode aparecer no futuro.
- Disabled: nao reduzir opacidade do card inteiro; mostrar badge "Disabled" e reduzir apenas controles indisponiveis.

### Acoes

- `Add app`: botao primario preenchido.
- `Start`: botao secundario semantico success, nao precisa ser preenchido.
- `Stop`: botao danger, com icone Square.
- `Edit/Delete`: icon buttons com tooltip e `aria-label`.
- Auto-start e Auto-stop por app: switches alinhados e com labels proximos.

## Modal Add/Edit App

Transformar o modal em formulario por secoes, mas com densidade controlada:

1. Basic
   - Name
   - Executable path
   - Enabled
   - Stop with iRacing

2. Launch
   - Startup delay
   - Arguments
   - Working directory

3. Recovery
   - Restart on crash
   - Max restart attempts

4. Advanced
   - Track process name
   - Force kill
   - Kill process tree

Recomendacoes:

- Manter Basic aberto por padrao.
- Launch aberto por padrao apenas em edit ou quando houver valores preenchidos.
- Recovery e Advanced colapsados.
- Erros com `role="alert"` e campo com `aria-invalid`.
- `aria-describedby` para hints.
- Focus trap, Escape e retorno de foco ao trigger como requisito de componente modal.

## Settings

Separar settings em dois grupos visuais:

- Monitoring: poll interval, default trigger.
- System: autostart, notifications, language.

Melhorias:

- Usar stepper/input compacto para intervalo, com unidade visivel `seconds`.
- Trigger mode deve ser segmented control com `aria-pressed` ou radio group.
- Botao Save deve indicar estado dirty/saved; hoje ele existe mesmo quando nada mudou.
- Switches devem usar o mesmo componente visual da tela Apps.

## Activity Log

O log deve ser uma ferramenta de diagnostico, nao apenas uma lista mono.

Proposta:

- filtros por tipo: App, iRacing, Errors, All;
- chips de evento com largura fixa: LAUNCH, STOP, iRACING ON, iRACING OFF;
- timestamp em `text-muted`, mensagem em `text-secondary`;
- eventos de iRacing com icone diferente para start/stop;
- opcao futura: copiar log ou limpar visualmente.

Evitar depender de simbolos soltos como unico diferencial. O ideal e label textual distinto, por exemplo `IRACING ON` e `IRACING OFF`.

## History / Sessions

History deve virar Sessions:

- cards ou tabela compacta por sessao;
- duracao, horario de inicio, apps lancados;
- estado se houve erro;
- acao para expandir detalhes da sessao.

Enquanto for mockado, visualmente deve deixar claro que e historico de sessoes, nao apenas lista estatica.

## Componentes Base A Criar Antes De Refatorar

Antes de mexer tela por tela, recomendo padronizar estes componentes:

- `Button`: variants `primary`, `secondary`, `ghost`, `danger`, `icon`.
- `Switch`: tamanho unico, estados on/off/disabled, labels externos.
- `StatusPill`: variants `online`, `offline`, `running`, `idle`, `crashed`.
- `PanelHeader`: titulo, descricao e slot de acoes.
- `Modal`: focus trap, Escape, `aria-labelledby`, retorno de foco.
- `Field`: label, hint, erro, `aria-describedby`, `aria-invalid`.
- `IconButton`: area minima, tooltip, `aria-label`.

Essa abordagem evita repetir a mesma decisao de contraste em cada tela.

## Fluxo Do Usuario

### Primeiro uso

1. Abre o Pitlane.
2. Ve status do iRacing no header.
3. Clica em `Add app`.
4. Preenche nome e executavel.
5. Mantem `Enabled` e `Stop with iRacing` como defaults.
6. Salva.
7. App aparece na lista com estado Idle e acao Start.

### Uso durante corrida

1. iRacing abre e o status muda para Open/Racing.
2. Apps configurados iniciam ou ficam disponiveis.
3. Usuario ve contador de apps rodando no topo.
4. Se algo falhar, o card mostra Crashed com alerta e o log registra o evento.
5. Ao encerrar iRacing, auto-stop global e por app deixam claro o que sera parado.

### Manutencao

1. Usuario entra em Settings para ajustar trigger ou intervalo.
2. Mudancas ficam locais ate salvar.
3. Feedback de salvo aparece sem bloquear a tela.

## Plano De Implementacao Sugerido

1. Introduzir tokens novos em uma branch separada, sem alterar layout.
2. Criar componentes base acessiveis.
3. Trocar AppsScreen para usar os componentes e nova hierarquia de card.
4. Refatorar Modal usando `Modal` e `Field`.
5. Padronizar Settings.
6. Melhorar Log e History/Sessions.
7. Rodar auditoria A11Y novamente e comparar com `docs/A11Y-REPORT.md`.

## Criterios De Aceite

- Todas as combinacoes de texto real passam WCAG AA 4.5:1.
- Bordas de controles interativos passam 3:1 contra o fundo adjacente.
- Nenhum estado operacional depende apenas de cor.
- Todos os botoes de icone tem `aria-label`.
- Modal prende foco, fecha com Escape e devolve foco ao elemento que abriu.
- Alvos interativos principais tem 44x44 ou area clicavel equivalente.
- Fluxo de adicionar app pode ser concluido sem mouse.

## Prompts Para Mockups Com GPT Image 2

Estes prompts podem ser usados para gerar imagens de referencia visual. Eles nao devem ser tratados como especificacao final de CSS.

### Mockup 1 - Apps Dashboard

```text
Use case: ui-mockup
Asset type: desktop app UI concept
Primary request: high fidelity mockup of Pitlane, a dark desktop control panel for managing companion apps for iRacing.
Scene/backdrop: single desktop app window, no marketing content.
Subject: Apps dashboard with top status bar, left sidebar, operational summary strip, and dense app list.
Style/medium: polished product UI mockup, pragmatic utility software, compact spacing.
Composition/framing: 16:10 landscape, full app window, first screen only.
Color palette: deep purple dark surfaces, aqua primary accent, green running status, amber warning, red danger.
Text (verbatim): "Pitlane", "Apps", "iRacing Offline", "Auto-stop", "Add app", "SimHub", "CrewChief", "Running", "Idle", "Start", "Stop".
Constraints: accessible contrast, no decorative gradients, no oversized hero, no cards inside cards, no unreadable tiny text, no fake browser chrome.
Avoid: purple-dominant palette, marketing landing page, blurred background, stock photo.
```

### Mockup 2 - Add App Modal

```text
Use case: ui-mockup
Asset type: desktop app modal UI concept
Primary request: high fidelity modal mockup for adding an app in Pitlane.
Scene/backdrop: dark app UI dimmed behind a centered modal.
Subject: structured form with sections Basic, Launch, Recovery, Advanced; accessible fields and switches.
Style/medium: polished product UI mockup, compact and readable.
Composition/framing: modal centered, enough background visible to understand context.
Color palette: deep purple surfaces, aqua focus and primary save button, neutral borders, red inline error style.
Text (verbatim): "Add app", "Name", "Executable path", "Enabled", "Stop with iRacing", "Startup delay", "Arguments", "Cancel", "Save".
Constraints: clear focus states, readable hints, 44px close button, no cramped overlapping text.
Avoid: form wizard, colorful gradients, oversized rounded cards.
```

### Mockup 3 - Activity And Sessions

```text
Use case: ui-mockup
Asset type: desktop app UI concept
Primary request: high fidelity mockup showing Pitlane Activity log and Sessions history patterns.
Scene/backdrop: dark desktop utility app.
Subject: split view concept with event filter tabs, mono activity feed, and compact session rows.
Style/medium: operational diagnostics UI, readable and dense.
Composition/framing: 16:10 landscape app window with sidebar.
Color palette: deep purple dark surfaces, aqua info accents, green success, amber warning, red danger.
Text (verbatim): "Activity", "All", "Apps", "iRacing", "Errors", "IRACING ON", "LAUNCH", "STOP", "Sessions", "Duration", "Apps launched".
Constraints: accessible contrast, event type indicated by label and icon, no color-only state.
Avoid: terminal-only screen, neon cyberpunk style, decorative charts.
```
