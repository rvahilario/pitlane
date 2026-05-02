Sim, dá para pensar o sidebar como uma separação entre **uso operacional** e **configuração mais detalhada**.

## Command Center

É a tela principal, para abrir antes ou durante a sessão e bater o olho rápido.

Conteúdo:

- Estado geral: `Ready for session`, `Needs attention`, `iRacing not detected`
- Status do iRacing
- Perfil ativo
- Resumo de apps: `3 / 4 ready`, `2 running`, `1 crashed`, `1 idle`
- Lista compacta dos apps com status, auto-launch, auto-stop e ação rápida
- Recent Activity

Funcionalidades:

- Start/Stop/Restart de apps
- Start all / Stop all
- Alternar Auto-launch e Auto-stop rapidamente
- Abrir configuração rápida de um app ao clicar na linha
- Trocar perfil ativo
- Ver o que acabou de acontecer

Essa é a tela de “posso correr agora?”.

---

## Apps

Tela de gerenciamento da biblioteca de apps cadastrados.

Conteúdo:

- Lista completa de apps
- Nome, caminho do executável, argumentos, working directory
- Status cadastral: ativo/desativado
- Configurações individuais de execução
- Regras de start/stop por app
- Ícone do app
- Histórico recente daquele app, talvez em um painel lateral

Funcionalidades:

- Adicionar app
- Editar app
- Remover app
- Testar execução
- Definir caminho do executável
- Configurar argumentos de inicialização
- Configurar se entra no Command Center
- Configurar Auto-launch e Auto-stop
- Definir método de encerramento, se aplicável
- Reordenar apps, caso exista ordem de startup

Essa tela é mais administrativa. O Command Center mostra o que importa agora, enquanto Apps permite configurar com calma.

---

## Profiles

Tela para criar diferentes conjuntos de apps e regras.

Conteúdo:

- Lista de perfis
- Perfil padrão
- Apps incluídos em cada perfil
- Configurações específicas por perfil
- Talvez um resumo tipo:
    - `Road profile`
    - `Oval profile`
    - `Streaming profile`
    - `Practice profile`

Funcionalidades:

- Criar perfil
- Duplicar perfil
- Renomear perfil
- Apagar perfil
- Definir perfil padrão
- Escolher quais apps pertencem ao perfil
- Configurar Auto-launch/Auto-stop por perfil
- Trocar rapidamente o perfil ativo

Exemplo prático: você pode ter um perfil “iRacing Road” com SimHub, CrewChief e Trading Paints, e outro “Streaming” que também inclui OBS.

---

## Automation

Tela para regras globais de automação.

Conteúdo:

- Estado da detecção do iRacing
- O que acontece quando iRacing abre
- O que acontece quando iRacing fecha
- Regras de inicialização
- Regras de encerramento
- Delays entre apps
- Comportamento quando um app já está aberto
- Comportamento ao sair do Pitlane

Funcionalidades:

- Ativar/desativar automação global
- Configurar Auto-launch global
- Configurar Auto-stop global
- Definir delay entre launches
- Definir se o Pitlane deve iniciar com Windows
- Definir se deve minimizar para tray
- Definir comportamento ao fechar janela
- Configurar confirmação antes de parar apps
- Configurar detecção do iRacing

Essa tela responde: “quando algo acontecer, o que o Pitlane deve fazer automaticamente?”.

---

## Integrations

Tela para integrações externas ou recursos conectados.

Conteúdo possível:

- iRacing detection
- Windows startup/tray
- Discord Rich Presence, se existir
- OBS integration, se um dia fizer sentido
- SimHub/CrewChief integrations, se houver algo além de abrir/fechar processo
- Notificações do Windows
- Hotkeys globais

Funcionalidades:

- Conectar/desconectar integrações
- Configurar permissões
- Testar integração
- Configurar notificações
- Configurar atalhos globais
- Validar se dependências estão funcionando

Eu teria cuidado para essa aba não virar uma lixeira. Só colocaria aqui coisas que realmente conectam o Pitlane com sistemas externos. Config de app individual continua em **Apps**.

---

## Logs

Tela de diagnóstico e histórico completo.

Conteúdo:

- Log completo de eventos
- Filtros por app
- Filtros por tipo:
    - Info
    - Success
    - Warning
    - Error

- Eventos de iRacing
- Eventos de launch
- Eventos de stop
- Erros de execução
- Caminhos usados
- Exit codes, quando existirem

Funcionalidades:

- Filtrar logs
- Buscar texto
- Copiar evento
- Exportar logs
- Limpar logs
- Abrir pasta de logs
- Ver detalhes técnicos de um erro

O Recent Activity do Command Center é só o resumo útil. A aba Logs é para investigar problema.

---

## Settings

Configurações gerais do Pitlane, não relacionadas a um app específico.

Conteúdo:

- Aparência
- Idioma
- Inicialização com Windows
- Comportamento de tray
- Atualizações
- Backup/import/export de configurações
- Diretórios de dados
- Preferências de notificação
- Configurações avançadas

Funcionalidades:

- Alternar tema, se existir
- Trocar idioma
- Ativar/desativar launch on startup
- Definir minimizar ao fechar
- Ver versão do Pitlane
- Checar atualização
- Exportar/importar configuração
- Resetar configurações
- Abrir pasta de dados

Essa aba é para preferências do produto, enquanto **Automation** é para regras operacionais.

---

Eu organizaria mentalmente assim:

```txt
Command Center = operar agora
Apps           = cadastrar e configurar apps
Profiles       = conjuntos de apps/regras
Automation     = regras automáticas globais
Integrations   = conexões com sistemas externos
Logs           = diagnóstico e histórico
Settings       = preferências gerais do Pitlane
```
