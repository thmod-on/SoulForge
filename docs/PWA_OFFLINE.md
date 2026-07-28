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

Depois de uma abertura bem-sucedida com internet, a aplicação deve iniciar novamente sem conexão. Os dados dos personagens continuam no IndexedDB do próprio navegador.

Uso offline não significa sincronização entre dispositivos. Um personagem salvo no iPad não aparece automaticamente no notebook.

## Atualizações

O SoulForge utiliza atualização automática do Service Worker. Quando uma versão é publicada, os arquivos antigos são substituídos pelo cache da nova versão assim que o navegador puder ativá-la.

Se a interface parecer antiga após uma publicação:

1. feche e abra o aplicativo novamente;
2. atualize a página uma vez com internet;
3. como último recurso, limpe somente os dados do site pelo navegador, após fazer backup quando esse fluxo estiver disponível.

## Limitações atuais

- não há servidor próprio;
- não há login ou sincronização em nuvem;
- exportação e importação de personagens ainda não foram implementadas;
- limpar dados do navegador pode remover personagens locais.

## Critérios de validação

Antes de uma release, validar pelo menos:

- instalação em Safari no iPadOS, quando disponível;
- reabertura do app sem rede após uma primeira carga online;
- atualização para uma versão publicada;
- preservação dos dados locais após atualização normal.
