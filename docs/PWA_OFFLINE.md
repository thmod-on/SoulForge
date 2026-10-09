# PWA e uso offline

## Objetivo

O SoulForge deve permanecer utilizável durante sessões sem conexão com a internet. A PWA instala uma cópia do aplicativo no navegador ou na tela inicial do dispositivo e mantém seus arquivos de interface em cache.

## Instalação

### iPadOS e iOS

1. Abra o SoulForge no Safari.
2. Use o botão **Compartilhar**.
3. Escolha **Adicionar à Tela de Início**.
4. Abra o ícone criado como um aplicativo independente.

### Desktop

Em navegadores compatíveis, como Edge e Chrome, use a ação de instalar exibida na barra de endereços ou no menu do navegador.

## Funcionamento offline

O Service Worker registra a casca do aplicativo e os arquivos gerados no build, como HTML, JavaScript, CSS, imagens e JSON dos Packs incluídos na publicação.

Artes incorporadas devem respeitar os orçamentos e estágios definidos em [Política de artes e assets visuais](ASSET_POLICY.md). Ao atingir os gatilhos documentados, imagens de detalhe deixam o precache global e passam a usar carregamento e cache sob demanda; o conteúdo textual permanece offline e independente da arte.

Depois de uma abertura bem-sucedida com internet, a aplicação deve iniciar novamente sem conexão. Os dados dos personagens continuam no IndexedDB do próprio navegador.

Sem conta, uso offline não significa sincronização entre dispositivos. Com
login Google opcional, alterações feitas offline entram em uma fila e são
enviadas quando o app estiver aberto e recuperar a conexão.

## Atualizações

O SoulForge utiliza atualização automática do Service Worker. Quando uma versão é publicada, os arquivos antigos são substituídos pelo cache da nova versão assim que o navegador puder ativá-la.

Se a interface parecer antiga após uma publicação:

1. feche e abra o aplicativo novamente;
2. atualize a página uma vez com internet;
3. como último recurso, exporte as fichas importantes e limpe somente os dados
   do site pelo navegador.

## Limitações atuais

- a sincronização exige login Google e conexão para concluir, embora editar
  fichas continue independente da rede;
- Packs importados não são sincronizados;
- não há colaboração em tempo real nem compartilhamento de fichas;
- o navegador não executa uma fila confiável com o app fechado; o envio é
  retomado na próxima abertura;
- limpar dados do navegador pode remover personagens, Packs importados,
  complementos e Definitions que ainda estejam pendentes ou sem conta.

## Backup e transferência

Com uma ficha ativa, **Configurações** permite exportá-la para um arquivo
`.soulforge-character.json`. A importação pode ser iniciada no seletor de
personagens ou em Configurações, valida o conteúdo antes de persistir e cria
uma nova identidade quando o mesmo ID já existe no dispositivo.

**Criar backup completo** produz um `.soulforge-backup.json` que recupera
fichas, Packs instalados, criações locais e complementos. A restauração baixa
uma cópia de segurança antes de substituir o estado local. **Exportar conteúdo**
produz um `.soulforge-content.json` para compartilhar apenas autoria local e
complementos, sem copiar Packs de terceiros. Esses arquivos continuam sendo a
rota de recuperação independente da conta e são obrigatórios ao migrar entre a
origem antiga do GitHub Pages e o novo Worker.

## Critérios de validação

Antes de uma release, validar pelo menos:

- instalação em Safari no iPadOS, quando disponível;
- reabertura do app sem rede após uma primeira carga online;
- atualização para uma versão publicada;
- preservação dos dados locais após atualização normal.
- fila offline, conflito entre duas revisões e isolamento entre duas contas.
