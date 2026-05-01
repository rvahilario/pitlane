# Pitlane — A11Y Audit & Fix Checklist

**Data:** 2026-04-29  
**Padrão:** WCAG 2.2 AA · [A11Y.md](../A11Y.md)  
**Status:** ⚠️ CONDICIONAL — fixes em progresso  
**Referências:** `A11Y.md`, `visual-perception.md`, `examples-buttons.md`, `examples-forms.md`, `examples-modals.md`, `examples-navigation.md`, `examples-content-interaction.md`, `examples-images.md`, `governance.md`

---

## Progresso

| Severidade | Total | Feito |
|---|---|---|
| 🔴 CRITICAL | 1 | 0 |
| 🟠 HIGH | 8 | 3 |
| 🟡 MEDIUM | 8 | 0 |
| 🔵 LOW | 3 | 2 |

---

## 🔴 CRITICAL

- [ ] **C1 · Focus trap ausente nos modais**  
  `AppFormModal.tsx:181` · `ConfirmDialog.tsx:22`  
  Teclado pode sair do modal aberto para o fundo. Inclui: focus trap + Escape key + retorno de foco ao trigger.  
  → Ver também H6 e M8 (mesmo bloco de implementação)

---

## 🟠 HIGH

- [x] **H1 · `text-disabled` em conteúdo legível — 2.05–2.31:1 (necessário 4.5:1)**  
  Substituir `text-text-disabled` → `text-text-muted` em:  
  - [x] `AppFormModal.tsx:62` — hints de campos  
  - [x] `AppFormModal.tsx:134` — hints de CheckRow  
  - [x] `AppFormModal.tsx:267` — label do botão "Advanced"  
  - [x] `AppsScreen.tsx:116` — label de status (PID / Idle / Crashed)  
  - [x] `SettingsScreen.tsx:78` — `trigger_hint`  
  - [x] `SettingsScreen.tsx:136` — hints de `ToggleRow`  
  - [x] `LogScreen.tsx:56` — coluna de timestamp

- [x] **H2 · `SectionDivider` a 10px com `text-disabled` — 2.05:1 (necessário 7:1)**  
  `AppFormModal.tsx:49`  
  Fix aplicado: `text-[10px]` → `text-xs` + `text-text-disabled` → `text-text-muted`

- [x] **H3 · `border-strong` falha 3:1 para bordas de controles interativos**  
  `index.css` — `#3d2d6a` → `#8272b9` (3.23:1 sobre elevated · 3.89:1 sobre surface · 4.37:1 sobre base)  
  `StatusBar.tsx:44` — iRacing offline pill: `border-border` → `border-border-strong`

- [x] **H4 · `zinc-600` hardcoded no toggle de `SettingsScreen` — fora da paleta, falha 3:1**  
  `SettingsScreen.tsx` — substituído por `bg-elevated border border-border-strong` + padrão consistente com `Toggle` de `AppsScreen`

- [ ] **H5 · Modais sem `aria-labelledby` — leitor de tela anuncia "dialog" sem nome**  
  `AppFormModal.tsx:182` e `ConfirmDialog.tsx:23` — adicionar `aria-labelledby="modal-title"` + `id="modal-title"` no `h3`

- [ ] **H6 · Tecla Escape não fecha modais**  
  `AppFormModal.tsx` · `ConfirmDialog.tsx` — listener `keydown → Escape` no mesmo `useEffect` do focus trap (C1)

- [ ] **H7 · Erros de formulário não anunciados ao leitor de tela**  
  `AppFormModal.tsx:298` — adicionar `role="alert"` · `aria-live="assertive"` no `<p>` de erro  
  Adicionar `aria-invalid="true"` em inputs quando há erro

- [ ] **H8 · Aba ativa no Sidebar sem `aria-current` — estado só por cor**  
  `Sidebar.tsx:25` — adicionar `aria-current={active === id ? "page" : undefined}`

---

## 🟡 MEDIUM

- [ ] **M1 · `text-muted` sobre `elevated` = 4.43:1 (abaixo por 0.07)**  
  `AppFormModal.tsx:267` — confirmar background real de renderização; se `elevated`, trocar para `text-text-secondary`

- [ ] **M2 · Targets interativos abaixo de 44×44px**  
  - [ ] `AppsScreen.tsx:142` — botão Editar (~26×26px) → expandir para mín. 44px  
  - [ ] `AppsScreen.tsx:150` — botão Excluir (~26×26px) → expandir  
  - [ ] `AppFormModal.tsx:193` — botão fechar (~22×22px) → expandir  
  - [ ] `HistoryScreen.tsx:56` — botão Limpar (~20×16px) → expandir

- [ ] **M3 · Hints de formulário sem `aria-describedby`**  
  `AppFormModal.tsx:57` — componente `Field`: gerar `id` para o hint e ligar ao input via `aria-describedby`

- [ ] **M4 · Estado do botão autoStop comunicado só por cor**  
  `AppsScreen.tsx:256` — adicionar `aria-pressed` ou `role="switch"` + `aria-checked`; visualmente: ícone ou texto muda com o estado

- [x] **M5 · Log: `iracing_start` e `iracing_stop` com label idêntica "IRACING"**  
  `LogScreen.tsx:14` — labels agora distintas: `"iRACING ▶"` / `"iRACING ■"`

- [ ] **M6 · Botões de ícone usam `title` em vez de `aria-label`**  
  `AppsScreen.tsx:142` (editar) · `AppsScreen.tsx:150` (excluir) — adicionar `aria-label`

- [ ] **M7 · `<nav>` sem `aria-label`**  
  `Sidebar.tsx:23` — adicionar `aria-label="Navegação principal"`

- [ ] **M8 · Foco não retorna ao trigger após fechar modal**  
  `AppFormModal.tsx` · `ConfirmDialog.tsx` — salvar `document.activeElement` antes de abrir; restaurar no `onClose`  
  → Implementar no mesmo bloco de C1

---

## 🔵 LOW

- [x] **L1 · `text-accent/60` para `iracing_stop` — contraste por opacidade (~4.2:1)**  
  `LogScreen.tsx:11` — substituído por `text-accent/75`

- [ ] **L2 · Sem link "Skip to content"**  
  Adicionar `<a href="#main-content">` visível no focus antes do Sidebar

- [ ] **L3 · Sem `eslint-plugin-jsx-a11y` no toolchain**  
  `npm install --save-dev eslint-plugin-jsx-a11y` + configurar no ESLint

---

## O que já está correto

| Item | Local |
|---|---|
| Todos os interativos usam `<button>` nativo | Global |
| `StatusIndicator` tem `aria-label` nos ícones | `AppsScreen.tsx:18,23,27` |
| `Toggle` usa `role="switch"` + `aria-checked` | `AppsScreen.tsx:63` |
| `ToggleRow` usa `role="switch"` + `aria-checked` | `SettingsScreen.tsx:139` |
| Formulário usa `<label htmlFor>` + `id` | `AppFormModal.tsx:209,213` |
| Botão fechar tem `aria-label` | `AppFormModal.tsx:196` · `ConfirmDialog.tsx:34` |
| `text` (#f0eeff) sobre `base`: 15.8:1 | `index.css` |
| `text-muted` (#9d8cc0) sobre `base`: 6.0:1 | `index.css` |
| `text-muted` sobre `surface`: 5.3:1 | `index.css` |
| Sem `div`/`span` com `onClick` | Global |
