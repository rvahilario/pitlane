# Workflow Claude - Redesign V0

Este arquivo documenta o fluxo usado nas issues do redesign para que a implementação possa continuar no Claude quando necessário.

## Contexto Atual

- Projeto: Pitlane, Tauri v2 + React.
- Tracker principal: `docs/TODO/ui-redesign-delivery-tracker.md`.
- Plano técnico: `docs/TODO/ui-redesign-v0-plan.md`.
- Escopo de tabs: `docs/TODO/ui-redesign-tab-scope.md`.
- Estratégia de styling: `docs/TODO/ui-redesign-styling-strategy.md`.
- Issue principal: `#22 Redesign V0 da interface Pitlane`.

## Ordem Das Issues

Siga a ordem do tracker:

1. UI-00: inventário visual.
2. UI-00B: estratégia de styling.
3. UI-01: componentes base.
4. UI-02: modelo de navegação.
5. UI-03: app shell.
6. UI-04 em diante: seguir `ui-redesign-delivery-tracker.md`.

Antes de começar uma issue:

- Leia a descrição da issue no GitHub.
- Leia a linha correspondente no tracker.
- Confirme se a issue anterior já foi mergeada.
- Se a issue anterior ainda estiver aberta, crie branch empilhada a partir dela.
- Se a issue anterior já foi mergeada, crie branch a partir de `main` atualizado.

## Branches E PRs

Padrão de branch:

```bash
ui-<numero>-<slug-curto>
```

Exemplos:

- `ui-02-navigation-model`
- `ui-03-app-shell`
- `ui-04-command-center`

Fluxo:

1. Verificar estado local:

```bash
git status --short
git branch --show-current
```

2. Atualizar a base correta:

```bash
git switch main
git pull
```

3. Criar branch:

```bash
git switch -c ui-XX-slug
```

4. Implementar a issue com escopo pequeno.
5. Rodar validação.
6. Comitar somente depois de validação passar.
7. Fazer push.
8. Abrir PR.

Se a PR for empilhada, usar `--base <branch-anterior>`. Se a branch anterior já foi mergeada, usar `--base main`.

## Commits

Seguir o padrão do `CLAUDE.md` da raiz:

```text
<tipo>(<escopo>): <mensagem em inglês, imperativo>
```

Exemplos usados no redesign:

```text
feat(ui): add app shell layout
feat(ui): use pitlane app icon
refactor(ui): centralize navigation tabs
test(ui): remove future tab assertions
docs(ui): complete styling strategy
```

Regras:

- Um commit por mudança lógica.
- Subject em inglês.
- Subject com até 72 caracteres.
- Não misturar implementação, cleanup grande e teste não relacionado no mesmo commit.
- Só commitar quando solicitado ou quando o fluxo explicitamente pedir commit/PR.

## PRs

Criar PR com `gh`:

```bash
gh pr create --base main --head ui-XX-slug --title "UI-XX: Titulo" --body "..."
```

Body mínimo:

```markdown
## Summary
- ...

## Verification
- npm run format:check
- npm run build
- npm run test
- npm run test:e2e

Closes #NN
```

Para PR empilhada:

```bash
gh pr create --base ui-XX-branch-anterior --head ui-YY-branch-atual ...
```

Antes de abrir PR, verificar se a base remota existe:

```bash
git ls-remote --heads origin main ui-XX-branch-anterior
```

## Validação

Validação padrão para mudanças de UI:

```bash
npm run format:check
npm run build
npm run test
```

Quando a issue altera shell, navegação ou fluxo visual:

```bash
npm run test:e2e
```

Quando houver screenshot manual/Playwright:

- Salvar fora do repo, preferencialmente em `E:\tmp`.
- Não commitar screenshots temporários.
- Encerrar qualquer Vite/dev server iniciado manualmente.

## Escopo V0 Das Tabs

Runtime V0 deve conter apenas:

- `command`
- `apps`
- `logs`
- `settings`

`profiles` e `automation` são roadmap futuro:

- `Profiles`: `Future-0`
- `Automation`: `Future-1`

`Integrations` é `not intended` e não deve aparecer no plano, runtime, testes ou UI.

Evitar testes que mencionem `profiles` e `automation` na UI V0. A ausência delas deve ser garantida pelo modelo centralizado de tabs, não por assertions negativas acopladas a nomes futuros.

## Constants E Barrels

Tabs ficam centralizadas em:

```text
src/components/navigation.ts
```

Use:

- `TAB_IDS`
- `DEFAULT_TAB`
- `NAV_ITEMS`
- `type Tab`

Evitar magic strings para tabs fora da definição central.

Barrels devem ficar organizados em ordem alfabética humana. Ao adicionar componente/hook:

- `src/components/index.ts`
- `src/components/ui/index.ts`
- `src/components/layout/index.ts`
- `src/components/screens/index.ts`
- `src/hooks/index.ts`

Dentro do mesmo diretório, preferir import relativo para evitar ciclo via barrel.

## Styling

Objetivo do redesign: reduzir Tailwind verboso sem trocar stack.

Regras:

- Manter Tailwind v4.
- Encapsular classes longas em componentes base.
- Usar `cva` para variantes de componentes.
- Usar classes semânticas pontuais apenas para padrões estruturais repetidos.
- Não criar abstração se ela não reduzir complexidade real.
- Seguir tokens de `src/index.css`.
- UI continua dark-only.

## Assets E Ícones

Ícone Pitlane:

- Master: `src/assets/pitlane-icon-source.png`.
- Uso no frontend: `src/assets/pitlane-icon.png`.
- Ícones Tauri gerados em `src-tauri/icons`.

Não importar o master 1024px no frontend. Ele aumenta o bundle sem necessidade.

Para regenerar ícones:

```bash
npm run tauri -- icon src/assets/pitlane-icon-source.png
```

Depois, remover diretórios mobile se forem gerados e não forem usados:

```bash
Remove-Item -LiteralPath 'src-tauri/icons/android' -Recurse -Force
Remove-Item -LiteralPath 'src-tauri/icons/ios' -Recurse -Force
```

Manter apenas os assets referenciados por `src-tauri/tauri.conf.json` e os Appx logos já presentes.

## Atualização Do Tracker

Ao concluir uma issue:

1. Marcar a linha como `[x]`.
2. Preencher `Entregue em` com a data.
3. Adicionar decisão relevante em `Registro De Decisões`.

Arquivo:

```text
docs/TODO/ui-redesign-delivery-tracker.md
```

Evitar reformatar a tabela inteira sem necessidade. Fazer diff pequeno e focado.

## Cuidados Com Arquivos

- Não reverter mudanças do usuário.
- Verificar `git status --short` antes de editar e antes de commitar.
- Evitar churn de formatação em JSON/Markdown.
- Se Prettier formatar arquivos grandes sem necessidade, reduzir o diff antes do commit.
- Não commitar assets temporários em `E:\tmp`.

## Checklist Antes De Finalizar Uma Issue

- Escopo bate com a issue.
- Tabs futuras não entraram no runtime.
- `Integrations` não apareceu.
- Barrels atualizados e ordenados.
- i18n atualizado em `en.json` e `pt-BR.json` quando houver texto novo.
- Testes relevantes adicionados ou ajustados.
- `npm run format:check` passou.
- `npm run build` passou.
- `npm run test` passou.
- `npm run test:e2e` passou quando shell/navegação for afetado.
- Tracker atualizado.
- Commit no padrão Conventional Commits.
- PR aberto e linkado com `Closes #NN`.
