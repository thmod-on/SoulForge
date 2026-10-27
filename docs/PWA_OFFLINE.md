# PWA e uso offline

## Objetivo

O SoulForge deve permanecer utilizável durante sessões sem conexão com a internet. A PWA instala uma cópia do aplicativo no navegador ou na tela inicial do dispositivo e mantém seus arquivos de interface em cache.

O build atual usa Vite 8 e suporta navegadores no baseline Safari 16.4 ou mais recente. Em iPads, mantenha o sistema atualizado antes de instalar ou validar uma nova versão.

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

Em uma instalação já preparada, a lista de fichas e o catálogo são carregados a
partir de um único snapshot local antes de consultar nuvem ou biblioteca privada.
Essas consultas seguem em segundo plano; offline, elas nunca bloqueiam a abertura.
Em um dispositivo autorizado sem Packs, a preparação aguarda a instalação e a
validação da biblioteca privada antes de liberar a criação.

Se o login ocorrer depois da abertura, a mesma preparação é iniciada assim que
a sessão autorizada fica disponível. O navegador pode sinalizar offline de
forma imprecisa; por isso, a sincronização autenticada confirma conectividade
tentando o Worker e conserva a fila local quando essa tentativa falhar.

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
- com 11 Packs e fichas locais, medir o tempo até a lista de personagens em PWA
  instalada, online e offline; a meta para conteúdo já preparado é 1,5 s.

## Orçamento de desempenho

Após `pnpm run build`, `pnpm run check:performance` mede os assets efetivamente
referenciados pelo Service Worker. A linha de base da entrega PERF-001 é de
**116,5 KiB** de JavaScript gzip, **37,2 KiB** de CSS gzip e **5.629,7 KiB** de
precache. O CI limita JavaScript a 150 KiB gzip, CSS a 50 KiB gzip e o precache
a 10 MiB. Não há telemetria externa: a medição de abertura continua manual nos
dispositivos de referência.

Para uma atualização de toolchain ou Service Worker, complementar a lista com:

- instalar a PWA em um dispositivo sem instalação anterior;
- atualizar uma instalação existente e confirmar que o novo Service Worker é ativado;
- reabrir sem rede e conferir uma ficha, Compendium, backup e restauração;
- confirmar que uma edição offline volta para a fila e sincroniza ao recuperar a conexão.

### Evidência da versão 0.38.2

Em **15 de outubro de 2026**, a matriz foi concluída em PC e iPad com:

- instalação nova da PWA em um ambiente sem dados anteriores;
- atualização da instalação existente e ativação do novo Service Worker;
- preservação das fichas e demais dados locais após a atualização;
- reabertura e consulta de ficha e Compendium sem conexão;
- criação e restauração de backup enquanto o aplicativo estava offline;
- edição offline enviada após a reconexão;
- conflito real provocado entre PC e iPad, preservando as versões até a escolha.

Os testes automatizados do sincronizador e do Worker complementam essa evidência
com fila, retry, tombstones, resolução de conflito e isolamento entre contas. A
matriz encerrou PWA-001 e a validação manual que ainda mantinha DEP-001 aberto.
