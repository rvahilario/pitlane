# Pitlane - Proposta de Paleta Acessivel

Data: 2026-04-30

Escopo: proposta visual. Nenhuma mudanca de codigo foi aplicada.

## Diagnostico

A correcao atual melhora pontos objetivos de contraste, mas preserva o problema de base: a interface depende demais de uma escala roxa escura e resolve estados com opacidade. Isso cria tres efeitos indesejados:

- bordas precisam ficar muito claras para passar 3:1, parecendo mais "neon" do que estrutura;
- textos auxiliares ficam sempre no limite entre conteudo legivel e texto desabilitado;
- estados operacionais, como rodando, parado, iRacing aberto e erro, competem com a cor primaria.

A proposta abaixo refaz a escala roxa desde a base, usando tons menos saturados e com contraste calculado contra `surface` e `elevated`. O aqua fica reservado para acao primaria, foco e estado iRacing ativo. Feedback operacional passa a usar cores semanticas separadas.

## Direcao Recomendada

Nome: Pitlane Aurora

Intencao: uma interface de cockpit/utility, escura, densa e operacional, mantendo a identidade roxa atual com aqua como acento principal. A cor deve ajudar o usuario a responder tres perguntas rapidamente:

- o iRacing esta ativo?
- quais apps estao rodando, parados ou com erro?
- qual e a proxima acao segura?

## Tokens Propostos

```css
@theme {
  /* Superficies */
  --color-canvas:   #090714; /* chrome externo, header, overlays profundos */
  --color-base:     #120b24; /* fundo principal */
  --color-surface:  #1b1233; /* paineis, cards, listas */
  --color-elevated: #251a43; /* hover, inputs, menus, itens ativos sutis */

  /* Bordas */
  --color-border:        #33264f; /* separadores e bordas passivas */
  --color-border-strong: #7c6dab; /* controles interativos, 3:1+ */

  /* Texto */
  --color-text:           #f4f0ff; /* conteudo principal */
  --color-text-secondary: #d1c5f2; /* labels, descricoes importantes */
  --color-text-muted:     #a999d3; /* metadados e hints legiveis */
  --color-text-disabled:  #6f618f; /* apenas desabilitado/decorativo */

  /* Acao primaria e foco */
  --color-accent:       #4dd9d0;
  --color-accent-hover: #7ae7e0;
  --color-focus:        #7ae7e0;
  --color-on-accent:    #061412;

  /* Status */
  --color-success: #47d18c;
  --color-warning: #f2c94c;
  --color-danger:  #ff7373;
  --color-info:    #8bb8ff;

  /* Texto sobre status preenchido */
  --color-on-success: #08120d;
  --color-on-warning: #171104;
  --color-on-danger:  #170607;
  --color-on-info:    #06101b;
}
```

## Contraste Esperado

Medicoes calculadas contra as quatro superficies principais.

| Token | canvas | base | surface | elevated | Uso |
|---|---:|---:|---:|---:|---|
| text `#f4f0ff` | 17.83 | 17.06 | 15.88 | 14.34 | texto principal |
| text-secondary `#d1c5f2` | 12.34 | 11.81 | 10.99 | 9.93 | labels e apoio |
| text-muted `#a999d3` | 7.78 | 7.45 | 6.93 | 6.26 | hints e metadados legiveis |
| text-disabled `#6f618f` | 3.60 | 3.44 | 3.20 | 2.89 | desabilitado, nao conteudo |
| accent `#4dd9d0` | 11.55 | 11.06 | 10.29 | 9.29 | acao/foco/status ativo |
| success `#47d18c` | 10.23 | 9.80 | 9.12 | 8.23 | app rodando/sucesso |
| warning `#f2c94c` | 12.58 | 12.04 | 11.21 | 10.12 | pausa/alerta |
| danger `#ff7373` | 7.56 | 7.24 | 6.73 | 6.08 | erro/parar/excluir |
| info `#8bb8ff` | 9.88 | 9.46 | 8.80 | 7.95 | informacao secundaria |
| border-strong `#7c6dab` | 5.03 | 4.82 | 3.92 | 3.54 | borda de controle |

Regra: `text-disabled` nao deve aparecer em conteudo que precisa ser lido. Para vazio, hint, timestamp, PID, descricao de setting e label de toggle, usar no minimo `text-muted`.

## Aplicacao Por Elemento

| Elemento | Fundo | Texto | Borda | Estado |
|---|---|---|---|---|
| App shell | `canvas` | `text` | `border` | header e chrome fixos |
| Main content | `base` | `text` | n/a | area de trabalho |
| Sidebar | `canvas` ou `base` | `text-muted` | `border` | item ativo com `accent` |
| Header da tela | transparente/base | `text` + `text-muted` | `border` | titulo e resumo |
| Card de app | `surface` | `text` | `border` | hover: `elevated` |
| Card ativo/rodando | `surface` | `text` | `success` ou left rail success | sem depender so da cor |
| Input | `elevated` | `text` | `border-strong` | foco: `focus` + ring |
| Select/menu | `elevated` | `text` | `border-strong` | item ativo: `accent` |
| Botao primario | `accent` | `on-accent` | transparente | hover: `accent-hover` |
| Botao secundario | transparente | `text-secondary` | `border-strong` | hover: `elevated` |
| Botao destrutivo | `danger` ou `danger/15` | `on-danger` ou `danger` | `danger` | nunca usar apenas vermelho opaco |
| Toggle ligado | `accent` | n/a | `accent` | thumb `on-accent` ou canvas |
| Toggle desligado | `elevated` | n/a | `border-strong` | thumb `text-muted` |
| Modal | `surface` | `text` | `border-strong` | overlay `canvas/75` |
| Log | `base` | mono `text-muted` | n/a | labels semanticos por chip/texto |

## Estados Semanticos

| Estado | Cor | Forma visual obrigatoria |
|---|---|---|
| iRacing online | `accent` | pill com icone/ponto preenchido e texto "iRacing open/racing" |
| iRacing offline | `text-muted` | pill neutra com ponto vazado ou icon diferente |
| App running | `success` | indicador + botao Stop disponivel + label Running |
| App idle | `text-muted` | indicador neutro + label Idle |
| App crashed | `warning` | icone alerta + label Crashed |
| Delete/Stop destrutivo | `danger` | icone Square/Trash + texto; nao depender so da cor |
| Disabled app | opacidade leve + badge "Disabled" | manter texto legivel, evitar `opacity-50` no card inteiro |

## Ajustes Recomendados Nos Tokens Atuais

1. Substituir a escala roxa de superficie atual por `Pitlane Aurora`.
2. Manter `text-disabled` apenas para thumb de toggle desligado, placeholder decorativo e icones sem significado.
3. Trocar botoes primarios de `bg-accent/15 text-accent` por botao preenchido `bg-accent text-on-accent` quando a acao for principal.
4. Evitar usar `accent` para avatar, status iRacing, botao primario, log e selecionado ao mesmo tempo. Avatares devem usar uma escala propria e menos competitiva.
5. Definir `focus` separado de `accent` para que foco de teclado nao seja confundido com selecao.

## Alternativas Consideradas

### Manter roxo e corrigir contraste

Vantagem: menor mudanca visual. Problema: `border-strong` precisa ficar claro demais, e a interface continua monocromatica. E a alternativa mais barata, mas nao resolve a direcao visual.

### Azul cockpit

Vantagem: combina com telemetria/simulador. Problema: tende a virar uma UI slate/azul generica e pode competir com iRacing/status. Nao recomendo como base.

### Purple + aqua recalculado

Vantagem: melhora contraste, preserva a identidade roxa+aqua, separa status de estrutura e reduz dependencia de opacidade. Recomendada.

## Checklist Para Validar Antes De Implementar

- `border-strong` precisa passar 3:1 sobre `surface` e `elevated`.
- `text-muted` precisa passar 4.5:1 sobre `surface` e `elevated`.
- Nenhum texto real deve usar `text-disabled`.
- Botoes de icone precisam ter area minima de 44x44 ou area clicavel equivalente.
- Estados ativos precisam ter texto, icone ou posicao, nao apenas cor.
- Focus ring deve ser visivel em todos os controles sobre `surface` e `elevated`.
